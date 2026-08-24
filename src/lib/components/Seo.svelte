<script lang="ts">
  import { page } from '$app/state';
  import { getLocale, localizeHref, deLocalizeHref, locales } from '$lib/paraglide/runtime';

  interface Props {
    title: string;
    description: string;
    includeOrganization?: boolean;
  }
  let { title, description, includeOrganization = false }: Props = $props();

  const origin = $derived(page.url.origin);
  // Canonical/alternate links are built from the de-localized path so every locale
  // points at the right URL (KO `/…`, EN `/en/…`) — for hreflang + crawlers.
  const basePath = $derived(deLocalizeHref(page.url.pathname));
  const current = $derived(getLocale());
  const canonical = $derived(origin + localizeHref(basePath, { locale: current }));
  const alternates = $derived(
    locales.map((locale) => ({ locale, href: origin + localizeHref(basePath, { locale }) })),
  );
  const xDefault = $derived(origin + localizeHref(basePath, { locale: 'ko' }));
  // og:locale wants a full language_TERRITORY tag, not the bare locale code.
  const OG_LOCALE: Record<string, string> = { ko: 'ko_KR', en: 'en_US', ja: 'ja_JP' };
  const ogLocale = $derived(OG_LOCALE[current] ?? 'ko_KR');
  const ogImage = $derived(`${origin}/og-${current}.png`);

  const orgJsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Mosmos',
      url: 'https://mosmos.world',
      logo: origin + '/brand/mosmos-symbol-gradient.svg',
      description,
      // Escape `<` so content can never break out of the <script> tag.
    }).replace(/</g, '\\u003c'),
  );
  const jsonLdTag = $derived(
    '<' + 'script type="application/ld+json">' + orgJsonLd + '</' + 'script>',
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  {#each alternates as alt (alt.locale)}
    <link rel="alternate" hreflang={alt.locale} href={alt.href} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={xDefault} />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Mosmos" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:locale" content={ogLocale} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={title} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />

  {#if includeOrganization}
    <!-- Static, app-controlled JSON-LD; `<` is escaped above. Safe to inject. -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html jsonLdTag}
  {/if}
</svelte:head>
