'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ChevronDown } from 'lucide-react'
import { TEXT_CATEGORIES } from '@/lib/texts-catalog'
import { BookPicker, type BookGroup, type PickBook } from './BookPicker'
import type { BgResult, BgLang } from '@/lib/backgrounds-search-types'
import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'
import { emitOpenInTexts, hasOpenInTextsListener } from '@/lib/open-in-texts-bus'
import { isExamLocked } from '@/lib/exam-lockdown'
import { parseSearchTerms, scoreRelevance } from '@/lib/search-query'
import { findTermRanges, markSlice, normalizeFold } from '@/lib/highlight-terms'

// The full-page "Master Search" (/search). One input searches any biblical text (Greek NT/LXX,
// or a translation) or any background collection, optionally scoped to books. Matches show in
// red; clicking a hit opens it in the right reader. Reached from the header icon / ⌘K / the
// right-click word menu (all via MasterSearchProvider → router.push('/search?…')).

const TRANSLATIONS = [
  { lang: 'en',  label: 'English (WEB)' },
  { lang: 'bsb', label: 'English (BSB)' },
  { lang: 'es',  label: 'Spanish' },
  { lang: 'fr',  label: 'French' },
  { lang: 'pt',  label: 'Portuguese' },
  { lang: 'ru',  label: 'Russian' },
  { lang: 'ko',  label: 'Korean' },
  { lang: 'zh',  label: 'Mandarin' },
]
const COLLECTIONS = TEXT_CATEGORIES.filter(c => !c.comingSoon && c.works.length > 0)

// LXX books with no Protestant-canon counterpart — shown only for the Greek Septuagint scope,
// not for translation scopes (whose indexes are the 66-book canon).
const DEUTERO = new Set(['1Esd', 'Tob', 'Jdt', 'PsSol', 'Wis', 'Sir', 'EpJer', 'Bar', 'Sus', 'Bel', '1Macc', '2Macc', '3Macc', '4Macc', 'Odes'])

interface Catalog { gnt: PickBook[]; lxx: PickBook[] }

type Scope =
  | { kind: 'greek'; corpus: 'GNT' | 'LXX' }
  | { kind: 'trans'; lang: string }
  | { kind: 'bg'; category: string | null }

function parseScope(v: string): Scope {
  if (v.startsWith('greek:')) return { kind: 'greek', corpus: v.slice(6) as 'GNT' | 'LXX' }
  if (v.startsWith('trans:')) return { kind: 'trans', lang: v.slice(6) }
  const cat = v.slice(3)
  return { kind: 'bg', category: cat === 'all' ? null : cat }
}

const GREEK_RE = /[Ͱ-Ͽἀ-῿]/
const MARK = 'bg-red-100 text-red-700 font-semibold rounded-sm'

// A full verse with every term highlighted (findTermRanges/markSlice: shared, accent-fold).
function hiliteVerse(text: string, terms: string[]): ReactNode {
  const ranges = findTermRanges(text, terms)
  if (!ranges.length) return text
  return <>{markSlice(text, ranges, 0, text.length, MARK)}</>
}

// A windowed snippet around the first match, every term inside the window highlighted — for
// long background paragraphs.
const RADIUS = 140
function renderSnippet(text: string, terms: string[]): ReactNode {
  const head = () => text.length > 2 * RADIUS ? text.slice(0, 2 * RADIUS).trimEnd() + '…' : text
  const ranges = findTermRanges(text, terms)
  if (!ranges.length) return head()
  const start = Math.max(0, ranges[0][0] - RADIUS)
  const end = Math.min(text.length, ranges[0][1] + RADIUS)
  return (
    <>
      {start > 0 ? '…' : ''}
      {markSlice(text, ranges, start, end, MARK)}
      {end < text.length ? '…' : ''}
    </>
  )
}

interface BibHit { osisId: string; chapter: number; verse: number; text: string; greek: boolean }

// Lightweight per-lane hit count for the result-type tabs — reruns the lane's search and reads
// its total (no book scope: a tab count is "how many matches exist over there", the active
// lane's book filter only narrows what's shown). Capped like the real searches (300).
async function fetchLaneCount(val: string, q: string): Promise<number> {
  const s = parseScope(val)
  if (s.kind === 'bg') {
    const lang: BgLang = GREEK_RE.test(q) ? 'grc' : 'en'
    const r = await fetch(`/api/search/backgrounds?q=${encodeURIComponent(q)}&lang=${lang}`)
    if (!r.ok) return 0
    const d: BgResult = await r.json()
    return d.total ?? 0
  }
  const url = s.kind === 'greek'
    ? `/api/search?q=${encodeURIComponent(q)}&type=word&corpus=${s.corpus}`
    : `/api/search?q=${encodeURIComponent(q)}&type=word&lang=${s.lang}`
  const r = await fetch(url)
  if (!r.ok) return 0
  const d = await r.json()
  return Array.isArray(d.results) ? d.results.length : 0
}

const SCOPE_STORAGE_KEY = 'masterSearch.scope'
const RECENT_STORAGE_KEY = 'masterSearch.recent'
const SORT_STORAGE_KEY = 'masterSearch.sort'
const RECENT_MAX = 8

type SortMode = 'relevance' | 'canonical'

export function SearchPageView({ initialQuery = '', initialScope }: { initialQuery?: string; initialScope?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [scopeVal, setScopeVal] = useState(initialScope || 'trans:en')
  const [transLang, setTransLang] = useState(initialScope?.startsWith('trans:') ? initialScope.slice(6) : 'en')
  const [books, setBooks] = useState<string[]>([])
  const [showBooks, setShowBooks] = useState(false)
  const [bib, setBib] = useState<BibHit[] | null>(null)
  const [bg, setBg] = useState<BgResult | null>(null)
  const [counts, setCounts] = useState<Record<string, number | null>>({})
  const [recent, setRecent] = useState<string[]>([])
  const [sort, setSort] = useState<SortMode>('relevance')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const reqId = useRef(0)
  const countReq = useRef(0)

  const scope = useMemo(() => parseScope(scopeVal), [scopeVal])
  const terms = useMemo(() => parseSearchTerms(query), [query])
  const isBiblical = scope.kind !== 'bg'
  // Greek hits arrive uncapped in canonical order → re-sort client-side for relevance.
  // (Translation relevance is computed server-side via rank=1; backgrounds stay grouped.)
  const displayBib = useMemo(() => {
    if (!bib || scope.kind !== 'greek' || sort !== 'relevance') return bib
    return [...bib]
      .map(h => ({ h, s: scoreRelevance(normalizeFold(h.text), terms) }))
      .sort((a, b) => b.s - a.s)
      .map(x => x.h)
  }, [bib, scope, sort, terms])

  const bookGroups: BookGroup[] = useMemo(() => {
    if (!catalog) return []
    if (scope.kind === 'greek') {
      if (scope.corpus === 'GNT') return [{ heading: 'New Testament', books: catalog.gnt }]
      return [
        { heading: 'Old Testament', books: catalog.lxx.filter(b => !DEUTERO.has(b.osisId)) },
        { heading: 'Deutero-Canonical', books: catalog.lxx.filter(b => DEUTERO.has(b.osisId)) },
      ]
    }
    if (scope.kind === 'trans') return [
      { heading: 'Old Testament', books: catalog.lxx.filter(b => !DEUTERO.has(b.osisId)) },
      { heading: 'New Testament', books: catalog.gnt },
    ]
    return []
  }, [catalog, scope])
  const bookName = useMemo(() => {
    const m = new Map<string, string>()
    if (catalog) for (const b of [...catalog.gnt, ...catalog.lxx]) m.set(b.osisId, b.name)
    return m
  }, [catalog])
  const selectedSet = useMemo(() => new Set(books), [books])
  const booksLabel = books.length === 0 ? 'Any book'
    : books.length === 1 ? (bookName.get(books[0]) ?? books[0])
    : `${books.length} books`
  const booksKey = books.join(',')

  const laneList = useMemo(() => [
    { val: `trans:${transLang}`, label: TRANSLATIONS.find(t => t.lang === transLang)?.label ?? 'Translation' },
    { val: 'greek:GNT', label: 'Greek NT' },
    { val: 'greek:LXX', label: 'Greek LXX' },
    { val: 'bg:all', label: 'Backgrounds' },
  ], [transLang])
  const activeLane = scope.kind === 'bg' ? 'bg:all'
    : scope.kind === 'greek' ? `greek:${scope.corpus}`
    : `trans:${transLang}`

  useEffect(() => { setMounted(true); inputRef.current?.focus() }, [])
  useEffect(() => { if (scope.kind === 'trans') setTransLang(scope.lang) }, [scope])
  // Remember the last-used scope — but only when the URL didn't specify one (a right-click preset).
  useEffect(() => {
    if (initialScope) return
    try { const s = localStorage.getItem(SCOPE_STORAGE_KEY); if (s) setScopeVal(s) } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { try { localStorage.setItem(SCOPE_STORAGE_KEY, scopeVal) } catch {} }, [scopeVal])
  // Keep the URL in sync (bookmarkable / shareable) without a server round-trip.
  useEffect(() => {
    if (!mounted) return
    const p = new URLSearchParams()
    if (query.trim()) p.set('q', query.trim())
    p.set('in', scopeVal)
    const qs = p.toString()
    window.history.replaceState(null, '', qs ? `/search?${qs}` : '/search')
  }, [query, scopeVal, mounted])
  useEffect(() => {
    try { const r = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || '[]'); if (Array.isArray(r)) setRecent(r.filter(x => typeof x === 'string')) } catch {}
    try { const s = localStorage.getItem(SORT_STORAGE_KEY); if (s === 'canonical' || s === 'relevance') setSort(s) } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem(SORT_STORAGE_KEY, sort) } catch {} }, [sort])
  const pushRecent = useCallback((q: string) => {
    const v = q.trim()
    if (v.length < 2) return
    setRecent(prev => {
      const next = [v, ...prev.filter(x => x.toLowerCase() !== v.toLowerCase())].slice(0, RECENT_MAX)
      try { localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  useEffect(() => {
    fetch('/data/books.json').then(r => r.ok ? r.json() : null)
      .then((d: Catalog | null) => { if (d) setCatalog({ gnt: d.gnt, lxx: d.lxx }) })
      .catch(() => {})
  }, [])
  // A scope change can invalidate the chosen books (different canon).
  useEffect(() => { setBooks([]); setShowBooks(false) }, [scopeVal])

  const runSearch = useCallback(async (q: string, sv: string, bks: string, srt: SortMode) => {
    if (q.trim().length < 2) { setBib(null); setBg(null); setLoading(false); return }
    const s = parseScope(sv)
    const id = ++reqId.current
    setLoading(true)
    try {
      if (s.kind === 'bg') {
        const lang: BgLang = GREEK_RE.test(q) ? 'grc' : 'en'
        const cat = s.category ? `&category=${s.category}` : ''
        const res = await fetch(`/api/search/backgrounds?q=${encodeURIComponent(q.trim())}&lang=${lang}${cat}`)
        const data: BgResult = res.ok ? await res.json() : { lang, total: 0, truncated: false, groups: [] }
        if (id === reqId.current) { setBg(data); setBib(null) }
      } else {
        const bookParam = bks ? `&books=${bks}` : ''
        const rankParam = s.kind === 'trans' && srt === 'relevance' ? '&rank=1' : ''
        const url = s.kind === 'greek'
          ? `/api/search?q=${encodeURIComponent(q.trim())}&type=word&corpus=${s.corpus}${bookParam}`
          : `/api/search?q=${encodeURIComponent(q.trim())}&type=word&lang=${s.lang}${bookParam}${rankParam}`
        const res = await fetch(url)
        const data = res.ok ? await res.json() : { results: [] }
        const hits: BibHit[] = s.kind === 'greek'
          ? (data.results as { bookId: string; chapter: number; verse: number; text: string }[]).map(v => ({
              osisId: v.bookId, chapter: v.chapter, verse: v.verse, text: v.text, greek: true,
            }))
          : (data.results as { id: string; text: string }[]).map(r => {
              const [osis, ch, vs] = r.id.split('.')
              return { osisId: osis, chapter: Number(ch), verse: Number(vs), text: r.text, greek: false }
            })
        if (id === reqId.current) { setBib(hits); setBg(null) }
      }
    } catch {
      if (id === reqId.current) { setBib(null); setBg(null) }
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [])

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => void runSearch(query, scopeVal, booksKey, sort), 250)
    return () => clearTimeout(t)
  }, [query, scopeVal, booksKey, sort, runSearch])

  // Live counts for the result-type tabs (all lanes, in parallel). Debounced; reqId guard.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setCounts({}); return }
    const id = ++countReq.current
    const lanes = laneList.map(l => l.val)
    setCounts(prev => { const n: Record<string, number | null> = {}; for (const v of lanes) n[v] = prev[v] ?? null; return n })
    const t = setTimeout(() => {
      for (const val of lanes) {
        fetchLaneCount(val, q)
          .then(c => { if (id === countReq.current) setCounts(prev => ({ ...prev, [val]: c })) })
          .catch(() => { if (id === countReq.current) setCounts(prev => ({ ...prev, [val]: 0 })) })
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query, laneList])

  const toggleBook = (osisId: string) =>
    setBooks(prev => prev.includes(osisId) ? prev.filter(b => b !== osisId) : [...prev, osisId])
  const toggleGroup = (ids: string[], select: boolean) =>
    setBooks(prev => select ? Array.from(new Set([...prev, ...ids])) : prev.filter(b => !ids.includes(b)))

  function openBiblical(link: string, tl?: string) {
    pushRecent(query)
    const q = query.trim()
    const extra = `${q ? `&q=${encodeURIComponent(q)}` : ''}${tl ? `&tl=${encodeURIComponent(tl)}` : ''}`
    router.push(`/reader?ref=${encodeURIComponent(link)}${extra}`)
  }
  function openBackground(target: OpenInTextsTarget) {
    pushRecent(query)
    const withTerm: OpenInTextsTarget = { ...target, highlight: query.trim() || undefined }
    if (hasOpenInTextsListener()) emitOpenInTexts(withTerm)
    else router.push(`/exegesis?tab=texts&open=${encodeURIComponent(JSON.stringify(withTerm))}`)
  }

  // Never available during a lockdown exam (it would be a lookup backdoor).
  if (mounted && isExamLocked()) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center text-gray-500">
        Search is unavailable during a Translation Exam.
      </div>
    )
  }

  const noResults = query.trim().length >= 2 && !loading &&
    ((isBiblical && bib && bib.length === 0) || (!isBiblical && bg && bg.total === 0))

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
      {/* Sticky controls */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4 pb-2 bg-gray-50/95 backdrop-blur border-b border-gray-100">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') pushRecent(query) }}
            placeholder="Search the Greek NT & LXX, translations, or background texts…"
            className="flex-1 min-w-0 text-base outline-none placeholder:text-gray-400"
          />
        </div>

        {/* Scope + book */}
        <div className="mt-2 flex items-center flex-wrap gap-2 text-xs">
          <label className="flex items-center gap-1.5 text-gray-500">
            In
            <select value={scopeVal} onChange={e => setScopeVal(e.target.value)}
              className="rounded border border-gray-300 bg-white px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400">
              <optgroup label="Greek">
                <option value="greek:GNT">Greek — New Testament</option>
                <option value="greek:LXX">Greek — Septuagint</option>
              </optgroup>
              <optgroup label="Translations">
                {TRANSLATIONS.map(t => <option key={t.lang} value={`trans:${t.lang}`}>{t.label}</option>)}
              </optgroup>
              <optgroup label="Background texts">
                <option value="bg:all">All background texts</option>
                {COLLECTIONS.map(c => <option key={c.id} value={`bg:${c.id}`}>{c.label}</option>)}
              </optgroup>
            </select>
          </label>
          {isBiblical && (
            <span className="flex items-center gap-1.5 text-gray-500">
              Book
              <button type="button" onClick={() => setShowBooks(v => !v)}
                aria-expanded={showBooks}
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-1 text-xs transition-colors ${
                  showBooks || books.length > 0 ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}>
                {booksLabel}
                <ChevronDown size={13} className={`transition-transform ${showBooks ? 'rotate-180' : ''}`} />
              </button>
            </span>
          )}
        </div>

        {isBiblical && showBooks && (
          <div className="mt-2">
            {bookGroups.length > 0
              ? <BookPicker groups={bookGroups} selected={selectedSet} onToggle={toggleBook} onToggleGroup={toggleGroup} onClear={() => setBooks([])} />
              : <p className="text-xs text-gray-400 py-4 text-center">Loading books…</p>}
          </div>
        )}

        {/* Result-type tabs (live counts) */}
        {query.trim().length >= 2 && (
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {laneList.map(l => {
              const active = l.val === activeLane
              const c = counts[l.val]
              return (
                <button key={l.val} type="button" onClick={() => setScopeVal(l.val)}
                  className={`flex-none inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active ? 'border-brand-600 bg-brand-600 text-white'
                           : 'border-gray-200 bg-white text-gray-600 hover:border-brand-200 hover:bg-brand-50'}`}>
                  {l.label}
                  <span className={`tabular-nums ${active ? 'text-white/80' : 'text-gray-400'}`}>
                    {c === null || c === undefined ? '…' : c >= 300 ? '300+' : c}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="py-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" /> Searching…
          </div>
        )}
        {!loading && query.trim().length < 2 && (
          <div className="py-10">
            {recent.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Recent</p>
                  <button type="button"
                    onClick={() => { setRecent([]); try { localStorage.removeItem(RECENT_STORAGE_KEY) } catch {} }}
                    className="text-[11px] text-brand-600 hover:underline">Clear</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map(r => (
                    <button key={r} type="button" onClick={() => { setQuery(r); inputRef.current?.focus() }}
                      className={`inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 transition-colors ${GREEK_RE.test(r) ? 'greek-text' : ''}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-center text-sm text-gray-400">
              Search the Greek NT &amp; LXX, the English/Spanish (and more) translations, or any background collection.
            </p>
            <p className="mt-2 text-center text-[11px] text-gray-400">
              Type several words to require them all; wrap in <span className="font-medium text-gray-500">&quot;quotes&quot;</span> for an exact phrase.
            </p>
          </div>
        )}
        {noResults && (
          <p className="py-16 text-center text-sm text-gray-400">No matches.</p>
        )}

        {/* Biblical hits */}
        {!loading && isBiblical && displayBib && displayBib.length > 0 && (
          <div>
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs text-gray-400">{displayBib.length}{displayBib.length >= 300 ? '+' : ''} verse{displayBib.length === 1 ? '' : 's'}</p>
              <div className="flex items-center gap-0.5 rounded-full bg-gray-100 p-0.5 text-[11px]">
                {(['relevance', 'canonical'] as SortMode[]).map(m => (
                  <button key={m} type="button" onClick={() => setSort(m)}
                    className={`rounded-full px-2.5 py-0.5 transition-colors ${sort === m ? 'bg-white text-brand-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                    {m === 'relevance' ? 'Relevance' : 'Canonical'}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {displayBib.map((h, i) => (
                <button key={i} onClick={() => openBiblical(`${h.osisId} ${h.chapter}:${h.verse}`, h.greek ? undefined : (scope.kind === 'trans' ? scope.lang : undefined))} className="block w-full text-left py-2.5 px-2 rounded-lg hover:bg-brand-50 transition-colors">
                  <span className="text-xs font-medium text-brand-600">{bookName.get(h.osisId) ?? h.osisId} {h.chapter}:{h.verse}</span>
                  <span className={`block text-sm text-gray-700 leading-relaxed ${h.greek ? 'greek-text' : ''}`}>{hiliteVerse(h.text, terms)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Background hits */}
        {!loading && !isBiblical && bg && bg.total > 0 && (
          <div>
            <p className="pb-2 text-xs text-gray-400">
              {bg.total}{bg.truncated ? '+' : ''} match{bg.total === 1 ? '' : 'es'} in {bg.groups.length} work{bg.groups.length === 1 ? '' : 's'}
            </p>
            {bg.groups.map(g => (
              <div key={g.gid} className="py-1.5">
                <p className="py-1 text-sm font-semibold text-gray-600">{g.name} <span className="text-gray-400 font-normal">· {g.count}</span></p>
                <div className="divide-y divide-gray-100">
                  {g.hits.map((h, i) => (
                    <button key={i} onClick={() => openBackground(h.target)} className="block w-full text-left py-2.5 px-2 rounded-lg hover:bg-brand-50 transition-colors">
                      <span className="text-xs font-medium text-brand-600">{h.ref}</span>
                      <span className={`block text-sm text-gray-700 leading-relaxed ${bg.lang === 'grc' ? 'greek-text' : ''}`}>{renderSnippet(h.text, terms)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
