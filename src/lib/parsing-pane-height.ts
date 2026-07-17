import { useEffect, useState } from 'react'

// Per-surface persisted height for a parsing pane. Each reading surface (Reader, each Exegesis
// tab, Search) passes its own key so they resize independently — the layouts differ enough that
// one size doesn't suit all. Several panes are mounted at once (the Exegesis tabs stay mounted),
// so each key gets a module-level store + subscriber set to keep its live instances in sync, and
// the value persists across reloads via localStorage.

export const PARSE_MIN_H = 110
export const PARSE_MAX_H = 520
const DEFAULT_H = 256   // matches the parsing pane's previous fixed height (h-64)

const clamp = (v: number) => Math.min(PARSE_MAX_H, Math.max(PARSE_MIN_H, Math.round(v)))

interface Store { h: number; loaded: boolean; subs: Set<(h: number) => void> }
const stores = new Map<string, Store>()

function storeFor(key: string): Store {
  let s = stores.get(key)
  if (!s) { s = { h: DEFAULT_H, loaded: false, subs: new Set() }; stores.set(key, s) }
  if (!s.loaded && typeof window !== 'undefined') {
    s.loaded = true
    try {
      const v = parseInt(localStorage.getItem(`parsingPaneH:${key}`) ?? '', 10)
      if (v >= PARSE_MIN_H && v <= PARSE_MAX_H) s.h = v
    } catch { /* ignore */ }
  }
  return s
}

/** [height, setHeight (live, shared by this key's instances), persist (localStorage; call on drag end)]. */
export function useParsingPaneHeight(key: string): [number, (h: number) => void, () => void] {
  const s = storeFor(key)
  const [h, setH] = useState(s.h)
  useEffect(() => {
    setH(s.h)   // adopt the loaded/current value on mount
    const fn = (v: number) => setH(v)
    s.subs.add(fn)
    return () => { s.subs.delete(fn) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const set = (v: number) => { s.h = clamp(v); s.subs.forEach(f => f(s.h)) }
  const persist = () => { try { localStorage.setItem(`parsingPaneH:${key}`, String(s.h)) } catch { /* ignore */ } }
  return [h, set, persist]
}
