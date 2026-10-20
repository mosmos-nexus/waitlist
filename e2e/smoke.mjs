import { BASE, LOCALES, msg, launch, open, ok, textOf, settle, finish } from './util.mjs';

/**
 * Structure and copy rules of the rebuilt landing (spec: deep-interview-waitlist-landing-rebuild).
 * Selectors are section ids, roles and data attributes; expected copy comes from messages/*.json.
 */
const browser = await launch();

const SECTION_ORDER = ['hero', 'empathy', 'moments', 'waitlist', 'faq', 'final'];
/** A section is addressed by its heading id, which does not depend on class names. */
const SEC = (name) => `main > section[aria-labelledby="${name}-title"]`;

const MANA_FIG = /(?:Mana|마나|マナ)[^\S\n]*\d|\d[^\S\n]*(?:Mana|마나|マナ)/i;
const MODEL_NAMES = /GPT|Claude|Gemini|Grok|OpenAI|Anthropic/i;
const PILOT = /파일럿|パイロット|pilot/i;
const MON = /몬|\bMon\b/;

/** All page text plus the head copy a crawler or a share card would show. */
const fullText = async (p) =>
  (await textOf(p)) +
  '\n' +
  (await p.evaluate(() =>
    [
      document.title,
      ...[...document.querySelectorAll('meta[name=description], meta[property^="og:"]')].map(
        (m) => m.content,
      ),
    ].join('\n'),
  ));

/** How many text-bearing elements inside `scope` are actually painted (opacity and visibility counted). */
const painted = (p, scope) =>
  p.evaluate(
    (sel) =>
      [...document.querySelector(sel).querySelectorAll('*')].filter(
        (e) =>
          [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()) &&
          e.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
      ).length,
    scope,
  );

// ---- 0. no stray text leaks into the document ----
{
  const { ctx, p } = await open(browser);
  const leading = await p.evaluate(() => {
    let t = '';
    for (const n of document.querySelector('main').childNodes) {
      if (n.nodeType === 3) t += n.nodeValue;
      else break;
    }
    return t.trim();
  });
  ok('nothing prints before the first section', leading === '', JSON.stringify(leading));
  await ctx.close();
}

// ---- 1. six sections, in the blueprint's order, in every locale ----
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path);
  const order = await p.evaluate(() =>
    [...document.querySelectorAll('main > section')].map((s) =>
      s.getAttribute('aria-labelledby').replace(/-title$/, ''),
    ),
  );
  ok(
    `${loc}: hero, empathy, moments, waitlist, faq, final`,
    order.join() === SECTION_ORDER.join(),
    order.join(),
  );
  const tops = await p.evaluate(
    (sels) => sels.map((s) => document.querySelector(s).getBoundingClientRect().top),
    SECTION_ORDER.map(SEC),
  );
  ok(
    `${loc}: and they stack top to bottom`,
    tops.every((t, i) => !i || t > tops[i - 1]),
    tops.map(Math.round).join(' < '),
  );
  ok(
    `${loc}: the waitlist section is the #waitlist anchor`,
    (await p.locator(`${SEC('waitlist')}#waitlist`).count()) === 1,
  );
  await ctx.close();
}

// ---- 2. one h1 per locale, and it is the promise ----
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path);
  const h1s = await p.locator('h1').allInnerTexts();
  ok(`${loc}: exactly one h1`, h1s.length === 1, `${h1s.length}`);
  ok(`${loc}: it reads hero_title`, h1s[0]?.trim() === msg[loc].hero_title, JSON.stringify(h1s[0]));
  ok(`${loc}: it sits in the hero`, (await p.locator(`${SEC('hero')} h1`).count()) === 1);
  ok(`${loc}: <title> is meta_title`, (await p.title()) === msg[loc].meta_title, await p.title());
  await ctx.close();
}

// ---- 3. three forms with their own ids ----
{
  const { ctx, p } = await open(browser);
  const forms = await p.evaluate(() =>
    [...document.querySelectorAll('form[data-form-position]')].map((f) => {
      const email = f.querySelector('input[type="email"]');
      return {
        pos: f.dataset.formPosition,
        id: email.id,
        labelled: !!document.querySelector(`label[for="${email.id}"]`),
        consent: !!f.querySelector('input[type="checkbox"][name="consent"]'),
        submit: f.querySelector('button[type="submit"]')?.textContent.trim(),
        section: f.closest('section').getAttribute('aria-labelledby'),
      };
    }),
  );
  ok(
    'three forms: hero, join, final',
    forms.map((f) => f.pos).join() === 'hero,join,final',
    forms.map((f) => f.pos).join(),
  );
  ok(
    'in the hero, the waitlist and the closing band',
    forms.map((f) => f.section).join() === 'hero-title,waitlist-title,final-title',
  );
  ok(
    'each email field has its own id',
    new Set(forms.map((f) => f.id)).size === 3,
    forms.map((f) => f.id).join(),
  );
  ok(
    'and its own label',
    forms.every((f) => f.labelled),
  );
  ok(
    'and a consent box',
    forms.every((f) => f.consent),
  );
  const dupes = await p.evaluate(() => {
    const seen = new Set();
    return [...document.querySelectorAll('[id]')]
      .map((e) => e.id)
      .filter((id) => seen.size === seen.add(id).size);
  });
  ok('no id appears twice in the document', dupes.length === 0, dupes.join());
  await ctx.close();
}
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path);
  const labels = (
    await p.locator('form[data-form-position] button[type="submit"]').allInnerTexts()
  ).map((t) => t.trim());
  ok(
    `${loc}: every form's CTA reads hero_cta`,
    labels.length === 3 && labels.every((t) => t === msg[loc].hero_cta),
    labels.join(' | '),
  );
  await ctx.close();
}

// ---- 4. copy rules: no Mana figures, no model names, no pilot wording, in any locale ----
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path);
  const text = await fullText(p);
  ok(`${loc}: no Mana figure`, !MANA_FIG.test(text), text.match(MANA_FIG)?.[0]);
  ok(`${loc}: no model or provider name`, !MODEL_NAMES.test(text), text.match(MODEL_NAMES)?.[0]);
  ok(`${loc}: no pilot wording`, !PILOT.test(text), text.match(PILOT)?.[0]);
  await ctx.close();
}

// ---- 5. Mon never reaches the page; section 3 explains the 작업팀 ----
// Reduced motion hands the visitor the stepper, so every frame of the hero demo
// can be read without waiting out the 16s loop.
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path, { reducedMotion: 'reduce' });
  const step = p.getByRole('button', { name: msg[loc].demo_step });
  const seen = [];
  for (let f = 0; f < 8; f++) {
    seen.push(await textOf(p, SEC('hero')));
    await step.click();
  }
  const leak = seen.findIndex((t) => MON.test(t));
  ok(
    `${loc}: the hero says no Mon in any of its 8 frames`,
    leak < 0,
    leak < 0 ? '' : `frame ${leak}: ${seen[leak].match(MON)[0]}`,
  );
  const empathy = await textOf(p, SEC('empathy'));
  ok(`${loc}: nor does the empathy section`, !MON.test(empathy), empathy.match(MON)?.[0]);
  const moments = await textOf(p, SEC('moments'));
  ok(`${loc}: section 3 carries its sub line`, moments.includes(msg[loc].moments_sub));
  // "Mon" stays internal: outside copy says 작업자 / 작업팀, and section 3 is
  // where the team is explained. 전문 AI read as an AI router, so it is gone too.
  ok(`${loc}: section 3 never says Mon either`, !MON.test(moments), moments.match(MON)?.[0]);
  ok(
    `${loc}: and section 3 names the job team`,
    { ko: /작업팀/, ja: /作業チーム/, en: /team/i }[loc].test(msg[loc].moments_sub),
    `"${msg[loc].moments_sub}"`,
  );
  const page = await fullText(p);
  const ROUTER = { ko: /전문 AI/, ja: /専門AI/, en: /specialist AI/i }[loc];
  ok(`${loc}: and the page never says ${ROUTER.source}`, !ROUTER.test(page), page.match(ROUTER)?.[0]);
  await ctx.close();
}

// ---- 6. nothing scrolls sideways from 320 to 430 ----
// Deliberately no `isMobile`: it rewrites the viewport (320x568 becomes 402x714),
// so a pass would be about a width no phone has.
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path, {
    viewport: { width: 320, height: 568 },
    hasTouch: true,
  });
  for (const [w, h] of [
    [320, 568],
    [360, 640],
    [375, 667],
    [390, 844],
    [430, 932],
  ]) {
    await p.setViewportSize({ width: w, height: h });
    await settle(p);
    const r = await p.evaluate(() => {
      // `body { overflow-x: hidden }` hides a spill from the document check alone, so
      // also look for boxes that poke past the edge with no clipping ancestor of their own.
      const clipped = (el) => {
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement)
          if (getComputedStyle(a).overflowX !== 'visible') return true;
        return false;
      };
      const wide = [...document.querySelectorAll('main *, header *, footer *')]
        .filter((e) => {
          const b = e.getBoundingClientRect();
          return (
            b.width &&
            (b.right > innerWidth + 1 || b.left < -1) &&
            !clipped(e) &&
            !e.closest('.visually-hidden')
          );
        })
        .slice(0, 3)
        .map(
          (e) =>
            `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${Math.round(e.getBoundingClientRect().right)}`,
        );
      return { page: document.documentElement.scrollWidth - innerWidth, wide };
    });
    ok(
      `${loc} ${w}px: the page does not scroll sideways`,
      r.page <= 0,
      `${r.page}px wider than the viewport`,
    );
    ok(`${loc} ${w}px: no box pokes past the edge`, r.wide.length === 0, r.wide.join(' | '));
  }
  await ctx.close();
}

// ---- 7. the first screen at 375x667 holds the email field, and nothing covers the hero ----
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path, {
    viewport: { width: 375, height: 667 },
    hasTouch: true,
  });
  const r = await p.evaluate(() => {
    const field = document
      .querySelector('form[data-form-position="hero"] input[type="email"]')
      .getBoundingClientRect();
    const header = document.querySelector('header').getBoundingClientRect();
    const h1 = document.querySelector('h1');
    const at = (b) => document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
    return {
      top: field.top,
      bottom: field.bottom,
      headerBottom: header.bottom,
      fieldReachable: at(field)?.matches('input[type="email"]'),
      h1Reachable: h1.contains(at(h1.getBoundingClientRect())),
    };
  });
  ok(
    `${loc}: the email field is inside the first screen`,
    r.top >= r.headerBottom - 1 && r.bottom <= 667,
    `${Math.round(r.top)}-${Math.round(r.bottom)} of 667`,
  );
  ok(`${loc}: and nothing sits on top of it`, r.fieldReachable);
  ok(`${loc}: or on top of the h1`, r.h1Reachable);
  await ctx.close();
}

// ---- 8. at 390x844 the board is more than a sliver ----
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path, {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const shown = await p.evaluate(() => {
    const b = document.querySelector('[data-frame]').getBoundingClientRect();
    return Math.min(b.bottom, innerHeight) - Math.max(b.top, 0);
  });
  ok(`${loc}: at least 120px of the board shows`, shown >= 120, `${Math.round(shown)}px`);
  await ctx.close();
}

// ---- 9. 44px tap targets ----
// Same floor as the old suite: 43.5 for a control whose computed height is exactly 44.
for (const [loc, path, vp] of [
  ...LOCALES.map((l) => [l.loc, l.path, { width: 390, height: 844 }]),
  ['ko', '/', { width: 1440, height: 900 }],
]) {
  const { ctx, p } = await open(browser, path, { viewport: vp, hasTouch: vp.width < 600 });
  const small = await p.evaluate(() => {
    const out = [];
    const sel = 'a[href], button, select, summary, input:not([type="hidden"]), [role="button"]';
    for (let e of document.querySelectorAll(sel)) {
      if (e.matches('a[href="#main"]')) continue; // skip link, parked off screen until focused
      // The visible target of a checkbox is the whole row it sits in.
      if (e.matches('input[type="checkbox"]')) e = e.closest('label') ?? e;
      if (!e.getClientRects().length || !e.checkVisibility({ visibilityProperty: true })) continue;
      const cs = getComputedStyle(e);
      // WCAG exempts a link set inside a sentence.
      if (e.tagName === 'A' && cs.display === 'inline') continue;
      const b = e.getBoundingClientRect();
      const label = (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 16);
      const needsWidth = e.tagName !== 'A' || !(e.textContent || '').trim();
      if (b.height < 43.5 || (needsWidth && b.width < 43.5))
        out.push(
          `${e.tagName.toLowerCase()} "${label}" ${Math.round(b.width)}x${Math.round(b.height)}`,
        );
    }
    return out;
  });
  ok(
    `${loc} ${vp.width}px: every control is at least 44px tall`,
    small.length === 0,
    small.join(' | '),
  );
  await ctx.close();
}

// ---- 10. reduced motion: the still frame, and everything on the page already visible ----
const hiddenContent = (p) =>
  p.evaluate(() => {
    const bad = [];
    for (const s of document.querySelectorAll('main > section')) {
      const walk = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (!n.nodeValue.trim()) continue;
        const el = n.parentElement;
        // The board's layers swap on purpose and are checked on their own; a closed
        // <details> hides its answer by design.
        if (el.closest('[data-frame], .visually-hidden')) continue;
        if (el.closest('details:not([open])') && !el.closest('summary')) continue;
        if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
          bad.push(`${s.getAttribute('aria-labelledby')}: "${n.nodeValue.trim().slice(0, 24)}"`);
      }
    }
    return bad;
  });

for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path, { reducedMotion: 'reduce' });
  // A negative: the loop would have left F0 at 600ms, so give it time to prove it does not.
  await p.waitForTimeout(2500);
  ok(
    `${loc} reduced motion: the board rests on F0`,
    (await p.locator('[data-frame]').getAttribute('data-frame')) === '0',
  );
  // What F0 says is the demo's own business; that it is painted, not blank, is the page's.
  ok(`${loc} reduced motion: the still frame is painted`, (await painted(p, '[data-frame]')) > 4);
  ok(
    `${loc} reduced motion: the stepper replaces pause`,
    (await p.getByRole('button', { name: msg[loc].demo_step }).isVisible()) &&
      !(await p.getByRole('button', { name: msg[loc].demo_pause }).isVisible()),
  );
  const bad = await hiddenContent(p);
  ok(
    `${loc} reduced motion: every section's content is visible`,
    bad.length === 0,
    bad.slice(0, 3).join(' | '),
  );
  await ctx.close();
}
{
  // Scroll-triggered reveals must not hide anything from a visitor who has not scrolled yet.
  const { ctx, p } = await open(browser);
  const bad = await hiddenContent(p);
  ok(
    "at rest, before any scroll, every section's content is visible",
    bad.length === 0,
    bad.slice(0, 3).join(' | '),
  );
  await ctx.close();
}

// ---- 11. the light theme ----
{
  // A dark OS preference must not turn the page dark: dark mode is out of scope.
  const { ctx, p } = await open(browser, '/', { colorScheme: 'dark' });
  const t = await p.evaluate(() => {
    const rgb = (s) => s.match(/[\d.]+/g).map(Number);
    const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return {
      dataTheme: document.documentElement.dataset.theme,
      darkClass: document.documentElement.classList.contains('dark'),
      scheme: document.querySelector('meta[name="color-scheme"]')?.content,
      themeColor: document.querySelector('meta[name="theme-color"]')?.content,
      body: rgb(getComputedStyle(document.body).backgroundColor),
      html: rgb(getComputedStyle(document.documentElement).backgroundColor),
      ink: lum(rgb(getComputedStyle(document.querySelector('h1')).color)),
    };
  });
  const clearWhite = ([r, g, b]) =>
    Math.min(r, g, b) >= 240 && Math.max(r, g, b) - Math.min(r, g, b) <= 8;
  ok('html carries no dark theme', t.dataTheme !== 'dark' && !t.darkClass, `${t.dataTheme}`);
  ok('the page declares a light colour scheme', t.scheme === 'light', t.scheme);
  ok('the body is on the Clear White ground', clearWhite(t.body), `rgb(${t.body})`);
  ok('and so is the canvas behind it', clearWhite(t.html), `rgb(${t.html})`);
  ok(
    'the browser chrome is tinted to match',
    /^#f[0-9a-f]f[0-9a-f]f[0-9a-f]$/i.test(t.themeColor),
    t.themeColor,
  );
  ok('the h1 is dark ink on it', t.ink < 0.25, t.ink.toFixed(2));
  await ctx.close();
}
{
  const { ctx, p } = await open(browser);
  ok(
    'Korean breaks between words, not inside them',
    (await p.evaluate(() => getComputedStyle(document.body).wordBreak)) === 'keep-all',
  );
  await ctx.close();
}

// ---- 12. header anchor, footer, language metadata ----
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path);
  await p
    .getByRole('banner')
    .getByRole('link', { name: msg[loc].nav_waitlist, exact: true })
    .click();
  // Smooth scrolling: wait until two consecutive polls read the same offset.
  await p.waitForFunction(
    () => {
      const prev = window.__y;
      window.__y = scrollY;
      return scrollY > 0 && prev === scrollY;
    },
    null,
    { polling: 120 },
  );
  const at = await p.evaluate(() => ({
    hash: location.hash,
    top: document.getElementById('waitlist').getBoundingClientRect().top,
    header: document.querySelector('header').getBoundingClientRect().bottom,
  }));
  ok(`${loc}: the header link goes to #waitlist`, at.hash === '#waitlist', at.hash);
  ok(
    `${loc}: and the section lands clear of the sticky header`,
    at.top >= at.header - 1 && at.top < 400,
    `top ${Math.round(at.top)}`,
  );

  const foot = await p.evaluate(() =>
    [...document.querySelectorAll('footer a')].map((a) => ({
      path: new URL(a.href).pathname.replace(/\/$/, ''),
      href: a.getAttribute('href'),
      target: a.target,
      rel: a.rel,
    })),
  );
  const prefix = loc === 'ko' ? '' : `/${loc}`;
  ok(
    `${loc}: the footer links to the privacy page`,
    foot.some((a) => a.path === `${prefix}/privacy`),
    foot.map((a) => a.path).join(),
  );
  const careers = foot.find((a) => a.path === `${prefix}/careers`);
  ok(
    `${loc}: and to careers, in a new tab without the opener`,
    careers?.target === '_blank' && /noopener/.test(careers.rel),
    careers?.href,
  );
  // The team page lives in Notion; /careers only redirects there.
  const res = await ctx.request.get(`${BASE}${prefix}/careers`, { maxRedirects: 0 });
  ok(
    `${loc}: and /careers redirects to the Notion team page`,
    res.status() === 308 && /^https:\/\/mosmos-world\.notion\.site\//.test(res.headers().location),
    `${res.status()} ${res.headers().location}`,
  );
  await ctx.close();
}
{
  const { ctx, p } = await open(browser, '/en');
  await p.locator('footer').getByRole('link', { name: msg.en.footer_privacy }).click();
  await p.waitForURL(/\/en\/privacy\/?$/);
  ok(
    'the privacy link opens the English policy',
    (await p.locator('main h1').count()) >= 1,
    p.url(),
  );
  await ctx.close();
}
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path);
  const norm = (u) => new URL(u).pathname.replace(/\/$/, '') || '/';
  const m = await p.evaluate(() => ({
    lang: document.documentElement.lang,
    canonical: document.querySelector('link[rel="canonical"]').href,
    alts: Object.fromEntries(
      [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [
        l.hreflang,
        l.href,
      ]),
    ),
    toggle: [...document.querySelectorAll('header a[hreflang]')].map((a) => [
      a.getAttribute('hreflang'),
      a.getAttribute('lang'),
      a.getAttribute('aria-current'),
      a.href,
    ]),
  }));
  ok(`${loc}: <html lang> is ${loc}`, m.lang === loc, m.lang);
  ok(
    `${loc}: canonical is this locale's URL`,
    norm(m.canonical) === (loc === 'ko' ? '/' : `/${loc}`),
    m.canonical,
  );
  ok(
    `${loc}: hreflang alternates cover ko, en, ja and x-default`,
    ['ko', 'en', 'ja', 'x-default'].every((k) => m.alts[k]) &&
      norm(m.alts.ko) === '/' &&
      norm(m.alts.en) === '/en' &&
      norm(m.alts.ja) === '/ja' &&
      norm(m.alts['x-default']) === '/',
    JSON.stringify(Object.fromEntries(Object.entries(m.alts).map(([k, v]) => [k, norm(v)]))),
  );
  ok(
    `${loc}: the language toggle links each locale with lang and hreflang, marking the current one`,
    m.toggle.length === 3 &&
      m.toggle.every(([h, l, , href]) => h === l && norm(href) === (h === 'ko' ? '/' : `/${h}`)) &&
      m.toggle
        .filter(([, , cur]) => cur === 'true')
        .map(([h]) => h)
        .join() === loc,
    JSON.stringify(m.toggle.map((t) => t.slice(0, 3))),
  );
  await ctx.close();
}

// ---- 13. the FAQ is native <details>, one per faq_N_q message, closed, at reading width ----
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path, { viewport: { width: 1440, height: 900 } });
  const faq = await p.evaluate(() => {
    const items = [
      ...document.querySelectorAll(`main > section[aria-labelledby="faq-title"] details`),
    ];
    return {
      n: items.length,
      open: items.filter((d) => d.open).length,
      width: Math.max(...items.map((d) => d.getBoundingClientRect().width)),
      q: items.map((d) => d.querySelector('summary').textContent.trim()),
      a: items.map((d) => d.querySelector('p')?.textContent.trim()),
    };
  });
  const asked = Object.keys(msg[loc]).filter((k) => /^faq_\d+_q$/.test(k)).length;
  ok(
    `${loc}: one <details> per faq question (at least six), all closed`,
    faq.n === asked && faq.n >= 6 && faq.open === 0,
    `${faq.n} items for ${asked} questions, ${faq.open} open`,
  );
  ok(`${loc}: no wider than 720px`, faq.width <= 720, `${faq.width}px`);
  ok(
    `${loc}: questions and answers are the translated copy`,
    faq.q.every(
      (q, i) => q === msg[loc][`faq_${i + 1}_q`] && faq.a[i] === msg[loc][`faq_${i + 1}_a`],
    ),
  );
  await ctx.close();
}

// ---- 14. only Mos is drawn, nothing from the old world is left ----
{
  const { ctx, p } = await open(browser);
  // Lazy images only load near the viewport, so walk the page first.
  await p.evaluate(async () => {
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 600) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await p
    .waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0))
    .catch(() => {}); // the assertion below names what did not load
  const art = await p.evaluate(() => ({
    srcs: [...document.images].map((i) => i.getAttribute('src')),
    broken: [...document.images]
      .filter((i) => !(i.complete && i.naturalWidth > 0))
      .map((i) => i.getAttribute('src')),
    leftovers: document.querySelectorAll('canvas, .world, [data-anim]').length,
  }));
  const allowed =
    /^\/characters\/mos-(greeting|happy|curious|working|resting|sleeping)\.webp$|^\/brand\//;
  ok('every image loads', art.broken.length === 0, art.broken.join());
  ok(
    'and every one is a Mos pose or a brand mark',
    art.srcs.every((s) => allowed.test(s)),
    art.srcs.filter((s) => !allowed.test(s)).join(),
  );
  ok('the sky-island world is gone', art.leftovers === 0, `${art.leftovers} elements`);
  await ctx.close();
}

await finish(browser);
