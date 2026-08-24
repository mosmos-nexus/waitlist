import { chromium } from 'playwright-core';
import { chromePath } from './resolve-chrome.mjs';
const EXEC = chromePath();
const browser = await chromium.launch({ executablePath: EXEC });
let fail = 0;
const ok = (l, c, e = '') => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${e ? '  ' + e : ''}`);
  if (!c) fail++;
};

/** Which Mos face is currently held in a given section. */
const mosFace = (p, root) =>
  p
    .locator(`${root} .mos svg`)
    .first()
    .evaluate((svg) => {
      const on = [...svg.querySelectorAll('[data-face]')].find(
        (el) => Number(getComputedStyle(el).opacity) > 0.5,
      );
      return on?.dataset.face ?? 'none';
    });

/**
 * Centre and usable radius of the circulation ring, with the ring scrolled to
 * the middle of the viewport first.
 *
 * `getBoundingClientRect()` returns the axis-aligned bounds of a *rotated*
 * element, so once scrolling turns the ring a 376px square reports as ~526 —
 * deriving the drag radius from it puts the path outside the ring and off the
 * top of the screen, where the pointer clamps and the sweep never completes.
 * `offsetWidth` is the layout size and is unaffected by the transform.
 */
async function ringGeometry(p) {
  await p
    .locator('.growth .scene')
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(700);
  const g = await p.locator('.growth .ring').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, d: el.offsetWidth };
  });
  return { ...g, r: g.d / 2 - 12 };
}

const page = async (o = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...o });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  return { ctx, p };
};

// --- the ambient loops must survive a poke (both were killed permanently) ---
{
  const { ctx, p } = await page();
  const range = async (sel, extract) => {
    const v = [];
    for (let i = 0; i < 20; i++) {
      v.push(await p.locator(sel).first().evaluate(extract));
      await p.waitForTimeout(150);
    }
    return Math.max(...v) - Math.min(...v);
  };
  const floatY = (el) => {
    const m = /translateY\(([-\d.]+)px\)/.exec(el.style.transform || '');
    return m ? parseFloat(m[1]) : 0;
  };
  // The body's squash/stretch drift shows up as the path's horizontal extent.
  const bodyWidth = (el) => {
    const b = el.getBBox();
    return b.width;
  };

  const f0 = await range('.hero .mos > .wrap', floatY);
  const w0 = await range('.hero [data-anim="mos-fill"]', bodyWidth);
  await p.locator('.hero [data-anim="mos-fill"]').click({ force: true });
  await p.waitForTimeout(2600);
  const f1 = await range('.hero .mos > .wrap', floatY);
  const w1 = await range('.hero [data-anim="mos-fill"]', bodyWidth);

  ok('float loop survives a poke', f1 > 1, `${f0.toFixed(1)}px -> ${f1.toFixed(1)}px`);
  ok('body drift survives a poke', w1 > 0.5, `${w0.toFixed(1)}px -> ${w1.toFixed(1)}px`);
  await ctx.close();
}

// --- a Mon's drift must survive a hover nudge ---
{
  const { ctx, p } = await page();
  const mon = '.hero .mon.mid [data-anim="mon-fill"]';
  const w = async () => {
    const v = [];
    for (let i = 0; i < 18; i++) {
      v.push(
        await p
          .locator(mon)
          .first()
          .evaluate((e) => e.getBBox().width),
      );
      await p.waitForTimeout(150);
    }
    return Math.max(...v) - Math.min(...v);
  };
  await p.locator('.hero .mon.mid').first().hover({ force: true });
  await p.waitForTimeout(2200);
  ok('Mon drift survives a hover', (await w()) > 0.5);
  await ctx.close();
}

// --- the orbit must not award growth for merely sitting there ---
{
  const { ctx, p } = await page();
  await p.locator('.growth .scene').scrollIntoViewIfNeeded();
  await p.waitForTimeout(1000);
  const before = await p.locator('.growth .glob').count();
  await p.waitForTimeout(12000); // 12s of pure idle drift
  const after = await p.locator('.growth .glob').count();
  const cycleVisible = await p
    .locator('.growth .cycle')
    .evaluate((e) => getComputedStyle(e).display);
  ok('idle drift awards no growth', before === after, `globs ${before} -> ${after}`);
  ok('no "cycle 0" label before first use', cycleVisible === 'none', cycleVisible);
  await ctx.close();
}

// --- switching request must choreograph every slot of the new set ---
{
  const { ctx, p } = await page();
  await p.locator('.summon .stage').scrollIntoViewIfNeeded();
  await p.waitForTimeout(700);
  await p.locator('.summon .chips button').nth(2).click(); // 2 Mon
  await p.waitForTimeout(400);
  await p.locator('.summon .chips button').nth(0).click(); // 3 Mon
  await p.waitForTimeout(500);
  // Every slot must be mid-choreography (reset to hidden), none stuck at 1.
  const opacities = await p
    .locator('.summon .mon-slot')
    .evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
  ok(
    'all slots enter the timeline',
    opacities.length === 3 && opacities.every((o) => o < 0.99),
    JSON.stringify(opacities.map((o) => o.toFixed(2))),
  );
  await p.waitForTimeout(7000);
  const bars = await p
    .locator('.summon .bar-fill')
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
  ok(
    'every progress bar fills',
    bars.length === 3 && bars.every((w) => w > 10),
    JSON.stringify(bars.map(Math.round)),
  );
  await ctx.close();
}

// --- Mos on the island must be reachable by assistive tech ---
{
  const { ctx, p } = await page();
  // The frame must not carry role="img": that role is Children-Presentational
  // and would prune Mos and the live region out of the a11y tree entirely.
  ok('frame carries no presentational role', (await p.locator('.hero .frame[role]').count()) === 0);
  ok(
    'Mos is a labelled button',
    (await p.locator('.hero button.hit[aria-label="Mos"]').count()) === 1,
  );
  ok(
    'island svg carries the scene label',
    (await p.locator('.hero svg.isle[role="img"][aria-label]').count()) === 1,
  );
  ok(
    'poke reply is a live region',
    (await p.locator('.hero .mos-line[aria-live="polite"]').count()) === 1,
  );
  ok(
    'decorative Mon are not announced',
    (await p.locator('.hero .mon svg[aria-hidden="true"]').count()) === 3,
  );
  await ctx.close();
}

// --- reduced motion must not invite an interaction it disabled ---
{
  const { ctx, p } = await page({ reducedMotion: 'reduce' });
  await p.locator('.drift .field').scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  ok('no dodge hint under reduced motion', (await p.locator('.drift .hint').count()) === 0);
  ok('shard labels still readable', (await p.locator('.drift .shard-core').count()) === 6);
  await ctx.close();
}

// --- focusing Mos must not draw a rectangle around the body ---
{
  const { ctx, p } = await page();
  const hit = p.locator('.hero button.hit');
  await hit.focus();
  await p.waitForTimeout(120);

  // The old bug: `svg:focus-visible { outline: 2px solid }` on a `role="button"`
  // svg drew a hard rectangle. Nothing in the tree may carry an outline now.
  const outlines = await p
    .locator('.hero .mos')
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

  // Declared is not the same as painted: the ring and the svg are both
  // positioned with no z-index, so tree order used to hide it behind the body.
  // Compare the actual pixels instead of trusting the cascade.
  const shot = async () => (await p.locator('.hero .mos').screenshot()).toString('base64');
  const focused = await shot();
  await p.locator('.hero h1').first().focus();
  await p.waitForTimeout(200);
  const blurred = await shot();
  ok('focus ring is painted', focused !== blurred);
  await hit.focus();
  await p.waitForTimeout(150);

  // Enter on a native button delivers a MouseEvent with clientX 0 / detail 0.
  // Before the guard fix that poked the viewport origin, so the dip landed far
  // outside the body instead of at its centre.
  await p.keyboard.press('Enter');
  await p.waitForTimeout(140);
  const dip = await p
    .locator('.hero [data-anim="press-dip"]')
    .evaluate((el) => ({ cx: +el.getAttribute('cx'), cy: +el.getAttribute('cy') }));
  ok('keyboard poke lands on the body', dip.cx === 452 && dip.cy === 430, `${dip.cx},${dip.cy}`);
  await ctx.close();
}

// --- every mood must read as a different Mos ---
{
  const { ctx, p } = await page();
  await p.locator('.sheet .viewer').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);

  const shown = async () =>
    p
      .locator('.sheet .mos svg')
      .evaluate((svg) =>
        [...svg.querySelectorAll('[data-face]')]
          .filter((el) => Number(getComputedStyle(el).opacity) > 0.5)
          .map((el) => el.dataset.face),
      );
  const silhouette = () => p.locator('.sheet [data-anim="mos-fill"]').getAttribute('d');

  const faces = [];
  const widths = [];
  const buttons = p.locator('.sheet .switch button');
  for (let i = 0; i < (await buttons.count()); i++) {
    await buttons.nth(i).click();
    await p.waitForTimeout(800);
    const f = await shown();
    ok(`mood ${i} shows exactly one face`, f.length === 1, f.join(',') || 'none');
    faces.push(f[0]);
    // Widest x across the path — the mood aspect has to move the outline itself,
    // not just the eyes.
    const xs = (await silhouette())
      .match(/-?\d+\.?\d*/g)
      .map(Number)
      .filter((_, k) => k % 2 === 0);
    widths.push(Math.max(...xs) - Math.min(...xs));
  }
  ok('four moods, four faces', new Set(faces).size === 4, faces.join(' '));
  ok(
    'mood changes the silhouette itself',
    Math.max(...widths) - Math.min(...widths) > 12,
    widths.map((w) => w.toFixed(1)).join(' / '),
  );
  await ctx.close();
}

// --- switching language must not reload the document ---
{
  const { ctx, p } = await page();
  const before = await p.locator('h1').first().innerText();
  // A survivor value on `window`: a full document reload wipes it, a client-side
  // switch keeps it. `navigation` performance entries cannot tell the two apart
  // because they are per-document and always count 1.
  await p.evaluate(() => {
    window.__noReload = 'kept';
  });
  await p.locator('.lang a[hreflang="ja"]').click();
  await p.waitForFunction((t) => document.querySelector('h1')?.innerText !== t, before, {
    timeout: 4000,
  });
  ok('language switch keeps the document', (await p.evaluate(() => window.__noReload)) === 'kept');
  ok(
    'html lang follows the switch',
    (await p.evaluate(() => document.documentElement.lang)) === 'ja',
  );
  ok('url follows the switch', new URL(p.url()).pathname.startsWith('/ja'));
  const after = await p.locator('h1').first().innerText();
  ok('copy actually changed', after !== before, JSON.stringify(after.slice(0, 18)));
  // And back, to prove the remount is not a one-way trip.
  await p.locator('.lang a[hreflang="ko"]').click();
  await p.waitForFunction((t) => document.querySelector('h1')?.innerText !== t, after, {
    timeout: 4000,
  });
  ok(
    'switch back restores the base locale',
    (await p.locator('h1').first().innerText()) === before,
  );
  ok('still no reload after two switches', (await p.evaluate(() => window.__noReload)) === 'kept');
  await ctx.close();
}

// --- the scene must have a depth field, not just parallax ---
{
  const { ctx, p } = await page();
  // Every layer that opts into depth of field, paired with its measured blur.
  const layers = await p.locator('.hero .frame').evaluate((frame) =>
    [...frame.querySelectorAll('[data-dof]')].map((el) => ({
      depth: Number(el.dataset.depth),
      declared: Number(el.dataset.dof),
      blur: Number((getComputedStyle(el).filter.match(/blur\(([\d.]+)px\)/) || [0, 0])[1]),
    })),
  );
  ok('depth-of-field layers present', layers.length >= 5, `${layers.length} layers`);
  ok(
    'every declared blur is actually applied',
    layers.every((l) => l.blur === l.declared),
    layers.map((l) => `${l.depth}:${l.blur}/${l.declared}`).join(' '),
  );

  // The island is the focal plane. Blur must fall monotonically approaching it
  // from the far side and rise again on the near side — a V, not a ladder.
  // A ladder would blur the foreground *less* than the subject, which is what
  // makes a flat scene look flat.
  const focal = layers.find((l) => l.blur === 0);
  ok('there is a sharp focal plane', !!focal, focal ? `depth ${focal.depth}` : 'none');
  const far = layers.filter((l) => l.depth < focal.depth).sort((a, b) => a.depth - b.depth);
  const near = layers.filter((l) => l.depth > focal.depth).sort((a, b) => a.depth - b.depth);
  ok(
    'far field sharpens toward the subject',
    far.length >= 2 && far.every((l, i) => i === 0 || l.blur < far[i - 1].blur),
    far.map((l) => `${l.depth}→${l.blur}`).join(' '),
  );
  ok(
    'near field softens away from the subject',
    near.length >= 2 && near.every((l, i) => i === 0 || l.blur > near[i - 1].blur),
    near.map((l) => `${l.depth}→${l.blur}`).join(' '),
  );
  const spread = Math.max(...layers.map((l) => l.blur));
  ok('the field is deep enough to read', spread >= 10, `max blur ${spread}px`);

  // Rock strata: the seams are what make the mass read as layered stone, and a
  // uniform value across the bands is what made it read as a flat funnel.
  const tones = await p.locator('.hero .isle [clip-path*="cone-clip"] rect').evaluateAll((els) =>
    els
      .map((e) => e.getAttribute('fill'))
      .filter((f) => f && f.startsWith('rgb('))
      .map((f) =>
        f
          .match(/\d+/g)
          .map(Number)
          .reduce((a, b) => a + b, 0),
      ),
  );
  ok('the underside is banded', tones.length >= 6, `${tones.length} bands`);
  ok(
    'bands carry a value range',
    Math.max(...tones) - Math.min(...tones) > 100,
    `spread ${Math.max(...tones) - Math.min(...tones)}`,
  );

  // The Mon used to be captioned; their identity is a glyph now.
  ok('no Mon captions in the hero', (await p.locator('.hero .mon .tag').count()) === 0);
  ok('each Mon carries a role glyph', (await p.locator('.hero .mon .glyph').count()) === 3);
  // The copy column and the characters must not sit on top of each other. A
  // paragraph's own box spans the full column even where the line is short, so
  // measure the glyphs: a Range yields one tight rect per rendered line.
  const hits = await p.locator('.hero').evaluate((hero) => {
    const lines = [];
    for (const el of hero.querySelectorAll('.copy h1, .copy .sub, .copy .eyebrow')) {
      for (const node of el.childNodes) {
        if (node.nodeType !== 3) continue;
        const r = document.createRange();
        r.selectNodeContents(node);
        lines.push(...[...r.getClientRects()].map((b) => b.toJSON()));
      }
    }
    const mons = [...hero.querySelectorAll('.mon')].map((e) => e.getBoundingClientRect().toJSON());
    const clash = [];
    for (const m of mons)
      for (const l of lines)
        if (m.right > l.left && m.left < l.right && m.bottom > l.top && m.top < l.bottom)
          clash.push(`${Math.round(l.left)},${Math.round(l.top)}`);
    return { clash, lines: lines.length };
  });
  ok('hero copy lines measured', hits.lines >= 3, `${hits.lines} lines`);
  ok('no Mon overlaps the hero copy', hits.clash.length === 0, hits.clash.join(' ') || 'clear');
  await ctx.close();
}

// --- the demo must show Mos doing the delegating, not Mon appearing alone ---
{
  const { ctx, p } = await page();
  await p.locator('.summon .stage').scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);

  ok('Mos is on the stage', (await p.locator('.summon .mos-node .mos').count()) === 1);
  ok('a wire per leg per Mon', (await p.locator('.summon .wire').count()) === 6);

  // Geometry is measured from the laid-out nodes, so an undrawn wire means the
  // measurement never ran — the topology would silently vanish.
  const wires = await p
    .locator('.summon .wire')
    .evaluateAll((els) => els.map((e) => e.getAttribute('d') || ''));
  ok(
    'every wire is drawn',
    wires.every((d) => /^M[\d.]+,[\d.]+C/.test(d)),
    `${wires.filter(Boolean).length}/6`,
  );
  // Endpoints must differ per Mon; a single shared line means the fan collapsed.
  const ends = new Set(wires.map((d) => d.split('C')[1]?.split(' ').pop()));
  ok('the fan is not collapsed onto one line', ends.size >= 3, `${ends.size} distinct ends`);

  const dash = await p
    .locator('.summon .pulse')
    .first()
    .evaluate((e) => e.style.strokeDasharray);
  // Chromium reports the pattern comma-separated.
  ok('pulses carry a measured dash', /^\d+(\.\d+)?,? \d/.test(dash), dash || 'none');

  await p.waitForTimeout(7000);
  const arts = await p
    .locator('.summon .art')
    .evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
  ok(
    'every artifact reaches Storage',
    arts.length === 3 && arts.every((o) => o > 0.9),
    arts.join(' '),
  );
  ok(
    'Mos ends the run pleased',
    (await mosFace(p, '.summon')) === 'happy',
    await mosFace(p, '.summon'),
  );
  await ctx.close();
}

// --- a parallel delegation must actually look parallel ---
{
  const { ctx, p } = await page();
  await p.locator('.summon .stage').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);

  /** When each Mon slot first becomes visible, in sample ticks. */
  const arrivals = async (chip) => {
    await p.locator('.summon .chip').nth(chip).click();
    const seen = [];
    for (let t = 0; t < 60; t++) {
      const now = await p
        .locator('.summon .mon-slot')
        .evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
      now.forEach((o, i) => {
        if (o > 0.5 && seen[i] === undefined) seen[i] = t;
      });
      if (seen.filter((v) => v !== undefined).length === now.length) break;
      await p.waitForTimeout(60);
    }
    return seen;
  };

  const serial = await arrivals(0);
  const spread = (a) => Math.max(...a) - Math.min(...a);
  ok('a sequential call queues its Mon', spread(serial) >= 5, `ticks ${serial.join(',')}`);

  const parallel = await arrivals(1);
  ok('a parallel call answers together', spread(parallel) <= 2, `ticks ${parallel.join(',')}`);
  await ctx.close();
}

// --- the circulation must name real surfaces and keep their theme split ---
{
  const { ctx, p } = await page();
  await p.locator('.growth .scene').scrollIntoViewIfNeeded();
  await p.waitForTimeout(700);

  const names = await p.locator('.growth .card-name').allInnerTexts();
  ok(
    'the ring is the four product surfaces',
    names.join(',') === 'Monitor,Hub,Inventory,Studio',
    names.join(','),
  );
  const plates = await p
    .locator('.growth .card')
    .evaluateAll((els) => els.map((e) => e.dataset.plate));
  ok(
    'Monitor is dark, the workshop is light',
    plates.filter((t) => t === 'dark').length === 1 &&
      plates.filter((t) => t === 'light').length === 3,
    plates.join(','),
  );
  ok('no step descriptions left', (await p.locator('.growth .step-desc').count()) === 0);

  // The reveal animates element `opacity`; if the base tone lived there too, a
  // light plate would end up covered in full-strength marks and read as dark.
  await p.locator('.growth .controls button').last().click();
  await p.waitForTimeout(900);
  const tone = await p
    .locator('.growth .node.on .mini .fill-soft')
    .first()
    .evaluate((e) => ({
      opacity: Number(getComputedStyle(e).opacity),
      fill: Number(getComputedStyle(e).fillOpacity),
    }));
  ok(
    'thumbnail marks keep their tone after the reveal',
    tone.fill < 0.6,
    `fill-opacity ${tone.fill}`,
  );
  ok('the reveal finished', tone.opacity > 0.9, `opacity ${tone.opacity}`);

  // The meter sits under the ring; pinned inside the scene it covered a card.
  const clash = await p.locator('.growth').evaluate((g) => {
    const meter = g.querySelector('.meter').getBoundingClientRect();
    return [...g.querySelectorAll('.card')].filter((c) => {
      const r = c.getBoundingClientRect();
      return (
        r.right > meter.left && r.left < meter.right && r.bottom > meter.top && r.top < meter.bottom
      );
    }).length;
  });
  ok('the meter clears the surface cards', clash === 0, `${clash} overlapping`);
  await ctx.close();
}

// --- a phone must not be able to scroll sideways ---
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1600);

  // `scrollWidth` against the requested viewport is the wrong measure — under
  // mobile emulation `innerWidth` is the layout viewport and differs from
  // `clientWidth` on its own. Whether the page actually pans is the symptom.
  const pans = async () => {
    await p.evaluate(() => window.scrollTo(9999, window.scrollY));
    const x = await p.evaluate(() => window.scrollX || document.documentElement.scrollLeft);
    await p.evaluate(() => window.scrollTo(0, window.scrollY));
    return x;
  };
  ok('hero does not pan sideways', (await pans()) === 0);

  // A surface card straddles the rim, so the ring plus one card has to fit.
  await p.locator('.growth .scene').scrollIntoViewIfNeeded();
  await p.waitForTimeout(900);
  const bounds = await p.locator('.growth .card').evaluateAll((els) => {
    const r = els.map((e) => e.getBoundingClientRect());
    return [Math.min(...r.map((b) => b.left)), Math.max(...r.map((b) => b.right))];
  });
  ok(
    'surface cards stay on screen',
    bounds[0] >= 0 && bounds[1] <= 390,
    `${Math.round(bounds[0])}..${Math.round(bounds[1])}`,
  );
  ok('circulation does not pan sideways', (await pans()) === 0);

  await p.locator('.summon .stage').scrollIntoViewIfNeeded();
  await p.waitForTimeout(900);
  const drawn = await p
    .locator('.summon .wire')
    .evaluateAll((els) => els.filter((e) => (e.getAttribute('d') || '').length > 6).length);
  ok('wires re-measure in the stacked layout', drawn === 6, `${drawn}/6`);
  ok('demo does not pan sideways', (await pans()) === 0);
  await ctx.close();
}

// --- the scene has to answer to scrolling, not only to the cursor ---
{
  const { ctx, p } = await page();
  const layerY = () =>
    p.locator('.hero .frame [data-dof]').evaluateAll((els) =>
      els.map((e) => ({
        depth: Number(e.dataset.depth),
        y: new DOMMatrixReadOnly(getComputedStyle(e).transform).f,
      })),
    );
  const rest = await layerY();
  ok(
    'depth layers start at rest',
    rest.every((l) => Math.abs(l.y) < 1),
  );

  await p.evaluate(() => window.scrollTo(0, 620));
  await p.waitForTimeout(1400);
  const moved = await layerY();
  ok(
    'every depth layer drifts on scroll',
    moved.every((l, i) => Math.abs(l.y - rest[i].y) > 1),
    moved.map((l) => `${l.depth}:${Math.round(l.y)}`).join(' '),
  );
  // Parallax means the drift scales with depth. Equal drift is just a scroll.
  const byDepth = moved
    .slice()
    .sort((a, b) => a.depth - b.depth)
    .map((l) => Math.abs(l.y));
  ok(
    'drift scales with depth',
    byDepth.every((v, i) => i === 0 || v > byDepth[i - 1]),
    byDepth.map((v) => Math.round(v)).join(' < '),
  );
  await ctx.close();
}

// --- scrolling the circulation turns it, and still earns nothing ---
{
  const { ctx, p } = await page();
  await p.locator('.growth .scene').scrollIntoViewIfNeeded();
  await p.waitForTimeout(1200);
  const spin = () =>
    p
      .locator('.growth .ring')
      .evaluate((e) => Math.round(new DOMMatrixReadOnly(getComputedStyle(e).transform).b * 1000));
  const before = await spin();
  await p.evaluate(() => window.scrollBy(0, 420));
  await p.waitForTimeout(1500);
  ok('passing through turns the ring', (await spin()) !== before);

  // Growth is the section's payoff and has to be earned by real input; the old
  // timer drift had the same hazard and the `touched` guard is what stops it.
  ok('scrolling awards no growth', (await p.locator('.growth .cycle').innerText()) === '');
  ok('and adds no inner light', (await p.locator('.growth .glob').count()) === 2);

  // Dragging still does earn it.
  const { cx, cy, r } = await ringGeometry(p);
  await p.mouse.move(cx + r, cy);
  await p.mouse.down();
  for (let a = 0; a <= 360; a += 12) {
    const rad = (a * Math.PI) / 180;
    await p.mouse.move(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r);
  }
  await p.mouse.up();
  await p.waitForTimeout(900);
  ok('a full drag still earns a cycle', (await p.locator('.growth .cycle').innerText()) !== '');
  await ctx.close();
}

// --- every locale must fit its own copy ---
for (const [path, locale] of [
  ['/', 'ko'],
  ['/en', 'en'],
  ['/ja', 'ja'],
]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199' + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1600);

  // The submit label is a different length in each locale and shares the row
  // with the field, so the field can end up narrower than its own prompt. A
  // clipped placeholder does not widen `scrollWidth`, so measure the text.
  const ph = await p.locator('.hero input[type="email"]').evaluate((inp) => {
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

  // The lead runs to a different width and a different number of lines in each
  // locale; the Japanese third line used to sit under the leftmost Mon.
  const clash = await p.locator('.hero').evaluate((hero) => {
    const lines = [];
    for (const el of hero.querySelectorAll('.copy h1, .copy .sub, .copy .eyebrow'))
      for (const node of el.childNodes) {
        if (node.nodeType !== 3) continue;
        const r = document.createRange();
        r.selectNodeContents(node);
        lines.push(...[...r.getClientRects()].map((b) => b.toJSON()));
      }
    const hits = [];
    for (const m of [...hero.querySelectorAll('.mon')].map((e) => e.getBoundingClientRect()))
      for (const l of lines)
        if (m.right > l.left && m.left < l.right && m.bottom > l.top && m.top < l.bottom)
          hits.push(`${Math.round(l.left)},${Math.round(l.top)}`);
    return hits;
  });
  ok(`${locale}: no Mon on the copy`, clash.length === 0, clash.join(' ') || 'clear');
  await ctx.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nall regression guards pass');
process.exit(fail ? 1 : 0);
