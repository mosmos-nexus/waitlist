<script lang="ts">
  import '../app.css';
  import { dev } from '$app/environment';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';
  import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
  import favicon from '$lib/assets/favicon.svg';
  import Logo from '$lib/components/ui/Logo.svelte';
  import LanguageToggle from '$lib/components/ui/LanguageToggle.svelte';
  import { afterNavigate } from '$app/navigation';
  import { m, localizeHref, syncLocale } from '$lib/locale.svelte';

  injectAnalytics({ mode: dev ? 'development' : 'production' });
  injectSpeedInsights();

  let { children } = $props();

  const year = new Date().getFullYear();
  const contactEmail = 'hello@mosmos.world';

  // The URL is what paraglide resolves the locale from, so every landed
  // navigation is the moment to re-read it. See `syncLocale`.
  afterNavigate(syncLocale);
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

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

  /* A plain bar on paper, in the wireframes' own chrome: a hairline under it
     and nothing else. Fixed, so the email field stays one gesture away all the
     way down the page. */
  /* Monitor floats its bar over the world rather than banding it; the glass
     is the only thing separating the two. */
  .site-header {
    position: fixed;
    inset: 0 0 auto 0;
    z-index: 30;
    background: linear-gradient(rgba(7, 8, 12, 0.72), rgba(7, 8, 12, 0));
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
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
    position: relative;
    z-index: 1;
    border-top: 1px solid var(--glass-line-soft);
    background: rgba(7, 8, 12, 0.72);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
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
    color: var(--shell-meta);
    font-size: var(--font-size-body-2);
  }
  .links a:hover {
    color: var(--shell-text);
  }
  .copy {
    color: var(--shell-faint);
    font-size: var(--font-size-caption-1);
  }
</style>
