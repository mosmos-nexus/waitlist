<script lang="ts">
  import { onMount } from 'svelte';
  import { animate, spring, createTimer, utils } from 'animejs';
  import { m } from '$lib/paraglide/messages.js';
  import { prefersReduced, reveal, bindActivity } from '$lib/anime/motion';

  /**
   * The growth loop, as something you turn.
   *
   * Four nodes ride a tilted ring. Drag the ring and it spins with you, then
   * springs to the nearest node when you let go. Every full turn is one cycle,
   * and each cycle visibly grows the Mos in the middle: bigger body, more
   * inner light, one more Mon along for the ride. The claim of the section is
   * "the more you use it, the more it grows" — so the section only grows if
   * you use it.
   */

  const STEPS = $derived([
    { name: m.loop_step1_name(), desc: m.loop_step1_desc() },
    { name: m.loop_step2_name(), desc: m.loop_step2_desc() },
    { name: m.loop_step3_name(), desc: m.loop_step3_desc() },
    { name: m.loop_step4_name(), desc: m.loop_step4_desc() },
  ]);

  const MAX_CYCLES = 4;
  const STEP_DEG = 90;

  let ringEl = $state<HTMLDivElement | null>(null);
  let coreEl = $state<HTMLDivElement | null>(null);
  let sceneEl = $state<HTMLDivElement | null>(null);

  /** Total rotation in degrees, unbounded so cycles can be counted from it. */
  let turn = $state(0);
  let dragging = $state(false);
  let touched = $state(false);
  /**
   * Rotation already on the clock when the visitor first took hold.
   *
   * The ring drifts on its own before anyone touches it, and that drift shares
   * the `turn` accumulator — so counting cycles straight off `turn` would hand
   * out growth for merely leaving the section on screen (a full turn arrives in
   * about 75 seconds of dwell). Growth is measured from the moment of the first
   * real input, which is what the section actually claims.
   */
  let idleBase = $state(0);

  const stepIndex = $derived(((Math.round(turn / STEP_DEG) % 4) + 4) % 4);
  const cycles = $derived(
    touched ? Math.min(MAX_CYCLES, Math.floor(Math.abs(turn - idleBase) / 360)) : 0,
  );
  const growth = $derived(cycles / MAX_CYCLES);
  const activeStep = $derived(STEPS[stepIndex]);

  const cycleLabel = $derived(
    cycles >= MAX_CYCLES ? m.orbit_maxed() : cycles > 0 ? m.orbit_cycle({ count: cycles }) : '',
  );

  // Mana motes and Mon companions are earned, not decorative — they appear as
  // cycles complete.
  const globCount = $derived(2 + cycles);
  const monCount = $derived(Math.min(3, cycles));

  let idleTimer: ReturnType<typeof createTimer> | null = null;

  function applyTurn() {
    if (ringEl) utils.set(ringEl, { rotate: turn });
  }

  onMount(() => {
    if (!ringEl || !sceneEl) return;
    applyTurn();

    const reduced = prefersReduced();
    const cleanups: (() => void)[] = [];

    // Before anyone touches it, the ring turns by itself — the same idle drift
    // the island's orbits have, so it reads as part of the world.
    if (!reduced) {
      idleTimer = createTimer({
        duration: Infinity,
        frameRate: 30,
        onUpdate: () => {
          if (dragging || touched) return;
          turn += 0.16;
          applyTurn();
        },
      });
      cleanups.push(bindActivity(sceneEl, [idleTimer]));
      cleanups.push(() => idleTimer?.revert());
    }

    // Rotation input. `createDraggable` moves things along axes, not around a
    // centre, so the angle is tracked directly and animejs takes over for the
    // release spring.
    let lastAngle = 0;
    let pointerId: number | null = null;

    const angleAt = (clientX: number, clientY: number) => {
      const r = ringEl!.getBoundingClientRect();
      return (
        (Math.atan2(clientY - (r.top + r.height / 2), clientX - (r.left + r.width / 2)) * 180) /
        Math.PI
      );
    };

    const onDown = (event: PointerEvent) => {
      pointerId = event.pointerId;
      dragging = true;
      if (!touched) idleBase = turn;
      touched = true;
      lastAngle = angleAt(event.clientX, event.clientY);
      ringEl!.setPointerCapture(event.pointerId);
    };

    const onMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      const angle = angleAt(event.clientX, event.clientY);
      // Accumulate the step since the last move, not since the grab. atan2 wraps
      // at ±180°, so each step is unwrapped individually — that lets a single
      // drag wind the ring through as many turns as the pointer travels.
      let step = angle - lastAngle;
      if (step > 180) step -= 360;
      if (step < -180) step += 360;
      lastAngle = angle;
      turn += step;
      applyTurn();
    };

    const onUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      pointerId = null;
      if (ringEl!.hasPointerCapture(event.pointerId)) {
        ringEl!.releasePointerCapture(event.pointerId);
      }
      const snapped = Math.round(turn / STEP_DEG) * STEP_DEG;
      if (reduced) {
        turn = snapped;
        applyTurn();
        return;
      }
      const box = { value: turn };
      animate(box, {
        value: snapped,
        ease: spring({ stiffness: 58, damping: 14 }),
        onUpdate: () => {
          turn = box.value;
          applyTurn();
        },
      });
    };

    ringEl.addEventListener('pointerdown', onDown);
    ringEl.addEventListener('pointermove', onMove);
    ringEl.addEventListener('pointerup', onUp);
    ringEl.addEventListener('pointercancel', onUp);
    cleanups.push(() => {
      ringEl?.removeEventListener('pointerdown', onDown);
      ringEl?.removeEventListener('pointermove', onMove);
      ringEl?.removeEventListener('pointerup', onUp);
      ringEl?.removeEventListener('pointercancel', onUp);
    });

    return () => {
      for (const c of cleanups) c();
    };
  });

  // The in-flight step animation, so a second click retargets it instead of
  // racing it. Two concurrent tweens both writing `turn` would each read the
  // same stale index and advance a single node between them.
  let stepAnim: ReturnType<typeof animate> | null = null;
  let stepTarget: number | null = null;

  /** Advance by `direction` nodes — ±1 for the buttons and arrows, more for Home/End. */
  function step(direction: number) {
    if (direction === 0) return;
    if (!touched) idleBase = turn;
    touched = true;

    // Count from the pending target when one exists, so clicks queue up.
    const from = stepTarget ?? turn;
    const target = (Math.round(from / STEP_DEG) + direction) * STEP_DEG;
    stepTarget = target;

    if (prefersReduced()) {
      turn = target;
      stepTarget = null;
      applyTurn();
      return;
    }

    stepAnim?.revert();
    const box = { value: turn };
    stepAnim = animate(box, {
      value: target,
      duration: 760,
      ease: 'out(3)',
      onUpdate: () => {
        turn = box.value;
        applyTurn();
      },
      onComplete: () => {
        stepAnim = null;
        stepTarget = null;
      },
    });
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      step(-stepIndex || -4);
    } else if (event.key === 'End') {
      event.preventDefault();
      step(4 - stepIndex);
    }
  }

  // Growth is expressed on the core element rather than re-rendering the blob,
  // so the ring stays at a steady frame cost however many cycles you turn.
  $effect(() => {
    if (!coreEl) return;
    const scale = 1 + growth * 0.34;
    if (prefersReduced()) {
      utils.set(coreEl, { scale });
      return;
    }
    animate(coreEl, {
      scale,
      duration: 900,
      ease: spring({ stiffness: 42, damping: 9 }),
    });
  });
</script>

<section class="section growth">
  <div class="container">
    <div class="head reveal" use:reveal>
      <span class="eyebrow">{m.loop_eyebrow()}</span>
      <h2 class="t-heading-1 title">{m.loop_title()}</h2>
      <p class="t-body-1-reading lead prewrap">{m.loop_lead()}</p>
    </div>

    <div class="scene reveal" bind:this={sceneEl} use:reveal={{ delay: 80, scale: true }}>
      <div class="stack">
        <div class="plane">
          <!-- The ring itself is the control -->
          <div
            class="ring"
            bind:this={ringEl}
            role="slider"
            tabindex="0"
            aria-label={m.orbit_aria()}
            aria-valuemin="1"
            aria-valuemax="4"
            aria-valuenow={stepIndex + 1}
            aria-valuetext={cycleLabel ? `${activeStep.name} · ${cycleLabel}` : activeStep.name}
            class:dragging
            onkeydown={onKey}
          >
            <span class="track"></span>
            {#each STEPS as s, i (s.name)}
              <span class="node" class:on={stepIndex === i} style="--a:{i * 90}deg">
                <i class="pip"></i>
              </span>
            {/each}
          </div>
        </div>

        <!-- Mos in the middle, growing with each completed turn -->
        <div class="core" bind:this={coreEl}>
          <span class="core-aura" style="opacity:{0.4 + growth * 0.5}"></span>
          <span class="core-body">
            {#each Array(globCount) as _, i (i)}
              <i class="glob" style="--i:{i}; --n:{globCount}"></i>
            {/each}
            <svg class="face" viewBox="0 0 100 100" aria-hidden="true">
              <line x1="36" y1="42" x2="36" y2="52" />
              <line x1="64" y1="42" x2="64" y2="52" />
              <path d="M50,58c1,5,7,8,14,7" />
              <path d="M50,58c-1,5-7,8-14,7" />
            </svg>
          </span>
          <span class="mons">
            {#each Array(monCount) as _, i (i)}
              <i class="mon m{i}"></i>
            {/each}
          </span>
        </div>
      </div>

      <!-- Readout. Live, because the growth it reports is the section's payoff
           and is otherwise conveyed only by the animation. -->
      <div class="readout" aria-live="polite">
        <span class="step-name">{activeStep.name}</span>
        <p class="step-desc">{activeStep.desc}</p>
      </div>

      <div class="meter">
        <div class="controls">
          <button type="button" onclick={() => step(-1)} aria-label={m.orbit_prev()}>
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span class="cycle" class:maxed={cycles >= MAX_CYCLES}>
            {cycleLabel}
          </span>
          <button type="button" onclick={() => step(1)} aria-label={m.orbit_next()}>
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
        <span class="bar"><i style="width:{growth * 100}%"></i></span>
        <span class="hint" class:faded={touched}>{m.orbit_hint()}</span>
      </div>
    </div>

    <p class="kicker reveal" use:reveal={{ delay: 120 }}>{m.loop_kicker()}</p>
  </div>
</section>

<style>
  .growth {
    background:
      radial-gradient(70% 60% at 50% 40%, rgba(84, 54, 180, 0.12), transparent 70%), var(--app-bg);
  }

  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    max-width: 46ch;
  }
  .title {
    color: var(--label-strong);
  }
  .lead {
    color: var(--label-alternative);
  }

  .scene {
    position: relative;
    height: clamp(420px, 56vh, 520px);
    margin-top: var(--space-40);
    display: grid;
    place-items: center;
  }

  /* The ring lies flat in perspective, borrowing the island's orbit language */
  .plane {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    perspective: 900px;
  }
  .ring {
    position: relative;
    width: min(440px, 82vw);
    aspect-ratio: 1;
    transform-style: preserve-3d;
    rotate: 0deg;
    cursor: grab;
    touch-action: none;
  }
  .ring.dragging {
    cursor: grabbing;
  }
  .ring:focus-visible {
    outline: 2px solid var(--bright-cyan);
    outline-offset: 12px;
    border-radius: 50%;
  }
  .track {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px dashed rgba(49, 220, 220, 0.22);
  }

  /* Each node rides the rim at its own angle. The pips are circles, so they
     need no counter-rotation as the ring turns. */
  .node {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 0;
    height: 0;
    transform: rotate(var(--a)) translateY(calc(min(440px, 82vw) / -2));
  }
  .pip {
    position: absolute;
    translate: -50% -50%;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--gray5);
    border: 1px solid var(--line-normal-strong);
    transition: var(--transition-base);
  }
  .node.on .pip {
    background: var(--summon-cyan);
    border-color: var(--summon-cyan);
    box-shadow: 0 0 16px rgba(31, 206, 206, 0.9);
    scale: 1.35;
  }

  /* ---- Mos core ---- */
  .core {
    position: relative;
    z-index: 2;
    width: 132px;
    height: 132px;
    display: grid;
    place-items: center;
    pointer-events: none;
  }
  .core-aura {
    position: absolute;
    inset: -34%;
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      rgba(31, 206, 206, 0.28),
      rgba(15, 111, 218, 0.14) 58%,
      transparent
    );
    transition: opacity var(--duration-slow) var(--ease-out);
  }
  .core-body {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 46% 54% 52% 48% / 50% 46% 54% 50%;
    background: radial-gradient(circle at 34% 28%, #3d8bee, #0f2f5e 76%);
    box-shadow:
      inset 0 0 0 1.5px rgba(236, 237, 246, 0.28),
      0 0 40px rgba(31, 206, 206, 0.26);
    overflow: hidden;
    animation: breathe 3400ms var(--ease-in-out) infinite alternate;
  }
  @keyframes breathe {
    to {
      border-radius: 52% 48% 46% 54% / 46% 52% 48% 54%;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .core-body {
      animation: none;
    }
  }

  /* Earned inner light — one more glob per completed cycle */
  .glob {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 46%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(closest-side, rgba(49, 220, 220, 0.5), transparent);
    transform: translate(-50%, -50%) rotate(calc(var(--i) * (360deg / var(--n)))) translateY(-22%);
    animation: swirl 9s linear infinite;
    animation-delay: calc(var(--i) * -1.4s);
  }
  @keyframes swirl {
    to {
      transform: translate(-50%, -50%) rotate(calc(var(--i) * (360deg / var(--n)) + 360deg))
        translateY(-22%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .glob {
      animation: none;
    }
  }

  .face {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    fill: none;
    stroke: #0b1b33;
    stroke-width: 5;
    stroke-linecap: round;
    opacity: 0.85;
  }

  /* Mon that joined along the way */
  .mons {
    position: absolute;
    inset: -40%;
    pointer-events: none;
  }
  .mon {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }
  .mon.m0 {
    left: 4%;
    top: 30%;
    background: var(--mon-research);
    box-shadow: 0 0 12px var(--mon-research);
  }
  .mon.m1 {
    right: 6%;
    top: 22%;
    background: var(--mon-organize);
    box-shadow: 0 0 12px var(--mon-organize);
  }
  .mon.m2 {
    right: 22%;
    bottom: 14%;
    background: var(--mon-design);
    box-shadow: 0 0 12px var(--mon-design);
  }

  /* ---- Readout + meter ---- */
  .readout {
    position: absolute;
    left: 0;
    top: 0;
    max-width: 24ch;
  }
  .step-name {
    display: inline-block;
    padding: 4px 12px;
    border-radius: var(--radius-full);
    background: rgba(31, 206, 206, 0.14);
    border: 1px solid rgba(31, 206, 206, 0.34);
    color: var(--bright-cyan);
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
  }
  .step-desc {
    margin-top: var(--space-8);
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-alternative);
  }

  .meter {
    position: absolute;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-8);
    width: min(240px, 60%);
  }
  .controls {
    display: flex;
    align-items: center;
    gap: var(--space-10);
  }
  .controls button {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1px solid var(--line-normal-normal);
    background: rgba(20, 23, 27, 0.7);
    cursor: pointer;
    transition: var(--transition-base);
  }
  .controls button:hover {
    border-color: var(--line-normal-strong);
    background: var(--fill-normal);
  }
  .controls button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }
  .controls svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: var(--label-normal);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  /* Empty until the first cycle lands — the hint below carries the invitation,
     and "cycle 0" has no grammatical form in Korean or Japanese. */
  .cycle:empty {
    display: none;
  }
  .cycle {
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    color: var(--label-normal);
    white-space: nowrap;
  }
  .cycle.maxed {
    color: var(--summon-green);
  }
  .bar {
    width: 100%;
    height: 3px;
    border-radius: var(--radius-full);
    background: var(--fill-normal);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--primary-normal), var(--summon-green));
    transition: width var(--duration-slow) var(--ease-out);
  }
  .hint {
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
    transition: opacity var(--duration-slow) var(--ease-out);
  }
  .hint.faded {
    opacity: 0;
  }

  .kicker {
    margin-top: var(--space-32);
    max-width: 52ch;
    font-size: var(--font-size-body-2);
    color: var(--label-assistive);
  }

  @media (max-width: 760px) {
    .scene {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      height: auto;
      gap: var(--space-24);
    }
    .readout {
      position: static;
      order: 1;
      max-width: 100%;
      text-align: center;
    }
    /* The ring and the core share one stacking context in the middle row */
    .stack {
      position: relative;
      order: 2;
      width: 100%;
      aspect-ratio: 1;
      max-width: 360px;
      display: grid;
      place-items: center;
    }
    .plane {
      inset: 0;
    }
    .meter {
      position: static;
      order: 3;
      align-items: center;
      width: 100%;
      max-width: 320px;
    }
  }
</style>
