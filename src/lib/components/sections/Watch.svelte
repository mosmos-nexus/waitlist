<script lang="ts">
  import { onMount } from 'svelte';
  import { createTimer, utils } from 'animejs';
  import { m } from '$lib/locale.svelte';
  import { reveal, scrub, prefersReduced } from '$lib/anime/motion';

  /**
   * The product's most unusual fact, made operable.
   *
   * Nothing here is a rule builder: the patrol reads plain sentences, so the
   * demonstration is a notepad. Adding a line is the whole interaction, and the
   * trace answers it — more to watch, more activity — which is the only way to
   * show that the two are connected without a paragraph saying so.
   */
  const SAMPLES = $derived([
    m.watch_memo_1(),
    m.watch_memo_2(),
    m.watch_memo_3(),
    m.watch_memo_4(),
  ]);

  let lines = $state<string[]>([]);
  let draft = $state('');
  let seeded = false;

  // Seeded from the message catalogue rather than initialised inline, so the
  // list still has content after a locale switch on a page that never remounts.
  $effect(() => {
    const s = SAMPLES;
    if (!seeded) {
      lines = s.slice(0, 3);
      seeded = true;
    }
  });

  function add(event: SubmitEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    lines = [...lines, value];
    draft = '';
  }
  function remove(index: number) {
    lines = lines.filter((_, i) => i !== index);
  }

  const CRONS = $derived([
    { name: m.watch_cron_1(), meta: m.watch_cron_1_m() },
    { name: m.watch_cron_2(), meta: m.watch_cron_2_m() },
    { name: m.watch_cron_3(), meta: m.watch_cron_3_m() },
  ]);
  let cronOn = $state([true, true, false]);

  /* ---- the trace ---- */
  const BAR_COUNT = 28;
  let trace = $state<HTMLElement | null>(null);
  /** More lines to watch means a busier patrol; empty means a flat line. */
  const activity = $derived(Math.min(1, lines.length / 5));

  onMount(() => {
    if (!trace || prefersReduced()) return;
    const bars = Array.from(trace.querySelectorAll<HTMLElement>('span'));
    const values = bars.map((_, i) => 0.2 + (i % 5) * 0.06);

    // 9fps on purpose: a heartbeat trace is a discrete sampler, and stepping is
    // what makes it read as one instead of as a wave.
    const timer = createTimer({
      duration: Infinity,
      frameRate: 9,
      onUpdate: () => {
        values.shift();
        const a = activity;
        const r = Math.random();
        values.push(
          r > 0.9 - a * 0.2 ? 0.55 + Math.random() * 0.3 * a : 0.12 + Math.random() * 0.22,
        );
        bars.forEach((b, i) => {
          const v = values[i];
          utils.set(b, {
            height: `${Math.round(5 + v * 21)}px`,
            backgroundColor:
              v > 0.72
                ? 'rgba(31,206,206,.95)'
                : v > 0.45
                  ? 'rgba(154,154,175,.7)'
                  : 'rgba(154,154,175,.36)',
          });
        });
      },
    });
    return () => timer.revert();
  });
</script>

<section class="watch section" aria-labelledby="watch-title">
  <div class="container">
    <div class="head" use:reveal>
      <span class="eyebrow">{m.watch_eyebrow()}</span>
      <h2 class="title" id="watch-title">{m.watch_title()}</h2>
      <p class="lead">{m.watch_lead()}</p>
    </div>

    <div class="grid">
      <div class="memo hud" use:reveal={{ delay: 60, scale: true }} use:scrub={{ y: 14 }}>
        <div class="memo-head">
          <span class="eyebrow">{m.watch_memo()}</span>
          <span class="hint">{m.watch_memo_hint()}</span>
        </div>

        <ul class="lines">
          {#each lines as line, i (line + i)}
            <li>
              <i class="bullet"></i>
              <span>{line}</span>
              <button
                type="button"
                class="x"
                onclick={() => remove(i)}
                aria-label={m.watch_remove()}
              >
                ✕
              </button>
            </li>
          {/each}
        </ul>

        <form class="add" onsubmit={add}>
          <!--
            `size="1"` is load-bearing, not cosmetic. An input with no `size`
            has an intrinsic width of about 20 characters, and that width is
            what a grid item's automatic minimum resolves to — `flex: 1` and
            `min-width: 0` shrink the *used* width but not that floor. It pushed
            this panel to 380px inside a 288px container and the whole document
            panned sideways on any phone under 400px.
          -->
          <input
            type="text"
            size="1"
            bind:value={draft}
            placeholder={m.watch_add()}
            aria-label={m.watch_add()}
            maxlength="60"
          />
          <button type="submit">{m.watch_add_cta()}</button>
        </form>

        <div class="beat">
          <span class="eyebrow">{m.watch_beat()}</span>
          <div class="trace" bind:this={trace} aria-hidden="true">
            {#each { length: BAR_COUNT } as _, i (i)}
              <span style="height:{6 + (i % 4) * 3}px"></span>
            {/each}
          </div>
          <span class="beat-state">{m.watch_beat_state()}</span>
        </div>
        <span class="hours">{m.watch_beat_hours()}</span>
      </div>

      <div class="cron hud" use:reveal={{ delay: 120, scale: true }} use:scrub={{ y: 22 }}>
        <div class="memo-head">
          <span class="eyebrow">{m.watch_cron()}</span>
          <span class="hint">{m.watch_cron_lead()}</span>
        </div>

        <ul class="jobs">
          {#each CRONS as c, i (c.name)}
            <li class:off={!cronOn[i]}>
              <div class="job-body">
                <span class="job-n">{c.name}</span>
                <span class="job-m tnum">{c.meta}</span>
              </div>
              <button
                type="button"
                class="switch"
                role="switch"
                aria-checked={cronOn[i]}
                aria-label="{c.name} · {m.watch_cron_on()}"
                onclick={() => (cronOn[i] = !cronOn[i])}
              >
                <span></span>
              </button>
            </li>
          {/each}
        </ul>

        <p class="note">{m.watch_note()}</p>
      </div>
    </div>
  </div>
</section>

<style>
  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    max-width: 40ch;
    margin-bottom: var(--space-32);
  }
  .title {
    margin: 0;
    font-size: clamp(28px, 3.6vw, 40px);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.025em;
    color: var(--shell-text);
    text-wrap: balance;
  }
  .lead {
    margin: 0;
    font-size: var(--font-size-body-1);
    line-height: 1.65;
    color: var(--shell-body);
  }

  .grid {
    display: grid;
    gap: var(--space-20);
  }
  @media (min-width: 900px) {
    .grid {
      grid-template-columns: minmax(0, 56fr) minmax(0, 44fr);
      align-items: start;
    }
  }

  .memo,
  .cron {
    display: flex;
    flex-direction: column;
    gap: var(--space-14);
    padding: var(--space-20);
  }
  .memo-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-8) var(--space-12);
  }
  .hint {
    font-size: 11px;
    color: var(--shell-faint);
  }

  .lines {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .lines li {
    display: flex;
    align-items: baseline;
    gap: var(--space-10);
    padding: 10px 0;
    border-top: 1px dashed var(--glass-line-soft);
    font-size: 13px;
    line-height: 1.55;
    color: var(--shell-text);
  }
  .lines li:first-child {
    border-top: 0;
  }
  .bullet {
    flex: none;
    width: 5px;
    height: 5px;
    margin-top: 6px;
    border-radius: 50%;
    background: var(--summon-cyan);
    align-self: flex-start;
  }
  .lines li span {
    flex: 1;
    min-width: 0;
  }
  .x {
    flex: none;
    width: 22px;
    height: 22px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--shell-faint);
    font-size: 10px;
    cursor: pointer;
    transition: var(--transition-base);
  }
  .x:hover {
    background: rgba(112, 115, 124, 0.24);
    color: var(--shell-text);
  }

  .add {
    display: flex;
    gap: var(--space-8);
  }
  .add input {
    flex: 1;
    min-width: 0;
    height: var(--control-m);
    padding: 0 14px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-s);
    background: rgba(112, 115, 124, 0.12);
    font: inherit;
    font-size: 13px;
    color: var(--shell-text);
  }
  .add input::placeholder {
    color: var(--shell-faint);
  }
  .add input:focus-visible {
    outline: none;
    border-color: var(--primary-light);
    box-shadow: var(--shadow-focus);
  }
  .add button {
    flex: none;
    height: var(--control-m);
    padding: 0 18px;
    border: 0;
    border-radius: var(--radius-full);
    background: var(--primary-normal);
    color: var(--static-white);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-base);
  }
  .add button:hover {
    background: var(--primary-strong);
  }
  .add button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  .beat {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-12);
    padding-top: var(--space-14);
    border-top: 1px solid var(--glass-line-soft);
  }
  .trace {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 26px;
  }
  .trace span {
    display: block;
    width: 3px;
    border-radius: 2px;
    background: rgba(154, 154, 175, 0.4);
  }
  .beat-state {
    font-size: 11.5px;
    color: var(--shell-meta);
  }
  .hours {
    font-size: 11px;
    color: var(--shell-faint);
  }

  .jobs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .jobs li {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    padding: 12px 0;
    border-top: 1px dashed var(--glass-line-soft);
    transition: opacity var(--duration-base) var(--ease-out);
  }
  .jobs li:first-child {
    border-top: 0;
  }
  .jobs li.off {
    opacity: 0.42;
  }
  .job-body {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .job-n {
    font-size: 13px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .job-m {
    font-size: 11px;
    color: var(--shell-meta);
  }

  .switch {
    margin-left: auto;
    flex: none;
    width: 44px;
    height: 26px;
    padding: 3px;
    border: 0;
    border-radius: var(--radius-full);
    background: rgba(112, 115, 124, 0.4);
    display: flex;
    justify-content: flex-start;
    cursor: pointer;
    transition: var(--transition-base);
  }
  .switch[aria-checked='true'] {
    background: var(--primary-normal);
    justify-content: flex-end;
  }
  .switch:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
  .switch span {
    display: block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
  }

  .note {
    margin: 0;
    padding-top: var(--space-12);
    border-top: 1px solid var(--glass-line-soft);
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--shell-faint);
  }
</style>
