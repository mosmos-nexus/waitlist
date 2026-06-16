<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';

  const steps = [
    { label: m.story_step1_label, text: m.story_step1_text },
    { label: m.story_step2_label, text: m.story_step2_text },
    { label: m.story_step3_label, text: m.story_step3_text },
  ];
</script>

<section class="section story">
  <div class="container">
    <span class="eyebrow">{m.story_eyebrow()}</span>
    <h2>{m.story_title()}</h2>

    <ol class="flow">
      {#each steps as step, i (step.label)}
        <li class="step">
          <span class="label">{step.label()}</span>
          <p class="text">{step.text()}</p>
        </li>
        {#if i < steps.length - 1}
          <li class="arrow" aria-hidden="true">→</li>
        {/if}
      {/each}
    </ol>

    <p class="close">{m.story_close()}</p>
  </div>
</section>

<style>
  .story .container {
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
  h2 {
    margin: var(--space-sm) 0 var(--space-2xl);
    font-size: var(--fs-h2);
    line-height: var(--lh-h2);
  }
  .flow {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--space-base);
    width: 100%;
  }
  .step {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    flex: 1 1 0;
    min-width: 180px;
    max-width: 240px;
    padding: var(--space-lg);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-e1);
  }
  .label {
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    color: var(--color-primary);
  }
  .text {
    margin: 0;
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-subtitle);
    color: var(--text-strong);
  }
  .arrow {
    flex: none;
    font-size: 24px;
    color: var(--text-faint);
  }
  .close {
    margin: var(--space-2xl) 0 0;
    max-width: 30em;
    font-size: var(--fs-subtitle);
    line-height: var(--lh-subtitle);
    color: var(--text-muted);
  }
  @media (max-width: 720px) {
    .flow {
      flex-direction: column;
    }
    .step {
      max-width: 320px;
      width: 100%;
    }
    .arrow {
      transform: rotate(90deg);
    }
  }
</style>
