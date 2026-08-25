<script lang="ts">
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import { m } from '$lib/locale.svelte';
  import { reveal } from '$lib/anime/motion';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
  }
  let { onSuccess }: Props = $props();

  /**
   * The opening.
   *
   * The visual is the product's own HUD, not an illustration of one: Monitor
   * keeps today's flow, the Heartbeat state and the next scheduled run in the
   * corners, and that is what a visitor will actually see on their first day.
   * Showing it plainly says more than an atmosphere piece can.
   */
</script>

<section class="hero section" aria-labelledby="hero-title">
  <div class="container inner">
    <div class="copy">
      <span class="eyebrow" use:reveal>{m.hero_eyebrow()}</span>
      <h1 class="t-display-2 title prewrap" id="hero-title" use:reveal={{ delay: 60 }}>
        {m.hero_tagline()}
      </h1>
      <p class="t-subtitle-1 lead prewrap" use:reveal={{ delay: 110 }}>{m.hero_sub()}</p>

      <div class="form-slot" use:reveal={{ delay: 160 }}>
        <WaitlistForm {onSuccess} />
      </div>

      <p class="trust" use:reveal={{ delay: 200 }}>
        <i class="dot" aria-hidden="true"></i>{m.hero_trust()}
      </p>
    </div>

    <!-- Monitor, at rest. Every figure here is the wireframe's own. -->
    <div class="hud" use:reveal={{ delay: 120, scale: true }}>
      <div class="hud-bar">
        <img
          class="mos"
          src="/characters/mos-greeting.webp"
          alt=""
          width="44"
          height="44"
          fetchpriority="high"
        />
        <span class="mos-name">Mos</span>
        <span class="mana tnum"><b translate="no">Mana</b> 1,420</span>
      </div>

      <div class="hud-body">
        <section class="panel">
          <h2 class="eyebrow">{m.hud_flow()}</h2>
          <ul class="flow">
            <li>
              <span class="flow-t">{m.hud_flow_1()}</span>
              <span class="flow-by tnum">{m.hud_flow_1_by()}</span>
            </li>
            <li>
              <span class="flow-t">{m.hud_flow_2()}</span>
              <span class="flow-by tnum">{m.hud_flow_2_by()}</span>
            </li>
          </ul>
        </section>

        <div class="strip">
          <section class="tile">
            <h2 class="eyebrow">{m.hud_beat()}</h2>
            <p class="tile-line">{m.hud_beat_state()}</p>
          </section>
          <section class="tile">
            <h2 class="eyebrow">{m.hud_cron()}</h2>
            <p class="tile-line tnum">{m.hud_cron_state()}</p>
          </section>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .hero {
    /* Clears the fixed header, plus a little more air than the standard rhythm */
    padding-top: clamp(104px, 11vw, 152px);
  }
  .inner {
    display: grid;
    gap: var(--space-40);
    align-items: center;
  }
  @media (min-width: 1000px) {
    .inner {
      grid-template-columns: minmax(0, 46fr) minmax(0, 54fr);
      gap: var(--space-64);
    }
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
    max-width: 44ch;
  }
  .title {
    color: var(--label-strong);
    letter-spacing: -0.02em;
    text-wrap: balance;
  }
  .lead {
    color: var(--label-alternative);
  }
  .form-slot {
    margin-top: var(--space-8);
    width: 100%;
  }
  .trust {
    display: inline-flex;
    align-items: center;
    gap: var(--space-8);
    margin: 0;
    font-size: var(--font-size-caption-1);
    color: var(--label-assistive);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--primary-normal);
  }

  /* ---- the HUD ---- */
  .hud {
    border: 1.5px solid var(--line-normal-normal);
    border-radius: 24px;
    background: var(--panel);
    overflow: hidden;
    box-shadow: var(--shadow-e2);
  }
  .hud-bar {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    padding: var(--space-12) var(--space-16);
    background: var(--card);
    border-bottom: 1.5px solid var(--line-normal-normal);
  }
  .mos {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--fill-normal);
    object-fit: contain;
  }
  .mos-name {
    font-size: var(--font-size-body-2);
    font-weight: var(--weight-semibold);
    color: var(--label-strong);
  }
  .mana {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--primary-strong);
  }
  .mana b {
    font-weight: 500;
  }

  .hud-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    padding: var(--space-16);
  }
  .panel,
  .tile {
    padding: var(--space-14);
    border: 1.5px solid var(--line-normal-normal);
    border-radius: 18px;
    background: var(--card);
  }
  .panel h2,
  .tile h2 {
    margin: 0 0 var(--space-10);
  }

  .flow {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .flow li {
    display: flex;
    align-items: baseline;
    gap: var(--space-12);
    padding: var(--space-8) 0;
    border-top: 1px dashed var(--line-normal-alternative);
  }
  .flow li:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .flow-t {
    flex: 1;
    min-width: 0;
    font-size: var(--font-size-caption-1);
    color: var(--label-normal);
  }
  .flow-by {
    flex: none;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--label-assistive);
  }

  .strip {
    display: grid;
    gap: var(--space-12);
  }
  @media (min-width: 560px) {
    .strip {
      grid-template-columns: 1fr 1fr;
    }
  }
  .tile-line {
    margin: 0;
    font-size: var(--font-size-caption-1);
    line-height: var(--line-height-body-reading);
    color: var(--label-alternative);
  }
</style>
