import { z } from 'zod';
import {
  JOB_VALUES,
  AI_TASK_VALUES,
  COUNTRY_VALUES,
  AI_COUNT_VALUES,
} from '$lib/data/survey-options';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// UTM is attribution only — a malformed value is dropped, it must never fail the signup.
const utmField = z.string().optional().catch(undefined);
const utmSchema = z
  .object({
    source: utmField,
    medium: utmField,
    campaign: utmField,
    referrer: utmField,
  })
  .optional()
  .catch(undefined);

export type Utm = z.infer<typeof utmSchema>;

export const signupSchema = z.object({
  email: z.string(),
  consent: z.boolean(),
  locale: z.string().optional(),
  utm: utmSchema,
});

export const surveySchema = z.object({
  id: z.string().min(1),
  job: z.string().optional(),
  aiTasks: z.array(z.string()).optional(),
  country: z.string().optional(),
  aiCount: z.string().optional(),
  firstTask: z.string().optional(),
  jobOther: z.string().optional(),
  taskOther: z.string().optional(),
});

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Keep only options that exist in the DB taxonomy (defends the DB from junk values). */
export function sanitizeJob(job: string | undefined): string | undefined {
  return job && JOB_VALUES.includes(job) ? job : undefined;
}

export function sanitizeAiTasks(tasks: string[] | undefined): string[] {
  if (!tasks) return [];
  return tasks.filter((t) => AI_TASK_VALUES.includes(t));
}

export function sanitizeCountry(country: string | undefined): string | undefined {
  return country && COUNTRY_VALUES.includes(country) ? country : undefined;
}

export function sanitizeAiCount(aiCount: string | undefined): string | undefined {
  return aiCount && AI_COUNT_VALUES.includes(aiCount) ? aiCount : undefined;
}

/** Free text (firstTask, jobOther, taskOther): trimmed, capped at 1000 chars, empty -> undefined. */
export function sanitizeText(text: string | undefined): string | undefined {
  return text?.trim().slice(0, 1000) || undefined;
}

// \p{Cc} = control characters (a lint-safe stand-in for [\x00-\x1f\x7f]).
const CONTROL_RE = /\p{Cc}/gu;

function sanitizeUtmField(value: string | undefined): string | undefined {
  return value?.replace(CONTROL_RE, '').trim().slice(0, 200) || undefined;
}

/** Cleans each UTM field (control chars stripped, capped at 200); undefined if nothing is left. */
export function sanitizeUtm(utm: Utm): NonNullable<Utm> | undefined {
  if (!utm) return undefined;
  const clean = {
    source: sanitizeUtmField(utm.source),
    medium: sanitizeUtmField(utm.medium),
    campaign: sanitizeUtmField(utm.campaign),
    referrer: sanitizeUtmField(utm.referrer),
  };
  return Object.values(clean).some(Boolean) ? clean : undefined;
}
