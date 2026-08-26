import { chromium } from 'playwright-core';
import { chromePath } from './resolve-chrome.mjs';

/**
 * WCAG 2.1 AA contrast audit for a page that has no flat backgrounds.
 *
 * Every panel here is a translucent pane over an animated gradient sky, so the
 * "background colour" of a paragraph is not any single CSS declaration — it is
 * whatever those layers composite to at that spot. Walking `background-color`
 * up the ancestor chain gets the wrong answer (it lands on `transparent` and
 * then on the body, missing the sky, the island and every rgba pane between).
 *
 * So the background is measured, not derived: hide the glyphs, screenshot what
 * is left, and read the pixels the text would have sat on. The text colour is
 * then composited over that sample with its own alpha before the ratio is
 * taken, which is the part that catches `rgba(…, 0.42)` label tokens.
 *
 * Motion is frozen via `reducedMotion` so the rects and the screenshot describe
 * the same frame.
 */

const BASE = process.env.BASE ?? 'http://localhost:5199';
const ONLY = process.argv.includes('--fail-only');

const browser = await chromium.launch({ executablePath: chromePath() });

const srgb = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** `over` is opaque by construction — it is a screenshot pixel. */
const composite = ([r, g, b, a], over) => [
  r * a + over[0] * (1 - a),
  g * a + over[1] * (1 - a),
  b * a + over[2] * (1 - a),
];

async function audit(path, viewport, label) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);

  // 1. Collect one entry per rendered line box, with the colour actually used.
  const items = await p.evaluate(() => {
    const parse = (s) => {
      const n = s.match(/-?[\d.]+/g)?.map(Number) ?? [];
      return n.length >= 3 ? [n[0], n[1], n[2], n.length > 3 ? n[3] : 1] : null;
    };
    const out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      const el = n.parentElement;
      if (!el || el.closest('[aria-hidden="true"], .visually-hidden, script, style')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      const colour = parse(cs.color);
      if (!colour) continue;
      const size = parseFloat(cs.fontSize);
      const weight = +cs.fontWeight || 400;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 4 || r.height < 4) continue;
        out.push({
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
          x: r.x,
          y: r.y + window.scrollY,
          w: r.width,
          h: r.height,
        });
      }
    }
    return out;
  });

  // 2. Blank the glyphs. `color: transparent` keeps every box exactly where it
  //    was, so the rects above still describe this render.
  await p.addStyleTag({
    content: `*, *::before, *::after { color: transparent !important;
      text-shadow: none !important; -webkit-text-stroke-color: transparent !important; }`,
  });

  const H = viewport.height;
  const pageH = await p.evaluate(() => document.documentElement.scrollHeight);
  const findings = [];
  const seen = new Set();
  /** Items the fixed chrome covered at their step, re-measured afterwards. */
  const deferred = [];

  for (let top = 0; top < pageH; top += H) {
    await p.evaluate((y) => window.scrollTo(0, y), top);
    await p.waitForTimeout(220);
    const realTop = await p.evaluate(() => window.scrollY);
    const shot = (await p.screenshot()).toString('base64');

    const batch = items
      .filter((it) => it.y >= realTop - 2 && it.y + it.h <= realTop + H + 2)
      .map((it) => ({ ...it, vy: it.y - realTop }));
    if (!batch.length) continue;

    // 3a. Drop anything the fixed chrome is covering.
    //
    // The sampler reads the rendered pixel, which cannot tell "behind" from
    // "in front". A section eyebrow passing under the header sat behind the
    // white wordmark and reported 2.59:1 — but it is occluded, not
    // illegible, and a hidden element has no contrast question to answer.
    // Occlusion is a separate measurement, and the suite makes it separately.
    const chrome = await p.evaluate(() => {
      const box = (q) => {
        const el = document.querySelector(q);
        if (!el) return null;
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed' && cs.position !== 'sticky') return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      };
      return [box('header .bar'), box('header'), box('footer')].filter(Boolean);
    });
    const covered = (it) => chrome.some((c) => it.vy < c.bottom && it.vy + it.h > c.top);
    const visible = batch.filter((it) => !covered(it));
    // Each item belongs to exactly one step, so skipping it here would drop it
    // from the audit entirely. Park it and re-measure at an offset that puts it
    // clear of the chrome.
    for (const it of batch) if (covered(it)) deferred.push(it);

    // 3. Sample the background under each line, in-page via canvas.
    const sampled = await sample(p, shot, visible);
    visible.forEach((it, i) => record(it, sampled[i]));
  }

  // Second pass for the parked items: centre each in the viewport, which is
  // always clear of a header at the top and a footer at the bottom. Grouped by
  // target offset so items that share one land in a single screenshot.
  const groups = new Map();
  for (const it of deferred) {
    const target = Math.max(0, Math.min(pageH - H, Math.round(it.y - H / 2)));
    const key = Math.round(target / 80) * 80;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }
  for (const [target, items] of groups) {
    await p.evaluate((y) => window.scrollTo(0, y), target);
    await p.waitForTimeout(200);
    const realTop = await p.evaluate(() => window.scrollY);
    const rows = items
      .map((it) => ({ ...it, vy: it.y - realTop }))
      .filter((it) => it.vy > 8 && it.vy + it.h < H - 8);
    if (!rows.length) continue;
    const shot = (await p.screenshot()).toString('base64');
    const sampled = await sample(p, shot, rows);
    rows.forEach((it, i) => record(it, sampled[i]));
  }

  await ctx.close();
  return { label, findings };

  function record(it, bg) {
    if (!bg) return;
    const fg = composite(it.colour, bg);
    const cr = ratio(fg, bg);
    const need = it.large ? 3 : 4.5;
    const key = `${it.sel}|${it.text}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ ...it, bg, cr: +cr.toFixed(2), need, pass: cr >= need });
  }
}

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

/**
 * WCAG 1.4.11 — non-text contrast, 3:1.
 *
 * Text was the loud failure, but a control you cannot see the edge of is the
 * same problem wearing different clothes. These are the boundaries that carry
 * meaning: where a field ends, and which of a set of options is chosen.
 *
 * The border is composited over the pixel just outside the control and then
 * compared with the pixel just inside it, so a translucent `rgba` line over a
 * gradient sky is measured where it actually lands.
 */
async function auditControls() {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);

  const TARGETS = [
    ['.hero input[type=email]', 'email field'],
    ['.hero input[type=checkbox]', 'consent box'],
    ['section.cost .plan.on', 'chosen plan'],
    ['section.share .mode.on', 'chosen payback mode'],
    ['section.make .card.on', 'chosen tool', 'section.make .palette .card'],
    ['section.watch .switch', 'cron switch'],
  ];
  // Deliberately not checked: the `.hud` panel outline. 1.4.11 covers controls
  // and graphics needed to understand content; a panel edge is neither — every
  // word inside one is legible without it, and the text pass above proves that
  // separately. Chips and the switch report SKIP because they carry no border
  // at all: they are identified by their fill, which the text pass covers.

  const out = [];
  for (const [sel, label, arm] of TARGETS) {
    // Some states only exist after a click. Arm them rather than reporting a
    // skip that reads like "this has no border" when it means "not on screen".
    if (arm) {
      const armed = p.locator(arm).first();
      if (await armed.count()) {
        await armed.scrollIntoViewIfNeeded();
        await armed.click();
        await p.waitForTimeout(300);
        // Attaching a tool that has settings replaces the list with its panel,
        // so the selected card is no longer rendered. Step back to the list.
        const back = p.locator('section.make .cfg .back');
        if (await back.count()) {
          await back.click();
          await p.waitForTimeout(300);
        }
      }
    }
    const box = await p.evaluate((q) => {
      const el = document.querySelector(q);
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
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
    if (!box) {
      out.push({ label, skip: 'not on screen' });
      continue;
    }
    if (!box.colour || !box.width) {
      out.push({ label, skip: 'no border drawn — identified by its fill' });
      continue;
    }
    await p.waitForTimeout(200);
    const fresh = await p.evaluate((q) => {
      const r = document.querySelector(q).getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }, sel);
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
          const d = g.getImageData(
            Math.max(0, Math.min(img.width - 1, Math.round(x))),
            Math.max(0, Math.min(img.height - 1, Math.round(y))),
            1,
            1,
          ).data;
          return [d[0], d[1], d[2]];
        };
        const cx = r.x + r.w / 2;
        return [at(cx, r.y - 4), at(cx, r.y + 6)];
      },
      [shot, fresh],
    );
    const edge = composite(box.colour, outside);
    out.push({
      label,
      cr: +Math.max(ratio(edge, outside), ratio(edge, inside)).toFixed(2),
      pass: Math.max(ratio(edge, outside), ratio(edge, inside)) >= 3,
    });
  }
  await ctx.close();
  return out;
}

const runs = [];
for (const [path, vp, label] of [
  ['/', { width: 1440, height: 900 }, 'ko · 1440'],
  ['/', { width: 390, height: 844 }, 'ko · 390'],
  ['/en', { width: 1440, height: 900 }, 'en · 1440'],
  ['/ja', { width: 1440, height: 900 }, 'ja · 1440'],
]) {
  runs.push(await audit(path, vp, label));
}
const controls = await auditControls();
await browser.close();

let failed = 0;
let total = 0;
for (const { label, findings } of runs) {
  const bad = findings.filter((f) => !f.pass);
  total += findings.length;
  failed += bad.length;
  console.log(`\n=== ${label} — ${findings.length} line boxes, ${bad.length} below AA ===`);
  const rows = ONLY ? bad : findings;
  for (const f of rows.sort((a, b) => a.cr - b.cr).slice(0, ONLY ? 99 : 14)) {
    const fgc = composite(f.colour, f.bg).map(Math.round);
    console.log(
      `${f.pass ? 'PASS' : 'FAIL'} ${String(f.cr).padStart(6)} (need ${f.need})  ` +
        `${f.size}px/${f.weight}  ${f.sel}  fg=rgb(${fgc}) bg=rgb(${f.bg.map(Math.round)})  "${f.text}"`,
    );
  }
}
console.log('\n=== non-text contrast (WCAG 1.4.11, 3:1) ===');
let ctlBad = 0;
for (const c of controls) {
  if (c.skip) {
    console.log(`SKIP  ${c.label} — ${c.skip}`);
    continue;
  }
  if (!c.pass) ctlBad++;
  console.log(`${c.pass ? 'PASS' : 'FAIL'} ${String(c.cr).padStart(6)}  ${c.label}`);
}

console.log(`\n${total - failed}/${total} line boxes meet WCAG AA. ${failed} fail.`);
console.log(
  `${controls.filter((c) => !c.skip).length - ctlBad}/${controls.filter((c) => !c.skip).length} control edges meet 3:1. ${ctlBad} fail.`,
);
if (failed || ctlBad) process.exitCode = 1;
