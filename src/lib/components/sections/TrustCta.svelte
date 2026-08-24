<script lang="ts">
  import { onMount } from 'svelte';
  import { animate, onScroll, stagger, utils } from 'animejs';
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import { prefersReduced, reveal, countUp } from '$lib/anime/motion';
  import { features } from '$lib/config/features';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
    registrantCount: number | null;
  }
  let { onSuccess, registrantCount }: Props = $props();

  // The counter is feature-flagged and its fetch can fail, so `null` means
  // "no number to show" — the queue is hidden rather than counting up to zero.
  const showCount = $derived(features.registrantCounter && registrantCount !== null);

  // The count is the only real number on the page, so it gets to arrive rather
  // than just be present — and the motes behind it make it feel like people.
  const MOTES = 14;

  let queueEl = $state<HTMLDivElement | null>(null);
  /** Rendered by Svelte; countUp only feeds it numbers. */
  let shown = $state(0);

  onMount(() => {
    if (!queueEl) return;
    const total = registrantCount ?? 0;

    const motes = Array.from(queueEl.querySelectorAll<HTMLElement>('.mote'));
    if (prefersReduced()) {
      shown = total;
      utils.set(motes, { opacity: 0.7 });
      return;
    }

    utils.set(motes, { opacity: 0 });

    const arrive = animate(motes, {
      opacity: [0, 0.85],
      translateX: [() => utils.random(-70, 70), 0],
      translateY: [() => utils.random(18, 52), 0],
      scale: [0.4, 1],
      duration: 1100,
      delay: stagger(70),
      ease: 'out(3)',
      autoplay: onScroll({
        target: queueEl,
        enter: 'bottom-=80 top',
        repeat: false,
        onEnter: () => countUp(total, (v) => (shown = v), 1500),
      }),
    });

    // Once they've landed they keep breathing, so the queue reads as alive.
    const drift = animate(motes, {
      translateY: [0, -7],
      duration: 3400,
      loop: true,
      alternate: true,
      delay: stagger(180, { from: 'center' }),
      ease: 'inOut(2)',
    });

    return () => {
      arrive.revert();
      drift.revert();
    };
  });
</script>

<section class="section trust">
  <div class="container inner">
    <blockquote class="note reveal glass" use:reveal>
      <span class="eyebrow">{m.trust_eyebrow()}</span>
      <p class="t-body-1-reading prewrap">{m.founder_note()}</p>
      <footer>{m.founder_sign()}</footer>
    </blockquote>

    <div class="cta reveal" use:reveal={{ delay: 100 }}>
      <h2 class="t-heading-2 title">{m.trust_cta_title()}</h2>

      {#if showCount}
        <div class="queue" bind:this={queueEl}>
          {#each Array(MOTES) as _, i (i)}
            <span class="mote" style="--i:{i}"></span>
          {/each}
          <!-- Split around the number so it can count up on its own. Each locale
             owns both halves, because the counter word attaches differently:
             "지금 N명이…" / "N people…" / "いまN名が…" -->
          <p class="count">
            <em class="pre">{m.social_count_pre()}</em>
            <span>{shown.toLocaleString()}</span>
            <em>{m.social_count_post()}</em>
          </p>
        </div>
      {/if}

      <WaitlistForm {onSuccess} />

      <p class="care">{m.trust_care()}</p>
    </div>
  </div>
</section>

<style>
  .trust {
    background:
      radial-gradient(80% 70% at 20% 20%, rgba(15, 111, 218, 0.12), transparent 70%), var(--app-bg);
  }

  .inner {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-40);
    align-items: start;
  }
  @media (min-width: 940px) {
    .inner {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: var(--space-64);
      align-items: center;
    }
  }

  .note {
    margin: 0;
    padding: var(--space-32) var(--space-24);
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
  }
  .note p {
    color: var(--label-normal);
  }
  .note footer {
    font-size: var(--font-size-caption-1);
    color: var(--label-assistive);
  }

  .cta {
    display: flex;
    flex-direction: column;
    gap: var(--space-20);
  }
  .title {
    color: var(--label-strong);
  }

  /* The queue: motes drifting in, with the live number sitting among them */
  .queue {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-14) var(--space-16);
    border-radius: var(--radius-m);
    border: 1px solid var(--line-normal-normal);
    background: rgba(20, 23, 27, 0.56);
  }
  .mote {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--summon-cyan);
    box-shadow: 0 0 8px rgba(31, 206, 206, 0.7);
    /* Alternating tint keeps a row of identical dots from reading as a chart */
    opacity: 0.85;
  }
  .mote:nth-child(3n) {
    background: var(--summon-green);
    box-shadow: 0 0 8px rgba(33, 237, 179, 0.7);
  }
  .mote:nth-child(4n) {
    background: var(--primary-bright);
    box-shadow: 0 0 8px rgba(139, 190, 247, 0.6);
  }

  .count {
    margin-left: auto;
    display: inline-flex;
    align-items: baseline;
    font-size: var(--font-size-body-2);
    color: var(--label-alternative);
  }
  /* No gap around the numeral: Korean 명 and Japanese 名 attach directly to it,
     so "1,234 명" reads wrong. The leading word does need separating, and it is
     empty in English. */
  .count em.pre {
    margin-right: 0.25em;
  }
  .count span {
    font-size: var(--font-size-title-3);
    font-weight: var(--weight-bold);
    color: var(--label-strong);
    font-variant-numeric: tabular-nums;
  }
  .count em {
    font-style: normal;
  }
  /* Empty in English, so it must not leave a gap */
  .count em.pre:empty {
    display: none;
  }

  .care {
    font-size: var(--font-size-caption-1);
    color: var(--label-assistive);
  }
</style>
