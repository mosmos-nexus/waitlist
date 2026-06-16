import type { PageServerLoad } from './$types';
import { features } from '$lib/config/features';
import { getWaitlistCount } from '$lib/server/notion';

export const load: PageServerLoad = async () => {
  // Only hit Notion when the registrant-counter gate is enabled; off by default (§8).
  let registrantCount: number | null = null;
  if (features.registrantCounter) {
    try {
      registrantCount = await getWaitlistCount();
    } catch {
      registrantCount = null;
    }
  }
  return { registrantCount };
};
