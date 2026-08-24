import { chromium } from 'playwright-core';
import { chromePath } from './resolve-chrome.mjs';
const EXEC = chromePath();
const browser = await chromium.launch({ executablePath: EXEC });
let fail = 0;
const ok = (l, c, e = '') => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${e ? '  ' + e : ''}`);
  if (!c) fail++;
};

const page = async (o = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...o });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  return { ctx, p };
};

// --- the ambient loops must survive a poke (both were killed permanently) ---
{
  const { ctx, p } = await page();
  const range = async (sel, extract) => {
    const v = [];
    for (let i = 0; i < 20; i++) {
      v.push(await p.locator(sel).first().evaluate(extract));
      await p.waitForTimeout(150);
    }
    return Math.max(...v) - Math.min(...v);
  };
  const floatY = (el) => {
    const m = /translateY\(([-\d.]+)px\)/.exec(el.style.transform || '');
    return m ? parseFloat(m[1]) : 0;
  };
  // The body's squash/stretch drift shows up as the path's horizontal extent.
  const bodyWidth = (el) => {
    const b = el.getBBox();
    return b.width;
  };

  const f0 = await range('.hero .mos > .wrap', floatY);
  const w0 = await range('.hero [data-anim="mos-fill"]', bodyWidth);
  await p.locator('.hero [data-anim="mos-fill"]').click({ force: true });
  await p.waitForTimeout(2600);
  const f1 = await range('.hero .mos > .wrap', floatY);
  const w1 = await range('.hero [data-anim="mos-fill"]', bodyWidth);

  ok('float loop survives a poke', f1 > 1, `${f0.toFixed(1)}px -> ${f1.toFixed(1)}px`);
  ok('body drift survives a poke', w1 > 0.5, `${w0.toFixed(1)}px -> ${w1.toFixed(1)}px`);
  await ctx.close();
}

// --- a Mon's drift must survive a hover nudge ---
{
  const { ctx, p } = await page();
  const mon = '.hero .mon.mid [data-anim="mon-fill"]';
  const w = async () => {
    const v = [];
    for (let i = 0; i < 18; i++) {
      v.push(
        await p
          .locator(mon)
          .first()
          .evaluate((e) => e.getBBox().width),
      );
      await p.waitForTimeout(150);
    }
    return Math.max(...v) - Math.min(...v);
  };
  await p.locator('.hero .mon.mid').first().hover({ force: true });
  await p.waitForTimeout(2200);
  ok('Mon drift survives a hover', (await w()) > 0.5);
  await ctx.close();
}

// --- the orbit must not award growth for merely sitting there ---
{
  const { ctx, p } = await page();
  await p.locator('.growth .scene').scrollIntoViewIfNeeded();
  await p.waitForTimeout(1000);
  const before = await p.locator('.growth .glob').count();
  await p.waitForTimeout(12000); // 12s of pure idle drift
  const after = await p.locator('.growth .glob').count();
  const cycleVisible = await p
    .locator('.growth .cycle')
    .evaluate((e) => getComputedStyle(e).display);
  ok('idle drift awards no growth', before === after, `globs ${before} -> ${after}`);
  ok('no "cycle 0" label before first use', cycleVisible === 'none', cycleVisible);
  await ctx.close();
}

// --- switching request must choreograph every slot of the new set ---
{
  const { ctx, p } = await page();
  await p.locator('.summon .stage').scrollIntoViewIfNeeded();
  await p.waitForTimeout(700);
  await p.locator('.summon .chips button').nth(2).click(); // 2 Mon
  await p.waitForTimeout(400);
  await p.locator('.summon .chips button').nth(0).click(); // 3 Mon
  await p.waitForTimeout(500);
  // Every slot must be mid-choreography (reset to hidden), none stuck at 1.
  const opacities = await p
    .locator('.summon .mon-slot')
    .evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
  ok(
    'all slots enter the timeline',
    opacities.length === 3 && opacities.every((o) => o < 0.99),
    JSON.stringify(opacities.map((o) => o.toFixed(2))),
  );
  await p.waitForTimeout(7000);
  const bars = await p
    .locator('.summon .bar-fill')
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
  ok(
    'every progress bar fills',
    bars.length === 3 && bars.every((w) => w > 10),
    JSON.stringify(bars.map(Math.round)),
  );
  await ctx.close();
}

// --- Mos on the island must be reachable by assistive tech ---
{
  const { ctx, p } = await page();
  // The frame must not carry role="img": that role is Children-Presentational
  // and would prune Mos and the live region out of the a11y tree entirely.
  ok('frame carries no presentational role', (await p.locator('.hero .frame[role]').count()) === 0);
  ok(
    'Mos is a labelled button',
    (await p.locator('.hero button.hit[aria-label="Mos"]').count()) === 1,
  );
  ok(
    'island svg carries the scene label',
    (await p.locator('.hero svg.isle[role="img"][aria-label]').count()) === 1,
  );
  ok(
    'poke reply is a live region',
    (await p.locator('.hero .mos-line[aria-live="polite"]').count()) === 1,
  );
  ok(
    'decorative Mon are not announced',
    (await p.locator('.hero .mon svg[aria-hidden="true"]').count()) === 3,
  );
  await ctx.close();
}

// --- reduced motion must not invite an interaction it disabled ---
{
  const { ctx, p } = await page({ reducedMotion: 'reduce' });
  await p.locator('.drift .field').scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  ok('no dodge hint under reduced motion', (await p.locator('.drift .hint').count()) === 0);
  ok('shard labels still readable', (await p.locator('.drift .shard-core').count()) === 6);
  await ctx.close();
}

// --- focusing Mos must not draw a rectangle around the body ---
{
  const { ctx, p } = await page();
  const hit = p.locator('.hero button.hit');
  await hit.focus();
  await p.waitForTimeout(120);

  // The old bug: `svg:focus-visible { outline: 2px solid }` on a `role="button"`
  // svg drew a hard rectangle. Nothing in the tree may carry an outline now.
  const outlines = await p
    .locator('.hero .mos')
    .evaluate((root) =>
      [root, ...root.querySelectorAll('*')]
        .map((el) => getComputedStyle(el).outlineStyle + ':' + getComputedStyle(el).outlineWidth)
        .filter((v) => !v.startsWith('none') && !v.endsWith(':0px')),
    );
  ok('no outline rectangle on focus', outlines.length === 0, outlines.join(',') || 'clean');

  const ring = await hit.evaluate((el) => {
    const s = getComputedStyle(el, '::after');
    return { r: s.borderRadius, shadow: s.boxShadow, content: s.content };
  });
  ok('focus ring is round', ring.r === '50%', ring.r);
  ok('focus ring is declared', ring.shadow !== 'none' && ring.content !== 'none');

  // Declared is not the same as painted: the ring and the svg are both
  // positioned with no z-index, so tree order used to hide it behind the body.
  // Compare the actual pixels instead of trusting the cascade.
  const shot = async () => (await p.locator('.hero .mos').screenshot()).toString('base64');
  const focused = await shot();
  await p.locator('.hero h1').first().focus();
  await p.waitForTimeout(200);
  const blurred = await shot();
  ok('focus ring is painted', focused !== blurred);
  await hit.focus();
  await p.waitForTimeout(150);

  // Enter on a native button delivers a MouseEvent with clientX 0 / detail 0.
  // Before the guard fix that poked the viewport origin, so the dip landed far
  // outside the body instead of at its centre.
  await p.keyboard.press('Enter');
  await p.waitForTimeout(140);
  const dip = await p
    .locator('.hero [data-anim="press-dip"]')
    .evaluate((el) => ({ cx: +el.getAttribute('cx'), cy: +el.getAttribute('cy') }));
  ok('keyboard poke lands on the body', dip.cx === 452 && dip.cy === 430, `${dip.cx},${dip.cy}`);
  await ctx.close();
}

// --- every mood must read as a different Mos ---
{
  const { ctx, p } = await page();
  await p.locator('.sheet .viewer').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);

  const shown = async () =>
    p
      .locator('.sheet .mos svg')
      .evaluate((svg) =>
        [...svg.querySelectorAll('[data-face]')]
          .filter((el) => Number(getComputedStyle(el).opacity) > 0.5)
          .map((el) => el.dataset.face),
      );
  const silhouette = () => p.locator('.sheet [data-anim="mos-fill"]').getAttribute('d');

  const faces = [];
  const widths = [];
  const buttons = p.locator('.sheet .switch button');
  for (let i = 0; i < (await buttons.count()); i++) {
    await buttons.nth(i).click();
    await p.waitForTimeout(800);
    const f = await shown();
    ok(`mood ${i} shows exactly one face`, f.length === 1, f.join(',') || 'none');
    faces.push(f[0]);
    // Widest x across the path — the mood aspect has to move the outline itself,
    // not just the eyes.
    const xs = (await silhouette())
      .match(/-?\d+\.?\d*/g)
      .map(Number)
      .filter((_, k) => k % 2 === 0);
    widths.push(Math.max(...xs) - Math.min(...xs));
  }
  ok('four moods, four faces', new Set(faces).size === 4, faces.join(' '));
  ok(
    'mood changes the silhouette itself',
    Math.max(...widths) - Math.min(...widths) > 12,
    widths.map((w) => w.toFixed(1)).join(' / '),
  );
  await ctx.close();
}

// --- switching language must not reload the document ---
{
  const { ctx, p } = await page();
  const before = await p.locator('h1').first().innerText();
  // A survivor value on `window`: a full document reload wipes it, a client-side
  // switch keeps it. `navigation` performance entries cannot tell the two apart
  // because they are per-document and always count 1.
  await p.evaluate(() => {
    window.__noReload = 'kept';
  });
  await p.locator('.lang a[hreflang="ja"]').click();
  await p.waitForFunction((t) => document.querySelector('h1')?.innerText !== t, before, {
    timeout: 4000,
  });
  ok('language switch keeps the document', (await p.evaluate(() => window.__noReload)) === 'kept');
  ok(
    'html lang follows the switch',
    (await p.evaluate(() => document.documentElement.lang)) === 'ja',
  );
  ok('url follows the switch', new URL(p.url()).pathname.startsWith('/ja'));
  const after = await p.locator('h1').first().innerText();
  ok('copy actually changed', after !== before, JSON.stringify(after.slice(0, 18)));
  // And back, to prove the remount is not a one-way trip.
  await p.locator('.lang a[hreflang="ko"]').click();
  await p.waitForFunction((t) => document.querySelector('h1')?.innerText !== t, after, {
    timeout: 4000,
  });
  ok(
    'switch back restores the base locale',
    (await p.locator('h1').first().innerText()) === before,
  );
  ok('still no reload after two switches', (await p.evaluate(() => window.__noReload)) === 'kept');
  await ctx.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nall regression guards pass');
process.exit(fail ? 1 : 0);
