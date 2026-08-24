import type { RequestHandler } from './$types';
import { locales, baseLocale, localizeHref, type Locale } from '$lib/paraglide/runtime';

// Localized URL set with hreflang alternates. Both the locale list and each
// locale's path shape come from the paraglide runtime, so adding a locale in
// vite.config.ts is enough — this file needs no edit.
const PATHS = ['/', '/privacy'];

export const GET: RequestHandler = ({ url }) => {
  const origin = url.origin;

  const entries = PATHS.flatMap((path) => {
    const hrefFor = (locale: Locale) => origin + localizeHref(path, { locale });

    const alternates = [
      ...locales.map(
        (locale) =>
          `    <xhtml:link rel="alternate" hreflang="${locale}" href="${hrefFor(locale)}"/>`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${hrefFor(baseLocale)}"/>`,
    ].join('\n');

    // Every locale gets its own <url> entry, each carrying the full alternate set.
    return locales.map(
      (locale) => `  <url>\n    <loc>${hrefFor(locale)}</loc>\n${alternates}\n  </url>`,
    );
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml',
      'cache-control': 'public, max-age=3600',
    },
  });
};
