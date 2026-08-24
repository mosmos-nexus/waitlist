<script lang="ts">
  import '../app.css';
  import { dev } from '$app/environment';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';
  import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
  import favicon from '$lib/assets/favicon.svg';
  import Logo from '$lib/components/ui/Logo.svelte';
  import LanguageToggle from '$lib/components/ui/LanguageToggle.svelte';
  import ManaCursor from '$lib/components/world/ManaCursor.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import { localizeHref } from '$lib/paraglide/runtime';

  injectAnalytics({ mode: dev ? 'development' : 'production' });
  injectSpeedInsights();

  let { children } = $props();

  const year = new Date().getFullYear();
  const contactEmail = 'hello@mosmos.world';
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<ManaCursor pokeHint={m.poke_hint()} />

<a class="skip-link" href="#main">{m.skip_to_content()}</a>

<header class="site-header">
  <div class="container bar">
    <a href={localizeHref('/')} class="brand" aria-label="mosmos">
      <Logo height={24} />
    </a>
    <LanguageToggle />
  </div>
</header>

<main id="main">
  {@render children()}
</main>

<footer class="site-footer">
  <div class="container foot">
    <Logo height={20} />
    <nav class="links" aria-label={m.footer_contact()}>
      <a href={localizeHref('/privacy')}>{m.footer_privacy()}</a>
      <a href="mailto:{contactEmail}">{m.footer_contact()}</a>
    </nav>
    <span class="copy">{m.footer_copyright({ year })}</span>
  </div>
</footer>

<style>
  .skip-link {
    position: absolute;
    left: 50%;
    top: -100px;
    transform: translateX(-50%);
    z-index: 100;
    padding: 10px 18px;
    background: var(--primary-normal);
    color: var(--static-white);
    border-radius: var(--radius-full);
    font-weight: var(--weight-semibold);
    transition: top var(--duration-fast) var(--ease-out);
  }
  .skip-link:focus {
    top: 12px;
  }

  /* The header floats over the hero's sky rather than sitting on a bar of its
     own — the island should be the first thing you see, uninterrupted. */
  .site-header {
    position: fixed;
    inset: 0 0 auto 0;
    z-index: 20;
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    /* Lifts the wordmark off the deep sky without a solid plate behind it */
    filter: drop-shadow(0 2px 10px rgba(8, 9, 15, 0.8));
  }

  .site-footer {
    border-top: 1px solid var(--line-normal-alternative);
    background: var(--color-blue-gray-10);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-16) var(--space-24);
    padding-block: var(--space-32);
  }
  .links {
    display: flex;
    gap: var(--space-24);
    margin-right: auto;
  }
  .links a {
    color: var(--label-alternative);
    font-size: var(--font-size-body-2);
  }
  .links a:hover {
    color: var(--label-strong);
  }
  .copy {
    color: var(--label-assistive);
    font-size: var(--font-size-caption-1);
  }
</style>
