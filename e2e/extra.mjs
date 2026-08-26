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

  /**
   * Best of three passes, not one.
   *
   * On a GPU-less runner this measurement is bimodal: the same build, measured
   * three times in one process, returned p50 16.7 / 33.3 / 16.7 ms. 33.3 is
   * exactly two vsync intervals — the compositor dropping to half rate under
   * scheduler pressure, not the page costing more. A single sample therefore
   * fails roughly a third of the time on a page that has not changed.
   *
   * Interference only ever makes this number worse, so the best pass is the
   * honest read of what the page can do, and it still catches the regression
   * this gate exists for: at 66 ms per frame every pass fails.
   *
   * The first pass doubles as Chromium's warm-up, which is slower again.
   */
  const measure = async () => {
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await p.waitForTimeout(400);
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
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  };

  const passes = [];
  for (let i = 0; i < 3; i++) passes.push(await measure());
  const p50 = Math.min(...passes.map((r) => r.p50));
  const p95 = Math.min(...passes.map((r) => r.p95));

  // Headless software rasterising is slower than any real client, so the gate
  // is generous — it exists to catch a regression of the kind that took this
  // page to 66 ms per frame, not to certify a frame rate.
  ok(
    'the scroll holds a frame budget',
    p50 <= 26,
    `p50 ${p50.toFixed(1)}ms  (passes: ${passes.map((r) => r.p50.toFixed(1)).join(' / ')})`,
  );
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

// ---- The hero holds together at every width ----
{
  // No `isMobile` anywhere here: it rewrites the viewport, so a layout audit
  // run with it is measuring a size no device has.
  const SIZES = [
    [320, 568],
    [360, 640],
    [375, 667],
    [390, 844],
    [414, 896],
    [430, 932],
    [480, 800],
    [600, 800],
    [719, 900],
    [768, 1024],
    [834, 1112],
    [844, 390],
    [1024, 768],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
  ];
  let collisions = 0;
  let overflows = 0;
  let worstCollision = '';
  const lowSurface = [];
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 720 });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(`hero ${w}x${h}: ` + e.message));
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const g = await p.evaluate(() => {
      const mos = document.querySelector('.mos-svg').getBoundingClientRect();
      // Real box intersection, block by block. A vertical overlap alone is not a
      // collision: above 720px the copy sits beside the island by design.
      let worst = 0;
      let on = '';
      for (const el of document.querySelectorAll('.hero .copy > *')) {
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) continue;
        const ox = Math.min(mos.right, b.right) - Math.max(mos.left, b.left);
        const oy = Math.min(mos.bottom, b.bottom) - Math.max(mos.top, b.top);
        if (ox > 0 && oy > 0 && ox * oy > worst) {
          worst = ox * oy;
          on = el.className.split(' ')[0] || el.tagName.toLowerCase();
        }
      }
      const svg = document.querySelector('.isle-svg').getBoundingClientRect();
      const surface = svg.top + 454 * (svg.width / 1440);
      const copyBottom = document.querySelector('.hero .copy').getBoundingClientRect().bottom;
      return {
        collide: Math.round(worst),
        on,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        surfaceFrac: surface / window.innerHeight,
        copyFrac: copyBottom / window.innerHeight,
      };
    });
    if (g.collide > 200) {
      collisions++;
      worstCollision = `${w}x${h} .${g.on} ${g.collide}px²`;
    }
    if (g.overflow > 0) overflows++;
    // Where there is room for it, the island belongs in view rather than
    // pressed against the bottom edge — the complaint this replaced was an
    // island parked at 93% of the fold on every phone.
    if (g.copyFrac < 0.72 && g.surfaceFrac > 0.88)
      lowSurface.push(`${w}x${h} ${Math.round(g.surfaceFrac * 100)}%`);
    await ctx.close();
  }
  ok('the copy and the island never overlap', collisions === 0, worstCollision);
  ok('nothing overflows sideways at any width', overflows === 0, `${overflows} widths`);
  ok(
    'the island stays in view where there is room',
    lowSurface.length === 0,
    lowSurface.join(', '),
  );
}

// ---- Controls are reachable, and the cursor does not hide a caret ----
{
  const ctx = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('ux: ' + e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await p.waitForTimeout(400);

  // Hit-tested, not measured. Several of these grow their target with a
  // pseudo-element, which `getBoundingClientRect` cannot see.
  const controls = await p
    .locator('main button, main input, main [role="switch"], main label')
    .all();
  const small = [];
  for (const h of controls) {
    const r = await h.evaluate((el) => {
      if (el.classList.contains('visually-hidden')) return null;
      // A checkbox wrapped in its own label is targeted through that label,
      // which is probed separately.
      if (
        el instanceof HTMLInputElement &&
        (el.type === 'checkbox' || el.type === 'radio') &&
        el.closest('label')
      )
        return null;
      const first = el.getBoundingClientRect();
      if (!first.width || !first.height) return null;
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const b = el.getBoundingClientRect();
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      const owns = (x, y) => {
        const t = document.elementFromPoint(x, y);
        return (
          !!t &&
          (t === el ||
            el.contains(t) ||
            (t.closest && t.closest('button, label, [role="switch"], input') === el))
        );
      };
      if (!owns(cx, cy)) return null;
      const reach = (dx, dy, max) => {
        let d = 0;
        for (let i = 1; i <= max; i++) {
          if (owns(cx + dx * i, cy + dy * i)) d = i;
          else break;
        }
        return d;
      };
      const hh = reach(0, -1, 34) + reach(0, 1, 34) + 1;
      const hw = reach(-1, 0, 80) + reach(1, 0, 80) + 1;
      return hh < 44 || hw < 44
        ? {
            cls: [...el.classList].filter((c) => !c.startsWith('svelte-')).join('.') || el.tagName,
            hit: `${hw}x${hh}`,
          }
        : null;
    });
    if (r) small.push(`${r.cls} ${r.hit}`);
  }
  ok('every control clears the 44px target floor', small.length === 0, small.join(', '));

  // The orb replaced the system I-beam on the one control the page exists to
  // collect, which read as a stray element sitting inside the field.
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await p.waitForTimeout(300);
  const box = await p.locator('.hero input[type="email"]').boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.waitForTimeout(500);
  const overField = await p.evaluate(() => ({
    ring: Number(getComputedStyle(document.querySelector('.orb .ring span')).opacity),
    cursor: getComputedStyle(document.querySelector('.hero input[type="email"]')).cursor,
  }));
  ok('the orb steps aside over a text field', overField.ring < 0.1, `ring ${overField.ring}`);
  ok('and the caret comes back', overField.cursor !== 'none', overField.cursor);

  const cta = await p.locator('.hero button[type="submit"]').boundingBox();
  await p.mouse.move(cta.x + cta.width / 2, cta.y + cta.height / 2);
  await p.waitForTimeout(500);
  const overCta = await p.evaluate(() => {
    const s = document.querySelector('.orb .ring span');
    const m = new DOMMatrixReadOnly(getComputedStyle(s).transform);
    return { opacity: Number(getComputedStyle(s).opacity), scale: Math.hypot(m.a, m.b) };
  });
  ok(
    'but shows over a button',
    overCta.opacity > 0.9 && overCta.scale > 1.2,
    `scale ${overCta.scale.toFixed(2)}`,
  );
  ok(
    'at a size that still reads as a cursor',
    overCta.scale < 1.7,
    `scale ${overCta.scale.toFixed(2)}`,
  );
  await ctx.close();
}

// ---- Type roles resolve, and read the same in every section ----
{
  const ctx = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('type: ' + e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1400);

  const g = await p.evaluate(() => {
    const probe = (name) => {
      const el = document.createElement('span');
      el.style.color = `var(${name})`;
      document.body.append(el);
      const v = getComputedStyle(el).color;
      el.remove();
      return v;
    };
    // An undefined custom property makes its declaration invalid, which is how
    // the form controls ended up with no intended surface at all.
    const dangling = ['--field', '--glass', '--shell-text', '--shell-body'].filter(
      (n) => probe(n) === 'rgba(0, 0, 0, 0)' || !probe(n),
    );
    const heads = [...document.querySelectorAll('main section .head')].map((h) =>
      Math.round(h.getBoundingClientRect().width),
    );
    // Section-closing notes only. A footnote inside a panel takes the panel's
    // measure and is a different role.
    const notes = [...document.querySelectorAll('main section > .container > .note')].map((n) =>
      Math.round(n.getBoundingClientRect().width),
    );
    return { dangling, heads, notes };
  });
  ok('the shell tokens all resolve', g.dangling.length === 0, g.dangling.join(', '));
  ok('every section head shares one measure', new Set(g.heads).size === 1, g.heads.join('/'));
  ok('and every closing note does too', new Set(g.notes).size === 1, g.notes.join('/'));
  await ctx.close();
}

await browser.close();
console.log('\n--- errors ---');
console.log(errors.length ? errors.join('\n') : 'none');
if (errors.length) process.exitCode = 1;
