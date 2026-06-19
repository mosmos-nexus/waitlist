<script lang="ts">
  import { onMount } from 'svelte';
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import { m } from '$lib/paraglide/messages.js';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
  }
  let { onSuccess }: Props = $props();

  // §1: desktop-only "living companion" gaze. Mos drifts a few px toward the
  // pointer (translate, never rotate/flip — DS character rule). Skipped on touch
  // and under reduced motion so the idle float is the only movement there.
  let art = $state<HTMLDivElement | null>(null);
  onMount(() => {
    if (!art) return;
    const finePointer = matchMedia('(pointer: fine)').matches;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reduce) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        art?.style.setProperty('--gaze-x', `${(x * 6).toFixed(2)}px`);
        art?.style.setProperty('--gaze-y', `${(y * 6).toFixed(2)}px`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  });
</script>

<section class="hero">
  <div class="aurora" aria-hidden="true"></div>
  <div class="particles" aria-hidden="true">
    <span></span><span></span><span></span><span></span><span></span><span></span>
  </div>

  <div class="container grid">
    <div class="copy">
      <h1 class="tagline">{m.hero_tagline()}</h1>
      <p class="sub">{m.hero_sub()}</p>
      <p class="anchor">{m.hero_anchor()}</p>

      <div class="form-wrap">
        <WaitlistForm {onSuccess} />
      </div>

      <p class="trust">
        <svg class="tick" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            d="M3.5 8.5l3 3 6-7"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {m.hero_trust()}
      </p>
    </div>

    <div class="art" bind:this={art} aria-hidden="true">
      <div class="halo"></div>
      <img
        class="mos"
        src="/characters/mos-greeting.webp"
        alt=""
        width={280}
        height={264}
        fetchpriority="high"
      />
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    overflow: hidden;
    background: var(--gradient-sky);
    border-bottom: 1px solid var(--border-subtle);
  }

  /* Ambient pastel aurora — Core Blue → Pop Purple, drifting slowly (transform only). */
  .aurora {
    position: absolute;
    inset: -25% -10% auto -10%;
    height: 720px;
    background:
      radial-gradient(38% 55% at 22% 30%, rgba(15, 111, 218, 0.22), transparent 70%),
      radial-gradient(34% 48% at 80% 22%, rgba(155, 110, 239, 0.2), transparent 72%),
      radial-gradient(30% 42% at 62% 68%, rgba(0, 160, 163, 0.14), transparent 70%);
    filter: blur(18px);
    pointer-events: none;
    animation: aurora-drift 24s var(--ease-in-out) infinite;
  }
  @keyframes aurora-drift {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(-3%, 2%, 0) scale(1.06);
    }
  }

  /* Floating round particles — Cosmos / 별빛 depth. */
  .particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .particles span {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: var(--radius-pill);
    background: radial-gradient(
      circle at 35% 35%,
      rgba(255, 255, 255, 0.9),
      rgba(156, 189, 233, 0.5)
    );
    opacity: 0.7;
    animation: particle-rise 14s linear infinite;
  }
  .particles span:nth-child(1) {
    left: 12%;
    bottom: -12px;
    animation-delay: 0s;
    transform: scale(0.7);
  }
  .particles span:nth-child(2) {
    left: 34%;
    bottom: -12px;
    animation-delay: 3.5s;
    transform: scale(1.1);
  }
  .particles span:nth-child(3) {
    left: 53%;
    bottom: -12px;
    animation-delay: 7s;
    transform: scale(0.6);
  }
  .particles span:nth-child(4) {
    left: 68%;
    bottom: -12px;
    animation-delay: 1.8s;
    transform: scale(0.9);
  }
  .particles span:nth-child(5) {
    left: 82%;
    bottom: -12px;
    animation-delay: 5.2s;
    transform: scale(0.75);
  }
  .particles span:nth-child(6) {
    left: 92%;
    bottom: -12px;
    animation-delay: 9s;
    transform: scale(0.5);
  }
  @keyframes particle-rise {
    0% {
      transform: translateY(0) scale(var(--s, 1));
      opacity: 0;
    }
    12% {
      opacity: 0.7;
    }
    90% {
      opacity: 0.5;
    }
    100% {
      transform: translateY(-560px) scale(var(--s, 1));
      opacity: 0;
    }
  }

  .grid {
    position: relative;
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    align-items: center;
    gap: var(--space-2xl);
    padding-block: clamp(56px, 9vw, 120px);
  }
  .copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-base);
    max-width: 560px;
  }
  .tagline {
    font-size: var(--fs-display);
    line-height: var(--lh-display);
    letter-spacing: var(--tracking-tight);
    text-wrap: balance;
  }
  .sub {
    margin: 0;
    font-size: var(--fs-subtitle);
    line-height: var(--lh-subtitle);
    color: var(--text-body);
  }
  /* Target anchor — names the category + who it's for within the first 5 seconds. */
  .anchor {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    align-self: flex-start;
    margin: 0;
    padding: 6px 14px;
    font-size: var(--fs-body-sm);
    font-weight: var(--fw-medium);
    color: var(--color-primary);
    background: rgba(15, 111, 218, 0.08);
    border-radius: var(--radius-pill);
  }

  /* Form gets the single focus: a one-time entrance glow draws the eye to the CTA.
     The field's own focus ring (Input.svelte) is the only focus affordance — the
     wrapper deliberately adds none, so focusing the email box never paints a stray
     ring around the whole form block. */
  .form-wrap {
    position: relative;
    margin-top: var(--space-sm);
    border-radius: var(--radius-lg);
  }
  .form-wrap::before {
    content: '';
    position: absolute;
    inset: -10px;
    border-radius: var(--radius-xl);
    background: radial-gradient(60% 80% at 30% 40%, rgba(0, 160, 163, 0.18), transparent 70%);
    opacity: 0;
    pointer-events: none;
    animation: cta-pulse 2s var(--ease-out) 0.5s 1;
  }
  @keyframes cta-pulse {
    0% {
      opacity: 0;
      transform: scale(0.98);
    }
    35% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.02);
    }
  }

  .trust {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    margin: var(--space-xs) 0 0;
    font-size: var(--fs-body-sm);
    color: var(--text-muted);
  }
  .tick {
    width: 18px;
    height: 18px;
    flex: none;
    color: var(--cyan-bright);
  }

  /* Right column — Mos idle float (translateY 6px / 5s) + gaze parallax on the wrapper. */
  .art {
    position: relative;
    display: flex;
    justify-content: center;
    transform: translate(var(--gaze-x, 0), var(--gaze-y, 0));
    transition: transform 0.6s var(--ease-out);
  }
  .halo {
    position: absolute;
    inset: 8% 14%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(15, 111, 218, 0.18), transparent 68%);
    filter: blur(14px);
    animation: halo-breathe 6s var(--ease-in-out) infinite;
  }
  .mos {
    position: relative;
    width: clamp(190px, 26vw, 280px);
    height: auto;
    animation: mos-float 5s var(--ease-in-out) infinite;
  }
  @keyframes mos-float {
    0%,
    100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-6px) scale(1.012);
    }
  }
  @keyframes halo-breathe {
    0%,
    100% {
      opacity: 0.7;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
  }

  @media (max-width: 880px) {
    .grid {
      grid-template-columns: 1fr;
      gap: var(--space-lg);
    }
  }
  /* Mobile: lead with copy + form so the single CTA stays near the fold (DoD §1). */
  @media (max-width: 640px) {
    .art {
      display: none;
    }
    .grid {
      padding-block: clamp(32px, 8vw, 56px);
    }
    .copy {
      gap: var(--space-md);
    }
  }
</style>
