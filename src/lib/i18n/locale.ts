/**
 * Interface language — the language of the app's own chrome (menus, buttons, labels), as
 * distinct from the READING language, which is the translation shown beside the Greek
 * (see lib/reading-language.ts). A student may well want the interface in Spanish while
 * reading the Greek against an English translation, so the two are kept separate.
 *
 * WHY A COOKIE AND NOT [locale] ROUTE SEGMENTS
 * The conventional Next.js approach puts the locale in the path (/es/reader). This app has
 * 59 page routes and leans heavily on deep links — the reader's `?open=` targets, exam
 * links, assignment URLs, links already sent to students — and every one of them would
 * break. A cookie carries the locale with no change to routing, and is readable by the
 * server layout so the first paint is already in the right language.
 */
export type Locale = 'en' | 'es' | 'ru' | 'zh'

export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE = 'interface-language'

/** Labels are given in the language itself — a student looking for their own language should
 *  not have to read English to find it. */
export const LOCALES: { code: Locale; label: string; english: string }[] = [
  { code: 'en', label: 'English',  english: 'English' },
  { code: 'es', label: 'Español',  english: 'Spanish' },
  { code: 'ru', label: 'Русский',  english: 'Russian' },
  { code: 'zh', label: '中文',      english: 'Mandarin Chinese' },
]

export function isLocale(v: unknown): v is Locale {
  return v === 'en' || v === 'es' || v === 'ru' || v === 'zh'
}

/** The BCP-47 tag for <html lang>, which drives font selection and screen-reader voice. */
export const HTML_LANG: Record<Locale, string> = {
  en: 'en', es: 'es', ru: 'ru', zh: 'zh-Hant',
}
