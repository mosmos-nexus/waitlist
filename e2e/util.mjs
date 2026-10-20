import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { chromePath } from './resolve-chrome.mjs';

/** Shared harness for smoke / extra / contrast: plain node + playwright-core, no runner. */

export const BASE = process.env.BASE ?? 'http://localhost:5199';

export const LOCALES = [
  { loc: 'ko', path: '/' },
  { loc: 'en', path: '/en' },
  { loc: 'ja', path: '/ja' },
];

/** Copy is read from the same message files the page renders, so a wording edit never breaks a test. */
export const msg = Object.fromEntries(
  LOCALES.map(({ loc }) => [
    loc,
    JSON.parse(readFileSync(new URL(`../messages/${loc}.json`, import.meta.url), 'utf8')),
  ]),
);

/** First line of a message: `confirm_title` and friends carry a hard line break. */
export const firstLine = (s) => s.split('\n')[0].trim();

export const launch = () => chromium.launch({ executablePath: chromePath() });

let passed = 0;
let failed = 0;
export function ok(label, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`);
  if (cond) passed++;
  else {
    failed++;
    process.exitCode = 1;
  }
}

/** Uncaught page errors and console errors, from every page `open` hands out. */
export const errors = [];

/**
 * A page on the preview server with analytics blocked, so `window.vaq` keeps
 * every `track()` call instead of a script draining it. Vercel's insights
 * scripts 404 off a Vercel deploy anyway, and that console line carries no URL,
 * so "Failed to load resource" is filtered rather than matched by name.
 */
export async function open(browser, path = '/', { viewport, referer, ...ctxOpts } = {}) {
  const ctx = await browser.newContext({
    viewport: viewport ?? { width: 1440, height: 900 },
    ...ctxOpts,
  });
  await ctx.route(/\/_vercel\/|va\.vercel-scripts\.com/, (r) => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(`${path}: ${e.message}`));
  p.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text()))
      errors.push(`${path}: ${m.text()}`);
  });
  await p.goto(BASE + path, { waitUntil: 'networkidle', referer });
  // `window.va` is installed by the layout's client-side inject(), i.e. hydration has run.
  await p.waitForFunction(() => typeof window.va === 'function');
  return { ctx, p };
}

/** Every `track()` call so far, as `{ name, data }`. */
export const events = (p) =>
  p.evaluate(() =>
    (window.vaq ?? [])
      .filter((a) => a[0] === 'event')
      .map(([, e]) => ({ name: e.name, data: e.data })),
  );

/**
 * Everything a reader or a screen reader could take in: text nodes plus the
 * attributes that carry words. Scripts and styles are skipped, which is why this
 * is not just `textContent` (the body holds SvelteKit's inline data script).
 */
export const textOf = (p, selector = 'body') =>
  p.evaluate((sel) => {
    const root = document.querySelector(sel);
    const out = [];
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (n.parentElement.closest('script, style, noscript')) continue;
      out.push(n.nodeValue);
    }
    for (const el of root.querySelectorAll('[aria-label], [alt], [title], [placeholder]'))
      for (const a of ['aria-label', 'alt', 'title', 'placeholder'])
        if (el.getAttribute(a)) out.push(el.getAttribute(a));
    return out.join('\n');
  }, selector);

/** One frame boundary after layout, so a resize or a scroll has actually landed. */
export const settle = (p) =>
  p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

export async function finish(browser) {
  await browser.close();
  console.log('\n--- console/page errors ---');
  console.log(errors.length ? errors.join('\n') : 'none');
  if (errors.length) process.exitCode = 1;
  console.log(
    `\n${passed} passed, ${failed} failed${errors.length ? ', page errors present' : ''}`,
  );
}
