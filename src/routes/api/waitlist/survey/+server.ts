import { json, type RequestHandler } from '@sveltejs/kit';
import { updateWaitlistSurvey } from '$lib/server/notion';
import { surveySchema, sanitizeJob, sanitizeAiTasks } from '$lib/server/validation';

const NOTION_ID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

// Optional 2nd-step survey. The page id was returned by POST /api/waitlist on signup.
export const POST: RequestHandler = async ({ request }) => {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'generic' }, { status: 400 });
  }

  const parsed = surveySchema.safeParse(raw);
  if (!parsed.success || !NOTION_ID_RE.test(parsed.data.id)) {
    return json({ error: 'generic' }, { status: 400 });
  }

  const job = sanitizeJob(parsed.data.job);
  const aiTasks = sanitizeAiTasks(parsed.data.aiTasks);
  const other = parsed.data.other?.slice(0, 1000);

  try {
    await updateWaitlistSurvey(parsed.data.id, { job, aiTasks, other });
    return json({ ok: true });
  } catch (err) {
    console.error('survey update failed', err);
    return json({ error: 'generic' }, { status: 500 });
  }
};
