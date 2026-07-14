'use client'
import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { TEXT_CATEGORIES, findLxxWork, findJosephusWork, type CatalogWork } from '@/lib/texts-catalog'
import { findProseWork } from '@/lib/prose-texts'
import type { PhraseFontSize } from '@/components/phrase/PhraseExplorer'
import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'
import { openBackgroundsSearch } from '@/lib/backgrounds-search-bus'
import { openWordSearch } from '@/lib/word-search-bus'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { useHighlights } from '@/components/highlights/useHighlights'
import { useHighlightSelection } from '@/components/highlights/useHighlightSelection'
import { HighlightPopup } from '@/components/highlights/HighlightPopup'
import { verseAnchorProps, withTokenOffsets, highlightAt, renderHighlightedPlainText } from '@/components/highlights/render'
import { highlightMarkClass } from '@/lib/highlight-colors'

// A clickable Greek word carries what the shared parsing pane needs.
type WordToken = { surface: string; parsing: string; lemma: string; gloss?: string; strongs?: string }
const MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
function formatMorph(m: Record<string, string | null> | undefined): string {
  if (!m) return ''
  return MORPH_ORDER.map(k => m[k]).filter(Boolean).join(', ')
}
function toLexicalInfo(tok: WordToken, ref: string): LexicalInfoPanel {
  return { surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '', partOfSpeech: '', parsing: tok.parsing, strongs: tok.strongs, reference: ref }
}

// One rendered line of text: a verse (lxx / 2esdras) or a section (Josephus).
type Row = { num: number; tokens?: WordToken[]; greek?: string; english?: string }

// A single chapter (or, for Josephus, book+chapter) worth of loaded rows.
type QueueItem = { book?: number; chapter: number }
type ChapterBlock = { key: string; book?: number; chapter: number; rows: Row[] }
// One continuous-scroll "series": all the chapters of the open work, loaded lazily
// forward and backward from wherever the reader jumped in, mirroring the Reader
// page's infinite-scroll (src/components/reader/GreekReader.tsx: loadMore/loadPrev).
type Series = { sections: ChapterBlock[]; queueIdx: number; backIdx: number; done: boolean; backDone: boolean }
const EMPTY_SERIES: Series = { sections: [], queueIdx: 0, backIdx: -1, done: true, backDone: true }

// Short, readable note-anchor prefixes for Josephus works (book string = "Ant.18" etc.).
const JOS_SHORT: Record<string, string> = { antiquities: 'Ant', 'jewish-war': 'JW', 'against-apion': 'AgAp', life: 'Life' }

// Display names for the parallel translations a Greek work can show alongside it.
const TRANSLATION_LABELS: Record<string, string> = { brenton: 'Brenton (1851)', bsb: 'Berean Standard Bible' }
// The parallel translations available for a work. Only Greek (LXX) works carry one, and
// each currently provides a single option; returning a list keeps the menu ready for more.
function translationsFor(w: CatalogWork | null): { id: string; label: string }[] {
  if (!w || w.source !== 'lxx' || !w.english) return []
  return [{ id: w.english, label: TRANSLATION_LABELS[w.english] ?? w.english }]
}

const FONT_SIZE_MAP: Record<PhraseFontSize, string> = { sm: '1.05rem', md: '1.25rem', lg: '1.45rem', xl: '1.7rem' }
const LOOKAHEAD = 1600   // px ahead of the sentinel to start loading the next/previous chapter

// Fixed pixel heights for the Book/Chapter/Verse locator rows and column headers. The
// cascading columns align by offsetting each column's top by (selectedIndex × row height),
// so every option row must be exactly this tall for the arithmetic to line up.
const LOCATE_ROW_H = 26
const LOCATE_HEADER_H = 22

// Highlight every case-insensitive match of `q` inside `text`, in red — used both for the
// in-text search box and for a term carried in from a background search.
const SEARCH_RED = 'bg-red-100 text-red-700 font-semibold rounded-sm'
function highlight(text: string, q: string, cls: string = SEARCH_RED): ReactNode {
  if (!q.trim()) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className={cls}>{text.slice(idx, idx + q.length)}</mark>
      {highlight(text.slice(idx + q.length), q, cls)}
    </>
  )
}

// Every chapter of a work, in reading order — for Josephus that spans all its books.
function buildQueue(w: CatalogWork): QueueItem[] {
  if (w.source === 'josephus') {
    const out: QueueItem[] = []
    w.books!.forEach((count, bi) => { for (let c = 1; c <= count; c++) out.push({ book: bi + 1, chapter: c }) })
    return out
  }
  return Array.from({ length: w.chapters ?? 1 }, (_, i) => ({ chapter: i + 1 }))
}
function sameItem(a: QueueItem, book: number | undefined, chapter: number) {
  return a.chapter === chapter && (a.book ?? null) === (book ?? null)
}
function noteBookFor(w: CatalogWork, item: QueueItem): string {
  if (w.source === 'lxx') return w.osisId!
  const prose = findProseWork(w.source)
  if (prose) return prose.noteBook
  return `${JOS_SHORT[w.work!] ?? w.work}.${item.book}`
}
function refLabelFor(w: CatalogWork, item: QueueItem): string {
  return w.source === 'josephus' ? `${w.name} ${item.book}.${item.chapter}` : `${w.name} ${item.chapter}`
}

interface TextsReaderProps {
  isAuthenticated?: boolean
  fontSize?: PhraseFontSize
  onFontSize?: (v: PhraseFontSize) => void
  onAttribution?: (a: string) => void
  // Set (with a bumped token) when another tab hands off a reference via "Open in Texts".
  openRequest?: { target: OpenInTextsTarget; token: number } | null
}

export function TextsReader({ isAuthenticated = false, fontSize: controlledFontSize, onFontSize, onAttribution, openRequest }: TextsReaderProps) {
  const isFontSizeControlled = onFontSize !== undefined
  const [internalFontSize, setInternalFontSize] = useState<PhraseFontSize>('lg')
  const fontSize = isFontSizeControlled ? (controlledFontSize ?? 'lg') : internalFontSize

  const [work, setWork] = useState<CatalogWork | null>(null)
  const [openCat, setOpenCat] = useState<string | null>(null)  // which category's dropdown is expanded
  // "Locate a passage" cascade, opened by clicking the work title (like the translation
  // menus). Columns are Book (Josephus multi-book works only) → Chapter → Verse; each new
  // column appears to the right with its first row aligned to the selected row of the one
  // before it. Click-based (not hover) so it doesn't fight the mouse as you reach across.
  const [locateOpen, setLocateOpen] = useState(false)
  const [locateBook, setLocateBook] = useState(1)
  const [locateChapter, setLocateChapter] = useState<number | null>(null)
  const [locateVerseNums, setLocateVerseNums] = useState<number[] | null>(null)
  const fetchTokenRef = useRef(0)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [series, setSeries] = useState<Series>(EMPTY_SERIES)
  const [initialLoading, setInitialLoading] = useState(false)
  // Which parallel translation is shown next to the Greek, or null for Greek-only.
  const [translationId, setTranslationId] = useState<string | null>(null)
  // For Greek (lxx) works with a translation, hide the Greek and read the translation alone.
  const [greekHiddenPref, setGreekHiddenPref] = useState(false)
  const [translationMenuOpen, setTranslationMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  // A word to spotlight in red, carried in when the reader is opened from a background
  // search — highlighted without filtering, and only while the in-text search box is empty.
  const [termHighlight, setTermHighlight] = useState<string | null>(null)

  // Parsing window (Greek only)
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // Per-verse notes, keyed by "<noteBook>.<chapter>" since several chapters (and, for
  // Josephus, several books) can be on screen at once.
  const [notedMap, setNotedMap] = useState<Record<string, Set<number>>>({})

  const brentonCache = useRef<Record<string, Record<string, string>>>({})
  const bsbCache = useRef<Record<string, string> | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const highlights = useHighlights(isAuthenticated)
  const highlightSelection = useHighlightSelection(panelRef)
  const topSentinel = useRef<HTMLDivElement>(null)
  const bottomSentinel = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement>>({})
  const verseRefs = useRef<Record<string, HTMLDivElement>>({})
  const catRowRef = useRef<HTMLDivElement>(null)
  const locateMenuRef = useRef<HTMLDivElement>(null)
  const translationMenuRef = useRef<HTMLDivElement>(null)
  const workRef = useRef(work); useEffect(() => { workRef.current = work }, [work])
  const queueRef = useRef(queue); useEffect(() => { queueRef.current = queue }, [queue])
  const seriesRef = useRef(series); useEffect(() => { seriesRef.current = series }, [series])
  const loadingRef = useRef(false)
  const backLoadingRef = useRef(false)

  const isGreek = work?.source === 'lxx'
  // A prose work that carries the original Greek per verse (e.g. Epictetus) — shown in a
  // parallel Greek | English layout, distinct from the word-parsed lxx Greek path.
  const greekProse = !!work?.greek
  const hasEnglish = work ? (work.source === 'lxx' ? !!work.english : true) : false
  const availableTranslations = translationsFor(work)
  const showEnglish = translationId !== null
  // Greek-hidden only takes effect on an lxx work that actually has a translation showing.
  const greekHidden = greekHiddenPref && isGreek && showEnglish
  const translationLabel = translationId
    ? (availableTranslations.find(t => t.id === translationId)?.label ?? 'Translation')
    : null
  const currentTranslationLabel = !translationId
    ? 'Greek only'
    : greekHidden ? `${translationLabel} only` : `Greek + ${translationLabel}`

  const refreshNotesFor = useCallback(async (noteBook: string, ch: number) => {
    if (!isAuthenticated) return
    try {
      const r = await fetch(`/api/notes?book=${encodeURIComponent(noteBook)}&chapter=${ch}&verseStart=1&verseEnd=500`)
      const d = await r.json()
      setNotedMap(prev => ({ ...prev, [`${noteBook}.${ch}`]: new Set((d.notes ?? []).map((n: { verse: number }) => n.verse)) }))
    } catch { /* ignore */ }
  }, [isAuthenticated])

  // Keep note icons in sync when a note is made/removed on another tab — refresh every
  // currently-loaded chapter of the open work.
  useEffect(() => {
    if (!work) return
    return onNotesChanged(() => seriesRef.current.sections.forEach(s => void refreshNotesFor(noteBookFor(work, s), s.chapter)))
  }, [work, refreshNotesFor])

  // Close the open category's book dropdown on an outside click.
  useEffect(() => {
    if (!openCat) return
    function onMouseDown(e: MouseEvent) {
      if (catRowRef.current && !catRowRef.current.contains(e.target as Node)) setOpenCat(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [openCat])

  // Close the Book/Chapter/Verse locate cascade on an outside click.
  useEffect(() => {
    if (!locateOpen) return
    function onMouseDown(e: MouseEvent) {
      if (locateMenuRef.current && !locateMenuRef.current.contains(e.target as Node)) setLocateOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [locateOpen])

  // Close the translation picker on an outside click.
  useEffect(() => {
    if (!translationMenuOpen) return
    function onMouseDown(e: MouseEvent) {
      if (translationMenuRef.current && !translationMenuRef.current.contains(e.target as Node)) setTranslationMenuOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [translationMenuOpen])

  // Sources & copyright, lifted to the shared tools menu (matches Backgrounds/Synopsis).
  useEffect(() => {
    if (!work) { onAttribution?.(''); return }
    const parts = work.source === 'lxx' ? ['Greek text: Rahlfs’ Septuagint (1935) and Nestle 1904, both public domain.'] : []
    if (work.english === 'brenton') parts.push('English: Brenton’s 1851 English Septuagint (public domain).')
    if (work.english === 'bsb') parts.push('English: the Berean Standard Bible (public domain).')
    const prose = findProseWork(work.source)
    if (prose) parts.push(prose.attribution)
    if (work.source === 'josephus') parts.push('Text: William Whiston’s translation of Josephus, 1737 (public domain).')
    onAttribution?.(parts.join(' '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [work, onAttribution])

  async function loadBrenton(osisId: string): Promise<Record<string, string>> {
    if (brentonCache.current[osisId]) return brentonCache.current[osisId]
    const r = await fetch(`/data/brenton/${osisId}.json`)
    const d = r.ok ? await r.json() : {}
    brentonCache.current[osisId] = d
    return d
  }
  async function loadBsb(): Promise<Record<string, string>> {
    if (bsbCache.current) return bsbCache.current
    const r = await fetch('/data/bsb-alignment.json?v=3')
    const d: Record<string, { text: string }> = r.ok ? await r.json() : {}
    bsbCache.current = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.text]))
    return bsbCache.current
  }

  const fetchChapterRows = useCallback(async (w: CatalogWork, item: QueueItem): Promise<Row[]> => {
    if (w.source === 'lxx') {
      const r = await fetch(`/api/reader?book=${w.osisId}&chapter=${item.chapter}&corpus=NA1904`)
      const d = await r.json()
      type V = { verse: number; text?: string; words?: { surface: string; lexeme?: { lexeme: string; gloss?: string; strongs?: string }; parses?: Record<string, string | null>[] }[] }
      let eng: Record<string, string> = {}
      if (w.english === 'brenton') eng = await loadBrenton(w.osisId!)
      else if (w.english === 'bsb') eng = await loadBsb()
      return (d.verses ?? []).map((v: V) => ({
        num: v.verse,
        tokens: (v.words ?? []).map(word => ({
          surface: word.surface, lemma: word.lexeme?.lexeme ?? '', gloss: word.lexeme?.gloss, strongs: word.lexeme?.strongs,
          parsing: word.parses?.[0] ? formatMorph(word.parses[0]) : '',
        })),
        greek: v.text ?? (v.words ?? []).map(word => word.surface).join(' '),
        english: eng[`${w.osisId}.${item.chapter}.${v.verse}`],
      }))
    }
    if (w.source === 'josephus') {
      const r = await fetch(`/data/josephus/${w.work}/${item.book}.json`)
      const d = r.ok ? await r.json() : null
      const ch = d?.chapters?.find((c: { number: number }) => c.number === item.chapter)
      return (ch?.sections ?? []).map((s: { number: number; text: string }) => ({ num: s.number, english: s.text }))
    }
    // 2 Esdras / 1 Enoch / Jubilees / 2 Baruch / 2 Enoch — plain English prose stored as
    // chapter→verses; the registry knows where each one's JSON lives.
    const r = await fetch(findProseWork(w.source)!.dataUrl)
    const d = r.ok ? await r.json() : null
    const ch = d?.chapters?.find((c: { number: number }) => c.number === item.chapter)
    return (ch?.verses ?? []).map((v: { number: number; text: string; greek?: string }) => ({ num: v.number, english: v.text, greek: v.greek }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function keyFor(item: QueueItem): string {
    return `${item.book ?? ''}.${item.chapter}`
  }
  function blockFor(item: QueueItem, rows: Row[]): ChapterBlock {
    return { key: keyFor(item), book: item.book, chapter: item.chapter, rows }
  }

  // ── Forward (downward) and backward (upward) lazy loading ──
  const loadMore = useCallback(async () => {
    const w = workRef.current, q = queueRef.current, s = seriesRef.current
    if (!w || loadingRef.current || s.done) return
    const item = q[s.queueIdx]
    if (!item) { setSeries(prev => ({ ...prev, done: true })); return }
    loadingRef.current = true
    const rows = await fetchChapterRows(w, item)
    setSeries(prev => ({
      ...prev,
      sections: [...prev.sections, blockFor(item, rows)],
      queueIdx: prev.queueIdx + 1,
      done: prev.queueIdx + 1 >= q.length,
    }))
    void refreshNotesFor(noteBookFor(w, item), item.chapter)
    void highlights.loadFor(noteBookFor(w, item), item.chapter)
    loadingRef.current = false
  }, [fetchChapterRows, refreshNotesFor, highlights.loadFor])

  const loadPrev = useCallback(async () => {
    const w = workRef.current, q = queueRef.current, s = seriesRef.current
    if (!w || backLoadingRef.current || s.backDone || s.backIdx < 0) return
    const item = q[s.backIdx]
    if (!item) { setSeries(prev => ({ ...prev, backDone: true })); return }
    backLoadingRef.current = true
    const panel = panelRef.current
    const prevHeight = panel?.scrollHeight ?? 0
    const prevTop = panel?.scrollTop ?? 0
    const rows = await fetchChapterRows(w, item)
    setSeries(prev => ({
      ...prev,
      sections: [blockFor(item, rows), ...prev.sections],
      backIdx: prev.backIdx - 1,
      backDone: prev.backIdx - 1 < 0,
    }))
    void refreshNotesFor(noteBookFor(w, item), item.chapter)
    void highlights.loadFor(noteBookFor(w, item), item.chapter)
    requestAnimationFrame(() => {
      if (panel) panel.scrollTop = prevTop + (panel.scrollHeight - prevHeight)
      backLoadingRef.current = false
    })
  }, [fetchChapterRows, refreshNotesFor, highlights.loadFor])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    function onScroll() {
      const rect = panel!.getBoundingClientRect()
      if (bottomSentinel.current && !seriesRef.current.done) {
        if (bottomSentinel.current.getBoundingClientRect().top < rect.bottom + LOOKAHEAD) void loadMore()
      }
      if (topSentinel.current && !seriesRef.current.backDone) {
        if (topSentinel.current.getBoundingClientRect().bottom > rect.top - LOOKAHEAD) void loadPrev()
      }
    }
    panel.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => panel.removeEventListener('scroll', onScroll)
  }, [loadMore, loadPrev])

  // Jump to a specific (book, chapter[, verse]) — reseeds the whole scroll series from
  // there, preloading a small window on both sides (mirroring the Reader page's
  // reference jump) so scrolling in either direction works immediately, then scrolls to
  // the target chapter (or, if given, that exact verse) rather than just the panel top.
  const openAt = useCallback(async (w: CatalogWork, book: number | undefined, ch: number, verse?: number) => {
    const q = buildQueue(w)
    const idx = Math.max(0, q.findIndex(it => sameItem(it, book, ch)))
    const preloadStart = Math.max(0, idx - 2)
    const preloadEnd = Math.min(q.length - 1, idx + 1)
    const idxs = Array.from({ length: preloadEnd - preloadStart + 1 }, (_, i) => preloadStart + i)

    setQueue(q)
    setSelectedInfo(null); setSelectedKey(null); setSearch('')
    setSeries(EMPTY_SERIES)
    setInitialLoading(true)
    sectionRefs.current = {}
    verseRefs.current = {}

    const fetched = await Promise.all(idxs.map(i => fetchChapterRows(w, q[i])))
    const sections = idxs.map((i, n) => blockFor(q[i], fetched[n]))
    setSeries({
      sections,
      queueIdx: preloadEnd + 1, backIdx: preloadStart - 1,
      done: preloadEnd + 1 >= q.length, backDone: preloadStart - 1 < 0,
    })
    idxs.forEach(i => { void refreshNotesFor(noteBookFor(w, q[i]), q[i].chapter); void highlights.loadFor(noteBookFor(w, q[i]), q[i].chapter) })
    setInitialLoading(false)

    const targetKey = q[idx] ? keyFor(q[idx]) : null
    // Returns false only when the target row hasn't been committed to the DOM yet, so the
    // caller can retry on a later frame.
    const doScroll = (): boolean => {
      const panel = panelRef.current
      if (!panel) return true
      if (!targetKey) { panel.scrollTop = 0; return true }
      const vTarget = verse != null ? verseRefs.current[`${targetKey}.${verse}`] : null
      const target = vTarget ?? sectionRefs.current[targetKey]
      if (!target) return false
      // getBoundingClientRect (not offsetTop) — offsetTop is only meaningful relative to
      // the nearest *positioned* ancestor, which isn't necessarily (and here, isn't) the
      // scroll panel itself, so `target.offsetTop - panel.offsetTop` silently measured
      // against the wrong reference frame and could land on the wrong chapter/verse.
      panel.scrollTop += target.getBoundingClientRect().top - panel.getBoundingClientRect().top
      return true
    }
    // The target row may not be laid out on the very next frame, and the Greek web-font
    // reflows the text after it finishes loading — either of which can leave the jump a
    // chapter or several verses off. So retry until the row exists, correct once more on
    // the following frame, and re-align after the font is ready.
    let tries = 0
    const attempt = () => {
      if (!doScroll() && tries++ < 20) { requestAnimationFrame(attempt); return }
      requestAnimationFrame(doScroll)
    }
    requestAnimationFrame(attempt)
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => requestAnimationFrame(doScroll))
    }
  }, [fetchChapterRows, refreshNotesFor, highlights.loadFor])

  // Fetches a chapter's verse/section numbers for the Verse locate column — cheap enough
  // (one chapter) to do per click, and avoids needing per-chapter verse counts baked
  // into the catalog.
  function loadLocateVerses(w: CatalogWork, book: number | undefined, chapter: number) {
    setLocateVerseNums(null)
    const token = ++fetchTokenRef.current
    fetchChapterRows(w, { book, chapter }).then(rows => {
      if (fetchTokenRef.current !== token) return
      setLocateVerseNums(rows.map(r => r.num))
    }).catch(() => { if (fetchTokenRef.current === token) setLocateVerseNums([]) })
  }

  function openWork(w: CatalogWork) {
    setWork(w); setTranslationId(translationsFor(w)[0]?.id ?? null); setOpenCat(null); setGreekHiddenPref(false)
    setLocateBook(1); setLocateChapter(1)
    setTermHighlight(null)
    void openAt(w, w.source === 'josephus' ? 1 : undefined, 1)
    loadLocateVerses(w, w.source === 'josephus' ? 1 : undefined, 1)
  }

  // "Open in Texts" hand-off from another tab (e.g. Backgrounds' cross-reference pane).
  useEffect(() => {
    if (!openRequest) return
    const { target } = openRequest
    const w = target.source === 'lxx' ? findLxxWork(target.osisId!)
      : target.source === 'josephus' ? findJosephusWork(target.workDir!)
      : TEXT_CATEGORIES.flatMap(c => c.works).find(x => x.source === target.source)
    if (!w) return
    setWork(w); setTranslationId(translationsFor(w)[0]?.id ?? null); setOpenCat(null); setGreekHiddenPref(false)
    setLocateBook(target.book ?? 1); setLocateChapter(target.chapter)
    setTermHighlight(target.highlight?.trim() || null)
    void openAt(w, target.book, target.chapter, target.verse)
    loadLocateVerses(w, target.book, target.chapter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest])

  // Locate columns — Book (Josephus multi-book works) → Chapter → Verse. Selecting a
  // book or chapter jumps straight there (and loads the next column); selecting a verse
  // refines the scroll position within the already-loaded chapter.
  function selectLocateBook(book: number) {
    if (!work) return
    setLocateBook(book); setLocateChapter(1)
    void openAt(work, book, 1)
    loadLocateVerses(work, book, 1)
  }

  function selectLocateChapter(chapter: number) {
    if (!work) return
    setLocateChapter(chapter)
    const book = work.source === 'josephus' ? locateBook : undefined
    void openAt(work, book, chapter)
    loadLocateVerses(work, book, chapter)
  }

  function selectLocateVerse(verse: number) {
    if (!work || locateChapter == null) return
    const book = work.source === 'josephus' ? locateBook : undefined
    void openAt(work, book, locateChapter, verse)
    setLocateOpen(false)
  }

  // Build the cascade's columns (Book → Chapter → Verse) in order. All columns are
  // top-aligned so the numbers sit in neat parallel columns; the selected row in each is
  // highlighted (rather than offsetting the next column) to show the current location.
  type LocateItem = { n: number; selected: boolean; onClick: () => void }
  type LocateColumn = { key: string; label: string; marginTop: number; items: 'loading' | LocateItem[] }
  function buildLocateColumns(): LocateColumn[] {
    if (!work) return []
    const cols: LocateColumn[] = []
    const bookPresent = work.source === 'josephus' && work.books!.length > 1
    const chapterCount = work.source === 'josephus' ? (work.books![locateBook - 1] ?? 1) : (work.chapters ?? 1)
    const chPresent = chapterCount > 1

    if (bookPresent) {
      cols.push({
        key: 'book', label: 'Book', marginTop: 0,
        items: work.books!.map((_, i) => ({ n: i + 1, selected: locateBook === i + 1, onClick: () => selectLocateBook(i + 1) })),
      })
    }
    if (chPresent) {
      cols.push({
        key: 'ch', label: 'Ch.', marginTop: 0,
        items: Array.from({ length: chapterCount }, (_, i) => ({ n: i + 1, selected: locateChapter === i + 1, onClick: () => selectLocateChapter(i + 1) })),
      })
    }
    cols.push({
      key: 'vs', label: 'Vs.', marginTop: 0,
      items: locateVerseNums === null ? 'loading'
        : locateVerseNums.map(vn => ({ n: vn, selected: false, onClick: () => selectLocateVerse(vn) })),
    })
    return cols
  }

  const q = search.trim().toLowerCase()
  // Accent-insensitive form of the red search-highlight term (only while the in-text search
  // box is empty), so it also catches accented Greek forms.
  const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const termNorm = !q && termHighlight ? stripAccents(termHighlight) : null
  const matchesSearch = (r: Row) =>
    !q ||
    !!r.greek?.toLowerCase().includes(q) ||
    !!r.english?.toLowerCase().includes(q) ||
    !!r.tokens?.some(t => t.surface.toLowerCase().includes(q))

  return (
    <div className="flex flex-col gap-3 h-full min-h-0" style={{ '--tx-fs': FONT_SIZE_MAP[fontSize] } as CSSProperties}>
      {/* ── Category headings — click one to drop its work list below it ── */}
      <div ref={catRowRef} className="flex-none flex flex-wrap items-start gap-1.5">
        {TEXT_CATEGORIES.map(cat => {
          const isActive = !!work && cat.works.some(w => w.id === work.id)
          return (
            <div key={cat.id} className="relative">
              <button
                type="button"
                disabled={cat.comingSoon}
                onClick={() => setOpenCat(c => c === cat.id ? null : cat.id)}
                className={`px-2 py-1 text-xs font-medium border transition-colors ${
                  openCat === cat.id ? 'rounded-t border-b-0 bg-brand-100 border-brand-300 text-brand-800'
                  : 'rounded border-gray-300'
                } ${
                  cat.comingSoon ? 'border-gray-200 text-gray-300 cursor-default'
                  : openCat === cat.id ? ''
                  : isActive ? 'border-brand-300 text-brand-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                {cat.label}{cat.comingSoon && <span className="ml-1 text-[10px]">soon</span>}
              </button>

              {openCat === cat.id && (
                <div className="absolute left-0 top-full z-20 w-56 max-h-72 overflow-y-auto bg-surface border border-brand-300 rounded-b-lg rounded-tr-lg shadow-lg py-1">
                  {cat.works.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => { openWork(w); setOpenCat(null) }}
                      className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                        work?.id === w.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Reading pane — always visible ── */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        {work && (
          <div className="flex-none flex flex-wrap items-center gap-2">
            {/* Click the work title to drop down the Book/Chapter/Verse locate cascade
                (same click-to-open pattern as the category menus above). Each column
                appears to the right of the last, its first row aligned with the row you
                just selected. Absolutely positioned so it never pushes the reading pane. */}
            <div className="relative" ref={locateMenuRef}>
              <button
                type="button"
                onClick={() => setLocateOpen(o => !o)}
                className={`inline-flex items-center gap-1 rounded px-1 text-sm font-semibold transition-colors ${locateOpen ? 'text-brand-800' : 'text-gray-800 hover:text-brand-700'}`}
              >
                {work.name}
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${locateOpen ? 'rotate-180' : ''}`} />
              </button>

              {locateOpen && (
                <div className="absolute left-0 top-full z-30 mt-1 flex items-start bg-surface border border-gray-200 rounded-lg shadow-lg p-2 max-h-[70vh] overflow-y-auto">
                  {buildLocateColumns().map(col => (
                    <div key={col.key} style={{ marginTop: col.marginTop }} className="w-14 shrink-0">
                      <p
                        className="px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400"
                        style={{ height: LOCATE_HEADER_H, lineHeight: `${LOCATE_HEADER_H}px` }}
                      >
                        {col.label}
                      </p>
                      {col.items === 'loading' ? (
                        <p className="px-2 text-xs text-gray-300 italic" style={{ height: LOCATE_ROW_H, lineHeight: `${LOCATE_ROW_H}px` }}>…</p>
                      ) : col.items.length === 0 ? (
                        <p className="px-2 text-xs text-gray-300 italic" style={{ height: LOCATE_ROW_H, lineHeight: `${LOCATE_ROW_H}px` }}>—</p>
                      ) : (
                        col.items.map(it => (
                          <button
                            key={it.n}
                            type="button"
                            onClick={it.onClick}
                            style={{ height: LOCATE_ROW_H }}
                            className={`flex w-full items-center px-2 text-left text-xs transition-colors ${it.selected ? 'bg-brand-100 text-brand-800 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                          >
                            {it.n}
                          </button>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isGreek && availableTranslations.length > 0 && (
              <div className="relative" ref={translationMenuRef}>
                <button
                  type="button"
                  onClick={() => setTranslationMenuOpen(o => !o)}
                  className={`inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 ${
                    translationMenuOpen ? 'bg-gray-100' : ''}`}
                >
                  {currentTranslationLabel}
                  <ChevronDown size={13} className={`transition-transform ${translationMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {translationMenuOpen && (
                  <div className="absolute left-0 top-full z-30 mt-1 min-w-[11rem] rounded-lg border border-gray-200 bg-surface py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => { setTranslationId(null); setGreekHiddenPref(false); setTranslationMenuOpen(false) }}
                      className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${!translationId ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Greek only
                    </button>
                    {availableTranslations.map(t => (
                      <Fragment key={t.id}>
                        <button
                          type="button"
                          onClick={() => { setTranslationId(t.id); setGreekHiddenPref(false); setTranslationMenuOpen(false) }}
                          className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${translationId === t.id && !greekHidden ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Greek + {t.label}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTranslationId(t.id); setGreekHiddenPref(true); setTranslationMenuOpen(false) }}
                          className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${translationId === t.id && greekHidden ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {t.label} only
                        </button>
                      </Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}

            <span className="text-xs text-gray-400 ml-auto">Scroll to keep reading</span>
          </div>
        )}

        {/* Search this text — or all background texts */}
        <div className="flex-none flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={!work}
              placeholder={work ? 'Search the loaded text…' : 'Select a text above to begin reading'}
              className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <button
            type="button"
            onClick={() => openBackgroundsSearch(search.trim(), 'en')}
            title="Search across all background texts (Philo, Josephus, LXX, Apocrypha, Pseudepigrapha)"
            className="flex-none whitespace-nowrap rounded-none border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Search all texts
          </button>
        </div>

        <div ref={panelRef} className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-4">
          {!work ? (
            <p className="text-sm text-gray-400 italic">Choose a category above and select a text to start reading.</p>
          ) : initialLoading || series.sections.length === 0 ? (
            <p className="text-xs text-gray-300 italic">Loading…</p>
          ) : (
            <div className="space-y-4">
              <div ref={topSentinel} />
              {!series.backDone && <p className="text-xs text-gray-300 italic text-center">Loading previous chapter…</p>}

              {series.sections.map(section => {
                const filteredRows = section.rows.filter(matchesSearch)
                if (q && filteredRows.length === 0) return null
                const noteBook = noteBookFor(work, section)
                const refLabel = refLabelFor(work, section)
                const notedKeys = notedMap[`${noteBook}.${section.chapter}`] ?? new Set<number>()
                return (
                  <div key={section.key} ref={el => { if (el) sectionRefs.current[section.key] = el }}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                      {work.source === 'josephus' && work.books!.length > 1 ? `Book ${section.book} · Chapter ${section.chapter}` : `Chapter ${section.chapter}`}
                    </p>
                    <div className="space-y-2">
                      {filteredRows.map(row => {
                        const verseHighlights = highlights.forVerse(noteBook, section.chapter, row.num)
                        return (
                        <div key={row.num} ref={el => { if (el) verseRefs.current[`${section.key}.${row.num}`] = el }}
                          className={`grid gap-4 ${!greekHidden && ((isGreek && showEnglish && hasEnglish) || greekProse) ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                          {/* Greek (or, for prose works, the single English column) — the
                              only column highlighting applies to (see render.tsx: a verse's
                              Greek and English text are different canonical strings, so a
                              highlight can only safely belong to one of them). Hidden in
                              translation-only mode (lxx works, "<translation> only"). */}
                          {!greekHidden && (
                          <p className="leading-relaxed text-gray-900 font-reading">
                            {isAuthenticated && (
                              <span className="font-sans align-middle mr-0.5">
                                <VerseNoteButton book={noteBook} chapter={section.chapter} verse={row.num} noted={notedKeys.has(row.num)}
                                  onChanged={() => refreshNotesFor(noteBook, section.chapter)} />
                              </span>
                            )}
                            <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{row.num}</sup>
                            {isGreek ? (
                              <span className="font-greek" style={{ fontSize: 'var(--tx-fs, 1.45rem)' }} {...verseAnchorProps(noteBook, section.chapter, row.num)}>
                                {row.tokens && row.tokens.length > 0
                                  ? withTokenOffsets(row.tokens).map(({ token: tok, start, end }, ti) => {
                                      const key = `${section.key}.${row.num}.${ti}`
                                      const select = () => { setSelectedInfo(toLexicalInfo(tok, `${refLabel}:${row.num}`)); setSelectedKey(key) }
                                      const matched = !!q && tok.surface.toLowerCase().includes(q)
                                      const matchedTerm = !!termNorm && stripAccents(tok.surface).includes(termNorm)
                                      const hl = !q ? highlightAt(start, end, verseHighlights) : undefined
                                      return (
                                        <span key={ti} onMouseEnter={select} onClick={select}
                                          onContextMenu={e => {
                                            e.preventDefault()
                                            const existing = verseHighlights.find(h => start < h.endOffset && end > h.startOffset)
                                            openWordSearch({
                                              x: e.clientX, y: e.clientY, surface: tok.surface, lemma: tok.lemma,
                                              reference: `${refLabel}:${row.num}`, kind: 'greek', greekCorpus: 'LXX',
                                              highlight: isAuthenticated ? {
                                                activeColor: existing?.color ?? null,
                                                onPick: c => existing ? void highlights.recolor(existing.id, noteBook, section.chapter, c) : void highlights.create(noteBook, section.chapter, row.num, start, end, c),
                                                onRemove: () => { if (existing) void highlights.remove(existing.id, noteBook, section.chapter) },
                                              } : undefined,
                                            })
                                          }}
                                          {...(hl ? { 'data-highlight-id': hl.id, 'data-hl-book': noteBook, 'data-hl-chapter': section.chapter, 'data-hl-color': hl.color } : {})}
                                          className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''} ${matched || matchedTerm ? SEARCH_RED : hl ? highlightMarkClass(hl.color) : ''}`}>
                                          {tok.surface}{ti < row.tokens!.length - 1 ? ' ' : ''}
                                        </span>
                                      )
                                    })
                                  : row.greek}
                              </span>
                            ) : greekProse ? (
                              <span className="font-greek" style={{ fontSize: 'calc(var(--tx-fs, 1.45rem) * 0.85)' }}>
                                {q ? highlight(row.greek ?? '', search)
                                  : termHighlight ? highlight(row.greek ?? '', termHighlight, SEARCH_RED)
                                  : row.greek}
                              </span>
                            ) : (
                              <span style={{ fontSize: 'calc(var(--tx-fs, 1.45rem) * 0.65)' }} {...verseAnchorProps(noteBook, section.chapter, row.num)}>
                                {q ? highlight(row.english ?? '', search)
                                  : termHighlight ? highlight(row.english ?? '', termHighlight, SEARCH_RED)
                                  : renderHighlightedPlainText(row.english ?? '', noteBook, section.chapter, verseHighlights)}
                              </span>
                            )}
                          </p>
                          )}

                          {/* Parallel English column — for lxx Greek works and greek-prose
                              works (Epictetus). For greek-prose this is the primary text, so
                              it carries the note/highlight anchor. In translation-only mode
                              (Greek hidden) it's the sole column and carries the note button. */}
                          {((isGreek && showEnglish && hasEnglish) || greekProse) && (
                            <p className={`font-reading leading-relaxed text-gray-600 ${greekHidden ? '' : 'lg:border-l lg:border-gray-100 lg:pl-4'}`} style={{ fontSize: greekHidden ? 'calc(var(--tx-fs, 1.45rem) * 0.8)' : 'calc(var(--tx-fs, 1.45rem) * 0.65)' }}
                              {...(greekProse ? verseAnchorProps(noteBook, section.chapter, row.num) : {})}>
                              {isAuthenticated && greekHidden && (
                                <span className="font-sans align-middle mr-0.5">
                                  <VerseNoteButton book={noteBook} chapter={section.chapter} verse={row.num} noted={notedKeys.has(row.num)}
                                    onChanged={() => refreshNotesFor(noteBook, section.chapter)} />
                                </span>
                              )}
                              <sup className="text-[10px] text-gray-300 mr-0.5 font-sans">{row.num}</sup>
                              {greekProse
                                ? (q ? highlight(row.english ?? '', search)
                                   : termHighlight ? highlight(row.english ?? '', termHighlight, SEARCH_RED)
                                   : renderHighlightedPlainText(row.english ?? '', noteBook, section.chapter, verseHighlights))
                                : row.english
                                ? (q ? highlight(row.english, search)
                                   : termHighlight ? highlight(row.english, termHighlight, SEARCH_RED)
                                   : row.english)
                                : <span className="text-gray-300 italic">—</span>}
                            </p>
                          )}
                        </div>
                      )})}
                    </div>
                  </div>
                )
              })}

              {!series.done && <p className="text-xs text-gray-300 italic text-center">Loading next chapter…</p>}
              <div ref={bottomSentinel} />
            </div>
          )}
        </div>

        {/* Parsing window — Greek works only */}
        {isGreek && !greekHidden && <ParsingPanel info={selectedInfo} bgClass="bg-gray-50" />}
      </div>

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
