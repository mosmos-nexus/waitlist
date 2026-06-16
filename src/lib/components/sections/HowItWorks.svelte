<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';

  const steps = [
    { n: 1, name: m.how_step1_name, desc: m.how_step1_desc },
    { n: 2, name: m.how_step2_name, desc: m.how_step2_desc },
    { n: 3, name: m.how_step3_name, desc: m.how_step3_desc },
    { n: 4, name: m.how_step4_name, desc: m.how_step4_desc },
  ];
</script>

<section class="section how">
  <div class="container">
    <span class="eyebrow">{m.how_eyebrow()}</span>
    <h2>{m.how_title()}</h2>
    <p class="section-sub">{m.how_sub()}</p>

    <ol class="steps">
      {#each steps as step (step.n)}
        <li class="step">
          <span class="num">{step.n}</span>
          <h3>{step.name()}</h3>
          <p>{step.desc()}</p>
        </li>
      {/each}
    </ol>

    <p class="teaser">
      <span class="teaser-lead">{m.how_teaser()}</span>
      {m.how_teaser_more()}
    </p>
  </div>
</section>

<style>
  .eyebrow {
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    letter-spacing: var(--tracking-wide);
    text-transform: none;
    color: var(--color-primary);
  }
  h2 {
    margin: var(--space-sm) 0 var(--space-md);
    font-size: var(--fs-h2);
    line-height: var(--lh-h2);
  }
  .section-sub {
    margin: 0 0 var(--space-2xl);
    max-width: 30em;
    font-size: var(--fs-body);
    color: var(--text-muted);
    line-height: var(--lh-body);
  }
  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-lg);
  }
  .step {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-lg);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-e1);
  }
  .num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    color: var(--color-on-primary);
    background: var(--gradient-brand);
    border-radius: var(--radius-pill);
  }
  h3 {
    font-size: var(--fs-h3);
    line-height: var(--lh-h3);
  }
  .step p {
    margin: 0;
    color: var(--text-muted);
    line-height: var(--lh-body);
  }
  .teaser {
    margin: var(--space-2xl) 0 0;
    font-size: var(--fs-subtitle);
    color: var(--text-muted);
  }
  .teaser-lead {
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    color: var(--text-strong);
  }
  @media (max-width: 880px) {
    .steps {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 480px) {
    .steps {
      grid-template-columns: 1fr;
    }
  }
</style>
