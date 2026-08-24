import type { Action } from 'svelte/action';
import { animate, createAnimatable, onScroll, utils } from 'animejs';

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
 * Depth drift over a container.
 *
 * Children carrying `data-depth` move against both the cursor and the page
 * scroll by that multiplier — the cue that sells the island as something
 * floating in front of a sky rather than a flat picture of one.
 *
 * Both inputs feed one writer per layer on purpose. animejs composes with
 * `replace`, so a second animation on the same target and property would
 * override the first, and `x`/`y` normalise to the same `transform`. The
 * pointer and the scroll are therefore summed here and applied once.
 */
export function attachDepthDrift(
  container: HTMLElement,
  opts: { x?: number; y?: number; scroll?: number; duration?: number } = {},
): () => void {
  if (prefersReduced()) return () => {};

  const { x: ax = 34, y: ay = 20, scroll: as = 0, duration = 520 } = opts;
  // Scroll drift is worth having on a phone, where there is no cursor at all.
  const fine = hasFinePointer();
  if (!fine && !as) return () => {};

  const layers = Array.from(container.querySelectorAll<HTMLElement>('[data-depth]'));
  if (!layers.length) return () => {};

  // One animatable per layer, created once. Calling `animate()` per layer per
  // event would allocate an Animation for every layer on every pointer move —
  // seven per event, hundreds per second on a high-polling mouse.
  const drivers = layers.map((layer) => ({
    set: createAnimatable(layer, { x: duration, y: duration, ease: 'out(3)' }),
    depth: parseFloat(layer.dataset.depth ?? '0') || 0,
  }));

  // Cached so the hot path never forces a layout; refreshed only when the box
  // can actually have moved.
  let rect = container.getBoundingClientRect();
  let px = 0;
  let py = 0;
  let sn = 0;

  const apply = () => {
    for (const { set, depth } of drivers) {
      set.x(-px * ax * depth).y(-py * ay * depth - sn * as * depth);
    }
  };

  /** How far the container's centre sits from the viewport's, as ±1. */
  const measure = () => {
    rect = container.getBoundingClientRect();
    if (!as) return;
    const mid = rect.top + rect.height / 2;
    const half = window.innerHeight / 2;
    sn = Math.max(-1, Math.min(1, (half - mid) / (half + rect.height / 2)));
  };

  let queued = false;
  const onScrollFrame = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      measure();
      apply();
    });
  };

  const onMove = (event: PointerEvent) => {
    px = (event.clientX - rect.left) / rect.width - 0.5;
    py = (event.clientY - rect.top) / rect.height - 0.5;
    apply();
  };

  const onLeave = () => {
    px = 0;
    py = 0;
    apply();
  };

  measure();
  apply();
  if (fine) {
    container.addEventListener('pointermove', onMove, { passive: true });
    container.addEventListener('pointerleave', onLeave);
  }
  window.addEventListener('resize', onScrollFrame);
  window.addEventListener('scroll', onScrollFrame, { passive: true });
  return () => {
    container.removeEventListener('pointermove', onMove);
    container.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', onScrollFrame);
    window.removeEventListener('scroll', onScrollFrame);
    for (const { set } of drivers) set.revert();
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

/**
 * Run a set of animejs instances only while the element is on screen AND the
 * tab is visible.
 *
 * Both conditions have to be arbitrated together. Two independent controllers
 * calling play/pause on one list fight: an IntersectionObserver only fires on
 * threshold crossings, so a `visibilitychange` resume would restart characters
 * that are scrolled far out of view and nothing would pause them again until
 * they were scrolled back in and out.
 *
 * The characters each run a per-frame path rewrite, so idling ones are pure
 * waste — and on a phone it's the difference between a smooth scroll and a hot
 * battery.
 */
export function bindActivity(el: Element, instances: Playable[]): () => void {
  let onScreen = true;
  let tabVisible = !document.hidden;
  const sync = () => setPlaying(instances, onScreen && tabVisible);

  const onVisibility = () => {
    tabVisible = !document.hidden;
    sync();
  };
  document.addEventListener('visibilitychange', onVisibility);

  let io: IntersectionObserver | undefined;
  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) onScreen = entry.isIntersecting;
        sync();
      },
      // A margin keeps the character already moving by the time it's on screen.
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
  }

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    io?.disconnect();
  };
}

export { animate, utils, onScroll };
