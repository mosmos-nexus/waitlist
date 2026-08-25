<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal } from '$lib/anime/motion';

  /**
   * Two kinds of review, which is a real difference and not a claim.
   *
   * Hub carries a Mos score beside the star rating: the Mos that actually gave
   * this Mon work report completion, format adherence, how often they called it
   * back and what a run cost them. The figures below are that panel's.
   */
  const METRICS = $derived([
    { k: m.rev_m1(), v: '96%' },
    { k: m.rev_m2(), v: '94%' },
    { k: m.rev_m3(), v: '68%' },
    { k: m.rev_m4(), v: 'Mana 32 · 2:10' },
  ]);
</script>

<section class="rev section" aria-labelledby="rev-title">
  <div class="container">
    <div class="head" use:reveal>
      <span class="eyebrow">{m.rev_eyebrow()}</span>
      <h2 class="t-heading-1 title" id="rev-title">{m.rev_title()}</h2>
      <p class="t-body-1-reading lead">{m.rev_lead()}</p>
    </div>

    <div class="pair">
      <article class="card mos" use:reveal={{ delay: 60 }}>
        <header>
          <h3 class="card-t">{m.rev_mos_t()}</h3>
          <span class="score tnum" translate="no">Mos 92 / 100</span>
        </header>
        <p class="card-d">{m.rev_mos_d()}</p>

        <dl class="metrics">
          {#each METRICS as row (row.k)}
            <div>
              <dt>{row.k}</dt>
              <dd class="tnum">{row.v}</dd>
            </div>
          {/each}
        </dl>

        <p class="quote">{m.rev_mos_note()}</p>
      </article>

      <article class="card patron" use:reveal={{ delay: 110 }}>
        <header>
          <h3 class="card-t">{m.rev_patron_t()}</h3>
          <span class="score tnum">★ 4.8 · 212</span>
        </header>

        <figure>
          <blockquote>{m.rev_p1()}</blockquote>
          <figcaption>{m.rev_p1_m()}</figcaption>
        </figure>
        <figure>
          <blockquote>{m.rev_p2()}</blockquote>
          <figcaption>{m.rev_p2_m()}</figcaption>
        </figure>
      </article>
    </div>
  </div>
</section>

<style>
  .rev {
    background: var(--panel);
    border-block: 1.5px solid var(--line-normal-alternative);
  }
  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    max-width: 48ch;
    margin-bottom: var(--space-40);
  }
  .title {
    color: var(--label-strong);
    text-wrap: balance;
  }
  .lead {
    color: var(--label-alternative);
  }

  .pair {
    display: grid;
    gap: var(--space-20);
  }
  @media (min-width: 900px) {
    .pair {
      grid-template-columns: 1fr 1fr;
    }
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    padding: var(--space-24);
    border: 1.5px solid var(--line-normal-normal);
    border-radius: 24px;
    background: var(--card);
  }
  header {
    display: flex;
    align-items: baseline;
    gap: var(--space-12);
  }
  .card-t {
    margin: 0;
    font-size: var(--font-size-subtitle-2);
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .score {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--primary-strong);
  }
  .card-d {
    margin: 0;
    font-size: var(--font-size-caption-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-assistive);
  }

  .metrics {
    margin: 0;
    display: flex;
    flex-direction: column;
  }
  .metrics div {
    display: flex;
    justify-content: space-between;
    gap: var(--space-12);
    padding: var(--space-10) 0;
    border-top: 1px dashed var(--line-normal-alternative);
  }
  .metrics div:first-child {
    border-top: 1.5px solid var(--line-normal-alternative);
  }
  dt {
    font-size: var(--font-size-caption-1);
    color: var(--label-alternative);
  }
  dd {
    margin: 0;
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }

  .quote {
    margin: 0;
    padding-top: var(--space-12);
    border-top: 1px dashed var(--line-normal-alternative);
    font-size: var(--font-size-caption-1);
    line-height: var(--line-height-body-reading);
    color: var(--label-alternative);
  }

  figure {
    margin: 0;
    padding-top: var(--space-12);
    border-top: 1px dashed var(--line-normal-alternative);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  figure:first-of-type {
    border-top: 1.5px solid var(--line-normal-alternative);
  }
  blockquote {
    margin: 0;
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-strong);
  }
  figcaption {
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }
</style>
