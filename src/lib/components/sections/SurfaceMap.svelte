<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal } from '$lib/anime/motion';

  /**
   * The five screens, and the line each one will not cross.
   *
   * Every wireframe carries a "what this screen does not do" note at the
   * bottom — Inventory holds capability but never output, Hub is a registry and
   * not a shelf, Studio builds but never runs. Those boundaries are the clearest
   * thing about the product, so the map states both halves rather than only the
   * flattering one.
   */
  const SURFACES = $derived([
    { n: 'Monitor', d: m.map_monitor_d(), no: m.map_monitor_n() },
    { n: 'Hub', d: m.map_hub_d(), no: m.map_hub_n() },
    { n: 'Inventory', d: m.map_inventory_d(), no: m.map_inventory_n() },
    { n: 'Storage', d: m.map_storage_d(), no: m.map_storage_n() },
    { n: 'Studio', d: m.map_studio_d(), no: m.map_studio_n() },
  ]);
</script>

<section class="map section" aria-labelledby="map-title">
  <div class="container">
    <div class="head" use:reveal>
      <span class="eyebrow">{m.map_eyebrow()}</span>
      <h2 class="t-heading-1 title" id="map-title">{m.map_title()}</h2>
      <p class="t-body-1-reading lead">{m.map_lead()}</p>
    </div>

    <ul class="grid">
      {#each SURFACES as s, i (s.n)}
        <li class="cell" use:reveal={{ delay: 40 + i * 40 }}>
          <h3 class="n" translate="no">{s.n}</h3>
          <p class="d">{s.d}</p>
          <p class="no"><span class="no-k">{m.map_not()}</span>{s.no}</p>
        </li>
      {/each}
    </ul>
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

  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-16);
  }
  @media (min-width: 700px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1060px) {
    .grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-20);
    border: 1.5px solid var(--line-normal-normal);
    border-radius: 20px;
    background: var(--card);
  }
  .n {
    margin: 0;
    font-size: var(--font-size-subtitle-2);
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .d {
    margin: 0;
    flex: 1;
    font-size: var(--font-size-caption-1);
    line-height: var(--line-height-body-reading);
    color: var(--label-alternative);
  }
  .no {
    margin: 0;
    padding-top: var(--space-10);
    border-top: 1px dashed var(--line-normal-alternative);
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }
  .no-k {
    display: block;
    margin-bottom: 2px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--primary-strong);
  }
</style>
