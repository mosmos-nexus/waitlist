import { chromium } from 'playwright-core';
import { chromePath } from './resolve-chrome.mjs';

const BASE = 'http://localhost:5199';
const errors = [];
const browser = await chromium.launch({ executablePath: chromePath() });

function ok(label, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`);
  if (!cond) process.exitCode = 1;
}

/** Open the page and return the journey's scrub span. */
async function open(o = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...o });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => {
    // Vercel's analytics scripts 404 outside a Vercel deploy and the console
    // message carries no URL, so they cannot be filtered by name.
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1600);
  const h = (o.viewport ?? { height: 900 }).height;
  const track = await p.locator('.journey').evaluate((e) => e.getBoundingClientRect().height);
  return { ctx, p, span: track - h };
}

/** Scroll to a fraction of the journey and let the frame settle. */
async function at(p, span, t, settle = 800) {
  // `behavior: 'instant'` on purpose: the page sets `scroll-behavior: smooth`,
  // so a plain `scrollTo` animates and every sample lands short of its target.
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(span * t));
  await p.waitForTimeout(settle);
}

// ---- 1. the world is drawn, and it is alive ----
{
  const { ctx, p } = await open();

  const crown = await p.locator('.journey [data-isle="crown"]').first().getAttribute('d');
  const mass = await p.locator('.journey [data-isle="mass"]').first().getAttribute('d');
  ok('island crown generated', !!crown && crown.length > 400, `${(crown || '').length} chars`);
  ok('island mass generated', !!mass && mass.length > 300, `${(mass || '').length} chars`);
  // The island runs the same engine as its inhabitants, so its outline is a
  // curve list, never a polygon or a straight-edged plate.
  ok('the island is all curves', !/[LlHhVv]\d/.test(crown ?? ''), 'no line segments');

  const mos = await p.locator('.journey [data-anim="mos-fill"]').getAttribute('d');
  ok('Mos silhouette generated', !!mos && mos.length > 400, `${(mos || '').length} chars`);

  const before = crown;
  await p.waitForTimeout(1400);
  const after = await p.locator('.journey [data-isle="crown"]').first().getAttribute('d');
  ok('the island breathes', before !== after);

  ok('the journey is pinned', (await p.locator('.journey[data-pinned]').count()) === 1);
  ok('mana cursor rendered', (await p.locator('.mana-layer').count()) === 1);
  const cur = await p.evaluate(() => getComputedStyle(document.body).cursor);
  ok('native cursor hidden', cur === 'none', cur);
  await ctx.close();
}

// ---- 2. poking Mos still answers ----
{
  const { ctx, p } = await open();
  const line = () => p.locator('.journey .say-line').innerText();
  const first = await line();
  // Mos never stops moving (island buoyancy plus its own float), so Playwright's
  // stability check can never pass on it.
  await p.locator('.journey .mos-drive button.hit').click({ force: true });
  await p.waitForTimeout(700);
  ok('poke swaps Mos line', (await line()) !== first, JSON.stringify((await line()).slice(0, 18)));
  const happy = await p
    .locator('.journey .mos-drive [data-face="happy"]')
    .evaluate((e) => Number(getComputedStyle(e).opacity));
  ok('poke shows happy face', happy > 0.5, `opacity ${happy}`);
  await ctx.close();
}

// ---- 3. scroll moves the world ----
{
  const { ctx, p, span } = await open();
  const isle = () =>
    p.locator('.journey [data-drive="isle"]').evaluate((e) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(e).transform);
      return { y: Math.round(m.f), s: Number(m.a.toFixed(3)) };
    });

  const a = await isle();
  await at(p, span, 0.45);
  const b = await isle();
  await at(p, span, 0.9);
  const c = await isle();
  ok('the island rises with scroll', a.y > b.y && b.y > c.y, `${a.y} → ${b.y} → ${c.y}`);
  ok('and settles back as it goes', a.s > b.s && b.s > c.s, `${a.s} → ${b.s} → ${c.s}`);

  // Scrubbed, not triggered: coming back up restores the frame.
  await at(p, span, 0);
  const back = await isle();
  ok('scrolling back rewinds it', Math.abs(back.y - a.y) < 3, `${back.y} vs ${a.y}`);
  await ctx.close();
}

// ---- 4. the burden: tasks ring Mos, then Mos takes them ----
{
  const { ctx, p, span } = await open();
  const vis = () =>
    p
      .locator('.journey [data-task]')
      .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) > 0.3).length);

  await at(p, span, 0.22);
  const up = await vis();
  ok('every task is on the ring', up === 6, `${up}/6 visible`);
  await at(p, span, 0.39);
  const left = await vis();
  ok('Mos takes them all', left === 0, `${left} left`);
  await ctx.close();
}

// ---- 5. delegation: both ways, and the work lands ----
{
  const { ctx, p, span } = await open();
  await at(p, span, 0.62, 1000);

  const crew = await p
    .locator('.journey [data-crew]')
    .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) > 0.5).length);
  ok('the crew is out', crew >= 3, `${crew}/4`);

  const lanes = await p
    .locator('.journey [data-crew]')
    .evaluateAll((els) => els.map((e) => e.dataset.lane));
  ok('both delegation shapes are shown', new Set(lanes).size === 2, lanes.join(','));

  const handoff = await p.locator('.journey .wire.handoff').count();
  ok('the serial pair hands off directly', handoff >= 1, `${handoff} handoff wire(s)`);

  await at(p, span, 0.7, 1000);
  const arts = await p
    .locator('.journey [data-artifact]')
    .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) > 0.6).length);
  ok('the work reaches Storage', arts === 4, `${arts}/4 landed`);
  await ctx.close();
}

// ---- 6. circulation: the four real surfaces ----
{
  const { ctx, p, span } = await open();
  await at(p, span, 0.82, 1000);
  const names = await p.locator('.journey [data-ring] .name').allInnerTexts();
  ok(
    'the ring is the four product surfaces',
    names.join(',') === 'Monitor,Hub,Inventory,Studio',
    names.join(','),
  );
  const plates = await p
    .locator('.journey [data-ring] .card')
    .evaluateAll((els) => els.map((e) => e.dataset.plate));
  ok(
    'Monitor is dark, the workshop is light',
    plates.filter((t) => t === 'dark').length === 1 &&
      plates.filter((t) => t === 'light').length === 3,
    plates.join(','),
  );
  await ctx.close();
}

// ---- 7. a phone gets the same story, stacked ----
{
  const { ctx, p, span } = await open({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  ok('island kept on mobile', (await p.locator('.journey [data-isle="crown"]').count()) >= 1);
  ok('Mos renders on mobile', (await p.locator('.journey [data-anim="mos-fill"]').count()) === 1);
  const cur = await p.evaluate(() => getComputedStyle(document.body).cursor);
  ok('no cursor takeover on touch', cur === 'auto', cur);
  await at(p, span, 0.62, 1000);
  const crew = await p
    .locator('.journey [data-crew]')
    .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) > 0.5).length);
  ok('the crew appears on mobile too', crew >= 3, `${crew}/4`);
  await ctx.close();
}

// ---- 8. reduced motion gets a document, not a scrubbed scene ----
{
  const { ctx, p } = await open({ reducedMotion: 'reduce' });
  ok('reduced motion does not pin', (await p.locator('.journey[data-pinned]').count()) === 0);
  const acts = await p
    .locator('.journey [data-act]')
    .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) > 0.9).length);
  ok('every act is readable at once', acts === 5, `${acts}/5 visible`);
  const d = await p.locator('.journey [data-isle="crown"]').first().getAttribute('d');
  ok('reduced motion still draws the island', !!d && d.length > 400);
  const mos = await p.locator('.journey [data-anim="mos-fill"]').getAttribute('d');
  ok('reduced motion still draws Mos', !!mos && mos.length > 400);
  const cur = await p.evaluate(() => getComputedStyle(document.body).cursor);
  ok('reduced motion keeps native cursor', cur === 'auto', cur);
  await ctx.close();
}

// ---- 9. locales ----
for (const [path, probe, label] of [
  ['/en', 'The AI that ge', 'en'],
  ['/ja', '使うほど', 'ja'],
]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const h1 = await p.locator('.journey h1').first().innerText();
  ok(`${label} opening copy`, h1.includes(probe), JSON.stringify(h1.slice(0, 22)));
  await ctx.close();
}

await browser.close();
console.log('\n--- console/page errors ---');
console.log(errors.length ? errors.join('\n') : 'none');
if (errors.length) process.exitCode = 1;
