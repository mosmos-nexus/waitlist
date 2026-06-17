<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import { m } from '$lib/paraglide/messages.js';

  const steps = [
    {
      n: 1,
      name: () => m.how_step1_name(),
      desc: () => m.how_step1_desc(),
      icon: 'say',
      accent: 'blue',
    },
    {
      n: 2,
      name: () => m.how_step2_name(),
      desc: () => m.how_step2_desc(),
      icon: 'auto',
      accent: 'purple',
    },
    {
      n: 3,
      name: () => m.how_step3_name(),
      desc: () => m.how_step3_desc(),
      icon: 'done',
      accent: 'cyan',
    },
  ] as const;
</script>

<section class="section how">
  <div class="container">
    <div class="section-head center" use:reveal>
      <p class="eyebrow">{m.how_eyebrow()}</p>
      <h2 class="section-title">{m.how_title()}</h2>
      <p class="section-lead">{m.how_sub()}</p>
    </div>

    <div class="flow" use:reveal>
      <!-- Connector drawn left→right as the row reveals (desktop only). -->
      <svg class="connector" viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 1 H100" pathLength="1" />
      </svg>

      <ol class="steps">
        {#each steps as step (step.n)}
          <li class="step" style="--reveal-delay: {(step.n - 1) * 160}ms" use:reveal>
            <div class="card">
              <div class="icon" data-accent={step.accent} data-icon={step.icon}>
                {#if step.icon === 'say'}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="5" cy="12" r="2" fill="currentColor" />
                    <path
                      class="wave w1"
                      d="M9 8a6 6 0 0 1 0 8"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <path
                      class="wave w2"
                      d="M13 5a11 11 0 0 1 0 14"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                {:else if step.icon === 'auto'}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      class="spark s1"
                      d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"
                      fill="currentColor"
                    />
                    <path
                      class="spark s2"
                      d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"
                      fill="currentColor"
                    />
                  </svg>
                {:else}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      opacity="0.35"
                    />
                    <path
                      class="tick"
                      d="M7.5 12.5l3 3 6-7"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                {/if}
              </div>
              <span class="num" aria-hidden="true">{step.n}</span>
              <h3 class="name">{step.name()}</h3>
              <p class="desc">{step.desc()}</p>
            </div>
          </li>
        {/each}
      </ol>
    </div>
  </div>
</section>

<style>
  .how {
    background: var(--surface-subtle);
    border-block: 1px solid var(--border-subtle);
  }
  .section-head {
    margin-bottom: var(--space-3xl);
  }
  .flow {
    position: relative;
  }
  .connector {
    position: absolute;
    top: 44px;
    left: 12%;
    width: 76%;
    height: 2px;
    overflow: visible;
  }
  .connector path {
    stroke: var(--border-strong);
    stroke-width: 2;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
  }
  /* `is-in` is added at runtime by the reveal action — keep it global so the
     scoper doesn't prune this line-draw rule. */
  .flow:global(.is-in) .connector path {
    transition: stroke-dashoffset 1.1s var(--ease-out) 0.25s;
    stroke-dashoffset: 0;
  }

  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-lg);
  }
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
    height: 100%;
    padding: var(--space-lg);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-e1);
    transition:
      box-shadow var(--dur-base) var(--ease-out),
      transform var(--dur-base) var(--ease-out);
  }
  .card:hover {
    box-shadow: var(--shadow-e2);
    transform: translateY(-3px);
  }
  .icon {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
  }
  .icon svg {
    width: 26px;
    height: 26px;
  }
  .icon[data-accent='blue'] {
    background: rgba(15, 111, 218, 0.1);
    color: var(--blue-core);
  }
  .icon[data-accent='purple'] {
    background: rgba(155, 110, 239, 0.12);
    color: var(--purple-pop);
  }
  .icon[data-accent='cyan'] {
    background: rgba(0, 160, 163, 0.12);
    color: var(--cyan-bright);
  }
  .num {
    position: absolute;
    top: var(--space-base);
    right: var(--space-base);
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-h3);
    color: var(--border-light-strong);
    line-height: 1;
  }
  .name {
    font-size: var(--fs-h3);
    line-height: var(--lh-h3);
  }
  .desc {
    margin: 0;
    color: var(--text-muted);
    line-height: var(--lh-body);
  }

  /* Hover icon micro-motion (음파 / 스파클 / 체크). */
  .wave {
    transform-box: fill-box;
    transform-origin: left center;
  }
  .card:hover .icon[data-icon='say'] .w1 {
    animation: ping 1.1s var(--ease-out) infinite;
  }
  .card:hover .icon[data-icon='say'] .w2 {
    animation: ping 1.1s var(--ease-out) 0.18s infinite;
  }
  @keyframes ping {
    0% {
      opacity: 0.3;
      transform: scale(0.85);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0.3;
      transform: scale(0.85);
    }
  }
  .spark {
    transform-box: fill-box;
    transform-origin: center;
  }
  .card:hover .icon[data-icon='auto'] .s1 {
    animation: twinkle 1.4s var(--ease-in-out) infinite;
  }
  .card:hover .icon[data-icon='auto'] .s2 {
    animation: twinkle 1.4s var(--ease-in-out) 0.4s infinite;
  }
  @keyframes twinkle {
    0%,
    100% {
      transform: scale(0.8) rotate(0deg);
      opacity: 0.65;
    }
    50% {
      transform: scale(1.05) rotate(10deg);
      opacity: 1;
    }
  }
  .tick {
    stroke-dasharray: 14;
    stroke-dashoffset: 0;
  }
  .card:hover .icon[data-icon='done'] .tick {
    animation: redraw 0.9s var(--ease-out);
  }
  @keyframes redraw {
    0% {
      stroke-dashoffset: 14;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }

  @media (max-width: 720px) {
    .steps {
      grid-template-columns: 1fr;
      gap: var(--space-md);
    }
    .connector {
      display: none;
    }
    .card {
      flex-direction: row;
      align-items: center;
      flex-wrap: wrap;
    }
    .card .desc {
      flex-basis: 100%;
    }
  }
</style>
