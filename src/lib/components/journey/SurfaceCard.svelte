<script lang="ts">
  interface Props {
    /** Which product surface this thumbnail stands for. */
    surface: string;
    name: string;
    /** Monitor is the world work runs in; the rest are workshop and market. */
    plate: 'dark' | 'light';
  }
  let { surface, name, plate }: Props = $props();
</script>

<!--
  A surface as a thumbnail rather than a word with a sentence under it. The
  light/dark split is the product's own: Monitor is where work runs, Hub,
  Inventory and Studio are where it is made and traded.
-->
<div class="card" data-plate={plate} data-surface={surface}>
  <svg class="mini" viewBox="0 0 96 56" aria-hidden="true">
    {#if surface === 'monitor'}
      <!-- the island, Mos on it, two Mon beside -->
      <path class="soft" d="M27,33q21,-8 42,0q-21,8 -42,0z" />
      <path class="deep" d="M31,34q17,16 34,0q-17,7 -34,0z" />
      <circle class="key" cx="48" cy="24" r="7.5" />
      <circle class="soft" cx="33" cy="31" r="3" />
      <circle class="soft" cx="63" cy="31" r="3" />
      <rect class="key" x="34" y="45" width="28" height="2.4" rx="1.2" />
    {:else if surface === 'hub'}
      <!-- a registry of cards, one carrying a verified badge -->
      {#each [0, 1, 2, 3, 4, 5] as n (n)}
        <rect
          class="soft"
          x={9 + (n % 3) * 27}
          y={8 + Math.floor(n / 3) * 24}
          width="22"
          height="17"
          rx="4"
        />
      {/each}
      <path class="stroke-key" d="M13,15l3,3l5,-6" />
    {:else if surface === 'inventory'}
      <!-- what you hold, as rows -->
      <rect class="soft" x="9" y="8" width="78" height="3" rx="1.5" />
      {#each [0, 1, 2] as n (n)}
        <circle class="key" cx="14" cy={22 + n * 12} r="3.4" />
        <rect class="soft" x="23" y={20 + n * 12} width={58 - n * 14} height="4" rx="2" />
      {/each}
    {:else}
      <!-- wired nodes, and the Skill that is a document -->
      <path class="stroke-soft" d="M23,36L46,20L69,34" />
      <circle class="key" cx="23" cy="36" r="5" />
      <circle class="key" cx="46" cy="20" r="6.5" />
      <circle class="key" cx="69" cy="34" r="5" />
      <rect class="soft" x="36" y="41" width="24" height="10" rx="3" />
      <path class="stroke-soft" d="M40,45h16M40,48h11" />
    {/if}
  </svg>
  <span class="name">{name}</span>
</div>

<style>
  .card {
    width: 116px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 8px 8px 7px;
    /* Rounded hard, like everything else in this world */
    border-radius: 18px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.46);
  }
  .card[data-plate='dark'] {
    background: #0a1120;
    color: #dfe8f7;
  }
  .card[data-plate='light'] {
    background: #eef2f8;
    color: #16324f;
  }

  .mini {
    display: block;
    width: 100%;
    height: auto;
  }
  /* Base tone on `fill-opacity`, so nothing that animates element `opacity` can
     overwrite it and leave a light plate covered in full-strength marks. */
  .soft {
    fill: currentColor;
    fill-opacity: 0.26;
  }
  .deep {
    fill: currentColor;
    fill-opacity: 0.46;
  }
  .key {
    fill: var(--summon-cyan);
  }
  .stroke-soft {
    fill: none;
    stroke: currentColor;
    stroke-opacity: 0.4;
    stroke-width: 2;
    stroke-linecap: round;
  }
  .stroke-key {
    fill: none;
    stroke: var(--summon-cyan);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .name {
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    text-align: center;
  }
</style>
