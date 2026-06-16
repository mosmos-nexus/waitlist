import { json, type RequestHandler } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/server/ratelimit';
import { isDuplicateEmail, createWaitlistEntry } from '$lib/server/notion';
import { sendWelcomeEmail } from '$lib/server/email';
import { signupSchema, EMAIL_RE, normalizeEmail } from '$lib/server/validation';
import { features } from '$lib/config/features';
import type { AppLocale } from '$lib/i18n';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  // §6: 2 requests per IP per minute.
  if (!(await checkRateLimit(getClientAddress()))) {
    return json({ error: 'ratelimit' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'generic' }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: 'generic' }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const locale: AppLocale = parsed.data.locale === 'en' ? 'en' : 'ko';

  if (!EMAIL_RE.test(email)) {
    return json({ error: 'invalid_email' }, { status: 400 });
  }
  // Server-side consent enforcement — the second of the form+API double block (DoD §1).
  // No record is created without explicit consent, even on a direct API call.
  if (parsed.data.consent !== true) {
    return json({ error: 'no_consent' }, { status: 400 });
  }

  try {
    if (await isDuplicateEmail(email)) {
      return json({ error: 'duplicate' }, { status: 409 });
    }
    const id = await createWaitlistEntry(email);

    let emailSent = false;
    if (features.welcomeEmail) {
      try {
        emailSent = await sendWelcomeEmail(email, locale);
      } catch (err) {
        // A failed welcome email must not fail the signup itself.
        console.error('welcome email failed', err);
      }
    }
    return json({ id, emailSent });
  } catch (err) {
    console.error('waitlist signup failed', err);
    return json({ error: 'generic' }, { status: 500 });
  }
};
