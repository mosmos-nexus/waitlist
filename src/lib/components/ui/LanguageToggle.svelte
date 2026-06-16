<script lang="ts">
  import { page } from '$app/state';
  import { getLocale, localizeHref, deLocalizeHref, locales } from '$lib/paraglide/runtime';

  const current = $derived(getLocale());
  // De-localize the current path, then build each locale's variant so the toggle
  // keeps the visitor on the same page in the other language.
  const basePath = $derived(deLocalizeHref(page.url.pathname));
</script>

<div class="lang" role="group" aria-label="Language / 언어">
  {#each locales as loc (loc)}
    <a
      href={localizeHref(basePath, { locale: loc })}
      hreflang={loc}
      aria-current={loc === current ? 'true' : undefined}
      class:active={loc === current}
      data-sveltekit-reload>{loc.toUpperCase()}</a
    >
  {/each}
</div>

<style>
  .lang {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px;
    background: var(--surface-subtle);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
  }
  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0 12px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: var(--fw-semibold);
    color: var(--text-muted);
    border-radius: var(--radius-pill);
    text-decoration: none;
  }
  a:hover {
    color: var(--text-strong);
    text-decoration: none;
  }
  a.active {
    color: var(--color-on-primary);
    background: var(--color-primary);
  }
</style>
