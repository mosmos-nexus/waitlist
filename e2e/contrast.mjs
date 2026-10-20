import { LOCALES, launch, open, ok, finish } from './util.mjs';

/**
 * WCAG 2.1 AA contrast audit, by pixel sampling.
 *
 * The page is light but not flat: the hero and the closing band sit on a sky
 * gradient with a glow, and cards and chips tint what is under them. A
 * paragraph's background is therefore whatever those layers composite to at that
 * spot, not any one `background-color` up the ancestor chain.
 *
 * So the background is measured, not derived: hide the glyphs, screenshot what is
 * left, and read the pixels the text would have sat on. The text colour is then
 * composited over that sample with its own alpha, and with the opacity of every
 * ancestor, before the ratio is taken. That is the part that catches `rgba()`
 * label tokens and anything dimmed by a faded wrapper.
 *
 * Motion is frozen via `reducedMotion` so the rects and the screenshot describe the
 * same frame.
 *
 * Usage: node e2e/contrast.mjs [--fail-only]
 */
const ONLY = process.argv.includes('--fail-only');
const browser = await launch();

const srgb = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** `over` is opaque by construction: it is a screenshot pixel. */
const composite = ([r, g, b, a], over) => [
  r * a + over[0] * (1 - a),
  g * a + over[1] * (1 - a),
  b * a + over[2] * (1 - a),
];

/** One entry per rendered line box of text in `scope`, with the colour it is really painted in. */
const collect = (p, scope) =>
  p.evaluate((scopeSel) => {
    const parse = (s) => {
      const n = s.match(/-?[\d.]+/g)?.map(Number) ?? [];
      return n.length >= 3 ? [n[0], n[1], n[2], n.length > 3 ? n[3] : 1] : null;
    };
    const effectiveOpacity = (el) => {
      let o = 1;
      for (let e = el; e; e = e.parentElement) o *= +getComputedStyle(e).opacity;
      return o;
    };
    const out = [];
    const walk = document.createTreeWalker(document.querySelector(scopeSel), NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      const el = n.parentElement;
      if (!el || el.closest('script, style, noscript, .visually-hidden')) continue;
      // Not aria-hidden: words hidden from assistive tech are still read by sighted readers.
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const eff = effectiveOpacity(el);
      const cs = getComputedStyle(el);
      const colour = parse(cs.color);
      if (!colour || eff < 0.05) continue;
      colour[3] *= eff;
      const size = parseFloat(cs.fontSize);
      const weight = +cs.fontWeight || 400;
      // Text that a clipping ancestor cuts off, or that sits in a masked fade, is leaving
      // the screen rather than being read. The sampler would read whatever is behind it,
      // so it is not audited.
      const clips = [];
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        const acs = getComputedStyle(a);
        const box = a.getBoundingClientRect();
        if (acs.overflowX !== 'visible' || acs.overflowY !== 'visible')
          clips.push({ box, fade: 0 });
        if (acs.maskImage !== 'none') clips.push({ box, fade: 64 });
      }
      const shown = (r) =>
        clips.every(({ box, fade }) => {
          const w = Math.min(r.right, box.right) - Math.max(r.left, box.left);
          const h = Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top + fade);
          return w > 0 && h > 0 && (w * h) / (r.width * r.height) >= 0.6;
        });
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 4 || r.height < 4 || !shown(r)) continue;
        out.push({
          // A lone mark such as the "?" badge is an icon, which WCAG 1.4.11 holds to 3:1.
          icon: /^[^\p{L}\p{N}]{1,2}$/u.test(n.nodeValue.trim()),
          text: n.nodeValue.trim().slice(0, 42),
          sel:
            el.tagName.toLowerCase() +
            (el.className && typeof el.className === 'string'
              ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
              : ''),
          colour,
          size,
          weight,
          // Large text per WCAG: >=24px, or >=18.66px when bold.
          large: size >= 24 || (size >= 18.66 && weight >= 700),
          chrome: !!el.closest('header'),
          x: r.x,
          y: r.y + window.scrollY,
          w: r.width,
          h: r.height,
        });
      }
    }
    // Placeholders are text a reader has to read too, but they are not text nodes.
    for (const input of document.querySelectorAll(`${scopeSel} input[placeholder]`)) {
      if (
        input.value ||
        !input.checkVisibility({ opacityProperty: true, visibilityProperty: true })
      )
        continue;
      const ph = getComputedStyle(input, '::placeholder');
      const cs = getComputedStyle(input);
      const colour = parse(ph.color);
      const b = input.getBoundingClientRect();
      const size = parseFloat(ph.fontSize);
      const padL = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
      out.push({
        text: input.placeholder.slice(0, 42),
        sel: 'input::placeholder',
        colour,
        size,
        weight: +ph.fontWeight || 400,
        large: false,
        chrome: false,
        x: b.x + padL,
        y: b.y + window.scrollY + (b.height - size * 1.3) / 2,
        w: Math.min(b.width - padL * 2, input.placeholder.length * size * 0.6),
        h: size * 1.3,
      });
    }
    return out;
  }, scope);

/** Median background pixel under each rect, read from a screenshot in-page. */
function sample(p, b64, rects) {
  return p.evaluate(
    async ([b64, rects]) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width;
      cv.height = img.height;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const sx = img.width / window.innerWidth;
      const sy = img.height / window.innerHeight;
      return rects.map((r) => {
        const x0 = Math.max(0, Math.round(r.x * sx));
        const y0 = Math.max(0, Math.round(r.vy * sy));
        const w = Math.min(Math.round(r.w * sx), img.width - x0);
        const h = Math.min(Math.round(r.h * sy), img.height - y0);
        if (w < 1 || h < 1) return null;
        const d = g.getImageData(x0, y0, w, h).data;
        const R = [];
        const G = [];
        const B = [];
        for (let i = 0; i < d.length; i += 4) {
          R.push(d[i]);
          G.push(d[i + 1]);
          B.push(d[i + 2]);
        }
        const mid = (a) => a.sort((p, q) => p - q)[a.length >> 1];
        return [mid(R), mid(G), mid(B)];
      });
    },
    [b64, rects],
  );
}

/** The glyphs go transparent while the style is enabled, so boxes keep their place. */
const installHider = (p) =>
  p.evaluate(() => {
    const s = document.createElement('style');
    s.id = '__hide-glyphs';
    s.textContent = `*, *::before, *::after { color: transparent !important;
      text-shadow: none !important; -webkit-text-stroke-color: transparent !important; }
      ::placeholder { color: transparent !important; }`;
    document.head.append(s);
    s.sheet.disabled = true; // only a style that is in the document has a sheet to disable
  });
const hide = (p, on) =>
  p.evaluate((v) => (document.getElementById('__hide-glyphs').sheet.disabled = !v), on);

async function audit(path, viewport, label) {
  const { ctx, p } = await open(browser, path, { viewport, reducedMotion: 'reduce' });
  // Closed answers are not rendered, so they would otherwise never be measured.
  await p.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  await p.waitForTimeout(250);
  await installHider(p);

  const H = viewport.height;
  const findings = [];
  const seen = new Set();
  const record = (it, bg, tag = '') => {
    if (!bg) return;
    const key = `${tag}|${it.sel}|${it.text}|${Math.round(it.x)}|${Math.round(it.y)}`;
    if (seen.has(key)) return;
    seen.add(key);
    const cr = ratio(composite(it.colour, bg), bg);
    const need = it.large || it.icon ? 3 : 4.5;
    findings.push({ ...it, tag, bg, cr: +cr.toFixed(2), need, pass: cr >= need });
  };

  /** Scrolls so each item is on screen, shoots with glyphs hidden, samples under every line. */
  async function measure(items, tag) {
    await hide(p, true);
    const pageH = await p.evaluate(() => document.documentElement.scrollHeight);
    const deferred = [];
    for (let top = 0; top < pageH; top += H) {
      await p.evaluate((y) => window.scrollTo(0, y), top);
      await p.waitForTimeout(150);
      const realTop = await p.evaluate(() => scrollY);
      const batch = items
        .filter((it) => it.y >= realTop - 2 && it.y + it.h <= realTop + H + 2)
        .map((it) => ({ ...it, vy: it.y - realTop }));
      if (!batch.length) continue;
      // The sampler reads the rendered pixel, which cannot tell "behind" from "in
      // front": text passing under the sticky header would read the header's colour.
      // Occluded text has no contrast question to answer, so re-measure it clear of it.
      const bar = await p.evaluate(
        () => document.querySelector('header').getBoundingClientRect().bottom,
      );
      const covered = (it) => !it.chrome && it.vy < bar;
      for (const it of batch) if (covered(it)) deferred.push(it);
      const visible = batch.filter((it) => !covered(it));
      const sampled = await sample(p, (await p.screenshot()).toString('base64'), visible);
      visible.forEach((it, i) => record(it, sampled[i], tag));
    }
    // Parked items: centre each in the viewport, clear of the header at the top.
    const groups = new Map();
    for (const it of deferred) {
      const target = Math.max(0, Math.min(pageH - H, Math.round(it.y - H / 2)));
      const key = Math.round(target / 80) * 80;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    }
    for (const [target, rows0] of groups) {
      await p.evaluate((y) => window.scrollTo(0, y), target);
      await p.waitForTimeout(150);
      const realTop = await p.evaluate(() => scrollY);
      const rows = rows0
        .map((it) => ({ ...it, vy: it.y - realTop }))
        .filter((it) => it.vy > 72 && it.vy + it.h < H - 8);
      if (!rows.length) continue;
      const sampled = await sample(p, (await p.screenshot()).toString('base64'), rows);
      rows.forEach((it, i) => record(it, sampled[i], tag));
    }
    await hide(p, false);
  }

  // The page at rest, top to bottom.
  await measure(await collect(p, 'body'), '');

  await ctx.close();
  return { label: label.text, findings };
}

/**
 * WCAG 1.4.11, non-text contrast (3:1): the edge of a field and of the consent box
 * are what tell a reader where to type and what to tick.
 */
async function auditControls() {
  const { ctx, p } = await open(browser, '/', { reducedMotion: 'reduce' });
  const out = [];
  for (const [sel, label] of [
    ['form[data-form-position="hero"] input[type="email"]', 'email field'],
    ['form[data-form-position="hero"] input[type="checkbox"]', 'consent box'],
  ]) {
    const box = await p.evaluate((q) => {
      const el = document.querySelector(q);
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const n = (cs.borderTopColor.match(/-?[\d.]+/g) ?? []).map(Number);
      return {
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
        colour: n.length >= 3 ? [n[0], n[1], n[2], n.length > 3 ? n[3] : 1] : null,
        width: parseFloat(cs.borderTopWidth),
      };
    }, sel);
    if (!box.colour || !box.width) {
      out.push({ label, skip: 'no border drawn' });
      continue;
    }
    const shot = (await p.screenshot()).toString('base64');
    const [outside, inside] = await p.evaluate(
      async ([b64, r]) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const cv = document.createElement('canvas');
        cv.width = img.width;
        cv.height = img.height;
        const g = cv.getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0);
        const at = (x, y) => {
          const d = g.getImageData(Math.round(x), Math.round(y), 1, 1).data;
          return [d[0], d[1], d[2]];
        };
        const cx = r.x + r.w / 2;
        return [at(cx, r.y - 4), at(cx, r.y + r.h / 2)];
      },
      [shot, box],
    );
    const edge = composite(box.colour, outside);
    const cr = Math.max(ratio(edge, outside), ratio(edge, inside));
    out.push({ label, cr: +cr.toFixed(2), pass: cr >= 3 });
  }
  await ctx.close();
  return out;
}

const runs = [];
for (const [{ loc, path }, vp] of LOCALES.flatMap((l) => [
  [l, { width: 1440, height: 900 }],
  [l, { width: 390, height: 844 }],
]))
  runs.push(await audit(path, vp, { loc, text: `${loc} · ${vp.width}` }));
const controls = await auditControls();

for (const { label, findings } of runs) {
  const bad = findings.filter((f) => !f.pass);
  console.log(`\n=== ${label}: ${findings.length} line boxes, ${bad.length} below AA ===`);
  const rows = ONLY ? bad : findings;
  for (const f of rows.sort((a, b) => a.cr - b.cr).slice(0, ONLY ? 99 : 8)) {
    const fgc = composite(f.colour, f.bg).map(Math.round);
    console.log(
      `${f.pass ? 'PASS' : 'FAIL'} ${String(f.cr).padStart(6)} (need ${f.need})  ` +
        `${f.size}px/${f.weight}  ${f.tag || 'page'}  ${f.sel}  fg=rgb(${fgc}) bg=rgb(${f.bg.map(Math.round)})  "${f.text}"`,
    );
  }
}
console.log('\n=== non-text contrast (WCAG 1.4.11, 3:1) ===');
for (const c of controls)
  console.log(
    c.skip
      ? `SKIP  ${c.label}: ${c.skip}`
      : `${c.pass ? 'PASS' : 'FAIL'} ${String(c.cr).padStart(6)}  ${c.label}`,
  );
console.log('');

for (const { label, findings } of runs) {
  const bad = findings.filter((f) => !f.pass);
  ok(
    `${label}: ${findings.length - bad.length}/${findings.length} line boxes meet WCAG AA`,
    findings.length > 40 && bad.length === 0,
    bad.length ? `${bad.length} fail` : '',
  );
}
for (const c of controls.filter((x) => !x.skip))
  ok(`${c.label} edge meets 3:1`, c.pass, `${c.cr}:1`);

await finish(browser);
