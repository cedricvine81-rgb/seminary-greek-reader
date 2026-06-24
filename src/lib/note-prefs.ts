'use client'
import { useCallback, useEffect, useState } from 'react'

// Global note text size (rem), persisted and broadcast so open editors stay in sync.
const KEY = 'note-font-scale'
const EVENT = 'note-font-scale-change'
export const NOTE_FONT_SCALES = [0.85, 1, 1.15, 1.35]

export function useNoteFontScale(): [number, (s: number) => void] {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const v = parseFloat(localStorage.getItem(KEY) ?? '')
    if (NOTE_FONT_SCALES.includes(v)) setScale(v)
    const onChange = (e: Event) => setScale((e as CustomEvent<number>).detail)
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])

  const set = useCallback((s: number) => {
    setScale(s)
    localStorage.setItem(KEY, String(s))
    window.dispatchEvent(new CustomEvent(EVENT, { detail: s }))
  }, [])

  return [scale, set]
}
