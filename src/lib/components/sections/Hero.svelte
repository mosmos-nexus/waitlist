<script lang="ts">
  import { onMount } from 'svelte';
  import { animate, stagger } from 'animejs';
  import SkyIsland from '$lib/components/world/SkyIsland.svelte';
  import MosBlob from '$lib/components/world/MosBlob.svelte';
  import MonBlob from '$lib/components/world/MonBlob.svelte';
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import { prefersReduced } from '$lib/anime/motion';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
  }
  let { onSuccess }: Props = $props();

  // Mos answers a poke with one of these, cycling so a second poke says
  // something new rather than repeating.
  const POKE_LINES = $derived([m.mos_poke_1(), m.mos_poke_2(), m.mos_poke_3(), m.mos_poke_4()]);
  let pokeIndex = $state(-1);
  const mosLine = $derived(pokeIndex < 0 ? m.mos_line_idle() : POKE_LINES[pokeIndex]);

  let lineEl = $state<HTMLParagraphElement | null>(null);
  let copyEl = $state<HTMLDivElement | null>(null);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  function onPoke() {
    pokeIndex = (pokeIndex + 1) % POKE_LINES.length;
    clearTimeout(resetTimer);
    // Fall back to the resting line so the scene settles instead of holding a
    // reply forever.
    resetTimer = setTimeout(() => {
      pokeIndex = -1;
    }, 6000);
    if (lineEl && !prefersReduced()) {
      animate(lineEl, { opacity: [0, 1], translateY: [6, 0], duration: 460, ease: 'out(3)' });
    }
  }

  onMount(() => {
    if (!copyEl || prefersReduced()) return;
    // The hero is above the fold, so it plays on mount rather than on scroll.
    const rows = Array.from(copyEl.querySelectorAll<HTMLElement>('[data-enter]'));
    const anim = animate(rows, {
      opacity: [0, 1],
      translateY: [26, 0],
      duration: 900,
      delay: stagger(110, { start: 220 }),
      ease: 'out(3)',
    });
    return () => {
      clearTimeout(resetTimer);
      anim.revert();
    };
  });
</script>

<section class="hero" aria-label={m.hero_tagline().replace('\n', ' ')}>
  <SkyIsland label={m.world_island_label()}>
    {#snippet stage()}
      <div class="stage-inner">
        <MosBlob size={268} onpoke={onPoke} label="Mos" />
        <div class="mos-plate">
          <span class="status">
            <i class="live"></i>
            Mos · {m.mos_status_idle()}
          </span>
          <p class="mos-line prewrap" bind:this={lineEl} aria-live="polite">{mosLine}</p>
        </div>
      </div>
    {/snippet}

    {#snippet orbit()}
      <!-- The Mon ring sits on the island's near edge, so it reads as three
           specialists waiting beside Mos rather than decoration. -->
      <div class="mon-ring" aria-label={m.mos_mon_hint()}>
        <div class="mon left">
          <MonBlob role="research" size={74} name={m.mon_research_name()} offset={0} />
        </div>
        <div class="mon mid">
          <MonBlob role="organize" size={64} name={m.mon_organize_name()} offset={0.6} />
        </div>
        <div class="mon right">
          <MonBlob role="design" size={70} name={m.mon_design_name()} offset={1.2} />
        </div>
      </div>
    {/snippet}
  </SkyIsland>

  <div class="veil" aria-hidden="true"></div>

  <div class="container copy" bind:this={copyEl}>
    <span class="eyebrow" data-enter>{m.hero_eyebrow()}</span>
    <h1 class="t-display-2 tagline prewrap" data-enter>{m.hero_tagline()}</h1>
    <p class="t-subtitle-1 sub prewrap" data-enter>{m.hero_sub()}</p>

    <div class="form-slot" data-enter>
      <WaitlistForm {onSuccess} />
    </div>

    <p class="trust" data-enter>
      <i class="dot"></i>
      {m.hero_trust()}
    </p>
    <p class="anchor" data-enter>{m.hero_anchor()}</p>
  </div>

  <span class="scroll-hint" aria-hidden="true">
    {m.hero_scroll()}
    <svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
  </span>
</section>

<style>
  .hero {
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
    isolation: isolate;
  }

  /* The island lives behind the copy; this gradient buys back the contrast the
     text needs without flattening the scene. */
  .veil {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(8, 9, 15, 0.34) 0%,
      rgba(8, 9, 15, 0) 24%,
      rgba(8, 9, 15, 0.42) 58%,
      rgba(8, 9, 15, 0.9) 100%
    );
  }

  .copy {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-16);
    padding-bottom: clamp(var(--space-56), 9vh, var(--space-80));
    padding-top: var(--space-64);
    /* The container stretches across the island, so on its own it would
       swallow every click meant for Mos. Only its children take pointers. */
    pointer-events: none;
  }
  .copy > * {
    pointer-events: auto;
  }

  .tagline {
    color: var(--label-strong);
    max-width: 18ch;
    text-shadow: 0 2px 24px rgba(8, 9, 15, 0.6);
  }
  .sub {
    color: var(--label-alternative);
    font-weight: var(--weight-regular);
    line-height: var(--line-height-body-reading);
    max-width: 46ch;
  }

  .form-slot {
    margin-top: var(--space-8);
    width: 100%;
  }

  .trust {
    display: inline-flex;
    align-items: center;
    gap: var(--space-8);
    font-size: var(--font-size-body-2);
    color: var(--label-normal);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--summon-green);
    box-shadow: 0 0 10px rgba(33, 237, 179, 0.9);
  }

  .anchor {
    font-size: var(--font-size-caption-1);
    color: var(--label-assistive);
  }

  /* ---- Mos on the disc ---- */
  .stage-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-10);
  }
  .mos-plate {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
    max-width: 30ch;
    text-align: center;
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-6);
    padding: 4px 12px;
    border-radius: var(--radius-full);
    background: rgba(20, 23, 27, 0.68);
    border: 1px solid var(--line-normal-normal);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    color: var(--label-normal);
    backdrop-filter: blur(8px);
    white-space: nowrap;
  }
  .live {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--summon-cyan);
    box-shadow: 0 0 8px var(--summon-cyan);
  }
  .mos-line {
    font-size: var(--font-size-caption-1);
    line-height: var(--line-height-label);
    color: var(--label-assistive);
  }

  /* ---- Mon ring ---- */
  .mon-ring {
    position: absolute;
    left: 50%;
    top: 470px;
    translate: -50% 0;
    width: 760px;
    height: 1px;
  }
  .mon {
    position: absolute;
    /* Opts back in — the orbit layer around it passes pointers through. */
    pointer-events: auto;
  }
  /* Placed by hand against the island's ellipse so each Mon sits on the rim
     rather than floating over the void. */
  .mon.left {
    left: 6%;
    top: 26px;
  }
  .mon.mid {
    left: 50%;
    top: 96px;
    translate: -50% 0;
  }
  .mon.right {
    right: 6%;
    top: 14px;
  }

  .scroll-hint {
    position: absolute;
    z-index: 2;
    right: var(--grid-gutter);
    bottom: var(--space-20);
    display: inline-flex;
    align-items: center;
    gap: var(--space-6);
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
    pointer-events: none;
  }
  .scroll-hint svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: nudge 2.2s var(--ease-in-out) infinite;
  }
  @keyframes nudge {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.5;
    }
    50% {
      transform: translateY(4px);
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .scroll-hint svg {
      animation: none;
    }
  }

  /* Below the desktop breakpoint the island loses its side Mon and the copy
     takes the lower half outright — three blobs on the rim don't survive the
     narrower disc. */
  @media (max-width: 900px) {
    .mon.left,
    .mon.right {
      display: none;
    }
    .mon.mid {
      top: 80px;
    }
    .scroll-hint {
      display: none;
    }
  }

  @media (max-width: 560px) {
    .copy {
      gap: var(--space-12);
    }
    .tagline {
      max-width: 100%;
    }
  }
</style>
