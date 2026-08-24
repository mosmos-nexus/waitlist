<script lang="ts">
  import { onMount } from 'svelte';
  import { animate, createAnimatable, createTimeline, stagger } from 'animejs';
  import { m } from '$lib/paraglide/messages.js';
  import { prefersReduced, hasFinePointer, reveal } from '$lib/anime/motion';

  /**
   * "Getting AI to do the work quietly became work of its own."
   *
   * The section argues that by making it literally true: the task shards drift,
   * and they slip away from the cursor, so you can't actually catch one. Then
   * the section's own scroll pulls every shard into Mos and they're gone — the
   * copy's promise, performed rather than described.
   */

  const TASKS = $derived([
    { label: m.drift_task_1(), x: 12, y: 22, size: 1 },
    { label: m.drift_task_2(), x: 68, y: 14, size: 0.92 },
    { label: m.drift_task_3(), x: 34, y: 58, size: 1.05 },
    { label: m.drift_task_4(), x: 80, y: 62, size: 0.88 },
    { label: m.drift_task_5(), x: 8, y: 70, size: 0.96 },
    { label: m.drift_task_6(), x: 54, y: 34, size: 1 },
  ]);

  let fieldEl = $state<HTMLDivElement | null>(null);
  let sinkEl = $state<HTMLDivElement | null>(null);
  let gathered = $state(false);
  // The hint invites a cursor interaction, so it only makes sense where that
  // interaction exists. Touch has no dodge, and reduced motion has no scene.
  let canDodge = $state(false);

  onMount(() => {
    if (!fieldEl || prefersReduced()) {
      // Nothing will move, so retire the hint rather than leave it inviting a
      // chase that cannot happen. The shard labels stay — they are content.
      gathered = true;
      return;
    }
    canDodge = hasFinePointer();

    // Each layer of the shard is driven by exactly one animejs instance:
    //   .shard      → the gather timeline (flies to Mos)
    //   .shard-lean → the cursor dodge
    //   .shard-core → the idle drift
    // Sharing an element between two of them means the last one to tick
    // overwrites the others — which is how the dodge got silently pinned to
    // zero by the gather's own translate keyframes.
    const shards = Array.from(fieldEl.querySelectorAll<HTMLElement>('.shard'));
    const leans = Array.from(fieldEl.querySelectorAll<HTMLElement>('.shard-lean'));
    const cores = Array.from(fieldEl.querySelectorAll<HTMLElement>('.shard-core'));
    const cleanups: (() => void)[] = [];

    // Idle drift lives on the inner core so the outer shard is free to carry
    // the cursor-dodge offset without the two fighting over `transform`.
    const drifts = cores.map((core, i) =>
      animate(core, {
        translateX: [0, i % 2 ? 14 : -14],
        translateY: [0, i % 3 ? -18 : 12],
        rotate: [i % 2 ? -3 : 3, i % 2 ? 3 : -3],
        duration: 5200 + i * 640,
        loop: true,
        alternate: true,
        ease: 'inOut(2)',
        delay: i * 320,
      }),
    );

    // The dodge. Each shard owns an animatable offset that eases back to zero
    // whenever the pointer isn't near it.
    if (canDodge) {
      const dodges = leans.map((el) => createAnimatable(el, { x: 620, y: 620, ease: 'out(3)' }));
      const RADIUS = 190;

      // Measured from each shard's *home* position, never its current one.
      // Reading the live rect would feed the shard's own displacement back into
      // the force: flee, fall outside the radius, get told to return, land back
      // under the cursor, flee again — an oscillation whose resting place is
      // decided by whichever event happened to be last. Against a fixed home,
      // the offset is a plain function of where the cursor is, so the shard
      // leans away and eases back smoothly.
      // `.shard` is absolutely positioned inside `.field`, so offsetLeft/Top
      // are its untransformed layout coordinates.
      let homes = shards.map((el) => ({
        x: el.offsetLeft + el.offsetWidth / 2,
        y: el.offsetTop + el.offsetHeight / 2,
      }));
      // The field is sized in vh and the shards are placed in %, so every
      // resize — and a late webfont swap, since the pills are nowrap — moves
      // every home. Stale origins make the wrong shard flee.
      const remeasure = () => {
        homes = shards.map((el) => ({
          x: el.offsetLeft + el.offsetWidth / 2,
          y: el.offsetTop + el.offsetHeight / 2,
        }));
      };
      const ro = new ResizeObserver(remeasure);
      ro.observe(fieldEl);
      document.fonts?.ready.then(remeasure).catch(() => {});
      cleanups.push(() => ro.disconnect());

      const onMove = (event: PointerEvent) => {
        if (gathered) return;
        const field = fieldEl!.getBoundingClientRect();
        const px = event.clientX - field.left;
        const py = event.clientY - field.top;

        shards.forEach((_, i) => {
          const dx = homes[i].x - px;
          const dy = homes[i].y - py;
          const dist = Math.hypot(dx, dy);
          if (dist > RADIUS) {
            dodges[i].x(0).y(0);
            return;
          }
          // Closer cursor, stronger shove.
          const force = (1 - dist / RADIUS) ** 1.5 * 96;
          // Landing dead-centre leaves no direction to flee in, which would
          // freeze the shard under the cursor — exactly the one spot where it
          // most needs to move. Use a fixed escape heading there, varied per
          // shard so neighbours don't bolt the same way.
          const heading = dist < 1 ? (i / shards.length) * Math.PI * 2 : Math.atan2(dy, dx);
          const ux = dist < 1 ? Math.cos(heading) : dx / dist;
          const uy = dist < 1 ? Math.sin(heading) : dy / dist;
          dodges[i].x(ux * force).y(uy * force);
        });
      };
      const onLeave = () => dodges.forEach((d) => d.x(0).y(0));

      window.addEventListener('pointermove', onMove, { passive: true });
      fieldEl.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        window.removeEventListener('pointermove', onMove);
        fieldEl?.removeEventListener('pointerleave', onLeave);
        dodges.forEach((d) => d.revert());
      });
    }

    // The gather is keyed to the closing line, not to the field arriving.
    // Centring the field is the same moment the visitor gets there, so
    // triggering on it would vacuum the shards away before anyone had a chance
    // to chase one — and the dodge is the whole point of the section. Tying it
    // to the sentence that promises it ("Mosmos will take that part from here")
    // means the shards leave exactly as the copy says they will.
    const sinkRect = () => sinkEl?.getBoundingClientRect();
    const gather = createTimeline({
      autoplay: false,
      onBegin: () => {
        gathered = true;
        for (const d of drifts) d.pause();
      },
    });

    // The gather is on a dwell, not a scroll position.
    //
    // Position-based triggers don't work here: the field is shorter than a
    // viewport, so the closing line is already on screen the moment the field
    // is — anything keyed to either one fires before the visitor has seen a
    // single shard move, which kills the dodge that is the point of the
    // section. A dwell instead gives everyone the same few seconds to try
    // catching one, and then delivers the payoff.
    const DWELL = 3200;
    let dwellTimer: ReturnType<typeof setTimeout> | undefined;

    const trigger = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Re-armed on return, so scrolling away mid-count doesn't fire it
            // at an off-screen moment.
            dwellTimer ??= setTimeout(() => {
              trigger.disconnect();
              gather.play();
            }, DWELL);
          } else {
            clearTimeout(dwellTimer);
            dwellTimer = undefined;
          }
        }
      },
      { threshold: 0.55 },
    );
    trigger.observe(fieldEl);
    cleanups.push(() => {
      clearTimeout(dwellTimer);
      trigger.disconnect();
    });

    shards.forEach((el, i) => {
      gather.add(
        el,
        {
          // Resolved at play time so a resize between load and scroll can't
          // send the shards to a stale coordinate.
          translateX: () => {
            const s = sinkRect();
            const r = el.getBoundingClientRect();
            return s ? s.left + s.width / 2 - (r.left + r.width / 2) : 0;
          },
          translateY: () => {
            const s = sinkRect();
            const r = el.getBoundingClientRect();
            return s ? s.top + s.height / 2 - (r.top + r.height / 2) : 0;
          },
          scale: 0.24,
          opacity: 0,
          filter: 'blur(3px)',
          duration: 1000,
          ease: 'inOut(3)',
        },
        i * 110,
      );
    });

    // Mos swallows them and pulses once per arrival.
    if (sinkEl) {
      gather.add(
        sinkEl,
        {
          scale: [
            { to: 1.16, duration: 340 },
            { to: 1, duration: 620 },
          ],
          duration: 960,
          ease: 'out(3)',
        },
        620,
      );
      gather.add(
        sinkEl.querySelectorAll('.sink-ring'),
        {
          scale: [0.6, 1.9],
          opacity: [0.7, 0],
          duration: 1400,
          delay: stagger(220),
          ease: 'out(2)',
        },
        700,
      );
    }

    cleanups.push(() => {
      gather.revert();
      for (const d of drifts) d.revert();
    });
    return () => {
      for (const c of cleanups) c();
    };
  });
</script>

<section class="section drift">
  <div class="container">
    <div class="head reveal" use:reveal>
      <span class="eyebrow">{m.empathy_eyebrow()}</span>
      <h2 class="t-heading-1 title prewrap">{m.empathy_loss()}</h2>
    </div>

    <div class="field" bind:this={fieldEl}>
      {#each TASKS as task (task.label)}
        <div class="shard" style="left:{task.x}%; top:{task.y}%; --s:{task.size}">
          <div class="shard-lean">
            <div class="shard-core">
              <span class="pip"></span>
              {task.label}
            </div>
          </div>
        </div>
      {/each}

      <!-- Mos, waiting to take them -->
      <div class="sink" bind:this={sinkEl}>
        <span class="sink-ring"></span>
        <span class="sink-ring"></span>
        <span class="sink-core"></span>
      </div>

      {#if canDodge}
        <p class="hint" class:hidden={gathered}>{m.drift_hint()}</p>
      {/if}
    </div>

    <p class="t-title-2 gain reveal prewrap" use:reveal={{ delay: 120 }}>{m.empathy_gain()}</p>
  </div>
</section>

<style>
  .drift {
    background:
      radial-gradient(60% 50% at 50% 0%, rgba(15, 111, 218, 0.12), transparent 70%), var(--app-bg);
  }

  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    max-width: 34ch;
  }
  .title {
    color: var(--label-strong);
  }

  .field {
    position: relative;
    height: clamp(340px, 46vh, 460px);
    margin-block: var(--space-32);
  }

  .shard {
    position: absolute;
    will-change: transform;
  }
  .shard-lean {
    will-change: transform;
  }
  .shard-core {
    display: inline-flex;
    align-items: center;
    gap: var(--space-8);
    padding: 9px 16px;
    border-radius: var(--radius-full);
    border: 1px solid var(--line-normal-normal);
    background: linear-gradient(150deg, rgba(35, 41, 47, 0.86), rgba(20, 23, 27, 0.92));
    color: var(--label-normal);
    font-size: calc(var(--font-size-body-2) * var(--s));
    white-space: nowrap;
    box-shadow: var(--shadow-e2);
    backdrop-filter: blur(8px);
    will-change: transform;
  }
  .pip {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--coral-red);
    box-shadow: 0 0 8px rgba(233, 83, 83, 0.7);
  }

  /* Mos as a sink, not a character — the full body would compete with the
     shards for attention at this size. */
  .sink {
    position: absolute;
    left: 50%;
    bottom: 4%;
    translate: -50% 0;
    width: 84px;
    height: 84px;
    display: grid;
    place-items: center;
  }
  .sink-core {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: radial-gradient(circle at 34% 30%, #3d8bee, #0f2f5e 72%);
    box-shadow:
      0 0 0 1px rgba(49, 220, 220, 0.32),
      0 0 34px rgba(31, 206, 206, 0.34);
  }
  .sink-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid rgba(49, 220, 220, 0.4);
    opacity: 0;
  }

  .hint {
    position: absolute;
    left: 50%;
    bottom: -6px;
    translate: -50% 0;
    font-size: var(--font-size-caption-2);
    color: var(--label-assistive);
    white-space: nowrap;
    transition: opacity var(--duration-slow) var(--ease-out);
  }
  .hint.hidden {
    opacity: 0;
  }

  .gain {
    color: var(--bright-cyan);
    max-width: 30ch;
  }

  @media (max-width: 760px) {
    .field {
      height: 380px;
    }
    .shard-core {
      padding: 7px 13px;
      font-size: var(--font-size-caption-1);
    }
  }
</style>
