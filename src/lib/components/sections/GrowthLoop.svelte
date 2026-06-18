<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import { m } from '$lib/paraglide/messages.js';

  // The Grow Loop (성장 루프) — Mosmos's core 선순환, in warm benefit-first language:
  //   맡기기(소비) → 쌓이기(내 것이 된다) → 나누기(공유) → 돌아오기(환류).
  // Both the user and their AI grow together — "내 AI가 자라는 세계". 공개배포·정산은
  // post-MVP이므로 '나누기'는 거래색 없이 가볍게. Steps sit at the four CORNERS so the
  // centre Mos+Mon medallion is never occluded (the old cardinal layout overlapped).
  const nodes = [
    {
      n: 1,
      name: () => m.loop_step1_name(),
      desc: () => m.loop_step1_desc(),
      pos: 'tl',
      tone: 'blue',
    },
    {
      n: 2,
      name: () => m.loop_step2_name(),
      desc: () => m.loop_step2_desc(),
      pos: 'tr',
      tone: 'purple',
    },
    {
      n: 3,
      name: () => m.loop_step3_name(),
      desc: () => m.loop_step3_desc(),
      pos: 'br',
      tone: 'green',
    },
    {
      n: 4,
      name: () => m.loop_step4_name(),
      desc: () => m.loop_step4_desc(),
      pos: 'bl',
      tone: 'cyan',
    },
  ] as const;

  // The three Mons cluster around Mos at the centre — the specialists growing into "mine".
  const companions = [
    { img: '/characters/mon-research.webp', cls: 'a1' },
    { img: '/characters/mon-organize.webp', cls: 'a2' },
    { img: '/characters/mon-design.webp', cls: 'a3' },
  ];
</script>

<section class="section loop">
  <div class="container">
    <div class="section-head center" use:reveal>
      <p class="eyebrow">{m.loop_eyebrow()}</p>
      <h2 class="section-title">{m.loop_title()}</h2>
      <p class="section-lead">{m.loop_lead()}</p>
    </div>

    <div class="ring" use:reveal>
      <svg class="ring-track" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="loop-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="var(--blue-core)" />
            <stop offset="50%" stop-color="var(--purple-pop)" />
            <stop offset="100%" stop-color="var(--cyan-bright)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="40" />
      </svg>

      <div class="orbit" aria-hidden="true"><span class="spark"></span></div>

      <div class="world" aria-hidden="true">
        <div class="world-halo"></div>
        <img class="mos" src="/characters/mos-resting.webp" alt="" width={120} height={116} />
        <div class="mons">
          {#each companions as a (a.cls)}
            <span class="mon {a.cls}"><img src={a.img} alt="" width={28} height={28} /></span>
          {/each}
        </div>
      </div>

      <ol class="nodes">
        {#each nodes as node (node.n)}
          <li class="node" data-pos={node.pos} data-tone={node.tone}>
            <span class="badge">{node.n}</span>
            <span class="node-name">{node.name()}</span>
            <span class="node-desc">{node.desc()}</span>
          </li>
        {/each}
      </ol>
    </div>

    <p class="kicker" use:reveal>{m.loop_kicker()}</p>
  </div>
</section>

<style>
  .loop {
    background: var(--surface-page);
    border-bottom: 1px solid var(--border-subtle);
  }
  .section-head {
    margin-bottom: var(--space-2xl);
  }

  .ring {
    position: relative;
    width: min(100%, 500px);
    aspect-ratio: 1;
    margin-inline: auto;
  }

  .ring-track {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .ring-track circle {
    fill: none;
    stroke: url(#loop-grad);
    stroke-width: 0.5;
    stroke-dasharray: 1.6 2.2;
    stroke-linecap: round;
    opacity: 0.5;
  }

  /* A spark circulates the loop clockwise — the "선순환 / 다시 돌아온다" sense. */
  .orbit {
    position: absolute;
    inset: 0;
    animation: orbit-spin 9s linear infinite;
  }
  @keyframes orbit-spin {
    to {
      transform: rotate(360deg);
    }
  }
  .spark {
    position: absolute;
    top: 10%;
    left: 50%;
    width: 14px;
    height: 14px;
    transform: translate(-50%, -50%);
    border-radius: var(--radius-pill);
    background: radial-gradient(circle at 35% 35%, #ffffff, var(--blue-core));
    box-shadow: 0 0 12px 2px rgba(15, 111, 218, 0.45);
  }

  /* Centre medallion: Mos with the three Mons clustered close, fully inside its own
     safe zone so the corner step cards never cover it. */
  .world {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    width: clamp(150px, 38%, 190px);
    aspect-ratio: 1;
  }
  .world-halo {
    position: absolute;
    inset: 6%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(15, 111, 218, 0.14), transparent 68%);
    filter: blur(14px);
  }
  .world .mos {
    position: relative;
    z-index: 2;
    width: clamp(94px, 58%, 124px);
    height: auto;
    animation: float 6s var(--ease-in-out) infinite;
  }
  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
  .mons {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }
  .mon {
    position: absolute;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: var(--radius-pill);
    background: var(--surface-card);
    box-shadow: var(--shadow-e1);
    animation: float 5s var(--ease-in-out) infinite;
  }
  .mon img {
    width: 26px;
    height: 26px;
    border-radius: var(--radius-pill);
    object-fit: cover;
  }
  .mon.a1 {
    left: 0;
    bottom: 8%;
    box-shadow:
      0 0 0 2px var(--mon-research),
      var(--shadow-e1);
    animation-delay: 0s;
  }
  .mon.a2 {
    right: -2%;
    bottom: 18%;
    box-shadow:
      0 0 0 2px var(--mon-organize),
      var(--shadow-e1);
    animation-delay: 0.6s;
  }
  .mon.a3 {
    right: 8%;
    top: 0;
    box-shadow:
      0 0 0 2px var(--mon-design),
      var(--shadow-e1);
    animation-delay: 1.2s;
  }

  .nodes {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .node {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: clamp(128px, 28%, 162px);
    padding: var(--space-md) var(--space-base);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-e1);
    text-align: center;
    align-items: center;
  }
  .node[data-pos='tl'] {
    top: 0;
    left: 0;
  }
  .node[data-pos='tr'] {
    top: 0;
    right: 0;
  }
  .node[data-pos='br'] {
    bottom: 0;
    right: 0;
  }
  .node[data-pos='bl'] {
    bottom: 0;
    left: 0;
  }
  .badge {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: var(--radius-pill);
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-body-sm);
    color: var(--color-on-primary);
    background: var(--tone, var(--blue-core));
  }
  .node[data-tone='blue'] {
    --tone: var(--blue-core);
  }
  .node[data-tone='purple'] {
    --tone: var(--purple-pop);
  }
  .node[data-tone='green'] {
    --tone: var(--mon-organize);
  }
  .node[data-tone='cyan'] {
    --tone: var(--cyan-bright);
  }
  .node-name {
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-body);
    color: var(--text-strong);
  }
  .node-desc {
    font-size: var(--fs-caption);
    line-height: var(--lh-caption);
    color: var(--text-muted);
  }

  .kicker {
    max-width: var(--width-reading);
    margin: var(--space-2xl) auto 0;
    text-align: center;
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-h3);
    line-height: var(--lh-h3);
    color: var(--text-strong);
    text-wrap: balance;
  }

  /* Mobile: drop the ring, stack the world medallion above a vertical step list. */
  @media (max-width: 720px) {
    .ring {
      width: 100%;
      aspect-ratio: auto;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-lg);
    }
    .ring-track,
    .orbit {
      display: none;
    }
    .world {
      position: static;
      transform: none;
      width: 168px;
    }
    .nodes {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      width: 100%;
    }
    .node {
      position: static;
      width: 100%;
      flex-direction: row;
      gap: var(--space-md);
      text-align: left;
      align-items: center;
    }
    .badge {
      flex: none;
    }
    .node-desc {
      flex-basis: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .orbit,
    .world .mos,
    .mon {
      animation: none;
    }
    .spark {
      opacity: 0.8;
    }
  }
</style>
