'use client'
import { useCallback, useEffect, useState } from 'react'

/**
 * The parallel translations the Reader can show beside the Greek and Hebrew, served by
 * /api/translation. Single source of truth: the Reader, the Phrase explorer and Settings all
 * read this list, which previously existed as two hand-synced copies.
 *
 * Ordered deliberately: Spanish, Russian and Mandarin sit immediately after English rather
 * than below French and Portuguese, because they are the languages our students actually
 * need. All are public domain except the Korean and Portuguese editions, which are the
 * closest available and are labelled without a licence claim.
 */
export const READING_LANGS: { code: string; labelKey: string; subKey: string }[] = [
  { code: 'en',  labelKey: 'lang.en',  subKey: 'lang.en.sub' },
  { code: 'bsb', labelKey: 'lang.bsb', subKey: 'lang.bsb.sub' },
  { code: 'es',  labelKey: 'lang.es',  subKey: 'lang.es.sub' },
  { code: 'ru',  labelKey: 'lang.ru',  subKey: 'lang.ru.sub' },
  { code: 'zh',  labelKey: 'lang.zh',  subKey: 'lang.zh.sub' },
  { code: 'fr',  labelKey: 'lang.fr',  subKey: 'lang.fr.sub' },
  { code: 'pt',  labelKey: 'lang.pt',  subKey: 'lang.pt.sub' },
  { code: 'ko',  labelKey: 'lang.ko',  subKey: 'lang.ko.sub' },
]

/**
 * The Bible the app reaches for when it has to pick one and the student has not.
 *
 * A Spanish reader was being handed the World English Bible: the interface was Spanish, the
 * search scope (once fixed) was Spanish, and the parallel column beside it was still English.
 * Where an edition exists in the reader's own language, that is the sane default; 'en' is the
 * fallback for interface languages with no Bible of their own.
 *
 * This is a DEFAULT, not an override — an explicit choice (the cookie, ?tl=, a picker) always
 * wins, and this is only consulted when there is nothing to honour.
 */
export function defaultReadingLang(locale: string): string {
  return READING_LANGS.some(l => l.code === locale) ? locale : 'en'
}

export function isReadingLang(v: unknown): boolean {
  return typeof v === 'string' && READING_LANGS.some(l => l.code === v)
}

/** `t` is passed in so this stays a plain function usable outside a component. */
export function readingLangLabel(code: string | null, t: (k: string) => string): string {
  if (!code) return t('reader.greekOnly')
  const l = READING_LANGS.find(x => x.code === code)
  return l ? t(l.labelKey) : code
}

/**
 * A student's preferred reading language, kept in a cookie for the same reason the display
 * theme is (see lib/theme.ts): it is readable before first paint, so the Reader can open in
 * their language instead of flashing English and then switching.
 *
 * Per device, like the theme — NOT per account. A student on a shared lab machine and their
 * own phone sets it twice. Making it follow the account needs a column on User and so a
 * migration; the cookie is what ships without one.
 */
export const READING_LANG_COOKIE = 'reading-language'
const EVENT = 'pref:reading-language'
// Written by the Reader's own inline picker since long before this preference existed.
// Read as a fallback so a student who already chose a language there keeps it.
export const LEGACY_STORAGE_KEY = 'reader-parallel-lang'

/**
 * The stored preference — and the difference between the two ways of having none.
 *
 *   'es' | 'en' | …   an explicit language
 *   null              explicitly Greek/Hebrew alone (the cookie holds 'none')
 *   undefined         NOTHING STORED: follow the interface language
 *
 * That last distinction is the whole point. The cookie has always recorded them
 * differently — choosing "Greek only" writes 'none', never choosing writes nothing — but
 * every caller collapsed both to null, so the app could not tell "I want the original
 * alone" from "I haven't said". Only the second should follow the interface language, and
 * only the second should change when the interface language does.
 */
export function readReadingPref(): string | null | undefined {
  if (typeof document === 'undefined') return undefined
  const m = document.cookie.match(/(?:^|;\s*)reading-language=([^;]+)/)
  const v = m?.[1] ? decodeURIComponent(m[1]) : null
  if (v === 'none') return null
  if (isReadingLang(v)) return v
  // The Reader's own picker predates this cookie. A language found there was still a
  // deliberate choice, so it counts as explicit.
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (isReadingLang(legacy)) return legacy
  } catch { /* private mode, or storage disabled */ }
  return undefined
}

/**
 * What to actually SHOW: the explicit choice where there is one, otherwise the Bible of
 * the interface language. A Spanish interface opens on Reina-Valera rather than the World
 * English Bible, and switching the interface to Spanish moves it — until the reader picks
 * a translation themselves, after which their choice is honoured and never overridden.
 */
export function effectiveReadingLang(locale: string): string | null {
  const pref = readReadingPref()
  return pref === undefined ? defaultReadingLang(locale) : pref
}

/** The stored preference, with "unset" flattened to null. Prefer readReadingPref(). */
export function readReadingLang(): string | null {
  return readReadingPref() ?? null
}

/**
 * Forget the choice, so the reading language follows the interface language again.
 * This is a real setting ("Follow interface language"), not just a reset.
 */
export function clearReadingLang() {
  document.cookie = `${READING_LANG_COOKIE}=; path=/; max-age=0; samesite=lax`
  try { localStorage.removeItem(LEGACY_STORAGE_KEY) } catch { /* ignore */ }
  notify()
}

/** Persist the preference to the cookie, the legacy key, and every open pane. */
export function writeReadingLang(code: string | null) {
  const v = code ?? 'none'
  document.cookie = `${READING_LANG_COOKIE}=${encodeURIComponent(v)}; path=/; max-age=31536000; samesite=lax`
  try {
    if (code) localStorage.setItem(LEGACY_STORAGE_KEY, code)
    else localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch { /* ignore */ }
  notify()
}

/**
 * Tell every open pane the stored preference changed — a NOTIFICATION, carrying no value.
 * It used to carry the new code, which could not express "follow the interface language":
 * clearing the preference would have broadcast null, and every listener would have read
 * that as the opposite instruction, "show the original alone". Listeners re-read instead.
 */
function notify() {
  window.dispatchEvent(new Event(EVENT))
}

/**
 * The stored preference and a setter, for the Settings picker. `undefined` means "follow
 * the interface language"; setting it to undefined clears the choice.
 *
 * Broadcast on a window event so the Reader, the Phrase explorer and the Settings picker
 * stay in step live — change it in Settings with the Reader open in another pane and the
 * Reader follows.
 */
export function useReadingLanguage(): [string | null | undefined, (code: string | null | undefined) => void] {
  const [pref, setPref] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    const sync = () => setPref(readReadingPref())
    sync()
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])

  const set = useCallback((code: string | null | undefined) => {
    setPref(code)
    if (code === undefined) clearReadingLang()
    else writeReadingLang(code)
  }, [])

  return [pref, set]
}

/**
 * The language a pane should SHOW, kept in step with both the stored preference and the
 * interface language. Panes use this rather than the raw preference: it already resolves
 * "unset" to the interface language, and re-resolves when either changes.
 */
export function useEffectiveReadingLang(locale: string): string | null {
  const [lang, setLang] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => setLang(effectiveReadingLang(locale))
    sync()
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [locale])   // re-resolves on a locale switch, which is what makes it follow

  return lang
}
