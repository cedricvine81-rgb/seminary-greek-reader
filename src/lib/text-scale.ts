'use client'
import { useCallback, useEffect, useState } from 'react'

// App-wide text size. Scales the root font size, so every rem-based size in the app —
// which is nearly all of them — grows or shrinks together, the way a browser zoom does
// but without also scaling images and page chrome the reader wants left alone.
//
// Stored and applied exactly like the display theme (src/lib/theme.ts): a cookie, so the
// server layout can stamp <html> before first paint (no flash, no hydration mismatch), plus
// a window event so every open pane follows a change live.
export type TextScale = 'sm' | 'md' | 'lg' | 'xl'

export const TEXT_SCALES: { id: TextScale; label: string; hint: string; pct: number }[] = [
  { id: 'sm', label: 'Compact', hint: 'More on screen at once.',        pct: 94 },
  { id: 'md', label: 'Default', hint: 'The standard size.',             pct: 100 },
  { id: 'lg', label: 'Large',   hint: 'Easier on the eyes.',            pct: 112 },
  { id: 'xl', label: 'Largest', hint: 'Maximum legibility.',            pct: 125 },
]

export const TEXT_SCALE_COOKIE = 'text-scale'
const EVENT = 'pref:text-scale'

export function isTextScale(v: unknown): v is TextScale {
  return v === 'sm' || v === 'md' || v === 'lg' || v === 'xl'
}

function readCookie(): TextScale {
  const m = document.cookie.match(/(?:^|;\s*)text-scale=([^;]+)/)
  const v = m?.[1]
  return isTextScale(v) ? v : 'md'
}

/** Apply to <html> ('md' removes the attribute so the default rem size applies). */
export function applyTextScale(scale: TextScale) {
  const el = document.documentElement
  if (scale === 'md') el.removeAttribute('data-text-scale')
  else el.setAttribute('data-text-scale', scale)
}

export function useTextScale(): [TextScale, (s: TextScale) => void] {
  const [scale, setScale] = useState<TextScale>('md')

  useEffect(() => {
    setScale(readCookie())
    const onChange = (e: Event) => {
      const s = (e as CustomEvent<TextScale>).detail
      if (isTextScale(s)) setScale(s)
    }
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])

  const set = useCallback((s: TextScale) => {
    setScale(s)
    document.cookie = `${TEXT_SCALE_COOKIE}=${s}; path=/; max-age=31536000; samesite=lax`
    applyTextScale(s)
    window.dispatchEvent(new CustomEvent<TextScale>(EVENT, { detail: s }))
  }, [])

  return [scale, set]
}
