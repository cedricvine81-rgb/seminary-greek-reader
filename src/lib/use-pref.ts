'use client'
import { useCallback, useEffect, useState } from 'react'

/**
 * A device-local user preference: stored in localStorage and broadcast on a
 * per-key window event, so every pane that reads the same key updates live
 * instead of going stale until a reload. That matters most on the Exegesis
 * page, whose tabs all stay mounted.
 *
 * Generalized from the numbers-only hook in note-prefs.ts: most of the app's
 * preferences are string enums ('sm' | 'md' | 'lg' | 'xl'), which is why each
 * surface used to hand-roll its own localStorage read/write — or, in the
 * Reader's case, skip persistence entirely.
 *
 * `allowed` is the whitelist of valid values; anything else in storage (stale
 * key, hand-edited, a value we no longer ship) falls back rather than throwing.
 * Values are compared by their string form, so this stays compatible with keys
 * already written by the previous hook.
 *
 * Reads happen in an effect, not during render, so the server and the first
 * client paint agree on `fallback` and hydration never mismatches.
 */
export function usePref<T extends string | number>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(fallback)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        const match = allowed.find(a => String(a) === raw)
        if (match !== undefined) setValue(match)
      }
    } catch { /* private mode / storage disabled — keep the fallback */ }

    const onChange = (e: Event) => setValue((e as CustomEvent<T>).detail)
    window.addEventListener(`pref:${key}`, onChange)
    return () => window.removeEventListener(`pref:${key}`, onChange)
    // `key` is a stable literal at every call site; allowed/fallback are module constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = useCallback((v: T) => {
    setValue(v)
    try { localStorage.setItem(key, String(v)) } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent(`pref:${key}`, { detail: v }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [value, set]
}
