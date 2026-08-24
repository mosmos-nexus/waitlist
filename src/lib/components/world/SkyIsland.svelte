<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { animate, stagger } from 'animejs';
  import {
    prefersReduced,
    attachPointerParallax,
    bindActivity,
    isCompactViewport,
  } from '$lib/anime/motion';

  interface Props {
    /** Content that sits on the island's plate — normally Mos. */
    stage?: Snippet;
    /** Content that stands on the island beside Mos — the Mon. */
    orbit?: Snippet;
    /** Accessible name for the scene as a whole. */
    label?: string;
  }

  let { stage, orbit, label }: Props = $props();

  // The island's silhouette. One outline drives the top plate, its drop shadow,
  // the rim highlight and the clip that keeps the surface detail on the plate.
  const ISLE =
    'M1033.4,470.0C1032.4,475.6 1028.7,481.3 1023.4,486.8C1018.2,492.2 1011.3,497.6 1002.0,502.6C992.7,507.6 981.3,512.6 967.5,516.8C953.7,520.9 936.8,524.7 919.1,527.5C901.5,530.4 881.1,532.3 861.8,533.9C842.6,535.4 822.6,536.0 803.6,536.9C784.7,537.8 766.7,538.3 748.0,539.2C729.2,540.0 710.9,541.1 691.0,541.8C671.0,542.5 649.7,543.5 628.4,543.3C607.1,543.1 583.8,542.5 563.2,540.6C542.5,538.8 521.8,535.8 504.5,532.2C487.2,528.7 472.0,524.0 459.4,519.2C446.9,514.5 437.0,509.1 429.0,503.7C421.0,498.3 414.9,492.7 411.4,487.1C407.9,481.4 406.3,475.6 408.2,470.0C410.0,464.4 415.0,458.7 422.4,453.6C429.9,448.4 441.2,443.5 452.9,439.1C464.5,434.6 478.7,430.8 492.2,427.0C505.6,423.1 519.4,419.7 533.6,416.2C547.8,412.6 561.5,409.0 577.3,405.7C593.1,402.5 609.9,399.1 628.4,396.7C646.9,394.3 667.8,392.3 688.3,391.5C708.8,390.7 731.1,391.0 751.6,391.9C772.1,392.8 792.3,394.9 811.3,396.9C830.4,399.0 848.3,401.6 866.1,404.2C883.9,406.9 901.4,409.6 918.3,412.7C935.2,415.9 952.8,419.2 967.5,423.2C982.3,427.3 996.7,431.8 1007.0,436.8C1017.3,441.7 1024.9,447.4 1029.3,452.9C1033.7,458.4 1034.4,464.4 1033.4,470.0Z';

  /**
   * The torn-off underside, as one jagged silhouette.
   *
   * It used to be a dozen flat polygons over a wireframe of seam lines, which is
   * what made the island read as a diagram of an island. Now the same shape is
   * cut into horizontal strata instead: rock exposes its layers, and layers are
   * what tell the eye how far down it goes.
   */
  const CONE =
    'M500,466L940,466L922,514L892,562L868,608L888,624L852,668L816,716L780,762L744,800L714,832L690,858L666,822L642,778L614,728L588,674L560,614L534,552L514,506Z';

  /**
   * Rock strata, top to bottom. Each band is the cone clipped to a slice, and
   * each carries a lighter seam along its upper edge — the seams are what make
   * the mass read as layered stone. Without them six near-black bands stack
   * into one flat silhouette, which is what the underside looked like before.
   */
  const STRATA: { y: number; h: number; fill: string; seam: string }[] = [
    { y: 452, h: 84, fill: 'rgb(11,58,104)', seam: 'rgba(0,0,0,0)' },
    { y: 536, h: 38, fill: 'rgb(11,58,104)', seam: 'rgba(164,226,255,.34)' },
    { y: 574, h: 42, fill: 'rgb(8,44,82)', seam: 'rgba(140,204,240,.24)' },
    { y: 616, h: 44, fill: 'rgb(6,33,63)', seam: 'rgba(120,180,220,.19)' },
    { y: 660, h: 50, fill: 'rgb(4,24,47)', seam: 'rgba(104,158,198,.15)' },
    { y: 710, h: 58, fill: 'rgb(3,17,34)', seam: 'rgba(88,136,176,.12)' },
    { y: 768, h: 62, fill: 'rgb(2,11,23)', seam: 'rgba(74,116,152,.09)' },
    { y: 830, h: 84, fill: 'rgb(1,7,15)', seam: 'rgba(60,96,130,.07)' },
  ];

  /** Near-vertical fractures. Horizontal bands alone read as a bar chart. */
  const FRACTURES = [
    'M566,540L610,724L636,806',
    'M700,536L714,700L708,846',
    'M812,538L788,690L760,782',
    'M876,540L852,646',
  ];

  /**
   * Slivers of exposed mineral across the strata. Short, off-horizontal and
   * unevenly spaced on purpose — evenly spaced marks read as a texture swatch.
   */
  const VEINS = [
    'M524,534L594,566',
    'M614,600L692,626',
    'M746,592L822,616',
    'M566,650L622,686',
    'M690,690L758,710',
    'M646,758L698,782',
    'M858,536L918,556',
  ];

  /** Crystals hanging off the underside — the island's only warm-lit detail. */
  const CRYSTALS = [
    { points: '584,652 598,646 592,712', o: 0.9 },
    { points: '648,770 662,762 656,824', o: 0.75 },
    { points: '706,850 716,842 712,898', o: 0.6 },
    { points: '800,736 812,728 806,784', o: 0.8 },
    { points: '870,624 880,618 876,664', o: 0.65 },
  ];

  /** Surface facets clipped to the plate — the low-poly ground. */
  const FACETS: { fill: string; opacity: number; points: string[] }[] = [
    {
      fill: 'rgb(10,74,146)',
      opacity: 0.3,
      points: [
        '576,452 654,438 708,452 646,470',
        '744,432 822,436 852,452 776,456',
        '606,498 692,506 758,496 678,486',
        '830,478 892,484 918,470 862,462',
      ],
    },
    {
      fill: 'rgb(16,104,198)',
      opacity: 0.16,
      points: ['504,464 562,450 594,462 532,476', '706,420 762,416 784,428 720,432'],
    },
    {
      fill: 'rgb(2,14,27)',
      opacity: 0.5,
      points: ['760,470 856,478 902,496 792,494', '640,428 712,424 744,436 664,442'],
    },
  ];

  /**
   * Other islands, far off. Two shapes at a fraction of the size, pushed into
   * the blurred far layer. The old scene had bare hexagons sitting at the same
   * sharpness as everything else, which read as stray interface furniture
   * rather than as land in the distance.
   */
  const ISLETS = [
    { x: 1188, y: 402, s: 0.2, flip: false },
    { x: 1264, y: 508, s: 0.13, flip: true },
    { x: 214, y: 452, s: 0.16, flip: true },
  ];

  /** Light coming down through the haze onto the plate. */
  const SHAFTS = [
    { x: 566, w: 34, skew: -13 },
    { x: 720, w: 52, skew: -4 },
    { x: 892, w: 28, skew: 7 },
  ];

  const SPARKS = [
    { cx: 476, cy: 560, r: 2.2, o: 0.55 },
    { cx: 588, cy: 640, r: 1.8, o: 0.45 },
    { cx: 812, cy: 620, r: 2, o: 0.5 },
    { cx: 930, cy: 540, r: 1.7, o: 0.4 },
    { cx: 700, cy: 700, r: 2, o: 0.35 },
  ];

  /** Drifting motes in the near field. */
  const MOTES = [
    { x: 16, y: 62, s: 3, c: 'rgba(49,220,220,.8)' },
    { x: 29, y: 74, s: 2, c: 'rgba(236,237,246,.7)' },
    { x: 44, y: 82, s: 3, c: 'rgba(33,237,179,.75)' },
    { x: 58, y: 70, s: 2, c: 'rgba(49,220,220,.6)' },
    { x: 69, y: 79, s: 3, c: 'rgba(236,237,246,.6)' },
    { x: 80, y: 64, s: 2, c: 'rgba(31,206,206,.7)' },
    { x: 36, y: 56, s: 2, c: 'rgba(236,237,246,.5)' },
    { x: 62, y: 52, s: 2, c: 'rgba(33,237,179,.5)' },
  ];

  let frameEl = $state<HTMLDivElement | null>(null);
  let worldEl = $state<HTMLDivElement | null>(null);

  /**
   * The scene is authored at 1440×900, so it needs a scale to land well on any
   * viewport. A straight `width / 1440` would shrink the island to a pebble on
   * a phone, so the curve is deliberately flattened: it stays generous at the
   * narrow end and tops out just above 1 on very wide screens. Short viewports
   * take an extra squeeze so the plate never pushes the form off-screen.
   */
  function fit() {
    if (!worldEl) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const base = Math.min(1.05, Math.max(0.5, 0.42 + (w / 1440) * 0.52));
    const short = Math.min(1, h / 760);
    worldEl.style.setProperty('--isle-scale', (base * short).toFixed(4));
  }

  onMount(() => {
    fit();
    window.addEventListener('resize', fit);
    if (!frameEl || prefersReduced()) {
      return () => window.removeEventListener('resize', fit);
    }

    // On a phone the same scene runs on a fraction of the pixels and the power
    // budget, so the decorative layers keep fewer moving parts. The surplus
    // nodes stay in the DOM (CSS hides them) — it's the running animation that
    // costs, not the element.
    const compact = isCompactViewport();
    // Keeps floor(n/2), matching the `nth-*(n+…)` rules in the compact media
    // query exactly. Ceil left one rock and one spark animating behind
    // `display: none` — no visual defect, but precisely the waste the trim
    // exists to avoid.
    const q = <T extends Element>(sel: string) => {
      const all = Array.from(frameEl!.querySelectorAll<T>(sel));
      return compact ? all.slice(0, Math.max(1, Math.floor(all.length / 2))) : all;
    };
    const loops: { play: () => void; pause: () => void }[] = [];
    const keep = <T extends { play: () => void; pause: () => void }>(a: T) => {
      loops.push(a);
      return a;
    };

    // The island breathes on a slow cycle; the mist sheets slide across it.
    keep(
      animate(q('[data-anim="isle-body"]'), {
        translateY: [0, -13],
        duration: 9600,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );
    keep(
      animate(q('[data-anim="isle-mist"]'), {
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
      animate(q('[data-anim="isle-rock"]'), {
        translateY: [0, -22],
        rotate: [-8, 8],
        duration: 7400,
        loop: true,
        alternate: true,
        delay: stagger(1200),
        ease: 'inOut(2)',
      }),
    );
    keep(
      animate(q('[data-anim="isle-spark"]'), {
        opacity: [0.2, 0.9],
        translateY: [0, -14],
        duration: 4200,
        loop: true,
        alternate: true,
        delay: stagger(520),
        ease: 'inOut(2)',
      }),
    );
    keep(
      animate(q('[data-anim="mote"]'), {
        translateY: [0, -26],
        opacity: [0.25, 1, 0.25],
        duration: 5200,
        loop: true,
        alternate: true,
        delay: stagger(420, { from: 'center' }),
        ease: 'inOut(2)',
      }),
    );
    // The crystals under the island catch the light unevenly.
    keep(
      animate(q('[data-anim="crystal"]'), {
        opacity: [0.35, 1],
        duration: 5600,
        loop: true,
        alternate: true,
        delay: stagger(740),
        ease: 'inOut(3)',
      }),
    );
    // Light shafts wander and breathe — the slowest thing in the scene, so the
    // sky never looks like a still image behind a moving island.
    keep(
      animate(q('[data-anim="shaft"]'), {
        opacity: [0.22, 0.62],
        scaleX: [0.9, 1.12],
        duration: 14200,
        loop: true,
        alternate: true,
        delay: stagger(2600),
        ease: 'inOut(2)',
      }),
    );
    keep(
      animate(q('[data-anim="cloud"]'), {
        translateX: [-70, 70],
        duration: 32000,
        loop: true,
        alternate: true,
        delay: stagger(6200),
        ease: 'inOut(2)',
      }),
    );
    // Spill off the plate's front edge, falling and fading.
    keep(
      animate(q('[data-anim="fall"]'), {
        translateY: [0, 46],
        opacity: [0.5, 0],
        duration: 6400,
        loop: true,
        delay: stagger(2100),
        ease: 'inOut(1)',
      }),
    );

    // Orbit rings spin at their own signed speeds.
    for (const el of q<HTMLElement>('[data-anim="orbit-spin"]')) {
      const speed = parseFloat(el.dataset.speed ?? '1') || 1;
      keep(
        animate(el, {
          rotate: speed > 0 ? 360 : -360,
          duration: 30000 / Math.abs(speed),
          loop: true,
          ease: 'linear',
        }),
      );
    }

    const stopParallax = attachPointerParallax(frameEl, { x: 34, y: 20 });
    const stopActivity = bindActivity(frameEl, loops);

    return () => {
      window.removeEventListener('resize', fit);
      stopParallax();
      stopActivity();
      for (const l of loops) (l as unknown as { revert?: () => void }).revert?.();
    };
  });
</script>

<!-- No role on the frame: `img` is Children-Presentational, so it would
     prune everything inside — including Mos (a real button) and the hero's
     live region. The label goes on the decorative island svg instead.

     `data-dof` is the depth-of-field blur in px. The island is the focal
     plane at 0, and everything reads softer the further it sits from it in
     either direction — which is why the values are a V and not a ladder. -->
<div class="frame" bind:this={frameEl}>
  <!-- Sky + starfield sit outside the scaled world so they always cover the
       viewport, whatever scale the island itself lands on. -->
  <div class="fill sky" data-depth="0.1">
    <div class="sky-deep"></div>
    <div class="sky-bloom"></div>
  </div>

  <!-- Far haze bank. Heavily blurred, so the sky has a middle distance. -->
  <div class="fill clouds" data-depth="0.25" data-dof="18">
    <span class="cloud" data-anim="cloud" style="--cx:22%; --cy:46%; --cw:56vw; --ch:19vh"></span>
    <span class="cloud" data-anim="cloud" style="--cx:74%; --cy:39%; --cw:48vw; --ch:15vh"></span>
    <span class="cloud" data-anim="cloud" style="--cx:50%; --cy:57%; --cw:74vw; --ch:13vh"></span>
  </div>

  <div class="fill stars" data-depth="0.4"></div>

  <div class="world" bind:this={worldEl}>
    <!-- Light coming down onto the plate, behind the island -->
    <div class="layer" data-depth="0.3" data-dof="14">
      <svg
        class="isle"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="shaft-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="rgb(153,253,255)" stop-opacity="0" />
            <stop offset="0.46" stop-color="rgb(153,253,255)" stop-opacity="0.055" />
            <stop offset="1" stop-color="rgb(49,220,220)" stop-opacity="0.012" />
          </linearGradient>
        </defs>
        {#each SHAFTS as s, i (i)}
          <polygon
            data-anim="shaft"
            points="{s.x - s.w / 2},0 {s.x + s.w / 2},0 {s.x + s.w * 1.2 + s.skew * 8},486 {s.x -
              s.w * 1.2 +
              s.skew * 8},486"
            fill="url(#shaft-g)"
            opacity="0.4"
          />
        {/each}
      </svg>
    </div>

    <!-- Other land, far off -->
    <div class="layer" data-depth="0.45" data-dof="7">
      <svg
        class="isle islets"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {#each ISLETS as isle, i (i)}
          <!-- Placement lives on the outer group: animejs writes the CSS
               `transform` property, which overrides the SVG attribute outright,
               so an animated group cannot also carry its own position. -->
          <g
            class="islet"
            transform="translate({isle.x},{isle.y}) scale({isle.flip
              ? -isle.s
              : isle.s},{isle.s}) translate(-720,-470)"
          >
            <g data-anim="isle-rock">
              <path d={CONE} fill="rgb(3,12,24)" />
              <path d={ISLE} fill="rgb(5,22,44)" />
              <path
                d={ISLE}
                fill="none"
                stroke="rgb(120,214,232)"
                stroke-opacity="0.22"
                stroke-width="4"
              />
            </g>
          </g>
        {/each}
      </svg>
    </div>

    <!-- Orbit rings, laid flat in perspective -->
    <div class="layer orbits" data-depth="0.7">
      <div class="orbit-glow"></div>
      <div class="orbit-plane" style="--d:700px">
        <div class="orbit-track"></div>
        <div class="orbit-spin" data-anim="orbit-spin" data-speed="1">
          <span class="orbit-dot cyan"></span>
        </div>
      </div>
      <div class="orbit-plane inner" style="--d:560px">
        <div class="orbit-track dashed"></div>
        <div class="orbit-spin" data-anim="orbit-spin" data-speed="-1.4">
          <span class="orbit-dot green"></span>
        </div>
      </div>
    </div>

    <!-- The island — the focal plane, the only layer that is fully sharp -->
    <div class="layer" data-depth="0.55" data-dof="0">
      <svg
        class="isle"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={label}
      >
        <defs>
          <radialGradient id="isle-halo">
            <stop offset="0" stop-color="rgb(0,200,204)" stop-opacity="0.17" />
            <stop offset="0.55" stop-color="rgb(15,111,218)" stop-opacity="0.09" />
            <stop offset="1" stop-color="rgb(15,111,218)" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="isle-top" x1="0.05" y1="0" x2="0.92" y2="1">
            <stop offset="0" stop-color="rgb(7,50,98)" />
            <stop offset="0.42" stop-color="rgb(3,24,48)" />
            <stop offset="1" stop-color="rgb(2,14,27)" />
          </linearGradient>
          <linearGradient id="isle-edge" x1="0" y1="0" x2="1" y2="0.3">
            <stop offset="0" stop-color="rgb(0,220,224)" stop-opacity="0.44" />
            <stop offset="0.42" stop-color="#31DCDC" stop-opacity="0.16" />
            <stop offset="1" stop-color="rgb(0,220,224)" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="isle-mist-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="rgb(139,190,247)" stop-opacity="0" />
            <stop offset="0.36" stop-color="rgb(139,190,247)" stop-opacity="0.12" />
            <stop offset="0.64" stop-color="rgb(139,190,247)" stop-opacity="0.07" />
            <stop offset="1" stop-color="rgb(139,190,247)" stop-opacity="0" />
          </linearGradient>
          <radialGradient id="isle-glowspot">
            <stop offset="0" stop-color="#31DCDC" stop-opacity="0.3" />
            <stop offset="1" stop-color="#31DCDC" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="isle-contact">
            <stop offset="0" stop-color="rgb(0,8,18)" stop-opacity="0.72" />
            <stop offset="1" stop-color="rgb(0,8,18)" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="crystal-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#99FDFF" stop-opacity="0.9" />
            <stop offset="1" stop-color="#1FCECE" stop-opacity="0.05" />
          </linearGradient>
          <linearGradient id="fall-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="rgb(153,253,255)" stop-opacity="0.28" />
            <stop offset="1" stop-color="rgb(153,253,255)" stop-opacity="0" />
          </linearGradient>
          <clipPath id="isle-clip"><path d={ISLE} /></clipPath>
          <clipPath id="cone-clip"><path d={CONE} /></clipPath>
        </defs>

        <ellipse cx="720" cy="490" rx="480" ry="220" fill="url(#isle-halo)" />

        <g transform="translate(0,-16)">
          <g data-anim="isle-body">
            <!-- Underside: strata, then the veins and crystals that sit in them -->
            <g clip-path="url(#cone-clip)">
              <g transform="rotate(-3.4 720 660)">
                {#each STRATA as band, i (i)}
                  <rect x="400" y={band.y} width="640" height={band.h} fill={band.fill} />
                  <rect x="400" y={band.y} width="640" height="2.6" fill={band.seam} />
                {/each}
              </g>
              <g
                stroke="rgb(0,6,14)"
                stroke-opacity="0.55"
                fill="none"
                stroke-width="3"
                stroke-linecap="round"
              >
                {#each FRACTURES as d, i (i)}<path {d} />{/each}
              </g>
              <g
                stroke="rgb(120,190,236)"
                stroke-opacity="0.13"
                fill="none"
                stroke-width="2.4"
                stroke-linecap="round"
              >
                {#each VEINS as d, i (i)}<path {d} />{/each}
              </g>
              <!-- Light grazing the left face, so the mass has a lit side -->
              <path
                d="M408,470L468,522L512,596L556,672L470,560Z"
                fill="rgb(14,92,178)"
                opacity="0.2"
              />
            </g>
            <path d={CONE} fill="none" stroke="rgb(1,9,18)" stroke-opacity="0.9" stroke-width="2" />

            <g fill="url(#crystal-g)">
              {#each CRYSTALS as c, i (i)}
                <polygon data-anim="crystal" points={c.points} opacity={c.o} />
              {/each}
            </g>

            <!-- Top plate -->
            <path d={ISLE} fill="rgb(5,38,75)" transform="translate(0,13)" />
            <path d={ISLE} fill="url(#isle-top)" />

            <g clip-path="url(#isle-clip)">
              {#each FACETS as group, gi (gi)}
                <g fill={group.fill} fill-opacity={group.opacity}>
                  {#each group.points as points, pi (pi)}<polygon {points} />{/each}
                </g>
              {/each}
              <!-- The hollow Mos rests in: a lit pool, plus the shadow the body
                   casts into it. Without the shadow Mos floats above the plate. -->
              <ellipse cx="720" cy="466" rx="150" ry="40" fill="url(#isle-glowspot)" />
              <ellipse
                cx="720"
                cy="470"
                rx="158"
                ry="42"
                fill="none"
                stroke="#31DCDC"
                stroke-opacity="0.15"
                stroke-width="1"
              />
              <ellipse cx="722" cy="474" rx="104" ry="26" fill="url(#isle-contact)" />
            </g>

            <path
              d="M408,470A300,78 0 0 1 1033,470"
              fill="none"
              stroke="#31DCDC"
              stroke-opacity="0.28"
              stroke-width="1.6"
            />
            <path d={ISLE} fill="none" stroke="url(#isle-edge)" stroke-width="1.4" />

            <!-- Mist spilling off the front edge, falling and fading. Tapered
                 paths, not rounded rects — a rect with a big `rx` reads as a
                 capsule, which is exactly what it looked like. -->
            <g fill="url(#fall-g)" class="falls">
              <path
                data-anim="fall"
                d="M528,534q30,0 34,10l-12,116q-11,10-22,0l-8,-116q4,-10 8,-10z"
              />
              <path data-anim="fall" d="M816,530q22,0 25,8l-9,92q-8,8-16,0l-6,-92q3,-8 6,-8z" />
            </g>

            <ellipse
              data-anim="isle-mist"
              cx="720"
              cy="536"
              rx="400"
              ry="20"
              fill="url(#isle-mist-g)"
              opacity="0.5"
            />
            <ellipse
              data-anim="isle-mist"
              cx="720"
              cy="586"
              rx="300"
              ry="15"
              fill="url(#isle-mist-g)"
              opacity="0.32"
            />
          </g>
        </g>

        <g transform="translate(0,-16)" fill="rgb(153,253,255)">
          {#each SPARKS as s, i (i)}
            <circle data-anim="isle-spark" cx={s.cx} cy={s.cy} r={s.r} opacity={s.o} />
          {/each}
        </g>
      </svg>
    </div>

    <!-- Mos stands on the plate -->
    <div class="layer stage" data-depth="1.25">
      <div class="stage-slot">{@render stage?.()}</div>
    </div>

    <!-- The Mon stand on the island in front of Mos -->
    {#if orbit}
      <div class="layer orbit-slot" data-depth="1.05">{@render orbit()}</div>
    {/if}

    <!-- Near-field motes and haze, in front of everything and softened again -->
    <div class="layer" data-depth="1.6" data-dof="2">
      {#each MOTES as m, i (i)}
        <span
          class="mote"
          data-anim="mote"
          style="left:{m.x}%; top:{m.y}%; width:{m.s}px; height:{m.s}px; background:{m.c}; box-shadow:0 0 {m.s *
            3}px {m.c}"
        ></span>
      {/each}
    </div>
    <div class="layer" data-depth="1.9" data-dof="9">
      <span class="fog"></span>
    </div>
  </div>
</div>

<style>
  .frame {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--app-bg);
    perspective: 1400px;
    pointer-events: auto;
  }

  /* The scene is authored at 1440×900 and scaled to fit — that keeps every
     hand-placed SVG coordinate meaningful at any viewport. */
  .world {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 1440px;
    height: 900px;
    transform: translate(-50%, -50%) scale(var(--isle-scale, 1));
    transform-origin: center center;
  }

  .layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* Depth of field, declared once. The island is the focal plane, so distance
     from it — not depth itself — decides the blur. */
  .frame :global([data-dof='2']) {
    filter: blur(2px);
  }
  .frame :global([data-dof='14']) {
    filter: blur(14px);
  }
  .frame :global([data-dof='7']) {
    filter: blur(7px);
  }
  .frame :global([data-dof='9']) {
    filter: blur(9px);
  }
  .frame :global([data-dof='18']) {
    filter: blur(18px);
  }

  /* Full-bleed backdrop layers — unaffected by --isle-scale */
  .fill {
    position: absolute;
    inset: -60px;
    pointer-events: none;
  }

  .sky {
    inset: -80px;
  }
  .sky-deep,
  .sky-bloom {
    position: absolute;
    inset: 0;
  }
  .sky-deep {
    background: var(--sky-deep);
  }
  .sky-bloom {
    background: var(--sky-bloom);
  }

  .clouds {
    inset: -140px;
  }
  .cloud {
    position: absolute;
    left: var(--cx);
    top: var(--cy);
    width: var(--cw);
    height: var(--ch);
    /* `translate`, not `transform`: animejs drifts these on `translateX`, which
       writes the whole `transform` property and would drop the centring. */
    translate: -50% -50%;
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      rgba(23, 78, 150, 0.42),
      rgba(15, 48, 96, 0.2) 58%,
      transparent
    );
  }

  /* One wide bank across the bottom of the frame, so the island's base fades
     into haze instead of ending on the page background. */
  .fog {
    position: absolute;
    left: 50%;
    bottom: -140px;
    width: 150%;
    height: 320px;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      rgba(18, 62, 120, 0.5),
      rgba(9, 34, 68, 0.22) 62%,
      transparent
    );
  }

  .stars {
    inset: -30px;
    background:
      radial-gradient(1.6px 1.6px at 11% 17%, rgba(236, 237, 246, 0.7), transparent),
      radial-gradient(1.3px 1.3px at 26% 9%, rgba(236, 237, 246, 0.45), transparent),
      radial-gradient(1.7px 1.7px at 41% 21%, rgba(49, 220, 220, 0.5), transparent),
      radial-gradient(1.3px 1.3px at 63% 11%, rgba(236, 237, 246, 0.4), transparent),
      radial-gradient(1.6px 1.6px at 82% 18%, rgba(236, 237, 246, 0.55), transparent),
      radial-gradient(1.3px 1.3px at 92% 33%, rgba(236, 237, 246, 0.35), transparent),
      radial-gradient(1.5px 1.5px at 8% 51%, rgba(236, 237, 246, 0.45), transparent),
      radial-gradient(1.4px 1.4px at 19% 77%, rgba(49, 220, 220, 0.35), transparent),
      radial-gradient(1.7px 1.7px at 47% 87%, rgba(236, 237, 246, 0.32), transparent),
      radial-gradient(1.4px 1.4px at 71% 80%, rgba(236, 237, 246, 0.42), transparent),
      radial-gradient(1.5px 1.5px at 88% 67%, rgba(236, 237, 246, 0.38), transparent),
      radial-gradient(1.3px 1.3px at 57% 62%, rgba(236, 237, 246, 0.25), transparent);
  }

  .mote {
    position: absolute;
    border-radius: 50%;
    display: block;
  }

  /* Compact viewports: hide the layers whose animations were trimmed, so no
     mote sits frozen mid-scene. Kept in sync with the halving in q(). */
  @media (max-width: 560px) {
    .mote:nth-child(n + 5),
    .islet:nth-of-type(n + 2),
    .isle :global([data-anim='isle-spark']:nth-of-type(n + 3)) {
      display: none;
    }
    .orbit-plane.inner,
    .cloud:nth-child(n + 3) {
      display: none;
    }
  }

  .orbits {
    transform-style: preserve-3d;
  }
  .orbit-glow {
    position: absolute;
    left: 50%;
    top: 486px;
    transform: translate(-50%, -50%);
    width: 900px;
    height: 340px;
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      rgba(31, 206, 206, 0.18),
      rgba(15, 111, 218, 0.12) 52%,
      transparent 100%
    );
    filter: blur(2px);
  }
  .orbit-plane {
    position: absolute;
    left: 50%;
    top: 454px;
    transform: translate(-50%, -50%) rotateX(72deg);
    width: var(--d);
    height: var(--d);
    transform-style: preserve-3d;
  }
  .orbit-track {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid rgba(49, 220, 220, 0.14);
  }
  .orbit-track.dashed {
    border-style: dashed;
    border-color: rgba(236, 237, 246, 0.13);
  }
  .orbit-spin {
    position: absolute;
    inset: 0;
  }
  .orbit-dot {
    position: absolute;
    left: 50%;
    top: -4px;
    width: 8px;
    height: 8px;
    margin-left: -4px;
    border-radius: 50%;
    display: block;
  }
  .orbit-dot.cyan {
    background: var(--summon-cyan);
    box-shadow: 0 0 14px rgba(31, 206, 206, 0.9);
  }
  .orbit-dot.green {
    width: 10px;
    height: 10px;
    margin-left: -5px;
    top: -5px;
    background: var(--summon-green);
    box-shadow: 0 0 16px rgba(33, 237, 179, 0.9);
  }

  .isle {
    position: absolute;
    left: 50%;
    top: 0;
    width: 1440px;
    height: 900px;
    max-width: none;
    transform: translateX(-50%);
    overflow: visible;
  }
  .isle :global([data-anim='isle-rock']),
  .isle :global([data-anim='shaft']) {
    transform-box: fill-box;
    transform-origin: center;
  }

  .stage-slot {
    position: absolute;
    left: 50%;
    top: 352px;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    pointer-events: auto;
  }

  /* A full-bleed layer must never claim pointers itself, or it covers the
     characters in the layers beneath it. Its content opts in instead. */
  .orbit-slot {
    pointer-events: none;
  }
</style>
