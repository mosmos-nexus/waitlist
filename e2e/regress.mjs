import { chromium } from 'playwright-core';
import { chromePath } from './resolve-chrome.mjs';

const BASE = 'http://localhost:5199';
const browser = await chromium.launch({ executablePath: chromePath() });
let fail = 0;
const ok = (l, c, e = '') => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${e ? '  ' + e : ''}`);
  if (!c) fail++;
};

async function open(o = {}) {
  const view = o.viewport ?? { width: 1440, height: 900 };
  const ctx = await browser.newContext({ ...o, viewport: view });
  const p = await ctx.newPage();
  await p.goto(BASE + (o.path ?? '/'), { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const track = await p.locator('.journey').evaluate((e) => e.getBoundingClientRect().height);
  return { ctx, p, span: track - view.height };
}

/**
 * Wait until the scene stops chasing the scroll.
 *
 * Progress is damped, so the frame at any moment lags the scroll position.
 * Two parts, both needed: wait for the chase to *start* — polling straight after
 * `scrollTo` can otherwise read the same pre-scroll value twice and call it
 * settled before anything moved — then wait for it to hold still.
 */
async function settle(p, before = null, budget = 3200) {
  const read = () =>
    p.locator('.journey [data-drive="isle"]').evaluate((e) => getComputedStyle(e).transform);
  const startBy = Date.now() + 600;
  while (before !== null && Date.now() < startBy) {
    if ((await read()) !== before) break;
    await p.waitForTimeout(50);
  }
  let last = null;
  let same = 0;
  const until = Date.now() + budget;
  while (Date.now() < until) {
    const v = await read();
    if (v === last) {
      if (++same >= 2) return;
    } else {
      same = 0;
      last = v;
    }
    await p.waitForTimeout(60);
  }
}

const at = async (p, span, t, wait = 0) => {
  const before = wait
    ? null
    : await p
        .locator('.journey [data-drive="isle"]')
        .evaluate((e) => getComputedStyle(e).transform);
  // `behavior: 'instant'` on purpose: the page sets `scroll-behavior: smooth`,
  // so a plain `scrollTo` animates and every sample lands short of its target.
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(span * t));
  if (wait) await p.waitForTimeout(wait);
  else await settle(p, before);
};

/** Which Mos face is held right now. */
const mosFace = (p) =>
  p.locator('.journey .mos-drive svg').evaluate((svg) => {
    const on = [...svg.querySelectorAll('[data-face]')].find(
      (el) => Number(getComputedStyle(el).opacity) > 0.5,
    );
    return on?.dataset.face ?? 'none';
  });

// --- nothing on the stage may sit on the copy, anywhere in the scrub ---
//
// Ten sample points is not coverage for a scene that is a continuous function
// of scroll: a collision can open and close between two of them. This walks the
// whole journey in 2% steps at both layouts.
for (const [label, view, mobile] of [
  ['desktop', { width: 1440, height: 900 }, false],
  ['phone', { width: 390, height: 844 }, true],
]) {
  const { ctx, p, span } = await open({ viewport: view, isMobile: mobile, hasTouch: mobile });
  const clashes = [];
  for (let i = 0; i <= 50; i++) {
    await at(p, span, i / 50, 150);
    const hit = await p.locator('.journey .stage').evaluate((stage) => {
      const vis = (el) => Number(getComputedStyle(el).opacity) > 0.5;
      // Glyph-tight rects: a paragraph's own box spans the column even where
      // its lines are short, which reports collisions that are not there.
      const lines = [];
      for (const act of stage.querySelectorAll('[data-act]')) {
        if (!vis(act)) continue;
        for (const el of act.querySelectorAll('h1, h2, .lead, .eyebrow, .ask, .fine'))
          for (const n of el.childNodes) {
            if (n.nodeType !== 3 || !n.textContent.trim()) continue;
            const r = document.createRange();
            r.selectNodeContents(n);
            lines.push(...[...r.getClientRects()].map((b) => b.toJSON()));
          }
      }
      const objs = [];
      for (const el of stage.querySelectorAll(
        '.mos-drive, [data-crew], [data-task], .well, .yield, .say',
      ))
        if (vis(el))
          objs.push({
            k: el.className.toString().split(' ')[0] || el.dataset.key || 'obj',
            r: el.getBoundingClientRect().toJSON(),
          });
      const names = new Set();
      for (const o of objs)
        for (const l of lines)
          if (o.r.right > l.left && o.r.left < l.right && o.r.bottom > l.top && o.r.top < l.bottom)
            names.add(o.k);
      return [...names];
    });
    if (hit.length) clashes.push(`${(i / 50).toFixed(2)}:${hit.join('+')}`);
  }
  ok(
    `${label}: the copy is never sat on`,
    clashes.length === 0,
    clashes.slice(0, 6).join(' ') || '51 points clear',
  );

  const pans = async () => {
    await p.evaluate(() =>
      window.scrollTo({ left: 9999, top: window.scrollY, behavior: 'instant' }),
    );
    const x = await p.evaluate(() => window.scrollX || document.documentElement.scrollLeft);
    await p.evaluate(() => window.scrollTo({ left: 0, top: window.scrollY, behavior: 'instant' }));
    return x;
  };
  ok(`${label}: never pans sideways`, (await pans()) === 0);
  await ctx.close();
}

// --- every marker the journey drives has to be its own ---
//
// `q()` walks the whole world subtree, so a marker that also means something
// inside MosBlob or SurfaceCard hands those elements a second transform on top
// of the one their own component writes. `data-orbit` (MosBlob's glob radius)
// and `data-surface` (SurfaceCard's root) were both already taken, and both
// silently broke the scene.
{
  const { ctx, p } = await open();
  const counts = await p.locator('.journey').evaluate((j) => ({
    task: j.querySelectorAll('[data-task]').length,
    crew: j.querySelectorAll('[data-crew]').length,
    artifact: j.querySelectorAll('[data-artifact]').length,
    wire: j.querySelectorAll('[data-wire]').length,
    drive: j.querySelectorAll('[data-drive]').length,
    act: j.querySelectorAll('[data-act]').length,
    bar: j.querySelectorAll('[data-bar]').length,
  }));
  ok('one element per task marker', counts.task === 6, `${counts.task}`);
  ok('one element per crew marker', counts.crew === 4, `${counts.crew}`);
  ok('one element per artifact marker', counts.artifact === 4, `${counts.artifact}`);
  ok('one element per crew bar', counts.bar === 4, `${counts.bar}`);
  ok('one wire per crew slot', counts.wire === 4, `${counts.wire}`);
  const drives = await p
    .locator('.journey [data-drive]')
    .evaluateAll((els) => els.map((e) => e.dataset.drive).sort());
  ok(
    'the drive markers are exactly the six known ones',
    drives.join(',') === 'isle,mos,say,tasks,well,yield',
    drives.join(','),
  );
  ok('three acts', counts.act === 3, `${counts.act}`);
  await ctx.close();
}

// --- the ambient loops must survive a poke ---
//
// animejs composes with `replace`: a one-shot tween overlapping a *looping* one
// on the same target and property overrides the loop for good. This is the only
// check that catches it, because the damage only shows seconds after the
// interaction, in the idle motion.
{
  const { ctx, p } = await open();
  const range = async (sel, extract) => {
    const v = [];
    for (let i = 0; i < 18; i++) {
      v.push(await p.locator(sel).first().evaluate(extract));
      await p.waitForTimeout(150);
    }
    return Math.max(...v) - Math.min(...v);
  };
  const bobY = (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).f;
  const width = (el) => {
    const b = el.getBBox();
    return b.width;
  };

  const bobBefore = await range('.journey .isle .bob', bobY);
  const isleBefore = await range('.journey [data-isle="crown"]', width);
  // Mos never stops moving (island buoyancy plus its own float), so Playwright's
  // stability check can never pass on it.
  await p.locator('.journey .mos-drive button.hit').click({ force: true });
  await p.waitForTimeout(2600);
  const bobAfter = await range('.journey .isle .bob', bobY);
  const isleAfter = await range('.journey [data-isle="crown"]', width);
  ok(
    'island buoyancy survives a poke',
    bobAfter > bobBefore * 0.5 && bobAfter > 1,
    `${bobBefore.toFixed(1)}px → ${bobAfter.toFixed(1)}px`,
  );
  ok(
    'island breathing survives a poke',
    isleAfter > isleBefore * 0.5 && isleAfter > 0.5,
    `${isleBefore.toFixed(1)} → ${isleAfter.toFixed(1)}`,
  );

  // Mos's own float loop, which a poke recoil used to cancel permanently.
  const mosFloat = await range('.journey .mos-drive .wrap', bobY);
  ok('Mos keeps floating after a poke', mosFloat > 4, `${mosFloat.toFixed(1)}px`);
  await ctx.close();
}

// --- Mos is read four ways across the journey ---
{
  const { ctx, p, span } = await open();
  const seen = [];
  for (const t of [0.01, 0.14, 0.7, 0.99]) {
    await at(p, span, t, 700);
    seen.push(await mosFace(p));
  }
  ok('every act shows a different Mos', new Set(seen).size === 4, seen.join(' '));
  await ctx.close();
}

// --- parallel answers together, serial one behind the other ---
{
  const { ctx, p, span } = await open();
  const arrival = async () => {
    const marks = {};
    for (let i = 0; i <= 40; i++) {
      const t = 0.55 + (i / 40) * 0.44;
      await at(p, span, t, 110);
      const now = await p
        .locator('.journey [data-crew]')
        .evaluateAll((els) =>
          els.map((e) => ({ lane: e.dataset.lane, o: Number(getComputedStyle(e).opacity) })),
        );
      now.forEach((c, j) => {
        if (c.o > 0.5 && marks[j] === undefined) marks[j] = { step: i, lane: c.lane };
      });
    }
    return marks;
  };
  const marks = await arrival();
  const parallel = Object.values(marks)
    .filter((m) => m.lane === 'parallel')
    .map((m) => m.step);
  const serial = Object.values(marks)
    .filter((m) => m.lane === 'serial')
    .map((m) => m.step);
  const spread = (a) => (a.length ? Math.max(...a) - Math.min(...a) : -1);
  ok('both parallel Mon answer at once', spread(parallel) <= 1, `steps ${parallel.join(',')}`);
  ok('the serial pair queues', spread(serial) >= 3, `steps ${serial.join(',')}`);
  ok('exactly one wire is a handoff', (await p.locator('.journey .wire.handoff').count()) === 1);
  ok(
    'a handoff wire is not a call wire',
    await p
      .locator('.journey .wire.handoff')
      .first()
      .evaluate((h) => {
        const call = document.querySelector('.journey .wire:not(.handoff)');
        return getComputedStyle(h).stroke !== getComputedStyle(call).stroke;
      }),
  );
  await ctx.close();
}

// --- the scene has to play, not step ---
//
// A wheel notch is one discrete jump of several hundred pixels. Driving the
// scene from the raw scroll value made it jump the same way; the reported
// progress chases the real position instead, so one notch becomes a short piece
// of playback. Sampling the island through a single notch is what tells the two
// apart.
{
  const { ctx, p } = await open();
  const isleY = () =>
    p
      .locator('.journey [data-drive="isle"]')
      .evaluate(
        (e) => Math.round(new DOMMatrixReadOnly(getComputedStyle(e).transform).f * 100) / 100,
      );

  await p.mouse.move(720, 450);
  const trail = [await isleY()];
  await p.mouse.wheel(0, 600);
  for (let i = 0; i < 12; i++) {
    await p.waitForTimeout(55);
    trail.push(await isleY());
  }
  const frames = new Set(trail).size;
  ok('one wheel notch plays out over frames', frames >= 6, `${frames} distinct positions`);
  ok('and it lands', Math.abs(trail.at(-1) - trail.at(-2)) < 0.4, trail.slice(-3).join(' '));
  // Monotonic: a chase overshooting or wobbling would read as a spring, not a
  // scroll.
  const monotonic = trail.every((v, i) => i === 0 || v <= trail[i - 1] + 0.01);
  ok('the chase does not overshoot', monotonic, trail.slice(0, 6).join(' '));
  await ctx.close();
}

// --- the console is four surfaces sharing one state ---
{
  const { ctx, p } = await open();
  await p.locator('.try .console').scrollIntoViewIfNeeded();
  await p.waitForTimeout(700);

  const rail = p.locator('.try [role="tab"]');
  ok('exactly four tabs', (await rail.count()) === 4);
  const wired = await p
    .locator('.try')
    .evaluate((root) =>
      [...root.querySelectorAll('[role="tab"]')].every(
        (t) => t.getAttribute('aria-controls') && t.hasAttribute('aria-selected'),
      ),
    );
  ok('every tab names its panel', wired);
  const roving = await rail.evaluateAll((els) => els.map((e) => e.getAttribute('tabindex')));
  ok('one tab stop, not four', roving.filter((v) => v === '0').length === 1, roving.join(','));

  // Arrow keys, because a tablist owes the keyboard a way through.
  await rail.first().focus();
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(250);
  ok(
    'arrow keys move between surfaces',
    (await p.locator('.try [role="tab"][aria-selected="true"]').innerText()) === 'Hub',
  );
  await p.keyboard.press('End');
  await p.waitForTimeout(250);
  ok(
    'End reaches the last one',
    (await p.locator('.try [role="tab"][aria-selected="true"]').innerText()) === 'Studio',
  );

  // Toggling a safeguard changes the canvas, not just the button.
  const lit = () => p.locator('.try .guard-slot[data-on="true"]').count();
  const before = await lit();
  await p.locator('.try .guards .pill').nth(1).click();
  await p.waitForTimeout(250);
  ok(
    'a safeguard toggle moves the canvas',
    (await lit()) === before + 1,
    `${before} → ${await lit()}`,
  );

  // State survives moving between surfaces — four demos would each reset.
  await p.locator('.try [role="tab"]:has-text("Hub")').click();
  await p.waitForTimeout(200);
  await p.locator('.try .card .act').first().click();
  await p.waitForTimeout(250);
  await p.locator('.try [role="tab"]:has-text("Monitor")').click();
  await p.waitForTimeout(200);
  await p.locator('.try [role="tab"]:has-text("Studio")').click();
  await p.waitForTimeout(250);
  ok('the safeguard is still on after a detour', (await lit()) === before + 1);
  await p.locator('.try [role="tab"]:has-text("Inventory")').click();
  await p.waitForTimeout(250);
  ok('and the brought-in Mon is still held', (await p.locator('.try .rows li').count()) === 4);

  // The filter has to filter.
  await p.locator('.try .filters .pill').click();
  await p.waitForTimeout(250);
  ok('starred-only narrows the list', (await p.locator('.try .rows li').count()) === 1);
  await ctx.close();
}

// --- focus and keyboard, on the one interactive body ---
{
  const { ctx, p } = await open();
  const hit = p.locator('.journey .mos-drive button.hit');
  await hit.focus();
  await p.waitForTimeout(140);
  const outlines = await p
    .locator('.journey .mos-drive .mos')
    .evaluate((root) =>
      [root, ...root.querySelectorAll('*')]
        .map((el) => getComputedStyle(el).outlineStyle + ':' + getComputedStyle(el).outlineWidth)
        .filter((v) => !v.startsWith('none') && !v.endsWith(':0px')),
    );
  ok('no outline rectangle on focus', outlines.length === 0, outlines.join(',') || 'clean');
  const ring = await hit.evaluate((el) => {
    const s = getComputedStyle(el, '::after');
    return { r: s.borderRadius, shadow: s.boxShadow, content: s.content };
  });
  ok('focus ring is round', ring.r === '50%', ring.r);
  ok('focus ring is declared', ring.shadow !== 'none' && ring.content !== 'none');

  // Enter on a native button delivers a MouseEvent with clientX 0 / detail 0.
  await p.keyboard.press('Enter');
  await p.waitForTimeout(160);
  const dip = await p
    .locator('.journey [data-anim="press-dip"]')
    .evaluate((el) => ({ cx: +el.getAttribute('cx'), cy: +el.getAttribute('cy') }));
  ok('keyboard poke lands on the body', dip.cx === 452 && dip.cy === 430, `${dip.cx},${dip.cy}`);
  await ctx.close();
}

// --- language switch keeps the running scene ---
{
  const { ctx, p } = await open();
  const before = await p.locator('.journey h1').first().innerText();
  await p.evaluate(() => {
    window.__kept = 'yes';
  });
  await p.locator('.lang a[hreflang="ja"]').click();
  await p.waitForFunction((t) => document.querySelector('.journey h1')?.innerText !== t, before, {
    timeout: 5000,
  });
  ok('the document is not reloaded', (await p.evaluate(() => window.__kept)) === 'yes');
  ok('html lang follows', (await p.evaluate(() => document.documentElement.lang)) === 'ja');
  ok('the url follows', new URL(p.url()).pathname.startsWith('/ja'));
  ok('the world is still there', (await p.locator('.journey [data-isle="crown"]').count()) >= 1);
  await ctx.close();
}

// --- every locale fits ---
for (const [path, locale] of [
  ['/', 'ko'],
  ['/en', 'en'],
  ['/ja', 'ja'],
]) {
  const { ctx, p } = await open({ path });
  const ph = await p.locator('.journey input[type="email"]').evaluate((inp) => {
    const cs = getComputedStyle(inp);
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${cs.font};letter-spacing:${cs.letterSpacing}`;
    probe.textContent = inp.placeholder;
    document.body.appendChild(probe);
    const need = probe.getBoundingClientRect().width;
    probe.remove();
    const pad =
      parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) * 2;
    return { need: Math.ceil(need + pad), have: Math.round(inp.getBoundingClientRect().width) };
  });
  ok(
    `${locale}: the email prompt is not clipped`,
    ph.have >= ph.need,
    `${ph.have} of ${ph.need}px`,
  );
  await ctx.close();
}

// --- a phone must not be handed a 300px-tall email field ---
//
// `flex-basis` measures the main axis, so the basis that keeps the field wide
// enough for its placeholder in a row became a minimum *height* once the row
// turned into a column.
{
  const { ctx, p } = await open({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const h = await p.locator('.journey .email').evaluate((e) => e.getBoundingClientRect().height);
  ok('the email field keeps its own height', h < 90, `${Math.round(h)}px`);
  await ctx.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nall regression guards pass');
process.exit(fail ? 1 : 0);
