import { animate, createTimer, utils, spring } from 'animejs';

/**
 * Procedural slime blob — the shared engine behind Mos and every Mon.
 *
 * The silhouette is a radial ring of `points` samples. Each "dent" owns a slot
 * on a slowly turning ring and only wanders inside its own window, so two dents
 * can never crowd into the same spot — the ring's drift is what makes the
 * placement read as free rather than periodic. Two low-order cosine ripples sit
 * underneath so the body breathes even when every dent is shallow.
 *
 * animejs owns all the scalars (dent depth/width/angle, ripple phase, squish);
 * a single `createTimer` frame loop turns them into one path string per frame
 * and writes it to every target. That keeps the whole character on animejs's
 * clock — pausing the timer pauses the creature.
 */

const TAU = Math.PI * 2;

export interface BlobDent {
  /** Which slot on the turning ring this dent owns. */
  slot: number;
  /** Time for one full angular wander sweep (ms). */
  sway: number;
  /** Depth range as a fraction of the radius. */
  depthMin: number;
  depthMax: number;
  depthDuration: number;
  /** Angular half-width of the dent, in radians. */
  widthMin: number;
  widthMax: number;
  widthDuration: number;
  /** Core dents are always present; non-core ones fade fully out between beats. */
  core: boolean;
}

export interface BlobOptions {
  /** Elements whose `d` attribute receives the silhouette (fill, rim, clipPath). */
  targets: (SVGElement | null | undefined)[];
  cx: number;
  cy: number;
  radius: number;
  /** Ring samples. 112 for a hero blob, 56–64 is plenty for a small one. */
  points?: number;
  /** Frames per second for the path rewrite. */
  frameRate?: number;
  /** Scales every duration; > 1 is slower, < 1 is livelier. */
  timeScale?: number;
  dents?: BlobDent[];
  /** Amplitude of the two background ripples, as a fraction of the radius. */
  ripple?: [number, number];
}

export interface BlobHandle {
  /** Animations + timer, so a caller can pause/resume the whole creature. */
  instances: { pause: () => void; play: () => void }[];
  /** Multiply the dent depth — used to make a blob look busier while working. */
  setEnergy: (energy: number, duration?: number) => void;
  /** Squash toward a point (SVG user units) — the poke reaction. */
  squish: (dx: number, dy: number, strength?: number) => void;
  /** Hold a resting aspect — how tall or wide the body sits in a given mood. */
  setAspect: (x: number, y: number, duration?: number) => void;
  destroy: () => void;
}

const DEFAULT_DENTS: BlobDent[] = [
  {
    slot: 0,
    sway: 12700,
    depthMin: 0.11,
    depthMax: 0.23,
    depthDuration: 6100,
    widthMin: 0.36,
    widthMax: 0.5,
    widthDuration: 5300,
    core: true,
  },
  {
    slot: 1,
    sway: 9400,
    depthMin: 0.095,
    depthMax: 0.215,
    depthDuration: 7400,
    widthMin: 0.4,
    widthMax: 0.54,
    widthDuration: 6100,
    core: true,
  },
  {
    slot: 2,
    sway: 15200,
    depthMin: 0.09,
    depthMax: 0.205,
    depthDuration: 8600,
    widthMin: 0.34,
    widthMax: 0.48,
    widthDuration: 4700,
    core: true,
  },
  {
    slot: 3,
    sway: 7600,
    depthMin: 0,
    depthMax: 0.2,
    depthDuration: 5200,
    widthMin: 0.3,
    widthMax: 0.46,
    widthDuration: 4300,
    core: false,
  },
  {
    slot: 4,
    sway: 11100,
    depthMin: 0,
    depthMax: 0.185,
    depthDuration: 6800,
    widthMin: 0.32,
    widthMax: 0.48,
    widthDuration: 5900,
    core: false,
  },
];

/** Closed Catmull-Rom → cubic Bézier. Keeps the outline smooth across the seam. */
export function closedCurve(p: [number, number][]): string {
  const n = p.length;
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    d +=
      `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}` +
      ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}` +
      ` ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

export function createBlob(options: BlobOptions): BlobHandle {
  const {
    cx,
    cy,
    radius,
    points = 112,
    frameRate = 40,
    timeScale = 1,
    dents = DEFAULT_DENTS,
    ripple = [0.022, 0.016],
  } = options;

  const targets = options.targets.filter((t): t is SVGElement => !!t);
  const instances: { pause: () => void; play: () => void }[] = [];
  const keep = <T extends { pause: () => void; play: () => void }>(a: T) => {
    instances.push(a);
    return a;
  };

  const slotSize = TAU / dents.length;
  const wander = 0.42;
  const dur = (ms: number) => ms * timeScale;

  // Every animated scalar lives on one plain object so animejs can drive it and
  // the frame loop can read it without touching the DOM.
  //
  // `sx`/`sy` carry the ambient drift, `qx`/`qy` the poke reaction and
  // `ax`/`ay` the mood aspect, kept apart on purpose. animejs composes with
  // `replace` by default, and when a one-shot tween overlaps a *looping* one on
  // the same target+property it overrides the loop permanently — see
  // `overrideTween` in animation/composition.js, whose own TODO notes it cannot
  // yet window the override to the overlapping iterations. Giving each writer
  // its own pair and multiplying all three in `paint()` keeps one writer per
  // property.
  const p: Record<string, number> = {
    sx: 1,
    sy: 1,
    qx: 1,
    qy: 1,
    ax: 1,
    ay: 1,
    amp: 1,
    ripple2: ripple[0],
    ripple3: ripple[1],
    phase2: 0.7,
    phase3: 2.4,
    ring: 0,
  };

  keep(animate(p, { ring: TAU, duration: dur(46000), loop: true, ease: 'linear' }));

  dents.forEach((d, i) => {
    p[`angle${i}`] = -wander;
    p[`depth${i}`] = d.core ? d.depthMin : 0;
    p[`width${i}`] = d.widthMin;

    keep(
      animate(p, {
        [`angle${i}`]: [-wander, wander],
        duration: dur(d.sway),
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
        delay: dur(i * 1300),
      }),
    );
    keep(
      animate(p, {
        [`depth${i}`]: [d.depthMin, d.depthMax],
        duration: dur(d.depthDuration),
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
        delay: dur(d.core ? i * 900 : 1400 + i * 700),
        loopDelay: dur(d.core ? 0 : 2200),
      }),
    );
    keep(
      animate(p, {
        [`width${i}`]: [d.widthMin, d.widthMax],
        duration: dur(d.widthDuration),
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );
  });

  keep(animate(p, { phase2: TAU + 0.7, duration: dur(21000), loop: true, ease: 'linear' }));
  keep(animate(p, { phase3: 2.4 - TAU, duration: dur(16000), loop: true, ease: 'linear' }));

  const drift = (key: string, from: number, to: number, ms: number) =>
    keep(
      animate(p, {
        [key]: [from, to],
        duration: dur(ms),
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );
  drift('sx', 0.95, 1.05, 9300);
  drift('sy', 1.05, 0.95, 7700);

  /** Turn the current scalar state into one path string and write it out. */
  const paint = () => {
    const k = p.amp;
    const ring: [number, number][] = [];
    for (let n = 0; n < points; n++) {
      const a = (n / points) * TAU;
      let cut = 0;
      for (let i = 0; i < dents.length; i++) {
        const depth = p[`depth${i}`];
        if (depth < 0.004) continue;
        const at = dents[i].slot * slotSize + p.ring + p[`angle${i}`];
        // Shortest signed angular distance, folded into [0, π].
        const dist = Math.abs(((((a - at) % TAU) + TAU + Math.PI) % TAU) - Math.PI);
        const u = dist / p[`width${i}`];
        if (u > 2.6) continue;
        cut += depth * Math.exp(-u * u);
      }
      if (cut > 0.42) cut = 0.42;
      const wave = Math.cos(a * 2 + p.phase2) * p.ripple2 + Math.cos(a * 3 + p.phase3) * p.ripple3;
      const r = radius * (1 + wave - cut * k);
      ring.push([
        cx + Math.cos(a) * r * p.sx * p.qx * p.ax,
        cy + Math.sin(a) * r * p.sy * p.qy * p.ay,
      ]);
    }
    const d = closedCurve(ring);
    for (const t of targets) t.setAttribute('d', d);
  };

  // Paint once, synchronously. The targets ship with an empty `d`, so without
  // this the creature is invisible until the timer's first tick — and a caller
  // that pauses the timer immediately (reduced motion) would never get a tick
  // at all, leaving nothing on screen.
  paint();

  const timer = createTimer({ duration: Infinity, frameRate, onUpdate: paint });
  keep(timer);

  return {
    instances,
    setEnergy(energy, duration = 900) {
      animate(p, { amp: energy, duration, ease: 'out(3)' });
    },
    setAspect(x, y, duration = 620) {
      if (duration <= 0) utils.set(p, { ax: x, ay: y });
      else animate(p, { ax: x, ay: y, duration, ease: 'out(3)' });
    },
    squish(dx, dy, strength = 1) {
      // Poke direction decides which axis gives; the spring supplies the wobble.
      // Writes qx/qy, never sx/sy — see the note on `p` above.
      const angle = Math.atan2(dy, dx);
      const push = 0.1 * strength;
      utils.set(p, {
        qx: 1 + Math.cos(angle) * push,
        qy: 1 + Math.sin(angle) * push,
      });
      animate(p, {
        qx: 1,
        qy: 1,
        ease: spring({ stiffness: 34, damping: 7 }),
      });
    },
    destroy() {
      for (const a of instances) {
        const revertible = a as unknown as { revert?: () => void; cancel?: () => void };
        if (revertible.revert) revertible.revert();
        else if (revertible.cancel) revertible.cancel();
      }
      instances.length = 0;
    },
  };
}
