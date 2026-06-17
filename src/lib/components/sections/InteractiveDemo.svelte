<script lang="ts">
  import { onMount } from 'svelte';
  import { reveal } from '$lib/actions/reveal';
  import { m } from '$lib/paraglide/messages.js';

  // §2 timeline. 0=intro 1=user 2=내 AI 3=specialist working 4=result assembled
  // 5=내 AI closing 6=user closing (rest). Starts at the FINAL frame so SSR / no-JS /
  // reduced-motion render a complete, meaningful demo; motion users reset to 0 and play.
  const LAST = 6;
  const DUR = [700, 1500, 1500, 1900, 1700, 1400];

  let started = $state(false);
  let step = $state(LAST);
  let playing = $state(false);
  // Decided eagerly (not in onMount): the reveal action calls start() synchronously
  // during mount, before onMount runs — so a cached flag would still be false then and
  // the timeline would play for reduced-motion users (DoD §5). matchMedia is client-only;
  // on the server it's undefined and the SSR final frame already stands.
  const reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Scattered → assembled offsets for the result tiles (Mosaic motif).
  const tiles = [
    { dx: '-26px', dy: '-20px', d: '0ms' },
    { dx: '24px', dy: '-14px', d: '70ms' },
    { dx: '-20px', dy: '16px', d: '140ms' },
    { dx: '18px', dy: '22px', d: '210ms' },
    { dx: '-14px', dy: '28px', d: '280ms' },
  ];

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  }
  function schedule() {
    clearTimer();
    if (!playing || step >= LAST) return;
    timer = setTimeout(() => {
      step += 1;
      if (step >= LAST) playing = false;
      else schedule();
    }, DUR[step]);
  }
  function start() {
    clearTimer();
    if (reduceMotion) {
      started = false; // keep the final frame
      return;
    }
    started = true;
    step = 0;
    playing = true;
    schedule();
  }
  function freeze() {
    clearTimer();
    playing = false;
  }
  function toggle() {
    if (step >= LAST) {
      start();
      return;
    }
    if (playing) freeze();
    else {
      playing = true;
      schedule();
    }
  }

  const vis = (n: number) => !started || step >= n;
  const progress = $derived(started ? Math.min(step, LAST) / LAST : 1);

  onMount(() => clearTimer);
</script>

<section class="section demo">
  <div class="container">
    <div class="head section-head center">
      <p class="eyebrow">{m.demo_eyebrow()}</p>
      <h2 class="section-title">{m.demo_title()}</h2>
      <p class="section-lead">{m.demo_sub()}</p>
    </div>

    <div
      class="stage"
      use:reveal={{
        replay: true,
        threshold: 0.25,
        rootMargin: '0px 0px 5% 0px',
        onReveal: start,
        onConceal: freeze,
      }}
    >
      <div class="window">
        <div class="winbar" aria-hidden="true">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          <span class="winlabel">mosmos</span>
        </div>

        <div class="thread">
          <div class="msg user" class:show={vis(1)}>
            <p class="bubble">{m.demo_chat_user()}</p>
          </div>

          <div class="msg ai" class:show={vis(2)}>
            <span class="avatar ai-orb" aria-hidden="true"></span>
            <p class="bubble">{m.demo_chat_ai()}</p>
          </div>

          <div class="expert" class:show={vis(3)} class:done={vis(4)} aria-hidden={!vis(3)}>
            <span class="expert-orb" aria-hidden="true"></span>
            <span class="expert-meta">
              <span class="expert-label">{m.demo_expert_label()}</span>
              <span class="expert-task">
                {#if vis(4)}
                  <svg class="check" viewBox="0 0 16 16" aria-hidden="true"
                    ><path
                      d="M3.5 8.5l3 3 6-7"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    /></svg
                  >
                {:else}
                  {m.demo_expert_task()}<span class="typing" aria-hidden="true"
                    ><i></i><i></i><i></i></span
                  >
                {/if}
              </span>
            </span>
          </div>

          <div class="result" class:built={vis(4)}>
            <span
              class="tile result-tag"
              style:--dx={tiles[0].dx}
              style:--dy={tiles[0].dy}
              style:--d={tiles[0].d}
            >
              {m.demo_result_tag()}
            </span>
            <h3
              class="tile result-title"
              style:--dx={tiles[1].dx}
              style:--dy={tiles[1].dy}
              style:--d={tiles[1].d}
            >
              {m.demo_result_title()}
            </h3>
            <ul class="result-list">
              <li
                class="tile"
                style:--dx={tiles[2].dx}
                style:--dy={tiles[2].dy}
                style:--d={tiles[2].d}
              >
                {m.demo_result_l1()}
              </li>
              <li
                class="tile"
                style:--dx={tiles[3].dx}
                style:--dy={tiles[3].dy}
                style:--d={tiles[3].d}
              >
                {m.demo_result_l2()}
              </li>
              <li
                class="tile"
                style:--dx={tiles[4].dx}
                style:--dy={tiles[4].dy}
                style:--d={tiles[4].d}
              >
                {m.demo_result_l3()}
              </li>
            </ul>
          </div>

          <div class="msg ai" class:show={vis(5)}>
            <span class="avatar ai-orb" aria-hidden="true"></span>
            <p class="bubble">{m.demo_chat_ai2()}</p>
          </div>

          <div class="msg user" class:show={vis(6)}>
            <p class="bubble">{m.demo_chat_user2()}</p>
          </div>
        </div>
      </div>

      {#if started}
        <div class="controls">
          <button
            type="button"
            class="ctrl"
            onclick={toggle}
            aria-label={playing ? m.demo_pause() : m.demo_play()}
          >
            {#if playing}
              <svg viewBox="0 0 16 16" aria-hidden="true"
                ><rect x="4" y="3" width="3" height="10" rx="1" /><rect
                  x="9"
                  y="3"
                  width="3"
                  height="10"
                  rx="1"
                /></svg
              >
            {:else}
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5z" /></svg>
            {/if}
          </button>
          <div class="track" aria-hidden="true">
            <span class="fill" style:transform="scaleX({progress})"></span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  .demo {
    background: var(--surface-subtle);
    border-bottom: 1px solid var(--border-subtle);
  }
  .head {
    margin-bottom: var(--space-2xl);
  }

  .stage {
    max-width: 600px;
    margin-inline: auto;
  }
  .window {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-e2);
    overflow: hidden;
  }
  .winbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: var(--space-md) var(--space-base);
    border-bottom: 1px solid var(--border-subtle);
    background: var(--surface-subtle);
  }
  .winbar .dot {
    width: 9px;
    height: 9px;
    border-radius: var(--radius-pill);
    background: var(--border-light-strong);
  }
  .winlabel {
    margin-left: var(--space-sm);
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    color: var(--text-faint);
    letter-spacing: var(--tracking-wide);
  }

  .thread {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-lg);
    min-height: 420px;
  }

  /* Bubbles: hidden until their step, then slide up. transform/opacity only. */
  .msg {
    display: flex;
    align-items: flex-end;
    gap: var(--space-sm);
    opacity: 0;
    transform: translateY(10px);
    transition:
      opacity 0.45s var(--ease-out),
      transform 0.45s var(--ease-out);
  }
  .msg.show {
    opacity: 1;
    transform: none;
  }
  .msg.user {
    justify-content: flex-end;
  }
  .bubble {
    margin: 0;
    max-width: 78%;
    padding: 10px 14px;
    font-size: var(--fs-body-sm);
    line-height: var(--lh-body-sm);
    border-radius: var(--radius-lg);
  }
  .msg.user .bubble {
    background: var(--color-primary);
    color: var(--color-on-primary);
    border-bottom-right-radius: var(--radius-sm);
  }
  .msg.ai .bubble {
    background: var(--surface-sunken);
    color: var(--text-body);
    border-bottom-left-radius: var(--radius-sm);
  }
  .avatar {
    flex: none;
    width: 30px;
    height: 30px;
    border-radius: var(--radius-pill);
  }
  .ai-orb {
    background: radial-gradient(circle at 32% 30%, #9cbde9, var(--blue-core));
    box-shadow: 0 2px 8px rgba(15, 111, 218, 0.3);
  }

  /* Specialist — slides out from behind the 내 AI side, works, then checks off. */
  .expert {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-left: 38px;
    padding: 8px 12px;
    width: fit-content;
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
    box-shadow: var(--shadow-e1);
    opacity: 0;
    transform: translateX(-14px) scale(0.9);
    transition:
      opacity 0.45s var(--ease-out),
      transform 0.45s var(--ease-out);
  }
  .expert.show {
    opacity: 1;
    transform: none;
  }
  .expert-orb {
    width: 22px;
    height: 22px;
    border-radius: var(--radius-pill);
    background: radial-gradient(circle at 32% 30%, #c4a6f6, var(--purple-pop));
    box-shadow: 0 2px 7px rgba(155, 110, 239, 0.35);
    animation: expert-bob 2.4s var(--ease-in-out) infinite;
  }
  @keyframes expert-bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-2px);
    }
  }
  .expert-meta {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }
  .expert-label {
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    color: var(--purple-pop);
  }
  .expert-task {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-caption);
    color: var(--text-muted);
  }
  .check {
    width: 14px;
    height: 14px;
    color: var(--status-success);
  }
  .typing {
    display: inline-flex;
    gap: 3px;
    margin-left: 2px;
  }
  .typing i {
    width: 4px;
    height: 4px;
    border-radius: var(--radius-pill);
    background: var(--text-faint);
    animation: typing 1.2s var(--ease-in-out) infinite;
  }
  .typing i:nth-child(2) {
    animation-delay: 0.2s;
  }
  .typing i:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes typing {
    0%,
    100% {
      opacity: 0.3;
      transform: translateY(0);
    }
    50% {
      opacity: 1;
      transform: translateY(-2px);
    }
  }

  /* Result — the climax: scattered tiles assemble into the deliverable card. */
  .result {
    align-self: flex-start;
    margin-left: 38px;
    width: min(86%, 340px);
    padding: var(--space-base);
    background: var(--surface-card);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-e2);
    opacity: 0;
    transform: translateY(12px) scale(0.98);
    transition:
      opacity 0.5s var(--ease-out),
      transform 0.5s var(--ease-out);
  }
  .result.built {
    opacity: 1;
    transform: none;
  }
  .tile {
    opacity: 0;
    transform: translate(var(--dx, 0), var(--dy, 0)) scale(0.85);
    transition:
      opacity 0.5s var(--ease-out),
      transform 0.5s var(--ease-out);
    transition-delay: var(--d, 0ms);
  }
  .result.built .tile {
    opacity: 1;
    transform: none;
  }
  .result-tag {
    display: inline-block;
    margin-bottom: var(--space-sm);
    padding: 3px 10px;
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    color: var(--cyan-bright);
    background: rgba(0, 160, 163, 0.12);
    border-radius: var(--radius-pill);
  }
  .result-title {
    font-size: var(--fs-subtitle);
    line-height: var(--lh-subtitle);
    color: var(--text-strong);
    margin: 0 0 var(--space-md);
  }
  .result-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  .result-list li {
    position: relative;
    padding-left: 20px;
    font-size: var(--fs-body-sm);
    color: var(--text-body);
  }
  .result-list li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 7px;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: var(--gradient-brand);
  }

  .controls {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin-top: var(--space-base);
    padding-inline: var(--space-xs);
  }
  .ctrl {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--control-md);
    height: var(--control-md);
    border-radius: var(--radius-pill);
    border: 1px solid var(--border-default);
    background: var(--surface-card);
    color: var(--text-strong);
    cursor: pointer;
    touch-action: manipulation;
    transition:
      background var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);
  }
  .ctrl:hover {
    background: rgba(15, 111, 218, 0.07);
    border-color: var(--border-strong);
  }
  .ctrl svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
  .track {
    flex: 1;
    height: 4px;
    border-radius: var(--radius-pill);
    background: var(--border-subtle);
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    width: 100%;
    border-radius: var(--radius-pill);
    background: var(--gradient-brand);
    transform-origin: left center;
    transition: transform var(--dur-slow) var(--ease-out);
  }

  @media (max-width: 480px) {
    .thread {
      padding: var(--space-base);
      min-height: 380px;
    }
    .result,
    .expert {
      margin-left: 0;
    }
    .bubble {
      max-width: 86%;
    }
  }
</style>
