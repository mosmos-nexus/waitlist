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
   * One promise and one field, nothing else — the pattern every high-converting
   * waitlist in the research shares. The island behind it is the demonstration;
   * the copy does not describe it, so the two never say the same thing twice.
   */
</script>

<section class="hero" aria-labelledby="hero-title">
  <div class="container inner">
    <div class="copy" data-claims-pointer>
      <span class="eyebrow" use:reveal>{m.hero_eyebrow()}</span>
      <h1 class="title" id="hero-title" use:reveal={{ delay: 60 }}>{m.hero_tagline()}</h1>
      <p class="sub" use:reveal={{ delay: 110 }}>{m.hero_sub()}</p>
      <p class="anchor" use:reveal={{ delay: 150 }}>{m.hero_anchor()}</p>

      <div class="form-slot" use:reveal={{ delay: 200 }}>
        <WaitlistForm {onSuccess} />
      </div>
    </div>
  </div>

  <span class="scroll-hint" aria-hidden="true">{m.hero_scroll()}</span>
</section>

<style>
  .hero {
    position: relative;
    display: flex;
    /*
     * Top-aligned while the layout is stacked. Centring made the copy's bottom
     * edge move with the viewport height — on a tall phone it sank far enough
     * to push the island off the bottom of the screen, and on a short one it
     * ran into it. Pinned to the top, the copy ends at roughly the same place
     * on every phone and the island can be placed once.
     */
    align-items: flex-start;
    min-height: 100svh;
    /* Clears the 96px header scrim, so the eyebrow is never read through it. */
    padding-top: clamp(84px, 12vh, 108px);
    padding-bottom: var(--space-64);
  }
  .inner {
    width: 100%;
  }
  .copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-14);
    max-width: 34rem;
  }

  .title {
    margin: 0;
    font-size: clamp(38px, 6.4vw, 64px);
    font-weight: 800;
    line-height: 1.16;
    letter-spacing: -0.03em;
    color: var(--shell-text);
    text-wrap: balance;
    /* The island is bright behind the copy on narrow screens. */
    text-shadow: 0 4px 28px rgba(7, 8, 12, 0.7);
  }
  .sub {
    margin: 0;
    font-size: clamp(17px, 2.2vw, 21px);
    line-height: 1.5;
    color: var(--shell-body);
    text-shadow: 0 2px 18px rgba(7, 8, 12, 0.7);
  }
  .anchor {
    margin: 0;
    font-size: var(--font-size-body-2);
    line-height: 1.6;
    color: var(--shell-meta);
  }

  .form-slot {
    margin-top: var(--space-10);
    width: 100%;
    max-width: 30rem;
  }
  .scroll-hint {
    position: absolute;
    left: 50%;
    bottom: var(--space-24);
    translate: -50% 0;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--shell-faint);
    white-space: nowrap;
  }
  .scroll-hint::after {
    content: '';
    display: block;
    width: 1px;
    height: 26px;
    margin: 8px auto 0;
    background: linear-gradient(rgba(174, 184, 194, 0.5), transparent);
  }

  /* While stacked the hint would land on the island, and the island is the
     better invitation. */
  @media (max-width: 719px) {
    .scroll-hint {
      display: none;
    }
  }
  /* Side by side from here: the copy gives up the right-hand half. */
  @media (min-width: 720px) {
    .hero {
      align-items: center;
    }
    .copy {
      max-width: 24rem;
    }
  }
  @media (min-width: 1000px) {
    .copy {
      max-width: 30rem;
    }
  }
</style>
