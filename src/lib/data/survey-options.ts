// Survey taxonomy (v2). `value` is the canonical Korean option string — it MUST match the
// Notion Waitlist DB select/multi-select option names character-for-character. 직업 and
// 사용 중인 AI 작업 reuse the live DB's option names so earlier signups stay comparable; 국가 /
// AI 서비스 수 are new properties (see scripts/notion-migrate-waitlist.mjs). It is always what
// we submit + store, regardless of display locale.
// `en` and `ja` are display labels only; submission still sends `value`.

import type { AppLocale } from '$lib/i18n';

export interface SurveyOption {
  value: string;
  en: string;
  ja: string;
}

// DB property "직업" (select) — "하는 일"
export const JOB_OPTIONS: readonly SurveyOption[] = [
  {
    value: '자영업·소상공인',
    en: 'Self-employed / Small business owner',
    ja: '自営業・個人事業主',
  },
  {
    value: '마케터·콘텐츠 제작자',
    en: 'Marketer / Content creator',
    ja: 'マーケター・コンテンツ制作',
  },
  { value: 'PM·기획', en: 'PM / Product', ja: 'PM・企画' },
  { value: '프리랜서', en: 'Freelancer', ja: 'フリーランス' },
  { value: '크리에이터·디자이너', en: 'Creator / Designer', ja: 'クリエイター・デザイナー' },
  { value: '개발자', en: 'Developer', ja: 'エンジニア' },
  { value: '학생', en: 'Student', ja: '学生' },
  { value: '기타', en: 'Other', ja: 'その他' },
];

// DB property "사용 중인 AI 작업" (multi_select) — "AI로 주로 하는 일"
// The question asks what they mostly use AI for, so old and new rows stay comparable; the en/ja
// labels say the same thing as the Korean value.
export const AI_TASK_OPTIONS: readonly SurveyOption[] = [
  { value: '리서치·자료 조사', en: 'Research & finding information', ja: 'リサーチ・資料調査' },
  { value: '자료 정리', en: 'Organizing materials', ja: '資料の整理' },
  { value: '글쓰기·문서 작성', en: 'Writing & drafting documents', ja: '文章・ドキュメントの作成' },
  { value: '이미지 생성', en: 'Creating images', ja: '画像の生成' },
  { value: '데이터 분석', en: 'Data analysis', ja: 'データ分析' },
  { value: '기타', en: 'Other', ja: 'その他' },
];

// DB property "국가" (select)
export const COUNTRY_OPTIONS: readonly SurveyOption[] = [
  { value: '한국', en: 'Korea', ja: '韓国' },
  { value: '일본', en: 'Japan', ja: '日本' },
  { value: '기타', en: 'Other', ja: 'その他' },
];

// DB property "AI 서비스 수" (select) — AI services the visitor uses today
export const AI_COUNT_OPTIONS: readonly SurveyOption[] = [
  { value: '0–1개', en: '0–1', ja: '0〜1個' },
  { value: '2–3개', en: '2–3', ja: '2〜3個' },
  { value: '4개 이상', en: '4 or more', ja: '4個以上' },
];

export const JOB_VALUES: readonly string[] = JOB_OPTIONS.map((o) => o.value);
export const AI_TASK_VALUES: readonly string[] = AI_TASK_OPTIONS.map((o) => o.value);
export const COUNTRY_VALUES: readonly string[] = COUNTRY_OPTIONS.map((o) => o.value);
export const AI_COUNT_VALUES: readonly string[] = AI_COUNT_OPTIONS.map((o) => o.value);

export const OTHER_VALUE = '기타';

export function optionLabel(option: SurveyOption, locale: AppLocale): string {
  // Korean is the canonical value, so it needs no separate label.
  if (locale === 'en') return option.en;
  if (locale === 'ja') return option.ja;
  return option.value;
}

/** Pre-selects the country from the page locale. `en` is ambiguous, so it gets no default. */
export function countryFromLocale(locale: AppLocale): string | undefined {
  if (locale === 'ko') return '한국';
  if (locale === 'ja') return '일본';
  return undefined;
}
