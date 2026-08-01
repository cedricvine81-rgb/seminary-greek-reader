'use client'
import { usePref } from '@/lib/use-pref'

// The storage + live-broadcast mechanism these hooks are built on now lives in
// lib/use-pref.ts, generalized to string enums so the rest of the app's
// preferences (text sizes like 'sm' | 'lg') can share it.

// Text size (rem multiplier) and line spacing (line-height) steps shared by the
// Notes and Commentary three-dot text menus.
export const NOTE_FONT_SCALES = [0.85, 1, 1.15, 1.35]
export const FONT_SCALES = NOTE_FONT_SCALES
export const LINE_SPACINGS = [1.4, 1.7, 2.0, 2.4]

/** Global note text size (rem). Shared by the composer +/- buttons and the menu. */
export function useNoteFontScale(): [number, (s: number) => void] {
  return usePref('note-font-scale', FONT_SCALES, 1)
}
/** Global note line spacing (line-height). */
export function useNoteLineSpacing(): [number, (s: number) => void] {
  return usePref('note-line-spacing', LINE_SPACINGS, 1.4)
}
/** Commentary pane text size (rem). */
export function useCommentaryFontScale(): [number, (s: number) => void] {
  return usePref('commentary-font-scale', FONT_SCALES, 1)
}
/** Commentary pane line spacing (line-height). */
export function useCommentaryLineSpacing(): [number, (s: number) => void] {
  return usePref('commentary-line-spacing', LINE_SPACINGS, 1.7)
}
