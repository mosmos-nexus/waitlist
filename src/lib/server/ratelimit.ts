import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } from '$env/static/private';

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit {
	ratelimit ??= new Ratelimit({
		redis: new Redis({
			url: UPSTASH_REDIS_REST_URL,
			token: UPSTASH_REDIS_REST_TOKEN
		}),
		// 2 requests per minute per IP (sliding window).
		limiter: Ratelimit.slidingWindow(2, '1 m')
	});

	return ratelimit;
}

/** Returns whether the request is within the rate limit for the given identifier (IP). */
export async function checkRateLimit(identifier: string) {
	return getRatelimit().limit(identifier);
}
