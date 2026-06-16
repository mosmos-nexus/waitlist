import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

// Map localized paths (e.g. `/en/privacy`) back to their canonical route (`/privacy`)
// so SvelteKit's router resolves a single set of routes for both locales.
export const reroute: Reroute = (request) => deLocalizeUrl(request.url).pathname;
