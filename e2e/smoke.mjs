import { chromium } from 'playwright-core';
import { chromePath } from './resolve-chrome.mjs';

const BASE = 'http://localhost:5199';
const errors = [];
const browser = await chromium.launch({ executablePath: chromePath() });

function ok(label, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`);
  if (!cond) process.exitCode = 1;
}

async function open(path = '/', o = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...o });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => {
    // Vercel's analytics scripts 404 off a Vercel deploy and the console message
    // carries no URL, so they cannot be filtered by name.
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  return { ctx, p };
}

// ---- 1. the page is the wireframes' paper, not a dark world ----
{
  const { ctx, p } = await open();
  const paint = await p.evaluate(() => {
    const cs = getComputedStyle(document.body);
    return {
      bg: cs.backgroundColor,
      theme: document.documentElement.dataset.theme,
      scheme: document.querySelector('meta[name="color-scheme"]')?.content,
      accent: getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-normal')
        .trim(),
    };
  });
  ok('the page is paper', paint.bg === 'rgb(239, 237, 232)', paint.bg);
  ok('the theme is declared', paint.theme === 'paper' && paint.scheme === 'light');
  ok('one burnt-orange accent', paint.accent === '#c2660f', paint.accent);

  // Micro labels are set in IBM Plex Mono in every wireframe.
  const eyebrow = await p
    .locator('.eyebrow')
    .first()
    .evaluate((e) => getComputedStyle(e).fontFamily);
  ok('eyebrows are monospace', /IBM Plex Mono/.test(eyebrow), eyebrow.slice(0, 28));
  // Plex carries no Hangul, so Pretendard has to sit directly behind it or
  // Korean drops to a system mono and spaces badly.
  ok(
    'Korean falls back to the brand face, not a system mono',
    /IBM Plex Mono.*Pretendard/.test(eyebrow),
    eyebrow.slice(0, 56),
  );
  await ctx.close();
}

// ---- 2. every section the product needs ----
{
  const { ctx, p } = await open();
  ok('one h1', (await p.locator('main h1').count()) === 1);
  for (const [sel, label] of [
    ['section.hero', 'hero'],
    ['section.joy', 'character sheet'],
    ['section.flow', 'handover'],
    ['section.watch', 'watch'],
    ['section.map', 'surface map'],
    ['section.rev', 'reviews'],
  ]) {
    ok(`${label} is present`, (await p.locator(sel).count()) === 1);
  }
  await ctx.close();
}

// ---- 3. the facts on the page are the wireframes' facts ----
{
  const { ctx, p } = await open();

  // Hub's arithmetic: a paid Mon is 10 fixed plus the tokens it used.
  const cost = await p.locator('section.flow .cost').innerText();
  const total = cost.match(/(\d+)~(\d+)/);
  const token = cost.match(/(\d+)~(\d+)/g)?.[1]?.match(/(\d+)~(\d+)/);
  ok('the cost card shows a total', !!total, total?.[0]);
  ok('and breaks it down', /\b10\b/.test(cost) && !!token, token?.[0]);
  ok(
    'the breakdown adds up to the total',
    !!total && !!token && +total[1] === 10 + +token[1] && +total[2] === 10 + +token[2],
    `${total?.[0]} = 10 + ${token?.[0]}`,
  );

  // Heartbeat rules are sentences, which is the whole point of the section.
  const memos = await p.locator('section.watch .memo li').allInnerTexts();
  ok('four watch rules', memos.length === 4, `${memos.length}`);
  ok(
    'they are written as sentences',
    memos.every((t) => t.trim().length > 8),
    memos[1],
  );

  // Every surface states what it will not do.
  ok('five surfaces', (await p.locator('section.map .cell').count()) === 5);
  ok('each names its boundary', (await p.locator('section.map .no-k').count()) === 5);
  const names = await p.locator('section.map .n').allInnerTexts();
  ok(
    "the five are the product's own",
    names.join(',') === 'Monitor,Hub,Inventory,Storage,Studio',
    names.join(','),
  );

  // The character sheet is the product's most unusual fact.
  ok('the sheet has three groups', (await p.locator('section.joy .row').count()) === 3);
  ok('and both modes', (await p.locator('section.joy .seg-i').count()) === 2);
  await ctx.close();
}

// ---- 4. the email capture works from the top of the page ----
{
  const { ctx, p } = await open();
  const box = await p.locator('.hero input[type="email"]').boundingBox();
  ok(
    'the field is above the fold',
    box.y + box.height < 900,
    `bottom ${Math.round(box.y + box.height)}`,
  );
  const attrs = await p.locator('.hero input[type="email"]').evaluate((i) => ({
    type: i.type,
    name: i.name,
    auto: i.autocomplete,
    spell: i.spellcheck,
    labelled: !!document.querySelector(`label[for="${i.id}"]`),
  }));
  ok('the field is a real email field', attrs.type === 'email' && attrs.name === 'email');
  ok('it autofills and does not spellcheck', attrs.auto === 'email' && attrs.spell === false);
  ok('it has a label', attrs.labelled);
  await ctx.close();
}

// ---- 5. reduced motion gets the finished frame ----
{
  const { ctx, p } = await open('/', { reducedMotion: 'reduce' });
  const hidden = await p
    .locator('main .head, main .cell, main .cost, main .sheet')
    .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) < 0.9).length);
  ok('nothing is left hidden', hidden === 0, `${hidden} under-opaque`);
  await ctx.close();
}

// ---- 6. a phone gets the same document ----
{
  const { ctx, p } = await open('/', {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  ok('sections survive the narrow layout', (await p.locator('section.map .cell').count()) === 5);
  await p.evaluate(() => window.scrollTo({ left: 9999, top: 0, behavior: 'instant' }));
  ok('never pans sideways', (await p.evaluate(() => window.scrollX)) === 0);
  await ctx.close();
}

// ---- 7. locales ----
for (const [path, probe, label] of [
  ['/en', 'The AI that ge', 'en'],
  ['/ja', '使うほど', 'ja'],
]) {
  const { ctx, p } = await open(path);
  const h1 = await p.locator('main h1').first().innerText();
  ok(`${label} opening copy`, h1.includes(probe), JSON.stringify(h1.slice(0, 22)));
  // The wireframe-sourced copy has to exist in every locale, not only Korean.
  const memos = await p.locator('section.watch .memo li').allInnerTexts();
  ok(
    `${label} watch rules translated`,
    memos.length === 4 && memos.every((t) => t.trim()),
    memos[1],
  );
  await ctx.close();
}

await browser.close();
console.log('\n--- console/page errors ---');
console.log(errors.length ? errors.join('\n') : 'none');
if (errors.length) process.exitCode = 1;
