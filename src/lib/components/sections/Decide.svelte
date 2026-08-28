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

  /**
   * Chat is a browser extension, and the section now says so by drawing one.
   *
   * The panel used to float on the page with no frame, which read as a website
   * widget — the opposite of the claim. It sits inside a browser now: a chrome
   * bar with a URL and the extension icon lit, a page behind it, and the panel
   * attached to the browser rather than planted in the page.
   *
   * One shell, not three. Which shape the panel opens in is a detail; what a
   * visitor needs from this section is the split between the two modes, so the
   * shell switcher is gone and the modes are the control. Buddy talks and calls
   * no Mon. Manager takes a goal, finds a Mon on the Hub and sets it going —
   * and still never executes anything itself.
   */
  type Mode = 'buddy' | 'manager';
  let mode = $state<Mode>('manager');

  /* One reply per opener. A single fixed answer meant asking about an article
     was met with a line about procrastination — the demo contradicted itself in
     the one place it is supposed to feel like a conversation. */
  const BUDDY = $derived([
    { q: m.decide_b1(), a: m.decide_b1_a() },
    { q: m.decide_b2(), a: m.decide_b2_a() },
    { q: m.decide_b3(), a: m.decide_b3_a() },
  ]);
  let said = $state(-1);

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

    <div class="browser hud" use:reveal={{ delay: 80, scale: true }} use:scrub={{ y: 14 }}>
      <!-- Browser chrome. The lit extension icon is the whole point: this is
           attached to the browser, not built into the page. -->
      <div class="chrome">
        <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="url" translate="no">news.example.com/article/2026-08-market</span>
        <span class="ext lit" aria-hidden="true">m</span>
      </div>

      <div class="viewport">
        <div class="page" aria-hidden="true">
          <span class="sk w40 h14"></span>
          <span class="sk w70 h28"></span>
          <span class="sk w50 h28"></span>
          {#each [1, 2, 3, 4, 5, 6] as i (i)}<span class="sk w92 h9"></span>{/each}
        </div>

        <div class="panel">
          <div class="ext-bar">
            <span class="ext-a">{m.decide_close()}</span>
          </div>

          <header class="bar">
            <span class="who">
              <i class="dot" class:live={busy}></i>
              {m.mos_name()}
            </span>
            <span class="state">{busy ? m.mos_state_busy() : m.mos_state_idle()}</span>
          </header>

          <div class="modes" role="group" aria-label={m.decide_mode()}>
            {#each [{ k: 'buddy' as Mode, l: m.decide_buddy() }, { k: 'manager' as Mode, l: m.decide_manager() }] as md (md.k)}
              <button
                type="button"
                class="mode"
                class:on={mode === md.k}
                aria-pressed={mode === md.k}
                onclick={() => {
                  mode = md.k;
                  reset();
                  said = -1;
                }}>{md.l}</button
              >
            {/each}
            <!-- Both, not just the active one. With only the active mode
                   described, Buddy went unexplained for the whole page. -->
            <span class="sub"><b class="who-m">{m.decide_buddy()}</b> {m.decide_buddy_sub()}</span>
            <span class="sub"
              ><b class="who-m">{m.decide_manager()}</b> {m.decide_manager_sub()}</span
            >
          </div>

          <div class="chips">
            <span class="chip">{m.decide_ctx2()}</span>
          </div>

          <div class="body">
            {#if mode === 'buddy'}
              <p class="says">{m.decide_buddy_intro()}</p>
              {#if said < 0}
                <span class="label">{m.decide_buddy_label()}</span>
                <ul class="goals">
                  {#each BUDDY as b, i (b.q)}
                    <li>
                      <button type="button" class="goal" onclick={() => (said = i)}>{b.q}</button>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="mine">{BUDDY[said].q}</p>
                <p class="says">{BUDDY[said].a}</p>
                <div class="foot">
                  <!-- Buddy has no goal to swap, so it does not offer to. -->
                  <button type="button" class="again" onclick={() => (said = -1)}
                    >{m.decide_b_again()}</button
                  >
                </div>
              {/if}
            {:else if stage === 'pick'}
              <p class="says">{m.decide_manager_intro()}</p>
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
                    <Mon tone={goal.tone} size={38} active={stage === 'run'} />
                    <span class="kind">
                      <b translate="no">{goal.mon}</b>
                      {m.decide_kind_async()}
                    </span>
                    <span class="est">{m.decide_running()}</span>
                  </div>

                  <ol class="steps">
                    {#each STEPS as st, i (st.text)}
                      <li
                        class:done={stage === 'done' || step > i}
                        class:now={stage === 'run' && step === i}
                      >
                        <i></i>
                        <b class="by" class:mon={st.by === 'mon'} translate="no"
                          >{st.by === 'mon' ? m.decide_who_mon() : m.decide_who_mos()}</b
                        >
                        {st.text}
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
                      <button type="button" class="again" onclick={reset}>{m.decide_again()}</button
                      >
                    </div>
                  </div>
                {/if}
              {/if}
            {/if}
          </div>

          <div class="composer">
            <span class="ph">{m.decide_placeholder()}</span>
            <span class="send" aria-hidden="true">↑</span>
          </div>
        </div>
      </div>
    </div>

    <p class="note" use:reveal={{ delay: 130 }}>{m.decide_note()}</p>
  </div>
</section>

<style>
  .mode:focus-visible,

  /* ---- the browser ---- */
  .browser {
    overflow: hidden;
    padding: 0;
  }
  .chrome {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    height: 38px;
    padding: 0 var(--space-12);
    border-bottom: 1px solid var(--glass-line-soft);
    background: rgba(112, 115, 124, 0.16);
  }
  .dots {
    display: flex;
    gap: 5px;
  }
  .dots i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(174, 184, 194, 0.45);
  }
  .url {
    flex: 1;
    min-width: 0;
    max-width: 380px;
    overflow: hidden;
    padding: 4px 11px;
    border-radius: var(--radius-full);
    background: rgba(8, 10, 16, 0.66);
    font-size: 10.5px;
    color: var(--shell-meta);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* The extension icon, lit while the panel is open. This is the one mark that
     says the panel belongs to the browser and not to the site. */
  .ext {
    margin-left: auto;
    flex: none;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 7px;
    border: 1.5px solid var(--glass-line);
    font-size: 11px;
    font-weight: 700;
    color: var(--shell-meta);
  }
  .ext.lit {
    border-color: var(--bright-cyan);
    background: rgba(31, 206, 206, 0.16);
    color: var(--bright-cyan);
  }

  /* Tall enough that the widget holds its idle content without scrolling.
     The product widget is 600px; at a 430px frame it was 398px and always
     scrolled, which reads as a clipped panel rather than a floating one. */
  .viewport {
    position: relative;
    display: flex;
    min-height: 580px;
  }
  .page {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 11px;
    padding: var(--space-24);
    overflow: hidden;
  }
  .sk {
    display: block;
    border-radius: 4px;
    background: rgba(174, 184, 194, 0.13);
  }
  .w40 {
    width: 40%;
  }
  .w70 {
    width: 70%;
  }
  .w50 {
    width: 50%;
  }
  .w92 {
    width: 92%;
  }
  .h14 {
    height: 14px;
  }
  .h28 {
    height: 26px;
  }
  .h9 {
    height: 9px;
  }

  /* Sidebar: in flow, so it pushes the page rather than covering it — that is
     the difference between an extension panel and a site overlay. */
  .panel {
    flex: none;
    width: 340px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-left: 1px solid var(--glass-line);
    background: rgba(10, 12, 18, 0.96);
  }
  @media (max-width: 719px) {
    .page {
      display: none;
    }
    .panel {
      position: static;
      width: auto;
      flex: 1;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }
  }
  .ext-bar {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    padding: 6px var(--space-12);
    border-bottom: 1px solid var(--glass-line-soft);
    background: rgba(31, 206, 206, 0.1);
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .ext-a {
    color: var(--shell-faint);
  }
  /* 18px drawn, 44px hit: -14px each side. The extension bar cannot be 44px
     tall and still read as browser chrome, but the close target has to be. */

  .modes {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    padding: var(--space-10) var(--space-14) 0;
  }
  /* Same trick for the mode pills: 28px drawn inside the panel, 44px hit. */
  .mode {
    position: relative;
    height: 28px;
    padding: 0 12px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-full);
    background: transparent;
    font-size: 11px;
    color: var(--shell-body);
    cursor: pointer;
  }
  .mode::after {
    content: '';
    position: absolute;
    inset: 50% 0 auto 0;
    height: var(--control-m);
    transform: translateY(-50%);
  }
  .mode.on {
    border-color: transparent;
    background: var(--primary-fill);
    color: var(--static-white);
    font-weight: 600;
  }
  .modes .sub {
    flex: 1 1 100%;
    font-size: 10.5px;
    line-height: 1.45;
    color: var(--shell-faint);
  }
  .modes .who-m {
    font-weight: 700;
    color: var(--shell-meta);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: var(--space-8) var(--space-14) 0;
  }
  .chip {
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: rgba(112, 115, 124, 0.2);
    font-size: 9.5px;
    color: var(--shell-meta);
  }

  .composer {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    margin: var(--space-10) var(--space-14) 0;
    padding: 9px 12px;
    border: 1px solid var(--glass-line);
    border-radius: var(--radius-s);
    background: var(--field);
  }
  .ph {
    flex: 1;
    font-size: 11.5px;
    color: var(--shell-meta);
  }
  .send {
    flex: none;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(49, 220, 220, 0.2);
    font-size: 10px;
    color: var(--bright-cyan);
  }

  /* Collapsed. The badge is the reason this state matters: work keeps running
     with the panel shut. */

  .inner {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
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

  /* The widget has a fixed height, so the conversation is what gives — it
     scrolls rather than being clipped by the browser frame. Measured 118px of
     the suggestion list cut off at every width above 720px. `min-height: 0` is
     what lets a flex child shrink below its content at all. */
  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    padding: var(--space-16);
  }
  .panel:not(.widget) .body {
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
