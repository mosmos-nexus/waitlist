import { isDeepStrictEqual } from 'node:util';
import { LOCALES, msg, firstLine, launch, open, ok, events, settle, finish } from './util.mjs';

/**
 * The flows that need a network stub or a clock: signup -> confirmation -> survey,
 * error states, analytics events, scroll cost.
 * `/api/waitlist*` is stubbed (the real one needs Notion), so only the UI path is under test.
 */
const browser = await launch();

const json = (status, body) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});
const SIGNUP = '**/api/waitlist';
const SURVEY = '**/api/waitlist/survey';
const stubSignup = (p, reply = json(200, { id: 'test-page-id', emailSent: true })) =>
  p.route(SIGNUP, (r) => r.fulfill(reply));
const stubSurvey = (p) => p.route(SURVEY, (r) => r.fulfill(json(200, {})));
const isPost = (url) => (r) => r.method() === 'POST' && r.url().endsWith(url);
const HERO = 'main > section[aria-labelledby="hero-title"]';

/** Every analytics event any page emitted, for the suite-wide checks at the end. */
const seen = [];
const track = async (p) => {
  const e = await events(p);
  seen.push(...e);
  return e;
};

async function fillAndSubmit(p, position, { email = 'Someone@Example.com ', consent = true } = {}) {
  const form = p.locator(`form[data-form-position="${position}"]`);
  await form.locator('input[type="email"]').fill(email);
  if (consent) await form.getByRole('checkbox').check();
  await form.locator('button[type="submit"]').click();
}

/** Signs up on `position` against the success stub and waits for the confirmation screen. */
async function arrive(p, loc, position = 'hero') {
  await fillAndSubmit(p, position);
  await p.getByRole('heading', { level: 2, name: firstLine(msg[loc].confirm_title) }).waitFor();
}

const group = (p, legend) => p.getByRole('group', { name: legend });
const chip = (p, legend, i) => group(p, legend).getByRole('button').nth(i);
const pressed = (p, legend) => group(p, legend).locator('button[aria-pressed="true"]').count();
const nothing = (p) =>
  p
    .locator('select[name="job"]')
    .count()
    .then((n) => n === 0);

// The values the Notion select options are matched against, character for character
// (the en dash in 0–1개 is U+2013). Spelled out here on purpose: importing them from
// src would make the test agree with whatever the code says.
const JOB = { marketer: '마케터·콘텐츠 제작자', dev: '개발자', other: '기타' };
const TASK = { writing: '글쓰기·문서 작성', images: '이미지 생성', other: '기타' };
const COUNTRY = { korea: '한국', japan: '일본' };
const AI_COUNT = { few: '0–1개', many: '4개 이상' };

// ---- 1. signup carries attribution, consent and locale, then the confirmation takes over ----
{
  const { ctx, p } = await open(
    browser,
    '/?utm_source=threads&utm_medium=social&utm_campaign=launch-1',
    { referer: 'https://threads.net/t/abc?x=1' },
  );
  await stubSignup(p);
  const req = p.waitForRequest(isPost('/api/waitlist'));
  await fillAndSubmit(p, 'hero');
  const body = (await req).postDataJSON();
  ok('the email is trimmed and lower-cased', body.email === 'someone@example.com', body.email);
  ok('consent is sent as true', body.consent === true);
  ok('the page locale is sent', body.locale === 'ko', body.locale);
  ok(
    'utm and the external referrer ride along, query string dropped',
    isDeepStrictEqual(body.utm, {
      source: 'threads',
      medium: 'social',
      campaign: 'launch-1',
      referrer: 'https://threads.net/t/abc',
    }),
    JSON.stringify(body.utm),
  );
  await p.getByRole('heading', { level: 2, name: firstLine(msg.ko.confirm_title) }).waitFor();
  ok(
    'the confirmation replaces the marketing flow',
    (await p.locator(`form[data-form-position], ${HERO}`).count()) === 0,
  );
  ok('and the visitor is back at the top of it', (await p.evaluate(() => scrollY)) === 0);
  ok(
    'the welcome-email line shows when one was sent',
    await p.getByText(msg.ko.confirm_email_sent).isVisible(),
  );
  ok('the survey is offered', await p.locator('select[name="job"]').isVisible());
  await ctx.close();
}
{
  const { ctx, p } = await open(browser);
  await stubSignup(p, json(200, { id: 'test-page-id', emailSent: false }));
  await arrive(p, 'ko');
  ok(
    'no welcome-email line when none was sent',
    (await p.getByText(msg.ko.confirm_email_sent).count()) === 0,
  );
  await ctx.close();
}
for (const position of ['join', 'final']) {
  const { ctx, p } = await open(browser);
  await stubSignup(p);
  const req = p.waitForRequest(isPost('/api/waitlist'));
  await arrive(p, 'ko', position);
  ok(`the ${position} form signs up the same way`, (await req).postDataJSON().consent === true);
  await ctx.close();
}

// ---- 2. survey: new fields, exact stored values ----
{
  const { ctx, p } = await open(browser);
  await stubSignup(p);
  await stubSurvey(p);
  await arrive(p, 'ko');

  const ko = msg.ko;
  ok(
    'the country is pre-selected from the page language',
    (await pressed(p, ko.survey_country_label)) === 1 &&
      (await chip(p, ko.survey_country_label, 0).getAttribute('aria-pressed')) === 'true',
  );
  await p.locator('select[name="job"]').selectOption(JOB.marketer);
  await chip(p, ko.survey_ai_label, 2).click();
  await chip(p, ko.survey_ai_label, 3).click();
  await chip(p, ko.survey_ai_count_label, 0).click();
  await p.locator('input[name="firstTask"]').fill('FIRST-TASK-SECRET-123');

  const req = p.waitForRequest(isPost('/api/waitlist/survey'));
  await p.getByRole('button', { name: ko.survey_submit, exact: true }).click();
  const body = (await req).postDataJSON();
  ok(
    'every answer is sent with the Korean option strings Notion expects',
    isDeepStrictEqual(body, {
      id: 'test-page-id',
      job: JOB.marketer,
      aiTasks: [TASK.writing, TASK.images],
      country: COUNTRY.korea,
      aiCount: AI_COUNT.few,
      firstTask: 'FIRST-TASK-SECRET-123',
    }),
    JSON.stringify(body),
  );
  await p.getByText(ko.survey_done).waitFor();
  ok('the survey closes on a thank-you', await nothing(p));
  await ctx.close();
}
{
  const { ctx, p } = await open(browser);
  await stubSignup(p);
  await stubSurvey(p);
  await arrive(p, 'ko');
  const ko = msg.ko;
  await p.locator('select[name="job"]').selectOption(JOB.other);
  await chip(p, ko.survey_ai_label, 5).click();
  ok(
    '"other" opens a job field and a task field',
    (await p.locator('input[name="jobOther"], input[name="taskOther"]').count()) === 2,
  );
  await p.locator('input[name="jobOther"]').fill('OTHER-JOB-TEXT');
  await p.locator('input[name="taskOther"]').fill('OTHER-TASK-TEXT');
  const req = p.waitForRequest(isPost('/api/waitlist/survey'));
  await p.getByRole('button', { name: ko.survey_submit, exact: true }).click();
  const body = (await req).postDataJSON();
  ok(
    'the free text goes with "기타" in both questions',
    body.job === JOB.other &&
      body.jobOther === 'OTHER-JOB-TEXT' &&
      isDeepStrictEqual(body.aiTasks, [TASK.other]) &&
      body.taskOther === 'OTHER-TASK-TEXT',
    JSON.stringify(body),
  );
  await track(p);
  await ctx.close();
}
{
  // In English only the labels change: the stored values stay Korean.
  const { ctx, p } = await open(browser, '/en');
  await stubSignup(p);
  await stubSurvey(p);
  const signupReq = p.waitForRequest(isPost('/api/waitlist'));
  await arrive(p, 'en');
  ok('the English page signs up as en', (await signupReq).postDataJSON().locale === 'en');
  const en = msg.en;
  ok('no country is guessed from English', (await pressed(p, en.survey_country_label)) === 0);
  await p.locator('select[name="job"]').selectOption(JOB.dev);
  await chip(p, en.survey_country_label, 1).click();
  await chip(p, en.survey_ai_count_label, 2).click();
  const req = p.waitForRequest(isPost('/api/waitlist/survey'));
  await p.getByRole('button', { name: en.survey_submit, exact: true }).click();
  const body = (await req).postDataJSON();
  ok(
    'English labels still store the Korean values',
    body.job === JOB.dev &&
      body.country === COUNTRY.japan &&
      body.aiCount === AI_COUNT.many &&
      isDeepStrictEqual(body.aiTasks, []),
    JSON.stringify(body),
  );
  await ctx.close();
}
{
  const { ctx, p } = await open(browser);
  await stubSignup(p);
  let surveyPosts = 0;
  await p.route(SURVEY, (r) => {
    surveyPosts++;
    return r.fulfill(json(200, {}));
  });
  await arrive(p, 'ko');
  await p.getByRole('button', { name: msg.ko.survey_skip, exact: true }).click();
  ok('skipping closes the survey', await nothing(p));
  ok('and says nothing more', (await p.getByText(msg.ko.survey_done).count()) === 0);
  ok('and sends nothing', surveyPosts === 0, `${surveyPosts} requests`);
  await track(p);
  await ctx.close();
}

// ---- 3. error states ----
{
  const { ctx, p } = await open(browser);
  let reply = json(200, {});
  let posts = 0;
  await p.route(SIGNUP, (r) => {
    posts++;
    return reply === 'abort' ? r.abort() : r.fulfill(reply);
  });
  const hero = p.locator('form[data-form-position="hero"]');
  const alertText = () => hero.getByRole('alert').innerText();

  for (const [label, status, body, text, reason] of [
    ['a duplicate email', 409, { error: 'duplicate' }, msg.ko.error_duplicate, 'duplicate'],
    ['a rate limit', 429, { error: 'ratelimit' }, msg.ko.error_ratelimit, 'rate_limited'],
    ['a server error', 500, { error: 'generic' }, msg.ko.error_generic, 'server'],
  ]) {
    reply = json(status, body);
    const before = (await events(p)).length;
    await fillAndSubmit(p, 'hero');
    await hero.getByRole('alert').waitFor();
    ok(`${label} shows its message`, (await alertText()) === text, await alertText());
    ok(
      `${label} stays on the page, form usable again`,
      (await p.locator(`${HERO} figure`).count()) === 1 &&
        (await hero.locator('button[type="submit"]').isEnabled()),
    );
    const e = (await events(p)).slice(before);
    ok(
      `${label} is tracked as submit then error(${reason})`,
      isDeepStrictEqual(e, [
        { name: 'signup_submit', data: { position: 'hero' } },
        { name: 'signup_error', data: { position: 'hero', reason } },
      ]),
      JSON.stringify(e),
    );
  }

  reply = 'abort';
  const before = (await events(p)).length;
  await fillAndSubmit(p, 'hero');
  await p.waitForFunction(
    () =>
      document.querySelectorAll('[data-form-position="hero"] [role="alert"]').length === 1 &&
      [...window.vaq].filter((a) => a[1]?.name === 'signup_error').length >= 4,
  );
  ok(
    'a dropped connection shows the generic message',
    (await alertText()) === msg.ko.error_generic,
  );
  ok(
    'and counts as a server error',
    (await events(p)).slice(before).at(-1)?.data.reason === 'server',
  );

  // Client-side validation never reaches the network.
  posts = 0;
  const b2 = (await events(p)).length;
  await fillAndSubmit(p, 'hero', { email: 'not-an-email', consent: true });
  await hero.getByText(msg.ko.error_invalid_email).waitFor();
  ok('an invalid email is explained under the field', true);
  ok('and is not sent', posts === 0);
  ok('and is tracked as invalid', (await events(p)).slice(b2).at(-1)?.data.reason === 'invalid');

  await hero.locator('input[type="email"]').fill('ok@example.com');
  await hero.getByRole('checkbox').uncheck();
  const b3 = (await events(p)).length;
  await hero.locator('button[type="submit"]').click();
  await hero.getByRole('alert').waitFor();
  ok(
    'missing consent is refused with its own message',
    (await alertText()) === msg.ko.error_no_consent,
    await alertText(),
  );
  ok('without a request', posts === 0);
  ok(
    'and is tracked as no_consent',
    (await events(p)).slice(b3).at(-1)?.data.reason === 'no_consent',
  );
  await track(p);
  await ctx.close();
}

// ---- 4. analytics: the other events, and where each form is ----
for (const position of ['hero', 'join', 'final']) {
  const { ctx, p } = await open(browser);
  await stubSignup(p);
  await arrive(p, 'ko', position);
  const e = await track(p);
  ok(
    `${position} form: signup_submit then signup_success, each with its position`,
    isDeepStrictEqual(
      e.filter((x) => x.name.startsWith('signup')),
      [
        { name: 'signup_submit', data: { position } },
        { name: 'signup_success', data: { position } },
      ],
    ),
    JSON.stringify(e),
  );
  await ctx.close();
}
{
  const { ctx, p } = await open(browser);
  await stubSignup(p);
  await stubSurvey(p);
  await arrive(p, 'ko');
  await p.locator('select[name="job"]').selectOption(JOB.marketer);
  await chip(p, msg.ko.survey_ai_label, 2).click();
  await chip(p, msg.ko.survey_ai_label, 3).click();
  await chip(p, msg.ko.survey_ai_count_label, 1).click();
  await p.locator('input[name="firstTask"]').fill('FIRST-TASK-SECRET-123');
  await p.getByRole('button', { name: msg.ko.survey_submit, exact: true }).click();
  await p.getByText(msg.ko.survey_done).waitFor();
  const e = (await track(p)).filter((x) => x.name.startsWith('survey'));
  ok(
    'survey_submit says which questions were answered, never what the answers were',
    isDeepStrictEqual(e, [
      {
        name: 'survey_submit',
        data: { job: true, ai_tasks: 2, country: true, ai_count: true, first_task: true },
      },
    ]),
    JSON.stringify(e),
  );
  await ctx.close();
}
{
  const { ctx, p } = await open(browser);
  await stubSignup(p);
  await arrive(p, 'ko');
  await p.getByRole('button', { name: msg.ko.survey_skip, exact: true }).click();
  const e = (await track(p)).filter((x) => x.name.startsWith('survey'));
  ok(
    'survey_skip is tracked on its own',
    isDeepStrictEqual(e, [{ name: 'survey_skip', data: undefined }]),
    JSON.stringify(e),
  );
  await ctx.close();
}
{
  const { ctx, p } = await open(browser);
  const items = p.locator('main > section[aria-labelledby="faq-title"] details');
  // `toggle` fires on a later task, so wait for each one instead of reading the queue early.
  await p.evaluate(() => {
    window.__toggles = 0;
    for (const d of document.querySelectorAll('main details'))
      d.addEventListener('toggle', () => window.__toggles++);
  });
  const toggled = (n) => p.waitForFunction((k) => window.__toggles >= k, n);
  const last = items.nth((await items.count()) - 1);
  await items.nth(0).locator('summary').click();
  await toggled(1);
  await items.nth(0).locator('summary').click(); // closing is not an "open"
  await toggled(2);
  await last.locator('summary').click();
  await toggled(3);
  const e = (await track(p)).filter((x) => x.name === 'faq_open');
  ok(
    'faq_open fires on opening only, once per open, with a distinct question id',
    e.length === 2 &&
      e[0].data?.id !== e[1].data?.id &&
      e.every((x) => /^[a-z][a-z-]*$/.test(x.data?.id)),
    JSON.stringify(e),
  );
  ok('the first question is tracked as "when"', e[0]?.data.id === 'when', e[0]?.data.id);
  await ctx.close();
}
{
  const { ctx, p } = await open(browser, '/?utm_source=threads');
  await stubSignup(p);
  await p.evaluate(() => (window.__sameDocument = true));
  const toggle = (loc) => p.locator(`header a[hreflang="${loc}"]`);

  await toggle('en').click();
  await p.waitForFunction(
    (t) => document.querySelector('h1').textContent.trim() === t,
    msg.en.hero_title,
  );
  ok(
    'the switch swaps copy in place, without a reload',
    await p.evaluate(() => window.__sameDocument === true),
  );
  ok('and moves the URL to /en', /\/en\/?$/.test(p.url()), p.url());
  ok('and updates <html lang>', (await p.evaluate(() => document.documentElement.lang)) === 'en');

  await toggle('en').click(); // already English: nothing to switch
  await toggle('ja').click();
  await p.waitForFunction(
    (t) => document.querySelector('h1').textContent.trim() === t,
    msg.ja.hero_title,
  );

  const req = p.waitForRequest(isPost('/api/waitlist'));
  await fillAndSubmit(p, 'hero');
  const body = (await req).postDataJSON();
  ok('after switching, signup sends the new locale', body.locale === 'ja', body.locale);
  ok(
    'and the first-touch utm survives the URL losing its query',
    body.utm?.source === 'threads',
    JSON.stringify(body.utm),
  );

  const e = (await track(p)).filter((x) => x.name === 'locale_switch');
  ok(
    'locale_switch is tracked per real switch, with from and to',
    isDeepStrictEqual(e, [
      { name: 'locale_switch', data: { from: 'ko', to: 'en' } },
      { name: 'locale_switch', data: { from: 'en', to: 'ja' } },
    ]),
    JSON.stringify(e),
  );
  await ctx.close();
}

// ---- 5. the confirmation fits a 320px phone, in every locale ----
for (const { loc, path } of LOCALES) {
  const { ctx, p } = await open(browser, path, {
    viewport: { width: 320, height: 568 },
    hasTouch: true,
  });
  await stubSignup(p);
  await arrive(p, loc);
  await settle(p);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(`${loc} 320px: the confirmation does not scroll sideways`, over <= 0, `${over}px`);
  const small = await p.evaluate(() =>
    [
      ...document.querySelectorAll(
        '.arrival button, .arrival select, .arrival input, .arrival a[href]',
      ),
    ]
      .filter((e) => e.getClientRects().length && e.getBoundingClientRect().height < 43.5)
      .map(
        (e) =>
          `${e.tagName.toLowerCase()} "${(e.textContent || e.getAttribute('name') || '').trim().slice(0, 14)}" ${Math.round(e.getBoundingClientRect().height)}px`,
      ),
  );
  ok(
    `${loc} 320px: the survey's controls are 44px tall`,
    small.length === 0,
    [...new Set(small)].join(' | '),
  );
  await ctx.close();
}

// ---- 6. scrolling stays inside the frame budget ----
{
  const { ctx, p } = await open(browser);
  // Best of three: the runner is a software rasteriser, and a single pass on a busy
  // machine reads whole vsync intervals (16.7 / 33.3 / 50) rather than the page's own cost.
  const measure = async () => {
    await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await p.waitForFunction(() => scrollY === 0);
    await settle(p);
    await p.evaluate(() => {
      window.__g = [];
      let last = 0;
      const tick = (t) => {
        if (last) window.__g.push(t - last);
        last = t;
        window.__raf = requestAnimationFrame(tick);
      };
      window.__raf = requestAnimationFrame(tick);
    });
    for (let i = 0; i < 60; i++) {
      await p.mouse.wheel(0, 90);
      await p.waitForTimeout(16);
    }
    await settle(p);
    const g = (await p.evaluate(() => (cancelAnimationFrame(window.__raf), window.__g))).sort(
      (a, b) => a - b,
    );
    return { p50: g[Math.floor(g.length * 0.5)], p95: g[Math.floor(g.length * 0.95)] };
  };
  const runs = [];
  for (let i = 0; i < 3; i++) runs.push(await measure());
  const p95 = Math.min(...runs.map((r) => r.p95));
  ok(
    'scroll frame time p95 is at most 60ms',
    p95 <= 60,
    `p95 ${p95.toFixed(1)}ms, p50 ${Math.min(...runs.map((r) => r.p50)).toFixed(1)}ms (passes: ${runs.map((r) => r.p95.toFixed(1)).join(' / ')})`,
  );
  await ctx.close();
}

// ---- 7. across the whole run: every event fired, and none carries a person ----
{
  const names = new Set(seen.map((e) => e.name));
  const wanted = [
    'signup_submit',
    'signup_success',
    'signup_error',
    'survey_submit',
    'survey_skip',
    'faq_open',
    'locale_switch',
  ];
  const missing = wanted.filter((n) => !names.has(n));
  ok(
    'every instrumented event was emitted',
    missing.length === 0,
    missing.length ? `missing ${missing.join()}` : `${seen.length} events`,
  );

  const raw = JSON.stringify(seen);
  ok('no email address in any payload', !/@|example\.com|someone/i.test(raw));
  ok('no survey free text in any payload', !/FIRST-TASK|OTHER-(JOB|TASK)/.test(raw));
  // Everything a payload may say is a small closed vocabulary, a boolean or a count.
  const vocab = {
    position: ['hero', 'join', 'final'],
    reason: ['invalid', 'no_consent', 'duplicate', 'rate_limited', 'server'],
    from: ['ko', 'en', 'ja'],
    to: ['ko', 'en', 'ja'],
  };
  const stray = seen.flatMap((e) =>
    Object.entries(e.data ?? {})
      .filter(([k, v]) =>
        typeof v === 'string'
          ? k === 'id'
            ? !/^[a-z][a-z-]*$/.test(v) // a faq slug, never a question's text
            : !vocab[k]?.includes(v)
          : !['boolean', 'number'].includes(typeof v),
      )
      .map(([k, v]) => `${e.name}.${k}=${JSON.stringify(v)}`),
  );
  ok(
    'payload values are position/reason/locale words, faq slugs, booleans or counts',
    stray.length === 0,
    [...new Set(stray)].join(' | '),
  );
}

await finish(browser);
