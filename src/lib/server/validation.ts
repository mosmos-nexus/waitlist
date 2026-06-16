import { z } from 'zod';
import { JOB_VALUES, AI_TASK_VALUES } from '$lib/data/survey-options';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const signupSchema = z.object({
  email: z.string(),
  consent: z.boolean(),
  locale: z.string().optional(),
});

export const surveySchema = z.object({
  id: z.string().min(1),
  job: z.string().optional(),
  aiTasks: z.array(z.string()).optional(),
  other: z.string().optional(),
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
