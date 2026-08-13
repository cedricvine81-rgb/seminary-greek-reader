'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type ChangeEvent } from 'react'
import { translatable, greekText } from '@/lib/i18n/machine-translation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, ChevronDown, Lightbulb, X, Copy, Check, ArrowLeft, ArrowUpRight, MoreVertical, Blocks, Map as MapIcon} from 'lucide-react'
import { TEXT_CATEGORIES } from '@/lib/texts-catalog'
import { FONT_SIZES, FONT_SIZE_MAP, type PhraseFontSize } from '@/components/phrase/PhraseExplorer'
import { TextSizeSlider } from '@/components/reader/TextSizeControls'
import { usePref } from '@/lib/use-pref'
import { BookPicker, type BookGroup, type PickBook } from './BookPicker'
import { GreekSearchResults } from './GreekSearchResults'
import { SearchWords } from './SearchWords'
import { HebrewSearchResults } from './HebrewSearchResults'
import { ParsingDock } from './ParsingDock'
import { markScrollRestore } from '@/lib/scroll-restore'
import { findProseWork } from '@/lib/prose-texts'
import { noteBookFor } from '@/lib/note-book'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { bookName as bookNameFor, bookAbbrev, hasBookNames } from '@/lib/i18n/book-names'
import { defaultReadingLang } from '@/lib/reading-language'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { BgResult, BgLang, BgHit } from '@/lib/backgrounds-search-types'
import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'
import { isExamLocked } from '@/lib/exam-lockdown'
import { parseSearchTerms, scoreRelevance } from '@/lib/search-query'
import { findTermRanges, markSlice, normalizeFold, SEARCH_MARK } from '@/lib/highlight-terms'
import { betaCodeToGreek } from '@/lib/greek-translit'
import { latinToHebrew, HEBREW_LEGEND } from '@/lib/hebrew-translit'

// The full-page "Master Search" (/search). One input searches any biblical text (Greek NT/LXX,
// or a translation) or any background collection, optionally scoped to books. Matches show in
// red; clicking a hit opens it in the right reader. Reached from the header icon / ⌘K / the
// right-click word menu (all via MasterSearchProvider → router.push('/search?…')).

const TRANSLATIONS = [
  { lang: 'en',  key: 'search.trans.enWeb' },
  { lang: 'bsb', key: 'search.trans.enBsb' },
  { lang: 'es',  key: 'search.trans.es' },
  { lang: 'fr',  key: 'search.trans.fr' },
  { lang: 'pt',  key: 'search.trans.pt' },
  { lang: 'ru',  key: 'search.trans.ru' },
  { lang: 'ko',  key: 'search.trans.ko' },
  { lang: 'zh',  key: 'search.trans.zh' },
]

// Which translation a search starts in. It follows the READER'S language where that language
// has an index of its own: opening the search in Spanish and being handed the English Bible
// made the Spanish interface cosmetic — every result came back in a language the student had
// just chosen not to read. Every interface locale currently has a matching index, so the
// fallback is only a guard for a future locale that ships before its translation does.
const TRANS_LANGS = new Set(TRANSLATIONS.map(tr => tr.lang))
function defaultTransLang(locale: string): string {
  return TRANS_LANGS.has(locale) ? locale : 'en'
}
const COLLECTIONS = TEXT_CATEGORIES.filter(c => !c.comingSoon && c.works.length > 0)

// LXX books with no Protestant-canon counterpart — shown only for the Greek Septuagint scope,
// not for translation scopes (whose indexes are the 66-book canon).
const DEUTERO = new Set(['1Esd', 'Tob', 'Jdt', 'PsSol', 'Wis', 'Sir', 'EpJer', 'Bar', 'Sus', 'Bel', '1Macc', '2Macc', '3Macc', '4Macc', 'Odes'])

interface Catalog { gnt: PickBook[]; lxx: PickBook[] }

type Scope =
  | { kind: 'greek'; corpus: 'GNT' | 'LXX' }
  | { kind: 'hebrew' }
  | { kind: 'trans'; lang: string }
  | { kind: 'bg'; category: string | null; lang?: 'grc' }

function parseScope(v: string): Scope {
  if (v.startsWith('greek:')) return { kind: 'greek', corpus: v.slice(6) as 'GNT' | 'LXX' }
  if (v.startsWith('hebrew:')) return { kind: 'hebrew' }
  if (v.startsWith('trans:')) return { kind: 'trans', lang: v.slice(6) }
  // bggrc: forces the Greek (Septuagint) facet of the background corpus; bg: auto-detects.
  if (v.startsWith('bggrc:')) { const c = v.slice(6); return { kind: 'bg', category: c === 'all' ? null : c, lang: 'grc' } }
  const cat = v.slice(3)
  return { kind: 'bg', category: cat === 'all' ? null : cat }
}

const GREEK_RE = /[Ͱ-Ͽἀ-῿]/
const HEBREW_RE = /[֐-׿]/
const MARK = SEARCH_MARK

// Result-text size for the ⋮ display menu — the same sm/md/lg/xl steps and Α-slider control the
// exegesis panes use (see PhraseExplorer/ExegesisTabs), applied to the results container and
// inherited by the rows (metadata like refs/counts keeps its own fixed small sizes).
const FONT_SIZE_KEY = 'search:fontSize'

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

// A background Greek hit's aligned English (Josephus/Whiston, Greco-Roman/Perseus) is stored per
// whole section, so it can be many times longer than the windowed Greek snippet shown beside it —
// which made results wildly uneven (most Greek-only, the occasional section-start hit a huge wall
// of English). Clamp it to a comparable preview so every row stays roughly the same height.
function clampTrans(text: string): string {
  const MAX = 2 * RADIUS   // ~280 chars, matching renderSnippet's no-match head() bound
  if (text.length <= MAX) return text
  const cut = text.slice(0, MAX)
  const sp = cut.lastIndexOf(' ')
  return (sp > MAX * 0.7 ? cut.slice(0, sp) : cut).trimEnd() + '…'
}

interface BibHit { osisId: string; chapter: number; verse: number; text: string; greek: boolean; hebrew?: boolean; matchWords?: string[] }

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
    : s.kind === 'hebrew'
    ? `/api/search?q=${encodeURIComponent(q)}&type=word&corpus=MT`
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
// An example is CLICKED TO RUN, so `queryKey` is not a caption — it is the query itself, and
// it has to be a word that actually occurs in the corpus the example searches. That splits the
// list in two: the first three groups search a Bible translation, which follows the reader's
// language, so their queries are looked up; the Greek and background groups pin an explicit
// scope whose corpus is Greek / English in every locale, so their queries are literals. A
// translated "temple" would search the English Philo for a Spanish word and quietly find
// nothing — the one failure mode an example is supposed to rule out.
interface Example { queryKey?: string; query?: string; scope?: string }
const SEARCH_EXAMPLES: { groupKey: string; hintKey: string; items: Example[] }[] = [
  { groupKey: 'search.ex.singleWord', hintKey: 'search.ex.singleWordHint', items: [
    { queryKey: 'search.ex.q.love' },
    { queryKey: 'search.ex.q.grace' },
    { queryKey: 'search.ex.q.covenant' },
  ] },
  { groupKey: 'search.ex.allWords', hintKey: 'search.ex.allWordsHint', items: [
    { queryKey: 'search.ex.q.faithHopeLove' },
    { queryKey: 'search.ex.q.breadWine' },
  ] },
  { groupKey: 'search.ex.phrase', hintKey: 'search.ex.phraseHint', items: [
    { queryKey: 'search.ex.q.kingdomOfGod' },
    { queryKey: 'search.ex.q.eternalLife' },
  ] },
  { groupKey: 'search.ex.greek', hintKey: 'search.ex.greekHint', items: [
    { query: 'ἀγάπη', scope: 'greek:GNT' },
    { query: 'λόγος', scope: 'greek:GNT' },
    { query: 'πίστις', scope: 'greek:GNT' },
  ] },
  { groupKey: 'search.ex.bg', hintKey: 'search.ex.bgHint', items: [
    { query: 'temple', scope: 'bg:all' },
    { query: 'Sabbath', scope: 'bg:all' },
  ] },
]

// Friendly name for the page a search was launched from (its path), for the "Return to" button.
const RETURN_LABELS: { test: RegExp; key: string }[] = [
  { test: /^\/reader/, key: 'search.return.reader' },
  { test: /^\/exegesis\?.*tab=texts/, key: 'search.return.texts' },
  { test: /^\/exegesis\?.*tab=backgrounds/, key: 'search.return.backgrounds' },
  { test: /^\/exegesis\?.*tab=commentary/, key: 'search.return.commentary' },
  { test: /^\/exegesis\?.*tab=notes/, key: 'search.return.notes' },
  { test: /^\/exegesis/, key: 'search.return.exegesis' },
  { test: /^\/vocab/, key: 'search.return.vocabulary' },
  { test: /^\/(grammar|morphology)/, key: 'search.return.grammar' },
]
function returnLabelFor(from: string, t: (k: string) => string): string {
  return t(RETURN_LABELS.find(r => r.test.test(from))?.key ?? 'search.return.page')
}

export function SearchPageView({ initialQuery = '', initialScope, initialLemma = false, initialBooks, initialStrongs, returnTo, embedded = false, onRequestClose, isAuthenticated = false, onParseInfo, onParsePaneActive }: { initialQuery?: string; initialScope?: string; initialLemma?: boolean; initialBooks?: string; initialStrongs?: string; returnTo?: string; embedded?: boolean; onRequestClose?: () => void; isAuthenticated?: boolean;
  // When embedded, the parsing pane is hoisted to the host panel so it sits BELOW the results as
  // a real bottom pane (not a sticky overlay): onParseInfo streams the current parse up, and
  // onParsePaneActive says whether Greek results are showing (so the host can mount the pane).
  onParseInfo?: (info: LexicalInfoPanel | null) => void; onParsePaneActive?: (active: boolean) => void }) {
  const router = useRouter()
  const t = useT()
  const locale = useLocale()
  const homeTrans = defaultTransLang(locale)
  const [query, setQuery] = useState(initialQuery)
  const [scopeVal, setScopeVal] = useState(initialScope || `trans:${homeTrans}`)
  const [transLang, setTransLang] = useState(initialScope?.startsWith('trans:') ? initialScope.slice(6) : homeTrans)
  const [books, setBooks] = useState<string[]>(initialBooks ? initialBooks.split(',').filter(Boolean) : [])
  const [showBooks, setShowBooks] = useState(false)
  const [showTypes, setShowTypes] = useState(false)
  // ⋮ display menu: result-text size (defaults to Large, like the exegesis panes), persisted.
  const [showDisplay, setShowDisplay] = useState(false)
  const [fontSize, pickFontSize] = usePref<PhraseFontSize>(FONT_SIZE_KEY, FONT_SIZES, 'lg')
  // Parsing pane for Greek background results (the Greek NT/LXX lanes have their own inside
  // GreekSearchResults). Filled by hovering/clicking a word; word data is fetched lazily —
  // LXX hits from the reader API, Josephus / Greco-Roman prose from their morph sidecars.
  const [bgInfo, setBgInfo] = useState<LexicalInfoPanel | null>(null)
  const [bgSelKey, setBgSelKey] = useState<string | null>(null)
  // The parsing pane is always the search view's OWN bottom dock — including in the embedded
  // side-panel over the Reader, so a clicked Greek word parses within the panel rather than
  // filling the Reader's pane hidden behind it (a standalone, draggable pane in the panel).
  const showBgInfo = (i: LexicalInfoPanel | null) => { setBgInfo(i); onParseInfo?.(i) }
  const lxxWords = useRef<Record<string, { surface: string; lemma: string; gloss?: string; strongs?: string; parsing: string }[]>>({})
  const morphMaps = useRef<Record<string, Record<string, ([string, string] | null)[]> | null>>({})
  const bgFetching = useRef<Set<string>>(new Set())
  const [bib, setBib] = useState<BibHit[] | null>(null)
  const [bg, setBg] = useState<BgResult | null>(null)
  const [counts, setCounts] = useState<Record<string, number | null>>({})
  const [recent, setRecent] = useState<string[]>([])
  const [sort, setSort] = useState<SortMode>('relevance')
  // Parallel-translation column language for the Greek / Hebrew results (the selector lives in
  // the controls bar; the results components receive it as a prop). 'none' = source only.
  // The translation shown beside a Greek or Hebrew result. Follows the reader's language for
  // the same reason the search scope does: an English column beside Greek results is no use to
  // someone who has just told the app they read Spanish.
  const [parallelLang, setParallelLang] = useState(() => defaultReadingLang(locale))
  const [context, setContext] = useState(0)   // verse-context radius: 0 (off) … 3
  const [ctxMap, setCtxMap] = useState<Record<string, { chapter: number; verse: number; text: string }[]>>({})
  // The English of each background-Greek hit's context verses (fetched from the 'en' facet, same
  // refs), so expanding the context grows the translation column alongside the Greek.
  const [ctxTransMap, setCtxTransMap] = useState<Record<string, { chapter: number; verse: number; text: string }[]>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [greekInput, setGreekInput] = useState(false)   // QWERTY→Greek (Beta Code) typing
  const [hebrewInput, setHebrewInput] = useState(false) // QWERTY→Hebrew (phonetic), same idea
  const [suggestions, setSuggestions] = useState<{ word: string; sub?: string; strongs?: string }[]>([])
  const [showSug, setShowSug] = useState(false)
  // Seeded with the arrival query (preset / deep link) so the suggestions dropdown doesn't
  // auto-open over the results the moment the page/panel loads with a prefilled search.
  const lastPickedRef = useRef(initialQuery.trim())
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
  // Hebrew "all forms": the clicked word's Strong's number, active only while the query still
  // matches what set it — either the word-menu preset (initialStrongs) or a picked lexeme
  // suggestion (hebPick, which carries the suggestion's Strong's). Editing the box drops back
  // to a surface search.
  const [hebPick, setHebPick] = useState<{ q: string; strongs: string } | null>(null)
  const hebStrongs = hebPick && query.trim() === hebPick.q
    ? hebPick.strongs
    : initialStrongs && query.trim() === initialQuery.trim() ? initialStrongs : null
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

  // The picker grid shows ABBREVIATIONS, so it needs the short forms rather than the names the
  // reference labels use. Identity is the osisId in `selected` / `onToggle`, untouched — only
  // what the button reads changes. Skipped wholesale for a locale with no book names, so an
  // English reader maps over nothing.
  const localizeBooks = useCallback((bs: readonly PickBook[]): readonly PickBook[] =>
    hasBookNames(locale)
      ? bs.map(b => ({ ...b, name: bookNameFor(b.osisId, locale, b.name), abbrev: bookAbbrev(b.osisId, locale, b.abbrev) }))
      : bs, [locale])
  const bookGroups: BookGroup[] = useMemo(() => {
    if (!catalog) return []
    if (scope.kind === 'greek') {
      if (scope.corpus === 'GNT') return [{ heading: t('books.nt'), books: localizeBooks(catalog.gnt) }]
      return [
        { heading: t('books.ot'), books: localizeBooks(catalog.lxx.filter(b => !DEUTERO.has(b.osisId))) },
        { heading: t('books.deutero'), books: localizeBooks(catalog.lxx.filter(b => DEUTERO.has(b.osisId))) },
      ]
    }
    if (scope.kind === 'trans') return [
      { heading: t('books.ot'), books: localizeBooks(catalog.lxx.filter(b => !DEUTERO.has(b.osisId))) },
      { heading: t('books.nt'), books: localizeBooks(catalog.gnt) },
    ]
    return []
  }, [catalog, scope, t, localizeBooks])
  // Every rendered verse reference on this page — and in the Greek/Hebrew results components,
  // which take this as a prop — resolves its book through this map, so localizing it here is
  // the whole change. The reference STRINGS built from it are display labels; the identity
  // always travels beside them as `book: h.osisId`, which is what note keys and highlights use.
  const bookName = useMemo(() => {
    const m = new Map<string, string>()
    if (catalog) for (const b of [...catalog.gnt, ...catalog.lxx]) m.set(b.osisId, bookNameFor(b.osisId, locale, b.name))
    return m
  }, [catalog, locale])
  const selectedSet = useMemo(() => new Set(books), [books])
  const booksLabel = books.length === 0 ? t('search.booksAny')
    : books.length === 1 ? (bookName.get(books[0]) ?? books[0])
    : t('search.booksN', { count: books.length, n: books.length })
  const booksKey = books.join(',')

  const laneList = useMemo(() => [
    { val: `trans:${transLang}`, label: t(TRANSLATIONS.find(tr => tr.lang === transLang)?.key ?? 'search.trans.generic') },
    { val: 'greek:GNT', label: t('search.lane.greekNT') },
    { val: 'greek:LXX', label: t('search.lane.greekLXX') },
    { val: 'bg:all', label: t('search.lane.backgrounds') },
  ], [transLang, t])
  const activeLane = scope.kind === 'bg' ? 'bg:all'
    : scope.kind === 'greek' ? `greek:${scope.corpus}`
    : scope.kind === 'hebrew' ? 'hebrew:MT'
    : `trans:${transLang}`

  // Embedded: the scope dropdown's options carry the live lane counts (the panel has no tab
  // row). Lanes without a fetched count (other translations, single collections) stay plain.
  const optCount = (val: string): string => {
    if (!embedded) return ''
    const c = counts[val]
    if (c === null || c === undefined) return ''
    return ` (${c >= 300 ? '300+' : c})`
  }

  // Hydrate persisted state from localStorage ONCE, then mark mounted. Saves are gated on
  // `mounted` so this restore isn't clobbered by an initial-render write. URL params win.
  useEffect(() => {
    if (!initialScope) { try { const s = localStorage.getItem(SCOPE_STORAGE_KEY); if (s) setScopeVal(s) } catch {} }
    if (!initialQuery) { try { const q = localStorage.getItem(QUERY_STORAGE_KEY); if (q) { setQuery(q); lastPickedRef.current = q.trim() } } catch {} }   // seeded → no dropdown over restored results
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
  // Keep the keyboard and the scope in step: leaving a Hebrew scope with the Hebrew keyboard
  // still on would silently transliterate a Greek or English query into Hebrew letters.
  useEffect(() => {
    if (scope.kind !== 'hebrew' && hebrewInput) setHebrewInput(false)
    if (scope.kind === 'hebrew' && greekInput) setGreekInput(false)
  }, [scope.kind, hebrewInput, greekInput])
  useEffect(() => {
    if (!mounted) return
    try { if (query.trim()) localStorage.setItem(QUERY_STORAGE_KEY, query); else localStorage.removeItem(QUERY_STORAGE_KEY) } catch {}
  }, [query, mounted])
  // Keep the URL in sync (bookmarkable / shareable) without a server round-trip.
  useEffect(() => {
    // Embedded (the side panel over another page): the URL belongs to the page underneath —
    // rewriting it to /search?… would clobber the host page's address (and the reader's
    // ?ref=&corpus= position). The full /search page is the only owner of the URL.
    if (!mounted || embedded) return
    const p = new URLSearchParams()
    if (query.trim()) p.set('q', query.trim())
    p.set('in', scopeVal)
    if (books.length) p.set('books', books.join(','))
    // Keep the origin (`from`) in the URL so "Return to page" survives a refresh / deep-link /
    // bookmark of /search — without it, a reload would strip the origin and strand the user here.
    // `returnTo` is a stable prop (set once from searchParams), so it's read from the closure and
    // deliberately not a dep — keeping this deps array a constant length.
    if (returnTo) p.set('from', returnTo)
    // Keep the Hebrew "all forms" Strong's number in the URL while it's active, so a reload
    // re-runs the same by-lemma search instead of falling back to a surface search.
    if (hebStrongs) p.set('strongs', hebStrongs)
    const qs = p.toString()
    window.history.replaceState(null, '', qs ? `/search?${qs}` : '/search')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, scopeVal, books, hebStrongs, mounted])
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

  const runSearch = useCallback(async (q: string, sv: string, bks: string, srt: SortMode, lemma: boolean, strongs: string | null) => {
    if (q.trim().length < 2 && !strongs) { setBib(null); setBg(null); setLoading(false); return }
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
        // Hebrew: "all forms" (a Strong's number, from the word menu) vs "this form" (surface).
        const url = s.kind === 'hebrew'
          ? (strongs
              ? `/api/search?q=${encodeURIComponent(strongs)}&type=strongs&corpus=MT`
              : `/api/search?q=${encodeURIComponent(q.trim())}&type=word&corpus=MT`)
          : s.kind === 'greek'
          ? `/api/search?q=${encodeURIComponent(q.trim())}&type=word&corpus=${s.corpus}${lemma ? '&lemma=true' : ''}${bookParam}`
          : `/api/search?q=${encodeURIComponent(q.trim())}&type=word&lang=${s.lang}${bookParam}${rankParam}`
        const res = await fetch(url)
        const data = res.ok ? await res.json() : { results: [] }
        const hits: BibHit[] = s.kind === 'greek'
          ? (data.results as { bookId: string; chapter: number; verse: number; text: string }[]).map(v => ({
              osisId: v.bookId, chapter: v.chapter, verse: v.verse, text: v.text, greek: true,
            }))
          : s.kind === 'hebrew'
          ? (data.results as { bookId: string; chapter: number; verse: number; text: string; matchWords?: string[] }[]).map(v => ({
              osisId: v.bookId, chapter: v.chapter, verse: v.verse, text: v.text, greek: false, hebrew: true, matchWords: v.matchWords,
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
    const timer = setTimeout(() => void runSearch(query, scopeVal, booksKey, sort, lemmaMode, hebStrongs), 250)
    return () => clearTimeout(timer)
  }, [query, scopeVal, booksKey, sort, lemmaMode, hebStrongs, runSearch])

  // Live counts for the result-type tabs (all lanes, in parallel). Debounced; reqId guard.
  // Embedded (the side panel) shows no tab row — the counts go into the scope dropdown's
  // option labels instead — and additionally counts the Hebrew lane (the tabs never had one).
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setCounts({}); return }
    const id = ++countReq.current
    const lanes = [...laneList.map(l => l.val), ...(embedded ? ['hebrew:MT'] : [])]
    setCounts(prev => { const n: Record<string, number | null> = {}; for (const v of lanes) n[v] = prev[v] ?? null; return n })
    const timer = setTimeout(() => {
      for (const val of lanes) {
        fetchLaneCount(val, q, lemmaMode)
          .then(c => { if (id === countReq.current) setCounts(prev => ({ ...prev, [val]: c })) })
          .catch(() => { if (id === countReq.current) setCounts(prev => ({ ...prev, [val]: 0 })) })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, laneList, lemmaMode, embedded])

  // Verse context for biblical hits: when the slider is > 0, fetch each shown hit's neighbouring
  // verses (same chapter) so it can be read in context. One batched POST; a reqId drops stale.
  useEffect(() => {
    // Neighbour-verse context isn't wired for the MT yet — Hebrew hits show without it.
    if (context === 0 || scope.kind === 'hebrew') { setCtxMap({}); setCtxTransMap({}); return }
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
    // For a Greek background scope, also pull the English of those same context verses (the 'en'
    // facet, same opaque refs) so the translation column expands with the Greek. Others: clear it.
    if (!isBiblical && bg && bg.total > 0 && bg.lang === 'grc') {
      const refs = bg.groups.flatMap(g => g.hits.map(h => bgCtxKey(h.target)))
      fetch('/api/search/context', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'bg', lang: 'en', radius: context, refs }) })
        .then(r => r.ok ? r.json() : { context: {} })
        .then(d => { if (id === ctxReq.current) setCtxTransMap(d.context || {}) })
        .catch(() => { if (id === ctxReq.current) setCtxTransMap({}) })
    } else {
      setCtxTransMap({})
    }
  }, [isBiblical, context, displayBib, bg, scope])

  // Tell an embedding host whether Greek background results are on screen, so it can mount its
  // own bottom parsing pane (a real flex-none pane below the results, not this view's overlay).
  const greekPaneActive = !loading && !isBiblical && bg?.lang === 'grc' && (bg?.total ?? 0) > 0
  useEffect(() => { onParsePaneActive?.(greekPaneActive) }, [greekPaneActive, onParsePaneActive])
  useEffect(() => () => { onParsePaneActive?.(false) }, [onParsePaneActive])

  // Predictive typing: autocomplete the last word of the query. Hebrew scope / Hebrew text →
  // pointed Hebrew lemmas (with glosses + Strong's, so a pick runs "all forms"); translation
  // scope → that language's words; Greek scope / Greek text → Greek dictionary lexemes.
  useEffect(() => {
    const lastWord = query.match(/\S*$/)?.[0] ?? ''
    if (lastWord.length < 2 || lastWord.startsWith('"') || query.trim() === lastPickedRef.current) { setSuggestions([]); return }
    // Script wins over scope (a Hebrew/Greek word gets its own dictionary anywhere); otherwise
    // a translation's own words (or English for background text). Greek scope has no lang.
    let langParam = ''
    if (HEBREW_RE.test(lastWord) || scope.kind === 'hebrew') langParam = '&hebrew=1'
    else if (GREEK_RE.test(lastWord)) langParam = ''
    else if (scope.kind === 'trans') langParam = `&lang=${scope.lang}`
    else if (scope.kind === 'bg' && scope.lang !== 'grc') langParam = '&lang=en'
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
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
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [query, scope])

  function onQueryChange(e: ChangeEvent<HTMLInputElement>) {
    const el = e.target
    const pos = el.selectionStart ?? el.value.length
    if (greekInput || hebrewInput) {
      setQuery(greekInput ? betaCodeToGreek(el.value) : latinToHebrew(el.value))
      requestAnimationFrame(() => { try { el.setSelectionRange(pos, pos) } catch {} })
    } else {
      setQuery(el.value)
    }
  }
  // Embedded panel → the full /search page in a NEW BROWSER TAB, carrying the current search
  // whole (query, scope, book restriction, lemma / Strong's "all forms" mode). The original tab
  // keeps the reader + panel untouched, so the two contexts live side by side — browser tabs as
  // panes. Recomputed each render so the href always reflects the current search (and URL
  // params win over the shared retained-search localStorage in the new tab).
  const fullSearchHref = (() => {
    const p = new URLSearchParams()
    if (query.trim()) p.set('q', query.trim())
    p.set('in', scopeVal)
    if (books.length > 0) p.set('books', books.join(','))
    if (lemmaMode) p.set('mode', 'lemma')
    if (hebStrongs) p.set('strongs', hebStrongs)
    return `/search?${p.toString()}`
  })()

  // Straight to the Construct builder in a new tab, so a grammar search doesn't cost a trip through
  // the search page first. A single Greek word in the box becomes the construct's FIRST word (the
  // rest is a grammar question the text query can't express); anything longer opens the builder
  // blank. The Greek scope carries over, so a Septuagint search opens against the Septuagint.
  const constructHref = (() => {
    const p = new URLSearchParams()
    if (scope.kind === 'greek' && scope.corpus === 'LXX') p.set('in', 'LXX')
    const one = query.trim()
    if (one && !/\s/.test(one) && GREEK_RE.test(one)) p.set('c', `@${one}~`)
    const qs = p.toString()
    return qs ? `/search/construct?${qs}` : '/search/construct'
  })()

  function pickSuggestion(word: string, strongs?: string) {
    const next = query.replace(/\S*$/, word)
    lastPickedRef.current = next.trim()
    setQuery(next)
    // A Hebrew lexeme pick carries its Strong's number → run the "all forms" search for it
    // (a plain text search would miss construct/suffixed inflections).
    setHebPick(strongs ? { q: next.trim(), strongs } : null)
    setSuggestions([]); setShowSug(false)
    inputRef.current?.focus()
  }
  function toggleGreekInput() {
    const nv = !greekInput
    setGreekInput(nv)
    if (nv) { setHebrewInput(false); setQuery(q => betaCodeToGreek(q)) }
    inputRef.current?.focus()
  }
  function toggleHebrewInput() {
    const nv = !hebrewInput
    setHebrewInput(nv)
    if (nv) { setGreekInput(false); setQuery(q => latinToHebrew(q)) }
    inputRef.current?.focus()
  }

  const toggleBook = (osisId: string) =>
    setBooks(prev => prev.includes(osisId) ? prev.filter(b => b !== osisId) : [...prev, osisId])
  const toggleGroup = (ids: string[], select: boolean) =>
    setBooks(prev => select ? Array.from(new Set([...prev, ...ids])) : prev.filter(b => !ids.includes(b)))
  // The text of an example IS its query — resolved here so a looked-up example runs the
  // reader's language while a pinned-scope one runs its corpus's own.
  const exampleText = (ex: Example): string => ex.queryKey ? t(ex.queryKey) : (ex.query ?? '')
  const runExample = (ex: Example) => {
    if (ex.scope) setScopeVal(ex.scope)
    setQuery(exampleText(ex))
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

  function openBiblical(link: string, tl?: string, corpus?: 'MT') {
    pushRecent(query)
    const q = query.trim()
    const extra = `${q ? `&q=${encodeURIComponent(q)}` : ''}${tl ? `&tl=${encodeURIComponent(tl)}` : ''}${corpus ? `&corpus=${corpus}` : ''}`
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
  // ── Notes on search results ──────────────────────────────────────────────────────────
  // A result knows exactly which verse it found, so it can carry the same note button the
  // reader has; without it the only way to note a passage you just searched for was to open
  // it first. The note key comes from the SHARED resolver, so a note made here is the same
  // note the reader shows — see src/lib/note-book.ts.
  const [notedMap, setNotedMap] = useState<Record<string, Set<number>>>({})

  const hitNoteKey = useCallback((t: OpenInTextsTarget): string | null =>
    noteBookFor(t.source as string, { osisId: t.osisId, workDir: t.workDir, book: t.book }), [])

  const loadNoted = useCallback(async (pairs: [string, number][]) => {
    if (!isAuthenticated || !pairs.length) return
    const results = await Promise.all(pairs.map(async ([book, ch]) => {
      try {
        const r = await fetch(`/api/notes?book=${encodeURIComponent(book)}&chapter=${ch}&verseStart=1&verseEnd=700`)
        const d = await r.json()
        return [`${book}.${ch}`, new Set<number>((d.notes ?? []).map((n: { verse: number }) => n.verse))] as const
      } catch { return null }
    }))
    setNotedMap(prev => {
      const next = { ...prev }
      for (const r of results) if (r) next[r[0]] = r[1]
      return next
    })
  }, [isAuthenticated])

  // The distinct (noteBook, chapter) pairs currently on screen, capped so a large result set
  // cannot fan out into hundreds of requests.
  const shownNotePairs = useMemo(() => {
    const seen = new Map<string, [string, number]>()
    const hits = displayBg ? (displayBg.mode === 'flat' ? displayBg.hits.map(x => x.h) : displayBg.groups.flatMap(g => g.hits)) : []
    for (const h of hits) {
      const book = hitNoteKey(h.target)
      const ch = h.target.chapter
      if (!book || ch == null) continue
      const key = `${book}.${ch}`
      if (!seen.has(key)) seen.set(key, [book, ch])
      if (seen.size >= 40) break
    }
    return Array.from(seen.values())
  }, [displayBg, hitNoteKey])

  useEffect(() => { void loadNoted(shownNotePairs) }, [shownNotePairs, loadNoted])
  useEffect(() => onNotesChanged(() => void loadNoted(shownNotePairs)), [shownNotePairs, loadNoted])

  // The note button for one hit, or nothing when signed out / the work has no note key.
  function hitNote(h: BgHit): ReactNode {
    if (!isAuthenticated) return null
    const book = hitNoteKey(h.target)
    const ch = h.target.chapter
    const v = h.target.verse
    // A background hit always resolves to a chapter and verse; the target type allows them to
    // be absent for other openers, so bail rather than key a note on undefined.
    if (!book || ch == null || v == null) return null
    return (
      <span className="font-sans align-middle mr-1" onClick={e => e.stopPropagation()}>
        <VerseNoteButton book={book} chapter={ch} verse={v}
          noted={!!notedMap[`${book}.${ch}`]?.has(v)}
          onChanged={() => void loadNoted([[book, ch]])} />
      </span>
    )
  }

  function openBackground(target: OpenInTextsTarget) {
    pushRecent(query)
    const withTerm: OpenInTextsTarget = { ...target, highlight: query.trim() || undefined }
    // Texts is its own page now — open the hit there directly.
    router.push(`/texts?open=${encodeURIComponent(JSON.stringify(withTerm))}`)
  }

  // Context slider + sort toggle, shown above every result set (biblical and background). The
  // second sort mode is "Canonical" for Scripture, "Document order" for non-canonical works.
  const canonicalLabel = isBiblical ? t('search.sortCanonical') : t('search.sortDocOrder')
  const controlsBar = (countLabel: string) => (
    <div className="flex items-center justify-between gap-3 flex-wrap pb-2">
      <p className="text-xs text-gray-400">{countLabel}</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span title={t('search.contextTitle')}>{t('search.context')}</span>
          <div className="flex items-center gap-0.5 rounded-full bg-gray-100 p-0.5">
            {[0, 1, 2, 3].map(n => (
              <button key={n} type="button" onClick={() => setContext(n)}
                className={`rounded-full px-2 py-0.5 tabular-nums transition-colors ${context === n ? 'bg-surface text-brand-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                {n === 0 ? t('search.contextOff') : `±${n}`}
              </button>
            ))}
          </div>
        </div>
        {/* Parallel-translation selector — only where the results show a source|translation
            column (Greek / Hebrew scopes). Sits before the sort toggle so it reads above it. */}
        {(scope.kind === 'greek' || scope.kind === 'hebrew') && (
          <select value={parallelLang} onChange={e => setParallelLang(e.target.value)}
            title={t('search.parallelTitle')}
            className="rounded-md border border-gray-200 bg-surface px-2 py-1 text-[11px] text-gray-600">
            <option value="none">{t('search.noTranslation')}</option>
            {TRANSLATIONS.map(tr => <option key={tr.lang} value={tr.lang}>{t(tr.key)}</option>)}
          </select>
        )}
        <div className="flex items-center gap-0.5 rounded-full bg-gray-100 p-0.5 text-[11px]">
          {(['relevance', 'canonical'] as SortMode[]).map(m => (
            <button key={m} type="button" onClick={() => setSort(m)}
              className={`rounded-full px-2.5 py-0.5 transition-colors ${sort === m ? 'bg-surface text-brand-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m === 'relevance' ? t('search.sortRelevance') : canonicalLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Greek background hits: click-to-parse ─────────────────────────────────────────────
  // Resolve the word data for a hit's token and fill the parsing dock. LXX hits load their
  // chapter from the reader API (full lexeme + morphology); Josephus / Greco-Roman prose load
  // the work's morph sidecar ([lemma, parsing] aligned with the section's whitespace tokens).
  async function selectBgToken(h: BgHit, ti: number, surface: string, key: string,
                               tv?: { chapter: number; verse: number }) {
    setBgSelKey(key)
    // A word in a grey CONTEXT verse parses against that verse, not the matched one — same
    // work/corpus, only the chapter/verse differ.
    const tgt = tv ? { ...h.target, chapter: tv.chapter, verse: tv.verse } : h.target
    // Literal punctuation class (no \p{} — the repo's TS target predates the u-flag).
    const clean = surface.replace(/^[.,;:!?"“”‘’'`()[\]{}<>«»¿¡…—–·-]+|[.,;:!?"“”‘’'`()[\]{}<>«»¿¡…—–·-]+$/g, '')
    const base: LexicalInfoPanel = { surface: clean || surface, lexeme: '', gloss: '', partOfSpeech: '', parsing: '', reference: h.ref }
    if (tgt.source === 'lxx' && tgt.osisId) {
      const ck = `${tgt.osisId}.${tgt.chapter}`
      if (!(`lxx.${ck}.1` in lxxWords.current) && !bgFetching.current.has(ck)) {
        bgFetching.current.add(ck)
        try {
          const r = await fetch(`/api/reader?book=${tgt.osisId}&chapter=${tgt.chapter}&corpus=LXX`)
          const d = r.ok ? await r.json() : null
          for (const v of d?.verses ?? []) {
            lxxWords.current[`lxx.${ck}.${v.verse}`] = (v.words ?? []).map((w: { surface: string; lexeme?: { lexeme: string; gloss?: string; strongs?: string }; parses?: Record<string, string | null>[] }) => ({
              surface: w.surface, lemma: w.lexeme?.lexeme ?? '', gloss: w.lexeme?.gloss, strongs: w.lexeme?.strongs,
              parsing: w.parses?.[0]
                ? (['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const)
                    .map(k => w.parses![0][k]).filter(Boolean).join(', ')
                : '',
            }))
          }
        } catch { bgFetching.current.delete(ck) }
      }
      const words = lxxWords.current[`lxx.${ck}.${tgt.verse}`]
      // Align by token index; if punctuation/crasis skews the split, fall back to the surface.
      const w = words?.[ti] && normalizeFold(words[ti].surface).includes(normalizeFold(clean))
        ? words[ti]
        : words?.find(x => normalizeFold(x.surface) === normalizeFold(clean) || normalizeFold(x.surface).includes(normalizeFold(clean)))
      showBgInfo(w
        ? { ...base, surface: w.surface, lexeme: w.lemma, gloss: w.gloss ?? '', parsing: w.parsing, strongs: w.strongs }
        : base)
      return
    }
    // Prose morph sidecars (Josephus per-book; other Greek prose one per work).
    const url = tgt.source === 'josephus' && tgt.workDir && tgt.book != null
      ? `/data/josephus/${tgt.workDir}/${tgt.book}.morph.json`
      : (() => { const pw = findProseWork(tgt.source as Exclude<OpenInTextsTarget['source'], 'lxx' | 'josephus'>); return pw ? pw.dataUrl.replace(/\.json$/, '.morph.json') : null })()
    if (!url) { showBgInfo(base); return }
    if (!(url in morphMaps.current) && !bgFetching.current.has(url)) {
      bgFetching.current.add(url)
      try {
        const r = await fetch(url)
        morphMaps.current[url] = r.ok ? await r.json() : null
      } catch { morphMaps.current[url] = null }
    }
    const map = morphMaps.current[url]
    // Josephus §§ are book-unique (keyed by section); prose works key by "<chapter>.<verse>".
    const entries = map ? (map[String(tgt.verse)] ?? map[`${tgt.chapter}.${tgt.verse}`]) : undefined
    const entry = entries?.[ti]
    showBgInfo(entry ? { ...base, lexeme: entry[0], parsing: entry[1] } : base)
  }

  // Windowed, clickable Greek tokens for a background hit — same window budget as the plain
  // snippet, but each word feeds the parsing dock (token index preserved for morph alignment).
  // Clickable Greek word tokens feeding the parsing dock. `windowed` trims to a snippet around
  // the match (the no-context single line); off, the whole verse shows (context reading). `dim`
  // suppresses the red match-mark (grey context verses). `tv` parses the words against that verse
  // rather than the hit target — so words in a grey CONTEXT verse still parse correctly.
  const bgGreekTokens = (h: BgHit, rowKey: string, text: string, dim = false,
                         tv?: { chapter: number; verse: number }, windowed = false) => {
    const toks = text.split(/\s+/).filter(Boolean)
    const folded = toks.map(x => normalizeFold(x))
    const bares = terms.map(x => normalizeFold(x.replace(/"/g, ''))).filter(Boolean)
    const isMatch = (f: string) => bares.some(b => f.includes(b))
    let first = folded.findIndex(isMatch)
    if (first < 0) first = 0
    const from = windowed ? Math.max(0, first - 18) : 0
    const to = windowed ? Math.min(toks.length, first + 26) : toks.length
    return (
      <>
        {from > 0 ? '… ' : ''}
        {toks.slice(from, to).map((tok, i) => {
          const ti = from + i
          const key = `${rowKey}.${ti}`
          return (
            <span key={ti}
              onMouseEnter={() => void selectBgToken(h, ti, tok, key, tv)}
              onClick={() => void selectBgToken(h, ti, tok, key, tv)}
              className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${bgSelKey === key ? 'bg-brand-100' : ''} ${isMatch(folded[ti]) && !dim ? MARK : ''}`}>
              {tok}{' '}
            </span>
          )
        })}
        {to < toks.length ? '…' : ''}
      </>
    )
  }

  // A background hit's text: neighbouring sections when Context is on, else the windowed snippet.
  // Greek hits render as clickable words feeding the parsing dock; result text inherits the
  // container font size (the ⋮ display menu), so no absolute text-size classes here.
  const bgHitText = (h: BgHit, rowKey: string) => {
    const isGrc = bg?.lang === 'grc'
    const ctx = context > 0 ? ctxMap[bgCtxKey(h.target)] : undefined
    const hasCtx = !!ctx && ctx.length > 0
    const isHitVerse = (cv: { chapter: number; verse: number }) =>
      cv.chapter === h.target.chapter && cv.verse === h.target.verse

    // Primary (Greek, or English for an English scope) column.
    const primary = hasCtx ? (
      <span className={`block leading-relaxed ${isGrc ? 'greek-text' : 'font-reading'}`}
        {...(isGrc ? greekText : translatable)}>
        {ctx!.map(cv => {
          const isHit = isHitVerse(cv)
          return (
            <span key={`${cv.chapter}.${cv.verse}`} className={isHit ? 'text-gray-800' : 'text-gray-400'}>
              {isGrc
                // Every context verse's words are clickable → parsing dock; grey ones parse
                // against their own verse (tv) and carry no match-mark (dim).
                ? bgGreekTokens(h, `${rowKey}.${cv.chapter}.${cv.verse}`, cv.text, !isHit,
                    isHit ? undefined : { chapter: cv.chapter, verse: cv.verse })
                : <><SearchWords text={cv.text} terms={isHit ? terms : []}
                    payload={() => ({ kind: 'translation', reference: h.ref, transLang: 'en',
                      ...(scope.kind === 'bg' && scope.category ? { bgCollection: scope.category } : {}) })} />{' '}</>}
            </span>
          )
        })}
      </span>
    ) : (
      <span className={`block text-gray-700 leading-relaxed ${isGrc ? 'greek-text' : 'font-reading'}`}
        {...(isGrc ? greekText : translatable)}>
        {isGrc ? bgGreekTokens(h, rowKey, h.text, false, undefined, true)
               : <SearchWords text={h.text} terms={terms}
                   payload={() => ({ kind: 'translation', reference: h.ref, transLang: 'en',
                     ...(scope.kind === 'bg' && scope.category ? { bgCollection: scope.category } : {}) })} />}
      </span>
    )
    // Greek works with an aligned English (LXX / Brenton, Josephus / Whiston, Greco-Roman /
    // Perseus) show their translation beside the Greek. With Context on it grows to the same
    // neighbouring verses (the 'en' facet); off, just the matched section's translation.
    if (isGrc) {
      const tctx = hasCtx ? ctxTransMap[bgCtxKey(h.target)] : undefined
      // The English gets the same word menu as the Greek beside it. A reader who spots the
      // telling word in the translation should be able to act on it there, rather than having
      // to locate its Greek counterpart across the column first.
      const transPayload = () => ({ kind: 'translation' as const, reference: h.ref, transLang: 'en',
        ...(scope.kind === 'bg' && scope.category ? { bgCollection: scope.category } : {}) })
      const transCol = tctx && tctx.length > 0 ? (
        <span className="block leading-relaxed font-reading">
          {tctx.map(cv => (
            <span key={`${cv.chapter}.${cv.verse}`} className={isHitVerse(cv) ? 'text-gray-600' : 'text-gray-400'}>
              <SearchWords text={cv.text} terms={[]} payload={transPayload} />{' '}
            </span>
          ))}
        </span>
      ) : h.trans ? (
        <span className="block text-gray-500 leading-relaxed font-reading">
          <SearchWords text={clampTrans(h.trans)} terms={[]} payload={transPayload} />
        </span>
      ) : null
      if (transCol) {
        return (
          <span className="grid gap-x-4 gap-y-0.5 grid-cols-1 sm:grid-cols-2 items-start">
            {primary}
            {transCol}
          </span>
        )
      }
    }
    return primary
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

  // The result controls (count + Context + translation + sort) live in the sticky header so
  // they stay pinned while the results scroll. Shown once results exist; the count label
  // depends on the result kind.
  const hasResults = !loading && ((isBiblical && !!displayBib && displayBib.length > 0) || (!isBiblical && !!bg && bg.total > 0))
  const resultCountLabel = isBiblical && displayBib
    ? t('search.verseCount', {
        count: displayBib.length,
        n: `${displayBib.length}${displayBib.length >= 300 ? '+' : ''}`,
      })
    : bg
    // Two counts in one line, each pluralising on its own — composed so a language can put
    // them in whichever order reads naturally.
    ? t('search.matchesInWorks', {
        matches: t('search.matchCount', { count: bg.total, n: `${bg.total}${bg.truncated ? '+' : ''}` }),
        works: t('search.workCount', { count: bg.groups.length, n: bg.groups.length }),
      })
    : ''

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
      {/* Sticky controls — pinned BELOW the app header (top-14 = its 3.5rem height): sticking at
          top-0 slid this block underneath the z-40 sticky header, which covered the search input
          as soon as the page scrolled. One wrapping row keeps the block compact: return link +
          query + scope + book + search types together, with the result-type tabs beneath. */}
      <div className={`sticky ${embedded ? 'top-0' : 'top-14'} z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-1.5 bg-gray-50/95 backdrop-blur border-b border-gray-100 ${embedded ? 'relative' : ''}`}>
        {/* Close: anchored to the panel's top-right, OUTSIDE the wrapping row. Inside it, the
            button travelled with the reflow and sat somewhere different at every pane width. */}
        {embedded && (
          <button type="button" onClick={() => onRequestClose?.()} title={t('search.closeEsc')} aria-label={t('search.closeSearch')}
            className="absolute right-2 top-1.5 z-20 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
            <X size={18} />
          </button>
        )}
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 ${embedded ? 'pr-9' : ''}`}>
        {/* When the search was launched from another page (right-click / ⌘K), offer a way back
            to exactly where they were. Navigate to the origin URL directly (not router.back())
            so it's reliable after a refresh / intermediate navigation, where history-relative
            back would misfire; the scroll snapshot (sessionStorage, keyed by URL) restores. */}
        {returnTo ? (
          <button type="button" onClick={() => { markScrollRestore(returnTo); router.push(returnTo) }}
            title={t('search.returnTo', { page: returnLabelFor(returnTo, t) })}
            className="flex-none inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 transition-colors">
            <ArrowLeft size={16} /> {returnLabelFor(returnTo, t)}
          </button>
        ) : !embedded && (
          // Reached without an origin — a bookmark, a shared link, or the tab bar on a phone,
          // where the panel is not what opens. There was no way out at all: on mobile, with no
          // browser chrome, that meant closing the app. Step back if there is history, and fall
          // back to the reader if this is the first page of the session.
          <button type="button"
            onClick={() => { if (window.history.length > 1) router.back(); else router.push('/reader') }}
            title={t('search.back')}
            className="flex-none inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 transition-colors">
            <ArrowLeft size={16} /> {t('search.back')}
          </button>
        )}
        {/* Embedded: this sticky row doubles as the panel header — title, then the query box,
            with Full search + close ✕ pinned at the row's right edge. */}
        {embedded && <span className="flex-none text-sm font-semibold text-gray-700">{t('search.title')}</span>}
        <div className="relative flex-1 min-w-[16rem]">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-input px-3 py-1.5 shadow-sm">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={onQueryChange}
              onKeyDown={e => { if (e.key === 'Enter') { lastPickedRef.current = query.trim(); pushRecent(query); setShowSug(false) } if (e.key === 'Escape') { if (showSug) e.stopPropagation(); setShowSug(false) } }}
              onFocus={() => { if (suggestions.length) setShowSug(true) }}
              dir={hebrewInput ? 'rtl' : undefined}
              placeholder={scope.kind === 'hebrew' ? t('search.placeholderHebrew') : t('search.placeholder')}
              className={`flex-1 min-w-0 text-base outline-none placeholder:text-gray-400 ${greekInput ? 'greek-text' : hebrewInput ? 'font-hebrew' : ''}`}
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus() }}
                className="flex-none text-gray-400 hover:text-gray-700 p-0.5" title={t('search.clear')} aria-label={t('search.clearSearch')}>
                <X size={16} />
              </button>
            )}
            {/* Script keyboard. Which one is offered follows the scope: a Hebrew scope gets
                the Hebrew keyboard, everything else the Greek one — so the button is always
                the script the chosen corpus is actually written in. */}
            {scope.kind === 'hebrew' ? (
              <button type="button" onClick={toggleHebrewInput} aria-pressed={hebrewInput}
                title={`${t('search.hebrewKeyboard')} — ${HEBREW_LEGEND}`}
                className={`flex-none w-7 h-7 flex items-center justify-center rounded-lg text-base font-semibold transition-colors font-hebrew ${hebrewInput ? 'bg-brand-600 text-white' : 'text-brand-600 hover:bg-brand-50'}`}>
                א
              </button>
            ) : (
              <button type="button" onClick={toggleGreekInput} aria-pressed={greekInput}
                title={t('search.greekKeyboard')}
                className={`flex-none w-7 h-7 flex items-center justify-center rounded-lg text-base font-semibold transition-colors greek-text ${greekInput ? 'bg-brand-600 text-white' : 'text-brand-600 hover:bg-brand-50'}`}>
                α
              </button>
            )}
          </div>

          {/* Predictive suggestions (complete the last word) */}
          {showSug && suggestions.length > 0 && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSug(false)} />
              <div className="absolute left-0 right-0 top-full mt-1 z-40 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-lg">
                {suggestions.map((s, i) => (
                  <button key={`${s.word}|${i}`} type="button" onMouseDown={e => { e.preventDefault(); pickSuggestion(s.word, s.strongs) }}
                    className="w-full text-left px-3 py-2 hover:bg-brand-50 border-b border-gray-50 last:border-0 flex items-baseline gap-2">
                    <span dir={HEBREW_RE.test(s.word) ? 'rtl' : undefined}
                      className={`text-gray-800 shrink-0 ${HEBREW_RE.test(s.word) ? 'font-hebrew text-base' : GREEK_RE.test(s.word) ? 'greek-text text-base' : 'text-sm'}`}>{s.word}</span>
                    {s.sub && <span className="text-xs text-gray-400 truncate">{s.sub}</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {/* Embedded: Full search + close ✕ follow the query box, so they sit at the right
            edge of the header line (the scope/book pickers wrap to the next line). The
            discovery/settings extras — Search types, the ⋮ display menu — stay on the FULL
            /search page; Full search opens there in a NEW browser tab carrying the current
            query/scope/books (and lemma / Strong's mode) — the reader + panel stay put here. */}
        {embedded && (
          <>
            <a href={fullSearchHref} target="_blank" rel="noopener" title={t('search.fullSearchTitle')}
              className="flex-none inline-flex items-center gap-1 rounded border border-gray-300 bg-surface px-2 py-1 text-xs text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors">
              <ArrowUpRight size={13} /> {t('search.fullSearch')}
            </a>
            <a href={constructHref} target="_blank" rel="noopener"
              title={t('search.constructTitle')}
              className="flex-none inline-flex items-center gap-1 rounded border border-gray-300 bg-surface px-2 py-1 text-xs text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors">
              <Blocks size={13} /> {t('search.construct')}
            </a>
          </>
        )}
            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              {t('search.in')}
              <select value={scopeVal} onChange={e => setScopeVal(e.target.value)}
                className="rounded border border-gray-300 bg-surface px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500">
                <optgroup label={t('search.scope.greek')}>
                  <option value="greek:GNT">{t('search.scope.greekNT')}{optCount('greek:GNT')}</option>
                  <option value="greek:LXX">{t('search.scope.greekLXX')}{optCount('greek:LXX')}</option>
                </optgroup>
                <optgroup label={t('search.scope.hebrew')}>
                  <option value="hebrew:MT">{t('search.scope.hebrewOT')}{optCount('hebrew:MT')}</option>
                </optgroup>
                <optgroup label={t('search.scope.translations')}>
                  {TRANSLATIONS.map(tr => <option key={tr.lang} value={`trans:${tr.lang}`}>{t(tr.key)}{optCount(`trans:${tr.lang}`)}</option>)}
                </optgroup>
                <optgroup label={t('search.scope.backgrounds')}>
                  <option value="bg:all">{t('search.scope.bgAllEn')}{optCount('bg:all')}</option>
                  <option value="bggrc:all">{t('search.scope.bgAllGrc')}</option>
                  {COLLECTIONS.map(c => <option key={c.id} value={`bg:${c.id}`}>{c.label}</option>)}
                </optgroup>
              </select>
            </label>
            {isBiblical && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <button type="button" onClick={() => setShowBooks(v => !v)} title={t('search.booksLimit')}
                  aria-expanded={showBooks}
                  className={`inline-flex items-center gap-1 rounded border px-1.5 py-1 text-xs transition-colors ${
                    showBooks || books.length > 0 ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-surface text-gray-600 hover:bg-gray-50'}`}>
                  {booksLabel}
                  <ChevronDown size={13} className={`transition-transform ${showBooks ? 'rotate-180' : ''}`} />
                </button>
              </span>
            )}

          {/* The extras group — ml-auto pins Construct, Search types and the ⋮ display menu
              together at the row's right edge (ml-auto on any one of them alone would eat the
              free space and wrap the rest onto a second line). Full page only. */}
          {!embedded && (
          <div className="ml-auto flex flex-none items-center gap-1.5">

          {/* Construct search — a grammar query rather than a text query, so it gets its own
              page (the builder needs room). */}
            <Link href="/search/construct" title={t('search.constructLinkTitle')}
              className="inline-flex flex-none items-center gap-1 rounded border border-gray-300 bg-surface px-2 py-1 text-xs text-gray-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
              <Blocks size={13} /> {t('search.construct')}
            </Link>

          {/* Searching the same texts by place rather than by word, so it belongs with the
              other search modes. Full page only: in the side pane it wrapped the close button
              onto a second row, and you would have come from the map to open the pane anyway. */}
            <Link href="/map" title={t('search.mapTitle')}
              className="inline-flex flex-none items-center gap-1 rounded border border-gray-300 bg-surface px-2 py-1 text-xs text-gray-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
              <MapIcon size={13} /> {t('search.map')}
            </Link>

          {/* Search types */}
          <div className="relative flex-none">
            <button type="button" onClick={() => setShowTypes(v => !v)} aria-expanded={showTypes}
              className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors ${
                showTypes ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-surface text-gray-600 hover:bg-gray-50'}`}>
              <Lightbulb size={13} /> {t('search.types')}
            </button>
            {showTypes && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowTypes(false)} />
                <div className="absolute right-0 top-full mt-2 z-30 w-[min(92vw,26rem)] max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('search.types')}</p>
                    <button type="button" onClick={() => setShowTypes(false)} className="text-gray-400 hover:text-gray-700 p-0.5" aria-label={t('search.close')}><X size={14} /></button>
                  </div>
                  <div className="space-y-3">
                    {SEARCH_EXAMPLES.map(sec => (
                      <div key={sec.groupKey}>
                        <p className="text-[13px] font-semibold text-gray-700">{t(sec.groupKey)}</p>
                        <p className="text-[11px] text-gray-400 mb-1.5">{t(sec.hintKey)}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {sec.items.map(ex => {
                            const label = exampleText(ex)
                            return (
                            <button key={ex.queryKey ?? ex.query} type="button" onClick={() => runExample(ex)}
                              className={`inline-flex items-center rounded-lg border border-gray-200 bg-surface px-2.5 py-1 text-xs text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors ${GREEK_RE.test(label) ? 'greek-text' : ''}`}>
                              {label}
                            </button>
                          )})}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ⋮ display options (result-text size) */}
          <div className="relative flex-none">
            <button type="button" onClick={() => setShowDisplay(v => !v)} aria-expanded={showDisplay} title={t('search.displayOptions')}
              className={`inline-flex h-7 w-7 items-center justify-center rounded border transition-colors ${
                showDisplay ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-surface text-gray-600 hover:bg-gray-50'}`}>
              <MoreVertical size={14} />
            </button>
            {showDisplay && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowDisplay(false)} />
                {/* Same container + slider as the Reader/Exegesis tools menus. */}
                <div className="absolute right-0 top-full mt-2 z-30 w-72 rounded-xl border border-gray-200 bg-popover p-4 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">{t('search.displayOptions')}</span>
                    <button onClick={() => setShowDisplay(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={15} />
                    </button>
                  </div>
                  <TextSizeSlider options={FONT_SIZES} value={fontSize} onChange={pickFontSize} />
                </div>
              </>
            )}
          </div>

          </div>
          )}
        </div>
        {isBiblical && showBooks && (
          <div className="mt-2">
            {bookGroups.length > 0
              ? <BookPicker groups={bookGroups} selected={selectedSet} onToggle={toggleBook} onToggleGroup={toggleGroup} onClear={() => setBooks([])} />
              : <p className="text-xs text-gray-400 py-4 text-center">{t('search.booksLoading')}</p>}
          </div>
        )}

        {/* Result-type tabs (live counts) — full page only (the panel shows the counts inside
            the scope dropdown's options instead, saving a row). Not shown for a Hebrew word
            search, which is its own scope (the other lanes would just return zero). */}
        {!embedded && query.trim().length >= 2 && scope.kind !== 'hebrew' && (
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {laneList.map(l => {
              const active = l.val === activeLane
              const c = counts[l.val]
              return (
                <button key={l.val} type="button" onClick={() => setScopeVal(l.val)}
                  className={`flex-none inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
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

        {/* Result controls — inside the sticky header so they stay pinned while results scroll. */}
        {hasResults && <div className="mt-1.5">{controlsBar(resultCountLabel)}</div>}
      </div>

      {/* Results — result text inherits this font size (the ⋮ display menu's Text size).
          --greek-fs must be set too: .greek-text pins its size to that variable (default
          1.125rem), so without it the Greek column stayed small while the translation column
          scaled — the two columns now track the same size. */}
      <div className="py-4" style={{ fontSize: FONT_SIZE_MAP[fontSize], '--greek-fs': FONT_SIZE_MAP[fontSize] } as React.CSSProperties}>
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" /> {t('search.searching')}
          </div>
        )}
        {!loading && query.trim().length < 2 && (
          <div className="py-10">
            {recent.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{t('search.recent')}</p>
                  <button type="button"
                    onClick={() => { setRecent([]); try { localStorage.removeItem(RECENT_STORAGE_KEY) } catch {} }}
                    className="text-[11px] text-brand-600 hover:underline">{t('search.clear')}</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map(r => (
                    <button key={r} type="button" onClick={() => { setQuery(r); inputRef.current?.focus() }}
                      className={`inline-flex items-center rounded-lg border border-gray-200 bg-surface px-3 py-1 text-sm text-gray-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 transition-colors ${GREEK_RE.test(r) ? 'greek-text' : ''}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {noResults && (
          <p className="py-16 text-center text-sm text-gray-400">{t('search.noMatches')}</p>
        )}

        {/* Biblical hits */}
        {!loading && isBiblical && displayBib && displayBib.length > 0 && (
          <div>
            {scope.kind === 'greek' ? (
              <GreekSearchResults
                hits={displayBib}
                terms={terms}
                searchLemma={lemmaMode ? normalizeFold(query.trim()) : undefined}
                corpus={scope.corpus}
                bookName={bookName}
                context={context}
                ctxMap={ctxMap}
                transLang={parallelLang}
                onOpen={h => openBiblical(`${h.osisId} ${h.chapter}:${h.verse}`)}
                embedded={embedded}
                isAuthenticated={isAuthenticated}
              />
            ) : scope.kind === 'hebrew' ? (
              <HebrewSearchResults
                hits={displayBib}
                bookName={bookName}
                query={query}
                transLang={parallelLang}
                embedded={embedded}
                onOpen={(h, tl) => openBiblical(`${h.osisId} ${h.chapter}:${h.verse}`, tl !== 'none' ? tl : undefined, 'MT')}
              />
            ) : (
            <div className="divide-y divide-gray-100">
              {displayBib.map((h, i) => {
                const key = `${h.osisId}.${h.chapter}.${h.verse}`
                const ctx = context > 0 ? ctxMap[key] : undefined
                return (
                  <div key={i} className="relative group">
                    <button onClick={() => openBiblical(`${h.osisId} ${h.chapter}:${h.verse}`, h.greek || h.hebrew ? undefined : (scope.kind === 'trans' ? scope.lang : undefined), h.hebrew ? 'MT' : undefined)} className="block w-full text-left py-2.5 px-2 pr-9 rounded-lg hover:bg-brand-50 transition-colors">
                      <span className="text-xs font-medium text-brand-600">{bookName.get(h.osisId) ?? h.osisId} {h.chapter}:{h.verse}</span>
                      {h.hebrew ? (
                        <span dir="rtl" className="block text-gray-700 leading-loose font-hebrew" style={{ fontSize: 'var(--greek-fs, 1.125rem)' }}>{h.text}</span>
                      ) : ctx && ctx.length > 0 ? (
                        <span className={`block leading-relaxed ${h.greek ? 'greek-text' : 'font-reading'}`}>
                          {ctx.map(cv => {
                            const isHit = cv.chapter === h.chapter && cv.verse === h.verse
                            return (
                              <span key={`${cv.chapter}.${cv.verse}`} className={isHit ? 'text-gray-800' : 'text-gray-400'}>
                                <sup className="text-[10px] text-brand-500 mr-0.5">{cv.chapter === h.chapter ? cv.verse : `${cv.chapter}:${cv.verse}`}</sup>
                                <SearchWords text={cv.text} terms={isHit ? terms : []}
                                  payload={() => ({ kind: h.greek ? 'greek' : 'translation',
                                    reference: `${bookName.get(h.osisId) ?? h.osisId} ${cv.chapter}:${cv.verse}`,
                                    book: h.osisId,
                                    ...(h.greek ? { greekCorpus: 'LXX' as const }
                                                : { transLang: scope.kind === 'trans' ? scope.lang : 'en' }) })} />{' '}
                              </span>
                            )
                          })}
                        </span>
                      ) : (
                        <SearchWords text={h.text} terms={terms}
                          className={`block text-gray-700 leading-relaxed ${h.greek ? 'greek-text' : 'font-reading'}`}
                          payload={() => ({ kind: h.greek ? 'greek' : 'translation',
                            reference: `${bookName.get(h.osisId) ?? h.osisId} ${h.chapter}:${h.verse}`,
                            book: h.osisId,
                            ...(h.greek ? { greekCorpus: 'LXX' as const }
                                        : { transLang: scope.kind === 'trans' ? scope.lang : 'en' }) })} />
                      )}
                    </button>
                    <button type="button" onClick={e => { e.stopPropagation(); void copyHit(h, ctx) }}
                      title={t('search.copyVerses')} aria-label={t('search.copyVerses')}
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
            {displayBg.mode === 'flat' ? (
              // Relevance: a single list across works, each row labelled with its work.
              // Greek rows are divs (their words are clickable → parsing dock); the ref label
              // opens the hit. English rows keep the whole-row-opens-it button.
              <div className="divide-y divide-gray-100">
                {displayBg.hits.map(({ h, work }, i) => bg.lang === 'grc' ? (
                  <div key={i} className="py-2.5 px-2">
                    {hitNote(h)}
                    <button onClick={() => openBackground(h.target)} className="text-xs font-medium text-brand-600 hover:underline">{h.ref}</button>
                    <span className="text-xs text-gray-400"> · {work}</span>
                    {bgHitText(h, `f.${i}`)}
                  </div>
                ) : (
                  <div key={i} className="py-2.5 px-2 rounded-lg hover:bg-brand-50 transition-colors">
                    {hitNote(h)}
                    <button onClick={() => openBackground(h.target)} className="text-left text-xs font-medium text-brand-600 hover:underline">{h.ref}</button>
                    <span className="text-xs text-gray-400"> · {work}</span>
                    <span onClick={() => openBackground(h.target)} className="block cursor-pointer">{bgHitText(h, `f.${i}`)}</span>
                  </div>
                ))}
              </div>
            ) : (
              // Document order: grouped by work, in catalog order.
              displayBg.groups.map(g => (
                <div key={g.gid} className="py-1.5">
                  <p className="py-1 text-sm font-semibold text-gray-600">{g.name} <span className="text-gray-400 font-normal">· {g.count}</span></p>
                  <div className="divide-y divide-gray-100">
                    {g.hits.map((h, i) => bg.lang === 'grc' ? (
                      <div key={i} className="py-2.5 px-2">
                        {hitNote(h)}
                        <button onClick={() => openBackground(h.target)} className="text-xs font-medium text-brand-600 hover:underline">{h.ref}</button>
                        {bgHitText(h, `${g.gid}.${i}`)}
                      </div>
                    ) : (
                      <div key={i} className="py-2.5 px-2 rounded-lg hover:bg-brand-50 transition-colors">
                        {hitNote(h)}
                        <button onClick={() => openBackground(h.target)} className="text-left text-xs font-medium text-brand-600 hover:underline">{h.ref}</button>
                        <span onClick={() => openBackground(h.target)} className="block cursor-pointer">{bgHitText(h, `${g.gid}.${i}`)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Parsing dock for Greek background results (the Greek NT/LXX lanes carry their own
            inside GreekSearchResults). On the full /search page it's this in-flow sticky dock;
            when embedded, the host panel mounts a real bottom pane instead (see greekPaneActive). */}
        {!embedded && !loading && !isBiblical && bg?.lang === 'grc' && bg.total > 0 && <ParsingDock info={bgInfo} />}
      </div>
    </div>
  )
}
