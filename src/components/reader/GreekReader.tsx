'use client'
import { useState, useEffect, useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MoreVertical, X, ChevronRight, Menu, GripVertical,
  LayoutDashboard, BookOpen, BookMarked, Table2, PencilLine, ListTree, Library, StickyNote,
  Settings, LogOut, LogIn, UserPlus,
} from 'lucide-react'
import { SearchBar } from './SearchBar'
import { PassagePicker } from './PassagePicker'
import { GreekVerse } from './GreekVerse'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { ParsingPanel } from './ParsingPanel'
import { SyntaxMenu, type WordSearchAction, type SearchScope } from './SyntaxMenu'
import { openWordSearch, type WordHighlight } from '@/lib/word-search-bus'
import { openBackgroundsSearch } from '@/lib/backgrounds-search-bus'
import { MorphSearchPicker } from './MorphSearchPicker'
import { LexiconPanel } from './LexiconPanel'
import type { BiblicalBook, BiblicalVerse, VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { SyntaxEntry, SyntaxContext } from '@/lib/wallace-categories'
import { loadGbi, type GbiEntry } from '@/lib/gbi-data'
import { loadAbsSyntax, type AbsSyntaxEntry } from '@/lib/abs-syntax'
import { loadMaculaSyntax } from '@/lib/macula-syntax'
import { parseReference } from '@/lib/parseReference'
import { normalizeGreek } from '@/lib/greek-utils'
import { parseSearchTerms } from '@/lib/search-query'
import { markTerms, normalizeFold } from '@/lib/highlight-terms'
import { useHighlights } from '@/components/highlights/useHighlights'
import { useHighlightSelection } from '@/components/highlights/useHighlightSelection'
import { HighlightPopup } from '@/components/highlights/HighlightPopup'
import { TransWords } from '@/components/highlights/TransWords'
import { highlightAt } from '@/components/highlights/render'
import { highlightMarkClass } from '@/lib/highlight-colors'

// ── BSB alignment loader ───────────────────────────────────────────────────────

interface BsbAlignmentVerse {
  text: string
  g2t: Record<string, number[]>   // Greek word position (string key) → BSB token indices
  t2g: (number | null)[]          // BSB token index → Greek word position
}
type BsbAlignmentData = Record<string, BsbAlignmentVerse>

let _bsbAlignCache: BsbAlignmentData | null = null
let _bsbAlignLoading: Promise<BsbAlignmentData> | null = null

function loadBsbAlignment(): Promise<BsbAlignmentData> {
  if (_bsbAlignCache) return Promise.resolve(_bsbAlignCache)
  if (_bsbAlignLoading) return _bsbAlignLoading
  _bsbAlignLoading = fetch('/data/bsb-alignment.json?v=3')
    .then(r => r.json())
    .then((d: BsbAlignmentData) => { _bsbAlignCache = d; return d })
    .catch(() => { _bsbAlignCache = {}; return {} as BsbAlignmentData })
  return _bsbAlignLoading
}

// ── Lazy syntax.json loader ────────────────────────────────────────────────────
let _syntaxCache: Record<string, SyntaxEntry> | null = null
let _syntaxLoading = false
const _syntaxCallbacks: Array<(data: Record<string, SyntaxEntry>) => void> = []

function loadSyntax(): Promise<Record<string, SyntaxEntry>> {
  if (_syntaxCache) return Promise.resolve(_syntaxCache)
  return new Promise(resolve => {
    _syntaxCallbacks.push(resolve)
    if (!_syntaxLoading) {
      _syntaxLoading = true
      fetch('/data/syntax.json')
        .then(r => r.json())
        .then((data: Record<string, SyntaxEntry>) => {
          _syntaxCache = data
          _syntaxCallbacks.splice(0).forEach(cb => cb(data))
        })
        .catch(() => {
          _syntaxCache = {}
          _syntaxCallbacks.splice(0).forEach(cb => cb({}))
        })
    }
  })
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface TextSection {
  key: string
  bookName: string
  corpus: string
  verses: BiblicalVerse[]
}

interface CorpusSeries {
  sections: TextSection[]
  queueIdx: number   // index of next chapter to load going forward
  backIdx:  number   // index of next chapter to load going backward (-1 = none)
  done:     boolean
  backDone: boolean  // nothing left to load upward
}

interface ChapterItem {
  osisId: string
  chapter: number
  bookName: string
  corpus: string
}

type FontSize = 'sm' | 'md' | 'lg' | 'xl'

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: '0.9rem',
  md: '1.25rem',   // 20px — matches the Exegesis pane's Greek size
  lg: '1.375rem',
  xl: '1.65rem',
}

const RESULTS_W = 520   // floating results-panel width (px)
const RESULTS_POS_KEY = 'reader.resultsPos'   // remembered floating-results position
const PARALLEL_LANGS = [
  { code: 'en',  label: 'English', sub: 'World English Bible' },
  { code: 'bsb', label: 'English (BSB)', sub: 'Berean Standard Bible' },
  { code: 'es', label: 'Spanish', sub: 'Reina-Valera 1909' },
  { code: 'fr', label: 'French', sub: 'Louis Segond 1910' },
  { code: 'pt', label: 'Portuguese', sub: 'João Ferreira de Almeida (ARC)' },
  { code: 'ru', label: 'Russian', sub: 'Russian Synodal Bible' },
  { code: 'ko', label: 'Korean', sub: 'Korean Revised Version' },
  { code: 'zh', label: 'Mandarin', sub: 'Chinese Union Version' },
]

// The reader shows the Greek text and, optionally, ONE translation inline beneath each
// verse (Greek verse → its translation → next verse …). parallelLang holds the chosen
// translation code, or null for Greek only. The choice is persisted under this key.
const PARALLEL_LANG_STORAGE_KEY = 'reader-parallel-lang'

// ── Helpers ────────────────────────────────────────────────────────────────────

const LOOKAHEAD = 1600   // px ahead of sentinel to start loading next chapter
const NAV_PRE   = 3      // chapters to preload before the search target
const NAV_FWD   = 2      // chapters to preload after the search target

function buildQueue(books: BiblicalBook[]): ChapterItem[] {
  return books.flatMap(b =>
    Array.from({ length: b.totalChapters }, (_, i) => ({
      osisId: b.osisId,
      chapter: i + 1,
      bookName: b.name,
      corpus: b.corpus,
    }))
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export function GreekReader({ initialRef, initialHighlight, initialTransLang, isAuthenticated = false, userRole }: { initialRef?: string; initialHighlight?: string; initialTransLang?: string; isAuthenticated?: boolean; userRole?: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN' } = {}) {
  const router = useRouter()
  // On mobile the global header is hidden, so the reader menu carries all navigation.
  const menuAuthed = isAuthenticated || !!userRole
  const dashboardHref = userRole === 'INSTRUCTOR' ? '/instructor'
    : userRole === 'ADMIN' ? '/admin'
    : userRole === 'STUDENT' ? '/student'
    : '/dashboard'
  const readerNav = [
    { href: dashboardHref, label: 'Dashboard', icon: LayoutDashboard, authOnly: true },
    { href: '/reader', label: 'Reader', icon: BookOpen },
    { href: '/vocab', label: 'Vocab', icon: BookMarked },
    { href: '/morphology', label: 'Morphology', icon: Table2 },
    { href: '/exegesis', label: 'Syntax', icon: PencilLine },
    { href: '/exegesis?tab=phrasing', label: 'Phrasing', icon: ListTree },
    { href: '/exegesis?tab=texts', label: 'Texts', icon: Library },
    { href: '/exegesis?tab=notes', label: 'Notes', icon: StickyNote },
  ]
  async function handleReaderSignOut() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }
  // ── Corpus queues & loaded sections ─────────────────────────────────────────
  const [gntQueue, setGntQueue] = useState<ChapterItem[]>([])
  const [lxxQueue, setLxxQueue] = useState<ChapterItem[]>([])
  const [gnt, setGnt] = useState<CorpusSeries>({ sections: [], queueIdx: 0, backIdx: -1, done: false, backDone: true })
  const [lxx, setLxx] = useState<CorpusSeries>({ sections: [], queueIdx: 0, backIdx: -1, done: false, backDone: true })

  // ── Full book list (both corpora) for resolving a typed reference like "Gen 1" ──
  // Fetched once from the static /data/books.json asset — the same file the reader API's
  // book-list endpoint reads server-side — rather than derived from gntQueue/lxxQueue,
  // which populate from separate background fetches (LXX is the larger of the two) and
  // so wouldn't reliably contain an LXX book yet if the user searched right after the
  // page loaded. A static asset fetch is small and independent of those heavier calls.
  const [allBooks, setAllBooks] = useState<BiblicalBook[]>([])
  const allBooksRef = useRef(allBooks)
  useEffect(() => { allBooksRef.current = allBooks }, [allBooks])
  useEffect(() => {
    fetch('/data/books.json')
      .then(r => r.json())
      .then((d: { gnt?: BiblicalBook[]; lxx?: BiblicalBook[] }) => setAllBooks([...(d.gnt ?? []), ...(d.lxx ?? [])]))
      .catch(() => {})
  }, [])

  // ── Per-verse personal notes (signed-in readers) ─────────────────────────────
  // Keyed "bookId.chapter.verse" for the currently-loaded chapters.
  const [notedKeys, setNotedKeys] = useState<Set<string>>(new Set())
  const refreshReaderNotes = useCallback(async () => {
    if (!isAuthenticated) { setNotedKeys(new Set()); return }
    const chapters = new Map<string, { book: string; chapter: number }>()
    for (const s of [...gnt.sections, ...lxx.sections]) {
      const v0 = s.verses[0]
      if (v0) chapters.set(`${v0.bookId}.${v0.chapter}`, { book: v0.bookId, chapter: v0.chapter })
    }
    const keys = new Set<string>()
    await Promise.all(Array.from(chapters.values()).map(async ({ book, chapter }) => {
      try {
        const r = await fetch(`/api/notes?book=${encodeURIComponent(book)}&chapter=${chapter}&verseStart=1&verseEnd=200`)
        const d = await r.json()
        for (const n of (d.notes ?? []) as { verse: number }[]) keys.add(`${book}.${chapter}.${n.verse}`)
      } catch { /* ignore */ }
    }))
    setNotedKeys(keys)
  }, [isAuthenticated, gnt.sections, lxx.sections])
  useEffect(() => { refreshReaderNotes() }, [refreshReaderNotes])

  // ── Word interaction ─────────────────────────────────────────────────────────
  const [activeWordId, setActiveWordId]   = useState<string | null>(null)
  const [parsingInfo, setParsingInfo]     = useState<LexicalInfoPanel | null>(null)
  const [lockedInfo, setLockedInfo]       = useState<LexicalInfoPanel | null>(null)

  // ── Search ───────────────────────────────────────────────────────────────────
  const [searchResults, setSearchResults]   = useState<BiblicalVerse[] | null>(null)
  const [searchType, setSearchType]         = useState<'word' | 'reference' | null>(null)
  const [wordSearchTerm, setWordSearchTerm] = useState<string | null>(null)   // normalized
  // Normalized terms to highlight in the inline TRANSLATION when arriving from Master Search
  // (Greek words are handled by wordSearchTerm). Cleared on any other search/nav.
  const [arrivalTerms, setArrivalTerms] = useState<string[]>([])
  // Normalized lemma to highlight across results (right-click "all forms" / Strong's, whose
  // matched surface forms vary, so a single wordSearchTerm can't mark them).
  const [searchLemma, setSearchLemma] = useState<string | null>(null)
  // Translation word-search results (mobile): matching verses in the shown translation.
  const [translationResults, setTranslationResults] = useState<{ id: string; text: string }[] | null>(null)
  const [translationSearchLang, setTranslationSearchLang] = useState<string | null>(null)
  const [translationSearchTerm, setTranslationSearchTerm] = useState('')
  // True while reading a passage opened from a translation result — the list is kept so a
  // "Back to results" arrow can restore it.
  const [viewingResultPassage, setViewingResultPassage] = useState(false)
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null)
  const [navKey, setNavKey] = useState(0)   // incremented on every reference search to force scroll
  const [searchLoading, setSearchLoading]   = useState(false)
  // Right-click "Search this word" (lemma / form / morphology / Strong's) — a label for the
  // result bar, a concordance (KWIC) toggle, and the open state of the morph picker / lexicon.
  const [searchLabel, setSearchLabel]       = useState<string | null>(null)
  const [concordance, setConcordance]       = useState(false)
  // The word/lemma search results show in a floating, draggable panel so the reader text stays
  // visible behind them. Position is set on open (top-right) and clamped while dragging.
  const [resultsPos, setResultsPos]         = useState<{ x: number; y: number } | null>(null)
  const resultsDrag = useRef<{ ox: number; oy: number } | null>(null)
  const [morphPickerWord, setMorphPickerWord] = useState<VerseWord | null>(null)
  const [lexiconWord, setLexiconWord]       = useState<VerseWord | null>(null)

  // ── Settings ─────────────────────────────────────────────────────────────────
  const [showSettings, setShowSettings]     = useState(false)
  const [fontSize, setFontSize]             = useState<FontSize>('md')
  const [parallelLang, setParallelLang]     = useState<string | null>(null)
  // Restore the reader's chosen inline translation on return. Hydrated after mount to
  // avoid an SSR mismatch; persisted whenever it changes.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PARALLEL_LANG_STORAGE_KEY)
      if (raw && PARALLEL_LANGS.some(l => l.code === raw)) setParallelLang(raw)
    } catch { /* ignore */ }
  }, [])
  useEffect(() => {
    try {
      if (parallelLang) localStorage.setItem(PARALLEL_LANG_STORAGE_KEY, parallelLang)
      else localStorage.removeItem(PARALLEL_LANG_STORAGE_KEY)
    } catch { /* ignore */ }
  }, [parallelLang])
  // Fetched translation text, cached per language: transByLang[lang][verseId] = text.
  // Keyed by language (not a single flat map) so swiping back to a translation you've
  // already seen is instant and does zero network, and so neighboring views can be
  // pre-warmed in the background before you swipe to them.
  const [transByLang, setTransByLang] = useState<Record<string, Record<string, string>>>({})
  const [wallaceOn, setWallaceOn]           = useState(true)
  const [proielOn,  setProielOn]            = useState(true)
  const [gbiOn,     setGbiOn]              = useState(true)
  const [absOn,     setAbsOn]              = useState(true)

  type GntEdition = 'tischendorf' | 'nestle1904'
  const [gntEdition, setGntEdition]         = useState<GntEdition>('nestle1904')

  // ── BSB alignment ────────────────────────────────────────────────────────────
  const [bsbAlignment, setBsbAlignment]       = useState<BsbAlignmentData | null>(null)
  const [bsbHighlightWordId, setBsbHighlightWordId] = useState<string | null>(null)

  // ── Settings flyout ───────────────────────────────────────────────────────────
  const [settingsFlyout, setSettingsFlyout] = useState<'translations' | 'contents' | 'syntax' | 'controls' | null>(null)

  // ── Syntax right-click menu ────────────────────────────────────────────────
  const [syntaxMenu, setSyntaxMenu] = useState<{
    word: VerseWord
    syntax: SyntaxEntry | null
    gbiEntry: GbiEntry | null
    absEntry: AbsSyntaxEntry | null
    ctx: SyntaxContext
    x: number
    y: number
    highlight?: WordHighlight
  } | null>(null)

  // Mobile only: hide the top control row while scrolling down through the text,
  // reveal it again on any scroll up (desktop keeps it pinned via `lg:flex`).
  const [showTopBar, setShowTopBar] = useState(true)
  // Mobile passage picker (opened by the SearchBar's NT/LXX buttons). Rendered at the
  // reader's top level — NOT inside the collapsible top bar — so hiding the bar on scroll
  // can't affect it.
  const [pickerOpen, setPickerOpen] = useState(false)
  // Both readers show ONE corpus at a time (GNT or LXX) so jumps land in a short single-corpus
  // scroll instead of crossing the whole other testament — and, critically, so the hidden
  // corpus isn't background-loaded (see the infinite-scroll effect: a display:none sentinel
  // reports top=0 and would otherwise trigger endless load-more, janking the visible scroll).
  // Inferred from the passage you open; the NT/LXX toggle switches it manually.
  const [corpus, setCorpus] = useState<'GNT' | 'LXX'>('GNT')
  const [pickerCorpus, setPickerCorpus] = useState<'GNT' | 'LXX'>('GNT')
  const lastScrollTopRef = useRef(0)

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const textPanelRef  = useRef<HTMLDivElement>(null)

  // ── Persisted text highlights (signed-in readers) — same per-chapter loading pattern
  // as the notes above, and drag-to-select capture scoped to the scrolling text panel.
  const highlights = useHighlights(isAuthenticated)
  // Latest highlights for the memoized right-click handler (forVerse changes as they load).
  const highlightsRef = useRef(highlights); highlightsRef.current = highlights
  const highlightSelection = useHighlightSelection(textPanelRef)
  useEffect(() => {
    const chapters = new Map<string, { book: string; chapter: number }>()
    for (const s of [...gnt.sections, ...lxx.sections]) {
      const v0 = s.verses[0]
      if (v0) chapters.set(`${v0.bookId}.${v0.chapter}`, { book: v0.bookId, chapter: v0.chapter })
    }
    chapters.forEach(({ book, chapter }) => void highlights.loadFor(book, chapter))
  }, [gnt.sections, lxx.sections, highlights.loadFor])

  const settingsRef   = useRef<HTMLDivElement>(null)
  const gntSentinel      = useRef<HTMLDivElement>(null)
  const lxxSentinel      = useRef<HTMLDivElement>(null)
  const gntTopSentinel   = useRef<HTMLDivElement>(null)
  const lxxTopSentinel   = useRef<HTMLDivElement>(null)
  const verseRefs     = useRef<Record<string, HTMLElement>>({})
  // Verse to re-scroll to after switching the inline translation, captured before the switch
  // so the reader stays on the same verse as the layout re-flows.
  const anchorVerseRef = useRef<string | null>(null)

  const gntLoading     = useRef(false)
  const lxxLoading     = useRef(false)
  const gntBackLoading = useRef(false)
  const lxxBackLoading = useRef(false)
  // While true, infinite-scroll loading is paused so a jump (esp. into the LXX, which
  // sits below the whole NT) isn't fought by chapters loading above and shifting it.
  const navLockRef     = useRef(false)

  const gntRef      = useRef(gnt)
  const lxxRef      = useRef(lxx)
  const gntQueueRef = useRef(gntQueue)
  const lxxQueueRef = useRef(lxxQueue)
  const parsingRef    = useRef(parsingInfo)
  const lockedRef     = useRef(lockedInfo)
  const syntaxMenuRef = useRef(false)
  const fetchedTransKeys = useRef<Set<string>>(new Set())


  useEffect(() => { gntRef.current      = gnt },        [gnt])
  useEffect(() => { lxxRef.current      = lxx },        [lxx])
  useEffect(() => { gntQueueRef.current = gntQueue },   [gntQueue])
  useEffect(() => { lxxQueueRef.current = lxxQueue },   [lxxQueue])

  // ── Deep link: jump to a passage passed via ?ref= (from Exegesis or Master Search) ──
  // Keyed by ref+highlight (not a one-shot boolean) so a NEW target re-jumps even when the
  // reader is already mounted — e.g. opening Master Search while reading and clicking a hit.
  const lastJump = useRef<string | null>(null)
  useEffect(() => {
    if (!initialRef || gntQueue.length === 0) return
    const key = `${initialRef}||${initialHighlight ?? ''}||${initialTransLang ?? ''}`
    if (lastJump.current === key) return
    lastJump.current = key
    // Arriving from a translation search? Show that translation so the highlighted word is visible.
    if (initialTransLang) setParallelLang(initialTransLang)
    handleSearch(initialRef, 'reference', { highlight: initialHighlight })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRef, initialHighlight, initialTransLang, gntQueue.length])
  useEffect(() => { parsingRef.current    = parsingInfo }, [parsingInfo])
  useEffect(() => { lockedRef.current     = lockedInfo },  [lockedInfo])
  useEffect(() => { syntaxMenuRef.current = !!syntaxMenu }, [syntaxMenu])
  // Mirror searchResults into a ref so the (useCallback-stable) word handlers can read
  // the current results without taking it as a dep — keeping their identity stable so
  // memoized verses aren't re-rendered every time a search runs.
  const searchResultsRef = useRef(searchResults)
  useEffect(() => { searchResultsRef.current = searchResults }, [searchResults])

  // ── Close settings on outside click ─────────────────────────────────────────

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // ── Fetch chapters ───────────────────────────────────────────────────────────

  const fetchChapter = useCallback(async (item: ChapterItem): Promise<TextSection | null> => {
    try {
      // Pass the queue item's corpus so the selected GNT edition (Tischendorf vs Nestle
      // 1904) actually loads its own text; the API falls back to the book's native corpus
      // if a chapter file is missing.
      const res  = await fetch(`/api/reader?book=${item.osisId}&chapter=${item.chapter}&corpus=${item.corpus}`)
      const data = await res.json()
      if (!data.verses?.length) return null
      return { key: `${item.osisId}-${item.chapter}`, bookName: item.bookName, corpus: item.corpus, verses: data.verses }
    } catch { return null }
  }, [])

  const loadMoreGnt = useCallback(async () => {
    const series = gntRef.current
    const queue  = gntQueueRef.current
    if (gntLoading.current || series.done || !queue.length) return
    const item = queue[series.queueIdx]
    if (!item) { setGnt(s => ({ ...s, done: true })); return }
    gntLoading.current = true
    const section = await fetchChapter(item)
    setGnt(s => ({
      ...s,
      sections: section ? [...s.sections, section] : s.sections,
      queueIdx: s.queueIdx + 1,
      done: s.queueIdx + 1 >= queue.length,
    }))
    gntLoading.current = false
  }, [fetchChapter])

  const loadMoreLxx = useCallback(async () => {
    const series = lxxRef.current
    const queue  = lxxQueueRef.current
    if (lxxLoading.current || series.done || !queue.length) return
    const item = queue[series.queueIdx]
    if (!item) { setLxx(s => ({ ...s, done: true })); return }
    lxxLoading.current = true
    const section = await fetchChapter(item)
    setLxx(s => ({
      ...s,
      sections: section ? [...s.sections, section] : s.sections,
      queueIdx: s.queueIdx + 1,
      done: s.queueIdx + 1 >= queue.length,
    }))
    lxxLoading.current = false
  }, [fetchChapter])

  // ── Backward (upward) chapter loading ────────────────────────────────────────

  const loadPrevGnt = useCallback(async () => {
    const series = gntRef.current
    const queue  = gntQueueRef.current
    if (gntBackLoading.current || series.backDone || series.backIdx < 0 || !queue.length) return
    const item = queue[series.backIdx]
    if (!item) { setGnt(s => ({ ...s, backDone: true })); return }

    gntBackLoading.current = true
    const panel            = textPanelRef.current
    const prevScrollHeight = panel?.scrollHeight ?? 0
    const prevScrollTop    = panel?.scrollTop    ?? 0

    const section = await fetchChapter(item)
    setGnt(s => ({
      ...s,
      sections: section ? [section, ...s.sections] : s.sections,
      backIdx:  s.backIdx - 1,
      backDone: s.backIdx - 1 < 0,
    }))
    requestAnimationFrame(() => {
      if (panel) panel.scrollTop = prevScrollTop + (panel.scrollHeight - prevScrollHeight)
      gntBackLoading.current = false
    })
  }, [fetchChapter])

  const loadPrevLxx = useCallback(async () => {
    const series = lxxRef.current
    const queue  = lxxQueueRef.current
    if (lxxBackLoading.current || series.backDone || series.backIdx < 0 || !queue.length) return
    const item = queue[series.backIdx]
    if (!item) { setLxx(s => ({ ...s, backDone: true })); return }

    lxxBackLoading.current = true
    const panel            = textPanelRef.current
    const prevScrollHeight = panel?.scrollHeight ?? 0
    const prevScrollTop    = panel?.scrollTop    ?? 0

    const section = await fetchChapter(item)
    setLxx(s => ({
      ...s,
      sections: section ? [section, ...s.sections] : s.sections,
      backIdx:  s.backIdx - 1,
      backDone: s.backIdx - 1 < 0,
    }))
    requestAnimationFrame(() => {
      if (panel) panel.scrollTop = prevScrollTop + (panel.scrollHeight - prevScrollHeight)
      lxxBackLoading.current = false
    })
  }, [fetchChapter])

  // ── Mount: seed LXX corpus ───────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/reader?corpus=LXX')
      .then(r => r.json())
      .then(lxxData => {
        const lxxQ = buildQueue(lxxData.books ?? [])
        setLxxQueue(lxxQ)
        if (lxxQ[0]) {
          lxxLoading.current = true
          fetchChapter(lxxQ[0]).then(section => {
            setLxx({ sections: section ? [section] : [], queueIdx: 1, backIdx: -1, done: 1 >= lxxQ.length, backDone: true })
            lxxLoading.current = false
          })
        }
      })
      .catch(() => {})
  }, [fetchChapter])

  // ── GNT edition: load/reload GNT corpus when edition changes ─────────────────
  // Also runs on mount (initial value 'nestle1904') to seed the first GNT chapter.

  useEffect(() => {
    setGnt({ sections: [], queueIdx: 0, backIdx: -1, done: false, backDone: true })
    gntLoading.current = false
    const corpus = gntEdition === 'nestle1904' ? 'NA1904' : 'GNT'
    fetch(`/api/reader?corpus=${corpus}`)
      .then(r => r.json())
      .then(data => {
        const q = buildQueue(data.books ?? [])
        setGntQueue(q)
        if (q[0]) {
          gntLoading.current = true
          fetchChapter(q[0]).then(section => {
            setGnt({ sections: section ? [section] : [], queueIdx: 1, backIdx: -1, done: 1 >= q.length, backDone: true })
            gntLoading.current = false
          })
        }
      })
      .catch(() => {})
  }, [gntEdition, fetchChapter])

  // ── Scroll-based infinite loading ────────────────────────────────────────────

  useEffect(() => {
    const panel = textPanelRef.current
    if (!panel) return

    function onScroll() {
      if (navLockRef.current) return
      const rect        = panel!.getBoundingClientRect()
      const panelTop    = rect.top
      const panelBottom = rect.bottom
      // Only the visible corpus loads. `offsetParent === null` means the sentinel's corpus is
      // display:none (the other testament) — its getBoundingClientRect() would report top=0 and
      // spuriously satisfy every "load more" test, background-loading the hidden corpus and
      // janking the visible scroll. `visible()` gates that out.
      const visible = (el: HTMLElement | null) => !!el && el.offsetParent !== null
      if (visible(gntSentinel.current) && !gntRef.current.done) {
        if (gntSentinel.current!.getBoundingClientRect().top < panelBottom + LOOKAHEAD) loadMoreGnt()
      }
      if (visible(lxxSentinel.current) && !lxxRef.current.done) {
        if (lxxSentinel.current!.getBoundingClientRect().top < panelBottom + LOOKAHEAD) loadMoreLxx()
      }
      if (visible(gntTopSentinel.current) && !gntRef.current.backDone) {
        if (gntTopSentinel.current!.getBoundingClientRect().bottom > panelTop - LOOKAHEAD) loadPrevGnt()
      }
      if (visible(lxxTopSentinel.current) && !lxxRef.current.backDone) {
        if (lxxTopSentinel.current!.getBoundingClientRect().bottom > panelTop - LOOKAHEAD) loadPrevLxx()
      }
    }

    panel.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => panel.removeEventListener('scroll', onScroll)
  }, [loadMoreGnt, loadMoreLxx, loadPrevGnt, loadPrevLxx])

  useEffect(() => {
    const panel = textPanelRef.current
    if (!panel) return
    const DELTA = 8
    const REVEAL_TOP = 24
    function onScroll() {
      const y = panel!.scrollTop
      const last = lastScrollTopRef.current
      if (y <= REVEAL_TOP) setShowTopBar(true)
      else if (y - last > DELTA) setShowTopBar(false)
      else if (last - y > DELTA) setShowTopBar(true)
      lastScrollTopRef.current = y
    }
    panel.addEventListener('scroll', onScroll, { passive: true })
    return () => panel.removeEventListener('scroll', onScroll)
  }, [])

  // ── Immersive reading (mobile only): mark the Reader mounted ──────────────────
  // globals.css uses html[data-reader="on"] to drop the global header on phones and
  // give the reader the full viewport (its nav lives in the reader menu instead).
  // Cleared on unmount so every other page keeps its header.
  useEffect(() => {
    document.documentElement.dataset.reader = 'on'
    return () => { delete document.documentElement.dataset.reader }
  }, [])

  // Per-verse callback refs, cached by id so each keeps a STABLE identity across renders —
  // otherwise a fresh arrow every render would defeat React.memo on GreekVerse. Anchors the
  // Greek verse <p> for scroll-position measurement.
  const greekRefCbs = useRef<Map<string, (el: HTMLElement | null) => void>>(new Map())
  function greekVerseRef(id: string) {
    let cb = greekRefCbs.current.get(id)
    if (!cb) {
      cb = (el: HTMLElement | null) => { if (el) verseRefs.current[id] = el; else delete verseRefs.current[id] }
      greekRefCbs.current.set(id, cb)
    }
    return cb
  }

  // The verse currently at the top of the reading panel. Returns the first verse whose
  // bottom is still below the panel's top edge — i.e. the one straddling / at the top.
  function visibleVerseId(): string | null {
    const panel = textPanelRef.current
    if (!panel) return null
    const panelTop = panel.getBoundingClientRect().top
    const map = verseRefs.current
    let bestId: string | null = null
    let bestTop = Infinity
    for (const id in map) {
      const el = map[id]
      if (!el || !el.isConnected) continue
      const r = el.getBoundingClientRect()
      if (r.height === 0) continue
      if (r.bottom > panelTop + 4 && r.top < bestTop) { bestTop = r.top; bestId = id }
    }
    return bestId
  }

  // Change the inline translation (or Greek-only) but keep the reader on the same verse:
  // remember the top verse, switch, then the re-anchor effect below scrolls it back to the
  // top once the layout (adding/removing the inline translation) has re-flowed.
  function switchView(next: string | null) {
    anchorVerseRef.current = visibleVerseId()
    setParallelLang(next)
  }

  // ── Shift: freeze / unfreeze parsing panel ───────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Shift' || e.repeat) return
      const current = parsingRef.current
      const locked  = lockedRef.current
      if (locked) { setLockedInfo(null); setParsingInfo(null) }
      else if (current) { setLockedInfo(current) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // ── Scroll to highlighted verse (instant; navKey forces re-fire for same verse) ──

  useEffect(() => {
    if (!highlightedVerse) return
    const panel = textPanelRef.current
    // A jump preloads NAV_PRE chapters *before* the target, so the freshly-rendered window
    // starts on the PREVIOUS book; only this snap moves the view down onto the target. If we
    // gave up (or let a stray touch cancel us) before the target's DOM existed, the reader
    // would be stranded at the top of that window — i.e. on the previous book. So we poll
    // until the target actually renders, and we do NOT honour a user scroll until we've
    // landed. Uses setTimeout (not requestAnimationFrame) because rAF is paused whenever the
    // page is hidden/backgrounded, which would leave the jump un-scrolled.
    let landed = false
    let landedAt = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const scrollToVerse = () => {
      const el = verseRefs.current[highlightedVerse]
      if (!el || !el.isConnected) return
      el.scrollIntoView({ behavior: 'instant', block: 'start' })
      if (!landed) { landed = true; landedAt = Date.now() }
    }
    navLockRef.current = true
    const startedAt = Date.now()
    const tick = () => {
      scrollToVerse()
      const now = Date.now()
      if (!landed) {
        // Still waiting for the target to render — keep polling (mobile can take ~1s).
        timer = now - startedAt < 6000 ? setTimeout(tick, 32) : undefined
      } else if (now - landedAt < 1800) {
        // Landed — a few more corrective snaps as fonts / parallel rows settle heights.
        timer = setTimeout(tick, 250)
      } else {
        navLockRef.current = false
      }
    }
    scrollToVerse()               // immediate attempt (target may already be rendered)
    timer = setTimeout(tick, 32)
    const release = setTimeout(() => { navLockRef.current = false }, 6000)  // hard backstop
    // Stop snapping the moment the user scrolls/keys — but only AFTER we've landed on the
    // target. Before that, a stray touch must not cancel the snap (that is exactly what
    // stranded the reader on the previous book).
    const stop = () => {
      if (!landed) return
      if (timer) clearTimeout(timer)
      clearTimeout(release)
      navLockRef.current = false
      panel?.removeEventListener('wheel', stop)
      panel?.removeEventListener('touchmove', stop)
      window.removeEventListener('keydown', stop)
    }
    panel?.addEventListener('wheel', stop, { passive: true })
    panel?.addEventListener('touchmove', stop, { passive: true })
    window.addEventListener('keydown', stop)
    return () => {
      if (timer) clearTimeout(timer)
      clearTimeout(release)
      navLockRef.current = false
      panel?.removeEventListener('wheel', stop)
      panel?.removeEventListener('touchmove', stop)
      window.removeEventListener('keydown', stop)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedVerse, navKey])

  // ── Re-anchor after a view switch ─────────────────────────────────────────────
  // A swipe/tap that changes the shown text (parallelLang) reuses the same scroll
  // container, whose scrollTop is a pixel value — and the panes have very different
  // heights, so the old pixel offset lands on the wrong verse. Scroll the verse that
  // was at the top back to the top once the new pane has rendered. Runs a few passes
  // because a first-seen translation fills in asynchronously (heights shift as it
  // arrives); stops the moment the user scrolls so it never fights their reading.
  useEffect(() => {
    const id = anchorVerseRef.current
    if (!id) return
    anchorVerseRef.current = null
    const panel = textPanelRef.current
    const scrollToAnchor = () => {
      const el = verseRefs.current[id]
      if (el && el.isConnected) el.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
    scrollToAnchor()
    const raf = requestAnimationFrame(scrollToAnchor)
    const timers = [80, 250, 600].map(ms => setTimeout(scrollToAnchor, ms))
    const stop = () => {
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      panel?.removeEventListener('wheel', stop)
      panel?.removeEventListener('touchmove', stop)
    }
    panel?.addEventListener('wheel', stop, { passive: true })
    panel?.addEventListener('touchmove', stop, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      panel?.removeEventListener('wheel', stop)
      panel?.removeEventListener('touchmove', stop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parallelLang])

  // ── Inline translation fetching ───────────────────────────────────────────────
  // Fetch the chosen translation for every loaded chapter. Results are cached per language
  // in transByLang and never cleared, so re-selecting a translation you've viewed before is
  // instant. fetchedTransKeys (namespaced by lang) dedupes across chapters.
  useEffect(() => {
    if (!parallelLang) return
    // BSB is rendered from its alignment file, not the translation API.
    if (parallelLang === 'bsb') { if (!bsbAlignment) loadBsbAlignment().then(setBsbAlignment); return }
    const lang = parallelLang
    const allSections = [...gnt.sections, ...lxx.sections]
    for (const sec of allSections) {
      const key = `${lang}.${sec.key}`
      if (fetchedTransKeys.current.has(key)) continue
      fetchedTransKeys.current.add(key)
      const [osisId, chapterStr] = sec.key.split('-')
      const chapter = parseInt(chapterStr, 10)
      const verseIds = sec.verses.map(v => v.id)
      fetch(`/api/translation?book=${osisId}&chapter=${chapter}&lang=${lang}`)
        .then(r => r.json())
        .then(data => {
          const received: Record<string, string> = data.verses ?? {}
          // Fill in '' for any verse the API didn't return so it doesn't show "Loading…"
          // forever (deuterocanonical books, uncovered chapters).
          const patch: Record<string, string> = {}
          for (const id of verseIds) patch[id] = received[id] ?? ''
          setTransByLang(prev => ({ ...prev, [lang]: { ...(prev[lang] ?? {}), ...patch } }))
        })
        .catch(() => {
          const patch = Object.fromEntries(verseIds.map(id => [id, '']))
          setTransByLang(prev => ({ ...prev, [lang]: { ...(prev[lang] ?? {}), ...patch } }))
        })
    }
  }, [parallelLang, gnt.sections, lxx.sections, bsbAlignment])

  // Fetch translations for search results (they aren't in gnt/lxx sections so the
  // effect above never covers them). Group by book+chapter to minimise requests.
  useEffect(() => {
    if (!parallelLang || parallelLang === 'bsb' || !searchResults?.length) return
    const groups: Record<string, { osisId: string; chapter: number; verseIds: string[] }> = {}
    for (const v of searchResults) {
      const secKey = `${v.bookId}-${v.chapter}`
      if (!groups[secKey]) groups[secKey] = { osisId: v.bookId, chapter: v.chapter, verseIds: [] }
      groups[secKey].verseIds.push(v.id)
    }
    const lang = parallelLang
    for (const [secKey, group] of Object.entries(groups)) {
      const key = `${lang}.${secKey}`
      if (fetchedTransKeys.current.has(key)) continue
      fetchedTransKeys.current.add(key)
      fetch(`/api/translation?book=${group.osisId}&chapter=${group.chapter}&lang=${lang}`)
        .then(r => r.json())
        .then(data => {
          const received: Record<string, string> = data.verses ?? {}
          const patch: Record<string, string> = {}
          for (const id of group.verseIds) patch[id] = received[id] ?? ''
          setTransByLang(prev => ({ ...prev, [lang]: { ...(prev[lang] ?? {}), ...patch } }))
        })
        .catch(() => {
          const patch = Object.fromEntries(group.verseIds.map(id => [id, '']))
          setTransByLang(prev => ({ ...prev, [lang]: { ...(prev[lang] ?? {}), ...patch } }))
        })
    }
  }, [parallelLang, searchResults])

  // ── Search / navigation ────────────────────────────────────────────────────────

  // Poll until the full book list (fetched from /data/books.json on mount) is
  // populated, so a search right after page load doesn't race that fetch.
  async function waitForBooksReady(timeoutMs = 10_000): Promise<BiblicalBook[]> {
    const start = Date.now()
    while (allBooksRef.current.length === 0 && Date.now() - start < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return allBooksRef.current
  }

  // Poll until the target corpus's queue actually contains the requested chapter, or
  // give up after a timeout. gntQueue/lxxQueue populate from their own background
  // fetches on mount (LXX is the larger of the two), so a reference into a corpus that
  // hasn't finished loading yet would otherwise find no match and silently do nothing.
  async function waitForChapterInQueue(isLxx: boolean, osisId: string, chapter: number, timeoutMs = 10_000): Promise<boolean> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const queue = isLxx ? lxxQueueRef.current : gntQueueRef.current
      if (queue.some(item => item.osisId === osisId && item.chapter === chapter)) return true
      await new Promise(resolve => setTimeout(resolve, 150))
    }
    return false
  }

  async function handleSearch(query: string, type: 'word' | 'reference', opts?: { lang?: string; lemma?: boolean; keepResults?: boolean; highlight?: string }) {
    const trimmed = query.trim()
    const lang = opts?.lang
    // A result-click (keepResults) jumps to the passage but keeps the results list so the
    // reader can return to it; any other search clears the list.
    if (!opts?.keepResults) { setTranslationResults(null); setViewingResultPassage(false) }
    // Per-word highlight on arrival (from Master Search): a Greek query lights up Greek words,
    // a translation query lights up the inline translation. Only set on a reference jump.
    if (!(type === 'reference' && opts?.highlight)) setArrivalTerms([])
    // A lexeme-suggestion pick is an "all forms" search → highlight every form by lemma.
    setSearchLemma(type === 'word' && opts?.lemma ? normalizeGreek(trimmed) : null)

    // ── Translation word search (mobile, while a translation is the current view) ──
    if (type === 'word' && lang) {
      setSearchLoading(true)
      setSearchType('word')
      setSearchResults(null)       // not a Greek result set
      setWordSearchTerm(null)
      setTranslationSearchLang(lang)
      setTranslationSearchTerm(trimmed)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&type=word&lang=${lang}`)
        const data = await res.json()
        setTranslationResults(data.results ?? [])
      } finally { setSearchLoading(false) }
      return
    }

    // ── Greek lemma search (picked a lexeme suggestion): find every inflected form ──
    if (type === 'word' && opts?.lemma) {
      setSearchLoading(true)
      setSearchType('word')
      setWordSearchTerm(null)      // forms vary, so no single highlight term
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&type=word&lemma=true&corpus=BOTH`)
        const data = await res.json()
        setSearchResults(data.results ?? [])
        setHighlightedVerse(null)
      } finally { setSearchLoading(false) }
      return
    }

    if (type === 'reference') {
      setSearchLoading(true)
      let handledAsReference = false
      try {
        // Resolved against the full book list (both corpora), not the live queues —
        // otherwise a reference into a corpus that hadn't finished loading yet (LXX
        // is the larger fetch) would find no matching book and silently fail.
        const books = await waitForBooksReady()
        const ref = parseReference(trimmed, books)
        if (ref) {
          handledAsReference = true
          if (opts?.keepResults) setViewingResultPassage(true)  // show the passage; keep the list behind a Back arrow
          setSearchResults(null)   // stay in scrolling mode
          setSearchType(null)
          // Highlight the arrival term(s): Greek query → Greek words (wordSearchTerm), any query
          // → inline translation (arrivalTerms). A non-Greek term simply won't match Greek words.
          const hlq = opts?.highlight?.trim()
          const isGreekQ = !!hlq && /[Ͱ-Ͽἀ-῿]/.test(hlq)
          setWordSearchTerm(hlq && isGreekQ ? normalizeGreek(hlq) : null)
          setArrivalTerms(hlq ? parseSearchTerms(hlq) : [])
          setCorpus(ref.book.corpus === 'LXX' ? 'LXX' : 'GNT')   // show the corpus we're jumping into, so the jump lands in a short single-corpus scroll
          const isLxx  = ref.book.corpus === 'LXX'
          const ready  = await waitForChapterInQueue(isLxx, ref.book.osisId, ref.chapter)
          if (!ready) {
            // The corpus never finished loading (or something's genuinely wrong) —
            // say so instead of leaving the reader looking like nothing happened.
            setSearchType('reference')
            setSearchResults([])
            return
          }
          const queue     = isLxx ? lxxQueueRef.current : gntQueueRef.current
          const targetIdx = queue.findIndex(
            item => item.osisId === ref.book.osisId && item.chapter === ref.chapter
          )
          if (targetIdx !== -1) {
            // Pre-load chapters around the target so the user can scroll in either
            // direction immediately without a network delay.
            const preloadStart = Math.max(0, targetIdx - NAV_PRE)
            const preloadEnd   = Math.min(queue.length - 1, targetIdx + NAV_FWD)
            const idxsToFetch  = Array.from(
              { length: preloadEnd - preloadStart + 1 },
              (_, i) => preloadStart + i,
            )

            if (isLxx) lxxLoading.current = true
            else       gntLoading.current = true

            const fetched = await Promise.all(idxsToFetch.map(i => fetchChapter(queue[i])))

            const validSections = fetched.filter((s): s is TextSection => s !== null)
            if (validSections.length > 0) {
              const newQueueIdx = preloadEnd + 1          // next chapter to append going forward
              const isDone      = newQueueIdx >= queue.length
              const newBackIdx  = preloadStart - 1        // next chapter to prepend going backward
              const backDone    = newBackIdx < 0

              if (isLxx) setLxx({ sections: validSections, queueIdx: newQueueIdx, backIdx: newBackIdx, done: isDone, backDone })
              else       setGnt({ sections: validSections, queueIdx: newQueueIdx, backIdx: newBackIdx, done: isDone, backDone })

              // Identify the target section by key (not by position in validSections).
              const targetKey     = `${queue[targetIdx].osisId}-${queue[targetIdx].chapter}`
              const targetSection = validSections.find(s => s.key === targetKey) ?? validSections[0]
              const vId = ref.verse
                ? (targetSection.verses.find((v: BiblicalVerse) => v.verse === ref.verse)?.id ?? targetSection.verses[0]?.id ?? null)
                : targetSection.verses[0]?.id ?? null

              // navKey always increments so the scroll effect fires even when vId is
              // unchanged (e.g. re-searching the same reference).
              setHighlightedVerse(vId)
              setNavKey(k => k + 1)
            }

            // Release loading lock only after state has been set so loadMoreGnt/Lxx
            // cannot fire with a stale queueIdx during the re-render window.
            if (isLxx) lxxLoading.current = false
            else       gntLoading.current = false
          }
        }
      } finally { setSearchLoading(false) }
      if (handledAsReference) return
    }

    setSearchLabel(null)
    setConcordance(false)
    setSearchLoading(true)
    setSearchType(type)
    setWordSearchTerm(type === 'word' ? normalizeGreek(trimmed) : null)
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&type=${type}&corpus=BOTH`)
      const data = await res.json()
      setSearchResults(data.results ?? [])
      setHighlightedVerse(null)
    } finally { setSearchLoading(false) }
  }

  // ── Right-click "Search this word" ──────────────────────────────────────────────
  // Runs a word-derived search (lemma / exact form / morphology / Strong's) and drops the
  // reader into results mode with a label describing what was searched.
  async function runWordSearch(url: string, label: string, opts?: { highlight?: string | null; lemma?: string | null }) {
    setSyntaxMenu(null)
    setTranslationResults(null); setViewingResultPassage(false)
    setSearchLabel(label)
    setConcordance(false)
    setSearchLoading(true)
    setSearchType('word')
    setWordSearchTerm(opts?.highlight ? normalizeGreek(opts.highlight) : null)
    setSearchLemma(opts?.lemma ? normalizeGreek(opts.lemma) : null)
    setHighlightedVerse(null)
    try {
      const res  = await fetch(url)
      const data = await res.json()
      setSearchResults(data.results ?? [])
    } finally { setSearchLoading(false) }
  }

  function handleWordAction(action: WordSearchAction, scope: SearchScope) {
    const w = syntaxMenu?.word
    if (!w) return
    const lemma   = w.lexeme?.lexeme
    const strongs = w.lexeme?.strongs
    if (action === 'morph')   { setMorphPickerWord(w); setSyntaxMenu(null); return }
    if (action === 'lexicon') { setLexiconWord(w);     setSyntaxMenu(null); return }
    if (action === 'backgrounds') {
      // Search the embedded background texts (Philo, Josephus, LXX, …) for this word,
      // seeded with its lemma (editable in the modal). Greek facet.
      openBackgroundsSearch(lemma ?? w.surface, 'grc'); setSyntaxMenu(null); return
    }
    if (action === 'lemma') {
      if (!lemma) return
      runWordSearch(`/api/search?q=${encodeURIComponent(lemma)}&type=word&lemma=true&corpus=${scope}`, `All forms of ${lemma}`, { lemma })
    } else if (action === 'form') {
      runWordSearch(`/api/search?q=${encodeURIComponent(w.surface)}&type=word&corpus=${scope}`, `Exact form: ${w.surface}`, { highlight: w.surface })
    } else if (action === 'strongs') {
      if (!strongs) return
      const num = String(strongs).replace(/^0+/, '')
      runWordSearch(`/api/search?q=${encodeURIComponent(num)}&type=strongs&corpus=${scope}`, `Strong's ${num}${lemma ? ` · ${lemma}` : ''}`, { lemma })
    }
  }

  function runMorphSearch(features: string[], lemma: string | null) {
    setMorphPickerWord(null)
    const params = new URLSearchParams({ type: 'morph', features: features.join(','), corpus: 'GNT' })
    if (lemma) params.set('lemma', lemma)
    const label = `Morphology: ${features.length ? features.join(', ') : 'any'}${lemma ? ` · ${lemma}` : ''}`
    runWordSearch(`/api/search?${params.toString()}`, label, { lemma })
  }

  // A compact concordance (KWIC) row: reference + the Greek verse text; tap the reference
  // to jump there. Used when the results "Concordance" toggle is on.
  function renderConcordanceRow(v: BiblicalVerse) {
    return (
      <div key={v.id} className="flex gap-2 items-baseline py-1.5 border-b border-gray-50">
        <button
          onClick={() => handleSearch(v.reference, 'reference')}
          className="shrink-0 w-24 text-right text-xs font-semibold text-brand-600 hover:underline"
        >
          {v.reference}
        </button>
        <p className="greek-text flex-1 text-gray-700 leading-snug" style={{ fontSize: '0.95rem' }}>
          {v.words && v.words.length > 0
            ? v.words.map((w, i) => {
                const match =
                  (!!wordSearchTerm && normalizeGreek(w.surface).includes(wordSearchTerm)) ||
                  (!!searchLemma && normalizeGreek(w.lexeme?.lexeme ?? '') === searchLemma)
                return <span key={w.id} className={match ? 'text-red-600 font-semibold' : undefined}>{w.surface}{i < v.words!.length - 1 ? ' ' : ''}</span>
              })
            : v.text}
        </p>
      </div>
    )
  }

  // Restore the floating results panel's last position when it opens (clamped to the current
  // viewport in case the window shrank); fall back to top-right for the first-ever open.
  useEffect(() => {
    if (searchResults !== null && !resultsPos && typeof window !== 'undefined') {
      let pos: { x: number; y: number } | null = null
      try {
        const p = JSON.parse(localStorage.getItem(RESULTS_POS_KEY) || 'null')
        if (p && typeof p.x === 'number' && typeof p.y === 'number') {
          pos = {
            x: Math.min(Math.max(8, p.x), Math.max(8, window.innerWidth - RESULTS_W - 8)),
            y: Math.min(Math.max(8, p.y), Math.max(8, window.innerHeight - 44)),
          }
        }
      } catch {}
      setResultsPos(pos ?? { x: Math.max(12, window.innerWidth - RESULTS_W - 28), y: 92 })
    }
    if (searchResults === null) setResultsPos(null)
  }, [searchResults, resultsPos])

  function startResultsDrag(e: ReactPointerEvent) {
    e.preventDefault()
    const panel = (e.currentTarget as HTMLElement).closest('[data-results-panel]') as HTMLElement | null
    const rect = panel?.getBoundingClientRect()
    resultsDrag.current = { ox: e.clientX - (rect?.left ?? 0), oy: e.clientY - (rect?.top ?? 0) }
    const move = (ev: globalThis.PointerEvent) => {
      if (!resultsDrag.current) return
      const w = panel?.offsetWidth ?? RESULTS_W
      const x = Math.min(Math.max(8, ev.clientX - resultsDrag.current.ox), window.innerWidth - w - 8)
      const y = Math.min(Math.max(8, ev.clientY - resultsDrag.current.oy), window.innerHeight - 44)
      setResultsPos({ x, y })
    }
    const up = () => {
      resultsDrag.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const r = panel?.getBoundingClientRect()
      if (r) try { localStorage.setItem(RESULTS_POS_KEY, JSON.stringify({ x: r.left, y: r.top })) } catch {}
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function exitSearch() {
    setSearchResults(null); setTranslationResults(null); setViewingResultPassage(false); setSearchType(null)
    setWordSearchTerm(null); setSearchLemma(null); setArrivalTerms([]); setLockedInfo(null); setHighlightedVerse(null)
    setSearchLabel(null); setConcordance(false)
  }

  // ── Settings flyout helpers ────────────────────────────────────────────────────

  const flyoutCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function toggleFlyout(name: 'translations' | 'contents' | 'syntax' | 'controls') {
    setSettingsFlyout(prev => prev === name ? null : name)
  }

  function scheduleFlyoutClose() {
    flyoutCloseTimerRef.current = setTimeout(() => setSettingsFlyout(null), 150)
  }

  function cancelFlyoutClose() {
    if (flyoutCloseTimerRef.current) {
      clearTimeout(flyoutCloseTimerRef.current)
      flyoutCloseTimerRef.current = null
    }
  }

  // ── Word interaction ───────────────────────────────────────────────────────────

  // These three word handlers are useCallback-stable (they read state through refs, not
  // closures) so that GreekVerse/GreekWord — now memoized — aren't torn down and re-rendered
  // on every parent render just because a handler identity changed.
  const handleWordHover = useCallback((wordId: string | null, info: LexicalInfoPanel | null) => {
    setActiveWordId(wordId)
    if (!lockedRef.current) {
      // Don't clear the panel when the mouse leaves due to the syntax menu appearing on top
      if (info !== null || !syntaxMenuRef.current) setParsingInfo(info)
    }
  }, [])

  const handleWordClick = useCallback((info: LexicalInfoPanel | null) => {
    if (!lockedRef.current) setParsingInfo(info)
  }, [])

  const handleWordRightClick = useCallback((word: VerseWord, x: number, y: number, start: number, end: number) => {
    Promise.all([loadSyntax(), loadGbi(), loadAbsSyntax(), loadMaculaSyntax()]).then(([data, gbiData, absData, maculaData]) => {
      const gbiEntry    = gbiData[word.id]    ?? null
      const absEntry    = absData[word.id]    ?? null
      const maculaEntry = maculaData[word.id] ?? null
      const syn = data[word.id] ?? null

      // Find the verse that contains this word
      let verse: BiblicalVerse | null = null
      for (const sec of [...gntRef.current.sections, ...lxxRef.current.sections]) {
        const found = sec.verses.find(v => v.id === word.verseId)
        if (found) { verse = found; break }
      }
      // Also check search results
      if (!verse && searchResultsRef.current) {
        verse = searchResultsRef.current.find(v => v.id === word.verseId) ?? null
      }

      const words = verse?.words ?? []
      const myPos  = word.position
      const parse  = word.parses?.[0]
      const mood   = parse?.mood ?? ''
      const kase   = parse?.casus ?? ''
      const pos    = parse?.partOfSpeech ?? ''

      // Words before this one, closest first
      const prevWords = [...words]
        .filter(w => w.position < myPos)
        .sort((a, b) => b.position - a.position)

      // 1. Governing preposition (for nominals in a PP, or in an NP nested inside a PP)
      // Direct: syn.c === 'pp' (word is in a PP) or syn.gc === 'pp' (word is in NP inside PP).
      // Nested: some PPs wrap their object in two NP levels (PP→NP→NP→word, gc="np").
      //   Detect this by checking whether any of the 4 nearest preceding words
      //   themselves have gc="pp" or c="pp" in the syntax data.
      let governingPrep: string | null = null
      // Prepositions never govern nominatives in Greek — skip detection entirely
      // Every word that genuinely belongs to a PP's NP has gc='pp' in Lowfat,
      // so directlyInPP is sufficient. Secondary NPs nested inside the PP object
      // (appositives, genitive modifiers) have gc='np' and should show their own
      // genitive category (possessive, apposition, etc.), not prepositional governance.
      // Articular NP heads are one level deeper than the article in Lowfat: the
      // article keeps gc='pp' but the head word gets gc='np' (e.g. ἐρήμῳ in
      // Matt 3:1, where τῇ has gc='pp' but ἐρήμῳ has gc='np'). Check only the
      // immediately preceding word (the article) to avoid cross-phrase
      // contamination — looking further back would re-introduce the κυρίου
      // false-positive (cf. Matt 3:3, where Ἡσαΐου gc='pp' is 2 words before
      // the genitive modifier προφήτου).
      const directlyInPP = kase !== 'Nominative' && (
        syn?.c === 'pp' ||
        (syn?.gc === 'pp' && syn?.h === true) ||
        // Articular NP head, 1 level of NP nesting inside the PP (article gc='pp')
        (syn?.h === true && !!prevWords[0] && data[prevWords[0].id]?.gc === 'pp') ||
        // Articular NP head, 2 levels of NP nesting (e.g. appositive in the NP creates
        // an extra NP wrapper): PREP(c:pp) → NP → NP → head.
        // Detected by: the word before the article is the preposition itself.
        (syn?.h === true &&
          prevWords[0]?.parses?.[0]?.partOfSpeech === 'Article' &&
          prevWords[1]?.parses?.[0]?.partOfSpeech === 'Preposition')
      )
      if (directlyInPP) {
        for (const pw of prevWords.slice(0, 6)) {
          if (pw.parses?.[0]?.partOfSpeech === 'Preposition') {
            governingPrep = pw.lexeme?.lexeme ?? pw.surface
            break
          }
        }
      }
      // Articular infinitive: PREP + τό + [μή/οὐ] + INFINITIVE
      // The infinitive heads the articular clause, which is the PP object — so
      // directlyInPP is false for the infinitive itself. Detect the pattern by
      // scanning backwards through negation particles, then an article, then a preposition.
      if (!governingPrep && mood === 'Infinitive') {
        const NEGS = new Set(['μή', 'οὐ', 'οὐκ', 'οὐχ'])
        let i = 0
        while (i < prevWords.length && NEGS.has(prevWords[i].lexeme?.lexeme ?? prevWords[i].surface)) i++
        if (i < prevWords.length && prevWords[i].parses?.[0]?.partOfSpeech === 'Article') {
          i++
          if (i < prevWords.length && prevWords[i].parses?.[0]?.partOfSpeech === 'Preposition')
            governingPrep = prevWords[i].lexeme?.lexeme ?? prevWords[i].surface
        }
      }

      // 2. Preceding conjunction (ἵνα, ἐάν, εἰ, ὥστε, πρίν, etc.) for verbs and infinitives
      let precedingConj: string | null = null
      if (mood === 'Subjunctive' || mood === 'Indicative' || mood === 'Infinitive') {
        const CONJUNCTIONS = new Set(['ἵνα', 'ὅπως', 'ἐάν', 'εἰ', 'ὡς', 'ὅτε', 'ὅταν', 'ἄν', 'ὥστε', 'πρίν'])
        for (const pw of prevWords.slice(0, 6)) {
          const lex = pw.lexeme?.lexeme ?? pw.surface
          if (CONJUNCTIONS.has(lex)) { precedingConj = lex; break }
        }
      }

      // 3. Emphatic negation (οὐ μή before subjunctive) and standalone μή (prohibition)
      let emphNeg = false
      let hasPrecedingMh = false
      if (mood === 'Subjunctive') {
        const nearby = prevWords.slice(0, 3).map(w => w.lexeme?.lexeme ?? w.surface)
        emphNeg = nearby.some(l => ['οὐ', 'οὐκ', 'οὐχ'].includes(l)) && nearby.some(l => l === 'μή')
        // Standalone μή (without preceding οὐ/οὐκ/οὐχ) → prohibition or negative purpose
        hasPrecedingMh = !emphNeg && nearby.some(l => l === 'μή')
      }

      // 4. Nearby linking verb (for predicate nominative detection)
      let nearbyLinkingVerb = false
      if (kase === 'Nominative' && pos !== 'Verb' && pos !== 'Article') {
        const LINKING = new Set(['εἰμί', 'γίνομαι'])
        nearbyLinkingVerb = words.some(w => {
          const lex = w.lexeme?.lexeme ?? w.surface
          const wp  = w.parses?.[0]
          return LINKING.has(lex) && wp?.mood !== 'Participle' && wp?.mood !== 'Infinitive'
        })
      }

      // 5. Double accusative: same clause (between nearest head verbs) contains o2
      let clauseHasO2 = false
      if (kase === 'Accusative') {
        const wordIdx = words.findIndex(w => w.id === word.id)
        // Find nearest preceding head verb
        let clauseStart = 0
        for (let i = wordIdx - 1; i >= 0; i--) {
          const ws = data[words[i].id]
          if (ws?.r === 'v' && ws?.h) { clauseStart = i; break }
        }
        // Find next head verb (exclusive end)
        let clauseEnd = words.length
        for (let i = wordIdx + 1; i < words.length; i++) {
          const ws = data[words[i].id]
          if (ws?.r === 'v' && ws?.h) { clauseEnd = i; break }
        }
        clauseHasO2 = words.slice(clauseStart, clauseEnd).some(w => {
          const ws = data[w.id]
          return ws?.pr === 'o2' || ws?.r === 'o2' || ws?.gr === 'o2'
        })
      }

      // 6. Genitive absolute: a genitive subject (r:'s', c:'cl') within ±3 words
      let hasGenitiveAbsSubject = false
      if (kase === 'Genitive' && mood === 'Participle') {
        const wordIdx = words.findIndex(w => w.id === word.id)
        const window3 = words.slice(Math.max(0, wordIdx - 3), wordIdx + 4)
        hasGenitiveAbsSubject = window3.some(w => {
          if (w.id === word.id) return false
          const ws = data[w.id]
          return ws?.r === 's' && ws?.c === 'cl'
        })
      }

      // 7. Participle article context: detect substantival (article + participle,
      // no preceding noun) vs. 2nd-position attributive (noun + article + participle).
      //
      // Greek postpositive particles (δέ, γάρ, οὖν, etc.) can stand between an
      // article and its head — e.g. ὁ δὲ ἀπειθῶν (John 3:36). Skip exactly one
      // postpositive before looking for the article so these are not misidentified
      // as adjectival/attributive participles.
      let precedingArticle = false
      let nounBeforeArticle = false
      if (mood === 'Participle') {
        const NOMINAL_POS = new Set(['Noun', 'Pronoun', 'Demonstrative',
          'Personal pronoun', 'Reflexive pronoun', 'Relative pronoun'])
        // Postpositive particles that commonly intervene between article and head
        const POSTPOSITIVES = new Set([
          'δέ', 'δὲ', 'δ᾽', 'δ᾿', 'γάρ', 'γὰρ', 'οὖν', 'δή', 'δὴ',
          'μέν', 'μὲν', 'τε', 'γε', 'ἄρα', 'ἄν',
        ])
        const p0 = prevWords[0]
        const isPostpositive = !!p0 && POSTPOSITIVES.has(p0.lexeme?.lexeme ?? p0.surface ?? '')
        const artIdx = isPostpositive ? 1 : 0   // skip one postpositive if present
        if (prevWords[artIdx]?.parses?.[0]?.partOfSpeech === 'Article') {
          precedingArticle = true
          nounBeforeArticle = NOMINAL_POS.has(prevWords[artIdx + 1]?.parses?.[0]?.partOfSpeech ?? '')
        }
      }

      // 8. Coordination detection: if a coordinating conjunction with a clause role (pr)
      // appears within the 4 preceding words, this nominal is a compound element
      // (compound subject, compound object, etc.) rather than an appositive.
      let nearbyConjunctionRole: string | undefined
      for (const pw of prevWords.slice(0, 5)) {
        const pws = data[pw.id]
        if (pw.parses?.[0]?.partOfSpeech === 'Conjunction' && pws?.pr) {
          nearbyConjunctionRole = pws.pr
          break
        }
      }

      // 9. Enclosing head case/pos/lexeme: for genitive nouns nested inside an NP, properties
      // of the head noun they modify. Case distinguishes Genitive of Apposition from Descriptive.
      // POS and lexeme enable Partitive Genitive detection (numerals, quantifiers, pronouns).
      let enclosingHeadCase: string | undefined
      let enclosingHeadPos: string | undefined
      let enclosingHeadLexeme: string | undefined
      if (kase === 'Genitive' && syn?.h === true && syn?.gc === 'np') {
        let headWord: VerseWord | undefined
        if (prevWords[0]?.parses?.[0]?.partOfSpeech === 'Article') {
          // Articular: article immediately precedes, head noun is one step further back
          headWord = prevWords[1]
        } else {
          // Anarthrous: scan backward for the nearest word with h:true in the syntax
          // data. This skips intervening modifiers (e.g. ἡμῶν in κυρίου ἡμῶν Ἰησοῦ)
          // and finds the actual head noun that this genitive NP is attached to.
          headWord = prevWords.find(w => data[w.id]?.h === true) ?? prevWords[0]
        }
        if (headWord) {
          enclosingHeadCase   = headWord.parses?.[0]?.casus          ?? undefined
          enclosingHeadPos    = headWord.parses?.[0]?.partOfSpeech    ?? undefined
          enclosingHeadLexeme = headWord.lexeme?.lexeme               ?? undefined
        }
      }

      // 10. Apposition guard: the word before the preceding article must be a nominal syntax head.
      // When an article is at prevWords[0], prevWords[1] is the potential head noun.
      // If δέ or another particle intervenes (no article at prevWords[0]), prevHeadNounExists=false,
      // preventing false apposition for constructions like ἡ δὲ τροφή (Matt 3:4).
      // Must be a nominal POS — verbs are clause heads (h:true) but are not apposition targets.
      const NOMINAL_POS_SET = new Set(['Noun', 'Adjective', 'Demonstrative', 'Personal Pronoun',
        'Reflexive Pronoun', 'Reciprocal Pronoun', 'Relative Pronoun', 'Indefinite Pronoun',
        'Interrogative Pronoun', 'Pronoun'])
      let prevHeadNounExists = false
      if (prevWords[0]?.parses?.[0]?.partOfSpeech === 'Article') {
        const pw1 = prevWords[1]
        const pw1Pos = pw1?.parses?.[0]?.partOfSpeech ?? ''
        prevHeadNounExists = NOMINAL_POS_SET.has(pw1Pos) && (data[pw1?.id ?? '']?.h === true)
      }

      // 11. Attendant circumstance: find the nearest main clause verb to detect
      // aorist participle + aorist verb pattern (GGBB pp. 640–645).
      let mainVerbTense: string | null = null
      if (mood === 'Participle' && kase === 'Nominative') {
        const myPos = word.position
        let closestDist = Infinity
        for (const w of words) {
          if (w.id === word.id) continue
          const ws = data[w.id]
          if (ws?.r === 'v' && ws?.c === 'cl') {
            const dist = Math.abs(w.position - myPos)
            if (dist < closestDist) {
              closestDist = dist
              mainVerbTense = w.parses?.[0]?.tense ?? null
            }
          }
        }
      }

      // 12. Colwell's Rule: for nominative nouns with a nearby equative verb, whether this
      // word is immediately preceded by an article determines subject (articular) vs predicate
      // (anarthrous). Skip a postpositive particle (δέ, γάρ, etc.) when checking.
      const isArticular = (() => {
        if (kase !== 'Nominative') return false
        const POSTPOSITIVES_ART = new Set([
          'δέ', 'δὲ', 'δ᾽', 'δ᾿', 'γάρ', 'γὰρ', 'οὖν', 'δή', 'δὴ',
          'μέν', 'μὲν', 'τε', 'γε', 'ἄρα', 'ἄν',
        ])
        const p0 = prevWords[0]
        const skip = p0 && POSTPOSITIVES_ART.has(p0.lexeme?.lexeme ?? p0.surface ?? '') ? 1 : 0
        return prevWords[skip]?.parses?.[0]?.partOfSpeech === 'Article'
      })()

      // 13. Modal verb detection: for infinitives with role='o', check whether a
      // modal/auxiliary verb governs it (→ Complementary Infinitive rather than
      // Substantival Infinitive (Object)).
      const MODAL_VERBS = new Set([
        'δύναμαι', 'θέλω', 'ἐθέλω', 'βούλομαι', 'μέλλω', 'ἄρχομαι', 'ὀφείλω',
        'δεῖ', 'ἔξεστιν', 'ζητέω', 'ἐπιτρέπω', 'ἀφίημι', 'πειράομαι',
        'ἐπιχειρέω', 'τολμάω', 'δύνομαι',
      ])
      let nearbyModalVerb = false
      if (mood === 'Infinitive') {
        const NEGS = new Set(['μή', 'οὐ', 'οὐκ', 'οὐχ'])
        for (const pw of prevWords.slice(0, 4)) {
          const pwLex = pw.lexeme?.lexeme ?? pw.surface
          if (MODAL_VERBS.has(pwLex)) { nearbyModalVerb = true; break }
          if (NEGS.has(pwLex)) continue  // skip negations
          if (pw.parses?.[0]?.partOfSpeech === 'Verb') break  // non-modal verb — stop
        }
      }

      const maculaRole        = maculaEntry?.role        ?? null
      const maculaPhraseClass = maculaEntry?.phraseClass ?? null
      const maculaClauseRule  = maculaEntry?.clauseRule  ?? null
      const maculaClauseRole  = maculaEntry?.clauseRole  ?? null

      const ctx: SyntaxContext = { governingPrep, precedingConj, emphNeg, hasPrecedingMh, nearbyLinkingVerb, clauseHasO2, hasGenitiveAbsSubject, precedingArticle, nounBeforeArticle, enclosingHeadCase, enclosingHeadPos, enclosingHeadLexeme, nearbyConjunctionRole, prevHeadNounExists, isArticular, maculaRole, maculaPhraseClass, maculaClauseRule, maculaClauseRole, mainVerbTense, nearbyModalVerb }

      const menuW = 380, menuH = 520
      const nx = x + menuW > window.innerWidth  ? x - menuW : x
      const ny = y + menuH > window.innerHeight ? y - menuH : y

      // Highlight controls for this word (signed-in readers) — highlights its char range.
      const [wb, wc, wv] = (word.verseId ?? '').split('.')
      const hi = highlightsRef.current
      const existing = wb ? hi.forVerse(wb, Number(wc), Number(wv)).find(h => start < h.endOffset && end > h.startOffset) : undefined
      const highlight: WordHighlight | undefined = isAuthenticated && wb ? {
        activeColor: existing?.color ?? null,
        onPick: c => existing ? void hi.recolor(existing.id, wb, Number(wc), c) : void hi.create(wb, Number(wc), Number(wv), start, end, c),
        onRemove: () => { if (existing) void hi.remove(existing.id, wb, Number(wc)) },
      } : undefined

      setSyntaxMenu({ word, syntax: syn, gbiEntry, absEntry, ctx, x: Math.max(8, nx), y: Math.max(8, ny), highlight })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // ── Render helpers ─────────────────────────────────────────────────────────────

  function renderVerseRow(v: BiblicalVerse) {
    // Which Greek word (if any) is highlighted because the user is hovering an English BSB token
    const bsbHighlightPos = bsbHighlightWordId?.startsWith(v.id + '.')
      ? parseInt(bsbHighlightWordId.split('.').pop() ?? '0', 10)
      : null

    const greek = (
      <GreekVerse
        key={v.id}
        verse={v}
        activeWordId={activeWordId}
        bsbHighlightPos={bsbHighlightPos}
        highlighted={v.id === highlightedVerse}
        searchWord={wordSearchTerm ?? undefined}
        searchLemma={searchLemma ?? undefined}
        textHighlights={highlights.forVerse(v.bookId, v.chapter, v.verse)}
        onWordHover={handleWordHover}
        onWordClick={handleWordClick}
        onWordRightClick={handleWordRightClick}
        verseRefCallback={greekVerseRef(v.id)}
      />
    )

    // Signed-in readers get a per-verse note icon to the left of the Greek.
    const withNote = isAuthenticated ? (
      <div className="flex items-start gap-1">
        <span className="pt-1 print:hidden">
          <VerseNoteButton book={v.bookId} chapter={v.chapter} verse={v.verse}
            noted={notedKeys.has(`${v.bookId}.${v.chapter}.${v.verse}`)} onChanged={refreshReaderNotes} />
        </span>
        <div className="min-w-0 flex-1">{greek}</div>
      </div>
    ) : greek

    if (!parallelLang) return withNote

    // ── BSB: use alignment data ───────────────────────────────────────────────
    if (parallelLang === 'bsb') {
      const alignVerse = bsbAlignment?.[v.id]

      // Compute which BSB token indices to highlight (from hovered Greek word)
      const highlightIdxs = new Set<number>()
      if (activeWordId?.startsWith(v.id + '.')) {
        const pos = parseInt(activeWordId.split('.').pop() ?? '0', 10)
        const idxs = alignVerse?.g2t[pos]
        if (idxs) idxs.forEach(i => highlightIdxs.add(i))
      }

      const englishCol = !alignVerse ? (
        <p className="leading-relaxed text-gray-400 italic text-xs pt-0.5">Loading…</p>
      ) : (
        <p className="reader-inline-trans leading-relaxed text-gray-700 pt-0.5" style={{ fontSize: 'var(--greek-fs, 1.125rem)' }}>
          <sup className="text-xs text-gray-400 mr-1">{v.verse}</sup>
          {(() => {
            const bsbHl = highlights.forVerse(v.bookId, v.chapter, v.verse)
            let off = 0
            return alignVerse.text.split(' ').map((tok, i) => {
              const start = off; const end = off + tok.length; off = end + 1
              const gkPos = alignVerse.t2g[i]
              // Red when the Greek word above is hovered, OR this token matches the arrival term.
              const isHlit = highlightIdxs.has(i) ||
                (arrivalTerms.length > 0 && arrivalTerms.some(t => normalizeFold(tok).includes(t)))
              const mark = highlightAt(start, end, bsbHl)
              return (
                <span
                  key={i}
                  style={isHlit ? { color: 'rgb(220 38 38)', fontWeight: 500 } : undefined}
                  className={mark ? highlightMarkClass(mark.color) : undefined}
                  onMouseEnter={() => {
                    if (gkPos != null) setBsbHighlightWordId(`${v.id}.${gkPos}`)
                  }}
                  onMouseLeave={() => setBsbHighlightWordId(null)}
                  onContextMenu={e => {
                    e.preventDefault()
                    openWordSearch({
                      x: e.clientX, y: e.clientY,
                      surface: tok.replace(/^[.,;:!?"“”‘’'()[\]…—–-]+|[.,;:!?"“”‘’'()[\]…—–-]+$/g, ''),
                      reference: `${v.bookId} ${v.chapter}:${v.verse}`, kind: 'translation', transLang: parallelLang, book: v.bookId,
                      highlight: isAuthenticated ? {
                        activeColor: mark?.color ?? null,
                        onPick: c => mark ? void highlights.recolor(mark.id, v.bookId, v.chapter, c) : void highlights.create(v.bookId, v.chapter, v.verse, start, end, c),
                        onRemove: () => { if (mark) void highlights.remove(mark.id, v.bookId, v.chapter) },
                      } : undefined,
                    })
                  }}
                >
                  {tok}{' '}
                </span>
              )
            })
          })()}
        </p>
      )

      // Mobile: Greek verse then its translation stacked (grid-cols-1); desktop: two
      // columns side by side. On mobile the translation gets a small indent + left accent
      // so it reads as the rendering of the Greek verse above it.
      return (
        <div key={v.id} className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 mb-2 lg:mb-1">
          <div>{withNote}</div>
          <div className="mt-0.5 border-l-2 border-gray-200 pl-3 lg:mt-0 lg:border-0 lg:pl-0">{englishCol}</div>
        </div>
      )
    }

    // ── Other translations: plain verse string ─────────────────────────────────
    const transTxt = transByLang[parallelLang]?.[v.id]
    return (
      <div key={v.id} className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 mb-2 lg:mb-1">
        <div>{withNote}</div>
        <p className="reader-inline-trans leading-relaxed text-gray-700 pt-0.5 mt-0.5 border-l-2 border-gray-200 pl-3 lg:mt-0 lg:border-0 lg:pl-0" style={{ fontSize: 'var(--greek-fs, 1.125rem)' }}>
          {transTxt === undefined
            ? <span className="text-gray-300 italic text-xs">Loading…</span>
            : transTxt
              ? <><sup className="text-xs text-gray-400 mr-1">{v.verse}</sup>{arrivalTerms.length ? markTerms(transTxt, arrivalTerms, 'bg-red-100 text-red-700 font-semibold rounded-sm') : <TransWords text={transTxt} lang={parallelLang} reference={`${v.bookId} ${v.chapter}:${v.verse}`} book={v.bookId} hl={isAuthenticated ? { isAuthenticated, verseHighlights: highlights.forVerse(v.bookId, v.chapter, v.verse), create: (s, e, c) => void highlights.create(v.bookId, v.chapter, v.verse, s, e, c), recolor: (id, c) => void highlights.recolor(id, v.bookId, v.chapter, c), remove: id => void highlights.remove(id, v.bookId, v.chapter) } : undefined} />}</>
              : null}
        </p>
      </div>
    )
  }

  function renderSections(sections: TextSection[]) {
    let lastBook = ''
    return sections.map(sec => {
      const bookChanged = sec.bookName !== lastBook
      lastBook = sec.bookName
      const chapter = sec.verses[0]?.chapter ?? null
      return (
        <div key={sec.key}>
          {bookChanged && (
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-5 mb-1 pb-1 border-b border-gray-100">
              {sec.bookName}
            </h3>
          )}
          {chapter !== null && (
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-1 select-none">
              Chapter {chapter}
            </h4>
          )}
          {sec.verses.map(v => renderVerseRow(v))}
        </div>
      )
    })
  }

  // One translation search hit: reference + verse text (query highlighted), tap to jump.
  function renderTranslationResult(r: { id: string; text: string }) {
    const [osis, ch, vs] = r.id.split('.')
    const bookName = allBooks.find(b => b.osisId === osis)?.name ?? osis
    const term = translationSearchTerm
    const lower = r.text.toLowerCase()
    const at = term ? lower.indexOf(term.toLowerCase()) : -1
    const body = at === -1
      ? r.text
      : <>{r.text.slice(0, at)}<mark className="bg-yellow-200 rounded px-0.5">{r.text.slice(at, at + term.length)}</mark>{r.text.slice(at + term.length)}</>
    return (
      <button
        key={r.id}
        onClick={() => handleSearch(`${osis} ${ch}:${vs}`, 'reference', { keepResults: true })}
        className="w-full text-left rounded-none border border-gray-100 hover:bg-brand-50 p-3 transition-colors group"
      >
        <span className="block text-xs font-semibold text-brand-700 mb-0.5 underline decoration-brand-300 underline-offset-2 group-hover:decoration-brand-600">{bookName} {ch}:{vs} →</span>
        <span className="block text-sm text-gray-700 leading-relaxed">{body}</span>
      </button>
    )
  }

  // ── Layout ──────────────────────────────────────────────────────────────────────

  const parallelLangInfo = PARALLEL_LANGS.find(l => l.code === parallelLang)

  return (
    <div className="flex flex-col h-full gap-2">

      {/* ── Search + settings row ── */}
      {/* On mobile this row hides while scrolling down and returns on scroll up;
          desktop pins it with `lg:flex`. */}
      <div className={`flex-none items-center gap-2 lg:flex ${showTopBar ? 'flex' : 'hidden'}`}>
        <div className="flex-1 min-w-0">
          <SearchBar
            onSearch={handleSearch}
            onVerseClick={c => { setCorpus(c); setPickerCorpus(c); setPickerOpen(true) }}
            viewCorpus={corpus}
            viewLang={parallelLang}
            viewLangLabel={parallelLangInfo?.label}
          />
        </div>
        {/* Desktop corpus toggle: NT | LXX. Switches which testament the pane shows so a jump
            lands in a short single-corpus scroll (like mobile). Desktop navigates by typing a
            reference, so — unlike the mobile NT/LXX buttons — this doesn't open the passage
            picker; it only switches the view. */}
        <div className="hidden lg:flex shrink-0 self-stretch rounded-lg overflow-hidden border border-gray-300">
          {(['GNT', 'LXX'] as const).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCorpus(c)}
              title={c === 'GNT' ? 'Show the New Testament' : 'Show the Septuagint'}
              className={`px-2.5 text-sm font-medium ${
                corpus === c ? 'bg-brand-600 text-white' : 'bg-surface text-brand-700 hover:bg-brand-50'
              } ${c === 'LXX' ? 'border-l border-gray-300' : ''}`}
            >
              {c === 'GNT' ? 'NT' : 'LXX'}
            </button>
          ))}
        </div>
        {/* Parallel translation selector — shows a translation column beside the Greek.
            Desktop only: on mobile the bottom dot-switcher already cycles translations. */}
        <select
          value={parallelLang ?? ''}
          onChange={e => switchView(e.target.value || null)}
          title="Show a parallel translation column"
          className="hidden lg:block shrink-0 self-stretch rounded-lg border border-gray-300 px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400 max-w-[10rem]"
        >
          <option value="">Greek only</option>
          {PARALLEL_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <div ref={settingsRef} className="relative shrink-0">
          <button
            title="Menu"
            aria-label="Menu"
            onClick={() => setShowSettings(v => !v)}
            className={`p-1.5 rounded-none transition-colors ${showSettings ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {/* Hamburger on mobile (it holds all navigation there); ⋮ on desktop (settings only). */}
            <Menu size={20} className="lg:hidden" />
            <MoreVertical size={20} className="hidden lg:block" />
          </button>

          {showSettings && (
            // Mobile scrolls (nav links make it tall); desktop must NOT clip overflow, or the
            // left-popping flyouts get hidden — overflow-y-auto forces overflow-x to auto too.
            <div className="absolute right-0 top-full mt-1 z-50 w-72 max-h-[calc(100svh-5rem)] overflow-y-auto lg:overflow-visible bg-popover border border-gray-200 rounded-xl p-4 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  <span className="lg:hidden">Menu</span><span className="hidden lg:inline">Settings</span>
                </span>
                <button onClick={() => { setShowSettings(false); setSettingsFlyout(null) }} className="text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              </div>

              {/* ── Mobile-only: full navigation + account ──
                  The global header is hidden on phones, so it lives here. On desktop
                  the header provides navigation, so this whole block is hidden. */}
              <div className="lg:hidden -mt-2 space-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 pt-1">Go to</p>
                {readerNav.filter(i => !i.authOnly || menuAuthed).map(({ href, label, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setShowSettings(false)}
                    className="flex items-center gap-2.5 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Icon size={16} className="text-gray-400 shrink-0" /> {label}
                  </Link>
                ))}
                <hr className="!my-2 border-gray-100" />
                {menuAuthed ? (
                  <>
                    <Link href="/settings" onClick={() => setShowSettings(false)} className="flex items-center gap-2.5 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                      <Settings size={16} className="text-gray-400 shrink-0" /> Settings
                    </Link>
                    <button onClick={handleReaderSignOut} className="flex w-full items-center gap-2.5 py-1.5 rounded-none text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={16} className="shrink-0" /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/sign-in" onClick={() => setShowSettings(false)} className="flex items-center gap-2.5 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                      <LogIn size={16} className="text-gray-400 shrink-0" /> Sign in
                    </Link>
                    <Link href="/auth/sign-up" onClick={() => setShowSettings(false)} className="flex items-center gap-2.5 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                      <UserPlus size={16} className="text-gray-400 shrink-0" /> Sign up
                    </Link>
                  </>
                )}
                <hr className="!my-2 border-gray-100" />
              </div>

              {/* Text Size */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Text Size</p>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 select-none leading-none" style={{ fontFamily: 'Gentium Plus, Georgia, serif', fontSize: '0.8rem' }}>A</span>
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={1}
                    value={(['sm','md','lg','xl'] as FontSize[]).indexOf(fontSize)}
                    onChange={e => setFontSize((['sm','md','lg','xl'] as FontSize[])[e.target.valueAsNumber])}
                    className="flex-1 accent-brand-600 cursor-pointer"
                  />
                  <span className="text-gray-400 select-none leading-none" style={{ fontFamily: 'Gentium Plus, Georgia, serif', fontSize: '1.35rem' }}>A</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                  <span>Small</span><span>Med</span><span>Large</span><span>X-Lg</span>
                </div>
              </div>

              {/* Contents flyout trigger */}
              <div className="relative" onMouseLeave={scheduleFlyoutClose} onMouseEnter={cancelFlyoutClose}>
                <button
                  onClick={() => toggleFlyout('contents')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-none transition-colors ${settingsFlyout === 'contents' ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Contents
                    {gntEdition !== 'tischendorf' && <span className="ml-1.5 normal-case font-normal text-brand-600">(Nestle 1904)</span>}
                  </p>
                  <ChevronRight size={14} className={`transition-transform ${settingsFlyout === 'contents' ? 'text-brand-500 -rotate-90' : 'text-gray-400'}`} />
                </button>
                {settingsFlyout === 'contents' && (
                  <div
                    onMouseEnter={cancelFlyoutClose}
                    className="z-[51] w-full mt-2 lg:mt-0 lg:absolute lg:right-full lg:top-0 lg:mr-2 lg:w-[400px] max-h-[75vh] overflow-y-auto bg-popover border border-gray-200 rounded-xl p-5 shadow-lg"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">GNT Edition</p>
                    <div className="space-y-2">
                      {([
                        { label: 'Tischendorf 8th', value: 'tischendorf' as const },
                        { label: 'Nestle 1904',     value: 'nestle1904'  as const },
                      ]).map(({ label, value }) => (
                        <button
                          key={value}
                          onClick={() => setGntEdition(value)}
                          className={`w-full text-left px-4 py-2.5 rounded-none text-base transition-colors ${
                            gntEdition === value
                              ? 'bg-brand-50 text-brand-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Jump to any book — New Testament or Old Testament (Septuagint). */}
                    {([
                      { label: 'New Testament', books: Array.from(new Map(gntQueue.map(q => [q.osisId, q.bookName])).entries()) },
                      { label: 'Old Testament (Septuagint)', books: Array.from(new Map(lxxQueue.map(q => [q.osisId, q.bookName])).entries()) },
                    ] as const).map(group => group.books.length > 0 && (
                      <div key={group.label} className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">{group.label}</p>
                        <div className="flex flex-wrap gap-1">
                          {group.books.map(([osisId, name]) => (
                            <button
                              key={osisId}
                              onClick={() => { handleSearch(`${name} 1`, 'reference'); setShowSettings(false); setSettingsFlyout(null) }}
                              className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Syntax flyout trigger */}
              <div className="relative" onMouseLeave={scheduleFlyoutClose} onMouseEnter={cancelFlyoutClose}>
                <button
                  onClick={() => toggleFlyout('syntax')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-none transition-colors ${settingsFlyout === 'syntax' ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'}`}
                >
                  {/* On mobile the menu also lists a "Syntax" nav item (the Exegesis tab),
                      so disambiguate this settings flyout there; desktop keeps "Syntax". */}
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    <span className="lg:hidden">Syntax sources</span><span className="hidden lg:inline">Syntax</span>
                  </p>
                  <ChevronRight size={14} className={`transition-transform ${settingsFlyout === 'syntax' ? 'text-brand-500 -rotate-90' : 'text-gray-400'}`} />
                </button>
                {settingsFlyout === 'syntax' && (
                  <div
                    onMouseEnter={cancelFlyoutClose}
                    className="z-[51] w-full mt-2 lg:mt-0 lg:absolute lg:right-full lg:top-0 lg:mr-2 lg:w-[400px] bg-popover border border-gray-200 rounded-xl p-5 shadow-lg"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Syntax Sources</p>
                    <div className="space-y-3">
                      {([
                        { label: 'Wallace',     value: wallaceOn, set: setWallaceOn as React.Dispatch<React.SetStateAction<boolean>> },
                        { label: 'PROIEL',      value: proielOn,  set: setProielOn  as React.Dispatch<React.SetStateAction<boolean>> },
                        { label: 'GBI',         value: gbiOn,     set: setGbiOn     as React.Dispatch<React.SetStateAction<boolean>> },
                        { label: 'ABS Syntax',  value: absOn,     set: setAbsOn     as React.Dispatch<React.SetStateAction<boolean>> },
                      ]).map(({ label, value, set }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-base text-gray-700">{label}</span>
                          <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
                            {([true, false] as const).map(on => (
                              <button
                                key={String(on)}
                                onClick={() => set(on)}
                                className={`px-4 py-1.5 transition-colors ${
                                  value === on
                                    ? 'bg-brand-50 text-brand-700 font-medium'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {on ? 'On' : 'Off'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Controls flyout trigger */}
              <div className="relative" onMouseLeave={scheduleFlyoutClose} onMouseEnter={cancelFlyoutClose}>
                <button
                  onClick={() => toggleFlyout('controls')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-none transition-colors ${settingsFlyout === 'controls' ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide">Controls</p>
                  <ChevronRight size={14} className={`transition-transform ${settingsFlyout === 'controls' ? 'text-brand-500 -rotate-90' : 'text-gray-400'}`} />
                </button>
                {settingsFlyout === 'controls' && (
                  <div onMouseEnter={cancelFlyoutClose} className="z-[51] w-full mt-2 lg:mt-0 lg:absolute lg:right-full lg:top-0 lg:mr-2 lg:w-[400px] bg-popover border border-gray-200 rounded-xl p-5 shadow-lg space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Parsing Panel</p>
                      <ul className="space-y-1.5 text-sm text-gray-500 leading-relaxed">
                        <li><span className="font-medium text-gray-600">Hover</span> over any word to see its lexical entry, parsing, and glosses.</li>
                        <li><span className="font-medium text-gray-600">Press Shift</span> to freeze the panel on the current word.</li>
                        <li><span className="font-medium text-gray-600">Press Shift again</span> to unfreeze and return to hover mode.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Syntax</p>
                      <ul className="space-y-1.5 text-sm text-gray-500 leading-relaxed">
                        <li><span className="font-medium text-gray-600">Right-click</span> any word to open the syntax menu.</li>
                        <li>The menu shows categories from Wallace, PROIEL, GBI, and ABS Syntax.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Search</p>
                      <ul className="space-y-1.5 text-sm text-gray-500 leading-relaxed">
                        <li>Type a <span className="font-medium text-gray-600">Greek word</span> to find every occurrence in the corpus.</li>
                        <li>Type a <span className="font-medium text-gray-600">reference</span> (e.g. Matt 5:3, Rom 8) to jump to a passage.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Translation picker — choose one translation to show inline beneath each
                  Greek verse (or None for Greek only). Available on mobile and desktop. */}
              <div className="relative" onMouseLeave={scheduleFlyoutClose} onMouseEnter={cancelFlyoutClose}>
                <button
                  onClick={() => toggleFlyout('translations')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-none transition-colors ${settingsFlyout === 'translations' ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Translation
                    <span className="ml-1.5 normal-case font-normal text-brand-600">({parallelLang ? parallelLangInfo?.label : 'off'})</span>
                  </p>
                  <ChevronRight size={14} className={`transition-transform ${settingsFlyout === 'translations' ? 'text-brand-500 -rotate-90' : 'text-gray-400'}`} />
                </button>
                {settingsFlyout === 'translations' && (
                  <div
                    onMouseEnter={cancelFlyoutClose}
                    className="z-[51] w-full mt-2 lg:mt-0 lg:absolute lg:right-full lg:top-0 lg:mr-2 lg:w-[400px] max-h-[60vh] lg:max-h-60 overflow-y-auto bg-popover border border-gray-200 rounded-xl p-4 shadow-lg space-y-1"
                  >
                    <p className="lg:hidden text-xs text-gray-400 px-1 pb-1">Shown inline beneath each Greek verse.</p>
                    <button
                      onClick={() => switchView(null)}
                      className={`w-full text-left px-4 py-2.5 rounded-none text-base transition-colors ${
                        parallelLang === null ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      None
                    </button>
                    {PARALLEL_LANGS.map(l => (
                      <button
                        key={l.code}
                        onClick={() => switchView(l.code)}
                        className={`w-full text-left px-4 py-2.5 rounded-none transition-colors ${
                          parallelLang === l.code ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">{l.label}</span>
                        <span className="block text-sm text-gray-400">{l.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Attribution */}
              <div className="border-t border-gray-100 pt-3 space-y-1">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Greek text: <span className="font-medium text-gray-500">SBL Greek New Testament</span> (SBLGNT) &copy; 2010 Society of Biblical Literature and Logos Bible Software.
                </p>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Syntax: <span className="font-medium text-gray-500">Lowfat SBLGNT</span> treebank (Wallace &amp; PROIEL) &middot; <span className="font-medium text-gray-500">Macula-Greek SBLGNT</span> (GBI) &copy; Clear Bible, CC BY 4.0 &middot; <span className="font-medium text-gray-500">ABS NT Syntax Database</span> &copy; Asian Bible Society.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Translation-search result bar (mobile; Greek/word results float — see below) ── */}
      {translationResults !== null && (
        <div className="flex-none flex items-center justify-between gap-2">
          {viewingResultPassage ? (
            <button
              className="text-sm font-medium text-brand-600 hover:underline truncate"
              onClick={() => setViewingResultPassage(false)}
            >
              ← Back to {translationResults.length} result{translationResults.length !== 1 ? 's' : ''}
            </button>
          ) : (
            <p className="text-sm text-gray-600 truncate">
              {searchLoading
                ? 'Searching…'
                : `${translationResults.length} result${translationResults.length !== 1 ? 's' : ''} in ${PARALLEL_LANGS.find(l => l.code === translationSearchLang)?.label ?? 'translation'}`}
            </p>
          )}
          <button className="text-sm text-brand-600 hover:underline shrink-0" onClick={exitSearch}>← Exit search</button>
        </div>
      )}

      {/* ── Text panel ── */}
      {/* Words handle their own right-click (Full-Greek syntax menu / translation menu); this
          container-level guard suppresses the native OS menu on the gaps between words. No form
          fields live in the scroll area, so preventing default is safe. */}
      <div
        ref={textPanelRef}
        onContextMenu={e => e.preventDefault()}
        style={{ '--greek-fs': FONT_SIZE_MAP[fontSize] } as React.CSSProperties}
        className="flex-1 min-h-0 overflow-y-auto bg-surface rounded-xl border border-gray-100 shadow-sm p-5"
      >
        {translationResults !== null && !viewingResultPassage ? (
          searchLoading
            ? <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading…</div>
            : translationResults.length === 0
              ? <p className="text-gray-400 text-sm italic">No results found.</p>
              : <div className="space-y-2">{translationResults.map(r => renderTranslationResult(r))}</div>
        ) : (
          <div>
            {/* One corpus at a time on every screen size. The inactive corpus is display:none,
                and the infinite-scroll effect skips its (zero-rect) sentinels so it isn't
                background-loaded. */}
            <div className={corpus === 'GNT' ? '' : 'hidden'}>
              {!gnt.backDone && <div ref={gntTopSentinel} className="h-1" aria-hidden />}
              {renderSections(gnt.sections)}
              {!gnt.done && <div ref={gntSentinel} className="h-1" aria-hidden />}
            </div>

            <div className={corpus === 'LXX' ? '' : 'hidden'}>
              {!lxx.backDone && <div ref={lxxTopSentinel} className="h-1" aria-hidden />}
              {renderSections(lxx.sections)}
              {!lxx.done && <div ref={lxxSentinel} className="h-1" aria-hidden />}
            </div>
          </div>
        )}
      </div>

      {/* ── Floating, draggable word/lemma search results ── */}
      {searchResults !== null && typeof document !== 'undefined' && createPortal(
        <div
          data-results-panel
          className="fixed z-[70] w-[min(94vw,520px)] max-h-[82vh] flex flex-col rounded-xl bg-popover shadow-2xl border border-gray-200"
          style={{ left: resultsPos?.x ?? 0, top: resultsPos?.y ?? 0, visibility: resultsPos ? 'visible' : 'hidden' }}
        >
          <div
            className="flex-none flex items-center gap-2 px-3 py-2 border-b border-gray-200 rounded-t-xl bg-gray-50 cursor-move select-none touch-none"
            onPointerDown={startResultsDrag}
          >
            <GripVertical size={14} className="text-gray-300 shrink-0" />
            <p className="flex-1 min-w-0 text-sm truncate">
              {searchLabel && <span className="font-medium text-gray-700">{searchLabel}</span>}
              <span className="text-gray-400"> · {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
            </p>
            <select
              value={parallelLang ?? ''}
              onChange={e => setParallelLang(e.target.value || null)}
              onPointerDown={e => e.stopPropagation()}
              title="Show a translation alongside each result"
              className="flex-none rounded border border-gray-300 bg-surface px-1 py-0.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">Greek only</option>
              {PARALLEL_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            {searchResults.length > 0 && (
              <button type="button" onClick={() => setConcordance(c => !c)} onPointerDown={e => e.stopPropagation()}
                className="flex-none text-xs text-brand-600 hover:underline">{concordance ? 'List' : 'KWIC'}</button>
            )}
            <button type="button" onClick={exitSearch} onPointerDown={e => e.stopPropagation()}
              className="flex-none text-gray-400 hover:text-gray-700 p-0.5" aria-label="Close results"><X size={15} /></button>
          </div>
          <div
            style={{ '--greek-fs': FONT_SIZE_MAP[fontSize] } as React.CSSProperties}
            className="flex-1 min-h-0 overflow-y-auto p-3"
          >
            {searchLoading
              ? <div className="flex items-center justify-center h-24 text-gray-400 text-sm">Searching…</div>
              : searchResults.length === 0
                ? <p className="text-gray-400 text-sm italic py-6 text-center">No results found.</p>
                : concordance
                  ? <div>{searchResults.map(v => renderConcordanceRow(v))}</div>
                  : <div>{searchResults.map(v => renderVerseRow(v))}</div>}
          </div>
        </div>,
        document.body,
      )}

      {/* ── Parsing panel ── */}
      {/* Desktop: fixed card below the text. */}
      <div className="hidden lg:block flex-none">
        <ParsingPanel info={parsingInfo} locked={!!lockedInfo} />
      </div>
      {/* Mobile: a larger inline parsing pane. The Greek is always on screen now (with the
          optional translation stacked beneath each verse), so tapping any word shows its
          parsing here regardless of whether a translation is selected. */}
      <div className="lg:hidden flex-none h-56 rounded-xl border border-gray-200 shadow-sm bg-surface flex flex-col overflow-hidden">
        <ParsingPanel info={parsingInfo} locked={!!lockedInfo} variant="sheet" />
      </div>

      {/* ── Mobile passage picker (top-level overlay, independent of the top bar) ── */}
      {pickerOpen && (
        <PassagePicker
          books={allBooks}
          corpus={pickerCorpus}
          onPick={ref => { handleSearch(ref, 'reference'); setPickerOpen(false) }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {/* ── Syntax right-click menu ── */}
      {syntaxMenu && (
        <SyntaxMenu
          word={syntaxMenu.word}
          syntax={syntaxMenu.syntax}
          gbiEntry={syntaxMenu.gbiEntry}
          absEntry={syntaxMenu.absEntry}
          ctx={syntaxMenu.ctx}
          x={syntaxMenu.x}
          y={syntaxMenu.y}
          wallaceOn={wallaceOn}
          proielOn={proielOn}
          gbiOn={gbiOn}
          absOn={absOn}
          onWordAction={handleWordAction}
          highlight={syntaxMenu.highlight}
          onClose={() => setSyntaxMenu(null)}
        />
      )}

      {/* ── "Search by morphology" picker (from the right-click menu) ── */}
      {morphPickerWord && (
        <MorphSearchPicker
          word={morphPickerWord}
          onSearch={runMorphSearch}
          onClose={() => setMorphPickerWord(null)}
        />
      )}

      {/* ── Full lexicon entry (from the right-click menu) ── */}
      {lexiconWord && (
        <LexiconPanel word={lexiconWord} onClose={() => setLexiconWord(null)} />
      )}

      {isAuthenticated && highlightSelection.popup && (
        <HighlightPopup
          state={highlightSelection.popup}
          onPick={color => {
            const state = highlightSelection.popup!
            if (state.kind === 'new') for (const s of state.splits) void highlights.create(s.book, s.chapter, s.verse, s.start, s.end, color)
            else void highlights.recolor(state.id, state.book, state.chapter, color)
            highlightSelection.close()
          }}
          onRemove={() => {
            const state = highlightSelection.popup!
            if (state.kind === 'edit') void highlights.remove(state.id, state.book, state.chapter)
            highlightSelection.close()
          }}
          onClose={highlightSelection.close}
        />
      )}
    </div>
  )
}
