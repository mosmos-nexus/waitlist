import type { Action } from 'svelte/action';
import { animate, onScroll, utils } from 'animejs';

/** Single source of truth for "should this page move at all". */
export function prefersReduced(): boolean {
  return (
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Coarse pointers get no cursor takeover and no pointer parallax. */
export function hasFinePointer(): boolean {
  return (
    typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

/**
 * Phone-sized viewport.
 *
 * The island keeps every layer it has on a desktop, but a phone is running the
 * same scene on a fraction of the pixels and a fraction of the power budget —
 * so the decorative layers thin out and the per-frame work drops. Read once at
 * mount, not reactively: re-deriving the whole scene on an orientation change
 * would cost more than the layers it saves.
 */
export function isCompactViewport(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(max-width: 560px)').matches;
}

export interface RevealOptions {
  /** Extra delay before this element animates in (ms). */
  delay?: number;
  /** Travel distance on the Y axis (px). */
  y?: number;
  duration?: number;
  /** Scale up slightly as it arrives — used for cards and the island. */
  scale?: boolean;
}

/**
 * Scroll reveal, on animejs's ScrollObserver rather than a bare
 * IntersectionObserver, so the whole page shares one motion clock.
 *
 * `.reveal` in app.css supplies the hidden start state, and both the `no-js`
 * and `reduced-motion` root classes neutralise it — so SSR HTML, no-JS, and
 * reduced-motion visitors always see the final frame.
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options) => {
  let current = options;

  if (prefersReduced()) {
    node.classList.remove('reveal');
    return {};
  }

  const build = (opts: RevealOptions | undefined) => {
    const { delay = 0, y = 22, duration = 760, scale = false } = opts ?? {};
    return animate(node, {
      opacity: [0, 1],
      translateY: [y, 0],
      ...(scale ? { scale: [0.97, 1] } : {}),
      duration,
      delay,
      ease: 'out(3)',
      autoplay: onScroll({
        enter: 'bottom-=60 top',
        sync: 'play',
        repeat: false,
      }),
    });
  };

  let instance = build(current);

  return {
    update(next) {
      current = next;
      instance.revert();
      instance = build(current);
    },
    destroy() {
      instance.revert();
    },
  };
};

/**
 * Pointer parallax over a container. Children carrying `data-depth` drift
 * against the cursor by that multiplier — the depth cue that sells the island
 * as something floating in front of a sky rather than a flat picture of one.
 */
export function attachPointerParallax(
  container: HTMLElement,
  opts: { x?: number; y?: number; duration?: number } = {},
): () => void {
  if (prefersReduced() || !hasFinePointer()) return () => {};

  const { x: ax = 34, y: ay = 20, duration = 1100 } = opts;
  const layers = Array.from(container.querySelectorAll<HTMLElement>('[data-depth]'));
  if (!layers.length) return () => {};

  const onMove = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    for (const layer of layers) {
      const depth = parseFloat(layer.dataset.depth ?? '0') || 0;
      animate(layer, {
        x: -nx * ax * depth,
        y: -ny * ay * depth,
        duration,
        ease: 'out(3)',
      });
    }
  };

  const onLeave = () => {
    for (const layer of layers) {
      animate(layer, { x: 0, y: 0, duration: 1400, ease: 'out(3)' });
    }
  };

  container.addEventListener('pointermove', onMove);
  container.addEventListener('pointerleave', onLeave);
  return () => {
    container.removeEventListener('pointermove', onMove);
    container.removeEventListener('pointerleave', onLeave);
  };
}

/**
 * Count a number up, reporting each step to `onValue`.
 *
 * The caller owns the rendering — this never touches the DOM, so Svelte stays
 * the only thing writing to it.
 */
export function countUp(to: number, onValue: (value: number) => void, duration = 1400): void {
  if (prefersReduced()) {
    onValue(to);
    return;
  }
  const box = { value: 0 };
  animate(box, {
    value: to,
    duration,
    ease: 'out(3)',
    onUpdate: () => onValue(Math.round(box.value)),
  });
}

type Playable = { play: () => void; pause: () => void };

function setPlaying(instances: Playable[], playing: boolean) {
  for (const i of instances) {
    try {
      if (playing) i.play();
      else i.pause();
    } catch {
      /* an instance may already be reverted */
    }
  }
}

/** Pause/resume a set of instances when the tab is hidden. */
export function bindVisibility(instances: Playable[]): () => void {
  const onChange = () => setPlaying(instances, !document.hidden);
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

/**
 * Pause a set of instances while `el` is outside the viewport.
 *
 * The characters each run a per-frame path rewrite, so several of them idling
 * on sections nobody is looking at is pure waste — and on a phone it's the
 * difference between a smooth scroll and a hot battery.
 */
export function bindViewport(el: Element, instances: Playable[]): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) setPlaying(instances, entry.isIntersecting);
    },
    // A margin keeps the character already moving by the time it's on screen.
    { rootMargin: '200px 0px' },
  );
  io.observe(el);
  return () => io.disconnect();
}

export { animate, utils, onScroll };
