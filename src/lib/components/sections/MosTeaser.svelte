<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import { m } from '$lib/paraglide/messages.js';
</script>

<section class="section mos">
  <div class="container grid">
    <div class="visual" use:reveal aria-hidden="true">
      <div class="stage">
        <!-- Mosaic pieces that gently harden — the "쓸수록 숙련" sense (no revenue copy). -->
        <div class="mosaic">
          <span class="m1"></span><span class="m2"></span><span class="m3"></span>
          <span class="m4"></span><span class="m5"></span><span class="m6"></span>
        </div>
        <!-- A real Mon peeks from behind Mos (the "뒤따르는 전문가" relationship). -->
        <span class="mon-peek">
          <img src="/characters/mon-research.webp" alt="" width={68} height={68} loading="lazy" />
        </span>
        <div class="mos-hold">
          <div class="halo"></div>
          <img src="/characters/mos-working.webp" alt="" width={220} height={213} loading="lazy" />
        </div>
        <span class="nametag">Mos</span>
      </div>
    </div>

    <div class="copy">
      <p class="eyebrow" use:reveal>{m.mos_eyebrow()}</p>
      <h2 class="title" use:reveal style="--reveal-delay: 80ms">{m.mos_title()}</h2>
      <p class="gloss" use:reveal style="--reveal-delay: 160ms">{m.mos_gloss()}</p>

      <div class="skilled" use:reveal style="--reveal-delay: 240ms">
        <p class="skilled-head">{m.mos_skilled()}</p>
        <p class="skilled-sub">{m.mos_skilled_sub()}</p>
        <p class="hint">
          <span class="hint-dot" aria-hidden="true"></span>
          {m.mos_mon_hint()}
        </p>
      </div>
    </div>
  </div>
</section>

<style>
  .mos {
    background: var(--gradient-sky);
    border-bottom: 1px solid var(--border-subtle);
  }
  .grid {
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    align-items: center;
    gap: var(--space-3xl);
  }

  .visual {
    display: flex;
    justify-content: center;
  }
  .stage {
    position: relative;
    width: min(100%, 360px);
    height: 340px;
  }
  .mos-hold {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .mos-hold img {
    position: relative;
    z-index: 2;
    width: clamp(180px, 28vw, 220px);
    height: auto;
    animation: mos-float 5.5s var(--ease-in-out) infinite;
  }
  .halo {
    position: absolute;
    inset: 6% 4%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(15, 111, 218, 0.16), transparent 66%);
    filter: blur(16px);
  }
  @keyframes mos-float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-7px);
    }
  }
  .nametag {
    position: absolute;
    left: 50%;
    bottom: 18px;
    transform: translateX(-50%);
    z-index: 3;
    padding: 4px 14px;
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-body-sm);
    color: var(--color-on-primary);
    background: var(--gradient-brand);
    border-radius: var(--radius-pill);
    box-shadow: var(--shadow-e1);
  }
  /* Real Mon peeking out from behind Mos on a slow loop. */
  .mon-peek {
    position: absolute;
    left: 50%;
    top: 46%;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: var(--radius-pill);
    background: var(--surface-card);
    box-shadow:
      0 0 0 3px var(--mon-research),
      var(--shadow-e2);
    animation: peek 6.5s var(--ease-in-out) infinite;
  }
  .mon-peek img {
    width: 58px;
    height: 58px;
    border-radius: var(--radius-pill);
    object-fit: cover;
  }
  @keyframes peek {
    0%,
    100% {
      transform: translate(-40%, 0) scale(0.8);
      opacity: 0;
    }
    40%,
    66% {
      transform: translate(64%, -8px) scale(1);
      opacity: 1;
    }
  }
  .mosaic {
    position: absolute;
    inset: 0;
  }
  .mosaic span {
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 5px;
    background: var(--gradient-brand);
    opacity: 0.5;
    animation: harden 4.5s var(--ease-in-out) infinite;
  }
  .mosaic .m1 {
    left: 8%;
    top: 18%;
    animation-delay: 0s;
  }
  .mosaic .m2 {
    left: 84%;
    top: 26%;
    animation-delay: 0.5s;
  }
  .mosaic .m3 {
    left: 16%;
    top: 70%;
    animation-delay: 1s;
  }
  .mosaic .m4 {
    left: 78%;
    top: 74%;
    animation-delay: 1.5s;
  }
  .mosaic .m5 {
    left: 4%;
    top: 46%;
    animation-delay: 2s;
  }
  .mosaic .m6 {
    left: 90%;
    top: 52%;
    animation-delay: 2.5s;
  }
  @keyframes harden {
    0%,
    100% {
      opacity: 0.32;
      transform: scale(0.82);
    }
    50% {
      opacity: 0.85;
      transform: scale(1);
    }
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-base);
    max-width: 520px;
  }
  .title {
    font-size: var(--fs-h1);
    line-height: var(--lh-h1);
    letter-spacing: var(--tracking-tight);
  }
  .gloss {
    margin: 0;
    font-size: var(--fs-subtitle);
    line-height: var(--lh-subtitle);
    color: var(--text-body);
    white-space: pre-line;
  }
  .skilled {
    margin-top: var(--space-sm);
    padding: var(--space-lg);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-e1);
  }
  .skilled-head {
    margin: 0 0 var(--space-xs);
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-h3);
    color: var(--text-strong);
  }
  .skilled-sub {
    margin: 0;
    color: var(--text-muted);
    line-height: var(--lh-body);
  }
  .hint {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    margin: var(--space-md) 0 0;
    font-size: var(--fs-body-sm);
    color: var(--mon-research);
  }
  .hint-dot {
    width: 10px;
    height: 10px;
    flex: none;
    border-radius: var(--radius-pill);
    background: radial-gradient(circle at 34% 30%, #c4a6f6, var(--mon-research));
  }

  @media (max-width: 880px) {
    .grid {
      grid-template-columns: 1fr;
      gap: var(--space-xl);
    }
    .visual {
      order: -1;
    }
    .stage {
      height: 300px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .mos-hold img,
    .mosaic span {
      animation: none;
    }
    .mon-peek {
      animation: none;
      transform: translate(64%, -8px) scale(1);
      opacity: 1;
    }
  }
</style>
