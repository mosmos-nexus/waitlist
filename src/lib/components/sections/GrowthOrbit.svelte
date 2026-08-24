<script lang="ts">
  import { onMount } from 'svelte';
  import { animate, spring, createTimer, stagger, utils } from 'animejs';
  import { m } from '$lib/locale.svelte';
  import { prefersReduced, reveal, bindActivity } from '$lib/anime/motion';

  /**
   * The circulation, as something you turn.
   *
   * The four nodes are the product's own surfaces, in the order a person
   * actually moves through them: you run work on Monitor, find you are short a
   * capability and fetch one from Hub, it lands in Inventory, you open Studio to
   * adapt or build one, and back to Monitor. Drag the ring and it spins with
   * you, then springs to the nearest surface when you let go. Every full turn is
   * one cycle, and each cycle visibly grows the Mos in the middle.
   *
   * The nodes used to be four abstract words with a sentence of explanation
   * each. A thumbnail of the surface says more in less space, and the light/dark
   * split is real: Monitor is the world where work runs, the other three are the
   * workshop and the market.
   */

  type Surface = { key: string; name: string; theme: 'dark' | 'light' };

  /** Product surface names — proper nouns, identical in every locale. */
  const SURFACES: Surface[] = [
    { key: 'monitor', name: 'Monitor', theme: 'dark' },
    { key: 'hub', name: 'Hub', theme: 'light' },
    { key: 'inventory', name: 'Inventory', theme: 'light' },
    { key: 'studio', name: 'Studio', theme: 'light' },
  ];

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
  const activeSurface = $derived(SURFACES[stepIndex]);

  const cycleLabel = $derived(
    cycles >= MAX_CYCLES ? m.orbit_maxed() : cycles > 0 ? m.orbit_cycle({ count: cycles }) : '',
  );

  // Mana motes and Mon companions are earned, not decorative — they appear as
  // cycles complete.
  const globCount = $derived(2 + cycles);
  const monCount = $derived(Math.min(3, cycles));

  let idleTimer: ReturnType<typeof createTimer> | null = null;

  // Each surface redraws itself when it becomes the active one.
  $effect(() => {
    const surface = SURFACES[stepIndex];
    if (!sceneEl || prefersReduced()) return;
    const marks = Array.from(
      sceneEl.querySelectorAll<SVGElement>(`.card[data-surface="${surface.key}"] .mini [data-k]`),
    );
    if (!marks.length) return;
    // Sorted by the authored order so a table fills top-down and a canvas wires
    // itself up from the first node, rather than in DOM-query order.
    marks.sort((a, b) => Number(a.dataset.k) - Number(b.dataset.k));
    animate(marks, {
      opacity: [0.15, 1],
      duration: 420,
      delay: stagger(70),
      ease: 'out(3)',
    });
  });

  function applyTurn() {
    if (!ringEl) return;
    utils.set(ringEl, { rotate: turn });
    // The cards have to stay upright while the ring under them turns, so each
    // one cancels the ring's own rotation. animejs owns `transform` on the ring
    // itself, hence a custom property rather than a second transform.
    ringEl.style.setProperty('--turn', `${turn}deg`);
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
  <div class="container inner">
    <div class="copy">
      <div class="head reveal" use:reveal>
        <span class="eyebrow">{m.loop_eyebrow()}</span>
        <h2 class="t-heading-1 title">{m.loop_title()}</h2>
        <p class="t-body-1-reading lead prewrap">{m.loop_lead()}</p>
      </div>
      <p class="kicker reveal" use:reveal={{ delay: 120 }}>{m.loop_kicker()}</p>
    </div>

    <div class="stage-col">
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
              aria-valuetext={cycleLabel
                ? `${activeSurface.name} · ${cycleLabel}`
                : activeSurface.name}
              class:dragging
              onkeydown={onKey}
            >
              <!-- Direction is drawn, not stated: four arcs with heads, so the
                 ring reads as a circulation even before anyone turns it. -->
              <svg class="track" viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r="99" class="rim" />
                {#each SURFACES as s, i (s.key)}
                  <g transform="rotate({i * 90} 100 100)">
                    <path class="arc" d="M118,101A99,99 0 0 1 172,159" />
                    <path class="head" d="M166,150l8,10l-13,2" />
                  </g>
                {/each}
              </svg>

              {#each SURFACES as s, i (s.key)}
                <span class="node" class:on={stepIndex === i} style="--a:{i * 90}deg">
                  <span class="card" data-plate={s.theme} data-surface={s.key}>
                    <svg class="mini" viewBox="0 0 96 56" aria-hidden="true">
                      {#if s.key === 'monitor'}
                        <!-- the island, Mos on it, two Mon beside -->
                        <path class="fill-soft" d="M27,33q21,-8 42,0q-21,8 -42,0z" data-k="0" />
                        <path class="fill-deep" d="M30,34L48,52L66,34q-18,7 -36,0z" data-k="1" />
                        <circle class="fill-key" cx="48" cy="24" r="7.5" data-k="2" />
                        <circle class="fill-soft" cx="33" cy="31" r="3" data-k="3" />
                        <circle class="fill-soft" cx="63" cy="31" r="3" data-k="4" />
                        <rect
                          class="fill-key"
                          x="34"
                          y="45"
                          width="28"
                          height="2.4"
                          rx="1.2"
                          data-k="5"
                        />
                      {:else if s.key === 'hub'}
                        <!-- a registry of cards, one carrying a verified badge -->
                        {#each [0, 1, 2, 3, 4, 5] as n (n)}
                          <rect
                            class="fill-soft"
                            x={9 + (n % 3) * 27}
                            y={8 + Math.floor(n / 3) * 24}
                            width="22"
                            height="17"
                            rx="3"
                            data-k={n}
                          />
                        {/each}
                        <path class="stroke-key" d="M13,15l3,3l5,-6" data-k="6" />
                      {:else if s.key === 'inventory'}
                        <!-- what you hold, as rows in a table -->
                        <rect
                          class="fill-soft"
                          x="9"
                          y="8"
                          width="78"
                          height="3"
                          rx="1.5"
                          data-k="0"
                        />
                        {#each [0, 1, 2] as n (n)}
                          <circle
                            class="fill-key"
                            cx="14"
                            cy={22 + n * 12}
                            r="3.4"
                            data-k={n + 1}
                          />
                          <rect
                            class="fill-soft"
                            x="23"
                            y={20 + n * 12}
                            width={58 - n * 14}
                            height="4"
                            rx="2"
                            data-k={n + 1}
                          />
                        {/each}
                      {:else}
                        <!-- a canvas of wired nodes, and the Skill that is a document -->
                        <path class="stroke-soft" d="M23,36L46,20L69,34" data-k="0" />
                        <circle class="fill-key" cx="23" cy="36" r="5" data-k="1" />
                        <circle class="fill-key" cx="46" cy="20" r="6.5" data-k="2" />
                        <circle class="fill-key" cx="69" cy="34" r="5" data-k="3" />
                        <rect
                          class="fill-soft"
                          x="36"
                          y="41"
                          width="24"
                          height="10"
                          rx="2"
                          data-k="4"
                        />
                        <path class="stroke-soft" d="M40,45h16M40,48h11" data-k="5" />
                      {/if}
                    </svg>
                    <span class="card-name">{s.name}</span>
                  </span>
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

  /* Copy on one side, the ring on the other. Centred in a full-width container
     the ring left half the section empty on both flanks. */
  .inner {
    display: grid;
    gap: var(--space-32);
  }
  @media (min-width: 1040px) {
    .inner {
      grid-template-columns: minmax(0, 1fr) minmax(440px, 560px);
      gap: var(--space-64);
      align-items: center;
    }
  }
  .copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-24);
  }
  .stage-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-16);
  }

  .scene {
    position: relative;
    width: 100%;
    height: clamp(400px, 52vh, 500px);
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
    --ring-d: min(376px, 74vw);
    position: relative;
    width: var(--ring-d);
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
    width: 100%;
    height: 100%;
    overflow: visible;
    fill: none;
  }
  .track .rim {
    stroke: rgba(49, 220, 220, 0.16);
    stroke-width: 1;
    stroke-dasharray: 3 5;
  }
  .track .arc {
    stroke: rgba(49, 220, 220, 0.3);
    stroke-width: 1.4;
    stroke-linecap: round;
  }
  .track .head {
    stroke: rgba(49, 220, 220, 0.55);
    stroke-width: 1.6;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  /* Each node rides the rim at its own angle, then cancels both its own angle
     and the ring's live rotation so the card stays upright and readable. */
  .node {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 0;
    height: 0;
    transform: rotate(var(--a)) translateY(calc(var(--ring-d) / -2))
      rotate(calc(-1 * (var(--a) + var(--turn, 0deg))));
  }
  .card {
    position: absolute;
    translate: -50% -50%;
    width: 118px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 8px 8px 7px;
    border-radius: var(--radius-m);
    border: 1px solid var(--line-normal-normal);
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.44);
    transition:
      scale var(--duration-base) var(--ease-out),
      border-color var(--duration-base) var(--ease-out),
      box-shadow var(--duration-base) var(--ease-out);
  }
  /* Monitor is the world work runs in; the other three are workshop and market.
     The product splits them by theme, so the thumbnails do too. */
  .card[data-plate='dark'] {
    background: #0a1120;
    color: #dfe8f7;
  }
  .card[data-plate='light'] {
    background: #eef2f8;
    color: #16324f;
  }
  .node.on .card {
    scale: 1.14;
    border-color: var(--summon-cyan);
    box-shadow:
      0 0 0 1px var(--summon-cyan),
      0 14px 34px rgba(0, 0, 0, 0.5),
      0 0 26px rgba(31, 206, 206, 0.34);
  }
  .mini {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 4px;
  }
  /* Base tone on `fill-opacity`, not `opacity`: the reveal animates element
     `opacity` inline, which would otherwise overwrite this and leave every mark
     at full strength — the light plates ended up reading as dark ones. The two
     channels multiply, so the final tone is the one declared here. */
  .mini .fill-soft {
    fill: currentColor;
    fill-opacity: 0.28;
  }
  .mini .fill-deep {
    fill: currentColor;
    fill-opacity: 0.5;
  }
  .mini .fill-key {
    fill: var(--summon-cyan);
  }
  .mini .stroke-soft {
    fill: none;
    stroke: currentColor;
    stroke-opacity: 0.42;
    stroke-width: 2;
    stroke-linecap: round;
  }
  .mini .stroke-key {
    fill: none;
    stroke: var(--summon-cyan);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .card-name {
    font-size: var(--font-size-caption-2);
    font-weight: var(--weight-semibold);
    letter-spacing: 0.01em;
    text-align: center;
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

  /* ---- Meter ---- */
  .meter {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-8);
    width: min(260px, 76%);
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
    /* Narrower than the control row: stretched to full width the empty track
       reads as a divider rule rather than a meter. */
    width: 156px;
    height: 4px;
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
      align-items: center;
      width: 100%;
      max-width: 320px;
    }
  }

  /* A card straddles the rim, so the scene is as wide as the ring plus one
     card. At 390px the default sizes put the left card off-screen and gave the
     document a horizontal scroll. */
  @media (max-width: 560px) {
    .ring {
      --ring-d: min(376px, 56vw);
    }
    .card {
      width: 98px;
      padding: 6px 6px 5px;
    }
  }
</style>
