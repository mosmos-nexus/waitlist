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
  // The charge line says *when* it is charged, never *how much*. What a run
  // costs in Mana is set by a coefficient the monetization strategy still
  // lists as an open experiment, so a figure here would be an invented price.
  const spent = await s.locator('.spent').innerText();
  ok('the run is charged after it finishes', spent.trim().length > 4, spent);
  ok('and names no figure', !/\d/.test(spent), spent);

  // Mos orchestrates and never executes: it settles the goal and reports back,
  // and the middle step — the one that runs — is always a Mon. The section used
  // to run one of the three goals on Mos directly.
  const actors = await s.locator('.steps .by').allInnerTexts();
  ok('the run is walked by three actors', actors.length === 3, actors.join(','));
  ok('and only the middle one is the Mon', actors[1] !== actors[0] && actors[1] !== actors[2]);
  const monClass = await s.locator('.steps li').nth(1).locator('.by.mon').count();
  ok('the executing step is marked as the Mon', monClass === 1);

  // The other shape: Mos answers directly, with no Mon and no steps.
  await s.locator('.again').click();
  await p.waitForTimeout(250);
  await s.locator('.goal').nth(1).click();
  await p.waitForTimeout(250);
  await s.locator('.opt').first().click();
  await p.waitForTimeout(1400);
  // Every goal is delegated now, so every goal walks the same steps. Nothing
  // resolves on Mos.
  ok('a second goal also delegates', (await s.locator('.steps li').count()) === 3);
  ok('and names a Mon', (await s.locator('.runner .kind b').innerText()).trim().length > 1);
  ok('and still names no figure', !/\d/.test(await s.locator('.spent').innerText()));
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

// ---- 5. Studio: nothing that has no choice in it is a control ----
{
  const { ctx, p } = await open();
  const s = p.locator('section.make');
  await s.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);

  // What goes in and comes out is the same for every Mon, so those two are
  // read-only rails. If a control ever appears inside one, the section has gone
  // back to asking the visitor to make a decision that does not exist.
  ok('two read-only rails', (await s.locator('.rails .rail').count()) === 2);
  ok(
    'and neither holds a control',
    (await s.locator('.rails .rail button, .rails .rail input, .rails .rail a').count()) === 0,
  );

  // Nothing is wired to begin with.
  ok('no tool nodes to begin with', (await s.locator('.nodes li').count()) === 0);
  ok('and no documents either', (await s.locator('.board .doc').count()) === 0);

  // A connector attaches from the palette and wires into the core.
  const firstCard = (await s.locator('.palette .card-n').first().innerText()).trim();
  await s.locator('.palette .card').first().click();
  await p.waitForTimeout(350);
  ok('attaching a tool adds a node', (await s.locator('.nodes li').count()) === 1);
  const nodeName = (await s.locator('.nodes .node-n').first().innerText()).trim();
  ok('and the node names what was attached', nodeName === firstCard, `${nodeName} / ${firstCard}`);
  ok('the core counts what feeds it', (await s.locator('.core .badge').innerText()) === '1');
  await s.locator('.nodes .off').first().click();
  await p.waitForTimeout(300);
  ok('detaching removes the node', (await s.locator('.nodes li').count()) === 0);
  ok('and the count goes with it', (await s.locator('.core .badge').count()) === 0);

  // A Mon Skill lands among the documents, never among the tool nodes.
  await s.locator('.tabs .tab').last().click();
  await p.waitForTimeout(250);
  await s.locator('.palette .card').first().click();
  await p.waitForTimeout(350);
  ok('a Mon Skill lands in the document area', (await s.locator('.board .doc').count()) === 1);
  ok('and not among the tool nodes', (await s.locator('.nodes li').count()) === 0);

  // Attaching a tool that has settings opens them — the no-code moment. And a
  // required setting left unset has to stay visible on the node itself.
  await s.locator('.tabs .tab').nth(2).click(); // 찾기 / find
  await p.waitForTimeout(200);
  const cards = await s.locator('.palette .card-n').allInnerTexts();
  const readerIdx = cards.length - 1; // page reading is the required one
  await s.locator('.palette .card').nth(readerIdx).click();
  await p.waitForTimeout(350);
  ok('a tool with settings opens its panel', (await s.locator('.palette .cfg').count()) === 1);
  ok('and the panel says the setting is required', (await s.locator('.cfg .req').count()) === 1);
  ok('the node warns until it is set', (await s.locator('.nodes li.warn').count()) === 1);
  await s.locator('.cfg .opts .opt').first().click();
  await p.waitForTimeout(300);
  ok('choosing a value clears the warning', (await s.locator('.nodes li.warn').count()) === 0);
  const nodeState = await s.locator('.nodes li').last().locator('.node-s').innerText();
  ok('and the node shows what was chosen', nodeState.trim().length > 1, nodeState);
  await s.locator('.cfg .back').click();
  await p.waitForTimeout(250);
  ok('the list comes back', (await s.locator('.palette .cards').count()) === 1);

  // Group counts, so the palette reports its own state.
  const counts = await s.locator('.tabs .tab .n').allInnerTexts();
  ok('every group carries a count', counts.length === 5, counts.join(','));
  ok(
    'and they add up to what is attached',
    counts.reduce((n, t) => n + Number(t), 0) === (await s.locator('.nodes li, .doc').count()),
    counts.join(','),
  );

  // A Mon Skill is a document, not a second kind of agent. Its board entry has
  // to name its parts rather than look like a tool node.
  await s.locator('.tabs .tab').last().click();
  await p.waitForTimeout(250);
  ok(
    'the Skill tab explains the two nouns apart',
    (await s.locator('.palette .what div').count()) === 2,
  );
  const doc = s.locator('.board .doc');
  ok('the attached Skill is drawn as a document', (await doc.count()) === 1);
  ok('with its parts named', (await doc.locator('.doc-parts div').count()) === 3);
  ok(
    'and it says it does not run on its own',
    (await doc.locator('.doc-note').innerText()).trim().length > 4,
  );
  ok('a Skill is never a tool node', (await s.locator('.nodes li .doc-tag').count()) === 0);

  // Every palette group carries something, so no tab is a dead end.
  const tabs = await s.locator('.tabs .tab').count();
  ok('five palette groups', tabs === 5, String(tabs));
  let emptyGroups = 0;
  for (let i = 0; i < tabs; i++) {
    await s.locator('.tabs .tab').nth(i).click();
    await p.waitForTimeout(150);
    if ((await s.locator('.palette .card').count()) === 0) emptyGroups++;
  }
  ok('and none of them is empty', emptyGroups === 0);

  // The prompt is three pieces plus a read-only join of them. The join has to
  // be derived, not a fourth stored body, or the two can disagree.
  ok('three prompt pieces plus a join', (await s.locator('.ptabs .ptab').count()) === 4);
  const bodyOf = async (i) => {
    await s.locator('.ptabs .ptab').nth(i).click();
    await p.waitForTimeout(200);
    return (await s.locator('.pbody').innerText()).trim();
  };
  const pieces = [await bodyOf(0), await bodyOf(1), await bodyOf(2)];
  ok('each piece reads differently', new Set(pieces).size === 3);
  ok(
    'the numbered piece keeps its line breaks',
    pieces.some((t) => /\n\s*2\./.test(t)),
  );
  const all = await bodyOf(3);
  ok(
    'the join contains every piece',
    pieces.every((t) => all.includes(t)),
    `${all.length} chars`,
  );
  ok('and the join is read-only', (await s.locator('.pbody.joined textarea').count()) === 0);

  // Guards and I/O parts are gone — they were categories this page invented.
  const body = await s.innerText();
  ok('no guard category remains', !/안전장치|Guardrail/i.test(body));

  // The brain changes what a run costs, and says so as a level rather than a
  // number — the per-run Mana coefficient is not decided yet.
  const level = async () => (await s.locator('.tiers .tier.on .tier-m').innerText()).trim();
  const mid = await level();
  await s.locator('.tiers .tier').nth(2).click();
  await p.waitForTimeout(300);
  const deep = await level();
  await s.locator('.tiers .tier').nth(0).click();
  await p.waitForTimeout(300);
  const fast = await level();
  ok(
    'each brain reads differently',
    new Set([mid, deep, fast]).size === 3,
    [fast, mid, deep].join(' / '),
  );
  ok('and none of them quotes a figure', ![mid, deep, fast].some((t) => /\d/.test(t)));
  await ctx.close();
}

// ---- 5b. the early-team ask is on the page ----
{
  const { ctx, p } = await open();
  const s = p.locator('section.recruit');
  await s.scrollIntoViewIfNeeded();
  // Long enough for the entrance to settle. The panel reveals with
  // `scale: true`, and a scaled ancestor shrinks every box inside it — measured
  // 43.86px for a control whose computed height is exactly 44.
  await p.waitForTimeout(1400);
  ok('the recruit block renders', (await s.count()) === 1);
  ok('three roles, each with who it is for', (await s.locator('.roles li').count()) === 3);
  const whos = await s.locator('.role-w').allInnerTexts();
  ok(
    'and none of those lines is empty',
    whos.every((t) => t.trim().length > 4),
  );
  const link = s.locator('a.go');
  ok('it links out in a new tab', (await link.getAttribute('target')) === '_blank');
  ok('with rel set', /noopener/.test(await link.getAttribute('rel')));
  const box = await link.boundingBox();
  ok('and the link clears the target floor', box.height >= 44, `${Math.round(box.height)}px`);
  await ctx.close();
}

// ---- 6. the Hub price is the maker's decision ----
{
  const { ctx, p } = await open();
  const s = p.locator('section.share');
  await s.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);

  ok('three ways to be paid back', (await s.locator('.mode').count()) === 3);
  const price = () => s.locator('.price').innerText();
  const modes = await s.locator('.mode-n').allInnerTexts();
  await s.locator('.mode').nth(1).click();
  await p.waitForTimeout(200);
  ok('the listing follows the choice', (await price()).trim() === modes[1].trim(), await price());
  await s.locator('.mode').nth(2).click();
  await p.waitForTimeout(200);
  ok('and follows it again', (await price()).trim() === modes[2].trim(), await price());

  // Hub trading, creator payout and certification are all inactive at the MVP
  // stage this page announces, so a rating, a run count or a Mana price on a
  // peer row would be describing something that does not exist yet.
  const peers = await s.locator('.peers .card .by').allInnerTexts();
  ok(
    'peer rows say what a Mon does, not what it earns',
    peers.length === 3 && peers.every((t) => t.trim().length > 4 && !/[\d★]/.test(t)),
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
  // Every plan says the price is not set, because it is not: subscription
  // price, USD-to-Mana rate, top-up bonuses and storage caps are all listed as
  // open experiments. The page showed $0 / $18 / $48 and "100 Mana ~ $1",
  // none of which came from anywhere but a wireframe.
  const tbd = await s.locator('.plan-tbd').allInnerTexts();
  ok('each plan says the price is not set', tbd.length === 3 && tbd.every((t) => t.trim()));

  const body = await s.innerText();
  ok(
    'and the section quotes no money at all',
    !/[$₩¥€]\s?\d/.test(body),
    body.match(/[$₩¥€]\s?\d\S*/)?.[0],
  );
  // Same-line only: the column marker "2" sits directly above the heading
  // "Mana — ...", and a newline-crossing \s would read that pair as a price.
  const MANA_AMOUNT = /Mana[^\S\n]*\d|\d[^\S\n]*Mana/i;
  ok('nor any Mana amount', !MANA_AMOUNT.test(body), body.match(MANA_AMOUNT)?.[0]);

  // Picking a plan re-answers every row of the comparison, which is the part
  // that *is* decided: which axes a tier moves on.
  const rowsFor = async (i) => {
    await s.locator('.plan').nth(i).click();
    await p.waitForTimeout(200);
    return (await s.locator('.table dd').allInnerTexts()).join('|');
  };
  const [g, pl, pa] = [await rowsFor(0), await rowsFor(1), await rowsFor(2)];
  ok('the comparison has a row per axis', g.split('|').length === 7, g);
  ok('and each plan answers it differently', new Set([g, pl, pa]).size === 3);
  ok(
    'Ground has no scheduled runs',
    g.split('|')[4] !== pl.split('|')[4],
    `${g.split('|')[4]} vs ${pl.split('|')[4]}`,
  );
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
