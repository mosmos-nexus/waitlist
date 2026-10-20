<script lang="ts">
  import { track } from '@vercel/analytics';
  import { m } from '$lib/locale.svelte';

  // Stable ids, independent of the copy, so an answer can be referred to.
  const items = $derived([
    { id: 'when', q: m.faq_1_q(), a: m.faq_1_a() },
    { id: 'difference', q: m.faq_2_q(), a: m.faq_2_a() },
    { id: 'cost', q: m.faq_3_q(), a: m.faq_3_a() },
    { id: 'workers', q: m.faq_4_q(), a: m.faq_4_a() },
    { id: 'languages', q: m.faq_5_q(), a: m.faq_5_a() },
    { id: 'data', q: m.faq_6_q(), a: m.faq_6_a() },
  ]);
</script>

<section class="section faq" aria-labelledby="faq-title">
  <div class="container narrow">
    <h2 class="title" id="faq-title">{m.faq_title()}</h2>

    <div class="list">
      {#each items as item (item.id)}
        <!-- `toggle` fires on close too; only an opening is counted. -->
        <details ontoggle={(e) => e.currentTarget.open && track('faq_open', { id: item.id })}>
          <summary>
            <span class="q">{item.q}</span>
            <span class="sign" aria-hidden="true"></span>
          </summary>
          <div class="answer">
            <p>{item.a}</p>
          </div>
        </details>
      {/each}
    </div>
  </div>
</section>

<style>
  .faq {
    padding-top: 0;
  }
  .narrow {
    max-width: calc(var(--width-reading) + 2 * var(--grid-gutter));
  }

  .title {
    text-align: center;
  }

  .list {
    margin-top: var(--space-40);
    border-top: 1px solid var(--line-normal-normal);
  }

  details {
    border-bottom: 1px solid var(--line-normal-normal);
  }
  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-16);
    min-height: 64px;
    padding-block: var(--space-16);
    border-radius: var(--radius-xs);
    font-size: var(--font-size-subtitle-1);
    font-weight: var(--weight-semibold);
    line-height: 1.45;
    color: var(--label-strong);
    cursor: pointer;
    list-style: none;
    transition: color var(--duration-base) var(--ease-out);
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:hover {
    color: var(--primary-strong);
  }
  summary:focus-visible {
    outline-offset: 4px;
  }

  /* A plus in a ring that turns into a minus when open. */
  .sign {
    position: relative;
    flex: none;
    width: 28px;
    height: 28px;
    border: 1px solid var(--line-normal-normal);
    border-radius: 50%;
    background: var(--background-card);
    transition:
      border-color var(--duration-base) var(--ease-out),
      background var(--duration-base) var(--ease-out);
  }
  .sign::before,
  .sign::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 12px;
    height: 2px;
    margin: -1px 0 0 -6px;
    border-radius: 1px;
    background: var(--label-alternative);
    transition: transform var(--duration-base) var(--ease-out);
  }
  .sign::after {
    transform: rotate(90deg);
  }
  summary:hover .sign {
    border-color: var(--primary-light);
  }
  details[open] .sign {
    border-color: var(--primary-normal);
    background: var(--background-tint);
  }
  details[open] .sign::before,
  details[open] .sign::after {
    background: var(--primary-strong);
  }
  details[open] .sign::after {
    transform: rotate(0deg);
  }

  .answer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-8);
    padding: 0 var(--space-48) var(--space-24) 0;
    font-size: var(--font-size-body-1);
    line-height: var(--line-height-lead);
    color: var(--label-alternative);
  }

  @media (max-width: 640px) {
    summary {
      font-size: var(--font-size-subtitle-2);
    }
    .answer {
      padding-right: 0;
    }
  }
</style>
