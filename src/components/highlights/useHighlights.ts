import { useCallback, useEffect, useRef, useState } from 'react'

export interface HighlightRecord {
  id: string
  book: string
  chapter: number
  verse: number
  startOffset: number
  endOffset: number
  color: string
  // "grc" for the Greek, otherwise the translation's language/version code. Offsets are into
  // that text, so filtering by layer keeps Greek and translation highlights independent.
  layer: string
}

/**
 * Loads and mutates persisted text highlights, one chapter at a time (mirrors the
 * per-chapter VerseNote loading already used across the reading surfaces). Highlights
 * for a chapter are kept in a map keyed "<book>.<chapter>" so several chapters can be
 * on screen at once (e.g. the Texts tab's continuous scroll).
 */
export function useHighlights(isAuthenticated: boolean) {
  const [byKey, setByKey] = useState<Record<string, HighlightRecord[]>>({})
  const byKeyRef = useRef(byKey)
  useEffect(() => { byKeyRef.current = byKey }, [byKey])

  const loadFor = useCallback(async (book: string, chapter: number) => {
    if (!isAuthenticated) return
    const key = `${book}.${chapter}`
    try {
      const r = await fetch(`/api/highlights?book=${encodeURIComponent(book)}&chapter=${chapter}&verseStart=1&verseEnd=500`)
      const d = await r.json()
      setByKey(prev => ({ ...prev, [key]: d.highlights ?? [] }))
    } catch { /* ignore */ }
  }, [isAuthenticated])

  // Creating a highlight "paints over" any existing highlight it overlaps within the
  // same verse — the intuitive behavior for a highlighter, and avoids stacked/overlapping
  // ranges that would be ambiguous to render.
  const create = useCallback(async (book: string, chapter: number, verse: number, start: number, end: number, color: string, layer = 'grc') => {
    const key = `${book}.${chapter}`
    const current = byKeyRef.current[key] ?? []
    // Only paint over overlaps in the SAME layer — a Greek highlight must not delete an
    // overlapping translation highlight that happens to share offsets, and vice versa.
    const overlapping = current.filter(h => h.layer === layer && h.verse === verse && start < h.endOffset && end > h.startOffset)
    await Promise.all(overlapping.map(h => fetch(`/api/highlights?id=${h.id}`, { method: 'DELETE' })))
    const r = await fetch('/api/highlights', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book, chapter, verse, startOffset: start, endOffset: end, color, layer }),
    })
    const d = await r.json()
    if (d.highlight) {
      setByKey(prev => ({
        ...prev,
        [key]: [...(prev[key] ?? []).filter(h => !overlapping.some(o => o.id === h.id)), d.highlight],
      }))
    }
  }, [])

  const recolor = useCallback(async (id: string, book: string, chapter: number, color: string) => {
    const key = `${book}.${chapter}`
    await fetch(`/api/highlights?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color }) })
    setByKey(prev => ({ ...prev, [key]: (prev[key] ?? []).map(h => h.id === id ? { ...h, color } : h) }))
  }, [])

  const remove = useCallback(async (id: string, book: string, chapter: number) => {
    const key = `${book}.${chapter}`
    await fetch(`/api/highlights?id=${id}`, { method: 'DELETE' })
    setByKey(prev => ({ ...prev, [key]: (prev[key] ?? []).filter(h => h.id !== id) }))
  }, [])

  // `layer` scopes the result to one text (e.g. "grc" for the Greek, "en"/"bsb"/… for a
  // translation) so a column only renders the highlights made on its own text. Omit to get
  // every layer (legacy behaviour).
  const forVerse = useCallback((book: string, chapter: number, verse: number, layer?: string): HighlightRecord[] => {
    return (byKey[`${book}.${chapter}`] ?? []).filter(h => h.verse === verse && (layer === undefined || h.layer === layer))
  }, [byKey])

  return { loadFor, create, recolor, remove, forVerse }
}
