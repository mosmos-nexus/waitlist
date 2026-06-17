<script lang="ts">
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import { reveal } from '$lib/actions/reveal';
  import { features } from '$lib/config/features';
  import { m } from '$lib/paraglide/messages.js';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
    registrantCount: number | null;
  }
  let { onSuccess, registrantCount }: Props = $props();

  // Gates (§6/§8): both default OFF. Numbers are evidence — shown only when their gate opens.
  const showCount = $derived(features.registrantCounter && registrantCount !== null);
  const showStat = features.surveyStatN45;

  // Count-up on reveal (honest social proof). Static final value under reduced motion.
  let display = $state(0);
  function runCount() {
    const target = registrantCount ?? 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      display = target;
      return;
    }
    const startTs = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTs) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      display = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
</script>

<section class="section trust">
  <div class="container grid">
    <div class="note-col" use:reveal>
      {#if showStat}
        <p class="stat">{m.gated_stat_n45()}</p>
      {/if}

      <figure class="note">
        <blockquote>{m.founder_note()}</blockquote>
        <figcaption>
          <span class="sign">{m.founder_sign()}</span>
          <svg class="underline" viewBox="0 0 120 8" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M2 5 Q 40 1 60 4 T 118 3"
              pathLength="1"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </figcaption>
      </figure>

      <p class="care">{m.trust_care()}</p>

      {#if showCount}
        <p class="count" use:reveal={{ onReveal: runCount }}>
          <strong>{display.toLocaleString()}</strong>
          <span>{m.social_count({ count: '' })}</span>
        </p>
      {/if}
    </div>

    <div class="cta-col" use:reveal style="--reveal-delay: 120ms">
      <h2 class="cta-title">{m.trust_cta_title()}</h2>
      <div class="form-wrap">
        <WaitlistForm {onSuccess} />
      </div>
    </div>
  </div>
</section>

<style>
  .trust {
    background: var(--surface-page);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: var(--space-3xl);
  }

  .note-col {
    display: flex;
    flex-direction: column;
    gap: var(--space-base);
    max-width: 480px;
  }
  .stat {
    margin: 0;
    padding: var(--space-md) var(--space-base);
    font-size: var(--fs-body-sm);
    line-height: var(--lh-body-sm);
    color: var(--text-body);
    background: var(--surface-subtle);
    border-left: 3px solid var(--cyan-bright);
    border-radius: var(--radius-sm);
  }
  .note {
    margin: 0;
    padding: var(--space-lg);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-e1);
  }
  blockquote {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    color: var(--text-body);
  }
  figcaption {
    position: relative;
    display: inline-block;
    margin-top: var(--space-md);
  }
  .sign {
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    color: var(--text-strong);
  }
  .underline {
    display: block;
    width: 120px;
    height: 8px;
    margin-top: 2px;
    color: var(--color-primary);
  }
  .underline path {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
  }
  /* `is-in` is added at runtime by the reveal action — keep it global so the
     scoper doesn't prune this signature draw. */
  .note-col:global(.is-in) .underline path {
    transition: stroke-dashoffset 0.9s var(--ease-out) 0.5s;
    stroke-dashoffset: 0;
  }
  .care {
    margin: 0;
    font-size: var(--fs-body-sm);
    color: var(--text-muted);
    line-height: var(--lh-body);
  }
  .count {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
    margin: 0;
    color: var(--text-muted);
    font-size: var(--fs-body-sm);
  }
  .count strong {
    font-family: var(--font-display);
    font-size: var(--fs-h3);
    color: var(--color-primary);
    font-variant-numeric: tabular-nums;
  }

  .cta-col {
    display: flex;
    flex-direction: column;
    gap: var(--space-base);
    padding: var(--space-2xl);
    background: var(--gradient-sky);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
  }
  .cta-title {
    font-size: var(--fs-h2);
    line-height: var(--lh-h2);
    letter-spacing: var(--tracking-tight);
  }
  .form-wrap {
    border-radius: var(--radius-lg);
    transition: box-shadow var(--dur-slow) var(--ease-out);
  }
  .form-wrap:focus-within {
    box-shadow: 0 0 0 4px rgba(0, 160, 163, 0.16);
  }

  @media (max-width: 880px) {
    .grid {
      grid-template-columns: 1fr;
      gap: var(--space-xl);
    }
    .cta-col {
      padding: var(--space-lg);
    }
  }
</style>
