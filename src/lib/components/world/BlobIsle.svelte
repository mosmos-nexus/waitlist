<script lang="ts">
  import { onMount } from 'svelte';
  import { animate, utils } from 'animejs';
  import { createBlob, type BlobHandle, type BlobDent } from '$lib/anime/blob';
  import { prefersReduced, bindActivity, isCompactViewport } from '$lib/anime/motion';

  interface Props {
    /** Accessible name for the scene. */
    label?: string;
  }

  let { label }: Props = $props();

  /**
   * The island, in the same language as its inhabitants.
   *
   * The old one was hand-authored geometry: a hard elliptical plate over a torn
   * rock cone cut into strata. Accurate to a sky island and wrong for this
   * world — Mos and every Mon is a soft wobbling blob, and the ground they stand
   * on was the only thing on screen with corners.
   *
   * So the island runs the same engine. Two blobs: a wide flattened crown for
   * the surface and a rounder mass hanging under it, both breathing on their own
   * clocks, the whole thing bobbing. Nothing here is a straight line.
   */

  const uid = $props.id();
  const g = (n: string) => `${n}-${uid}`;

  // Authored in a 1200×640 box. The crown spans most of the width; the mass
  // below is narrower and much rounder, so the island reads as floating rather
  // than as something snapped off a cliff.
  const CROWN = { cx: 600, cy: 268, r: 292 };
  const MASS = { cx: 600, cy: 330, r: 248 };

  /** Wide and shallow for the crown, nearly round for the mass. */
  const CROWN_ASPECT: [number, number] = [1.7, 0.4];
  const MASS_ASPECT: [number, number] = [1.03, 0.92];

  /**
   * Softer than a creature's. Mos needs dents deep enough to read as a face's
   * body; ground that wobbled that hard would look like jelly.
   */
  const ISLE_DENTS: BlobDent[] = [
    {
      slot: 0,
      sway: 21000,
      depthMin: 0.03,
      depthMax: 0.075,
      depthDuration: 12000,
      widthMin: 0.5,
      widthMax: 0.72,
      widthDuration: 9800,
      core: true,
    },
    {
      slot: 1,
      sway: 17400,
      depthMin: 0.025,
      depthMax: 0.065,
      depthDuration: 14200,
      widthMin: 0.46,
      widthMax: 0.68,
      widthDuration: 11400,
      core: true,
    },
    {
      slot: 2,
      sway: 25600,
      depthMin: 0.02,
      depthMax: 0.06,
      depthDuration: 16400,
      widthMin: 0.44,
      widthMax: 0.66,
      widthDuration: 13000,
      core: true,
    },
  ];

  /** Small round companions, drifting. Plain ellipses — a blob engine each would
   *  cost five timers for shapes this size. */
  const PEBBLES = [
    { cx: 168, cy: 214, rx: 42, ry: 30, o: 0.5, d: 0 },
    { cx: 1046, cy: 176, rx: 34, ry: 25, o: 0.42, d: 1.4 },
    { cx: 1112, cy: 340, rx: 26, ry: 19, o: 0.3, d: 2.6 },
    { cx: 92, cy: 372, rx: 30, ry: 22, o: 0.34, d: 3.6 },
  ];

  let rootEl = $state<HTMLDivElement | null>(null);
  let svgEl = $state<SVGSVGElement | null>(null);
  let crown: BlobHandle | null = null;
  let mass: BlobHandle | null = null;

  const q = <T extends Element>(sel: string): T[] =>
    svgEl ? Array.from(svgEl.querySelectorAll<T>(sel)) : [];

  onMount(() => {
    if (!svgEl || !rootEl) return;
    const reduced = prefersReduced();
    const compact = isCompactViewport();
    const loops: { play: () => void; pause: () => void }[] = [];

    mass = createBlob({
      targets: q('[data-isle="mass"]'),
      cx: MASS.cx,
      cy: MASS.cy,
      radius: MASS.r,
      points: compact ? 60 : 96,
      frameRate: compact ? 30 : 60,
      dents: ISLE_DENTS,
      ripple: [0.018, 0.012],
      timeScale: 1.4,
    });
    crown = createBlob({
      targets: q('[data-isle="crown"]'),
      cx: CROWN.cx,
      cy: CROWN.cy,
      radius: CROWN.r,
      points: compact ? 72 : 112,
      frameRate: compact ? 30 : 60,
      dents: ISLE_DENTS,
      ripple: [0.014, 0.01],
      timeScale: 1.2,
    });
    // The aspect is what turns two circles into a crown and a mass. It applies
    // under reduced motion too — a resting posture, not an animation.
    mass.setAspect(MASS_ASPECT[0], MASS_ASPECT[1], 0);
    crown.setAspect(CROWN_ASPECT[0], CROWN_ASPECT[1], 0);

    if (reduced) {
      for (const b of [crown, mass]) for (const i of b.instances) i.pause();
      return () => {
        crown?.destroy();
        mass?.destroy();
      };
    }

    loops.push(...crown.instances, ...mass.instances);

    // Buoyancy. On `.bob`, never on the root: the journey writes the root's
    // transform from scroll position, and animejs composes with `replace` — one
    // would silently cancel the other.
    loops.push(
      animate(rootEl.querySelector('.bob')!, {
        translateY: [0, -18],
        duration: 7200,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );

    for (const el of q<SVGElement>('[data-isle="pebble"]')) {
      const delay = Number(el.dataset.delay ?? 0) * 1000;
      loops.push(
        animate(el, {
          translateY: [0, -26],
          translateX: [0, 9],
          duration: 8600,
          loop: true,
          alternate: true,
          delay,
          ease: 'inOut(2)',
        }),
      );
    }
    loops.push(
      animate(q('[data-isle="haze"]'), {
        translateX: [-40, 40],
        opacity: [0.3, 0.66],
        duration: 13000,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );

    const stopActivity = bindActivity(rootEl, loops);
    return () => {
      stopActivity();
      crown?.destroy();
      mass?.destroy();
      for (const l of loops) (l as unknown as { revert?: () => void }).revert?.();
    };
  });

  /** Brightens the crown pool — the journey calls this as Mos wakes. */
  export function setWarmth(v: number) {
    if (!svgEl) return;
    utils.set(q('[data-isle="pool"]'), { opacity: 0.18 + v * 0.5 });
    utils.set(q('[data-rim]'), { opacity: 0.35 + v * 0.5 });
  }
</script>

<div class="isle" bind:this={rootEl}>
  <div class="bob">
    <svg
      bind:this={svgEl}
      viewBox="0 0 1200 640"
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={g('halo')}>
          <stop offset="0" stop-color="rgb(0,200,204)" stop-opacity="0.2" />
          <stop offset="0.55" stop-color="rgb(15,111,218)" stop-opacity="0.1" />
          <stop offset="1" stop-color="rgb(15,111,218)" stop-opacity="0" />
        </radialGradient>
        <!-- The mass is lit from above, so it darkens downward -->
        <linearGradient id={g('mass')} x1="0.4" y1="0" x2="0.6" y2="1">
          <stop offset="0" stop-color="#0C3C6D" />
          <stop offset="0.45" stop-color="#07203A" />
          <stop offset="1" stop-color="#030C17" />
        </linearGradient>
        <linearGradient id={g('crown')} x1="0.12" y1="0" x2="0.86" y2="1">
          <stop offset="0" stop-color="#1E5893" />
          <stop offset="0.5" stop-color="#12395F" />
          <stop offset="1" stop-color="#0C2743" />
        </linearGradient>
        <linearGradient id={g('rim')} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stop-color="#8CE8F2" stop-opacity="0.1" />
          <stop offset="0.4" stop-color="#B7F4FA" stop-opacity="0.5" />
          <stop offset="1" stop-color="#8CE8F2" stop-opacity="0.06" />
        </linearGradient>
        <radialGradient id={g('pool')}>
          <stop offset="0" stop-color="#5FEDE4" stop-opacity="0.6" />
          <stop offset="0.6" stop-color="#31DCDC" stop-opacity="0.18" />
          <stop offset="1" stop-color="#31DCDC" stop-opacity="0" />
        </radialGradient>
        <linearGradient id={g('haze')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="rgb(160,206,247)" stop-opacity="0" />
          <stop offset="0.4" stop-color="rgb(160,206,247)" stop-opacity="0.16" />
          <stop offset="0.7" stop-color="rgb(160,206,247)" stop-opacity="0.08" />
          <stop offset="1" stop-color="rgb(160,206,247)" stop-opacity="0" />
        </linearGradient>
        <clipPath id={g('crown-clip')}><path data-isle="crown" d="" /></clipPath>
      </defs>

      <ellipse cx="600" cy="300" rx="560" ry="250" fill="url(#{g('halo')})" />

      <!-- Pebbles ride behind the island, so nothing crosses its outline -->
      <g fill="#0B3A6B" opacity="0.9">
        {#each PEBBLES as p, i (i)}
          <ellipse
            data-isle="pebble"
            data-delay={p.d}
            cx={p.cx}
            cy={p.cy}
            rx={p.rx}
            ry={p.ry}
            opacity={p.o}
          />
        {/each}
      </g>

      <!-- The mass first: the crown paints over its upper half -->
      <path data-isle="mass" d="" fill="url(#{g('mass')})" />
      <ellipse cx="600" cy="470" rx="150" ry="70" fill="#02090F" opacity="0.5" />

      <path data-isle="crown" d="" fill="url(#{g('crown')})" />

      <g clip-path="url(#{g('crown-clip')})">
        <!-- Where Mos rests. Brightens as the journey warms up. -->
        <ellipse
          data-isle="pool"
          cx="600"
          cy="258"
          rx="210"
          ry="62"
          fill="url(#{g('pool')})"
          opacity="0.3"
        />
        <ellipse cx="602" cy="272" rx="132" ry="34" fill="#02080F" opacity="0.42" />
        <!-- Soft light pooling toward the front edge, no facets -->
        <ellipse cx="420" cy="228" rx="230" ry="52" fill="#3E8FE0" opacity="0.09" />
        <ellipse cx="830" cy="296" rx="200" ry="44" fill="#02080F" opacity="0.26" />
      </g>

      <!-- One highlight along the crown's own outline — same `data-isle` so the
           engine writes this path too; `data-rim` is only for the warmth ramp. -->
      <path
        data-isle="crown"
        data-rim="1"
        d=""
        fill="none"
        stroke="url(#{g('rim')})"
        stroke-width="2.4"
        opacity="0.6"
      />

      <ellipse
        data-isle="haze"
        cx="600"
        cy="404"
        rx="430"
        ry="26"
        fill="url(#{g('haze')})"
        opacity="0.45"
      />
      <ellipse
        data-isle="haze"
        cx="600"
        cy="452"
        rx="330"
        ry="19"
        fill="url(#{g('haze')})"
        opacity="0.3"
      />
    </svg>
  </div>
</div>

<style>
  /* Fills the box it is placed in, so the layout owns the size. The z-index is
     what the orbiting surfaces sort against — far side behind, near side in
     front. */
  .isle {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }
  .bob,
  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
</style>
