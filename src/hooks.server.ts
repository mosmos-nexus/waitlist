import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

// Resolve the locale from the URL (KO `/`, EN `/en`, JA `/ja`), expose it to SSR, and stamp
// the document <html lang> so each localized page ships correct, complete HTML.
export const handle: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
    });
  });
