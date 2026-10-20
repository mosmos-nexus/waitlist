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
      <Logo height={34} />
    </a>
    <div class="actions">
      <LanguageToggle />
      <!-- Absolute to the home page, so it also works from /privacy. -->
      <a class="to-waitlist" href={localizeHref('/') + '#waitlist'}>{m.nav_waitlist()}</a>
    </div>
  </div>
</header>

<main id="main">
  {@render children()}
</main>

<footer class="site-footer">
  <div class="container foot">
    <Logo height={24} />
    <nav class="links">
      <a href={localizeHref('/privacy')}>{m.footer_privacy()}</a>
      <a href="mailto:{contactEmail}">{m.footer_contact()}</a>
      <a href={localizeHref('/careers')} target="_blank" rel="noopener"
        >{m.footer_careers()}<span class="visually-hidden"> ({m.footer_new_tab()})</span></a
      >
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
    background: var(--primary-fill);
    color: var(--static-white);
    border-radius: var(--radius-full);
    font-weight: var(--weight-semibold);
    transition: top var(--duration-fast) var(--ease-out);
  }
  .skip-link:focus {
    top: 12px;
  }

  /* Sticky rather than fixed: it keeps its own 64px in the flow, so nothing
     has to be padded to clear it. Frosted so the page reads through. */
  .site-header {
    position: sticky;
    top: 0;
    z-index: 30;
    border-bottom: 1px solid var(--line-normal-alternative);
    background: rgba(247, 248, 249, 0.86);
    backdrop-filter: saturate(1.8) blur(12px);
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-12);
    height: var(--header-height);
  }
  .brand {
    display: inline-flex;
    align-items: center;
    flex: none;
    min-height: var(--control-m);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-8);
  }
  /* Secondary, so the hero's own button stays the page's one loud action.
     The transparent border keeps a 44px target around a 36px pill. */
  .to-waitlist {
    display: inline-flex;
    align-items: center;
    min-height: var(--control-m);
    padding-inline: var(--space-14);
    border: 4px solid transparent;
    border-radius: var(--radius-full);
    background: var(--background-card) padding-box;
    box-shadow: inset 0 0 0 1px var(--line-normal-normal);
    color: var(--label-strong);
    font-size: var(--font-size-label-2);
    font-weight: var(--weight-semibold);
    white-space: nowrap;
    transition: box-shadow var(--duration-base) var(--ease-out);
  }
  .to-waitlist:hover {
    box-shadow: inset 0 0 0 1px var(--primary-light);
    color: var(--primary-strong);
  }

  /* On a small phone the wordmark, three endonyms and the anchor cannot share
     one row (Japanese runs longest), so the lockup is cropped to its symbol. */
  @media (max-width: 380px) {
    .brand :global(img) {
      width: 39px;
      object-fit: cover;
      object-position: left;
    }
    .bar,
    .actions {
      gap: var(--space-4);
    }
    .to-waitlist {
      padding-inline: var(--space-8);
    }
  }

  .site-footer {
    border-top: 1px solid var(--line-normal-normal);
    background: var(--background-card);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-16) var(--space-24);
    min-height: 160px;
    padding-block: var(--space-40);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4) var(--space-24);
    margin-right: auto;
  }
  .links a {
    display: inline-flex;
    align-items: center;
    min-height: var(--control-m);
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
