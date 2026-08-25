<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal } from '$lib/anime/motion';

  /**
   * How work actually gets handed over, and what it costs.
   *
   * The wireframes are unusually specific about the money — a paid Mon is
   * "10 fixed + the tokens it used", charged once the run has finished — so the
   * cost card here is the Hub detail panel's own arithmetic rather than a
   * marketing range. A waitlist that is vague about price is hiding something;
   * this one is not.
   */
  const STEPS = $derived([
    { n: '01', t: m.flow_s1(), d: m.flow_s1_d() },
    { n: '02', t: m.flow_s2(), d: m.flow_s2_d() },
    { n: '03', t: m.flow_s3(), d: m.flow_s3_d() },
  ]);
</script>

<section class="flow section" aria-labelledby="flow-title">
  <div class="container inner">
    <div class="left">
      <div class="head" use:reveal>
        <span class="eyebrow">{m.flow_eyebrow()}</span>
        <h2 class="t-heading-1 title prewrap" id="flow-title">{m.flow_title()}</h2>
        <p class="t-body-1-reading lead">{m.flow_lead()}</p>
      </div>

      <!-- Numbered because it is a sequence: the goal has to be named before
           anything can be picked, and nothing is charged until it finishes. -->
      <ol class="steps" use:reveal={{ delay: 80 }}>
        {#each STEPS as s (s.n)}
          <li>
            <span class="num tnum">{s.n}</span>
            <div class="step-body">
              <span class="step-t">{s.t}</span>
              <span class="step-d">{s.d}</span>
            </div>
          </li>
        {/each}
      </ol>
    </div>

    <aside class="cost" use:reveal={{ delay: 120, scale: true }}>
      <span class="eyebrow">{m.flow_pick()}</span>

      <div class="mon">
        <img src="/characters/mon-research.webp" alt="" width="48" height="48" loading="lazy" />
        <div class="mon-meta">
          <span class="mon-n" translate="no">계약 검토 Mon</span>
          <span class="mon-by" translate="no">lawtech.kim</span>
        </div>
        <span class="badge">{m.flow_verified()}</span>
      </div>

      <div class="total">
        <span class="total-k">{m.flow_cost_label()}</span>
        <span class="total-v tnum"><b translate="no">Mana</b> 28~42</span>
      </div>

      <dl class="breakdown">
        <div>
          <dt>{m.flow_rent()}</dt>
          <dd class="tnum">10</dd>
        </div>
        <div>
          <dt>{m.flow_token()}</dt>
          <dd class="tnum">18~32</dd>
        </div>
        <div>
          <dt>{m.flow_skill_line()}</dt>
          <dd>{m.flow_skill_free()}</dd>
        </div>
      </dl>

      <p class="note">{m.flow_note()}</p>
    </aside>
  </div>
</section>

<style>
  .inner {
    display: grid;
    gap: var(--space-40);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .inner {
      grid-template-columns: minmax(0, 1fr) minmax(360px, 420px);
      gap: var(--space-64);
    }
  }

  .left {
    display: flex;
    flex-direction: column;
    gap: var(--space-32);
  }
  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    max-width: 44ch;
  }
  .title {
    color: var(--label-strong);
    text-wrap: balance;
  }
  .lead {
    color: var(--label-alternative);
  }

  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    max-width: 46ch;
  }
  .steps li {
    display: flex;
    gap: var(--space-16);
    padding: var(--space-16) 0;
    border-top: 1px dashed var(--line-normal-alternative);
  }
  .steps li:first-child {
    border-top: 1.5px solid var(--line-normal-normal);
  }
  .num {
    flex: none;
    width: 2.4em;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--primary-normal);
    padding-top: 2px;
  }
  .step-body {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .step-t {
    font-size: var(--font-size-body-1);
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .step-d {
    font-size: var(--font-size-caption-1);
    line-height: var(--line-height-body-reading);
    color: var(--label-alternative);
  }

  /* The Hub detail panel, kept at its own size. */
  .cost {
    display: flex;
    flex-direction: column;
    gap: var(--space-14);
    padding: var(--space-24);
    border: 1.5px solid var(--line-normal-normal);
    border-radius: 24px;
    background: var(--card);
    box-shadow: var(--shadow-e2);
  }

  .mon {
    display: flex;
    align-items: center;
    gap: var(--space-10);
  }
  .mon img {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    background: var(--fill-normal);
    object-fit: contain;
  }
  .mon-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .mon-n {
    font-size: var(--font-size-body-2);
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .mon-by {
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }
  .badge {
    margin-left: auto;
    flex: none;
    padding: 4px 9px;
    border-radius: var(--radius-full);
    border: 1.5px solid var(--primary-normal);
    font-size: 10.5px;
    font-weight: var(--weight-semibold);
    color: var(--primary-strong);
  }

  .total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-12);
    padding-top: var(--space-14);
    border-top: 1.5px solid var(--line-normal-alternative);
  }
  .total-k {
    font-size: var(--font-size-caption-1);
    color: var(--label-alternative);
  }
  .total-v {
    font-size: 26px;
    font-weight: 800;
    color: var(--primary-normal);
    letter-spacing: -0.01em;
  }
  .total-v b {
    font-size: 14px;
    font-weight: 500;
    color: var(--label-alternative);
  }

  .breakdown {
    margin: 0;
    display: flex;
    flex-direction: column;
  }
  .breakdown div {
    display: flex;
    justify-content: space-between;
    gap: var(--space-12);
    padding: var(--space-8) 0;
    border-top: 1px dashed var(--line-normal-alternative);
  }
  .breakdown div:first-child {
    border-top: 0;
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

  .note {
    margin: 0;
    padding-top: var(--space-12);
    border-top: 1px dashed var(--line-normal-alternative);
    font-size: var(--font-size-caption-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-assistive);
  }
</style>
