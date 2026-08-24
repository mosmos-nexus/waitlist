// Survey taxonomy. `value` is the canonical Korean option string — it MUST match the
// Notion Waitlist DB select/multi-select option names character-for-character (verified
// against the live DB). It is always what we submit + store, regardless of display locale.
// `en` and `ja` are display labels only; submission still sends `value`.

import type { AppLocale } from '$lib/i18n';

export interface SurveyOption {
  value: string;
  en: string;
  ja: string;
}

// DB property "직업" (select)
export const JOB_OPTIONS: readonly SurveyOption[] = [
  { value: '학생', en: 'Student', ja: '学生' },
  { value: '교사·강사', en: 'Teacher / Instructor', ja: '教員・講師' },
  { value: '사무·행정직', en: 'Office / Admin', ja: '事務・管理職' },
  { value: '연구원·대학원생', en: 'Researcher / Grad student', ja: '研究者・大学院生' },
  {
    value: '마케터·콘텐츠 제작자',
    en: 'Marketer / Content creator',
    ja: 'マーケター・コンテンツ制作',
  },
  {
    value: '자영업·소상공인',
    en: 'Self-employed / Small business owner',
    ja: '自営業・個人事業主',
  },
  { value: '프리랜서', en: 'Freelancer', ja: 'フリーランス' },
  { value: 'PM·기획', en: 'PM / Product', ja: 'PM・企画' },
  { value: '개발자', en: 'Developer', ja: 'エンジニア' },
  { value: '크리에이터·디자이너', en: 'Creator / Designer', ja: 'クリエイター・デザイナー' },
  { value: '기타', en: 'Other', ja: 'その他' },
];

// DB property "사용 중인 AI 작업" (multi_select)
export const AI_TASK_OPTIONS: readonly SurveyOption[] = [
  { value: '웹 검색', en: 'Web search', ja: 'ウェブ検索' },
  { value: '리서치·자료 조사', en: 'Research', ja: 'リサーチ・資料調査' },
  { value: '글쓰기·문서 작성', en: 'Writing / Documents', ja: '文章作成・資料作成' },
  { value: '자료 정리', en: 'Organizing material', ja: '資料の整理' },
  { value: '코딩·개발', en: 'Coding / Development', ja: 'コーディング・開発' },
  { value: '음악 생성', en: 'Music generation', ja: '音楽生成' },
  { value: '이미지 생성', en: 'Image generation', ja: '画像生成' },
  { value: '영상 생성', en: 'Video generation', ja: '動画生成' },
  { value: '데이터 분석', en: 'Data analysis', ja: 'データ分析' },
  { value: '기타', en: 'Other', ja: 'その他' },
];

export const JOB_VALUES: readonly string[] = JOB_OPTIONS.map((o) => o.value);
export const AI_TASK_VALUES: readonly string[] = AI_TASK_OPTIONS.map((o) => o.value);

export const OTHER_VALUE = '기타';

export function optionLabel(option: SurveyOption, locale: AppLocale): string {
  // Korean is the canonical value, so it needs no separate label.
  if (locale === 'en') return option.en;
  if (locale === 'ja') return option.ja;
  return option.value;
}
