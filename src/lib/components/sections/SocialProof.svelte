<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import { features } from '$lib/config/features';

  interface Props {
    // Wired only when the registrant-counter gate is enabled (real count, never fabricated).
    registrantCount?: number | null;
  }
  let { registrantCount = null }: Props = $props();
</script>

<section class="section social">
  <div class="container">
    <span class="eyebrow">{m.social_eyebrow()}</span>

    <figure class="note">
      <blockquote>{m.founder_note()}</blockquote>
      <figcaption>{m.founder_sign()}</figcaption>
    </figure>

    <!-- §8 conditional-exposure gates — present in code, OFF by default. -->
    {#if features.registrantCounter && registrantCount != null}
      <p class="counter">{m.social_count({ count: registrantCount })}</p>
    {/if}
    {#if features.surveyStatN45}
      <p class="stat">{m.gated_stat_n45()}</p>
    {/if}
  </div>
</section>

<style>
  .social .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .eyebrow {
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    letter-spacing: var(--tracking-wide);
    text-transform: none;
    color: var(--color-accent);
  }
  .note {
    margin: var(--space-lg) 0 0;
    max-width: 600px;
    padding: var(--space-2xl);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-e1);
  }
  blockquote {
    margin: 0;
    font-size: var(--fs-subtitle);
    line-height: var(--lh-subtitle);
    color: var(--text-body);
  }
  figcaption {
    margin-top: var(--space-base);
    font-weight: var(--fw-semibold);
    color: var(--text-strong);
  }
  .stat {
    margin: var(--space-lg) 0 0;
    max-width: 36em;
    color: var(--text-muted);
  }
  .counter {
    margin: var(--space-lg) 0 0;
    font-family: var(--font-display);
    font-size: var(--fs-h1);
    color: var(--color-primary);
  }
</style>
