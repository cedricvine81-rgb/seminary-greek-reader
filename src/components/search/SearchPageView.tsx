'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ChevronDown, Lightbulb, X, Copy, Check } from 'lucide-react'
import { TEXT_CATEGORIES } from '@/lib/texts-catalog'
import { BookPicker, type BookGroup, type PickBook } from './BookPicker'
import { GreekSearchResults } from './GreekSearchResults'
import type { BgResult, BgLang, BgHit } from '@/lib/backgrounds-search-types'
import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'
import { emitOpenInTexts, hasOpenInTextsListener } from '@/lib/open-in-texts-bus'
import { isExamLocked } from '@/lib/exam-lockdown'
import { parseSearchTerms, scoreRelevance } from '@/lib/search-query'
import { findTermRanges, markSlice, normalizeFold } from '@/lib/highlight-terms'
import { betaCodeToGreek, BETA_LEGEND } from '@/lib/greek-translit'

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
  | { kind: 'bg'; category: string | null; lang?: 'grc' }

function parseScope(v: string): Scope {
  if (v.startsWith('greek:')) return { kind: 'greek', corpus: v.slice(6) as 'GNT' | 'LXX' }
  if (v.startsWith('trans:')) return { kind: 'trans', lang: v.slice(6) }
  // bggrc: forces the Greek (Septuagint) facet of the background corpus; bg: auto-detects.
  if (v.startsWith('bggrc:')) { const c = v.slice(6); return { kind: 'bg', category: c === 'all' ? null : c, lang: 'grc' } }
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

// The opaque key the bg-context endpoint (mode:'bg') uses to identify a hit's entry — mirrors
// entryKey() in src/lib/backgrounds-search.ts, built from a hit's OpenInTextsTarget.
function bgCtxKey(t: OpenInTextsTarget): string {
  return `${t.source}|${t.osisId ?? ''}|${t.workDir ?? ''}|${t.book ?? ''}|${t.chapter}|${t.verse}`
}

// Lightweight per-lane hit count for the result-type tabs — reruns the lane's search and reads
// its total (no book scope: a tab count is "how many matches exist over there", the active
// lane's book filter only narrows what's shown). Capped like the real searches (300).
async function fetchLaneCount(val: string, q: string, lemma = false): Promise<number> {
  const s = parseScope(val)
  if (s.kind === 'bg') {
    const lang: BgLang = GREEK_RE.test(q) ? 'grc' : 'en'
    const r = await fetch(`/api/search/backgrounds?q=${encodeURIComponent(q)}&lang=${lang}`)
    if (!r.ok) return 0
    const d: BgResult = await r.json()
    return d.total ?? 0
  }
  const url = s.kind === 'greek'
    ? `/api/search?q=${encodeURIComponent(q)}&type=word&corpus=${s.corpus}${lemma ? '&lemma=true' : ''}`
    : `/api/search?q=${encodeURIComponent(q)}&type=word&lang=${s.lang}`
  const r = await fetch(url)
  if (!r.ok) return 0
  const d = await r.json()
  return Array.isArray(d.results) ? d.results.length : 0
}

const SCOPE_STORAGE_KEY = 'masterSearch.scope'
const QUERY_STORAGE_KEY = 'masterSearch.query'
const RECENT_STORAGE_KEY = 'masterSearch.recent'
const SORT_STORAGE_KEY = 'masterSearch.sort'
const CONTEXT_STORAGE_KEY = 'masterSearch.context'
const GREEKINPUT_STORAGE_KEY = 'masterSearch.greekInput'
const RECENT_MAX = 8

type SortMode = 'relevance' | 'canonical'

// Sample searches shown in the "Search types" pane — click one to run it (and switch scope
// where the example needs it, e.g. Greek or background texts).
interface Example { label: string; query: string; scope?: string }
const SEARCH_EXAMPLES: { group: string; hint: string; items: Example[] }[] = [
  { group: 'Single word', hint: 'accent- and case-insensitive', items: [
    { label: 'love', query: 'love' },
    { label: 'grace', query: 'grace' },
    { label: 'covenant', query: 'covenant' },
  ] },
  { group: 'All of these words', hint: 'every word must appear (any order)', items: [
    { label: 'faith hope love', query: 'faith hope love' },
    { label: 'bread wine', query: 'bread wine' },
  ] },
  { group: 'Exact phrase', hint: 'wrap in "quotes"', items: [
    { label: '"kingdom of God"', query: '"kingdom of God"' },
    { label: '"eternal life"', query: '"eternal life"' },
  ] },
  { group: 'Greek word', hint: 'searches the Greek text (type or paste Greek)', items: [
    { label: 'ἀγάπη', query: 'ἀγάπη', scope: 'greek:GNT' },
    { label: 'λόγος', query: 'λόγος', scope: 'greek:GNT' },
    { label: 'πίστις', query: 'πίστις', scope: 'greek:GNT' },
  ] },
  { group: 'Background texts', hint: 'Philo, Josephus, Apocrypha, Mishnah…', items: [
    { label: 'temple', query: 'temple', scope: 'bg:all' },
    { label: 'Sabbath', query: 'Sabbath', scope: 'bg:all' },
  ] },
]

export function SearchPageView({ initialQuery = '', initialScope, initialLemma = false, initialBooks }: { initialQuery?: string; initialScope?: string; initialLemma?: boolean; initialBooks?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [scopeVal, setScopeVal] = useState(initialScope || 'trans:en')
  const [transLang, setTransLang] = useState(initialScope?.startsWith('trans:') ? initialScope.slice(6) : 'en')
  const [books, setBooks] = useState<string[]>(initialBooks ? initialBooks.split(',').filter(Boolean) : [])
  const [showBooks, setShowBooks] = useState(false)
  const [showTypes, setShowTypes] = useState(false)
  const [bib, setBib] = useState<BibHit[] | null>(null)
  const [bg, setBg] = useState<BgResult | null>(null)
  const [counts, setCounts] = useState<Record<string, number | null>>({})
  const [recent, setRecent] = useState<string[]>([])
  const [sort, setSort] = useState<SortMode>('relevance')
  const [context, setContext] = useState(0)   // verse-context radius: 0 (off) … 3
  const [ctxMap, setCtxMap] = useState<Record<string, { chapter: number; verse: number; text: string }[]>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [greekInput, setGreekInput] = useState(false)   // QWERTY→Greek (Beta Code) typing
  const [suggestions, setSuggestions] = useState<{ word: string; sub?: string }[]>([])
  const [showSug, setShowSug] = useState(false)
  const lastPickedRef = useRef('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const reqId = useRef(0)
  const countReq = useRef(0)
  const ctxReq = useRef(0)

  const scope = useMemo(() => parseScope(scopeVal), [scopeVal])
  // Lemma ("all forms") search stays active only while the query is unchanged from the lemma
  // we were handed via ?mode=lemma; editing the query drops back to a normal word search.
  const lemmaMode = initialLemma && query.trim() === initialQuery.trim()
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
  // Background hits: relevance flattens across works and sorts by score; document order keeps
  // the catalog grouping. (Biblical relevance for translations is already ranked server-side.)
  const displayBg = useMemo(() => {
    if (!bg) return null
    if (sort !== 'relevance') return { mode: 'grouped' as const, groups: bg.groups }
    const hits = bg.groups.flatMap(g => g.hits.map(h => ({ h, work: g.name })))
      .map(x => ({ ...x, s: scoreRelevance(normalizeFold(x.h.text), terms) }))
      .sort((a, b) => b.s - a.s)
    return { mode: 'flat' as const, hits }
  }, [bg, sort, terms])

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

  // Hydrate persisted state from localStorage ONCE, then mark mounted. Saves are gated on
  // `mounted` so this restore isn't clobbered by an initial-render write. URL params win.
  useEffect(() => {
    if (!initialScope) { try { const s = localStorage.getItem(SCOPE_STORAGE_KEY); if (s) setScopeVal(s) } catch {} }
    if (!initialQuery) { try { const q = localStorage.getItem(QUERY_STORAGE_KEY); if (q) setQuery(q) } catch {} }
    try { const r = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || '[]'); if (Array.isArray(r)) setRecent(r.filter(x => typeof x === 'string')) } catch {}
    try { const s = localStorage.getItem(SORT_STORAGE_KEY); if (s === 'canonical' || s === 'relevance') setSort(s) } catch {}
    try { const c = Number(localStorage.getItem(CONTEXT_STORAGE_KEY)); if (Number.isFinite(c) && c >= 0 && c <= 3) setContext(c) } catch {}
    try { if (localStorage.getItem(GREEKINPUT_STORAGE_KEY) === '1') setGreekInput(true) } catch {}
    setMounted(true)
    inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (scope.kind === 'trans') setTransLang(scope.lang) }, [scope])
  // Persist scope / query / sort / context (all gated on `mounted` so they never fire before
  // hydration). Results are retained when you leave and return to /search — until you Clear.
  useEffect(() => { if (mounted) try { localStorage.setItem(SCOPE_STORAGE_KEY, scopeVal) } catch {} }, [scopeVal, mounted])
  useEffect(() => { if (mounted) try { localStorage.setItem(SORT_STORAGE_KEY, sort) } catch {} }, [sort, mounted])
  useEffect(() => { if (mounted) try { localStorage.setItem(CONTEXT_STORAGE_KEY, String(context)) } catch {} }, [context, mounted])
  useEffect(() => { if (mounted) try { localStorage.setItem(GREEKINPUT_STORAGE_KEY, greekInput ? '1' : '0') } catch {} }, [greekInput, mounted])
  useEffect(() => {
    if (!mounted) return
    try { if (query.trim()) localStorage.setItem(QUERY_STORAGE_KEY, query); else localStorage.removeItem(QUERY_STORAGE_KEY) } catch {}
  }, [query, mounted])
  // Keep the URL in sync (bookmarkable / shareable) without a server round-trip.
  useEffect(() => {
    if (!mounted) return
    const p = new URLSearchParams()
    if (query.trim()) p.set('q', query.trim())
    p.set('in', scopeVal)
    if (books.length) p.set('books', books.join(','))
    const qs = p.toString()
    window.history.replaceState(null, '', qs ? `/search?${qs}` : '/search')
  }, [query, scopeVal, books, mounted])
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
  // A scope change can invalidate the chosen books (different canon) — but keep the initial
  // book that arrived via ?books= on the first render (a "this book" search from a word menu).
  // Reset only when the scope actually changes value (StrictMode-safe: no reset on mount).
  const prevScope = useRef(scopeVal)
  useEffect(() => {
    if (prevScope.current !== scopeVal) { setBooks([]); setShowBooks(false) }
    prevScope.current = scopeVal
  }, [scopeVal])

  const runSearch = useCallback(async (q: string, sv: string, bks: string, srt: SortMode, lemma: boolean) => {
    if (q.trim().length < 2) { setBib(null); setBg(null); setLoading(false); return }
    const s = parseScope(sv)
    const id = ++reqId.current
    setLoading(true)
    try {
      if (s.kind === 'bg') {
        const lang: BgLang = s.lang ?? (GREEK_RE.test(q) ? 'grc' : 'en')
        const cat = s.category ? `&category=${s.category}` : ''
        const res = await fetch(`/api/search/backgrounds?q=${encodeURIComponent(q.trim())}&lang=${lang}${cat}`)
        const data: BgResult = res.ok ? await res.json() : { lang, total: 0, truncated: false, groups: [] }
        if (id === reqId.current) { setBg(data); setBib(null) }
      } else {
        const bookParam = bks ? `&books=${bks}` : ''
        const rankParam = s.kind === 'trans' && srt === 'relevance' ? '&rank=1' : ''
        const url = s.kind === 'greek'
          ? `/api/search?q=${encodeURIComponent(q.trim())}&type=word&corpus=${s.corpus}${lemma ? '&lemma=true' : ''}${bookParam}`
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
    const t = setTimeout(() => void runSearch(query, scopeVal, booksKey, sort, lemmaMode), 250)
    return () => clearTimeout(t)
  }, [query, scopeVal, booksKey, sort, lemmaMode, runSearch])

  // Live counts for the result-type tabs (all lanes, in parallel). Debounced; reqId guard.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setCounts({}); return }
    const id = ++countReq.current
    const lanes = laneList.map(l => l.val)
    setCounts(prev => { const n: Record<string, number | null> = {}; for (const v of lanes) n[v] = prev[v] ?? null; return n })
    const t = setTimeout(() => {
      for (const val of lanes) {
        fetchLaneCount(val, q, lemmaMode)
          .then(c => { if (id === countReq.current) setCounts(prev => ({ ...prev, [val]: c })) })
          .catch(() => { if (id === countReq.current) setCounts(prev => ({ ...prev, [val]: 0 })) })
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query, laneList, lemmaMode])

  // Verse context for biblical hits: when the slider is > 0, fetch each shown hit's neighbouring
  // verses (same chapter) so it can be read in context. One batched POST; a reqId drops stale.
  useEffect(() => {
    if (context === 0) { setCtxMap({}); return }
    let body: Record<string, unknown> | null = null
    if (isBiblical) {
      if (!displayBib || displayBib.length === 0) { setCtxMap({}); return }
      const refs = displayBib.map(h => `${h.osisId}.${h.chapter}.${h.verse}`)
      body = scope.kind === 'greek'
        ? { mode: 'greek', corpus: scope.corpus, radius: context, refs }
        : { mode: 'trans', lang: scope.kind === 'trans' ? scope.lang : 'en', radius: context, refs }
    } else {
      if (!bg || bg.total === 0) { setCtxMap({}); return }
      const refs = bg.groups.flatMap(g => g.hits.map(h => bgCtxKey(h.target)))
      body = { mode: 'bg', lang: bg.lang, radius: context, refs }
    }
    const id = ++ctxReq.current
    fetch('/api/search/context', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(r => r.ok ? r.json() : { context: {} })
      .then(d => { if (id === ctxReq.current) setCtxMap(d.context || {}) })
      .catch(() => { if (id === ctxReq.current) setCtxMap({}) })
  }, [isBiblical, context, displayBib, bg, scope])

  // Predictive typing: autocomplete the last word of the query. Translation scope → that
  // language's words; Greek scope / Greek text → Greek dictionary lexemes (with glosses).
  useEffect(() => {
    const lastWord = query.match(/\S*$/)?.[0] ?? ''
    if (lastWord.length < 2 || lastWord.startsWith('"') || query.trim() === lastPickedRef.current) { setSuggestions([]); return }
    // A Greek-script word always gets Greek lexeme suggestions; otherwise a translation's own
    // words (or English for background text). Greek scope has no lang → Greek lexemes.
    let langParam = ''
    if (GREEK_RE.test(lastWord)) langParam = ''
    else if (scope.kind === 'trans') langParam = `&lang=${scope.lang}`
    else if (scope.kind === 'bg' && scope.lang !== 'grc') langParam = '&lang=en'
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(lastWord)}${langParam}`, { signal: ctrl.signal })
        .then(r => (r.ok ? r.json() : { suggestions: [] }))
        .then(d => {
          // A fetch already in flight when the user submitted (Enter) or picked a suggestion
          // would otherwise re-open the dropdown; the ref marks that query as handled.
          if (query.trim() === lastPickedRef.current) return
          setSuggestions(d.suggestions ?? []); setShowSug(true)
        })
        .catch(() => {})
    }, 150)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [query, scope])

  function onQueryChange(e: ChangeEvent<HTMLInputElement>) {
    const el = e.target
    const pos = el.selectionStart ?? el.value.length
    if (greekInput) {
      setQuery(betaCodeToGreek(el.value))
      requestAnimationFrame(() => { try { el.setSelectionRange(pos, pos) } catch {} })
    } else {
      setQuery(el.value)
    }
  }
  function pickSuggestion(word: string) {
    setQuery(q => {
      const next = q.replace(/\S*$/, word)
      lastPickedRef.current = next.trim()
      return next
    })
    setSuggestions([]); setShowSug(false)
    inputRef.current?.focus()
  }
  function toggleGreekInput() {
    const nv = !greekInput
    setGreekInput(nv)
    if (nv) setQuery(q => betaCodeToGreek(q))
    inputRef.current?.focus()
  }

  const toggleBook = (osisId: string) =>
    setBooks(prev => prev.includes(osisId) ? prev.filter(b => b !== osisId) : [...prev, osisId])
  const toggleGroup = (ids: string[], select: boolean) =>
    setBooks(prev => select ? Array.from(new Set([...prev, ...ids])) : prev.filter(b => !ids.includes(b)))
  const runExample = (ex: Example) => {
    if (ex.scope) setScopeVal(ex.scope)
    setQuery(ex.query)
    setShowTypes(false)
    inputRef.current?.focus()
  }
  // Esc closes the Search-types pane.
  useEffect(() => {
    if (!showTypes) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowTypes(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showTypes])

  function openBiblical(link: string, tl?: string) {
    pushRecent(query)
    const q = query.trim()
    const extra = `${q ? `&q=${encodeURIComponent(q)}` : ''}${tl ? `&tl=${encodeURIComponent(tl)}` : ''}`
    router.push(`/reader?ref=${encodeURIComponent(link)}${extra}`)
  }
  async function copyHit(h: BibHit, ctx?: { chapter: number; verse: number; text: string }[]) {
    const verses = ctx && ctx.length ? ctx : [{ chapter: h.chapter, verse: h.verse, text: h.text }]
    const book = bookName.get(h.osisId) ?? h.osisId
    const first = verses[0], last = verses[verses.length - 1]
    const ref = verses.length === 1
      ? `${book} ${h.chapter}:${h.verse}`
      : `${book} ${first.chapter}:${first.verse}–${last.chapter === first.chapter ? last.verse : `${last.chapter}:${last.verse}`}`
    const key = `${h.osisId}.${h.chapter}.${h.verse}`
    try {
      await navigator.clipboard.writeText(`${ref} — ${verses.map(v => v.text).join(' ')}`)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(k => (k === key ? null : k)), 1500)
    } catch {}
  }
  function openBackground(target: OpenInTextsTarget) {
    pushRecent(query)
    const withTerm: OpenInTextsTarget = { ...target, highlight: query.trim() || undefined }
    if (hasOpenInTextsListener()) emitOpenInTexts(withTerm)
    else router.push(`/exegesis?tab=texts&open=${encodeURIComponent(JSON.stringify(withTerm))}`)
  }

  // Context slider + sort toggle, shown above every result set (biblical and background). The
  // second sort mode is "Canonical" for Scripture, "Document order" for non-canonical works.
  const canonicalLabel = isBiblical ? 'Canonical' : 'Document order'
  const controlsBar = (countLabel: string) => (
    <div className="flex items-center justify-between gap-3 flex-wrap pb-2">
      <p className="text-xs text-gray-400">{countLabel}</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span title="Show surrounding verses for context">Context</span>
          <div className="flex items-center gap-0.5 rounded-full bg-gray-100 p-0.5">
            {[0, 1, 2, 3].map(n => (
              <button key={n} type="button" onClick={() => setContext(n)}
                className={`rounded-none px-2 py-0.5 tabular-nums transition-colors ${context === n ? 'bg-surface text-brand-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                {n === 0 ? 'off' : `±${n}`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-0.5 rounded-full bg-gray-100 p-0.5 text-[11px]">
          {(['relevance', 'canonical'] as SortMode[]).map(m => (
            <button key={m} type="button" onClick={() => setSort(m)}
              className={`rounded-none px-2.5 py-0.5 transition-colors ${sort === m ? 'bg-surface text-brand-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m === 'relevance' ? 'Relevance' : canonicalLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // A background hit's text: neighbouring sections when Context is on, else the windowed snippet.
  const bgHitText = (h: BgHit) => {
    const isGrc = bg?.lang === 'grc'
    const ctx = context > 0 ? ctxMap[bgCtxKey(h.target)] : undefined
    if (ctx && ctx.length > 0) {
      return (
        <span className={`block text-sm leading-relaxed ${isGrc ? 'greek-text' : ''}`}>
          {ctx.map(cv => {
            const isHit = cv.chapter === h.target.chapter && cv.verse === h.target.verse
            return (
              <span key={`${cv.chapter}.${cv.verse}`} className={isHit ? 'text-gray-800' : 'text-gray-400'}>
                {hiliteVerse(cv.text, terms)}{' '}
              </span>
            )
          })}
        </span>
      )
    }
    return <span className={`block text-sm text-gray-700 leading-relaxed ${isGrc ? 'greek-text' : ''}`}>{renderSnippet(h.text, terms)}</span>
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
        <div className="relative">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-input px-3 py-2.5 shadow-sm">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={onQueryChange}
              onKeyDown={e => { if (e.key === 'Enter') { lastPickedRef.current = query.trim(); pushRecent(query); setShowSug(false) } if (e.key === 'Escape') setShowSug(false) }}
              onFocus={() => { if (suggestions.length) setShowSug(true) }}
              placeholder="Search the Greek NT & LXX, translations, or background texts…"
              className={`flex-1 min-w-0 text-base outline-none placeholder:text-gray-400 ${greekInput ? 'greek-text' : ''}`}
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus() }}
                className="flex-none text-gray-400 hover:text-gray-700 p-0.5" title="Clear" aria-label="Clear search">
                <X size={16} />
              </button>
            )}
            <button type="button" onClick={toggleGreekInput} aria-pressed={greekInput}
              title="Type Greek with a QWERTY keyboard (Beta Code: l→λ, q→θ …)"
              className={`flex-none w-7 h-7 flex items-center justify-center rounded-none text-base font-semibold transition-colors greek-text ${greekInput ? 'bg-brand-600 text-white' : 'text-brand-600 hover:bg-brand-50'}`}>
              α
            </button>
          </div>

          {/* Predictive suggestions (complete the last word) */}
          {showSug && suggestions.length > 0 && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSug(false)} />
              <div className="absolute left-0 right-0 top-full mt-1 z-40 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-lg">
                {suggestions.map(s => (
                  <button key={s.word} type="button" onMouseDown={e => { e.preventDefault(); pickSuggestion(s.word) }}
                    className="w-full text-left px-3 py-2 hover:bg-brand-50 border-b border-gray-50 last:border-0 flex items-baseline gap-2">
                    <span className={`text-gray-800 shrink-0 ${GREEK_RE.test(s.word) ? 'greek-text text-base' : 'text-sm'}`}>{s.word}</span>
                    {s.sub && <span className="text-xs text-gray-400 truncate">{s.sub}</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {greekInput && (
          <p className="mt-1 text-[11px] text-gray-400">Typing Greek (Beta Code): <span className="greek-text">{BETA_LEGEND}</span></p>
        )}

        {/* Scope + book + Search types */}
        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center flex-wrap gap-2">
            <label className="flex items-center gap-1.5 text-gray-500">
              In
              <select value={scopeVal} onChange={e => setScopeVal(e.target.value)}
                className="rounded border border-gray-300 bg-surface px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400">
                <optgroup label="Greek">
                  <option value="greek:GNT">Greek — New Testament</option>
                  <option value="greek:LXX">Greek — Septuagint</option>
                </optgroup>
                <optgroup label="Translations">
                  {TRANSLATIONS.map(t => <option key={t.lang} value={`trans:${t.lang}`}>{t.label}</option>)}
                </optgroup>
                <optgroup label="Background texts">
                  <option value="bg:all">All background texts</option>
                  <option value="bggrc:all">All background texts — Greek (LXX)</option>
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
                    showBooks || books.length > 0 ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-surface text-gray-600 hover:bg-gray-50'}`}>
                  {booksLabel}
                  <ChevronDown size={13} className={`transition-transform ${showBooks ? 'rotate-180' : ''}`} />
                </button>
              </span>
            )}
          </div>

          {/* Search types */}
          <div className="relative flex-none">
            <button type="button" onClick={() => setShowTypes(v => !v)} aria-expanded={showTypes}
              className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors ${
                showTypes ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-surface text-gray-600 hover:bg-gray-50'}`}>
              <Lightbulb size={13} /> Search types
            </button>
            {showTypes && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowTypes(false)} />
                <div className="absolute right-0 top-full mt-2 z-30 w-[min(92vw,26rem)] max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Search types</p>
                    <button type="button" onClick={() => setShowTypes(false)} className="text-gray-400 hover:text-gray-700 p-0.5" aria-label="Close"><X size={14} /></button>
                  </div>
                  <div className="space-y-3">
                    {SEARCH_EXAMPLES.map(sec => (
                      <div key={sec.group}>
                        <p className="text-[13px] font-semibold text-gray-700">{sec.group}</p>
                        <p className="text-[11px] text-gray-400 mb-1.5">{sec.hint}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {sec.items.map(ex => (
                            <button key={ex.label} type="button" onClick={() => runExample(ex)}
                              className={`inline-flex items-center rounded-none border border-gray-200 bg-surface px-2.5 py-1 text-xs text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors ${GREEK_RE.test(ex.label) ? 'greek-text' : ''}`}>
                              {ex.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
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
                  className={`flex-none inline-flex items-center gap-1 rounded-none border px-3 py-1 text-xs font-medium transition-colors ${
                    active ? 'border-brand-600 bg-brand-600 text-white'
                           : 'border-gray-200 bg-surface text-gray-600 hover:border-brand-200 hover:bg-brand-50'}`}>
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
                      className={`inline-flex items-center rounded-none border border-gray-200 bg-surface px-3 py-1 text-sm text-gray-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 transition-colors ${GREEK_RE.test(r) ? 'greek-text' : ''}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {noResults && (
          <p className="py-16 text-center text-sm text-gray-400">No matches.</p>
        )}

        {/* Biblical hits */}
        {!loading && isBiblical && displayBib && displayBib.length > 0 && (
          <div>
            {controlsBar(`${displayBib.length}${displayBib.length >= 300 ? '+' : ''} verse${displayBib.length === 1 ? '' : 's'}`)}
            {scope.kind === 'greek' ? (
              <GreekSearchResults
                hits={displayBib}
                terms={terms}
                corpus={scope.corpus}
                bookName={bookName}
                context={context}
                ctxMap={ctxMap}
                onOpen={h => openBiblical(`${h.osisId} ${h.chapter}:${h.verse}`)}
              />
            ) : (
            <div className="divide-y divide-gray-100">
              {displayBib.map((h, i) => {
                const key = `${h.osisId}.${h.chapter}.${h.verse}`
                const ctx = context > 0 ? ctxMap[key] : undefined
                return (
                  <div key={i} className="relative group">
                    <button onClick={() => openBiblical(`${h.osisId} ${h.chapter}:${h.verse}`, h.greek ? undefined : (scope.kind === 'trans' ? scope.lang : undefined))} className="block w-full text-left py-2.5 px-2 pr-9 rounded-none hover:bg-brand-50 transition-colors">
                      <span className="text-xs font-medium text-brand-600">{bookName.get(h.osisId) ?? h.osisId} {h.chapter}:{h.verse}</span>
                      {ctx && ctx.length > 0 ? (
                        <span className={`block text-sm leading-relaxed ${h.greek ? 'greek-text' : ''}`}>
                          {ctx.map(cv => {
                            const isHit = cv.chapter === h.chapter && cv.verse === h.verse
                            return (
                              <span key={`${cv.chapter}.${cv.verse}`} className={isHit ? 'text-gray-800' : 'text-gray-400'}>
                                <sup className="text-[10px] text-gray-400 mr-0.5">{cv.chapter === h.chapter ? cv.verse : `${cv.chapter}:${cv.verse}`}</sup>
                                {hiliteVerse(cv.text, terms)}{' '}
                              </span>
                            )
                          })}
                        </span>
                      ) : (
                        <span className={`block text-sm text-gray-700 leading-relaxed ${h.greek ? 'greek-text' : ''}`}>{hiliteVerse(h.text, terms)}</span>
                      )}
                    </button>
                    <button type="button" onClick={e => { e.stopPropagation(); void copyHit(h, ctx) }}
                      title="Copy verse(s)" aria-label="Copy verse(s)"
                      className="absolute top-2 right-2 p-1 rounded text-gray-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-brand-700 hover:bg-surface transition">
                      {copiedKey === key ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                )
              })}
            </div>
            )}
          </div>
        )}

        {/* Background hits */}
        {!loading && !isBiblical && bg && bg.total > 0 && displayBg && (
          <div>
            {controlsBar(`${bg.total}${bg.truncated ? '+' : ''} match${bg.total === 1 ? '' : 'es'} in ${bg.groups.length} work${bg.groups.length === 1 ? '' : 's'}`)}
            {displayBg.mode === 'flat' ? (
              // Relevance: a single list across works, each row labelled with its work.
              <div className="divide-y divide-gray-100">
                {displayBg.hits.map(({ h, work }, i) => (
                  <button key={i} onClick={() => openBackground(h.target)} className="block w-full text-left py-2.5 px-2 rounded-none hover:bg-brand-50 transition-colors">
                    <span className="text-xs font-medium text-brand-600">{h.ref}</span>
                    <span className="text-xs text-gray-400"> · {work}</span>
                    {bgHitText(h)}
                  </button>
                ))}
              </div>
            ) : (
              // Document order: grouped by work, in catalog order.
              displayBg.groups.map(g => (
                <div key={g.gid} className="py-1.5">
                  <p className="py-1 text-sm font-semibold text-gray-600">{g.name} <span className="text-gray-400 font-normal">· {g.count}</span></p>
                  <div className="divide-y divide-gray-100">
                    {g.hits.map((h, i) => (
                      <button key={i} onClick={() => openBackground(h.target)} className="block w-full text-left py-2.5 px-2 rounded-none hover:bg-brand-50 transition-colors">
                        <span className="text-xs font-medium text-brand-600">{h.ref}</span>
                        {bgHitText(h)}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
