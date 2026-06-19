<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import { m } from '$lib/paraglide/messages.js';
</script>

<section class="section empathy">
  <div class="container grid">
    <div class="cut">
      <p class="eyebrow" use:reveal>{m.empathy_eyebrow()}</p>
      <p class="loss" use:reveal style="--reveal-delay: 120ms">{m.empathy_loss()}</p>
      <p class="gain" use:reveal style="--reveal-delay: 760ms">
        <span class="arrow" aria-hidden="true">→</span>
        {m.empathy_gain()}
      </p>
    </div>

    <div class="art" use:reveal style="--reveal-delay: 400ms" aria-hidden="true">
      <div class="scene">
        <span class="task task-a">{m.empathy_task1()}</span>
        <span class="task task-b">{m.empathy_task2()}</span>
        <span class="task task-c">{m.empathy_task3()}</span>
        <div class="mos-hold">
          <div class="halo"></div>
          <img src="/characters/mos-curious.webp" alt="" width={180} height={178} />
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .empathy {
    background: var(--surface-page);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 0.9fr;
    align-items: center;
    gap: var(--space-2xl);
  }
  .cut {
    display: flex;
    flex-direction: column;
    gap: var(--space-base);
    max-width: 520px;
  }
  .loss {
    margin: 0;
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-h2);
    line-height: var(--lh-h2);
    letter-spacing: var(--tracking-tight);
    color: var(--text-strong);
    white-space: pre-line;
  }
  .gain {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
    margin: 0;
    font-size: var(--fs-subtitle);
    line-height: var(--lh-subtitle);
    color: var(--color-primary);
    font-weight: var(--fw-medium);
  }
  .arrow {
    color: var(--cyan-bright);
    font-weight: var(--fw-bold);
  }

  .art {
    display: flex;
    justify-content: center;
  }
  .scene {
    position: relative;
    width: 100%;
    max-width: 320px;
    height: 280px;
  }
  .task {
    position: absolute;
    padding: 7px 13px;
    font-size: var(--fs-caption);
    font-weight: var(--fw-medium);
    color: var(--text-muted);
    background: var(--surface-card);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-pill);
    box-shadow: var(--shadow-e1);
  }
  .task-a {
    top: 8px;
    left: 18%;
    animation: drift 6s var(--ease-in-out) infinite;
  }
  .task-b {
    top: 40px;
    right: 6%;
    animation: drift 7s var(--ease-in-out) 0.8s infinite;
  }
  .task-c {
    top: 96px;
    left: 6%;
    animation: drift 6.6s var(--ease-in-out) 1.6s infinite;
  }
  @keyframes drift {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-7px);
    }
  }
  .mos-hold {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }
  .mos-hold img {
    position: relative;
    width: clamp(150px, 22vw, 180px);
    height: auto;
    animation: mos-float 5.5s var(--ease-in-out) infinite;
  }
  .halo {
    position: absolute;
    inset: 12% 8%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 160, 163, 0.16), transparent 68%);
    filter: blur(12px);
  }
  @keyframes mos-float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-6px);
    }
  }

  @media (max-width: 880px) {
    .grid {
      grid-template-columns: 1fr;
      gap: var(--space-lg);
    }
    .scene {
      height: 240px;
      margin-inline: auto;
    }
  }
</style>
