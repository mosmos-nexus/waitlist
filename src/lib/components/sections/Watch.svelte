<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal } from '$lib/anime/motion';

  /**
   * Heartbeat and Cron-Job, side by side.
   *
   * This is the page's one loud moment, and it is loud because the fact is:
   * a Heartbeat rule is a sentence you write, not a form you fill in. The memo
   * lines are the wireframe's own — "tell me when Mana drops below 200" is a
   * real watch rule, not sample copy. Everything around it stays quiet so the
   * memo reads as the thing worth looking at.
   */
  const MEMOS = $derived([m.watch_memo_1(), m.watch_memo_2(), m.watch_memo_3(), m.watch_memo_4()]);
  const CRONS = $derived([
    { name: m.watch_cron_1(), meta: m.watch_cron_1_m() },
    { name: m.watch_cron_2(), meta: m.watch_cron_2_m() },
    { name: m.watch_cron_3(), meta: m.watch_cron_3_m() },
  ]);
</script>

<section class="watch section" aria-labelledby="watch-title">
  <div class="container">
    <div class="head" use:reveal>
      <span class="eyebrow">{m.watch_eyebrow()}</span>
      <h2 class="t-heading-1 title" id="watch-title">{m.watch_title()}</h2>
      <p class="t-body-1-reading lead">{m.watch_lead()}</p>
    </div>

    <div class="pair">
      <article class="card beat" use:reveal={{ delay: 60 }}>
        <header>
          <h3 class="card-t">{m.watch_beat_t()}</h3>
          <p class="card-d">{m.watch_beat_d()}</p>
        </header>

        <!-- The memo itself. Written like a note, because that is what it is. -->
        <ul class="memo">
          {#each MEMOS as line, i (i)}
            <li>{line}</li>
          {/each}
        </ul>

        <p class="meta tnum">{m.watch_beat_meta()}</p>
      </article>

      <article class="card cron" use:reveal={{ delay: 110 }}>
        <header>
          <h3 class="card-t">{m.watch_cron_t()}</h3>
          <p class="card-d">{m.watch_cron_d()}</p>
        </header>

        <ul class="rows">
          {#each CRONS as row (row.name)}
            <li>
              <span class="row-n">{row.name}</span>
              <span class="row-m tnum">{row.meta}</span>
            </li>
          {/each}
        </ul>
      </article>
    </div>
  </div>
</section>

<style>
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
      /* The memo card carries the section, so it gets the wider column. */
      grid-template-columns: minmax(0, 58fr) minmax(0, 42fr);
    }
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
    padding: var(--space-24);
    border: 1.5px solid var(--line-normal-normal);
    border-radius: 24px;
    background: var(--card);
  }
  .card header {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  .card-t {
    margin: 0;
    font-size: var(--font-size-subtitle-2);
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .card-d {
    margin: 0;
    font-size: var(--font-size-caption-1);
    line-height: var(--line-height-body-reading);
    color: var(--label-alternative);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  /* A pad of hand-written watch rules. The rule stays a sentence all the way
     down to the type: no chips, no fields, no operators. */
  .memo {
    display: flex;
    flex-direction: column;
    padding: var(--space-8) var(--space-16);
    border-radius: 18px;
    background: var(--panel);
    border: 1px dashed var(--line-normal-normal);
  }
  .memo li {
    position: relative;
    padding: var(--space-10) 0 var(--space-10) var(--space-20);
    border-top: 1px dashed var(--line-normal-alternative);
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-strong);
  }
  .memo li:first-child {
    border-top: 0;
  }
  .memo li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 1.05em;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-normal);
  }

  .meta {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--label-assistive);
  }

  .rows {
    display: flex;
    flex-direction: column;
  }
  .rows li {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: var(--space-12) 0;
    border-top: 1px dashed var(--line-normal-alternative);
  }
  .rows li:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .row-n {
    font-size: var(--font-size-body-2);
    color: var(--label-strong);
  }
  .row-m {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--label-assistive);
  }
</style>
