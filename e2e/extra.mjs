import { chromium } from 'playwright-core';
import { chromePath } from './resolve-chrome.mjs';

const BASE = process.env.BASE ?? 'http://localhost:5199';
const errors = [];
const browser = await chromium.launch({ executablePath: chromePath() });
function ok(l, c, e = '') {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${e ? '  ' + e : ''}`);
  if (!c) process.exitCode = 1;
}

// ---- Signup -> arrival screen ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('signup: ' + e.message));
  // The real endpoint needs Notion credentials; stub it so the UI path is what's tested.
  await p.route('**/api/waitlist', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'test-page-id', emailSent: true }),
    }),
  );
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  await p.locator('.hero input[type="email"]').fill('someone@example.com');
  await p.locator('.hero input[type="checkbox"]').check();
  await p.locator('.hero button[type="submit"]').click();
  await p.waitForTimeout(1800);

  ok('arrival screen replaces the flow', (await p.locator('.arrival').count()) === 1);
  ok('the marketing page is gone', (await p.locator('section.hero').count()) === 0);
  ok('and so is the world', (await p.locator('.world').count()) === 0);
  ok(
    'Mos greets on arrival',
    (await p.locator('.arrival .mos-hold img').getAttribute('src')).includes('mos-happy'),
  );
  const mons = await p
    .locator('.arrival .mon-join')
    .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) > 0.8).length);
  ok('three Mon join', mons === 3, `${mons} visible`);
  ok('welcome-email line shown', (await p.locator('.arrival .reward').count()) === 1);
  ok('survey offered', (await p.locator('.arrival .survey').count()) === 1);

  // The arrival screen inherits the shell, so its text has to be legible on it.
  const ink = await p.locator('.arrival h2').evaluate((e) => getComputedStyle(e).color);
  ok('arrival copy is light on the dark ground', ink === 'rgb(255, 255, 255)', ink);

  // Survey submit path
  await p.route('**/api/waitlist/survey', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await p.locator('.arrival .survey button:has-text("보내기")').click();
  await p.waitForTimeout(900);
  ok('survey thank-you shown', (await p.locator('.arrival .done').count()) === 1);
  await ctx.close();
}

// ---- The scroll actually plays, and stays inside the frame budget ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('motion: ' + e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);

  // Real rAF gaps while the wheel is turning. This is the only honest measure
  // of "plays" versus "steps": counting distinct positions passes at 15 fps.
  await p.evaluate(() => {
    window.__g = [];
    let last = 0;
    const tick = (t) => {
      if (last) window.__g.push(t - last);
      last = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  for (let i = 0; i < 60; i++) {
    await p.mouse.wheel(0, 90);
    await p.waitForTimeout(16);
  }
  await p.waitForTimeout(300);
  const gaps = await p.evaluate(() => window.__g);
  const sorted = [...gaps].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  // Headless software rasterising is slower than any real client, so the gate
  // is generous — it exists to catch a regression of the kind that took this
  // page to 66 ms per frame, not to certify a frame rate.
  ok('the scroll holds a frame budget', p50 <= 26, `p50 ${p50.toFixed(1)}ms`);
  ok('with no long stalls', p95 <= 60, `p95 ${p95.toFixed(1)}ms`);

  // And the world keeps easing after the input stops — the difference between a
  // transform bolted to the wheel and one that plays toward it.
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await p.waitForTimeout(700);
  const samples = await p.evaluate(async () => {
    const el = document.querySelector('.isle');
    window.scrollBy({ top: 900, behavior: 'instant' });
    const out = [];
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      out.push(new DOMMatrixReadOnly(getComputedStyle(el).transform).f);
    }
    return out;
  });
  const moving = samples.filter((v, i) => i && Math.abs(v - samples[i - 1]) > 0.01).length;
  ok('the world keeps moving after the wheel stops', moving >= 14, `${moving}/23 frames`);
  ok(
    'and travels a visible distance',
    Math.abs(samples.at(-1) - samples[0]) > 8,
    `${samples[0].toFixed(1)} -> ${samples.at(-1).toFixed(1)}`,
  );

  // The island sinks as the page is read; rising would drive it up through the
  // panels it sits behind.
  ok('the island sinks rather than rises', samples.at(-1) > samples[0]);
  await ctx.close();
}

// ---- Mos stands on the island, at every scroll depth and every width ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('world: ' + e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);

  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  const read = () =>
    p.evaluate(() => {
      const dy = (sel) =>
        new DOMMatrixReadOnly(getComputedStyle(document.querySelector(sel)).transform).f;
      const svg = document.querySelector('.isle-svg').getBoundingClientRect();
      // The top surface reads at viewBox y 454 of a 0 0 1440 900 box.
      const surface = svg.top + 454 * (svg.width / 1440);
      const mos = document.querySelector('.mos-svg').getBoundingClientRect();
      return {
        isle: Math.round(dy('.isle')),
        stage: Math.round(dy('.stage')),
        seat: Math.round(mos.bottom - surface),
        bottom: Math.round(mos.bottom),
      };
    });

  // The island and Mos are one body: scaling the sink by pointer depth pulled
  // them 228 px apart over the page and dropped Mos through the footer.
  let glued = true;
  let worstSeat = 0;
  let lowest = 0;
  for (const pct of [0, 0.25, 0.5, 0.75, 1]) {
    await p.evaluate(
      (v) => window.scrollTo({ top: v, behavior: 'instant' }),
      Math.round((H - 900) * pct),
    );
    await p.waitForTimeout(900);
    const g = await read();
    if (g.isle !== g.stage) glued = false;
    worstSeat = Math.max(worstSeat, Math.abs(g.seat));
    lowest = Math.max(lowest, g.bottom);
  }
  ok('the island and Mos sink together', glued);
  ok('Mos stays seated on the surface', worstSeat <= 30, `worst ${worstSeat}px off`);
  ok('and never drops out of the viewport', lowest < 900, `lowest ${lowest}px`);

  // Proportion: Mos's size is derived from the island's, so the ratio holds.
  const ratios = [];
  for (const [w, h] of [
    [1920, 1080],
    [1440, 900],
    [1024, 768],
  ]) {
    await p.setViewportSize({ width: w, height: h });
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await p.waitForTimeout(700);
    ratios.push(
      await p.evaluate(() => {
        const svg = document.querySelector('.isle-svg').getBoundingClientRect();
        const disc = (1033 - 408) * (svg.width / 1440);
        return document.querySelector('.mos-svg').getBoundingClientRect().width / disc;
      }),
    );
  }
  const spread = Math.max(...ratios) - Math.min(...ratios);
  ok(
    'Mos keeps its share of the island at any width',
    spread < 0.03,
    `spread ${spread.toFixed(3)}`,
  );
  await ctx.close();
}

// ---- The idle is one buoyant body, not three loops beating ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('idle: ' + e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);

  const rows = [];
  for (let i = 0; i < 30; i++) {
    rows.push(
      await p.evaluate(() => {
        const t = (sel) =>
          new DOMMatrixReadOnly(getComputedStyle(document.querySelector(sel)).transform);
        const body = t('[data-anim="mos-svg"]');
        const sh = t('[data-anim="mos-shadow"]');
        return {
          up: -t('[data-anim="mos"]').f,
          sy: Math.hypot(body.c, body.d),
          sx: Math.hypot(body.a, body.b),
          sh: Math.hypot(sh.a, sh.b),
        };
      }),
    );
    await p.waitForTimeout(100);
  }
  const cor = (a, b) => {
    const ma = a.reduce((x, y) => x + y, 0) / a.length;
    const mb = b.reduce((x, y) => x + y, 0) / b.length;
    let n = 0;
    let da = 0;
    let db = 0;
    for (let i = 0; i < a.length; i++) {
      n += (a[i] - ma) * (b[i] - mb);
      da += (a[i] - ma) ** 2;
      db += (b[i] - mb) ** 2;
    }
    return n / Math.sqrt(da * db);
  };
  const up = rows.map((r) => r.up);
  ok(
    'the body bobs',
    Math.max(...up) - Math.min(...up) > 10,
    `${(Math.max(...up) - Math.min(...up)).toFixed(1)}px`,
  );
  const stretch = cor(
    up,
    rows.map((r) => r.sy),
  );
  const volume = cor(
    rows.map((r) => r.sy),
    rows.map((r) => r.sx),
  );
  const shadow = cor(
    up,
    rows.map((r) => r.sh),
  );
  ok('it stretches as it rises', stretch > 0.6, stretch.toFixed(2));
  ok('and conserves its volume', volume < -0.8, volume.toFixed(2));
  ok('the shadow tightens with it', shadow < -0.6, shadow.toFixed(2));
  await ctx.close();
}

// ---- The world answers how hard you scroll ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('lean: ' + e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1600);

  const lean = () =>
    p.evaluate(() => {
      const m = new DOMMatrixReadOnly(
        getComputedStyle(document.querySelector('[data-anim="mos-lean"]')).transform,
      );
      return { y: m.f, rot: (Math.atan2(m.b, m.a) * 180) / Math.PI };
    });

  ok('at rest there is no lean', Math.abs((await lean()).rot) < 0.4);
  const down = [];
  for (let i = 0; i < 20; i++) {
    await p.mouse.wheel(0, 130);
    down.push(await lean());
  }
  const peakDown = down.reduce((a, b) => (Math.abs(b.rot) > Math.abs(a.rot) ? b : a));
  ok(
    'scrolling makes Mos lean and lag',
    Math.abs(peakDown.rot) > 2 && Math.abs(peakDown.y) > 8,
    `rot ${peakDown.rot.toFixed(1)}deg y ${peakDown.y.toFixed(1)}px`,
  );

  await p.waitForTimeout(1000);
  ok('and it settles back', Math.abs((await lean()).rot) < 1);

  const up = [];
  for (let i = 0; i < 20; i++) {
    await p.mouse.wheel(0, -130);
    up.push(await lean());
  }
  const peakUp = up.reduce((a, b) => (Math.abs(b.rot) > Math.abs(a.rot) ? b : a));
  ok(
    'the lean follows the direction of travel',
    Math.sign(peakUp.rot) !== Math.sign(peakDown.rot),
    `${peakDown.rot.toFixed(1)} vs ${peakUp.rot.toFixed(1)}`,
  );
  await ctx.close();
}

await browser.close();
console.log('\n--- errors ---');
console.log(errors.length ? errors.join('\n') : 'none');
if (errors.length) process.exitCode = 1;
