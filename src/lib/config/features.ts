import { env } from '$env/dynamic/public';

// §8 conditional-exposure gates. All OFF by default; flip via Vercel env when the
// exposure condition is met. Imported on both server and client (public env).
export const features = {
  // Confirmation "환영 메일을 보냈어요" line + actual welcome-email send.
  // Condition: Korean welcome email written + delivery verified.
  welcomeEmail: env.PUBLIC_FEATURE_WELCOME_EMAIL === 'true',
  // Live registrant counter. Condition: 500+ real signups.
  registrantCounter: env.PUBLIC_FEATURE_REGISTRANT_COUNTER === 'true',
  // Survey "n=45" empathy stat. Condition: §9 decision to use the figure externally.
  surveyStatN45: env.PUBLIC_FEATURE_SURVEY_STAT_N45 === 'true',
};
