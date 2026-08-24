<script lang="ts">
  import { onMount } from 'svelte';
  import { animate, spring, utils } from 'animejs';
  import { createBlob, type BlobHandle, type BlobDent } from '$lib/anime/blob';
  import { MON_TINT, type MonRole } from '$lib/anime/mon';
  import { prefersReduced, bindActivity } from '$lib/anime/motion';

  interface Props {
    role: MonRole;
    size?: number;
    /** Label shown under the body; also the accessible name. */
    name?: string;
    /** `working` deepens the wobble and turns the status dot green. */
    activity?: 'idle' | 'working';
    /** Seconds of delay so a row of Mon don't breathe in lockstep. */
    offset?: number;
  }

  let { role, size = 96, name, activity = 'idle', offset = 0 }: Props = $props();

  const uid = $props.id();
  const g = (n: string) => `${n}-${uid}`;

  // Same geometry as Mos, scaled by the viewBox — one engine, one silhouette
  // language, three personalities.
  const CX = 200;
  const CY = 200;
  const R = 150;

  const tint = $derived(MON_TINT[role]);

  // A small body reads better with fewer, wider dents — three slots keeps the
  // silhouette legible at 96px where five would just look noisy.
  const DENTS: BlobDent[] = [
    {
      slot: 0,
      sway: 8200,
      depthMin: 0.1,
      depthMax: 0.24,
      depthDuration: 4300,
      widthMin: 0.44,
      widthMax: 0.62,
      widthDuration: 3900,
      core: true,
    },
    {
      slot: 1,
      sway: 6400,
      depthMin: 0.08,
      depthMax: 0.21,
      depthDuration: 5100,
      widthMin: 0.4,
      widthMax: 0.58,
      widthDuration: 4600,
      core: true,
    },
    {
      slot: 2,
      sway: 9700,
      depthMin: 0,
      depthMax: 0.19,
      depthDuration: 3800,
      widthMin: 0.38,
      widthMax: 0.55,
      widthDuration: 4100,
      core: false,
    },
  ];

  let svgEl = $state<SVGSVGElement | null>(null);
  let wrapEl = $state<HTMLDivElement | null>(null);
  let blob: BlobHandle | null = null;

  function nudge(event: PointerEvent) {
    if (!blob || !svgEl || prefersReduced()) return;
    const rect = svgEl.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    blob.squish(dx, dy, 0.8);
    animate(svgEl, {
      scale: [
        { to: 1.08, duration: 220 },
        { to: 1, duration: 900 },
      ],
      ease: spring({ stiffness: 40, damping: 7 }),
    });
  }

  onMount(() => {
    if (!svgEl) return;
    const reduced = prefersReduced();

    blob = createBlob({
      targets: [
        svgEl.querySelector<SVGElement>('[data-anim="mon-clip-path"]'),
        svgEl.querySelector<SVGElement>('[data-anim="mon-fill"]'),
        svgEl.querySelector<SVGElement>('[data-anim="mon-rim"]'),
      ],
      cx: CX,
      cy: CY,
      radius: R,
      points: 64,
      frameRate: 30,
      timeScale: 0.72,
      dents: DENTS,
      ripple: [0.03, 0.02],
    });

    if (reduced) {
      for (const i of blob.instances) i.pause();
      return () => blob?.destroy();
    }

    const loops: { play: () => void; pause: () => void }[] = [...blob.instances];

    loops.push(
      animate(wrapEl!, {
        translateY: [0, -9],
        duration: 2400,
        delay: offset * 1000,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );
    loops.push(
      animate(svgEl, {
        rotate: [-6, 6],
        duration: 12000,
        delay: offset * 700,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
      }),
    );
    loops.push(
      animate(svgEl.querySelectorAll('[data-anim="mon-eye"]'), {
        scaleY: [
          { to: 1, duration: 1200 },
          { to: 0.1, duration: 80 },
          { to: 1, duration: 120 },
        ],
        loop: true,
        loopDelay: 2200 + offset * 900,
        ease: 'inOut(2)',
      }),
    );

    wrapEl!.addEventListener('pointerenter', nudge);
    const stopActivity = bindActivity(wrapEl!, loops);
    return () => {
      wrapEl?.removeEventListener('pointerenter', nudge);
      stopActivity();
      blob?.destroy();
      blob = null;
    };
  });

  $effect(() => {
    if (blob && !prefersReduced()) blob.setEnergy(activity === 'working' ? 1.35 : 1);
    if (svgEl) {
      utils.set(svgEl.querySelectorAll('[data-anim="mon-core"]'), {
        opacity: activity === 'working' ? 0.95 : 0.7,
      });
    }
  });
</script>

<div
  class="mon"
  class:working={activity === 'working'}
  style="--mon-w:{size}px; --core:{tint.core}; --glow:{tint.glow}"
>
  <div class="wrap" bind:this={wrapEl}>
    <div class="halo"></div>
    <!-- Named Mon are labelled by their visible tag, so the svg itself is
           always decorative — labelling it too would announce each Mon twice,
           and an unnamed one would be announced by its untranslated role slug. -->
    <svg bind:this={svgEl} viewBox="0 0 400 400" aria-hidden="true">
      <defs>
        <clipPath id={g('mon-clip')}>
          <path
            data-anim="mon-clip-path"
            d="M{CX - R},{CY}a{R},{R} 0 1,0 {R * 2},0a{R},{R} 0 1,0 -{R * 2},0"
          />
        </clipPath>
        <linearGradient id={g('mon-base')} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stop-color={tint.core} />
          <stop offset="1" stop-color={tint.deep} />
        </linearGradient>
        <linearGradient id={g('mon-rim')} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stop-color="#ECEDF6" stop-opacity="0.7" />
          <stop offset="0.55" stop-color={tint.rim} stop-opacity="0.44" />
          <stop offset="1" stop-color={tint.core} stop-opacity="0.24" />
        </linearGradient>
        <radialGradient id={g('mon-core')}>
          <stop offset="0" stop-color={tint.glow} stop-opacity="0.9" />
          <stop offset="0.55" stop-color={tint.glow} stop-opacity="0.4" />
          <stop offset="1" stop-color={tint.glow} stop-opacity="0" />
        </radialGradient>
        <radialGradient id={g('mon-gloss')}>
          <stop offset="0" stop-color="#F7F8F9" stop-opacity="0.3" />
          <stop offset="1" stop-color="#F7F8F9" stop-opacity="0" />
        </radialGradient>
      </defs>

      <g data-anim="mon-body">
        <path data-anim="mon-fill" fill="url(#{g('mon-base')})" d="" />
        <g clip-path="url(#{g('mon-clip')})" style="pointer-events:none">
          <circle
            data-anim="mon-core"
            cx="180"
            cy="186"
            r="120"
            fill="url(#{g('mon-core')})"
            opacity="0.7"
          />
          <ellipse cx="158" cy="140" rx="72" ry="52" fill="url(#{g('mon-gloss')})" />
        </g>
        <path
          data-anim="mon-rim"
          fill="none"
          stroke="url(#{g('mon-rim')})"
          stroke-width="4"
          d=""
          style="pointer-events:none"
        />
      </g>

      <g fill="none" stroke="#0B1B33" stroke-linecap="round" opacity="0.85">
        <g data-anim="mon-eye">
          <line x1="172" y1="184" x2="172" y2="200" stroke-width="9" />
        </g>
        <g data-anim="mon-eye">
          <line x1="228" y1="184" x2="228" y2="200" stroke-width="9" />
        </g>
        <path d="M200,208c1.1,7,8.3,11.6,16,10.4" stroke-width="7" />
        <path d="M200,208c-1.1,7-8.3,11.6-16,10.4" stroke-width="7" />
      </g>

      <!--
        What this Mon is for, as a mark rather than a word. The Mon used to be
        told apart by a text tag under the body, which put three labels into a
        scene that should be read, not captioned — and on the hero they landed
        on top of the copy column. A glyph on the shoulder says the same thing
        and stays inside the silhouette.
      -->
      <g
        class="glyph"
        fill="none"
        stroke="#EAF7FF"
        stroke-opacity="0.82"
        stroke-linecap="round"
        stroke-width="11"
        transform="translate(276,282) scale(1.5) translate(-24,-24)"
      >
        <circle cx="24" cy="24" r="23" fill="rgba(6,20,40,.62)" stroke="none" />
        {#if role === 'research'}
          <circle cx="21" cy="21" r="9" />
          <path d="M28,28l7,7" />
        {:else if role === 'organize'}
          <path d="M14,17h20M14,24h20M14,31h13" />
        {:else}
          <path d="M15,15h13v13h-13zM32,15h2v13h-2zM15,32h13v2h-13z" />
        {/if}
      </g>
    </svg>
  </div>

  {#if name}
    <span class="tag">
      <i class="dot"></i>
      {name}
    </span>
  {/if}
</div>

<style>
  .mon {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-8);
    width: max-content;
  }

  .wrap {
    position: relative;
    width: var(--mon-w);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
  }

  svg {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    overflow: visible;
    transform-box: fill-box;
    transform-origin: center;
  }

  .halo {
    position: absolute;
    inset: -18%;
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      color-mix(in srgb, var(--glow) 26%, transparent),
      transparent 72%
    );
    opacity: 0.75;
    transition: opacity var(--duration-slow) var(--ease-out);
    pointer-events: none;
  }
  .mon.working .halo {
    opacity: 1;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--space-6);
    padding: 4px 10px;
    border-radius: var(--radius-full);
    background: rgba(20, 23, 27, 0.72);
    border: 1px solid var(--line-normal-normal);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-medium);
    color: var(--label-normal);
    white-space: nowrap;
    backdrop-filter: blur(8px);
  }
  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--core);
    box-shadow: 0 0 8px var(--glow);
  }
  .mon.working .dot {
    background: var(--summon-green);
    box-shadow: 0 0 10px var(--summon-green);
  }

  svg :global([data-anim='mon-eye']) {
    transform-box: fill-box;
    transform-origin: center;
  }
  svg :global([data-anim='mon-body']) {
    transform-box: fill-box;
    transform-origin: center;
  }
</style>
