import { env } from '$env/dynamic/private';

// Read at runtime (serverless) so secrets aren't required at build time.
export const NOTION_SECRET = env.NOTION_SECRET ?? '';
export const NOTION_DB = env.NOTION_DB ?? '';
export const RESEND_API_KEY = env.RESEND_API_KEY ?? '';
export const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL ?? 'Mosmos <hello@mosmos.world>';
export const UPSTASH_REDIS_REST_URL = env.UPSTASH_REDIS_REST_URL ?? '';
export const UPSTASH_REDIS_REST_TOKEN = env.UPSTASH_REDIS_REST_TOKEN ?? '';
