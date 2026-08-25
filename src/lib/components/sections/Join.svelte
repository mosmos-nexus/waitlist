<script lang="ts">
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import { m } from '$lib/locale.svelte';
  import { reveal, countUp } from '$lib/anime/motion';
  import { features } from '$lib/config/features';
  import { onScroll } from 'animejs';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
    registrantCount: number | null;
  }
  let { onSuccess, registrantCount }: Props = $props();

  /**
   * The close.
   *
   * One scarcity signal and one authority signal, both factual: the pilot really
   * is selective, and the note really is signed. The counter stays behind a flag
   * because a small true number reads as "nobody uses this" — the research is
   * explicit that hiding it is the honest move, not inflating it.
   */
  const showCount = $derived(features.registrantCounter && registrantCount !== null);
  let shown = $state(0);
  let counter = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!counter || !showCount) return;
    const total = registrantCount ?? 0;
    // Counting starts when the number is actually on screen, not at mount.
    const observer = onScroll({
      target: counter,
      enter: 'bottom-=60 top',
      repeat: false,
      onEnter: () => countUp(total, (v) => (shown = v), 1500),
    });
    return () => observer.revert();
  });
</script>

<section class="join section" aria-labelledby="join-title">
  <div class="container inner">
    <div class="pitch">
      <span class="eyebrow" use:reveal>{m.join_eyebrow()}</span>
      <h2 class="title" id="join-title" use:reveal={{ delay: 60 }}>{m.join_title()}</h2>
      <p class="scarce" use:reveal={{ delay: 100 }}>{m.join_scarcity()}</p>

      <div class="form-slot" use:reveal={{ delay: 140 }}>
        <WaitlistForm {onSuccess} />
      </div>

      {#if showCount}
        <p class="count tnum" bind:this={counter} use:reveal={{ delay: 180 }}>
          {m.social_count_pre()}<b>{shown.toLocaleString()}</b>{m.social_count_post()}
        </p>
      {/if}
      <p class="care" use:reveal={{ delay: 200 }}>{m.trust_care()}</p>
    </div>

    <aside class="founder hud" use:reveal={{ delay: 120, scale: true }}>
      <span class="eyebrow">{m.trust_eyebrow()}</span>
      <figure>
        <blockquote>{m.founder_note()}</blockquote>
        <figcaption>{m.founder_sign()}</figcaption>
      </figure>
    </aside>
  </div>
</section>

<style>
  .join {
    padding-bottom: var(--space-80);
  }
  .inner {
    display: grid;
    gap: var(--space-32);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .inner {
      grid-template-columns: minmax(0, 56fr) minmax(0, 44fr);
      column-gap: var(--space-64);
    }
  }

  .pitch {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
  }
  .title {
    margin: 0;
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 800;
    line-height: 1.18;
    letter-spacing: -0.03em;
    color: var(--shell-text);
    text-wrap: balance;
  }
  .scarce {
    margin: 0;
    font-size: var(--font-size-body-1);
    line-height: 1.6;
    color: var(--shell-body);
  }
  .form-slot {
    margin-top: var(--space-8);
    max-width: 30rem;
  }
  .count {
    margin: 0;
    font-size: var(--font-size-caption-1);
    color: var(--shell-meta);
  }
  .count b {
    color: var(--bright-cyan);
    font-weight: 700;
  }
  .care {
    margin: 0;
    font-size: var(--font-size-caption-1);
    line-height: 1.6;
    color: var(--shell-faint);
  }

  .founder {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    padding: var(--space-24);
  }
  figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
  }
  blockquote {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.75;
    color: var(--shell-text);
    text-wrap: pretty;
    white-space: pre-line;
  }
  figcaption {
    font-size: 11.5px;
    color: var(--shell-meta);
  }
</style>
