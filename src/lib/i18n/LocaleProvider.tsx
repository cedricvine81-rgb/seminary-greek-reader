'use client'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from './locale'
import { translator, type Vars } from './translate'

/**
 * The locale is supplied by the server layout, which reads it from the cookie, and passed
 * down through context. Client components must take it from here rather than reading
 * document.cookie themselves: if the client picked a different value than the server rendered
 * with, every translated string would be a hydration mismatch.
 */
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

/** A bound `t` for the current locale. Memoised so it is stable across renders. */
export function useT(): (key: string, vars?: Vars) => string {
  const locale = useLocale()
  return useMemo(() => translator(locale), [locale])
}

/**
 * Change the interface language: write the cookie, then ask Next to re-render.
 *
 * router.refresh() is required rather than merely updating context — server components
 * (layouts, page shells, anything reading the locale on the server) were rendered with the
 * old cookie, and only a refresh re-runs them with the new one. Without it the client
 * chrome would switch language while server-rendered headings stayed behind.
 */
export function useSetLocale(): (next: Locale) => void {
  const router = useRouter()
  return useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }, [router])
}
