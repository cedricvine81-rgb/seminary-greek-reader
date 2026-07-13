'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import type { BgLang, BgResult } from '@/lib/backgrounds-search-types'
import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'
import { emitOpenInTexts, hasOpenInTextsListener } from '@/lib/open-in-texts-bus'

// App-wide results panel for the background-sources search. Opened by the global
// right-click ("Search background sources for …") and from the Texts tab's search box.
// Search runs server-side (/api/search/backgrounds); clicking a hit opens it in the
// Exegesis Texts reader — in place if the workspace is already mounted, else by navigating.

// A short snippet windowed around the match, with the query highlighted. Some sources
// (Josephus sections) are long paragraphs, so this keeps each result to a couple of lines
// and shows the match in context. Falls back to a truncated lead when the raw query can't
// be located verbatim (e.g. an accented/inflected Greek form).
const RADIUS = 110
function renderSnippet(text: string, query: string): ReactNode {
  const q = query.trim()
  const rawIdx = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (rawIdx === -1) {
    return text.length > 2 * RADIUS ? text.slice(0, 2 * RADIUS).trimEnd() + '…' : text
  }
  const start = Math.max(0, rawIdx - RADIUS)
  const end = Math.min(text.length, rawIdx + q.length + RADIUS)
  return (
    <>
      {start > 0 ? '…' : ''}{text.slice(start, rawIdx)}
      <mark className="bg-red-100 text-red-700 font-semibold rounded-sm">{text.slice(rawIdx, rawIdx + q.length)}</mark>
      {text.slice(rawIdx + q.length, end)}{end < text.length ? '…' : ''}
    </>
  )
}

export function BackgroundsSearchModal({
  open, initialQuery, initialLang, onClose,
}: {
  open: boolean
  initialQuery: string
  initialLang: BgLang
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [lang, setLang] = useState<BgLang>(initialLang)
  const [result, setResult] = useState<BgResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const reqId = useRef(0)

  useEffect(() => setMounted(true), [])

  // Re-seed when reopened from a new right-click.
  useEffect(() => {
    if (open) { setQuery(initialQuery); setLang(initialLang); setResult(null) }
  }, [open, initialQuery, initialLang])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const runSearch = useCallback(async (q: string, l: BgLang) => {
    if (q.trim().length < 2) { setResult(null); setLoading(false); return }
    const id = ++reqId.current
    setLoading(true)
    try {
      const res = await fetch(`/api/search/backgrounds?q=${encodeURIComponent(q.trim())}&lang=${l}`)
      const data: BgResult = await res.json()
      if (id === reqId.current) setResult(res.ok ? data : { lang: l, total: 0, truncated: false, groups: [] })
    } catch {
      if (id === reqId.current) setResult({ lang: l, total: 0, truncated: false, groups: [] })
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [])

  // Debounced search on query/lang change while open.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => void runSearch(query, lang), 250)
    return () => clearTimeout(t)
  }, [open, query, lang, runSearch])

  // Escape to close.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function openHit(target: OpenInTextsTarget) {
    onClose()
    // Carry the query so the reader can highlight the searched word in red.
    const withTerm: OpenInTextsTarget = { ...target, highlight: query.trim() || undefined }
    if (hasOpenInTextsListener()) emitOpenInTexts(withTerm)
    else router.push(`/exegesis?tab=texts&open=${encodeURIComponent(JSON.stringify(withTerm))}`)
  }

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 sm:pt-16" onMouseDown={onClose}>
      <div
        className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Search bar */}
        <div className="flex-none flex items-center gap-2 border-b border-gray-200 px-3 py-2.5">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search background sources…"
            className="flex-1 min-w-0 text-sm outline-none placeholder:text-gray-400"
          />
          <div className="flex-none flex rounded-md border border-gray-200 text-xs overflow-hidden">
            {(['en', 'grc'] as BgLang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 transition-colors ${lang === l ? 'bg-brand-100 text-brand-800 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {l === 'en' ? 'English' : 'Greek'}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="flex-none text-gray-400 hover:text-gray-700 p-1" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" /> Searching…
            </div>
          )}
          {!loading && result && result.total === 0 && query.trim().length >= 2 && (
            <p className="py-10 text-center text-sm text-gray-400">
              No matches in the {lang === 'en' ? 'English' : 'Greek'} background texts.
            </p>
          )}
          {!loading && query.trim().length < 2 && (
            <p className="py-10 text-center text-sm text-gray-400">
              Search Philo, Josephus, the Septuagint, the Apocrypha, and the Pseudepigrapha.
            </p>
          )}
          {!loading && result && result.total > 0 && (
            <div className="divide-y divide-gray-100">
              <p className="px-4 pt-2 pb-1 text-[11px] text-gray-400">
                {result.total}{result.truncated ? '+' : ''} match{result.total === 1 ? '' : 'es'} in {result.groups.length} work{result.groups.length === 1 ? '' : 's'}
              </p>
              {result.groups.map(g => (
                <div key={g.gid} className="py-1.5">
                  <p className="px-4 py-1 text-xs font-semibold text-gray-600">{g.name} <span className="text-gray-400 font-normal">· {g.count}</span></p>
                  {g.hits.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => openHit(h.target)}
                      className="block w-full text-left px-4 py-1.5 hover:bg-brand-50 transition-colors"
                    >
                      <span className="text-[11px] font-medium text-brand-600">{h.ref}</span>
                      <span className={`block text-xs text-gray-600 leading-snug ${lang === 'grc' ? 'greek-text' : ''}`}>
                        {renderSnippet(h.text, query)}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
