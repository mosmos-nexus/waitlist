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
 * Report a track's scroll progress, rAF-throttled.
 *
 * `p` is 0 when the track's top reaches the top of the viewport and 1 when its
 * bottom reaches the bottom, which is exactly the span over which a `sticky`
 * child stays pinned.
 */
export function trackProgress(track: HTMLElement, onProgress: (p: number) => void): () => void {
  let queued = false;

  const read = () => {
    const rect = track.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    onProgress(span <= 0 ? 0 : clamp01(-rect.top / span));
  };

  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      read();
    });
  };

  read();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  return () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
  };
}
