/**
 * Scroll as the clock.
 *
 * The page used to be a stack of self-contained sections, each with its own
 * trigger, its own panel and its own hand-placed coordinates. That is where the
 * misalignments came from — a wire drawn between two boxes, a caption pinned to
 * a corner, a character parked at a percentage that only held at one width — and
 * why the sections did not look like each other.
 *
 * One pinned stage instead, with a single progress value scrubbing everything on
 * it. No triggers, no per-section timelines: every position is a function of
 * `p`, so scrolling backwards is just running the function with a smaller
 * number, and nothing can drift out of step with anything else.
 */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Local 0…1 inside a sub-range of the journey. */
export const seg = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smooth both ends — the default shape for anything scroll-driven. */
export const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * A window that rises, holds, then falls: 0 outside `[from, to]`, 1 across the
 * middle. What act copy fades on.
 */
export function hold(p: number, from: number, to: number, fade = 0.055) {
  if (p <= from || p >= to) return 0;
  const up = clamp01((p - from) / fade);
  const down = clamp01((to - p) / fade);
  return ease(Math.min(up, down));
}

/**
 * Report a track's scroll progress, damped.
 *
 * `p` is 0 when the track's top reaches the top of the viewport and 1 when its
 * bottom reaches the bottom, which is exactly the span over which a `sticky`
 * child stays pinned.
 *
 * The reported value chases the real scroll position rather than matching it.
 * That is the difference between a scene that plays and one that steps: a mouse
 * wheel delivers scroll in discrete jumps of a hundred pixels or more, so
 * driving the scene from the raw value makes it jump the same way, however
 * smooth the easing inside each frame is. Chasing turns one wheel notch into a
 * short piece of playback, and it stays interruptible — a new notch mid-chase
 * just moves the target.
 *
 * `smooth` is the fraction of the remaining distance covered per 60fps frame,
 * corrected for the real frame time so a 120Hz display does not run twice as
 * fast. Pass 0 for no damping.
 */
export function trackProgress(
  track: HTMLElement,
  onProgress: (p: number) => void,
  { smooth = 0.1 }: { smooth?: number } = {},
): () => void {
  let target = 0;
  let current = 0;
  let raf = 0;
  let running = false;
  let last = 0;

  const read = () => {
    const rect = track.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    target = span <= 0 ? 0 : clamp01(-rect.top / span);
  };

  const tick = (now: number) => {
    const dt = last ? Math.min(64, now - last) : 16.7;
    last = now;
    const gap = target - current;
    // Close enough that another frame would not move a pixel: land exactly and
    // stop, so an idle page costs nothing.
    if (Math.abs(gap) < 0.00008) {
      current = target;
      onProgress(current);
      running = false;
      return;
    }
    current += gap * (1 - Math.pow(1 - smooth, dt / 16.667));
    onProgress(current);
    raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    read();
    if (smooth <= 0) {
      current = target;
      onProgress(current);
      return;
    }
    if (running) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(tick);
  };

  read();
  current = target;
  onProgress(current);
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake);
  return () => {
    cancelAnimationFrame(raf);
    running = false;
    window.removeEventListener('scroll', wake);
    window.removeEventListener('resize', wake);
  };
}
