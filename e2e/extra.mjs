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

await browser.close();
console.log('\n--- errors ---');
console.log(errors.length ? errors.join('\n') : 'none');
if (errors.length) process.exitCode = 1;
