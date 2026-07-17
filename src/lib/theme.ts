'use client'
import { useCallback, useEffect, useState } from 'react'

// Display themes. `sepia` is the default (rendered when no cookie is set); `light`
// is :root in globals.css and the other three override the CSS-variable ramps via
// [data-theme='…'] on <html>.
export type Theme = 'light' | 'sepia' | 'dim' | 'dark'

export const THEMES: { id: Theme; label: string; hint: string }[] = [
  { id: 'light', label: 'Light',  hint: 'Bright white.' },
  { id: 'sepia', label: 'Sepia',  hint: 'Warm beige, easy on the eyes — the default.' },
  { id: 'dim',   label: 'Dim',    hint: 'Soft slate blue-grey — gentle low light.' },
  { id: 'dark',  label: 'Dark',   hint: 'Near-black, high contrast for night reading.' },
]

// Stored in a cookie (not localStorage) so the server layout can render the
// correct data-theme on <html> up front — no flash of the default theme and no
// hydration mismatch. Name is shared with layout.tsx.
export const THEME_COOKIE = 'display-theme'
const EVENT = 'pref:display-theme'

export function isTheme(v: unknown): v is Theme {
  return v === 'light' || v === 'sepia' || v === 'dim' || v === 'dark'
}

function readThemeCookie(): Theme {
  const m = document.cookie.match(/(?:^|;\s*)display-theme=([^;]+)/)
  const v = m?.[1]
  return isTheme(v) ? v : 'sepia'   // no cookie yet → sepia (the default scheme)
}

/** Apply a theme to <html> (light removes the attribute so :root applies). */
export function applyTheme(theme: Theme) {
  const el = document.documentElement
  if (theme === 'light') el.removeAttribute('data-theme')
  else el.setAttribute('data-theme', theme)
}

/**
 * Read/write the Display theme. Backed by a cookie and broadcast on a window
 * event so every open pane stays in sync live, and applied to <html> instantly.
 */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>('sepia')

  useEffect(() => {
    setTheme(readThemeCookie())
    const onChange = (e: Event) => {
      const t = (e as CustomEvent<Theme>).detail
      if (isTheme(t)) setTheme(t)
    }
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])

  const set = useCallback((t: Theme) => {
    setTheme(t)
    // 1-year cookie, readable by the server layout on the next navigation.
    document.cookie = `${THEME_COOKIE}=${t}; path=/; max-age=31536000; samesite=lax`
    applyTheme(t)
    window.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: t }))
  }, [])

  return [theme, set]
}
