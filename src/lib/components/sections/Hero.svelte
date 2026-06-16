<script lang="ts">
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import Confirmation from '$lib/components/Confirmation.svelte';
  import { m } from '$lib/paraglide/messages.js';

  let result = $state<{ id: string; emailSent: boolean } | null>(null);
</script>

<section class="hero">
  <div class="glow" aria-hidden="true"></div>
  <div class="container grid">
    <div class="copy">
      <h1 class="tagline">{m.hero_tagline()}</h1>
      <div class="lead">
        <p class="slogan">{m.hero_slogan()}</p>
        <p class="gloss">{m.hero_mos_gloss()}</p>
      </div>
      <p class="target">{m.hero_target()}</p>

      <div class="cta-zone">
        {#if result}
          <Confirmation pageId={result.id} emailSent={result.emailSent} />
        {:else}
          <WaitlistForm onSuccess={(r) => (result = r)} />
        {/if}
      </div>
    </div>

    {#if !result}
      <div class="art" aria-hidden="true">
        <img
          src="/characters/mos-greeting.webp"
          alt=""
          width={280}
          height={280}
          fetchpriority="high"
        />
      </div>
    {/if}
  </div>
</section>

<style>
  .hero {
    position: relative;
    overflow: hidden;
    background: var(--gradient-sky);
    border-bottom: 1px solid var(--border-subtle);
  }
  .glow {
    position: absolute;
    top: -160px;
    right: -120px;
    width: 520px;
    height: 520px;
    background: radial-gradient(circle, rgba(15, 111, 218, 0.18) 0%, transparent 70%);
    filter: blur(20px);
    pointer-events: none;
  }
  .grid {
    position: relative;
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    align-items: center;
    gap: var(--space-2xl);
    padding-block: clamp(48px, 9vw, 112px);
  }
  .copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  .tagline {
    font-size: var(--fs-display);
    line-height: var(--lh-display);
    letter-spacing: var(--tracking-tight);
  }
  .lead {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  .slogan {
    margin: 0;
    font-size: var(--fs-subtitle);
    font-weight: var(--fw-medium);
    color: var(--text-strong);
  }
  .gloss {
    margin: 0;
    font-size: var(--fs-body-sm);
    color: var(--text-muted);
  }
  .target {
    margin: 0;
    font-size: var(--fs-body);
    font-weight: var(--fw-medium);
    color: var(--text-body);
  }
  /* Owns the value→CTA separation in one place. */
  .cta-zone {
    margin-top: var(--space-lg);
  }
  .art {
    display: flex;
    justify-content: center;
  }
  .art img {
    width: clamp(180px, 26vw, 280px);
    height: auto;
  }
  @media (max-width: 880px) {
    .grid {
      grid-template-columns: 1fr;
      gap: var(--space-lg);
    }
    .art img {
      width: 150px;
    }
  }
  /* Mobile: lead with copy + form so the CTA stays above the fold (DoD §1). */
  @media (max-width: 640px) {
    .art {
      display: none;
    }
    /* Compress dead vertical space so the single CTA rises toward the fold. */
    .grid {
      padding-block: clamp(28px, 7vw, 48px);
    }
    .copy {
      gap: var(--space-sm);
    }
    .cta-zone {
      margin-top: var(--space-base);
    }
  }
</style>
