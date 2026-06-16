// Survey taxonomy. `value` is the canonical Korean option string — it MUST match the
// Notion Waitlist DB select/multi-select option names character-for-character (verified
// against the live DB). It is always what we submit + store, regardless of display locale.
// `en` is the English display label only; submission still sends `value`.

import type { AppLocale } from '$lib/i18n';

export interface SurveyOption {
  value: string;
  en: string;
}

// DB property "직업" (select)
export const JOB_OPTIONS: readonly SurveyOption[] = [
  { value: '학생', en: 'Student' },
  { value: '교사·강사', en: 'Teacher / Instructor' },
  { value: '사무·행정직', en: 'Office / Admin' },
  { value: '연구원·대학원생', en: 'Researcher / Grad student' },
  { value: '마케터·콘텐츠 제작자', en: 'Marketer / Content creator' },
  { value: '자영업·소상공인', en: 'Self-employed / Small business owner' },
  { value: '프리랜서', en: 'Freelancer' },
  { value: 'PM·기획', en: 'PM / Product' },
  { value: '개발자', en: 'Developer' },
  { value: '크리에이터·디자이너', en: 'Creator / Designer' },
  { value: '기타', en: 'Other' },
];

// DB property "사용 중인 AI 작업" (multi_select)
export const AI_TASK_OPTIONS: readonly SurveyOption[] = [
  { value: '웹 검색', en: 'Web search' },
  { value: '리서치·자료 조사', en: 'Research' },
  { value: '글쓰기·문서 작성', en: 'Writing / Documents' },
  { value: '자료 정리', en: 'Organizing material' },
  { value: '코딩·개발', en: 'Coding / Development' },
  { value: '음악 생성', en: 'Music generation' },
  { value: '이미지 생성', en: 'Image generation' },
  { value: '영상 생성', en: 'Video generation' },
  { value: '데이터 분석', en: 'Data analysis' },
  { value: '기타', en: 'Other' },
];

export const JOB_VALUES: readonly string[] = JOB_OPTIONS.map((o) => o.value);
export const AI_TASK_VALUES: readonly string[] = AI_TASK_OPTIONS.map((o) => o.value);

export const OTHER_VALUE = '기타';

export function optionLabel(option: SurveyOption, locale: AppLocale): string {
  return locale === 'en' ? option.en : option.value;
}
