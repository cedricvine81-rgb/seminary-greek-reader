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
export const READING_LANGS: { code: string; label: string; sub: string }[] = [
  { code: 'en',  label: 'English',       sub: 'World English Bible · public domain' },
  { code: 'bsb', label: 'English (BSB)', sub: 'Berean Standard Bible · public domain' },
  { code: 'es',  label: 'Spanish',       sub: 'Reina-Valera 1909 · public domain' },
  { code: 'ru',  label: 'Russian',       sub: 'Russian Synodal Bible · public domain' },
  { code: 'zh',  label: 'Mandarin',      sub: 'Chinese Union Version · public domain' },
  { code: 'fr',  label: 'French',        sub: 'Louis Segond 1910 · public domain' },
  { code: 'pt',  label: 'Portuguese',    sub: 'João Ferreira de Almeida (ARC)' },
  { code: 'ko',  label: 'Korean',        sub: 'Korean Revised Version' },
]

export function isReadingLang(v: unknown): boolean {
  return typeof v === 'string' && READING_LANGS.some(l => l.code === v)
}

export function readingLangLabel(code: string | null): string {
  if (!code) return 'Greek only'
  return READING_LANGS.find(l => l.code === code)?.label ?? code
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

/** The stored preference: a language code, or null for Greek only. */
export function readReadingLang(): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)reading-language=([^;]+)/)
  const v = m?.[1] ? decodeURIComponent(m[1]) : null
  if (v === 'none') return null
  if (isReadingLang(v)) return v
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (isReadingLang(legacy)) return legacy
  } catch { /* private mode, or storage disabled */ }
  return null
}

/** Persist the preference to the cookie, the legacy key, and every open pane. */
export function writeReadingLang(code: string | null) {
  const v = code ?? 'none'
  document.cookie = `${READING_LANG_COOKIE}=${encodeURIComponent(v)}; path=/; max-age=31536000; samesite=lax`
  try {
    if (code) localStorage.setItem(LEGACY_STORAGE_KEY, code)
    else localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent<string | null>(EVENT, { detail: code }))
}

/**
 * Read/write the reading language. Broadcast on a window event so the Reader, the Phrase
 * explorer and the Settings picker stay in step live — change it in Settings with the Reader
 * open in another pane and the Reader follows.
 */
export function useReadingLanguage(): [string | null, (code: string | null) => void] {
  const [lang, setLang] = useState<string | null>(null)

  useEffect(() => {
    setLang(readReadingLang())
    const onChange = (e: Event) => setLang((e as CustomEvent<string | null>).detail ?? null)
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])

  const set = useCallback((code: string | null) => {
    setLang(code)
    writeReadingLang(code)
  }, [])

  return [lang, set]
}
