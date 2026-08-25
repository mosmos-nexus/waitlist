<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal } from '$lib/anime/motion';

  /**
   * The character sheet.
   *
   * Monitor's settings hold values, turns of phrase and manner as editable
   * fields — an AI whose personality is configuration rather than a preset is
   * the most unusual thing in the whole product, and the sheet is how the
   * wireframes present it. Laid out as a sheet here for the same reason.
   */
  const GROUPS = $derived([
    { k: m.joy_values(), items: [m.joy_v1(), m.joy_v2(), m.joy_v3()] },
    { k: m.joy_habits(), items: [m.joy_h1(), m.joy_h2(), m.joy_h3()], quoted: true },
    { k: m.joy_manner(), items: [m.joy_m1(), m.joy_m2(), m.joy_m3()] },
  ]);
</script>

<section class="joy section" aria-labelledby="joy-title">
  <div class="container inner">
    <div class="head" use:reveal>
      <span class="eyebrow">{m.joy_eyebrow()}</span>
      <h2 class="t-heading-1 title" id="joy-title">{m.joy_title()}</h2>
      <p class="t-body-1-reading lead">{m.joy_lead()}</p>

      <div class="mode">
        <span class="mode-k">{m.joy_mode()}</span>
        <span class="seg" role="group" aria-label={m.joy_mode()}>
          <span class="seg-i" translate="no">Buddy</span>
          <span class="seg-i on" translate="no">Manager</span>
        </span>
        <span class="mode-note">{m.joy_mode_note()}</span>
      </div>
    </div>

    <article class="sheet" use:reveal={{ delay: 80, scale: true }}>
      <header class="sheet-head">
        <img src="/characters/mos-curious.webp" alt="" width="56" height="56" loading="lazy" />
        <div class="who">
          <span class="who-n" translate="no">Mos</span>
          <span class="who-s eyebrow">Character sheet</span>
        </div>
      </header>

      <dl class="rows">
        {#each GROUPS as g (g.k)}
          <div class="row">
            <dt>{g.k}</dt>
            <dd>
              <ul class:quoted={g.quoted}>
                {#each g.items as item (item)}
                  <li>{item}</li>
                {/each}
              </ul>
            </dd>
          </div>
        {/each}
      </dl>
    </article>
  </div>
</section>

<style>
  .joy {
    background: var(--panel);
    border-block: 1.5px solid var(--line-normal-alternative);
  }
  .inner {
    display: grid;
    gap: var(--space-40);
    align-items: center;
  }
  @media (min-width: 1000px) {
    .inner {
      grid-template-columns: minmax(0, 44fr) minmax(0, 56fr);
      gap: var(--space-64);
    }
  }

  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    max-width: 42ch;
  }
  .title {
    color: var(--label-strong);
    text-wrap: balance;
  }
  .lead {
    color: var(--label-alternative);
  }

  .mode {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-10);
    margin-top: var(--space-8);
  }
  .mode-k {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--label-assistive);
  }
  /* A read-only picture of the toggle, not a control — nothing on a waitlist
     page should look operable when it is not. */
  .seg {
    display: inline-flex;
    gap: 3px;
    padding: 3px;
    border-radius: var(--radius-full);
    background: var(--fill-normal);
    border: 1px solid var(--line-normal-alternative);
  }
  .seg-i {
    padding: 4px 12px;
    border-radius: var(--radius-full);
    font-size: var(--font-size-caption-2);
    color: var(--label-alternative);
  }
  .seg-i.on {
    background: var(--label-strong);
    color: var(--static-white);
    font-weight: var(--weight-semibold);
  }
  .mode-note {
    flex-basis: 100%;
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }

  .sheet {
    border: 1.5px solid var(--line-normal-normal);
    border-radius: 24px;
    background: var(--card);
    overflow: hidden;
  }
  .sheet-head {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    padding: var(--space-16) var(--space-20);
    border-bottom: 1.5px solid var(--line-normal-normal);
  }
  .sheet-head img {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    background: var(--fill-normal);
    object-fit: contain;
  }
  .who {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .who-n {
    font-size: var(--font-size-subtitle-2);
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }

  .rows {
    margin: 0;
    display: flex;
    flex-direction: column;
  }
  .row {
    display: grid;
    grid-template-columns: 5.5rem minmax(0, 1fr);
    gap: var(--space-16);
    padding: var(--space-16) var(--space-20);
    border-top: 1px dashed var(--line-normal-alternative);
  }
  .row:first-child {
    border-top: 0;
  }
  dt {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--label-assistive);
    padding-top: 3px;
  }
  dd {
    margin: 0;
    min-width: 0;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  li {
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-strong);
  }
  /* Turns of phrase are things Mos says, so they are set as speech. */
  .quoted li {
    color: var(--primary-strong);
  }
  .quoted li::before {
    content: '“';
  }
  .quoted li::after {
    content: '”';
  }
</style>
