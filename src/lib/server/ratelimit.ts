import { Redis } from '@upstash/redis';
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from './env';

// Spec §6: rate-limit waitlist signups to 2 requests per IP per minute.
const LIMIT = 2;
const WINDOW_SECONDS = 60;

let client: Redis | null = null;

function getRedis(): Redis | null {
  if (client) return client;
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null;
  client = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
  return client;
}

/** Returns true when the request is within the limit. Fails open if Redis is unset. */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // not configured (e.g. local dev) — don't block
  const key = `waitlist:ratelimit:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }
  return count <= LIMIT;
}
