import { chromium } from 'playwright-core';
import { chromePath } from './resolve-chrome.mjs';

const BASE = process.env.BASE ?? 'http://localhost:5199';
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
  await p.waitForTimeout(1400);
  return { ctx, p };
}

// ---- 1. the shell is the product's own deep-space chrome ----
{
  const { ctx, p } = await open();
  const shell = await p.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      theme: document.documentElement.dataset.theme,
      scheme: document.querySelector('meta[name="color-scheme"]')?.content,
      appBg: root.getPropertyValue('--app-bg').trim(),
      // Resolved through a probe rather than read raw: the production
      // minifier rewrites `rgb(15, 111, 218)` to `#0f6fda`, so comparing the
      // declaration text passes in dev and fails in the build.
      core: (() => {
        const el = document.createElement('span');
        el.style.color = 'var(--core-blue)';
        document.body.append(el);
        const v = getComputedStyle(el).color;
        el.remove();
        return v;
      })(),
      cyan: (() => {
        const el = document.createElement('span');
        el.style.color = 'var(--bright-cyan)';
        document.body.append(el);
        const v = getComputedStyle(el).color;
        el.remove();
        return v;
      })(),
      html: root.backgroundColor,
      // Hangul has no inter-word break rule; without keep-all the browser
      // splits words mid-token ("또 하 / 나의").
      breaking: getComputedStyle(document.body).wordBreak,
    };
  });
  ok('the shell is dark', shell.theme === 'dark' && shell.scheme === 'dark');
  ok('on the app-chrome ground', shell.appBg === '#07080c', shell.appBg);
  ok('html paints it too', shell.html === 'rgb(7, 8, 12)', shell.html);
  ok(
    'Core Blue and Bright Cyan are the accents',
    /15, 111, 218/.test(shell.core) && /49, 220, 220/.test(shell.cyan),
  );
  ok('Korean breaks between words, not inside them', shell.breaking === 'keep-all', shell.breaking);

  // Micro labels are Pretendard at 700/.1em, not a second family — Monitor
  // loads no mono face and neither should this.
  const eyebrow = await p
    .locator('.eyebrow')
    .first()
    .evaluate((e) => getComputedStyle(e));
  ok(
    'eyebrows are the brand face',
    /Pretendard/.test(eyebrow.fontFamily),
    eyebrow.fontFamily.slice(0, 30),
  );
  ok('and tracked out', eyebrow.letterSpacing !== 'normal', eyebrow.letterSpacing);
  await ctx.close();
}

// ---- 2. the world, and the one thing in it you can operate ----
{
  const { ctx, p } = await open();
  ok('the world is behind the page', (await p.locator('.world').count()) === 1);
  const layers = await p.locator('.world [data-px]').count();
  ok('it has depth layers', layers >= 5, `${layers}`);

  // The authored path is a placeholder for no-JS; the running scene replaces it
  // with a generated silhouette every frame.
  const d = await p.locator('[data-anim="mos-fill"]').getAttribute('d');
  ok('the silhouette is generated, not the authored one', !d.startsWith('M610.94'), d.slice(0, 14));
  ok(
    'and it is a closed curve',
    d.endsWith('Z') && d.split('C').length > 80,
    `${d.split('C').length} segments`,
  );

  // Regression guard. The hero is a full-viewport box sitting over Mos, so any
  // wrapper that claims the pointer makes Mos unpokeable — which has happened
  // twice, once via the section and once via its container.
  await p.locator('.poke').click({ timeout: 4000 });
  await p.waitForTimeout(500);
  const said = await p.locator('.world .say').innerText();
  ok(
    'Mos can be poked through the hero',
    said.trim().length > 0,
    JSON.stringify(said.slice(0, 20)),
  );
  await ctx.close();
}

// ---- 3. the console settles a goal before anything runs ----
{
  const { ctx, p } = await open();
  const s = p.locator('section.decide');
  await s.scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);

  ok('three goals to choose from', (await s.locator('.goal').count()) === 3);
  await s.locator('.goal').first().click();
  await p.waitForTimeout(300);
  ok('Mos asks before acting', (await s.locator('.opt').count()) === 2);
  ok('and nothing has run yet', (await s.locator('.run').count()) === 0);

  await s.locator('.opt').first().click();
  await p.waitForTimeout(700);
  ok('the agreed goal is shown back', (await s.locator('.agreed p').innerText()).includes('—'));
  ok('a delegated run walks its steps', (await s.locator('.steps li').count()) === 3);
  ok('and the island is told it is busy', (await s.locator('.dot.live').count()) === 1);

  await p.waitForTimeout(3200);
  const result = await s.locator('.result p').innerText();
  ok('a result comes back', result.trim().length > 10, JSON.stringify(result.slice(0, 24)));
  ok('and busy is cleared', (await s.locator('.dot.live').count()) === 0);
  const spent = await s.locator('.spent').innerText();
  ok('the run is charged after it finishes', /12/.test(spent), spent);

  // The other shape: Mos answers directly, with no Mon and no steps.
  await s.locator('.again').click();
  await p.waitForTimeout(250);
  await s.locator('.goal').nth(1).click();
  await p.waitForTimeout(250);
  await s.locator('.opt').first().click();
  await p.waitForTimeout(1400);
  ok('a direct answer has no steps', (await s.locator('.steps').count()) === 0);
  ok('and costs less', /4/.test(await s.locator('.spent').innerText()));
  await ctx.close();
}

// ---- 4. the patrol reads sentences ----
{
  const { ctx, p } = await open();
  const s = p.locator('section.watch');
  await s.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);

  const lines = await s.locator('.lines li').allInnerTexts();
  ok('the memo starts with real rules', lines.length === 3, `${lines.length}`);
  ok(
    'written as sentences, not conditions',
    lines.every((t) => t.trim().length > 8),
    JSON.stringify(lines[0]?.slice(0, 22)),
  );

  await s.locator('.add input').fill('배포가 실패하면 알려 줘');
  await s.locator('.add button').click();
  await p.waitForTimeout(300);
  ok('a line can be added', (await s.locator('.lines li').count()) === 4);
  await s.locator('.lines li').last().locator('.x').click();
  await p.waitForTimeout(250);
  ok('and removed', (await s.locator('.lines li').count()) === 3);

  ok('the trace is a sampler', (await s.locator('.trace span').count()) === 28);
  const first = s.locator('.switch').first();
  ok('a booked job starts on', (await first.getAttribute('aria-checked')) === 'true');
  await first.click();
  await p.waitForTimeout(250);
  ok('and can be switched off', (await first.getAttribute('aria-checked')) === 'false');
  await ctx.close();
}

// ---- 5. a specialist is assembled from parts ----
{
  const { ctx, p } = await open();
  const s = p.locator('section.make');
  await s.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);

  ok('five ports', (await s.locator('.ports li').count()) === 5);
  ok('all empty to begin with', (await s.locator('.ports li.filled').count()) === 0);
  for (const i of [0, 2, 4, 6, 8]) await s.locator('.chip').nth(i).click();
  await p.waitForTimeout(400);
  ok('plugging a part fills its port', (await s.locator('.ports li.filled').count()) === 5);
  ok('and the tally counts them', /5/.test(await s.locator('.tally span').first().innerText()));

  // The three tiers carry the wireframe's own per-run figures.
  const est = async () => (await s.locator('.core-est').innerText()).replace(/\D/g, '');
  ok('the middle tier estimates 14', (await est()) === '14');
  await s.locator('.tier').nth(2).click();
  await p.waitForTimeout(300);
  ok('the deep tier estimates 28', (await est()) === '28');
  await s.locator('.tier').nth(0).click();
  await p.waitForTimeout(300);
  ok('the fast tier estimates 4', (await est()) === '4');
  await ctx.close();
}

// ---- 6. the Hub price is the maker's decision ----
{
  const { ctx, p } = await open();
  const s = p.locator('section.share');
  await s.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);

  ok('three ways to price it', (await s.locator('.mode').count()) === 3);
  const price = () => s.locator('.price').innerText();
  await s.locator('.mode').nth(1).click();
  await p.waitForTimeout(200);
  ok('a paid Mon lists a per-run range', /28~42/.test(await price()), await price());
  await s.locator('.mode').nth(2).click();
  await p.waitForTimeout(200);
  ok('a Skill lists a single purchase', /120/.test(await price()), await price());

  const peers = await s.locator('.peers .card .by').allInnerTexts();
  ok(
    'peer rows carry real Hub figures',
    peers.length === 3 && peers.every((t) => /Mos \d\d/.test(t)),
    peers[0],
  );
  await ctx.close();
}

// ---- 7. the two payments, and the arithmetic behind them ----
{
  const { ctx, p } = await open();
  const s = p.locator('section.cost');
  await s.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);

  const plans = await s.locator('.plan-n').allInnerTexts();
  ok(
    "the three plans are the product's own",
    plans.join(',') === 'Ground,Plot,Parcel',
    plans.join(','),
  );
  const prices = await s.locator('.plan-p').allInnerTexts();
  ok(
    'at their own prices',
    /\$0/.test(prices[0]) && /\$18/.test(prices[1]) && /\$48/.test(prices[2]),
    prices.join(' '),
  );

  // 100 Mana ≈ $1, and the bonus ladder is 5 / 8 / 12 % — rounded to the
  // nearest 100, which is why 3,000 pays 200 rather than 240.
  const slider = s.locator('input[type=range]');
  for (const [amount, total, usd] of [
    ['1000', '1,000', '$10'],
    ['2000', '2,100', '$20'],
    ['3000', '3,200', '$30'],
    ['5000', '5,600', '$50'],
  ]) {
    await slider.fill(amount);
    await p.waitForTimeout(150);
    const t = await s.locator('.total').innerText();
    const u = await s.locator('.usd').innerText();
    ok(`${amount} Mana adds up`, t.includes(total) && u === usd, `${t} / ${u}`);
  }
  await ctx.close();
}

// ---- 8. the email capture, which is the point of the page ----
{
  const { ctx, p } = await open();
  const field = p.locator('.hero input[type="email"]');
  const box = await field.boundingBox();
  ok(
    'the field is above the fold',
    box.y + box.height < 900,
    `bottom ${Math.round(box.y + box.height)}`,
  );

  const attrs = await field.evaluate((i) => ({
    type: i.type,
    name: i.name,
    auto: i.autocomplete,
    spell: i.spellcheck,
    labelled: !!document.querySelector(`label[for="${i.id}"]`),
  }));
  ok('it is a real email field', attrs.type === 'email' && attrs.name === 'email');
  ok('it autofills and does not spellcheck', attrs.auto === 'email' && attrs.spell === false);
  ok('it has a label', attrs.labelled);

  // The page carries the form twice, so the generated ids have to differ or one
  // of the two labels points at the wrong field.
  const ids = await p.locator('input[type="email"]').evaluateAll((els) => els.map((e) => e.id));
  ok('both forms have distinct ids', ids.length === 2 && ids[0] !== ids[1], ids.join(' / '));
  ok('one h1', (await p.locator('main h1').count()) === 1);

  const consent = await p.locator('.hero input[type="checkbox"]').count();
  ok('consent is on the first form', consent === 1);
  await ctx.close();
}

// ---- 9. reduced motion gets the finished frame ----
{
  const { ctx, p } = await open('/', { reducedMotion: 'reduce' });
  const hidden = await p
    .locator('main .head, main .hud, main .ache, main h1, main h2')
    .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) < 0.9).length);
  ok('nothing is left hidden', hidden === 0, `${hidden} under-opaque`);
  // The resting silhouette is still emitted, so the scene is composed.
  const d = await p.locator('[data-anim="mos-fill"]').getAttribute('d');
  ok('the silhouette is still painted', !d.startsWith('M610.94') && d.endsWith('Z'));
  ok(
    'and no cursor takeover',
    !(await p.evaluate(() => document.documentElement.classList.contains('orb-cursor'))),
  );
  await ctx.close();
}

// ---- 10. a phone gets the same document, at its real width ----
//
// Deliberately no `isMobile`: that option rewrites the viewport — 320x568
// becomes 402x714 — so this used to pass by testing a width no phone has, and
// missed a real 82px horizontal overflow at 320px.
for (const [w, h] of [
  [320, 568],
  [360, 640],
  [390, 844],
  [430, 932],
]) {
  const { ctx, p } = await open('/', { viewport: { width: w, height: h }, hasTouch: true });
  ok(`${w}px: every section survives`, (await p.locator('section').count()) >= 6);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(`${w}px: nothing overflows sideways`, over <= 0, `${over}px wider than the viewport`);
  const field = await p.locator('.hero input[type="email"]').boundingBox();
  ok(
    `${w}px: the field is above the fold`,
    field.y + field.height < h,
    `bottom ${Math.round(field.y + field.height)}`,
  );
  // The gloss is required on first use, so it cannot start life invisible —
  // which is what a scroll-reveal inset wider than the gap to the fold caused.
  const glossOpacity = await p
    .locator('.hero .gloss')
    .evaluate((e) => Number(getComputedStyle(e).opacity));
  ok(`${w}px: the gloss line is visible at rest`, glossOpacity > 0.9, `${glossOpacity}`);
  await ctx.close();
}

// ---- 11. three locales, each complete ----
for (const [path, h1, lang] of [
  ['/', '내 AI가 자라는 세계', 'ko'],
  ['/en', 'A world where my AI grows up', 'en'],
  ['/ja', 'わたしのAIが育つ世界', 'ja'],
]) {
  const { ctx, p } = await open(path);
  ok(
    `${lang} opening copy`,
    (await p.locator('main h1').innerText()) === h1,
    JSON.stringify(await p.locator('main h1').innerText()),
  );
  ok(
    `${lang} stamps <html lang>`,
    (await p.evaluate(() => document.documentElement.lang)) === lang,
  );
  const memos = await p.locator('section.watch .lines li').allInnerTexts();
  ok(
    `${lang} patrol rules translated`,
    memos.length === 3 && memos.every((t) => t.trim()),
    JSON.stringify(memos[0]?.slice(0, 18)),
  );
  const goals = await p.locator('section.decide .goal').allInnerTexts();
  ok(`${lang} goals translated`, goals.length === 3 && goals.every((t) => t.trim()));
  await ctx.close();
}

await browser.close();
console.log('\n--- console/page errors ---');
console.log(errors.length ? errors.join('\n') : 'none');
if (errors.length) process.exitCode = 1;
