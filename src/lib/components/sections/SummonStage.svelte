<script lang="ts">
  import { onMount } from 'svelte';
  import { createTimeline, createTimer, onScroll, stagger, utils } from 'animejs';
  import MonBlob from '$lib/components/world/MonBlob.svelte';
  import type { MonRole } from '$lib/anime/mon';
  import { m } from '$lib/paraglide/messages.js';
  import { prefersReduced, reveal } from '$lib/anime/motion';

  /**
   * The demo section, rebuilt as a stage you operate.
   *
   * Three sample asks, and each one summons a *different* set of Mon — which is
   * the actual claim of the section. A single canned playthrough can't make
   * that point; letting the visitor pick can.
   */

  type Request = {
    ask: string;
    resultTag: string;
    result: string;
    lines: string[];
    mons: MonRole[];
  };

  const REQUESTS = $derived<Request[]>([
    {
      ask: m.demo_req1_ask(),
      resultTag: m.demo_req1_tag(),
      result: m.demo_req1_result(),
      lines: [m.demo_req1_l1(), m.demo_req1_l2(), m.demo_req1_l3()],
      mons: ['research', 'organize', 'design'],
    },
    {
      ask: m.demo_req2_ask(),
      resultTag: m.demo_req2_tag(),
      result: m.demo_req2_result(),
      lines: [m.demo_req2_l1(), m.demo_req2_l2(), m.demo_req2_l3()],
      mons: ['research', 'organize'],
    },
    {
      ask: m.demo_req3_ask(),
      resultTag: m.demo_req3_tag(),
      result: m.demo_req3_result(),
      lines: [m.demo_req3_l1(), m.demo_req3_l2(), m.demo_req3_l3()],
      mons: ['organize', 'design'],
    },
  ]);

  const ROLE_LABEL = $derived<Record<MonRole, string>>({
    research: m.mon_research_name(),
    organize: m.mon_organize_name(),
    design: m.mon_design_name(),
  });
  const ROLE_TASK = $derived<Record<MonRole, string>>({
    research: m.demo_mon1_task(),
    organize: m.demo_mon2_task(),
    design: m.demo_mon3_task(),
  });

  let picked = $state(0);
  let phase = $state<'idle' | 'running' | 'done'>('idle');
  const active = $derived(REQUESTS[picked]);

  let stageEl = $state<HTMLDivElement | null>(null);
  let timeline: ReturnType<typeof createTimeline> | null = null;

  function q<T extends Element>(sel: string): T[] {
    return stageEl ? Array.from(stageEl.querySelectorAll<T>(sel)) : [];
  }

  /** Put the stage back to its pre-run frame so a replay starts clean. */
  function resetStage() {
    if (!stageEl) return;
    utils.set(q('.ask'), { opacity: 0, translateY: 10 });
    utils.set(q('.mos-say'), { opacity: 0, translateY: 8 });
    utils.set(q('.mon-slot'), { opacity: 0, scale: 0.4, translateX: 0, translateY: 0 });
    utils.set(q('.bar-fill'), { width: '0%' });
    utils.set(q('.mon-task'), { opacity: 0 });
    utils.set(q('.result'), { opacity: 0, translateY: 26, scale: 0.97 });
    utils.set(q('.result-line'), { opacity: 0, translateX: -10 });
    utils.set(q('.done-say'), { opacity: 0, translateY: 8 });
  }

  function run() {
    if (!stageEl) return;
    timeline?.revert();
    resetStage();

    if (prefersReduced()) {
      // No choreography — show the finished state directly.
      utils.set(q('.ask, .mos-say, .mon-slot, .mon-task, .result, .result-line, .done-say'), {
        opacity: 1,
        translateY: 0,
        translateX: 0,
        scale: 1,
      });
      utils.set(q('.bar-fill'), { width: '100%' });
      phase = 'done';
      return;
    }

    phase = 'running';
    const slots = q<HTMLElement>('.mon-slot');

    timeline = createTimeline({ defaults: { ease: 'out(3)' } })
      .add('.ask', { opacity: 1, translateY: 0, duration: 460 }, 0)
      .add('.mos-say', { opacity: 1, translateY: 0, duration: 460 }, 420);

    // Each Mon drops in from its slot on the orbit ring above the disc.
    slots.forEach((slot, i) => {
      timeline!
        .add(
          slot,
          {
            opacity: 1,
            scale: [0.4, 1],
            translateY: [-56, 0],
            duration: 720,
            ease: 'out(4)',
          },
          860 + i * 240,
        )
        .add(slot.querySelectorAll('.mon-task'), { opacity: 1, duration: 320 }, 1180 + i * 240)
        .add(
          slot.querySelectorAll('.bar-fill'),
          { width: '100%', duration: 1500, ease: 'inOut(2)' },
          1240 + i * 240,
        );
    });

    const settle = 860 + slots.length * 240 + 1600;

    timeline!
      .add('.result', { opacity: 1, translateY: 0, scale: 1, duration: 700 }, settle)
      .add(
        '.result-line',
        { opacity: 1, translateX: 0, duration: 420, delay: stagger(130) },
        settle + 220,
      )
      .add(
        '.done-say',
        {
          opacity: 1,
          translateY: 0,
          duration: 460,
          onComplete: () => {
            phase = 'done';
          },
        },
        settle + 760,
      );
  }

  function pick(index: number) {
    picked = index;
    run();
  }

  onMount(() => {
    resetStage();
    // First playthrough fires when the stage scrolls into view; after that the
    // visitor drives it. The timer animates nothing — it exists to carry the
    // ScrollObserver that calls run().
    const trigger = createTimer({
      duration: 10,
      autoplay: onScroll({
        target: stageEl!,
        enter: 'bottom-=120 top',
        repeat: false,
        onEnter: () => run(),
      }),
    });
    return () => {
      trigger.revert();
      timeline?.revert();
    };
  });
</script>

<section class="section summon">
  <div class="container">
    <div class="head reveal" use:reveal>
      <span class="eyebrow">{m.demo_eyebrow()}</span>
      <h2 class="t-heading-1 title prewrap">{m.demo_title()}</h2>
      <p class="t-body-1-reading sub">{m.demo_sub()}</p>
    </div>

    <div class="picker reveal" use:reveal={{ delay: 80 }}>
      <span class="picker-label">{m.demo_pick()}</span>
      <div class="chips">
        {#each REQUESTS as req, i (req.ask)}
          <button
            type="button"
            class="chip"
            class:on={picked === i}
            aria-pressed={picked === i}
            onclick={() => pick(i)}
          >
            {req.ask}
          </button>
        {/each}
      </div>
    </div>

    <div class="stage glass" bind:this={stageEl}>
      <div class="disc" aria-hidden="true">
        <span class="disc-ring"></span>
        <span class="disc-glow"></span>
      </div>

      <p class="ask">{active.ask}</p>
      <p class="mos-say"><i class="live"></i>{m.demo_chat_ai()}</p>

      <div class="mons" aria-live="polite">
        {#each active.mons as role, i (role)}
          <div class="mon-slot">
            <MonBlob
              {role}
              size={78}
              name={ROLE_LABEL[role]}
              offset={i * 0.5}
              activity={phase === 'running' ? 'working' : 'idle'}
            />
            <span class="mon-task">{ROLE_TASK[role]}</span>
            <span class="bar"><span class="bar-fill"></span></span>
          </div>
        {/each}
      </div>

      <div class="result">
        <span class="result-tag">{active.resultTag}</span>
        <h3 class="t-subtitle-1 result-title">{active.result}</h3>
        <ul>
          {#each active.lines as line (line)}
            <li class="result-line"><i></i>{line}</li>
          {/each}
        </ul>
      </div>

      <p class="done-say">{m.demo_chat_ai2()}</p>

      <button type="button" class="replay" onclick={run} disabled={phase === 'running'}>
        {phase === 'running' ? m.demo_running() : m.demo_replay()}
      </button>
    </div>

    <p class="gloss reveal prewrap" use:reveal={{ delay: 120 }}>{m.demo_mon_gloss()}</p>
  </div>
</section>

<style>
  .summon {
    background:
      radial-gradient(70% 60% at 50% 100%, rgba(31, 206, 206, 0.09), transparent 72%), var(--app-bg);
  }

  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    max-width: 44ch;
  }
  .title {
    color: var(--label-strong);
  }
  .sub {
    color: var(--label-alternative);
  }

  .picker {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    margin-top: var(--space-32);
  }
  .picker-label {
    font-size: var(--font-size-caption-1);
    color: var(--label-assistive);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
  }
  .chip {
    min-height: var(--control-s);
    padding: 0 15px;
    border-radius: var(--radius-full);
    border: 1px solid var(--line-normal-normal);
    background: rgba(20, 23, 27, 0.6);
    color: var(--label-alternative);
    font-size: var(--font-size-body-2);
    text-align: left;
    cursor: pointer;
    transition: var(--transition-base);
  }
  .chip:hover {
    border-color: var(--line-normal-strong);
    color: var(--label-strong);
  }
  .chip.on {
    background: var(--primary-normal);
    border-color: var(--primary-normal);
    color: var(--static-white);
    font-weight: var(--weight-semibold);
  }
  .chip:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  .stage {
    position: relative;
    margin-top: var(--space-20);
    padding: var(--space-32) var(--space-24) var(--space-24);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-16);
    overflow: hidden;
  }

  /* A slice of the island, reused so the demo reads as the same world */
  .disc {
    position: absolute;
    left: 50%;
    top: 118px;
    translate: -50% 0;
    width: min(620px, 88%);
    height: 190px;
    pointer-events: none;
  }
  .disc-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px dashed rgba(49, 220, 220, 0.16);
  }
  .disc-glow {
    position: absolute;
    inset: 12% 8%;
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      rgba(31, 206, 206, 0.14),
      rgba(15, 111, 218, 0.08) 56%,
      transparent
    );
  }

  .ask {
    align-self: flex-end;
    max-width: 32ch;
    padding: 11px 16px;
    border-radius: var(--radius-m) var(--radius-m) 6px var(--radius-m);
    background: var(--primary-normal);
    color: var(--static-white);
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    box-shadow: 0 6px 18px rgba(15, 111, 218, 0.34);
  }

  .mos-say,
  .done-say {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: var(--space-8);
    max-width: 40ch;
    padding: 10px 15px;
    border-radius: var(--radius-m) var(--radius-m) var(--radius-m) 6px;
    background: rgba(35, 41, 47, 0.86);
    border: 1px solid var(--line-normal-normal);
    color: var(--label-normal);
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
  }
  .live {
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--summon-cyan);
    box-shadow: 0 0 8px var(--summon-cyan);
  }

  .mons {
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-24) var(--space-32);
    padding-block: var(--space-12);
  }
  .mon-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-8);
    width: 132px;
    will-change: transform, opacity;
  }
  .mon-task {
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
    text-align: center;
  }
  .bar {
    width: 100%;
    height: 3px;
    border-radius: var(--radius-full);
    background: var(--fill-normal);
    overflow: hidden;
  }
  .bar-fill {
    display: block;
    width: 0;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--primary-normal), var(--summon-cyan));
  }

  .result {
    width: 100%;
    max-width: 460px;
    padding: var(--space-20);
    border-radius: var(--radius-m);
    border: 1px solid rgba(49, 220, 220, 0.26);
    background: linear-gradient(150deg, rgba(20, 23, 27, 0.92), rgba(12, 16, 32, 0.94));
    will-change: transform, opacity;
  }
  .result-tag {
    display: inline-block;
    margin-bottom: var(--space-8);
    padding: 3px 10px;
    border-radius: var(--radius-full);
    background: rgba(31, 206, 206, 0.14);
    color: var(--bright-cyan);
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
  }
  .result-title {
    color: var(--label-strong);
  }
  .result ul {
    margin-top: var(--space-12);
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }
  .result li {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    font-size: var(--font-size-body-2);
    color: var(--label-alternative);
  }
  .result li i {
    flex: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(33, 237, 179, 0.16);
    border: 1px solid rgba(33, 237, 179, 0.5);
  }

  .replay {
    margin-top: var(--space-4);
    min-height: var(--control-s);
    padding: 0 18px;
    border-radius: var(--radius-full);
    border: 1px solid var(--line-normal-normal);
    background: transparent;
    color: var(--label-alternative);
    font-size: var(--font-size-caption-1);
    cursor: pointer;
    transition: var(--transition-base);
  }
  .replay:hover:not(:disabled) {
    border-color: var(--line-normal-strong);
    color: var(--label-strong);
  }
  .replay:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .gloss {
    margin-top: var(--space-20);
    max-width: 60ch;
    font-size: var(--font-size-caption-1);
    line-height: var(--line-height-body-reading);
    color: var(--label-assistive);
  }

  @media (max-width: 640px) {
    .stage {
      padding: var(--space-24) var(--space-16) var(--space-20);
    }
    .ask,
    .mos-say,
    .done-say {
      max-width: 100%;
    }
    .mons {
      gap: var(--space-20);
    }
    .mon-slot {
      width: 108px;
    }
    .disc {
      top: 140px;
      height: 150px;
    }
  }
</style>
