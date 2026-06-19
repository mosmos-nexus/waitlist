<script lang="ts">
  import { onMount } from 'svelte';
  import { reveal } from '$lib/actions/reveal';
  import { m } from '$lib/paraglide/messages.js';

  // §2 timeline (centerpiece). Mos doesn't just "split work three ways" — it SELECTS the
  // right specialist AIs (Mon) for the situation, some already in my 보관함(Inventory),
  // some fetched from the 공용 허브(Hub), then delegates and brings back ONE deliverable.
  //   0 = intro (window framed)
  //   1 = user states a goal
  //   2 = Mos: "I'll bring in the specialist AIs this needs" (Mos-character avatar)
  //   3 = the chosen Mons appear with their source (보관함/허브) and work (typing)
  //   4 = each Mon finishes (check) and the pieces assemble into ONE deliverable card
  //   5 = Mos hands back the finished deliverable ("the deck you asked for is ready")
  // Starts at the FINAL frame so SSR / no-JS / reduced-motion render a complete,
  // meaningful demo; motion users reset to 0 and play (DoD §5).
  const DUR = [650, 1500, 1600, 2400, 1500];
  const LAST = DUR.length;

  // The three sample Mons, each mapped to its documented domain + identity color, and
  // tagged with where Mos pulled it from — 'hub' (공용, brought in) vs 'inventory' (already mine).
  const mons = [
    {
      img: '/characters/mon-research.webp',
      label: () => m.demo_mon1_label(),
      task: () => m.demo_mon1_task(),
      tone: 'research',
      src: 'hub',
      delay: '0ms',
      from: '-30px',
    },
    {
      img: '/characters/mon-organize.webp',
      label: () => m.demo_mon2_label(),
      task: () => m.demo_mon2_task(),
      tone: 'organize',
      src: 'inventory',
      delay: '150ms',
      from: '0px',
    },
    {
      img: '/characters/mon-design.webp',
      label: () => m.demo_mon3_label(),
      task: () => m.demo_mon3_task(),
      tone: 'design',
      src: 'inventory',
      delay: '300ms',
      from: '30px',
    },
  ] as const;

  // Result lines — each fragment is tinted to the Mon that produced it and flies in
  // from that Mon's side as the card assembles (Mosaic motif).
  const lines = [
    { text: () => m.demo_result_l1(), tone: 'research', dx: '-22px', d: '60ms' },
    { text: () => m.demo_result_l2(), tone: 'organize', dx: '0px', d: '180ms' },
    { text: () => m.demo_result_l3(), tone: 'design', dx: '22px', d: '300ms' },
  ] as const;

  let started = $state(false);
  let step = $state(LAST);
  let playing = $state(false);
  // Decided eagerly (not in onMount): the reveal action calls start() synchronously
  // during mount, before onMount runs. matchMedia is client-only; on the server it's
  // undefined and the SSR final frame already stands.
  const reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer: ReturnType<typeof setTimeout> | undefined;

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
    <div class="head section-head center" use:reveal>
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
            <span class="avatar" aria-hidden="true">
              <img src="/characters/mos-happy.webp" alt="" width={30} height={30} loading="lazy" />
            </span>
            <p class="bubble">{m.demo_chat_ai()}</p>
          </div>

          <!-- The chosen Mons appear with their source (보관함/허브), work, then check off. -->
          <div class="team" class:show={vis(3)} class:done={vis(4)}>
            <ul class="mon-row">
              {#each mons as mon (mon.tone)}
                <li
                  class="mon"
                  data-tone={mon.tone}
                  style:--delay={mon.delay}
                  style:--from={mon.from}
                >
                  <span class="mon-art">
                    <img src={mon.img} alt="" width={44} height={44} loading="lazy" />
                  </span>
                  <span class="mon-meta">
                    <span class="mon-label">{mon.label()}</span>
                    <span class="mon-src" data-src={mon.src}>
                      {mon.src === 'hub' ? m.demo_src_hub() : m.demo_src_inventory()}
                    </span>
                  </span>
                  <span class="mon-task">
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
                      {mon.task()}<span class="typing" aria-hidden="true"
                        ><i></i><i></i><i></i></span
                      >
                    {/if}
                  </span>
                </li>
              {/each}
            </ul>
            <p class="mon-gloss">{m.demo_mon_gloss()}</p>
          </div>

          <!-- Climax: the colored pieces assemble into one finished deliverable. -->
          <div class="result" class:built={vis(4)}>
            <span class="result-tag">
              <svg class="deck-ico" viewBox="0 0 16 16" aria-hidden="true">
                <rect
                  x="2"
                  y="3"
                  width="12"
                  height="9"
                  rx="1.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M6 13h4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              {m.demo_result_tag()}
            </span>
            <h3 class="result-title">{m.demo_result_title()}</h3>
            <ul class="result-list">
              {#each lines as line (line.tone)}
                <li class="rline" data-tone={line.tone} style:--dx={line.dx} style:--d={line.d}>
                  {line.text()}
                </li>
              {/each}
            </ul>
          </div>

          <div class="msg ai" class:show={vis(5)}>
            <span class="avatar" aria-hidden="true">
              <img src="/characters/mos-happy.webp" alt="" width={30} height={30} loading="lazy" />
            </span>
            <p class="bubble">{m.demo_chat_ai2()}</p>
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
    min-height: 470px;
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
    max-width: 80%;
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
  /* Chat avatar is Mos itself (the living companion), not an anonymous orb. */
  .avatar {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-pill);
    background: var(--surface-card);
    box-shadow:
      0 0 0 1px var(--border-subtle),
      var(--shadow-e1);
    overflow: hidden;
  }
  .avatar img {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  /* Team — the chosen Mons appear staggered from behind Mos, bob while working. */
  .team {
    margin-left: 40px;
    opacity: 0;
    transform: translateY(8px);
    transition:
      opacity 0.45s var(--ease-out),
      transform 0.45s var(--ease-out);
  }
  .team.show {
    opacity: 1;
    transform: none;
  }
  .mon-row {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
  .mon {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px 6px 6px;
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-e1);
    opacity: 0;
    transform: translateX(var(--from, 0)) scale(0.86);
  }
  .team.show .mon {
    animation: mon-in 0.5s var(--ease-out) var(--delay, 0ms) forwards;
  }
  @keyframes mon-in {
    to {
      opacity: 1;
      transform: none;
    }
  }
  .mon-art {
    flex: none;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-pill);
    background: var(--surface-subtle);
    box-shadow: 0 0 0 2px var(--tone, var(--purple-pop));
    overflow: hidden;
  }
  .mon-art img {
    width: 34px;
    height: 34px;
    object-fit: cover;
    animation: mon-bob 2.6s var(--ease-in-out) infinite;
    animation-delay: var(--delay, 0ms);
  }
  .team.done .mon-art img {
    animation-play-state: paused;
  }
  @keyframes mon-bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-2px);
    }
  }
  .mon-meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .mon-label {
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    color: var(--tone, var(--text-strong));
    line-height: 1.2;
  }
  /* Tiny source chip — where Mos pulled this specialist from (보관함 vs 허브).
     Kept legible at mobile sizes: muted (not faint) + medium weight. */
  .mon-src {
    font-size: 11.5px;
    font-weight: var(--fw-medium);
    line-height: 1.2;
    color: var(--text-muted);
  }
  .mon-src[data-src='hub'] {
    color: var(--cyan-bright);
  }
  .mon-task {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-caption);
    color: var(--text-muted);
  }
  .mon[data-tone='research'] {
    --tone: var(--mon-research);
  }
  .mon[data-tone='organize'] {
    --tone: var(--mon-organize);
  }
  .mon[data-tone='design'] {
    --tone: var(--mon-design);
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
  .mon-gloss {
    margin: var(--space-sm) 0 0;
    font-size: var(--fs-caption);
    line-height: var(--lh-caption);
    color: var(--text-muted);
    white-space: pre-line;
  }

  /* Result — the colored pieces assemble into the finished deliverable card. */
  .result {
    align-self: flex-start;
    margin-left: 40px;
    width: min(86%, 360px);
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
  .result-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-bottom: var(--space-sm);
    padding: 3px 10px;
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    color: var(--cyan-bright);
    background: rgba(0, 160, 163, 0.12);
    border-radius: var(--radius-pill);
  }
  .deck-ico {
    width: 13px;
    height: 13px;
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
  .rline {
    position: relative;
    padding-left: 20px;
    font-size: var(--fs-body-sm);
    color: var(--text-body);
    opacity: 0;
    transform: translate(var(--dx, 0), 6px) scale(0.9);
    transition:
      opacity 0.5s var(--ease-out),
      transform 0.5s var(--ease-out);
    transition-delay: var(--d, 0ms);
  }
  .result.built .rline {
    opacity: 1;
    transform: none;
  }
  .rline::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 6px;
    width: 9px;
    height: 9px;
    border-radius: 3px;
    background: var(--tone, var(--blue-core));
  }
  .rline[data-tone='research'] {
    --tone: var(--mon-research);
  }
  .rline[data-tone='organize'] {
    --tone: var(--mon-organize);
  }
  .rline[data-tone='design'] {
    --tone: var(--mon-design);
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
      min-height: 440px;
    }
    .result,
    .team {
      margin-left: 0;
    }
    .bubble {
      max-width: 88%;
    }
  }

  /* Reduced motion: the eager reduceMotion guard keeps the final frame (started=false),
     so every bubble, the checked Mons, and the assembled card are already shown. Pin the
     idle bob too so nothing loops. */
  @media (prefers-reduced-motion: reduce) {
    .mon-art img {
      animation: none;
    }
    .team .mon {
      opacity: 1;
      transform: none;
      animation: none;
    }
  }
</style>
