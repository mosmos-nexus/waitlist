<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { createTimeline, createTimer, onScroll, stagger, utils } from 'animejs';
  import MonBlob from '$lib/components/world/MonBlob.svelte';
  import MosBlob from '$lib/components/world/MosBlob.svelte';
  import type { MonRole } from '$lib/anime/mon';
  import type { MosMood } from '$lib/anime/mos';
  import { m } from '$lib/locale.svelte';
  import { prefersReduced, reveal } from '$lib/anime/motion';

  /**
   * The demo section, rebuilt as a stage you operate.
   *
   * Three sample asks, and each one summons a *different* set of Mon — which is
   * the actual claim of the section. A single canned playthrough can't make
   * that point; letting the visitor pick can.
   *
   * Mos is on the stage now. Without it the section showed Mon appearing on
   * their own and a result arriving from nowhere, so the one thing it was meant
   * to convey — that Mos is the one doing the delegating — had nothing to stand
   * on. The wires carry that: a call travels out from Mos to each Mon, and what
   * each Mon produces travels on to Storage. `mode` decides whether the calls
   * leave together or one after another, which is the difference between a
   * parallel and a sequential delegation and needs no caption to read.
   */

  type Request = {
    ask: string;
    resultTag: string;
    result: string;
    lines: string[];
    mons: MonRole[];
    mode: 'serial' | 'parallel';
  };

  const REQUESTS = $derived<Request[]>([
    {
      ask: m.demo_req1_ask(),
      resultTag: m.demo_req1_tag(),
      result: m.demo_req1_result(),
      lines: [m.demo_req1_l1(), m.demo_req1_l2(), m.demo_req1_l3()],
      mons: ['research', 'organize', 'design'],
      // Gather, then condense, then lay out — each step needs the one before it.
      mode: 'serial',
    },
    {
      ask: m.demo_req2_ask(),
      resultTag: m.demo_req2_tag(),
      result: m.demo_req2_result(),
      lines: [m.demo_req2_l1(), m.demo_req2_l2(), m.demo_req2_l3()],
      mons: ['research', 'organize'],
      // Reading the contract and sorting the clauses are independent.
      mode: 'parallel',
    },
    {
      ask: m.demo_req3_ask(),
      resultTag: m.demo_req3_tag(),
      result: m.demo_req3_result(),
      lines: [m.demo_req3_l1(), m.demo_req3_l2(), m.demo_req3_l3()],
      mons: ['organize', 'design'],
      mode: 'serial',
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

  /** Length of the travelling dash, in user units. */
  const PULSE = 26;

  let picked = $state(0);
  let phase = $state<'idle' | 'running' | 'done'>('idle');
  const active = $derived(REQUESTS[picked]);

  let stageEl = $state<HTMLDivElement | null>(null);
  let flowEl = $state<HTMLDivElement | null>(null);
  let wiresEl = $state<SVGSVGElement | null>(null);
  let mosEl = $state<HTMLDivElement | null>(null);
  let storeEl = $state<HTMLDivElement | null>(null);
  let timeline: ReturnType<typeof createTimeline> | null = null;

  // One body, read three ways across the run. The mood presets carry their own
  // face and resting aspect, so this is the whole state change.
  const mosMood = $derived<MosMood>(
    phase === 'running' ? 'working' : phase === 'done' ? 'happy' : 'idle',
  );

  function q<T extends Element>(sel: string): T[] {
    return stageEl ? Array.from(stageEl.querySelectorAll<T>(sel)) : [];
  }

  /**
   * Draw the wires from measured positions rather than authored coordinates.
   *
   * The row reflows — it wraps on narrow screens and the Mon count changes with
   * the request — so any hand-placed path would be wrong most of the time.
   */
  function layoutWires() {
    if (!flowEl || !wiresEl || !mosEl || !storeEl) return;
    const base = flowEl.getBoundingClientRect();
    if (!base.width) return;
    wiresEl.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
    // Anchor on the facing edges: a wire drawn centre-to-centre would run
    // underneath the bodies it connects.
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        l: r.left - base.left,
        r: r.right - base.left,
        t: r.top - base.top,
        b: r.bottom - base.top,
        cx: r.left - base.left + r.width / 2,
        cy: r.top - base.top + r.height / 2,
      };
    };
    const mos = box(mosEl);
    const store = box(storeEl);
    const slots = q<HTMLElement>('.mon-slot');

    for (const path of q<SVGPathElement>('[data-leg]')) {
      const i = Number(path.dataset.i);
      const slot = slots[i];
      if (!slot) continue;
      const a = box(slot);
      const call = path.dataset.leg === 'call';
      const from = call ? mos : a;
      const to = call ? a : store;

      /**
       * Which pair of edges face each other, decided from the boxes rather than
       * a breakpoint. The row is side by side on a wide screen and stacked on a
       * phone; wiring right-edge-to-left-edge in the stacked case sent every
       * return diagonally across the whole column.
       */
      const vertical = Math.abs(to.cy - from.cy) > Math.abs(to.cx - from.cx);
      const [fx, fy, tx, ty] = vertical
        ? [from.cx, to.cy > from.cy ? from.b : from.t, to.cx, to.cy > from.cy ? to.t : to.b]
        : [to.cx > from.cx ? from.r : from.l, from.cy, to.cx > from.cx ? to.l : to.r, to.cy];
      const bend = vertical ? 0 : (tx - fx) * 0.55;
      const lift = vertical ? (ty - fy) * 0.55 : 0;
      path.setAttribute(
        'd',
        `M${fx},${fy}C${fx + bend},${fy + lift} ${tx - bend},${ty - lift} ${tx},${ty}`,
      );
      if (path.classList.contains('pulse')) {
        const len = path.getTotalLength();
        // One visible dash on an otherwise empty pattern, so animating the
        // offset sends a single pulse down the wire.
        path.style.strokeDasharray = `${PULSE} ${len + PULSE}`;
        path.style.strokeDashoffset = String(PULSE);
        path.dataset.len = String(len);
      }
    }
  }

  /** Put the stage back to its pre-run frame so a replay starts clean. */
  function resetStage() {
    if (!stageEl) return;
    layoutWires();
    utils.set(q('.ask'), { opacity: 0, translateY: 10 });
    utils.set(q('.mos-say'), { opacity: 0, translateY: 8 });
    utils.set(q('.wire'), { opacity: 0 });
    utils.set(q('.art'), { opacity: 0, scale: 0.4 });
    for (const p of q<SVGPathElement>('.pulse')) p.style.strokeDashoffset = String(PULSE);
    utils.set(q('.mon-slot'), { opacity: 0, scale: 0.4, translateX: 0, translateY: 0 });
    utils.set(q('.bar-fill'), { width: '0%' });
    utils.set(q('.mon-task'), { opacity: 0 });
    utils.set(q('.result'), { opacity: 0, translateY: 26, scale: 0.97 });
    utils.set(q('.result-line'), { opacity: 0, translateX: -10 });
    utils.set(q('.done-say'), { opacity: 0, translateY: 8 });
  }

  async function run() {
    if (!stageEl) return;
    // Svelte flushes DOM effects in a microtask, so a run kicked off straight
    // from a chip click would still see the *previous* request's slots — the
    // extra Mon would get no reset and no timeline entry, appearing instantly
    // at full opacity beside two that drop in.
    await tick();
    if (!stageEl) return;
    timeline?.revert();
    resetStage();

    if (prefersReduced()) {
      // No choreography — show the finished state directly.
      utils.set(
        q('.ask, .mos-say, .mon-slot, .mon-task, .result, .result-line, .done-say, .wire, .art'),
        { opacity: 1, translateY: 0, translateX: 0, scale: 1 },
      );
      for (const p of q<SVGPathElement>('.pulse')) p.style.strokeDashoffset = '0';
      utils.set(q('.bar-fill'), { width: '100%' });
      phase = 'done';
      return;
    }

    phase = 'running';
    const slots = q<HTMLElement>('.mon-slot');
    // Parallel calls leave together; serial ones queue behind each other.
    const step = active.mode === 'parallel' ? 0 : 340;

    // Targets come from q(), scoped to this stage. Bare selector strings would
    // resolve against the whole document and could animate another component's
    // node — Confirmation also has a `.mos-say`.
    timeline = createTimeline({ defaults: { ease: 'out(3)' } })
      .add(q('.ask'), { opacity: 1, translateY: 0, duration: 460 }, 0)
      .add(q('.mos-say'), { opacity: 1, translateY: 0, duration: 460 }, 420)
      .add(q('.wire'), { opacity: 1, duration: 520, delay: stagger(90) }, 620);

    // Mos calls, the Mon answers, the Mon hands its work on to Storage.
    slots.forEach((slot, i) => {
      const at = 860 + i * step;
      const call = q<SVGPathElement>(`.pulse[data-leg="call"][data-i="${i}"]`)[0];
      const ret = q<SVGPathElement>(`.pulse[data-leg="ret"][data-i="${i}"]`)[0];
      const callLen = Number(call?.dataset.len ?? 0);
      const retLen = Number(ret?.dataset.len ?? 0);

      if (call) {
        timeline!.add(
          call,
          { strokeDashoffset: [PULSE, -callLen], duration: 640, ease: 'inOut(2)' },
          at,
        );
      }
      timeline!
        .add(
          slot,
          { opacity: 1, scale: [0.4, 1], translateY: [-56, 0], duration: 720, ease: 'out(4)' },
          at + 380,
        )
        .add(slot.querySelectorAll('.mon-task'), { opacity: 1, duration: 320 }, at + 700)
        .add(
          slot.querySelectorAll('.bar-fill'),
          { width: '100%', duration: 1500, ease: 'inOut(2)' },
          at + 760,
        );

      // The artifact leaves for Storage the moment that Mon finishes, which is
      // what makes a parallel run look parallel: two deliveries land at once.
      const handoff = at + 2260;
      if (ret) {
        timeline!.add(
          ret,
          { strokeDashoffset: [PULSE, -retLen], duration: 620, ease: 'inOut(2)' },
          handoff,
        );
      }
      timeline!.add(
        q(`.art[data-i="${i}"]`),
        { opacity: 1, scale: [0.4, 1], duration: 520, ease: 'out(4)' },
        handoff + 420,
      );
    });

    const settle = 860 + (slots.length - 1) * step + 3100;

    timeline!
      .add(q('.result'), { opacity: 1, translateY: 0, scale: 1, duration: 700 }, settle)
      .add(
        q('.result-line'),
        { opacity: 1, translateX: 0, duration: 420, delay: stagger(130) },
        settle + 220,
      )
      .add(
        q('.done-say'),
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
    void run();
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
        onEnter: () => void run(),
      }),
    });
    // Measured geometry has to be re-taken whenever the row reflows.
    const onResize = () => layoutWires();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
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
      <p class="ask">{active.ask}</p>
      <p class="mos-say"><i class="live"></i>{m.demo_chat_ai()}</p>

      <div class="flow" bind:this={flowEl}>
        <!-- Drawn from measured node positions in `layoutWires` -->
        <svg class="wires" bind:this={wiresEl} aria-hidden="true" preserveAspectRatio="none">
          {#each active.mons as role, i (role)}
            <path class="wire" data-leg="call" data-i={i} />
            <path class="wire" data-leg="ret" data-i={i} />
            <path class="pulse call" data-leg="call" data-i={i} />
            <path class="pulse ret" data-leg="ret" data-i={i} />
          {/each}
        </svg>

        <div class="mos-node" bind:this={mosEl}>
          <MosBlob size={132} mood={mosMood} label="Mos" />
        </div>

        <div class="mons" aria-live="polite">
          {#each active.mons as role, i (role)}
            <div class="mon-slot">
              <MonBlob
                {role}
                size={62}
                offset={i * 0.5}
                activity={phase === 'running' ? 'working' : 'idle'}
              />
              <div class="mon-meta">
                <span class="mon-name">{ROLE_LABEL[role]}</span>
                <span class="mon-task">{ROLE_TASK[role]}</span>
                <span class="bar"><span class="bar-fill"></span></span>
              </div>
            </div>
          {/each}
        </div>

        <!-- Where the work lands. `Storage` is the product's own name for it and
             reads the same in every locale, so it needs no message key. -->
        <div class="store-node" bind:this={storeEl}>
          <span class="store-cap">Storage</span>
          <div class="store-grid">
            {#each active.mons as role, i (role)}
              <span class="art" data-i={i} data-role={role}></span>
            {/each}
          </div>
        </div>
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

  /* Mos on the left, the Mon it called in the middle, Storage on the right —
     the same left-to-right reading order as the execution itself. */
  .flow {
    position: relative;
    z-index: 1;
    width: 100%;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-16);
    padding-block: var(--space-8);
  }
  .wires {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }
  .wire {
    fill: none;
    stroke: rgba(120, 190, 236, 0.16);
    stroke-width: 1.4;
    stroke-dasharray: 5 7;
  }
  .pulse {
    fill: none;
    stroke-width: 3;
    stroke-linecap: round;
  }
  /* Outbound is a request, inbound is a result — two colours, one glance. */
  .pulse.call {
    stroke: var(--summon-cyan);
    filter: drop-shadow(0 0 6px rgba(31, 206, 206, 0.8));
  }
  .pulse.ret {
    stroke: var(--summon-green);
    filter: drop-shadow(0 0 6px rgba(33, 237, 179, 0.8));
  }

  .mos-node {
    display: grid;
    place-items: center;
    width: 148px;
  }
  /* The halo rings are sized against the island's backdrop; over a flat panel
     they read as a second body sitting beside Mos. */
  .mos-node :global(.ring) {
    display: none;
  }

  .store-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-8);
    width: 108px;
    padding: var(--space-12) var(--space-10);
    border-radius: var(--radius-m);
    border: 1px solid var(--line-normal-normal);
    background: rgba(20, 23, 27, 0.6);
  }
  .store-cap {
    font-size: var(--font-size-caption-2);
    letter-spacing: 0.04em;
    color: var(--label-assistive);
  }
  .store-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 5px;
    width: 100%;
    /* Three tiles in a two-column grid would jump the panel's height as they
       land, so the tallest state is reserved up front. */
    min-height: 54px;
    align-content: start;
  }
  /* An artifact reads as a small sheet, tinted by the Mon that produced it. */
  .art {
    display: block;
    height: 24px;
    border-radius: 3px;
    border: 1px solid rgba(236, 237, 246, 0.16);
    background: linear-gradient(150deg, rgba(236, 237, 246, 0.2), rgba(236, 237, 246, 0.05));
    box-shadow: inset 0 5px 0 -4px rgba(236, 237, 246, 0.5);
    will-change: transform, opacity;
  }
  .art[data-role='research'] {
    background: linear-gradient(150deg, rgba(139, 130, 247, 0.34), rgba(139, 130, 247, 0.08));
  }
  .art[data-role='organize'] {
    background: linear-gradient(150deg, rgba(33, 237, 179, 0.32), rgba(33, 237, 179, 0.07));
  }
  .art[data-role='design'] {
    background: linear-gradient(150deg, rgba(240, 106, 134, 0.3), rgba(240, 106, 134, 0.07));
  }

  @media (max-width: 760px) {
    /* Stacked: Mos above, Storage below. The wires re-measure, so they follow. */
    .flow {
      grid-template-columns: 1fr;
      justify-items: center;
      gap: var(--space-24);
    }
    .store-node {
      width: 160px;
    }
    .store-grid {
      grid-template-columns: repeat(3, 1fr);
      min-height: 26px;
    }
    .mons {
      width: 100%;
    }
  }

  /* A column, not a row. Fanning out to three stacked slots and back in from
     them is the topology; in a row all six wires collapse onto one line. */
  .mons {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    /* The wires need room to fan out either side, and a row stretched across
       the whole column leaves its bar floating in empty space. */
    width: min(100%, 420px);
    margin-inline: auto;
  }
  .mon-slot {
    display: flex;
    align-items: center;
    gap: var(--space-14);
    padding: var(--space-8) var(--space-16) var(--space-8) var(--space-8);
    border-radius: var(--radius-m);
    border: 1px solid var(--line-normal-alternative);
    background: rgba(20, 23, 27, 0.42);
    will-change: transform, opacity;
  }
  .mon-meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .mon-name {
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    color: var(--label-normal);
  }
  .mon-task {
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
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
  }
</style>
