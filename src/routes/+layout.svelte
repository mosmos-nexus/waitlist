<script lang="ts">
  import '../app.css';
  import { dev } from '$app/environment';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';
  import favicon from '$lib/assets/favicon.svg';
  import Logo from '$lib/components/ui/Logo.svelte';
  import LanguageToggle from '$lib/components/ui/LanguageToggle.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import { localizeHref } from '$lib/paraglide/runtime';

  injectAnalytics({ mode: dev ? 'development' : 'production' });

  let { children } = $props();

  const year = new Date().getFullYear();
  const contactEmail = 'hello@mosmos.world';
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<a class="skip-link" href="#main">{m.skip_to_content()}</a>

<header class="site-header">
  <div class="container bar">
    <a href={localizeHref('/')} class="brand" aria-label="mosmos">
      <Logo height={26} />
    </a>
    <LanguageToggle />
  </div>
</header>

<main id="main">
  {@render children()}
</main>

<footer class="site-footer">
  <div class="container foot">
    <Logo height={22} />
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
    background: var(--color-primary);
    color: var(--color-on-primary);
    border-radius: var(--radius-pill);
    font-weight: var(--fw-semibold);
    transition: top var(--dur-fast) var(--ease-out);
  }
  .skip-link:focus {
    top: 12px;
  }

  .site-header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: color-mix(in srgb, var(--surface-page) 88%, transparent);
    backdrop-filter: saturate(1.4) blur(12px);
    border-bottom: 1px solid var(--border-subtle);
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
  }

  .site-footer {
    border-top: 1px solid var(--border-subtle);
    background: var(--surface-subtle);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-base) var(--space-lg);
    padding-block: var(--space-2xl);
  }
  .links {
    display: flex;
    gap: var(--space-lg);
    margin-right: auto;
  }
  .links a {
    color: var(--text-muted);
    font-size: var(--fs-body-sm);
  }
  .links a:hover {
    color: var(--text-strong);
  }
  .copy {
    color: var(--text-faint);
    font-size: var(--fs-caption);
  }
</style>
