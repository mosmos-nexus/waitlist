import { json } from '@sveltejs/kit';
import { sendWelcomeEmail } from '$lib/server/email';
import { addToWaitlist } from '$lib/server/notion';
import { checkRateLimit } from '$lib/server/ratelimit';
import type { RequestHandler } from './$types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const { success } = await checkRateLimit(getClientAddress());

	if (!success) {
		return json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
	}
	let body: { name?: unknown; email?: unknown };

	try {
		body = (await request.json()) as { name?: unknown; email?: unknown };
	} catch {
		return json({ message: 'Invalid JSON body.' }, { status: 400 });
	}

	const name = typeof body.name === 'string' ? body.name.trim() : '';
	const email = typeof body.email === 'string' ? body.email.trim() : '';

	if (!name || !email || !EMAIL_PATTERN.test(email)) {
		return json({ message: 'A valid name and email are required.' }, { status: 400 });
	}

	try {
		await addToWaitlist(name, email);
		await sendWelcomeEmail(name, email);
		return json({ message: 'Successfully joined the waitlist.' });
	} catch (error) {
		console.error('Waitlist signup failed:', error);
		return json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
	}
};
