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
   * Two numbers and a control, because one absolute number was measuring the
   * runner rather than the page.
   *
   * The scene sits right on the vsync boundary of a GPU-less software
   * rasteriser: the same build reads p50 16.7 ms at machine load ~1.0 and 33.3
   * at ~1.8, and 33.3 is exactly two vsync intervals — the compositor halving,
   * not the page costing more. A gate at 26 ms therefore flips on load, and
   * best-of-three does not help when the load is sustained. Verified by
   * isolation: hiding the bus gradient, the node stubs and the board's scrub
   * transform each changed nothing, while hiding `.world` recovered 16.7 —
   * i.e. the cost is the scene, which has not changed.
   *
   * So: measure the flow without the scene as a control, and hold each to what
   * it can actually promise. The control has no per-frame work at all, so it
   * must stay fast — that is where a new leak anywhere in the page would show.
   * The scene is allowed to sit at the 30 fps floor, but 66 ms, which is what
   * this gate was built after, still fails.
   */
  const measure = async (page = p) => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(400);
    await page.evaluate(() => {
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
      await page.mouse.wheel(0, 90);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(300);
    const sorted = (await page.evaluate(() => window.__g)).sort((a, b) => a - b);
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  };
  const bestOf = async (n, page = p) => {
    const runs = [];
    for (let i = 0; i < n; i++) runs.push(await measure(page));
    return {
      p50: Math.min(...runs.map((r) => r.p50)),
      p95: Math.min(...runs.map((r) => r.p95)),
      all: runs.map((r) => r.p50.toFixed(1)).join(' / '),
    };
  };

  const scene = await bestOf(3);
  ok(
    'the scene holds a frame budget',
    scene.p50 <= 40,
    `p50 ${scene.p50.toFixed(1)}ms  (passes: ${scene.all})`,
  );
  ok('with no long stalls', scene.p95 <= 60, `p95 ${scene.p95.toFixed(1)}ms`);

  // Control: the same scroll with the world hidden. Nothing else on the page
  // does per-frame work, so this has real headroom — if it slows, something new
  // is running every frame.
  //
  // In its own context. `addStyleTag` cannot be undone, and hiding the world in
  // this page left every assertion below it measuring a display:none scene.
  const bareCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const bp = await bareCtx.newPage();
  await bp.goto(BASE + '/', { waitUntil: 'networkidle' });
  await bp.addStyleTag({ content: '.world { display: none !important }' });
  await bp.waitForTimeout(1200);
  const bare = await bestOf(2, bp);
  await bareCtx.close();
  ok(
    'and the flow without the scene stays cheap',
    bare.p50 <= 26,
    `p50 ${bare.p50.toFixed(1)}ms  (passes: ${bare.all})`,
  );

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

// ---- nothing is clipped, at any width, in any shell ----
//
// The widget cut 118px off its own suggestion list at every width above 720px:
// it has a fixed height and its body was not scrollable, so the browser frame's
// `overflow: hidden` silently ate the rest. A screenshot at one width would not
// have found it — the panel looked complete until the third row.
//
// So: sweep the widths, open each shell, and assert that no element with hidden
// overflow is holding content it cannot show. Three clips are intentional and
// named: the world's stage, the visually-hidden boxes (1px by construction) and
// the browser's URL, which ellipsises on purpose.
{
  const ALLOW = /(^|\.)world($|\.)|visually-hidden|(^|\.)url($|\.)/;
  const rows = [];
  for (const [w, h] of [
    [320, 568],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      reducedMotion: 'reduce',
    });
    const p = await ctx.newPage();
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    for (const shell of [0, 1, 2]) {
      const pills = p.locator('section.decide .shells .pill');
      if (await pills.count()) {
        await pills.nth(shell).click();
        await p.waitForTimeout(280);
      }
      const found = await p.evaluate(() => {
        const bad = [];
        const de = document.documentElement;
        for (const el of document.querySelectorAll('main *')) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const hiddenY = cs.overflowY === 'hidden' || cs.overflow === 'hidden';
          const hiddenX = cs.overflowX === 'hidden' || cs.overflow === 'hidden';
          const dy = hiddenY ? el.scrollHeight - el.clientHeight : 0;
          const dx = hiddenX ? el.scrollWidth - el.clientWidth : 0;
          if (dy > 2 || dx > 2) {
            const cls = typeof el.className === 'string' ? el.className : '';
            bad.push({
              sel:
                el.tagName.toLowerCase() +
                '.' +
                cls
                  .split(' ')
                  .filter((x) => x && !x.startsWith('svelte-'))
                  .slice(0, 2)
                  .join('.'),
              dy,
              dx,
            });
          }
        }
        return { bad, pageOver: de.scrollWidth - de.clientWidth };
      });
      const real = found.bad.filter((x) => !ALLOW.test(x.sel));
      rows.push({
        at: `${w} ${['side', 'widget', 'button'][shell]}`,
        clipped: real,
        pageOver: found.pageOver,
      });
    }
    await ctx.close();
  }
  const clipped = rows.filter((r) => r.clipped.length);
  ok(
    'nothing clips content it cannot show',
    clipped.length === 0,
    clipped
      .slice(0, 3)
      .map((r) => `${r.at}: ${r.clipped.map((c) => `${c.sel} y+${c.dy} x+${c.dx}`).join(', ')}`)
      .join(' | '),
  );
  const over = rows.filter((r) => r.pageOver > 1);
  ok(
    'and the page never scrolls sideways',
    over.length === 0,
    over.map((r) => `${r.at}: ${r.pageOver}px`).join(', '),
  );
}

// ---- the pricing divider sits in the middle of its gutter ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  // A full negative margin put the border at the gutter's start, flush against
  // the left column, which reads as belonging to the right one.
  const g = await p.evaluate(() => {
    const cols = [...document.querySelectorAll('section.cost .split > .col')];
    if (cols.length < 2) return null;
    const a = cols[0].getBoundingClientRect();
    const b = cols[1].getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(cols[1]).paddingLeft);
    return { left: Math.round(b.left - a.right), right: Math.round(b.left + pad - b.left) };
  });
  ok(
    'the divider is centred in the gutter',
    g && Math.abs(g.left - g.right) <= 2,
    g ? `${g.left}px / ${g.right}px` : 'no split',
  );
  await ctx.close();
}

await browser.close();
console.log('\n--- errors ---');
console.log(errors.length ? errors.join('\n') : 'none');
if (errors.length) process.exitCode = 1;
