<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { deLocalizeHref, locales } from '$lib/paraglide/runtime';
  import { getLocale, localizeHref, rememberLocale } from '$lib/locale.svelte';
  import type { AppLocale } from '$lib/i18n';

  const current = $derived(getLocale());
  // De-localize the current path, then build each locale's variant so the toggle
  // keeps the visitor on the same page in the other language.
  const basePath = $derived(deLocalizeHref(page.url.pathname));

  /**
   * Switch in the client instead of reloading the document.
   *
   * The anchors keep working without JS — that is what SSR and crawlers see.
   * With JS, `goto` moves the URL — which is what paraglide resolves the locale
   * from — and the layout's `afterNavigate` then invalidates every reactive
   * message read so the copy re-renders in place. Nothing remounts, so the
   * island and the cursor keep running through the switch.
   */
  function switchTo(event: MouseEvent, loc: string, href: string) {
    // Let modified clicks and non-primary buttons behave like real links.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    event.preventDefault();
    if (loc === current) return;
    rememberLocale(loc as AppLocale);
    goto(href, { keepFocus: true, noScroll: true });
  }

  // Endonyms, not codes: readers pick their own language faster from its own
  // name than from an ISO abbreviation.
  const LABEL: Record<AppLocale, string> = {
    ko: '한국어',
    en: 'EN',
    ja: '日本語',
  };
  const label = (loc: string) => LABEL[loc as AppLocale] ?? loc.toUpperCase();
</script>

<div class="lang" role="group" aria-label="Language / 언어 / 言語">
  {#each locales as loc (loc)}
    {@const href = localizeHref(basePath, { locale: loc })}
    <a
      {href}
      hreflang={loc}
      lang={loc}
      aria-current={loc === current ? 'true' : undefined}
      class:active={loc === current}
      onclick={(event) => switchTo(event, loc, href)}>{label(loc)}</a
    >
  {/each}
</div>

<style>
  .lang {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    background: rgba(20, 23, 27, 0.6);
    border: 1px solid var(--line-normal-normal);
    border-radius: var(--radius-full);
    backdrop-filter: blur(10px);
  }
  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* 44px tap target is kept by the padding block below, not by min-width —
       three endonym labels would otherwise overflow narrow phones. */
    padding: 10px 12px;
    font-size: var(--font-size-caption-1);
    font-weight: var(--weight-semibold);
    color: var(--label-alternative);
    border-radius: var(--radius-full);
    white-space: nowrap;
    transition:
      background var(--duration-base) var(--ease-out),
      color var(--duration-base) var(--ease-out);
  }
  a:hover {
    color: var(--label-strong);
    background: var(--fill-weak);
  }
  a.active {
    color: var(--static-white);
    background: var(--primary-normal);
  }
  a.active:hover {
    background: var(--primary-strong);
    color: var(--static-white);
  }

  @media (max-width: 400px) {
    a {
      padding: 10px 9px;
      font-size: var(--font-size-caption-2);
    }
  }
</style>
