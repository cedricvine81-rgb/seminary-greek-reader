'use client'
import { useCallback, useEffect, useState } from 'react'

// Generic localStorage-backed numeric preference. The value is broadcast on a
// per-key window event so every open editor / pane stays in sync live, without a
// reload (e.g. all note editors react to one font-size change).
function useNumericPref(key: string, allowed: number[], fallback: number): [number, (v: number) => void] {
  const [value, setValue] = useState(fallback)

  useEffect(() => {
    const stored = parseFloat(localStorage.getItem(key) ?? '')
    if (allowed.includes(stored)) setValue(stored)
    const onChange = (e: Event) => setValue((e as CustomEvent<number>).detail)
    window.addEventListener(`pref:${key}`, onChange)
    return () => window.removeEventListener(`pref:${key}`, onChange)
    // `key` is a stable literal at each call site; allowed/fallback are module constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = useCallback((v: number) => {
    setValue(v)
    localStorage.setItem(key, String(v))
    window.dispatchEvent(new CustomEvent(`pref:${key}`, { detail: v }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [value, set]
}

// Text size (rem multiplier) and line spacing (line-height) steps shared by the
// Notes and Commentary three-dot text menus.
export const NOTE_FONT_SCALES = [0.85, 1, 1.15, 1.35]
export const FONT_SCALES = NOTE_FONT_SCALES
export const LINE_SPACINGS = [1.4, 1.7, 2.0, 2.4]

/** Global note text size (rem). Shared by the composer +/- buttons and the menu. */
export function useNoteFontScale(): [number, (s: number) => void] {
  return useNumericPref('note-font-scale', FONT_SCALES, 1)
}
/** Global note line spacing (line-height). */
export function useNoteLineSpacing(): [number, (s: number) => void] {
  return useNumericPref('note-line-spacing', LINE_SPACINGS, 1.4)
}
/** Commentary pane text size (rem). */
export function useCommentaryFontScale(): [number, (s: number) => void] {
  return useNumericPref('commentary-font-scale', FONT_SCALES, 1)
}
/** Commentary pane line spacing (line-height). */
export function useCommentaryLineSpacing(): [number, (s: number) => void] {
  return useNumericPref('commentary-line-spacing', LINE_SPACINGS, 1.7)
}
