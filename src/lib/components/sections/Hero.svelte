<script lang="ts">
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import DemoBoard from '$lib/components/demo/DemoBoard.svelte';
  import { m } from '$lib/locale.svelte';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
  }
  let { onSuccess }: Props = $props();
</script>

<section class="hero" aria-labelledby="hero-title">
  <div class="container grid">
    <div class="copy">
      <p class="eyebrow"><span class="dot" aria-hidden="true"></span>{m.hero_eyebrow()}</p>
      <h1 id="hero-title">{m.hero_title()}</h1>
      <p class="sub">{m.hero_sub()}</p>
      <div class="form">
        <WaitlistForm {onSuccess} position="hero" />
      </div>
      <p class="micro">{m.hero_micro()}</p>
    </div>

    <div class="board">
      <DemoBoard />
    </div>
  </div>
</section>

<style>
  .hero {
    padding-block: var(--space-24) var(--space-56);
    background:
      radial-gradient(56% 48% at 82% 34%, rgba(15, 111, 218, 0.1), transparent 70%),
      var(--gradient-sky);
  }

  .grid {
    display: grid;
    gap: var(--space-40);
  }

  .copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--status-positive-fill);
    box-shadow: 0 0 0 3px rgba(79, 161, 54, 0.18);
  }

  h1 {
    margin-top: var(--space-12);
    font-size: var(--font-size-h1);
    font-weight: var(--weight-bold);
    line-height: var(--line-height-h1);
    letter-spacing: -0.03em;
    color: var(--label-strong);
    text-wrap: balance;
  }

  .sub {
    margin-top: var(--space-16);
    max-width: 34em;
    font-size: var(--font-size-lead);
    line-height: var(--line-height-lead);
    color: var(--label-alternative);
  }

  .form {
    width: 100%;
    margin-top: var(--space-24);
  }

  /* One caption stack under the CTA: same size, colour and rhythm as the
     form's own microcopy above it. */
  .micro {
    margin-top: var(--space-8);
    font-size: var(--font-size-caption-2);
    line-height: var(--line-height-label);
    color: var(--label-assistive);
  }

  /* The board's Mos avatar overhangs its top edge; leave it room. */
  .board {
    padding-top: 12px;
  }
  @media (min-width: 641px) {
    .board {
      padding-top: 42px;
    }
  }

  /* Phone: tighter, so the email field fits the first screen and the board's
     request and both lanes show under the form. The micro line goes — §4
     makes the same promise in full. */
  @media (max-width: 640px) {
    .hero {
      padding-top: var(--space-12);
    }
    .grid {
      gap: var(--space-12);
    }
    h1 {
      margin-top: var(--space-8);
    }
    .sub {
      margin-top: var(--space-10);
      font-size: 15px;
      line-height: var(--line-height-body-reading);
    }
    .form {
      margin-top: var(--space-16);
    }
    .form :global(form) {
      gap: var(--space-12);
    }
    .micro {
      display: none;
    }
  }

  @media (min-width: 1024px) {
    .hero {
      padding-block: var(--space-48) var(--space-80);
    }
    .grid {
      grid-template-columns: minmax(0, 1fr) min(560px, 48%);
      column-gap: clamp(40px, 4vw, 64px);
      align-items: center;
    }
    .sub {
      margin-top: var(--space-20);
    }
    .form {
      margin-top: var(--space-32);
    }
  }
</style>
