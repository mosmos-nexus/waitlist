import adapter from '@sveltejs/adapter-vercel';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
      },
      // SSR on every page (adapter-vercel serverless) — complete HTML for crawlers + LCP.
      adapter: adapter(),
    }),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      // URL-first: KO at `/`, EN at `/en` (deterministic SSR per URL for hreflang + crawlers).
      // Cookie persists the toggle choice; no forced Accept-Language redirect.
      strategy: ['url', 'cookie', 'baseLocale'],
      cookieName: 'mosmos-locale',
      urlPatterns: [
        {
          pattern: '/:path(.*)?',
          localized: [
            ['en', '/en/:path(.*)?'],
            ['ko', '/:path(.*)?'],
          ],
        },
      ],
    }),
  ],
  build: {
    target: 'es2022',
  },
});
