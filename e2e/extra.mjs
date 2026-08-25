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
