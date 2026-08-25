<script lang="ts">
  import { onMount } from 'svelte';
  import { utils } from 'animejs';
  import BlobIsle from '$lib/components/world/BlobIsle.svelte';
  import MosBlob from '$lib/components/world/MosBlob.svelte';
  import MonBlob from '$lib/components/world/MonBlob.svelte';
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import type { MonRole } from '$lib/anime/mon';
  import type { MosMood } from '$lib/anime/mos';
  import { m } from '$lib/locale.svelte';
  import { prefersReduced } from '$lib/anime/motion';
  import { ease, hold, lerp, seg, trackProgress } from '$lib/anime/journey';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
  }
  let { onSuccess }: Props = $props();

  /**
   * One scene, scrubbed by scroll.
   *
   * Everything the visitor sees lives on a single pinned stage and every
   * position is a function of one progress value. That is the point: the old
   * page was five sections that each drew their own panel, placed their own
   * characters by hand and fired their own trigger, which is why parts of it
   * sat crooked and why no two parts looked alike.
   *
   * Without JS — or with reduced motion — the acts render as a plain stacked
   * document and the stage does not pin. The pinning is enhancement, not the
   * only way in.
   */

  /**
   * Act boundaries in journey progress, and the window each act's copy holds.
   *
   * The two are separate on purpose. World beats butt up against each other so
   * the scene never stalls; copy windows leave a gap between them, because
   * adjacent windows that share an edge put two headlines on screen at half
   * strength through the whole handover — which is what made the middle of every
   * transition look broken.
   */
  const ACTS = {
    arrival: [-0.08, 0.26] as const,
    burden: [0.26, 0.55] as const,
    delegate: [0.55, 1.0] as const,
  };
  /**
   * Copy windows meet edge to edge, and the fade is short.
   *
   * Both acts occupy the same part of the screen, so a true crossfade puts two
   * headlines on top of each other — that is what made every handover look
   * broken. A hand-off instead: one is gone before the next arrives. The cost is
   * a brief beat on the world alone, and the fade is kept short so the beat is
   * about a tenth of a viewport rather than a blank screen.
   */
  const COPY = {
    arrival: [-0.08, 0.25] as const,
    burden: [0.25, 0.53] as const,
    delegate: [0.53, 1.04] as const,
  };
  const COPY_FADE = 0.02;

  const TASKS = [
    m.drift_task_1,
    m.drift_task_2,
    m.drift_task_3,
    m.drift_task_4,
    m.drift_task_5,
    m.drift_task_6,
  ];

  /**
   * The two ways Mos delegates.
   *
   * `parallel` fans out and both answers land together. `serial` chains: the
   * first Mon's output is the second one's input, so the artifact travels
   * sideways between them instead of straight to Storage. Showing only the fan
   * made every delegation look asynchronous, which is half the model.
   */
  type Lane = 'parallel' | 'serial';
  /**
   * `from` is who calls this Mon: Mos, or the Mon before it. Deriving it from
   * the lane marked the *first* serial Mon as a handoff too, and drew its wire
   * from whichever Mon happened to precede it in the list.
   */
  const CREW: {
    role: MonRole;
    lane: Lane;
    from: 'mos' | 'prev';
    task: () => string;
    at: number;
  }[] = [
    { role: 'research', lane: 'parallel', from: 'mos', task: m.demo_mon1_task, at: 0.0 },
    { role: 'organize', lane: 'parallel', from: 'mos', task: m.demo_mon2_task, at: 0.0 },
    { role: 'design', lane: 'serial', from: 'mos', task: m.demo_mon3_task, at: 0.18 },
    { role: 'organize', lane: 'serial', from: 'prev', task: m.demo_mon2_task, at: 0.36 },
  ];

  /**
   * The delegation beats, as fractions of the act's own span.
   *
   * All of them, including the flight to Storage — mixing a scaled `at` with an
   * unscaled offset is what shipped the last artifact after Storage had already
   * faded out, so nothing ever showed four.
   */
  const BEAT = { call: -0.06, arrive: 0.18, work: 0.42, ship: 0.42, shipEnd: 0.58 };

  let trackEl = $state<HTMLElement | null>(null);
  let stageEl = $state<HTMLElement | null>(null);
  let worldEl = $state<HTMLElement | null>(null);
  let wellEl = $state<HTMLElement | null>(null);
  let wiresEl = $state<SVGSVGElement | null>(null);
  let isle = $state<ReturnType<typeof BlobIsle> | null>(null);
  let pinned = $state(false);

  /** Props the world reads. Assigned only when the value actually changes, so a
   *  scroll frame does not push Svelte updates it has no use for. */
  let mosMood = $state<MosMood>('resting');
  let crewBusy = $state(false);

  // Poking Mos is the one thing on the stage the visitor drives directly rather
  // than by scrolling, so it keeps its reply.
  const POKE = $derived([m.mos_poke_1(), m.mos_poke_2(), m.mos_poke_3(), m.mos_poke_4()]);
  let pokeIndex = $state(-1);
  let pokeReset: ReturnType<typeof setTimeout> | undefined;
  const mosLine = $derived(pokeIndex < 0 ? m.mos_line_idle() : POKE[pokeIndex]);

  function onPoke() {
    pokeIndex = (pokeIndex + 1) % POKE.length;
    clearTimeout(pokeReset);
    pokeReset = setTimeout(() => {
      pokeIndex = -1;
    }, 6000);
  }

  /**
   * Everything the journey drives, from inside the world box.
   *
   * The markers have to be unique across every component on the stage. `q` walks
   * the whole subtree, so a name that also means something inside MosBlob or
   * SurfaceCard silently hands those elements a second transform on top of the
   * one their own component is writing — which is the animejs override trap by
   * another route. `data-orbit` and `data-surface` were both already taken.
   */
  const q = <T extends Element>(sel: string): T[] =>
    worldEl ? Array.from(worldEl.querySelectorAll<T>(sel)) : [];
  /** The act copy sits beside the world box, not inside it. */
  const qStage = <T extends Element>(sel: string): T[] =>
    stageEl ? Array.from(stageEl.querySelectorAll<T>(sel)) : [];

  /**
   * Where each artifact starts, relative to where it ends.
   *
   * Measured, never authored: the tile rests in the well and is pushed back out
   * to its Mon by this offset, so the flight lands exactly on both ends at any
   * viewport. Authored offsets are what put things half a card out of place
   * before.
   */
  let flights: { dx: number; dy: number }[] = [];

  /**
   * Measured stage geometry, in world coordinates.
   *
   * Wires are redrawn from this every frame rather than measured once: Mos
   * slides a long way across the delegation act, and a path fixed at mount time
   * started from where Mos stood during the opening instead.
   */
  let geo: {
    mos: { cx: number; cy: number };
    slots: { cx: number; cy: number; l: number; r: number }[];
  } | null = null;

  /**
   * Every authored distance in `apply` is in the units of a 1180px-wide stage
   * and multiplied by this. Without it the task ring and the surface orbit keep
   * their desktop radius on a phone and run off both edges.
   */
  let k = 1;

  function measure() {
    if (!worldEl || !wellEl || !wiresEl) return;
    const base = worldEl.getBoundingClientRect();
    wiresEl.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
    k = Math.max(0.46, Math.min(1, base.width / 1180));

    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        cx: r.left - base.left + r.width / 2,
        cy: r.top - base.top + r.height / 2,
        l: r.left - base.left,
        r: r.right - base.left,
      };
    };
    const slots = q<HTMLElement>('[data-crew]');
    const well = box(wellEl);
    const mos = box(q('[data-drive="mos"]')[0] ?? wellEl);

    flights = slots.map((slot) => {
      const b = box(slot);
      return { dx: b.cx - well.cx, dy: b.cy - well.cy };
    });
    const tiles = q<HTMLElement>('[data-artifact]');
    tiles.forEach((tile, i) => {
      const f = flights[i];
      if (f) tile.dataset.from = `${Math.round(f.dx)},${Math.round(f.dy)}`;
    });

    geo = {
      mos: { cx: mos.cx, cy: mos.cy },
      slots: slots.map((slot) => {
        const b = box(slot);
        return { cx: b.cx, cy: b.cy, l: b.l, r: b.r };
      }),
    };
  }

  /**
   * Wires: a call from Mos to each Mon it summons, plus the handoff from one Mon
   * to the next in the serial chain. `dx` is how far Mos has slid this frame.
   */
  function drawWires(dx: number) {
    if (!geo) return;
    for (const path of q<SVGPathElement>('[data-wire]')) {
      const i = Number(path.dataset.i);
      const a = geo.slots[i];
      if (!a) continue;
      const prev = geo.slots[i - 1];
      const fromPrev = path.dataset.wire === 'prev' && prev;
      const [fx, fy] = fromPrev ? [prev.r, prev.cy] : [geo.mos.cx + dx, geo.mos.cy];
      const [tx, ty] = fromPrev ? [a.l, a.cy] : [a.cx, a.cy];
      const bend = (tx - fx) * 0.5;
      path.setAttribute('d', `M${fx},${fy}C${fx + bend},${fy} ${tx - bend},${ty} ${tx},${ty}`);
      // An over-estimate of the arc length. Only the "draws itself on" effect
      // depends on it, and too long merely starts the dash further off the end —
      // whereas `getTotalLength()` every frame buys nothing for the cost.
      const len = Math.hypot(tx - fx, ty - fy) * 1.4 + 48;
      path.style.strokeDasharray = `${len} ${len}`;
      path.dataset.len = String(len);
    }
  }

  /** The whole scene, as a function of progress. */
  function apply(p: number) {
    if (!worldEl) return;

    // --- the island rises and settles back as the story moves off it ---
    const rise = ease(seg(p, 0, 1));
    // Scaled with everything else: an unscaled +90 start pushed the island down
    // into the copy band on a phone, where the band is below it rather than
    // beside it.
    const isleY = lerp(40, -104, rise) * k;
    const isleS = lerp(1.04, 0.82, rise);
    utils.set(q('[data-drive="isle"]'), { y: isleY, scale: isleS });
    isle?.setWarmth(ease(seg(p, 0.02, 0.3)));

    // --- Mos: parked on the crown, sliding aside to conduct ---
    //
    // Mos sits inside the island's own box, anchored to the pool it rests in, so
    // the island's rise and scale carry it automatically. Only the sideways
    // drift is driven here — the previous version positioned Mos in world space
    // against a hand-computed island offset, and the two came apart.
    const toStage = ease(seg(p, ACTS.burden[0], ACTS.delegate[0] + 0.06));
    const mosX = lerp(70, -212, toStage) * k;
    const mosScale = lerp(1, 0.84, toStage);
    utils.set(q('[data-drive="mos"]'), { x: mosX, scale: mosScale });
    utils.set(q('[data-drive="tasks"]'), { x: mosX });
    drawWires(mosX);
    // The speech line rides along but keeps its own type size, so it stays
    // legible at every point in the journey.
    utils.set(q('[data-drive="say"]'), {
      x: mosX * isleS,
      y: isleY + 104 * k,
      opacity: hold(p, COPY.arrival[0], ACTS.burden[0], 0.04),
    });

    const mood: MosMood =
      p < 0.05 ? 'resting' : p < ACTS.burden[0] ? 'idle' : p < 0.94 ? 'working' : 'happy';
    if (mood !== mosMood) mosMood = mood;

    // --- the burden: task words ring Mos, then are taken one at a time ---
    const ringIn = ease(seg(p, ACTS.burden[0], ACTS.burden[0] + 0.06));
    const burdenLen = ACTS.burden[1] - ACTS.burden[0];
    // Taken one at a time across the act's back half, so scrolling *is* the
    // hand-over. There is no timer: reverse the scroll and they come back.
    const takeFirst = ACTS.burden[0] + burdenLen * 0.36;
    const takeStep = (burdenLen * 0.5) / TASKS.length;
    q<HTMLElement>('[data-task]').forEach((el, i) => {
      const n = TASKS.length;
      const from = takeFirst + i * takeStep;
      const taken = ease(seg(p, from, from + 0.035));
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const radius = lerp(64, 250, ringIn) * k * (1 - taken * 0.8);
      utils.set(el, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.44,
        // Faded well before it reaches the body, or the label crosses the face
        // on its way in.
        opacity: ringIn * Math.max(0, 1 - taken * 2.6),
        scale: lerp(0.7, 1, ringIn) * lerp(1, 0.55, taken),
      });
    });

    // --- delegation: the crew emerges, works, and hands work on ---
    const busy = p > ACTS.delegate[0] && p < 0.97;
    if (busy !== crewBusy) crewBusy = busy;

    const span = ACTS.delegate[1] - ACTS.delegate[0];
    q<HTMLElement>('[data-crew]').forEach((el, i) => {
      const spec = CREW[i];
      const start = ACTS.delegate[0] + spec.at * span;
      const inT = ease(seg(p, start, start + BEAT.arrive * span));
      const work = ease(seg(p, start + BEAT.arrive * span, start + BEAT.work * span));
      const out = 0;
      utils.set(el, {
        opacity: inT * (1 - out),
        y: lerp(46, 0, inT) + out * -30,
        scale: lerp(0.72, 1, inT),
      });
      const bar = el.querySelector<HTMLElement>('[data-bar]');
      if (bar) utils.set(bar, { width: `${work * 100}%` });
    });

    // --- wires draw as the call travels ---
    for (const path of q<SVGPathElement>('[data-wire]')) {
      const i = Number(path.dataset.i);
      const spec = CREW[i];
      if (!spec) continue;
      const start = ACTS.delegate[0] + spec.at * span;
      const t = ease(seg(p, start + BEAT.call * span, start + BEAT.arrive * span));
      const len = Number(path.dataset.len ?? 1);
      path.style.strokeDashoffset = String(len * (1 - t));
      path.style.opacity = String(t);
    }

    // --- artifacts fly home to Storage ---
    q<HTMLElement>('[data-artifact]').forEach((tile, i) => {
      const spec = CREW[i];
      if (!spec) return;
      const start = ACTS.delegate[0] + spec.at * span;
      const t = ease(seg(p, start + BEAT.ship * span, start + BEAT.shipEnd * span));
      const [dx, dy] = (tile.dataset.from ?? '0,0').split(',').map(Number);
      utils.set(tile, {
        x: dx * (1 - t),
        y: dy * (1 - t),
        opacity: t,
        scale: lerp(0.5, 1, t),
      });
    });
    const yieldIn = ease(seg(p, ACTS.delegate[1] - 0.07, ACTS.delegate[1] - 0.01));
    utils.set(q('[data-drive="yield"]'), {
      opacity: yieldIn,
      y: lerp(22, 0, yieldIn),
      scale: lerp(0.94, 1, yieldIn),
    });

    const wellIn = ease(seg(p, ACTS.delegate[0] + 0.04, ACTS.delegate[0] + 0.12));
    utils.set(q('[data-drive="well"]'), { opacity: wellIn, y: lerp(30, 0, wellIn) });

    // --- act copy ---
    for (const el of qStage<HTMLElement>('[data-act]')) {
      const [from, to] = COPY[el.dataset.act as keyof typeof COPY];
      const v = hold(p, from, to, COPY_FADE);
      utils.set(el, { opacity: v, y: lerp(26, 0, v) });
      // The act's own box spans the stage, so it must never take pointers
      // itself — it covered Mos and swallowed every poke. Only the form of an
      // act that is actually up becomes clickable, and that is set here rather
      // than in CSS: a `[data-live]` attribute written at runtime is invisible
      // to Svelte's selector analysis, which prunes the rule as unused.
      const slot = el.querySelector<HTMLElement>('.form-slot');
      if (slot) slot.style.pointerEvents = v > 0.6 ? 'auto' : 'none';
      el.setAttribute('aria-hidden', v > 0.15 ? 'false' : 'true');
    }
  }

  onMount(() => {
    if (!trackEl || !worldEl) return;
    // Reduced motion keeps the stacked document: a scrubbed scene is the exact
    // thing that setting asks not to happen.
    if (prefersReduced()) return;
    pinned = true;

    let stop = () => {};
    // Measure after the pinned layout exists, or every box is the stacked one.
    const start = requestAnimationFrame(() => {
      measure();
      stop = trackProgress(trackEl!, apply);
    });
    const onResize = () => {
      measure();
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(start);
      stop();
      window.removeEventListener('resize', onResize);
    };
  });
</script>

<section class="journey" bind:this={trackEl} data-pinned={pinned ? '1' : null}>
  <div class="stage" bind:this={stageEl}>
    <div class="world" bind:this={worldEl}>
      <div class="isle-drive" data-drive="isle">
        <BlobIsle bind:this={isle} label={m.world_island_label()} />
        <!-- Anchored to the pool in the island's own viewBox (600,258 of
             1200×640), so it can never float off the surface. -->
        <div class="mos-drive" data-drive="mos">
          <MosBlob size={208} mood={mosMood} onpoke={onPoke} label="Mos" />
        </div>
        <!-- The ring of things being handed over belongs to Mos, not to the
             stage: anchored alongside it so it travels with it. -->
        <div class="tasks" data-drive="tasks">
          {#each TASKS as task, i (i)}
            <span class="task" data-task>{task()}</span>
          {/each}
        </div>
      </div>

      <svg class="wires" bind:this={wiresEl} aria-hidden="true" preserveAspectRatio="none">
        {#each CREW as spec, i (i)}
          <path
            class="wire"
            class:handoff={spec.from === 'prev'}
            data-wire={spec.from}
            data-i={i}
          />
        {/each}
      </svg>

      <!-- Storage: where the work lands. Same name the product uses. -->
      <div class="well" data-drive="well" bind:this={wellEl}>
        <span class="well-cap">Storage</span>
        <div class="well-grid">
          {#each CREW as spec, i (i)}
            <span class="artifact" data-artifact data-role={spec.role}></span>
          {/each}
        </div>
      </div>

      <div class="crew">
        {#each CREW as spec, i (i)}
          <div
            class="crew-slot"
            data-crew
            data-lane={spec.lane}
            data-chain={spec.from === 'prev' ? '1' : null}
          >
            <MonBlob
              role={spec.role}
              size={58}
              offset={i * 0.4}
              activity={crewBusy ? 'working' : 'idle'}
            />
            <div class="crew-meta">
              <span class="crew-name">
                {spec.role === 'research'
                  ? m.mon_research_name()
                  : spec.role === 'organize'
                    ? m.mon_organize_name()
                    : m.mon_design_name()}
              </span>
              <span class="crew-task">{spec.task()}</span>
              <span class="crew-bar"><i data-bar></i></span>
            </div>
          </div>
        {/each}
      </div>

      <p class="say" data-drive="say" aria-live="polite">
        <span class="say-tag"><i class="live"></i>Mos</span>
        <span class="say-line prewrap">{mosLine}</span>
      </p>

      <!-- What the delegation produced. The artifacts show that work landed;
           this names it. -->
      <div class="yield" data-drive="yield">
        <span class="yield-tag">{m.demo_req1_tag()}</span>
        <span class="yield-title">{m.demo_req1_result()}</span>
      </div>
    </div>

    <div class="acts">
      <div class="act arrival" data-act="arrival">
        <div class="col">
          <span class="eyebrow">{m.hero_eyebrow()}</span>
          <h1 class="t-display-2 head prewrap">{m.hero_tagline()}</h1>
          <p class="t-subtitle-1 lead prewrap">{m.hero_sub()}</p>
          <div class="form-slot"><WaitlistForm {onSuccess} /></div>
          <p class="fine"><i class="dot"></i>{m.hero_trust()}</p>
        </div>
      </div>

      <div class="act burden" data-act="burden">
        <div class="col">
          <span class="eyebrow">{m.empathy_eyebrow()}</span>
          <h2 class="t-display-3 head prewrap">{m.empathy_loss()}</h2>
          <p class="t-subtitle-1 lead prewrap">{m.empathy_gain()}</p>
        </div>
      </div>

      <div class="act delegate" data-act="delegate">
        <div class="col">
          <span class="eyebrow">{m.demo_eyebrow()}</span>
          <h2 class="t-display-3 head prewrap">{m.demo_title()}</h2>
          <p class="ask">{m.demo_req1_ask()}</p>
          <p class="t-body-1-reading lead">{m.demo_chat_ai2()}</p>
        </div>
      </div>
    </div>

    <span class="cue">{m.hero_scroll()}</span>
  </div>
</section>

<style>
  /* Stacked by default: no JS, or reduced motion, still reads as a document. */
  .journey {
    position: relative;
    background:
      radial-gradient(120% 70% at 50% 0%, rgba(31, 206, 206, 0.09), transparent 66%),
      var(--sky-deep);
  }
  .journey[data-pinned] {
    /* Three acts plus one viewport of pin. */
    height: 460svh;
  }
  .stage {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-64);
    padding-block: var(--section-y-tablet);
    overflow: hidden;
  }
  .journey[data-pinned] .stage {
    position: sticky;
    top: 0;
    height: 100svh;
    display: block;
    padding: 0;
  }

  .world {
    position: relative;
    height: clamp(340px, 52svh, 520px);
  }
  .journey[data-pinned] .world {
    position: absolute;
    inset: 0;
    height: auto;
  }

  /* Every driven element centres with `translate`, never `transform` — the
     journey owns `transform` on all of them. */
  /* Copy occupies the left band, the world the right one. Sharing the middle is
     what put the headline on top of Mos. `--world-cx` is the only place that
     split is expressed. */
  .world {
    /* The one place the copy/world split is expressed. Side by side on a wide
       screen, stacked on a phone — sharing the middle is what put the headline
       on top of Mos. */
    --world-cx: 50%;
    --world-cy: 32%;
  }
  @media (min-width: 1040px) {
    .world {
      --world-cx: 69%;
      --world-cy: 50%;
    }
  }

  .isle-drive {
    position: absolute;
    left: var(--world-cx);
    top: var(--world-cy);
    translate: -50% -50%;
    pointer-events: none;
  }
  .isle-drive {
    width: min(820px, 90vw);
    /* The island box is 1200×640, so its own aspect fixes the height and every
       percentage inside it is stable at any width. */
    aspect-ratio: 1200 / 640;
  }
  /* 600,258 of the island's viewBox — the pool Mos rests in. The body sits on
     the surface, so it is offset up by its own half-height. */
  .mos-drive {
    position: absolute;
    left: 50%;
    top: 40.3%;
    translate: -50% -76%;
    z-index: 6;
  }
  .mos-drive :global(.mos) {
    /* Sized against the viewport rather than fixed, or Mos swallows the island
       it is standing on at phone widths. */
    --mos-w: clamp(124px, 15vw, 208px);
    pointer-events: auto;
  }

  /* Follows the world band like everything else on the stage. Left on `top: 50%`
     it sat in the copy band on a phone, where the world is above. */
  .say {
    position: absolute;
    left: 50%;
    top: var(--world-cy);
    translate: -50% -50%;
    z-index: 7;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
    width: max-content;
    max-width: min(30ch, 82vw);
    text-align: center;
    pointer-events: none;
  }
  .say-tag {
    display: inline-flex;
    align-items: center;
    gap: var(--space-6);
    padding: 4px 11px;
    border-radius: var(--radius-full);
    background: rgba(14, 20, 30, 0.78);
    font-size: var(--font-size-caption-2);
    color: var(--label-normal);
  }
  .live {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--summon-cyan);
    box-shadow: 0 0 8px var(--summon-cyan);
  }
  .say-line {
    font-size: var(--font-size-caption-1);
    line-height: var(--line-height-body-reading);
    color: var(--label-assistive);
  }

  /* Directly under Storage, because Storage is what it came out of. Parked at
     the bottom of the stage it read as a caption belonging to nothing. */
  .yield {
    position: absolute;
    left: calc(var(--world-cx) + 21%);
    top: calc(var(--world-cy) + 17%);
    translate: -50% 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 22ch;
    padding: var(--space-12) var(--space-14);
    border-radius: var(--radius-l);
    background: radial-gradient(
      130% 130% at 20% 10%,
      rgba(22, 44, 74, 0.86),
      rgba(8, 14, 26, 0.66)
    );
    box-shadow: 0 14px 34px rgba(2, 8, 18, 0.5);
    opacity: 0;
    z-index: 6;
    pointer-events: none;
  }
  .yield-tag {
    align-self: flex-start;
    padding: 3px 9px;
    border-radius: var(--radius-full);
    background: rgba(33, 237, 179, 0.16);
    font-size: var(--font-size-caption-2);
    color: var(--summon-green);
  }
  .yield-title {
    font-size: var(--font-size-body-2);
    font-weight: var(--weight-semibold);
    line-height: var(--line-height-body-reading);
    color: var(--label-strong);
  }

  .wires {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    z-index: 4;
  }
  .wire {
    fill: none;
    stroke: var(--summon-cyan);
    stroke-width: 2;
    stroke-linecap: round;
    opacity: 0;
    filter: drop-shadow(0 0 6px rgba(31, 206, 206, 0.7));
  }
  /* A handoff is one Mon feeding the next, not a fresh call from Mos. */
  .wire.handoff {
    stroke: var(--summon-green);
    filter: drop-shadow(0 0 6px rgba(33, 237, 179, 0.7));
  }

  .crew {
    position: absolute;
    left: var(--world-cx);
    top: var(--world-cy);
    translate: -50% -50%;
    display: grid;
    grid-template-columns: minmax(0, 232px);
    gap: var(--space-8);
    z-index: 5;
    pointer-events: none;
  }
  .crew-slot {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    padding: var(--space-8);
    border-radius: var(--radius-l);
    /* Soft, like everything else here — no hard panel edge */
    background: radial-gradient(120% 140% at 20% 20%, rgba(24, 44, 74, 0.72), rgba(9, 16, 28, 0.5));
    box-shadow: 0 10px 30px rgba(2, 8, 18, 0.5);
    opacity: 0;
  }
  /* The serial pair is set apart, and the chained one steps to the right — the
     handoff between two adjacent Mon has to have somewhere to travel or it is a
     twelve-pixel stub nobody can see. */
  .crew-slot[data-lane='serial'] {
    margin-top: var(--space-14);
  }
  .crew-slot[data-chain] {
    margin-top: var(--space-6);
    margin-left: var(--space-40);
  }
  .crew-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .crew-name {
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    color: var(--label-normal);
  }
  .crew-task {
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
  }
  .crew-bar {
    margin-top: 3px;
    width: 100%;
    height: 3px;
    border-radius: var(--radius-full);
    background: rgba(236, 237, 246, 0.12);
    overflow: hidden;
  }
  .crew-bar i {
    display: block;
    width: 0;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--primary-normal), var(--summon-cyan));
  }

  .well {
    position: absolute;
    left: calc(var(--world-cx) + 21%);
    top: var(--world-cy);
    translate: -50% -50%;
    width: 104px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-10);
    border-radius: var(--radius-l);
    background: radial-gradient(130% 130% at 30% 15%, rgba(22, 40, 68, 0.8), rgba(8, 14, 26, 0.6));
    opacity: 0;
    z-index: 5;
    pointer-events: none;
  }
  .well-cap {
    font-size: var(--font-size-caption-2);
    letter-spacing: 0.04em;
    color: var(--label-assistive);
  }
  .well-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
    width: 100%;
    min-height: 48px;
    align-content: start;
  }
  .artifact {
    height: 22px;
    border-radius: 4px;
    background: linear-gradient(150deg, rgba(236, 237, 246, 0.22), rgba(236, 237, 246, 0.05));
    box-shadow: inset 0 5px 0 -4px rgba(236, 237, 246, 0.5);
    opacity: 0;
  }
  .artifact[data-role='research'] {
    background: linear-gradient(150deg, rgba(139, 130, 247, 0.36), rgba(139, 130, 247, 0.08));
  }
  .artifact[data-role='organize'] {
    background: linear-gradient(150deg, rgba(33, 237, 179, 0.34), rgba(33, 237, 179, 0.07));
  }
  .artifact[data-role='design'] {
    background: linear-gradient(150deg, rgba(240, 106, 134, 0.32), rgba(240, 106, 134, 0.07));
  }

  .tasks {
    position: absolute;
    left: 50%;
    top: 40.3%;
    translate: -50% -76%;
    width: 0;
    height: 0;
    z-index: 7;
    pointer-events: none;
  }

  .task {
    position: absolute;
    left: 0;
    top: 0;
    translate: -50% -50%;
    padding: 6px 13px;
    border-radius: var(--radius-full);
    background: rgba(20, 26, 38, 0.82);
    box-shadow: 0 6px 18px rgba(2, 8, 18, 0.5);
    font-size: var(--font-size-caption-1);
    color: var(--label-normal);
    white-space: nowrap;
    opacity: 0;
  }

  /* ---- act copy ---- */
  .acts {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-64);
  }
  .journey[data-pinned] .acts {
    position: absolute;
    inset: 0;
    display: block;
    /* The wrapper covers the whole stage. Left taking pointers it sat on top of
       Mos and swallowed every poke. */
    pointer-events: none;
  }
  .act {
    position: relative;
    z-index: 8;
    width: min(1200px, 100% - var(--grid-gutter) * 2);
    margin-inline: auto;
  }
  .journey[data-pinned] .act {
    position: absolute;
    left: 50%;
    top: 0;
    translate: -50% 0;
    height: 100%;
    display: grid;
    align-content: center;
    opacity: 0;
    pointer-events: none;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
    /* Wide enough that the Korean submit row still fits on one line, narrow
       enough to clear the world band. */
    max-width: 40ch;
  }
  @media (min-width: 1040px) {
    .col {
      max-width: 46ch;
    }
  }

  .head {
    color: var(--label-strong);
  }
  .lead {
    color: var(--label-alternative);
  }
  .eyebrow {
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    letter-spacing: 0.04em;
    color: var(--bright-cyan);
  }
  .form-slot {
    margin-top: var(--space-8);
    width: 100%;
  }
  .fine {
    display: inline-flex;
    align-items: center;
    gap: var(--space-8);
    font-size: var(--font-size-caption-1);
    color: var(--label-assistive);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--summon-green);
    box-shadow: 0 0 8px var(--summon-green);
  }
  .ask {
    align-self: flex-start;
    max-width: 30ch;
    padding: 10px 15px;
    border-radius: var(--radius-m) var(--radius-m) var(--radius-m) 6px;
    background: var(--primary-normal);
    color: var(--static-white);
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
  }

  .cue {
    display: none;
  }
  .journey[data-pinned] .cue {
    display: block;
    position: absolute;
    right: var(--grid-gutter);
    bottom: var(--space-20);
    z-index: 9;
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
    pointer-events: none;
  }

  /* The delegation lanes and the copy cannot share the middle on a phone, so
     the crew tucks under the island and the copy sits over the top of it. */
  @media (max-width: 860px) {
    .journey[data-pinned] {
      height: 420svh;
    }
    /* Stacked bands, spelled out: island, crew, Storage, copy. Sharing one
       centre is what put the crew on top of Mos. */
    .journey[data-pinned] .act {
      align-content: end;
      padding-bottom: 6svh;
    }
    .world {
      --world-cy: 23%;
    }
    .crew {
      top: 45%;
      grid-template-columns: minmax(0, 206px);
      gap: var(--space-4);
    }
    .crew-slot[data-chain] {
      margin-left: var(--space-20);
    }
    /* The ask bubble repeats the headline above it, and the band cannot carry
       both on a phone. */
    .act.delegate .ask {
      display: none;
    }
    .crew-slot[data-lane='serial'] {
      margin-top: var(--space-8);
    }
    /* No room for it on a phone: island, crew, Storage and the copy already
       fill the column. The artifacts landing in Storage carry the same news. */
    .yield {
      display: none;
    }
    .well {
      left: 50%;
      top: 62%;
      translate: -50% -50%;
      width: 186px;
    }
    .well-grid {
      grid-template-columns: repeat(4, 1fr);
      min-height: 22px;
    }
    .col {
      max-width: 100%;
      text-align: center;
      align-items: center;
      margin-inline: auto;
    }
    .ask {
      align-self: center;
    }
  }
</style>
