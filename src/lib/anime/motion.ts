import type { Action } from 'svelte/action';
import { animate, onScroll, utils } from 'animejs';
import { prefersReduced, hasFinePointer } from './world';

export { animate, utils, onScroll, prefersReduced, hasFinePointer };

export interface RevealOptions {
  /** Extra delay before this element animates in (ms). */
  delay?: number;
  /** Travel distance on the Y axis (px). */
  y?: number;
  duration?: number;
  /** Scale up slightly as it arrives — used for panels and cards. */
  scale?: boolean;
}

/**
 * Entrance, once, when the element first crosses into view.
 *
 * `.reveal` in app.css supplies the hidden start state, and both the `no-js`
 * and `reduced-motion` root classes neutralise it — so SSR HTML, no-JS and
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
      // `bottom-=10`, not `bottom-=60`. The 60px inset was meant to hold the
      // animation until the element was properly in view, but it also means
      // anything sitting within 60px of the fold never enters — on a 568px
      // screen that hid the gloss line, which the language rules require to be
      // present, until the visitor happened to scroll.
      autoplay: onScroll({ enter: 'bottom-=10 top', sync: 'play', repeat: false }),
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

export interface ScrubOptions {
  /** Y travel across the element's whole scroll pass, in px. */
  y?: number;
  /** Rotation across the pass, in degrees. */
  rotate?: number;
  scale?: [number, number];
  /**
   * How hard the playhead chases the scroll position, 0…1.
   *
   * This is the number that decides whether the page reads as stepping or as
   * playing. At 1 the transform is bolted to the wheel and every scroll tick
   * shows as a discrete jump; below about 0.3 anime.js eases the playhead
   * toward the scroll position each frame, so the motion keeps moving between
   * ticks and lands softly. 0.18 is the default for that reason.
   */
  sync?: number;
  enter?: string;
  leave?: string;
}

/**
 * Tie an element's transform to how far the page has scrolled past it.
 *
 * Deliberately not a pin: nothing is held still while the wheel turns, which
 * was the thing that read as frame-stepping. The document keeps moving at its
 * own speed and this only adds a second, slower speed on top.
 */
export const scrub: Action<HTMLElement, ScrubOptions | undefined> = (node, options) => {
  if (prefersReduced()) return {};

  const build = (opts: ScrubOptions | undefined) => {
    const {
      y = 0,
      rotate = 0,
      scale,
      sync = 0.18,
      enter = 'bottom top',
      leave = 'top bottom',
    } = opts ?? {};
    return animate(node, {
      ...(y ? { translateY: [y, -y] } : {}),
      ...(rotate ? { rotate: [-rotate, rotate] } : {}),
      ...(scale ? { scale } : {}),
      ease: 'linear',
      autoplay: onScroll({ enter, leave, sync }),
    });
  };

  let instance = build(options);
  return {
    update(next) {
      instance.revert();
      instance = build(next);
    },
    destroy() {
      instance.revert();
    },
  };
};

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
