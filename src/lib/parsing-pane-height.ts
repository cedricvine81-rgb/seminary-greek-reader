import { useEffect, useState } from 'react'

// One shared, persisted height for every parsing pane in the app (the Reader, each Exegesis
// tab, and the Search dock). Dragging any pane's grab-bar resizes them all — several are mounted
// at once (the Exegesis tabs stay mounted), so a module-level store + subscriber set keeps every
// live instance in sync, and the value survives reloads via localStorage.

export const PARSE_MIN_H = 110
export const PARSE_MAX_H = 520
const DEFAULT_H = 256   // matches the parsing pane's previous fixed height (h-64)
const KEY = 'parsingPaneH'

let _h = DEFAULT_H
let _loaded = false
const subs = new Set<(h: number) => void>()

function ensureLoaded() {
  if (_loaded || typeof window === 'undefined') return
  _loaded = true
  try {
    const v = parseInt(localStorage.getItem(KEY) ?? '', 10)
    if (v >= PARSE_MIN_H && v <= PARSE_MAX_H) _h = v
  } catch { /* ignore */ }
}

const clamp = (v: number) => Math.min(PARSE_MAX_H, Math.max(PARSE_MIN_H, Math.round(v)))

/** [height, setHeight (live, shared), persist (write to localStorage — call on drag end)]. */
export function useParsingPaneHeight(): [number, (h: number) => void, () => void] {
  ensureLoaded()
  const [h, setH] = useState(_h)
  useEffect(() => {
    setH(_h)   // adopt the loaded/shared value on mount
    const fn = (v: number) => setH(v)
    subs.add(fn)
    return () => { subs.delete(fn) }
  }, [])
  const set = (v: number) => { _h = clamp(v); subs.forEach(f => f(_h)) }
  const persist = () => { try { localStorage.setItem(KEY, String(_h)) } catch { /* ignore */ } }
  return [h, set, persist]
}
