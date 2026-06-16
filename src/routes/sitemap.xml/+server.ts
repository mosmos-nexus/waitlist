import type { RequestHandler } from './$types';

// Localized URL set (KO at `/…`, EN at `/en/…`) with hreflang alternates.
const PATHS = ['/', '/privacy'];

export const GET: RequestHandler = ({ url }) => {
  const origin = url.origin;
  const entries = PATHS.flatMap((path) => {
    const ko = origin + path;
    const en = origin + '/en' + (path === '/' ? '' : path);
    const alternates = `    <xhtml:link rel="alternate" hreflang="ko" href="${ko}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ko}"/>`;
    return [
      `  <url>\n    <loc>${ko}</loc>\n${alternates}\n  </url>`,
      `  <url>\n    <loc>${en}</loc>\n${alternates}\n  </url>`,
    ];
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
