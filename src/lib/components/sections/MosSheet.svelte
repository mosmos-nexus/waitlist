<script lang="ts">
  import { animate } from 'animejs';
  import MosBlob from '$lib/components/world/MosBlob.svelte';
  import type { MosMood } from '$lib/anime/mos';
  import { m } from '$lib/locale.svelte';
  import { prefersReduced, reveal } from '$lib/anime/motion';

  /**
   * Mos, as a character sheet you operate.
   *
   * The design system ships six Mos poses as flat PNGs. This section makes the
   * same point with one live body instead: pick a state and the *same* creature
   * changes energy, aura and face. That's the difference between "here are some
   * illustrations" and "here is your Mos".
   */

  const MOODS = $derived<{ key: MosMood; label: string; line: string }[]>([
    { key: 'happy', label: m.sheet_mood_greeting(), line: m.sheet_line_greeting() },
    { key: 'working', label: m.sheet_mood_working(), line: m.sheet_line_working() },
    { key: 'idle', label: m.sheet_mood_idle(), line: m.sheet_line_idle() },
    { key: 'resting', label: m.sheet_mood_resting(), line: m.sheet_line_resting() },
  ]);

  let picked = $state(2);
  const active = $derived(MOODS[picked]);

  let lineEl = $state<HTMLParagraphElement | null>(null);

  function pick(index: number) {
    if (picked === index) return;
    picked = index;
    if (lineEl && !prefersReduced()) {
      animate(lineEl, { opacity: [0, 1], translateY: [8, 0], duration: 460, ease: 'out(3)' });
    }
  }
</script>

<section class="section sheet">
  <div class="container inner">
    <div class="copy">
      <div class="head reveal" use:reveal>
        <span class="eyebrow">{m.mos_eyebrow()}</span>
        <h2 class="t-heading-1 title">{m.mos_title()}</h2>
        <p class="t-body-1-reading gloss prewrap">{m.mos_gloss()}</p>
      </div>

      <dl class="facts reveal" use:reveal={{ delay: 80 }}>
        <div>
          <dt>{m.mos_skilled()}</dt>
          <dd>{m.mos_skilled_sub()}</dd>
        </div>
        <div>
          <dt>{m.sheet_fact_mon()}</dt>
          <dd>{m.mos_mon_hint()}</dd>
        </div>
      </dl>
    </div>

    <div class="viewer reveal glass" use:reveal={{ delay: 120, scale: true }}>
      <div class="body">
        <MosBlob size={220} mood={active.key} label={m.mos_title()} />
      </div>

      <p class="line prewrap" bind:this={lineEl} aria-live="polite">{active.line}</p>

      <div class="switch" role="group" aria-label={m.sheet_hint()}>
        {#each MOODS as mood, i (mood.key)}
          <button
            type="button"
            class:on={picked === i}
            aria-pressed={picked === i}
            onclick={() => pick(i)}
          >
            {mood.label}
          </button>
        {/each}
      </div>

      <span class="hint">{m.sheet_hint()}</span>
    </div>
  </div>
</section>

<style>
  .sheet {
    background:
      radial-gradient(60% 60% at 82% 40%, rgba(31, 206, 206, 0.1), transparent 70%), var(--app-bg);
  }

  .inner {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-40);
    align-items: center;
  }
  @media (min-width: 940px) {
    .inner {
      grid-template-columns: 1fr minmax(360px, 440px);
      gap: var(--space-64);
    }
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-32);
  }
  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    max-width: 40ch;
  }
  .title {
    color: var(--label-strong);
  }
  .gloss {
    color: var(--label-alternative);
  }

  .facts {
    display: flex;
    flex-direction: column;
    gap: var(--space-20);
    max-width: 44ch;
  }
  .facts div {
    padding-left: var(--space-16);
    border-left: 1px solid var(--line-normal-normal);
  }
  dt {
    font-size: var(--font-size-subtitle-2);
    font-weight: var(--weight-semibold);
    color: var(--label-normal);
  }
  dd {
    margin: var(--space-4) 0 0;
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-assistive);
  }

  .viewer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-16);
    padding: var(--space-32) var(--space-24) var(--space-24);
  }
  .body {
    display: grid;
    place-items: center;
    /* Reserve the tallest state so switching moods never reflows the panel */
    min-height: 220px;
  }
  .line {
    min-height: 3em;
    max-width: 30ch;
    text-align: center;
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-normal);
  }

  .switch {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-6);
    padding: 4px;
    border-radius: var(--radius-full);
    background: rgba(20, 23, 27, 0.66);
    border: 1px solid var(--line-normal-normal);
  }
  .switch button {
    min-height: 34px;
    padding: 0 14px;
    border: 0;
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--label-alternative);
    font-size: var(--font-size-caption-1);
    cursor: pointer;
    transition: var(--transition-base);
  }
  .switch button:hover {
    color: var(--label-strong);
    background: var(--fill-weak);
  }
  .switch button.on {
    background: var(--primary-normal);
    color: var(--static-white);
    font-weight: var(--weight-semibold);
  }
  .switch button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  .hint {
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }
</style>
