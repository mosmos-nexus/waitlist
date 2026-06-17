import type { Action } from 'svelte/action';

export interface RevealOptions {
  /** Re-trigger the reveal every time the element re-enters the viewport (used by the demo). */
  replay?: boolean;
  /** Fraction of the element that must be visible before revealing. */
  threshold?: number;
  /** IntersectionObserver rootMargin. */
  rootMargin?: string;
  /** Called when the element enters view (or immediately, under reduced motion). */
  onReveal?: () => void;
  /** Called when the element leaves view (only when `replay` is set). */
  onConceal?: () => void;
}

/**
 * Scroll-triggered reveal (§7 — IntersectionObserver, 1 reveal per section).
 *
 * The visual hide/show is owned by CSS (`html.js [data-reveal]`) gated behind
 * `prefers-reduced-motion: no-preference`, so SSR HTML, no-JS, and reduced-motion
 * visitors always see the final frame (DoD §5). This action only adds `is-in` when
 * motion is allowed and the element scrolls into view, and emits `reveal`/`conceal`
 * CustomEvents so sequenced sections (e.g. the demo) can (re)start their choreography.
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options) => {
  const opts = {
    replay: false,
    threshold: 0.2,
    rootMargin: '0px 0px -10% 0px',
    ...(options ?? {}),
  };

  node.setAttribute('data-reveal', '');

  // Reduced motion: skip the observer entirely — element is already at its final
  // frame (CSS hide is disabled), just mark it in and let sequences resolve to rest.
  const prefersReduced =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    node.classList.add('is-in');
    opts.onReveal?.();
    return {};
  }

  let entered = false;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          node.classList.add('is-in');
          opts.onReveal?.();
          entered = true;
          if (!opts.replay) io.unobserve(node);
        } else if (opts.replay && entered) {
          node.classList.remove('is-in');
          opts.onConceal?.();
        }
      }
    },
    { threshold: opts.threshold, rootMargin: opts.rootMargin },
  );

  io.observe(node);
  return {
    destroy() {
      io.disconnect();
    },
  };
};
