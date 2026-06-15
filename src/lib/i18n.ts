import { getLocale, setLocale } from '$lib/paraglide/runtime.js';

export type AppLocale = 'ko' | 'en';

export function currentLocale(): AppLocale {
  return getLocale() as AppLocale;
}

export function switchLocale(locale: AppLocale): void {
  setLocale(locale);
}

export function syncHtmlLang(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = getLocale();
}
