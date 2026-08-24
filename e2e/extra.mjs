import { chromium } from 'playwright-core';
import { chromePath } from './resolve-chrome.mjs';

const EXEC = chromePath();
const BASE = 'http://localhost:5199';
const errors = [];
const browser = await chromium.launch({ executablePath: EXEC });
function ok(l, c, e = '') {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${e ? '  ' + e : ''}`);
  if (!c) process.exitCode = 1;
}

// ---- Gather still fires once you read down to the closing line ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('gather: ' + e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);

  await p.evaluate(() => {
    const f = document.querySelector('.drift .field');
    window.scrollTo({
      top: f.getBoundingClientRect().top + window.scrollY - 90,
      behavior: 'instant',
    });
  });
  // Dwell (3.2s) + the gather timeline itself.
  await p.waitForTimeout(6200);

  const hint = await p.locator('.drift .hint').evaluate((e) => Number(getComputedStyle(e).opacity));
  ok('gather fires at the closing line', hint < 0.2, `hint opacity ${hint}`);
  const faded = await p
    .locator('.drift .shard')
    .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) < 0.2).length);
  ok('shards taken by Mos', faded >= 5, `${faded}/6 faded`);
  await ctx.close();
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

  await p.fill('#wl-email', 'someone@example.com');
  await p.locator('.hero input[type="checkbox"]').check();
  await p.locator('.hero button[type="submit"]').click();
  await p.waitForTimeout(1800);

  ok('arrival screen replaces the flow', (await p.locator('.arrival').count()) === 1);
  ok('hero is gone', (await p.locator('.hero').count()) === 0);
  const mosD = await p.locator('.arrival [data-anim="mos-fill"]').getAttribute('d');
  ok('Mos drawn on arrival', !!mosD && mosD.length > 200);
  const happy = await p
    .locator('.arrival [data-face="happy"]')
    .evaluate((e) => Number(getComputedStyle(e).opacity));
  ok('Mos is happy on arrival', happy > 0.5, `opacity ${happy}`);
  const mons = await p
    .locator('.arrival .mon-join')
    .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) > 0.8).length);
  ok('three Mon join', mons === 3, `${mons} visible`);
  ok('welcome-email line shown', (await p.locator('.arrival .reward').count()) === 1);
  ok('survey offered', (await p.locator('.arrival .survey').count()) === 1);

  // Survey submit path
  await p.route('**/api/waitlist/survey', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await p.locator('.arrival .survey button:has-text("보내기")').click();
  await p.waitForTimeout(900);
  ok('survey thank-you shown', (await p.locator('.arrival .done').count()) === 1);
  await ctx.close();
}

await browser.close();
console.log('\n--- errors ---');
console.log(errors.length ? errors.join('\n') : 'none');
if (errors.length) process.exitCode = 1;
