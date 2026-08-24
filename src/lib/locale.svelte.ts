import { m as raw } from '$lib/paraglide/messages.js';
import {
  getLocale as rawGetLocale,
  setLocale as rawSetLocale,
  localizeHref as rawLocalizeHref,
} from '$lib/paraglide/runtime';
import type { AppLocale } from '$lib/i18n';

/**
 * Reactive wrappers around paraglide.
 *
 * `m.foo()` reads paraglide's module state and touches no signal, so nothing
 * downstream re-runs when the locale changes — a `$derived` holding a message
 * computes once and keeps that string for the life of the component. That is
 * why switching used to need `data-sveltekit-reload`, and why keying the layout
 * on the locale is no better: remounting tears down and rebuilds the entire
 * animated world (island, cursor, every blob) just to change some text.
 *
 * Instead every accessor here reads one counter, which turns each call site
 * into a signal reader. Bumping the counter re-renders the text in place and
 * leaves the running scene alone.
 */
let version = $state(0);

/** Registers the dependency. A call expression, so lint keeps it. */
const track = () => version;

/** Same shape and types as paraglide's `m`, but reactive. */
export const m: typeof raw = new Proxy(raw, {
  get(target, key) {
    const value = target[key as keyof typeof raw];
    if (typeof value !== 'function') return value;
    return (...args: unknown[]) => {
      track();
      return (value as (...a: unknown[]) => unknown)(...args);
    };
  },
});

export const getLocale = (): AppLocale => {
  track();
  return rawGetLocale() as AppLocale;
};

export const localizeHref: typeof rawLocalizeHref = (path, options) => {
  track();
  return rawLocalizeHref(path, options);
};

/**
 * Remember the choice without navigating.
 *
 * `reload: false` keeps paraglide from routing itself — with the `url` strategy
 * it would otherwise reload the document, which is the delay we are removing.
 * The cookie it writes is what makes the choice stick across visits.
 */
export function rememberLocale(locale: AppLocale) {
  rawSetLocale(locale, { reload: false });
}

/**
 * Invalidate every message read, *after* the URL has changed.
 *
 * Order matters: `getLocale()` resolves from `window.location.href` on every
 * call and caches nothing, so bumping before the navigation lands would
 * recompute everything against the old URL and then never run again. Driving
 * this from `afterNavigate` also covers the back button, which a locale switch
 * puts in history like any other navigation.
 */
export function syncLocale() {
  version += 1;
  // `<html lang>` is stamped by `transformPageChunk` during SSR only.
  if (typeof document !== 'undefined') document.documentElement.lang = rawGetLocale();
}
