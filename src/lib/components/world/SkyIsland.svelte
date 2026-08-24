<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { animate, stagger } from 'animejs';
  import {
    prefersReduced,
    attachPointerParallax,
    bindVisibility,
    isCompactViewport,
  } from '$lib/anime/motion';

  interface Props {
    /** Content that sits on the island's disc — normally Mos. */
    stage?: Snippet;
    /** Content that orbits the island — the Mon ring. */
    orbit?: Snippet;
    /** Accessible name for the scene as a whole. */
    label?: string;
  }

  let { stage, orbit, label }: Props = $props();

  // The island's silhouette. One outline drives the top face, its drop shadow,
  // the rim highlight and the clip that keeps the surface detail on the disc.
  const ISLE =
    'M1033.4,470.0C1032.4,475.6 1028.7,481.3 1023.4,486.8C1018.2,492.2 1011.3,497.6 1002.0,502.6C992.7,507.6 981.3,512.6 967.5,516.8C953.7,520.9 936.8,524.7 919.1,527.5C901.5,530.4 881.1,532.3 861.8,533.9C842.6,535.4 822.6,536.0 803.6,536.9C784.7,537.8 766.7,538.3 748.0,539.2C729.2,540.0 710.9,541.1 691.0,541.8C671.0,542.5 649.7,543.5 628.4,543.3C607.1,543.1 583.8,542.5 563.2,540.6C542.5,538.8 521.8,535.8 504.5,532.2C487.2,528.7 472.0,524.0 459.4,519.2C446.9,514.5 437.0,509.1 429.0,503.7C421.0,498.3 414.9,492.7 411.4,487.1C407.9,481.4 406.3,475.6 408.2,470.0C410.0,464.4 415.0,458.7 422.4,453.6C429.9,448.4 441.2,443.5 452.9,439.1C464.5,434.6 478.7,430.8 492.2,427.0C505.6,423.1 519.4,419.7 533.6,416.2C547.8,412.6 561.5,409.0 577.3,405.7C593.1,402.5 609.9,399.1 628.4,396.7C646.9,394.3 667.8,392.3 688.3,391.5C708.8,390.7 731.1,391.0 751.6,391.9C772.1,392.8 792.3,394.9 811.3,396.9C830.4,399.0 848.3,401.6 866.1,404.2C883.9,406.9 901.4,409.6 918.3,412.7C935.2,415.9 952.8,419.2 967.5,423.2C982.3,427.3 996.7,431.8 1007.0,436.8C1017.3,441.7 1024.9,447.4 1029.3,452.9C1033.7,458.4 1034.4,464.4 1033.4,470.0Z';

  // Underside shards — the inverted cone that makes it read as a torn-off island.
  const SHARDS: { points: string; fill: string; opacity: number }[] = [
    { points: '408,470 422,498 566,690', fill: 'rgb(5,38,75)', opacity: 0.9 },
    { points: '422,498 480,526 648,748 566,690', fill: 'rgb(5,38,75)', opacity: 0.6 },
    { points: '480,526 596,543 706,788 648,748', fill: 'rgb(3,24,48)', opacity: 1 },
    { points: '596,543 720,540 768,754 706,788', fill: 'rgb(3,24,48)', opacity: 0.72 },
    { points: '720,540 832,536 854,700 768,754', fill: 'rgb(2,14,27)', opacity: 0.9 },
    { points: '832,536 945,523 906,646 854,700', fill: 'rgb(2,14,27)', opacity: 1 },
    { points: '945,523 1010,497 1033,470 906,646', fill: 'rgb(3,24,48)', opacity: 0.45 },
    { points: '566,690 584,678 575,728', fill: 'rgb(3,24,48)', opacity: 1 },
    { points: '648,748 664,736 656,794', fill: 'rgb(2,14,27)', opacity: 1 },
    { points: '706,788 720,776 713,818', fill: 'rgb(3,24,48)', opacity: 1 },
    { points: '768,754 780,742 774,794', fill: 'rgb(2,14,27)', opacity: 1 },
    { points: '854,700 864,688 859,726', fill: 'rgb(3,24,48)', opacity: 1 },
  ];

  const SEAMS = [
    'M422,498L566,690',
    'M480,526L648,748',
    'M596,543L706,788',
    'M720,540L768,754',
    'M832,536L854,700',
    'M945,523L906,646',
  ];

  // Surface facets clipped to the disc — the low-poly "ground".
  const FACETS: { fill: string; opacity: number; points: string[] }[] = [
    {
      fill: 'rgb(8,62,123)',
      opacity: 0.24,
      points: [
        '576,452 654,438 708,452 646,470',
        '744,432 822,436 852,452 776,456',
        '606,498 692,506 758,496 678,486',
        '830,478 892,484 918,470 862,462',
      ],
    },
    {
      fill: 'rgb(12,87,170)',
      opacity: 0.12,
      points: ['504,464 562,450 594,462 532,476', '706,420 762,416 784,428 720,432'],
    },
    {
      fill: 'rgb(2,14,27)',
      opacity: 0.45,
      points: ['760,470 856,478 902,496 792,494', '640,428 712,424 744,436 664,442'],
    },
  ];

  const ROCKS = [
    '1146,462 1178,452 1196,474 1180,502 1150,500 1138,480',
    '1150,586 1174,580 1184,598 1170,616 1150,612 1144,598',
    '238,498 268,490 282,512 266,540 238,536 226,514',
  ];

  const SPARKS = [
    { cx: 476, cy: 560, r: 2.2, o: 0.55 },
    { cx: 588, cy: 640, r: 1.8, o: 0.45 },
    { cx: 812, cy: 620, r: 2, o: 0.5 },
    { cx: 930, cy: 540, r: 1.7, o: 0.4 },
    { cx: 700, cy: 700, r: 2, o: 0.35 },
  ];

  // Drifting motes in the near field.
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
   * take an extra squeeze so the disc never pushes the form off-screen.
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
    const q = <T extends Element>(sel: string) => {
      const all = Array.from(frameEl!.querySelectorAll<T>(sel));
      return compact ? all.slice(0, Math.max(1, Math.ceil(all.length / 2))) : all;
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
    const stopVis = bindVisibility(loops);

    return () => {
      window.removeEventListener('resize', fit);
      stopParallax();
      stopVis();
      for (const l of loops) (l as unknown as { revert?: () => void }).revert?.();
    };
  });
</script>

<div class="frame" bind:this={frameEl} role="img" aria-label={label}>
  <!-- Sky + starfield sit outside the scaled world so they always cover the
       viewport, whatever scale the island itself lands on. -->
  <div class="fill sky" data-depth="0.15">
    <div class="sky-deep"></div>
    <div class="sky-bloom"></div>
  </div>
  <div class="fill stars" data-depth="0.5"></div>

  <div class="world" bind:this={worldEl}>
    <!-- Near-field motes -->
    <div class="layer" data-depth="0.9">
      {#each MOTES as m, i (i)}
        <span
          class="mote"
          data-anim="mote"
          style="left:{m.x}%; top:{m.y}%; width:{m.s}px; height:{m.s}px; background:{m.c}; box-shadow:0 0 {m.s *
            3}px {m.c}"
        ></span>
      {/each}
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

    <!-- The island -->
    <div class="layer" data-depth="0.55">
      <svg
        class="isle"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="isle-halo">
            <stop offset="0" stop-color="rgb(0,200,204)" stop-opacity="0.17" />
            <stop offset="0.55" stop-color="rgb(15,111,218)" stop-opacity="0.09" />
            <stop offset="1" stop-color="rgb(15,111,218)" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="isle-top" x1="0.05" y1="0" x2="0.92" y2="1">
            <stop offset="0" stop-color="rgb(5,38,75)" />
            <stop offset="0.42" stop-color="rgb(3,24,48)" />
            <stop offset="1" stop-color="rgb(2,14,27)" />
          </linearGradient>
          <linearGradient id="isle-edge" x1="0" y1="0" x2="1" y2="0.3">
            <stop offset="0" stop-color="rgb(0,220,224)" stop-opacity="0.4" />
            <stop offset="0.42" stop-color="#31DCDC" stop-opacity="0.14" />
            <stop offset="1" stop-color="rgb(0,220,224)" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="isle-mist-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="rgb(139,190,247)" stop-opacity="0" />
            <stop offset="0.36" stop-color="rgb(139,190,247)" stop-opacity="0.12" />
            <stop offset="0.64" stop-color="rgb(139,190,247)" stop-opacity="0.07" />
            <stop offset="1" stop-color="rgb(139,190,247)" stop-opacity="0" />
          </linearGradient>
          <radialGradient id="isle-glowspot">
            <stop offset="0" stop-color="#31DCDC" stop-opacity="0.24" />
            <stop offset="1" stop-color="#31DCDC" stop-opacity="0" />
          </radialGradient>
          <clipPath id="isle-clip"><path d={ISLE} /></clipPath>
        </defs>

        <ellipse cx="720" cy="490" rx="480" ry="220" fill="url(#isle-halo)" />

        <g transform="translate(0,-16)">
          <g data-anim="isle-body">
            {#each SHARDS as s, i (i)}
              <polygon points={s.points} fill={s.fill} fill-opacity={s.opacity} />
            {/each}

            <g stroke="rgb(2,14,27)" stroke-opacity="0.8" fill="none" stroke-width="1.4">
              {#each SEAMS as d, i (i)}<path {d} />{/each}
            </g>
            <g stroke="rgb(153,253,255)" stroke-opacity="0.15" fill="none" stroke-width="1.4">
              <path d="M408,470L526,620" />
            </g>

            <path d={ISLE} fill="rgb(5,38,75)" transform="translate(0,13)" />
            <path d={ISLE} fill="url(#isle-top)" />

            <g clip-path="url(#isle-clip)">
              {#each FACETS as group, gi (gi)}
                <g fill={group.fill} fill-opacity={group.opacity}>
                  {#each group.points as points, pi (pi)}<polygon {points} />{/each}
                </g>
              {/each}
              <ellipse cx="720" cy="466" rx="140" ry="36" fill="url(#isle-glowspot)" />
              <ellipse
                cx="720"
                cy="470"
                rx="150"
                ry="38"
                fill="none"
                stroke="#31DCDC"
                stroke-opacity="0.13"
                stroke-width="1"
              />
            </g>

            <path
              d="M408,470A300,78 0 0 1 1033,470"
              fill="none"
              stroke="#31DCDC"
              stroke-opacity="0.26"
              stroke-width="1.6"
            />
            <path d={ISLE} fill="none" stroke="url(#isle-edge)" stroke-width="1.4" />

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

        <g transform="translate(0,-16)">
          <g fill="rgb(5,38,75)" stroke="rgb(153,253,255)" stroke-opacity="0.12" stroke-width="1.2">
            {#each ROCKS as points, i (i)}
              <polygon data-anim="isle-rock" {points} />
            {/each}
          </g>
          <g fill="rgb(153,253,255)">
            {#each SPARKS as s, i (i)}
              <circle data-anim="isle-spark" cx={s.cx} cy={s.cy} r={s.r} opacity={s.o} />
            {/each}
          </g>
        </g>
      </svg>
    </div>

    <!-- Mos stands on the disc -->
    <div class="layer stage" data-depth="1.25">
      <div class="stage-slot">{@render stage?.()}</div>
    </div>

    <!-- Mon ring sits just above the disc, in front of the island -->
    {#if orbit}
      <div class="layer orbit-slot" data-depth="1.05">{@render orbit()}</div>
    {/if}
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
    .isle :global([data-anim='isle-rock']:nth-of-type(n + 2)),
    .isle :global([data-anim='isle-spark']:nth-of-type(n + 3)) {
      display: none;
    }
    .orbit-plane.inner {
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
  .isle :global([data-anim='isle-rock']) {
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
