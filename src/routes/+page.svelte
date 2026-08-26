<script lang="ts">
  import type { PageProps } from './$types';
  import Seo from '$lib/components/Seo.svelte';
  import SkyIsland from '$lib/components/world/SkyIsland.svelte';
  import ManaCursor from '$lib/components/world/ManaCursor.svelte';
  import Hero from '$lib/components/sections/Hero.svelte';
  import Decide from '$lib/components/sections/Decide.svelte';
  import Watch from '$lib/components/sections/Watch.svelte';
  import Make from '$lib/components/sections/Make.svelte';
  import Share from '$lib/components/sections/Share.svelte';
  import Cost from '$lib/components/sections/Cost.svelte';
  import Join from '$lib/components/sections/Join.svelte';
  import Recruit from '$lib/components/sections/Recruit.svelte';
  import Confirmation from '$lib/components/Confirmation.svelte';
  import { m } from '$lib/locale.svelte';
  import { reveal, animate, onScroll, prefersReduced } from '$lib/anime/motion';

  let { data }: PageProps = $props();

  // Page-level signup state: both forms feed it, and success swaps the whole
  // marketing flow for the arrival screen.
  let result = $state<{ id: string; emailSent: boolean } | null>(null);
  function onSuccess(r: { id: string; emailSent: boolean }) {
    result = r;
    window.scrollTo({ top: 0 });
  }

  /** Raised by the console while a Mon runs, so the island answers with it. */
  let busy = $state(false);

  /**
   * The world stays for the whole page but steps back once the hero is past.
   *
   * Scrubbed rather than switched: the veil follows scroll position through
   * anime.js's own scroll observer with a low `sync`, so it eases toward the
   * value the scroll asks for instead of snapping to it. Without this the glass
   * panels sit on a bright sky and the text loses contrast; with a hard toggle
   * the change is a visible cut.
   */
  function veil(node: HTMLElement) {
    if (prefersReduced()) {
      node.style.opacity = '0.9';
      return {};
    }
    const instance = animate(node, {
      opacity: [0, 0.9],
      ease: 'linear',
      autoplay: onScroll({
        enter: 'bottom bottom',
        leave: 'bottom top',
        sync: 0.14,
      }),
    });
    return { destroy: () => instance.revert() };
  }
</script>

ㄱ

<Seo title={m.meta_title()} description={m.meta_description()} includeOrganization />

{#if result}
  <section class="arrival">
    <div class="container">
      <Confirmation pageId={result.id} emailSent={result.emailSent} />
    </div>
  </section>
{:else}
  <SkyIsland {busy} />
  <ManaCursor />

  <div class="flow">
    <Hero {onSuccess} />

    <!-- The veil's scroll range is this element, which ends where the hero
         does — so the world dims exactly as the reading starts. -->
    <div class="veil-track">
      <div class="veil" use:veil></div>
    </div>

    <p class="ache" data-claims-pointer use:reveal>{m.ache()}</p>

    <Decide bind:busy />
    <Watch />
    <Make />
    <Share />
    <Cost />
    <Join {onSuccess} registrantCount={data.registrantCount} />
    <Recruit />
  </div>
{/if}

<style>
  /* Everything readable sits above the fixed world. */
  .flow {
    position: relative;
    z-index: 1;
  }

  /* A zero-height marker: it only exists to give the veil a scroll range that
     matches the hero, and it must not add layout of its own. */
  .veil-track {
    position: absolute;
    inset: 0 0 auto 0;
    height: 100svh;
    pointer-events: none;
  }
  /* The inner stop was `rgba(8, 10, 18, 0.7)`, which left the bottom-centre of
     the viewport only 70% covered — and on a phone that is exactly where Mos
     sits. Section text scrolling past it landed on a near-white body and an
     eyebrow measured 2.59:1. The vignette still reads; it just no longer leaves
     a window. */
  .veil {
    position: fixed;
    inset: 0;
    z-index: -1;
    background: radial-gradient(120% 80% at 50% 100%, rgba(8, 10, 18, 0.94), rgb(6, 7, 11) 70%);
    opacity: 0;
  }

  /* The page's single loss frame. It carries no card, no icon and no heading —
     it is one sentence, and dressing it would blunt it. */
  .ache {
    margin: 0 auto;
    padding-block: clamp(72px, 12vh, 132px);
    max-width: 26ch;
    text-align: center;
    font-size: clamp(21px, 3.4vw, 32px);
    font-weight: 600;
    line-height: 1.45;
    letter-spacing: -0.02em;
    color: var(--shell-body);
    text-wrap: balance;
  }

  .arrival {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100svh;
    padding-block: var(--section-y-tablet);
    background: radial-gradient(110% 80% at 50% 0%, rgba(15, 111, 218, 0.14), transparent 66%);
  }
  .arrival .container {
    display: flex;
    justify-content: center;
  }
</style>
