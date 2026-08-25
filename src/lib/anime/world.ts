/**
 * The world behind the page.
 *
 * Every constant here — the dent ring, the orbit periods, the poke response —
 * is ported from the Monitor interactive draft rather than re-invented, so the
 * waitlist and the product move the same way.
 *
 * One rule governs the whole file: **one writer per target per property**.
 * anime.js composes with `replace`, so a second animation touching the same
 * transform channel silently overrides the first — including a one-shot poke
 * overriding a loop for good. Pointer drift and scroll drift are therefore
 * summed by hand and applied through a single `createAnimatable` per layer,
 * and the poke only ever touches channels no loop owns.
 */
import { animate, createAnimatable, createTimer, stagger, utils, spring } from 'animejs';

type Loop = { play: () => void; pause: () => void; revert?: () => void };

/** Mos's body lives in its own viewBox; these are its centre and radius. */
const CX = 452;
const CY = 430;
const BODY_R = 192;
/** The poke uses the visual radius, which is smaller than the dent envelope. */
const POKE_R = 176;

const TAU = Math.PI * 2;

export function prefersReduced(): boolean {
  return (
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function hasFinePointer(): boolean {
  return (
    typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

const q = <T extends Element = HTMLElement>(root: ParentNode, sel: string): T[] =>
  Array.from(root.querySelectorAll<T>(sel));

/**
 * Catmull-Rom through every point, emitted as one closed cubic path.
 *
 * The dent field is sampled as 112 radii; this is what turns those samples into
 * a silhouette that has no corners at the sample boundaries.
 */
function curve(points: [number, number][]): string {
  const n = points.length;
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    d +=
      `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}` +
      ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}` +
      ` ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

/**
 * The dents that make the body read as the logo mark rather than a circle.
 *
 * Each dent owns a slot on a slowly turning ring and only wanders inside its
 * own window, so two dents can never crowd into the same place — the ring's
 * drift is what keeps the arrangement from ever repeating. Three are always
 * present; two more come and go, so a frame shows two to four concave bites.
 */
const SLOT = TAU / 5;
const WANDER = 0.42;
const DENTS = [
  {
    slot: 0,
    sway: 12700,
    dMin: 0.11,
    dMax: 0.23,
    dDur: 6100,
    wMin: 0.36,
    wMax: 0.5,
    wDur: 5300,
    core: true,
  },
  {
    slot: 1,
    sway: 9400,
    dMin: 0.095,
    dMax: 0.215,
    dDur: 7400,
    wMin: 0.4,
    wMax: 0.54,
    wDur: 6100,
    core: true,
  },
  {
    slot: 2,
    sway: 15200,
    dMin: 0.09,
    dMax: 0.205,
    dDur: 8600,
    wMin: 0.34,
    wMax: 0.48,
    wDur: 4700,
    core: true,
  },
  {
    slot: 3,
    sway: 7600,
    dMin: 0,
    dMax: 0.2,
    dDur: 5200,
    wMin: 0.3,
    wMax: 0.46,
    wDur: 4300,
    core: false,
  },
  {
    slot: 4,
    sway: 11100,
    dMin: 0,
    dMax: 0.185,
    dDur: 6800,
    wMin: 0.32,
    wMax: 0.48,
    wDur: 5900,
    core: false,
  },
];

/** Live parameters of the silhouette; the poke reaches in and disturbs these. */
interface SlimeParams {
  sx: number;
  sy: number;
  amp: number;
  r2: number;
  r3: number;
  p2: number;
  p3: number;
  ring: number;
  [key: string]: number;
}

export interface World {
  /** Poke Mos at a screen point. */
  poke: (event?: { clientX: number; clientY: number }) => void;
  /** Raise the body's activity while a Mon is running. */
  setBusy: (busy: boolean) => void;
  destroy: () => void;
}

/**
 * Wire the whole scene and start it.
 *
 * `root` is the element holding the island, Mos and every `[data-px]` layer.
 * Returns the handles the page needs; everything else stays private.
 */
export function createWorld(root: HTMLElement): World {
  if (prefersReduced()) {
    // Paint the resting silhouette once so the scene is composed, then stop.
    paintStatic(root);
    return { poke: () => {}, setBusy: () => {}, destroy: () => {} };
  }

  const loops: Loop[] = [];
  const keep = <T extends Loop>(a: T): T => {
    loops.push(a);
    return a;
  };
  const cleanups: (() => void)[] = [];
  /** The path rewriter, held so the scroll driver can idle it. */
  let slimeTimer: Loop | undefined;
  /** Raised while a Mon runs; the velocity response multiplies on top of it. */
  let busy = false;

  /* ---- the island: rock adrift, on cycles that never line up ---- */
  keep(
    animate(q(root, '[data-anim="isle-body"]'), {
      translateY: [0, -13],
      duration: 9600,
      loop: true,
      alternate: true,
      ease: 'inOut(2)',
    }),
  );
  keep(
    animate(q(root, '[data-anim="isle-mist"]'), {
      translateX: [-46, 46],
      opacity: [0.28, 0.66],
      duration: 11800,
      loop: true,
      alternate: true,
      delay: stagger(1900),
      ease: 'inOut(2)',
    }),
  );
  keep(
    animate(q(root, '[data-anim="isle-rock"]'), {
      translateY: [0, -22],
      rotate: [-9, 9],
      duration: 7400,
      loop: true,
      alternate: true,
      delay: stagger(1500),
      ease: 'inOut(2)',
    }),
  );
  keep(
    animate(q(root, '[data-anim="isle-spark"]'), {
      translateY: [0, -54],
      opacity: [0.15, 0.8, 0],
      scale: [0.7, 1.2],
      duration: 6200,
      loop: true,
      delay: stagger(980),
      ease: 'out(2)',
    }),
  );
  const motes = keep(
    animate(q(root, '[data-anim="mote"]'), {
      translateY: [0, -26],
      opacity: [0.25, 1, 0.25],
      duration: 5200,
      loop: true,
      alternate: true,
      delay: stagger(420, { from: 'center' }),
      ease: 'inOut(2)',
    }),
  );
  keep(
    animate(q(root, '[data-anim="ring-pulse"]'), {
      opacity: [0, 0.55, 0],
      scale: [0.9, 1.14],
      duration: 3600,
      loop: true,
      delay: stagger(1500),
      ease: 'out(2)',
    }),
  );

  const orbits = q(root, '[data-anim="orbit-spin"]').map((el) => {
    const dir = parseFloat((el as HTMLElement).dataset.speed ?? '1') || 1;
    return keep(
      animate(el, {
        rotate: dir > 0 ? 360 : -360,
        duration: 30000 / Math.abs(dir),
        loop: true,
        ease: 'linear',
      }),
    );
  });

  /* ---- Mos: one buoyant cycle, phase-locked ----
   *
   * The bob, the squash and the shadow used to be three loops on three
   * different periods (2800 / 2800 / 3400 ms). Each was a plain sine, so they
   * beat against each other and the body read as several parts wobbling rather
   * than one thing floating. They now share a single 3200 ms cycle with the
   * same keyframe boundaries: rise slowly and stretch, hang, drop faster and
   * squash, settle. That asymmetry — slow up, quicker down — is what makes a
   * mass look buoyant instead of oscillating.
   */
  const RISE = 1760;
  const HANG = 250;
  const FALL = 1000;
  const SETTLE = 190;

  keep(
    animate(q(root, '[data-anim="mos"]'), {
      translateY: [
        { to: -17, duration: RISE, ease: 'out(2)' },
        { to: -14, duration: HANG, ease: 'inOut(2)' },
        { to: 1.5, duration: FALL, ease: 'in(2)' },
        { to: 0, duration: SETTLE, ease: 'out(2)' },
      ],
      loop: true,
    }),
  );
  // Volume is conserved: the body narrows as it stretches and spreads as it
  // lands, which is the difference between a squash and a resize.
  keep(
    animate(q(root, '[data-anim="mos-svg"]'), {
      scaleY: [
        { to: 1.04, duration: RISE, ease: 'out(2)' },
        { to: 1.025, duration: HANG, ease: 'inOut(2)' },
        { to: 0.95, duration: FALL, ease: 'in(2)' },
        { to: 1, duration: SETTLE, ease: 'out(3)' },
      ],
      scaleX: [
        { to: 0.968, duration: RISE, ease: 'out(2)' },
        { to: 0.98, duration: HANG, ease: 'inOut(2)' },
        { to: 1.055, duration: FALL, ease: 'in(2)' },
        { to: 1, duration: SETTLE, ease: 'out(3)' },
      ],
      loop: true,
    }),
  );
  keep(
    animate(q(root, '[data-anim="mos-shadow"]'), {
      scale: [
        { to: 0.84, duration: RISE, ease: 'out(2)' },
        { to: 0.86, duration: HANG, ease: 'inOut(2)' },
        { to: 1.06, duration: FALL, ease: 'in(2)' },
        { to: 1, duration: SETTLE, ease: 'out(3)' },
      ],
      opacity: [
        { to: 0.3, duration: RISE, ease: 'out(2)' },
        { to: 0.33, duration: HANG, ease: 'inOut(2)' },
        { to: 0.62, duration: FALL, ease: 'in(2)' },
        { to: 0.55, duration: SETTLE, ease: 'out(3)' },
      ],
      loop: true,
    }),
  );
  // The aura is the only part deliberately off the cycle: a glow that pulsed in
  // lockstep with the bob would read as a second body rather than as light.
  keep(
    animate(q(root, '[data-anim="aura"]'), {
      scale: [1, 1.09],
      opacity: [0.5, 0.82],
      duration: 4300,
      loop: true,
      alternate: true,
      ease: 'inOut(2)',
    }),
  );
  keep(
    animate(q(root, '[data-anim="mos-face"]'), {
      translateY: [0, -4],
      translateX: [0, 2],
      duration: 4200,
      loop: true,
      alternate: true,
      ease: 'inOut(2)',
    }),
  );
  keep(
    animate(q(root, '[data-anim="mos-eye"]'), {
      scaleY: [
        { to: 1, duration: 1400 },
        { to: 0.08, duration: 90 },
        { to: 1, duration: 130 },
      ],
      loop: true,
      loopDelay: 2600,
      ease: 'inOut(2)',
    }),
  );

  /* ---- the liquid inside: each glob on its own slow ellipse ---- */
  const globs = q<SVGCircleElement>(root, '[data-anim="mos-glob"]').map((el) => {
    const r = parseFloat(el.dataset.orbit ?? '60') || 60;
    const dir = parseFloat(el.dataset.dir ?? '1') || 1;
    const phase = ((parseFloat(el.dataset.phase ?? '0') || 0) * Math.PI) / 180;
    const cx0 = parseFloat(el.getAttribute('cx') ?? '0');
    const cy0 = parseFloat(el.getAttribute('cy') ?? '0');
    const dur = parseFloat(el.dataset.dur ?? '9000') || 9000;

    // Keyframed rather than trigonometric per frame: eight stops around the
    // ellipse is indistinguishable at these speeds and costs nothing per frame.
    const steps = 8;
    const cxk: { to: number }[] = [];
    const cyk: { to: number }[] = [];
    for (let i = 1; i <= steps; i++) {
      const a = phase + dir * i * (TAU / steps);
      cxk.push({ to: cx0 + r * Math.cos(a) });
      cyk.push({ to: cy0 + r * Math.sin(a) * 0.74 });
    }
    utils.set(el, { cx: cx0 + r * Math.cos(phase), cy: cy0 + r * Math.sin(phase) * 0.74 });
    keep(animate(el, { cy: cyk, duration: dur, loop: true, ease: 'linear' }));
    return keep(animate(el, { cx: cxk, duration: dur, loop: true, ease: 'linear' }));
  });

  /* ---- the silhouette itself ---- */
  const shapeTargets = [
    ...q(root, '[data-anim="mos-clip-path"]'),
    ...q(root, '[data-anim="mos-fill"]'),
    ...q(root, '[data-anim="mos-rim"]'),
  ];

  const sp: SlimeParams = { sx: 1, sy: 1, amp: 1, r2: 0.022, r3: 0.016, p2: 0.7, p3: 2.4, ring: 0 };

  if (shapeTargets.length) {
    keep(animate(sp, { ring: TAU, duration: 46000, loop: true, ease: 'linear' }));
    DENTS.forEach((d, i) => {
      sp[`t${i}`] = -WANDER;
      sp[`q${i}`] = d.core ? d.dMin : 0;
      sp[`w${i}`] = d.wMin;
      keep(
        animate(sp, {
          [`t${i}`]: [-WANDER, WANDER],
          duration: d.sway,
          loop: true,
          alternate: true,
          ease: 'inOut(2)',
          delay: i * 1300,
        }),
      );
      keep(
        animate(sp, {
          [`q${i}`]: [d.dMin, d.dMax],
          duration: d.dDur,
          loop: true,
          alternate: true,
          ease: 'inOut(2)',
          delay: d.core ? i * 900 : 1400 + i * 700,
          loopDelay: d.core ? 0 : 2200,
        }),
      );
      keep(
        animate(sp, {
          [`w${i}`]: [d.wMin, d.wMax],
          duration: d.wDur,
          loop: true,
          alternate: true,
          ease: 'inOut(2)',
        }),
      );
    });
    keep(animate(sp, { p2: TAU + 0.7, duration: 21000, loop: true, ease: 'linear' }));
    keep(animate(sp, { p3: 2.4 - TAU, duration: 16000, loop: true, ease: 'linear' }));
    keep(
      animate(sp, {
        sx: [0.95, 1.05],
        duration: 9300,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );
    keep(
      animate(sp, {
        sy: [1.05, 0.95],
        duration: 7700,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );
    keep(
      animate(q(root, '[data-anim="mos-svg"]'), {
        rotate: [-7, 7],
        duration: 19000,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );

    // 40fps, not 60: the path is re-emitted every tick and the difference is
    // invisible on a shape this soft, while the saving is a third of the work.
    slimeTimer = keep(
      createTimer({
        duration: Infinity,
        frameRate: 40,
        onUpdate: () => {
          const k = sp.amp;
          const pts: [number, number][] = [];
          const n = 112;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU;
            let cut = 0;
            for (let j = 0; j < DENTS.length; j++) {
              const depth = sp[`q${j}`];
              if (depth < 0.004) continue;
              const at = DENTS[j].slot * SLOT + sp.ring + sp[`t${j}`];
              const d = Math.abs(((((a - at) % TAU) + TAU + Math.PI) % TAU) - Math.PI);
              const u = d / sp[`w${j}`];
              if (u > 2.6) continue;
              cut += depth * Math.exp(-u * u);
            }
            if (cut > 0.42) cut = 0.42;
            const ripple = Math.cos(a * 2 + sp.p2) * sp.r2 + Math.cos(a * 3 + sp.p3) * sp.r3;
            const r = BODY_R * (1 + ripple - cut * k);
            pts.push([CX + Math.cos(a) * r * sp.sx, CY + Math.sin(a) * r * sp.sy]);
          }
          const d = curve(pts);
          for (const t of shapeTargets) t.setAttribute('d', d);
        },
      }),
    );
  }

  /*
   * Parallax, and the one thing that yields to it.
   *
   * The silhouette rewrite is the most expensive item in the scene: three path
   * attributes per tick, one of them a clip path, which re-renders everything
   * clipped by it. Measured against a scroll, it is the whole difference
   * between 60 and 30 fps. So it stands down while the wheel is turning and
   * comes back a fifth of a second after it stops — nobody reads the outline of
   * a character they are scrolling past, and the scroll is what they can feel.
   */
  /*
   * Everything that reacts to how hard the page is being scrolled.
   *
   * `velocity` is signed and eased, roughly -1…1, and it decays to zero on its
   * own when the wheel stops. Three things read it, so the whole scene answers
   * one gesture instead of each part answering separately: Mos leans and lags
   * behind the sink, the orbits and the liquid inside Mos wind up, and the
   * motes streak. Speed is a property on a running loop, so none of this
   * allocates and none of it fights the loops it accelerates.
   */
  const leanEl = q(root, '[data-anim="mos-lean"]')[0];
  const lean = leanEl ? createAnimatable(leanEl, { y: 260, rotate: 260, ease: 'out(3)' }) : null;

  cleanups.push(
    attachDrift(root, {
      onScrollStart: () => slimeTimer?.pause(),
      onScrollIdle: () => slimeTimer?.play(),
      onVelocity: (v) => {
        // Mos hangs back from the world's descent, then catches up — the lag is
        // what makes it read as a body being carried rather than a decal.
        lean?.y(-v * 22).rotate(v * 5.5);
        const wind = 1 + Math.abs(v) * (busy ? 1.4 : 2.4);
        for (const o of orbits) o.speed = (busy ? 2.6 : 1) * wind;
        for (const g of globs) g.speed = (busy ? 2.1 : 1) * wind;
        motes.speed = 1 + Math.abs(v) * 2.2;
      },
    }),
  );

  /* ---- run only while visible ---- */
  cleanups.push(bindActivity(root, loops));

  let pokeTimer: ReturnType<typeof setTimeout> | undefined;

  const world: World = {
    poke(event) {
      const svg = q<SVGSVGElement>(root, '[data-anim="mos-svg"]')[0];
      if (!svg) return;
      clearTimeout(pokeTimer);

      let px = CX;
      let py = CY;
      if (event && svg.getScreenCTM) {
        const matrix = svg.getScreenCTM();
        if (matrix) {
          const p = svg.createSVGPoint();
          p.x = event.clientX;
          p.y = event.clientY;
          const local = p.matrixTransform(matrix.inverse());
          px = local.x;
          py = local.y;
        }
      }
      const ang = Math.atan2(py - CY, px - CX);
      const dist = Math.min(1, Math.hypot(px - CX, py - CY) / POKE_R);
      const at = (el: Element, x: number, y: number) => {
        el.setAttribute('cx', String(x));
        el.setAttribute('cy', String(y));
      };

      // Light, not linework: each wave is a soft radial band in the body's own
      // blues that simply scales outward, so it blends into the internal
      // gradient instead of drawing a ring on top of it.
      const dip = q(root, '[data-anim="press-dip"]')[0];
      if (dip) {
        at(dip, px, py);
        utils.set(dip, { opacity: 0.85, scale: 0.34 });
        animate(dip, { scale: 1, duration: 380, ease: 'out(2)' });
        animate(dip, { opacity: 0, scale: 1.55, duration: 1250, delay: 320, ease: 'inOut(2)' });
      }
      const bloom = q(root, '[data-anim="press-bloom"]')[0];
      if (bloom) {
        at(bloom, px - Math.cos(ang) * 10, py - Math.sin(ang) * 10 - 4);
        utils.set(bloom, { opacity: 0.8, scale: 0.4 });
        animate(bloom, { scale: 1.4, opacity: 0, duration: 1300, ease: 'out(2)' });
      }
      q(root, '[data-anim="poke-wave"]').forEach((w, i) => {
        at(w, px, py);
        utils.set(w, { opacity: 0, scale: 0.18 });
        animate(w, {
          scale: 1.1 + i * 0.34,
          duration: 1500 + i * 420,
          delay: 70 + i * 230,
          ease: 'out(2)',
        });
        animate(w, {
          opacity: [
            { to: 0.85 - i * 0.16, duration: 260 },
            { to: 0, duration: 1250 + i * 360 },
          ],
          delay: 70 + i * 230,
          ease: 'inOut(2)',
        });
      });

      // The liquid slides away from the finger, then eases home. `cx`/`cy` are
      // owned by the orbit loops, so the push has to ride translate instead.
      q(root, '[data-anim="mos-glob"]').forEach((g, i) => {
        const push = (17 - i * 2) * (0.55 + dist * 0.45);
        animate(g, {
          translateX: [
            { to: Math.cos(ang) * push, duration: 330 },
            { to: 0, duration: 1900 },
          ],
          translateY: [
            { to: Math.sin(ang) * push, duration: 330 },
            { to: 0, duration: 1900 },
          ],
          delay: i * 70,
          ease: spring({ stiffness: 34, damping: 7 }),
        });
      });

      // A give under the fingertip. `mos-give` is a wrapper no loop touches —
      // the float owns `[data-anim="mos"]` and the breath owns `mos-svg`, so
      // squashing either of those would kill the loop permanently.
      const give = q(root, '[data-anim="mos-give"]')[0];
      if (give) {
        const along = Math.abs(Math.cos(ang));
        const across = Math.abs(Math.sin(ang));
        const g = 0.09 * (0.5 + dist * 0.5);
        animate(give, {
          scaleX: [
            { to: 1 - g * along + g * across * 0.6, duration: 300 },
            { to: 1, duration: 2100 },
          ],
          scaleY: [
            { to: 1 - g * across + g * along * 0.6, duration: 300 },
            { to: 1, duration: 2100 },
          ],
          rotate: [
            { to: Math.cos(ang) * 2.4 * dist, duration: 300 },
            { to: 0, duration: 1900 },
          ],
          translateX: [
            { to: -Math.cos(ang) * 6 * dist, duration: 260 },
            { to: 0, duration: 1800 },
          ],
          translateY: [
            { to: -Math.sin(ang) * 6 * dist, duration: 260 },
            { to: 0, duration: 1800 },
          ],
          ease: spring({ stiffness: 32, damping: 6 }),
        });
      }

      // The outline's own jiggle decays over several slow wobbles.
      utils.set(sp, { r2: 0.056, r3: 0.04 });
      animate(sp, {
        r2: [
          { to: 0.012, duration: 620 },
          { to: 0.036, duration: 520 },
          { to: 0.018, duration: 480 },
          { to: 0.022, duration: 620 },
        ],
        r3: [
          { to: 0.026, duration: 620 },
          { to: 0.006, duration: 520 },
          { to: 0.021, duration: 480 },
          { to: 0.016, duration: 620 },
        ],
        ease: 'inOut(2)',
      });

      animate(q(root, '[data-anim="mos-calm"]'), {
        opacity: [1, 0],
        duration: 110,
        ease: 'out(2)',
      });
      animate(q(root, '[data-anim="mos-happy"]'), {
        opacity: [0, 1],
        duration: 240,
        ease: 'out(3)',
      });
      pokeTimer = setTimeout(() => {
        animate(q(root, '[data-anim="mos-happy"]'), { opacity: 0, duration: 220, ease: 'in(2)' });
        animate(q(root, '[data-anim="mos-calm"]'), { opacity: 1, duration: 260, ease: 'out(2)' });
      }, 1700);
    },

    setBusy(next) {
      if (busy === next) return;
      busy = next;
      // The velocity hook multiplies on top of these, so both write the same
      // base — otherwise whichever ran last would decide the resting speed.
      for (const o of orbits) o.speed = next ? 2.6 : 1;
      for (const g of globs) g.speed = next ? 2.1 : 1;
      animate(sp, { amp: next ? 1.2 : 1, duration: 900, ease: 'out(3)' });
      utils.set(q(root, '[data-anim="mos-glob"][data-tone="green"]'), {
        opacity: next ? 0.9 : 0.42,
      });
      utils.set(q(root, '[data-anim="mos-glob"][data-tone="cyan"]'), {
        opacity: next ? 0.92 : 0.8,
      });
      utils.set(q(root, '[data-anim="aura"]'), {
        background: next
          ? 'radial-gradient(closest-side,rgba(33,237,179,.32),rgba(15,111,218,.18) 58%,transparent)'
          : 'radial-gradient(closest-side,rgba(31,206,206,.3),rgba(15,111,218,.16) 58%,transparent)',
      });
    },

    destroy() {
      clearTimeout(pokeTimer);
      for (const c of cleanups) c();
      for (const l of loops) l.revert?.();
    },
  };

  return world;
}

/**
 * Depth drift over the scene.
 *
 * Two inputs, one output per layer. The pointer offset and the page's scroll
 * progress are summed by hand before anything is written, because `x` and `y`
 * normalise to the same `transform` — two animations would fight and the later
 * one would win outright.
 *
 * **The two inputs do not share a depth.** `data-px` is how far a layer moves
 * with the pointer, which is genuine perspective: the nearer a thing is, the
 * more it slides. `data-scroll` is how far it sinks as the page is read, and
 * there the island, its rings and Mos have to share one number, because Mos is
 * standing *on* the island. Scaling the sink by pointer depth pulled them apart
 * by 228 px over the page — Mos began 54 px above the rim and ended 174 px
 * below it, through the footer. A layer without `data-scroll` falls back to
 * `data-px`, so a purely atmospheric layer needs only the one attribute.
 */
interface DriftHooks {
  onScrollStart?: () => void;
  onScrollIdle?: () => void;
  /** Signed, eased scroll speed, about -1…1, decaying to 0 when the wheel stops. */
  onVelocity?: (velocity: number) => void;
}

function attachDrift(root: HTMLElement, hooks: DriftHooks = {}): () => void {
  const layers = q<HTMLElement>(root, '[data-px]');
  if (!layers.length) return () => {};

  const fine = hasFinePointer();
  const drivers = layers.map((layer) => {
    const near = parseFloat(layer.dataset.px ?? '0') || 0;
    return {
      set: createAnimatable(layer, { x: 0, y: 0, scale: 0 }),
      near,
      sink: layer.dataset.scroll === undefined ? near : parseFloat(layer.dataset.scroll) || 0,
      pan: parseFloat(layer.dataset.scrollX ?? '0') || 0,
      recede: parseFloat(layer.dataset.recede ?? '0') || 0,
    };
  });

  let px = 0;
  let py = 0;
  /** Where the page actually is, 0…1 over the whole document. */
  let scrollTarget = 0;
  /** Where the world thinks it is. Chases `scrollTarget` and never quite lands. */
  let scrollEased = 0;
  /** Unspent scroll distance in px, drained a little every frame. */
  let velRaw = 0;
  /** The eased, signed version the scene reacts to. */
  let velEased = 0;
  let lastY = 0;
  let raf = 0;
  let scrolling = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  const apply = () => {
    for (const { set, near, sink, pan, recede } of drivers) {
      set.x(-px * 34 * near + scrollEased * 150 * pan);
      // Positive: the island *sinks* as the page is read. Rising would drive it
      // straight up through the panels it sits behind, and the descent also
      // reads as the reader climbing away from where they started.
      set.y(-py * 20 * near + scrollEased * 300 * sink);
      if (recede) set.scale(1 - scrollEased * 0.09 * recede);
    }
  };

  const readScroll = () => {
    const span = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const y = window.scrollY;
    velRaw += y - lastY;
    lastY = y;
    scrollTarget = Math.min(1, y / span);
  };

  let last = 0;
  const frame = (now: number) => {
    const dt = last ? Math.min(64, now - last) : 16.667;
    last = now;
    // Frame-time corrected, so the ease reads the same at 60 and at 120Hz.
    const k = 1 - Math.pow(1 - 0.09, dt / 16.667);
    const gap = scrollTarget - scrollEased;

    // Velocity attacks fast and releases slowly: a scene that snapped back the
    // instant the wheel stopped would read as a switch rather than as momentum.
    const velTarget = Math.max(-1, Math.min(1, velRaw / 70));
    const kv =
      1 - Math.pow(1 - (Math.abs(velTarget) > Math.abs(velEased) ? 0.3 : 0.075), dt / 16.667);
    velEased += (velTarget - velEased) * kv;
    velRaw *= Math.pow(0.8, dt / 16.667);
    hooks.onVelocity?.(velEased);

    if (Math.abs(gap) > 0.00005 || Math.abs(velEased) > 0.004) {
      scrollEased += gap * k;
      apply();
      raf = requestAnimationFrame(frame);
    } else {
      scrollEased = scrollTarget;
      velEased = 0;
      velRaw = 0;
      hooks.onVelocity?.(0);
      apply();
      raf = 0;
      last = 0;
    }
  };
  const kick = () => {
    readScroll();
    if (!scrolling) {
      scrolling = true;
      hooks.onScrollStart?.();
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      scrolling = false;
      hooks.onScrollIdle?.();
    }, 200);
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const onMove = (event: PointerEvent) => {
    px = event.clientX / window.innerWidth - 0.5;
    py = event.clientY / window.innerHeight - 0.5;
    apply();
  };

  lastY = window.scrollY;
  readScroll();
  velRaw = 0;
  scrollEased = scrollTarget;
  apply();

  if (fine) window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);

  return () => {
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(idleTimer);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('scroll', kick);
    window.removeEventListener('resize', kick);
    for (const { set } of drivers) set.revert();
  };
}

/**
 * Run a set of loops only while the scene is on screen and the tab is visible.
 *
 * Both conditions are arbitrated in one place on purpose. Two independent
 * controllers calling play/pause on the same list fight: an IntersectionObserver
 * only fires on threshold crossings, so a `visibilitychange` resume would
 * restart a scene scrolled far out of view and nothing would pause it again.
 */
function bindActivity(el: Element, loops: Loop[]): () => void {
  let onScreen = true;
  let tabVisible = !document.hidden;
  const sync = () => {
    for (const l of loops) {
      try {
        if (onScreen && tabVisible) l.play();
        else l.pause();
      } catch {
        /* an instance may already be reverted */
      }
    }
  };

  const onVisibility = () => {
    tabVisible = !document.hidden;
    sync();
  };
  document.addEventListener('visibilitychange', onVisibility);

  let io: IntersectionObserver | undefined;
  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) onScreen = entry.isIntersecting;
        sync();
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
  }

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    io?.disconnect();
  };
}

/**
 * Reduced motion still gets a body, just a still one.
 *
 * Without this the clip path keeps its authored `d` and the scene composes
 * fine — but the resting dent field is what the shape is *supposed* to be, so
 * emit one frame of it and leave it there.
 */
function paintStatic(root: HTMLElement): void {
  const targets = [
    ...q(root, '[data-anim="mos-clip-path"]'),
    ...q(root, '[data-anim="mos-fill"]'),
    ...q(root, '[data-anim="mos-rim"]'),
  ];
  if (!targets.length) return;
  const pts: [number, number][] = [];
  const n = 112;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    let cut = 0;
    for (let j = 0; j < 3; j++) {
      const at = DENTS[j].slot * SLOT;
      const d = Math.abs(((((a - at) % TAU) + TAU + Math.PI) % TAU) - Math.PI);
      const u = d / DENTS[j].wMin;
      if (u > 2.6) continue;
      cut += DENTS[j].dMin * Math.exp(-u * u);
    }
    const r = BODY_R * (1 - cut);
    pts.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r]);
  }
  const d = curve(pts);
  for (const t of targets) t.setAttribute('d', d);
}
