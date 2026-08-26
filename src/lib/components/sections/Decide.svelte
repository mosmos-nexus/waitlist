<script lang="ts">
  import { m } from '$lib/locale.svelte';
  import { reveal, scrub, animate, prefersReduced } from '$lib/anime/motion';
  import Mon from '$lib/components/world/Mon.svelte';

  /**
   * The one thing on this page you actually operate.
   *
   * It is built around the sentence the brand persona leads with — "목표를 함께
   * 정해요" — so the interaction is a negotiation, not a dispatch: you name a
   * goal, Mos asks the one question that turns it into something specific, and
   * only then does anything run. Which is also where the two execution shapes
   * separate honestly: light work Mos answers itself, heavy work goes to a Mon.
   */
  interface Props {
    /** Raised while a Mon is running, so the island reacts with the section. */
    busy?: boolean;
  }
  let { busy = $bindable(false) }: Props = $props();

  type Stage = 'pick' | 'ask' | 'run' | 'done';
  let stage = $state<Stage>('pick');
  let picked = $state(0);
  let answer = $state(0);
  let step = $state(0);
  let progress = $state(0);

  const GOALS = $derived([
    {
      text: m.decide_g1(),
      ask: m.decide_ask1(),
      options: [m.decide_ask1_a(), m.decide_ask1_b()],
      tone: 'research' as const,
      mon: m.decide_mon_1(),
      result: m.decide_r1(),
    },
    {
      text: m.decide_g2(),
      ask: m.decide_ask2(),
      options: [m.decide_ask2_a(), m.decide_ask2_b()],
      tone: 'organize' as const,
      mon: m.decide_mon_2(),
      result: m.decide_r2(),
    },
    {
      text: m.decide_g3(),
      ask: m.decide_ask3(),
      options: [m.decide_ask3_a(), m.decide_ask3_b()],
      tone: 'design' as const,
      mon: m.decide_mon_3(),
      result: m.decide_r3(),
    },
  ]);
  const goal = $derived(GOALS[picked]);
  /* Mos never executes. The brand definition is explicit: it answers in
     conversation but hands every task to a Mon and brings the result back. The
     section used to run one of the three goals on Mos directly, which said the
     opposite of the product. Now the actor is printed on each step so the
     division is visible rather than implied. */
  const STEPS = $derived([
    { by: 'mos', text: m.decide_step1() },
    { by: 'mon', text: m.decide_step2() },
    { by: 'mos', text: m.decide_step3() },
  ]);

  let timers: ReturnType<typeof setTimeout>[] = [];
  function clearTimers() {
    for (const t of timers) clearTimeout(t);
    timers = [];
  }

  function pick(index: number) {
    clearTimers();
    picked = index;
    stage = 'ask';
  }

  function agree(index: number) {
    clearTimers();
    answer = index;
    stage = 'run';
    step = 0;
    progress = 0;
    busy = true;

    if (prefersReduced()) {
      finish();
      return;
    }

    const bar = { v: 0 };
    animate(bar, {
      v: 100,
      duration: 3200,
      ease: 'inOut(2)',
      onUpdate: () => (progress = bar.v),
    });

    timers.push(setTimeout(() => (step = 1), 1100));
    timers.push(setTimeout(() => (step = 2), 2200));
    timers.push(setTimeout(finish, 3300));
  }

  function finish() {
    stage = 'done';
    progress = 100;
    busy = false;
  }

  function reset() {
    clearTimers();
    stage = 'pick';
    step = 0;
    progress = 0;
    busy = false;
  }

  $effect(() => () => clearTimers());
</script>

<section class="decide section" aria-labelledby="decide-title">
  <div class="container inner">
    <div class="head" use:reveal>
      <span class="eyebrow">{m.decide_eyebrow()}</span>
      <h2 class="title" id="decide-title">{m.decide_title()}</h2>
      <p class="lead">{m.decide_lead()}</p>
    </div>

    <div class="panel hud" use:reveal={{ delay: 80, scale: true }} use:scrub={{ y: 16 }}>
      <!-- The composer strip, kept from the product's own chat surface. -->
      <header class="bar">
        <span class="who">
          <i class="dot" class:live={busy}></i>
          {m.mos_name()}
        </span>
        <span class="state">{busy ? m.mos_state_busy() : m.mos_state_idle()}</span>
      </header>

      <div class="body">
        {#if stage === 'pick'}
          <p class="says">{m.decide_title()}</p>
          <span class="label">{m.decide_pick()}</span>
          <ul class="goals">
            {#each GOALS as g, i (g.text)}
              <li>
                <button type="button" class="goal" onclick={() => pick(i)}>{g.text}</button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="mine">{goal.text}</p>

          {#if stage === 'ask'}
            <p class="says">{goal.ask}</p>
            <div class="options">
              {#each goal.options as opt, i (opt)}
                <button type="button" class="opt" onclick={() => agree(i)}>{opt}</button>
              {/each}
            </div>
          {:else}
            <div class="agreed">
              <span class="label">{m.decide_agreed()}</span>
              <p>{goal.text} — {goal.options[answer]}</p>
            </div>

            <p class="says">{m.decide_hand()}</p>

            <div class="run">
              <div class="runner">
                <Mon tone={goal.tone} size={44} active={stage === 'run'} />
                <span class="kind">
                  <b translate="no">{goal.mon}</b>
                  {m.decide_kind_async()}
                </span>
                <span class="est">{m.decide_running()}</span>
              </div>

              <!-- Who does each step, spelled out. Mos confirms and reports;
                   the Mon is the only thing that runs. -->
              <ol class="steps">
                {#each STEPS as s, i (s.text)}
                  <li
                    class:done={stage === 'done' || step > i}
                    class:now={stage === 'run' && step === i}
                  >
                    <i></i>
                    <b class="by" class:mon={s.by === 'mon'} translate="no"
                      >{s.by === 'mon' ? m.decide_who_mon() : m.decide_who_mos()}</b
                    >
                    {s.text}
                  </li>
                {/each}
              </ol>

              <div class="track"><div class="fill" style="width:{progress}%"></div></div>
            </div>

            {#if stage === 'done'}
              <div class="result">
                <span class="label">{m.decide_result()}</span>
                <p>{goal.result}</p>
                <div class="foot">
                  <span class="spent">{m.decide_cost()}</span>
                  <button type="button" class="again" onclick={reset}>{m.decide_again()}</button>
                </div>
              </div>
            {/if}
          {/if}
        {/if}
      </div>
    </div>

    <p class="note" use:reveal={{ delay: 120 }}>{m.decide_note()}</p>
  </div>
</section>

<style>
  .inner {
    display: grid;
    gap: var(--space-32);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .inner {
      grid-template-columns: minmax(0, 40fr) minmax(0, 60fr);
      column-gap: var(--space-64);
    }
    .note {
      grid-column: 1 / -1;
    }
  }

  .panel {
    overflow: hidden;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-14) var(--space-16);
    border-bottom: 1px solid var(--glass-line-soft);
  }
  .who {
    display: inline-flex;
    align-items: center;
    gap: var(--space-8);
    font-size: 13.5px;
    font-weight: 600;
    color: var(--shell-text);
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--gray3);
    transition: background var(--duration-base) var(--ease-out);
  }
  .dot.live {
    background: var(--summon-green);
    box-shadow: 0 0 10px rgba(33, 237, 179, 0.8);
  }
  .state {
    margin-left: auto;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--shell-meta);
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    padding: var(--space-16);
    min-height: 292px;
  }
  .label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gray3);
  }

  /* Mos speaks left, you speak right — the product's own bubble geometry. */
  .says,
  .mine {
    margin: 0;
    max-width: 30rem;
    padding: 12px 14px;
    font-size: 13.5px;
    line-height: 1.6;
  }
  .says {
    align-self: flex-start;
    border-radius: 18px 18px 18px 6px;
    background: rgba(112, 115, 124, 0.18);
    color: var(--shell-text);
  }
  .mine {
    align-self: flex-end;
    border-radius: 18px 18px 6px 18px;
    background: var(--primary-fill);
    color: var(--static-white);
  }

  .goals {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }
  .goal,
  .opt {
    width: 100%;
    min-height: var(--control-m);
    text-align: left;
    padding: 12px 14px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-xs);
    background: transparent;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--shell-body);
    cursor: pointer;
    transition: var(--transition-base);
  }
  .goal:hover,
  .opt:hover {
    border-color: rgba(49, 220, 220, 0.6);
    background: rgba(31, 206, 206, 0.08);
    color: var(--shell-text);
  }
  .goal:focus-visible,
  .opt:focus-visible,
  .again:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
  }
  .opt {
    width: auto;
    border-radius: var(--radius-full);
    padding: 10px 18px;
  }

  .agreed {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 14px;
    border: 1px solid rgba(49, 220, 220, 0.34);
    border-radius: var(--radius-xs);
    background: rgba(31, 206, 206, 0.08);
  }
  .agreed p {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--shell-text);
  }

  .run {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    padding: 13px 14px;
    border: 1px solid rgba(33, 237, 179, 0.3);
    border-radius: 18px;
    background: rgba(33, 237, 179, 0.06);
  }
  .runner {
    display: flex;
    align-items: center;
    gap: var(--space-10);
  }
  .kind {
    font-size: 12.5px;
    color: var(--shell-body);
  }
  .kind b {
    font-weight: 600;
    color: var(--shell-text);
  }
  .est {
    margin-left: auto;
    font-size: 12px;
    font-weight: 700;
    color: var(--summon-green);
  }

  /* The actor on each step. Mos is quiet; the Mon step is the one that runs, so
     it is the one that gets the accent. */
  .by {
    flex: none;
    padding: 1px 6px;
    border-radius: var(--radius-full);
    border: 1px solid var(--glass-line);
    font-size: 10px;
    font-weight: 700;
    color: var(--shell-meta);
  }
  .by.mon {
    border-color: rgba(33, 237, 179, 0.45);
    color: var(--summon-green);
  }

  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .steps li {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 11.5px;
    color: var(--shell-faint);
    transition: color var(--duration-slow) var(--ease-out);
  }
  .steps li i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(154, 154, 175, 0.5);
    transition: var(--transition-base);
  }
  .steps li.now,
  .steps li.done {
    color: var(--shell-body);
  }
  .steps li.now i {
    background: var(--summon-cyan);
    box-shadow: 0 0 8px rgba(31, 206, 206, 0.9);
  }
  .steps li.done i {
    background: var(--summon-green);
  }

  .track {
    height: 5px;
    border-radius: var(--radius-full);
    background: rgba(112, 115, 124, 0.32);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: var(--radius-full);
    background: linear-gradient(90deg, var(--summon-cyan), var(--summon-green));
  }

  .result {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding-top: var(--space-12);
    border-top: 1px solid var(--glass-line-soft);
  }
  .result p {
    margin: 0;
    font-size: 13px;
    line-height: 1.65;
    color: var(--shell-text);
  }
  .foot {
    display: flex;
    align-items: center;
    gap: var(--space-12);
  }
  .spent {
    font-size: 11.5px;
    color: var(--shell-meta);
  }
  .again {
    margin-left: auto;
    height: var(--control-s);
    padding: 0 14px;
    border-radius: var(--radius-full);
    border: 1px solid var(--glass-line);
    background: transparent;
    font-size: 12px;
    color: var(--shell-body);
    cursor: pointer;
    transition: var(--transition-base);
  }
  .again:hover {
    border-color: rgba(49, 220, 220, 0.6);
    color: var(--shell-text);
  }
</style>
