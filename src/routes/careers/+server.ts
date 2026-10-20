import { redirect, type RequestHandler } from '@sveltejs/kit';

// The team and hiring page lives in Notion. /en/careers and /ja/careers reach
// this handler through the locale reroute in hooks.ts, so one route covers all
// three. 308 keeps the method and lets crawlers update the link.
const TEAM_PAGE = 'https://mosmos-world.notion.site/mosmos-team-specialist-investor-building';

export const GET: RequestHandler = () => redirect(308, TEAM_PAGE);
