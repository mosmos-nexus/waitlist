import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';

const FROM = 'Mosmos <hello@mosmos.world>';

// Lazy init: the Resend constructor throws on an empty API key,
// which would break SvelteKit's build-time module analysis.
let resend: Resend | null = null;

/** Sends the waitlist welcome email via Resend. */
export async function sendWelcomeEmail(name: string, email: string): Promise<void> {
	resend ??= new Resend(RESEND_API_KEY);

	const { error } = await resend.emails.send({
		from: FROM,
		to: email,
		subject: 'Welcome to the Mosmos waitlist',
		html: welcomeHtml(name)
	});

	if (error) {
		throw new Error(`Failed to send welcome email: ${error.message}`);
	}
}

function welcomeHtml(name: string): string {
	return `<!doctype html>
<html lang="en">
	<body style="margin: 0; padding: 32px; font-family: sans-serif; color: #111;">
		<h1 style="font-size: 20px;">Welcome, ${escapeHtml(name)}!</h1>
		<p>You're on the Mosmos waitlist. We'll let you know as soon as it's your turn.</p>
		<p style="color: #666; font-size: 12px;">— The Mosmos team</p>
	</body>
</html>`;
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
