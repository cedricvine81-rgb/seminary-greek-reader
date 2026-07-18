'use client'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { betaCodeToGreek } from '@/lib/greek-translit'
import { SEARCH_MARK } from '@/lib/highlight-terms'
import { normalizeGreek } from '@/lib/greek-utils'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { TEXT_CATEGORIES, findLxxWork, findJosephusWork, type CatalogWork } from '@/lib/texts-catalog'
import { getTextSummary } from '@/lib/texts-summaries'
import { findProseWork } from '@/lib/prose-texts'
import type { PhraseFontSize } from '@/components/phrase/PhraseExplorer'
import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'
import { openWordSearch } from '@/lib/word-search-bus'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { useHighlights } from '@/components/highlights/useHighlights'
import { useHighlightSelection } from '@/components/highlights/useHighlightSelection'
import { HighlightPopup } from '@/components/highlights/HighlightPopup'
import { verseAnchorProps, withTokenOffsets, highlightAt } from '@/components/highlights/render'
import { TransWords } from '@/components/highlights/TransWords'
import { GreekWords } from '@/components/highlights/GreekWords'
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

// Per-word analysis for untagged Greek prose, aligned 1:1 with the reader's whitespace
// tokenization of `greek` (element = [lemma, parse] or null for punctuation). Loaded from a
// sidecar (<book>.morph.json) so the parsing pane works on Josephus etc.
type MorphEntry = [string, string] | null
// One rendered line of text: a verse (lxx / 2esdras) or a section (Josephus).
type Row = { num: number; tokens?: WordToken[]; greek?: string; english?: string; morph?: MorphEntry[] }

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
const SEARCH_RED = SEARCH_MARK

// Accent- and case-insensitive fold, one output char per input char so offsets stay aligned
// with the original string (Greek is all BMP, and precomposed NFC letters collapse 1:1). This
// lets a query typed without accents — e.g. Beta-Code "λογοσ" — match accented text ("λόγος").
const foldCh = (c: string) => { const s = normalizeGreek(c); return s.length === 1 ? s : c.toLowerCase() }
const fold = (s: string) => Array.from(s, foldCh).join('')

function highlight(text: string, q: string, cls: string = SEARCH_RED): ReactNode {
  if (!q.trim()) return text
  const idx = fold(text).indexOf(fold(q))
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
  // Callers append `:${section}`, so Josephus reads "<name> <book>:<§>" (pure Niese, e.g.
  // "Antiquities 1:120") — the Whiston chapter is no longer part of the citation.
  return w.source === 'josephus' ? `${w.name} ${item.book}` : `${w.name} ${item.chapter}`
}

// Heading over each rendered block. Josephus is pure Niese — show the § span the block covers
// (prefixed with its book, for multi-book works) instead of the internal Whiston chapter.
function blockHeadingFor(w: CatalogWork, block: ChapterBlock): string {
  if (w.source === 'josephus') {
    const nums = block.rows.map(r => r.num)
    const span = nums.length === 0 ? ''
      : nums[0] === nums[nums.length - 1] ? `§${nums[0]}`
      : `§§${nums[0]}–${nums[nums.length - 1]}`
    return w.books!.length > 1 ? `Book ${block.book} · ${span}` : span
  }
  return `Chapter ${block.chapter}`
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
  // Josephus is navigated by pure Niese §: the sections run continuously through a whole
  // book (ch1 = §§1–51, ch2 = §§52–71, …), so a § alone locates the passage and there is no
  // chapter column. We still remember each §'s home chapter (content is fetched per chapter)
  // so selecting a § can open it. Null while the book's §§ are loading.
  const [locateSections, setLocateSections] = useState<{ n: number; chapter: number }[] | null>(null)
  const fetchTokenRef = useRef(0)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [series, setSeries] = useState<Series>(EMPTY_SERIES)
  const [initialLoading, setInitialLoading] = useState(false)
  // Which parallel translation is shown next to the Greek, or null for Greek-only.
  const [translationId, setTranslationId] = useState<string | null>(null)
  // For Greek (lxx) works with a translation, hide the Greek and read the translation alone.
  const [greekHiddenPref, setGreekHiddenPref] = useState(false)
  // Display mode for greek-prose works (Josephus, Epictetus): Greek | Greek+English | English.
  const [proseMode, setProseMode] = useState<'greek' | 'both' | 'english'>('both')
  const [translationMenuOpen, setTranslationMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  // The user's explicit choice of search script (null = follow the default, which prefers Greek
  // whenever a Greek column is on screen). Greek transliterates typed Beta Code → Greek letters
  // (l→λ, q→θ …) like the Reader/Search word search; English is plain.
  const [searchLangPref, setSearchLangPref] = useState<'grc' | 'en' | null>(null)
  // Predictive words drawn from the loaded text, offered as you type (both scripts).
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
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
  // Per-word morphology sidecars, keyed by "<work>.<book>" → { "<section>": MorphEntry[] }.
  // Fetched once per book (lazily, alongside content) so the parsing pane works on Greek prose.
  const morphCache = useRef<Record<string, Record<string, MorphEntry[]> | null>>({})

  const panelRef = useRef<HTMLDivElement>(null)
  const highlights = useHighlights(isAuthenticated)
  const highlightSelection = useHighlightSelection(panelRef)
  const topSentinel = useRef<HTMLDivElement>(null)
  const bottomSentinel = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement>>({})
  const verseRefs = useRef<Record<string, HTMLDivElement>>({})
  const catRowRef = useRef<HTMLDivElement>(null)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const locateMenuRef = useRef<HTMLDivElement>(null)
  const translationMenuRef = useRef<HTMLDivElement>(null)
  // Whether the "Summary" popover is open, and its anchor. (A "Contents" popover was removed;
  // it will be reworked later.)
  const [infoPanel, setInfoPanel] = useState<'summary' | null>(null)
  const infoMenuRef = useRef<HTMLDivElement>(null)
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
  // Greek-hidden (English-only): an lxx work with its translation showing, or a greek-prose
  // work whose mode is 'english'.
  const greekHidden = (greekHiddenPref && isGreek && showEnglish) || (greekProse && proseMode === 'english')
  // Whether the parallel English column is rendered at all.
  const englishColShown = (isGreek && showEnglish && hasEnglish) || (greekProse && proseMode !== 'greek')
  const translationLabel = translationId
    ? (availableTranslations.find(t => t.id === translationId)?.label ?? 'Translation')
    : null
  const currentTranslationLabel = !translationId
    ? 'Greek only'
    : greekHidden ? `${translationLabel} only` : `Greek + ${translationLabel}`
  const proseModeLabel = proseMode === 'greek' ? 'Greek only' : proseMode === 'english' ? 'English only' : 'Greek + English'

  // Which scripts the in-text search can target, given what's on screen.
  const greekSearchable = (isGreek || greekProse) && !greekHidden
  const englishSearchable = !!work && (englishColShown || (!isGreek && !greekProse))
  // Effective script: honour the user's pick while it's still valid, else default to Greek
  // whenever a Greek column is shown. Derived (not stored) so it can never get stuck on a
  // script that isn't on screen — e.g. the empty pre-load state, or a display-mode switch.
  const searchLang: 'grc' | 'en' =
    searchLangPref === 'grc' && greekSearchable ? 'grc'
    : searchLangPref === 'en' && englishSearchable ? 'en'
    : greekSearchable ? 'grc' : 'en'
  const greekTyping = searchLang === 'grc' && greekSearchable

  // Unique words present in the loaded text, per script, for predictive suggestions. Greek is
  // tokenized from the parsed tokens where available (else whitespace-split); English from the
  // translation strings. Folded once so lookups are accent/case-insensitive.
  const wordIndex = useMemo(() => {
    const grc = new Map<string, string>(), en = new Map<string, string>()
    const trim = /^[^A-Za-zͰ-Ͽἀ-῿]+|[^A-Za-zͰ-Ͽἀ-῿]+$/g
    const add = (map: Map<string, string>, raw: string) => {
      const w = raw.replace(trim, '')
      if (w.length < 2) return
      const k = fold(w)
      if (!map.has(k)) map.set(k, w)
    }
    for (const section of series.sections) for (const r of section.rows) {
      if (r.tokens) for (const t of r.tokens) add(grc, t.surface)
      else if (r.greek) for (const w of r.greek.split(/\s+/)) add(grc, w)
      if (r.english) for (const w of r.english.split(/\s+/)) add(en, w)
    }
    return { grc: Array.from(grc.values()), en: Array.from(en.values()) }
  }, [series.sections])

  // Offer up to 8 words that start with what's typed (2+ chars), from the active script.
  useEffect(() => {
    const raw = search.trim()
    if (raw.length < 2) { setSuggestions([]); return }
    const needle = fold(raw)
    const pool = searchLang === 'grc' ? wordIndex.grc : wordIndex.en
    const starts: string[] = [], contains: string[] = []
    for (const w of pool) {
      const fw = fold(w)
      if (fw === needle) continue
      if (fw.startsWith(needle)) starts.push(w)
      else if (fw.includes(needle)) contains.push(w)
      if (starts.length >= 8) break
    }
    setSuggestions([...starts, ...contains].slice(0, 8))
  }, [search, searchLang, wordIndex])

  // Close the suggestion dropdown on an outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setSuggestOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // In Greek mode, transliterate typed Latin → Greek live (Beta Code), preserving the caret.
  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSuggestOpen(true)
    if (!greekTyping) { setSearch(e.target.value); return }
    const el = e.target
    const pos = el.selectionStart ?? el.value.length
    setSearch(betaCodeToGreek(el.value))
    requestAnimationFrame(() => { try { el.setSelectionRange(pos, pos) } catch {} })
  }
  function pickSuggestion(word: string) {
    setSearch(word)
    setSuggestions([])
    setSuggestOpen(false)
    searchInputRef.current?.focus()
  }

  const refreshNotesFor = useCallback(async (noteBook: string, ch: number) => {
    if (!isAuthenticated) return
    try {
      const r = await fetch(`/api/notes?book=${encodeURIComponent(noteBook)}&chapter=${ch}&verseStart=1&verseEnd=700`)
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

  // Close the Authorship / Contents popover on an outside click or Escape.
  useEffect(() => {
    if (!infoPanel) return
    function onMouseDown(e: MouseEvent) {
      if (infoMenuRef.current && !infoMenuRef.current.contains(e.target as Node)) setInfoPanel(null)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setInfoPanel(null) }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onMouseDown); document.removeEventListener('keydown', onKey) }
  }, [infoPanel])
  // A different work was opened → close any open popover.
  useEffect(() => { setInfoPanel(null) }, [work])

  // Sources & copyright, lifted to the shared tools menu (matches Backgrounds/Synopsis).
  useEffect(() => {
    if (!work) { onAttribution?.(''); return }
    const parts = work.source === 'lxx' ? ['Greek text: Rahlfs’ Septuagint (1935) and Nestle 1904, both public domain.'] : []
    if (work.english === 'brenton') parts.push('English: Brenton’s 1851 English Septuagint (public domain).')
    if (work.english === 'bsb') parts.push('English: the Berean Standard Bible (public domain).')
    const prose = findProseWork(work.source)
    if (prose) parts.push(prose.attribution)
    if (work.source === 'josephus') parts.push('Greek: B. Niese’s edition (1885–1895); English: William Whiston’s translation (1737); both public domain. Sections numbered per Niese. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.')
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
  // Lazily fetch a book's per-word morphology sidecar (once, cached). null when the book has
  // no sidecar yet (the parsing pane simply stays empty for those words).
  async function loadMorph(work: string, book: number): Promise<Record<string, MorphEntry[]> | null> {
    const key = `${work}.${book}`
    if (key in morphCache.current) return morphCache.current[key]
    try {
      const r = await fetch(`/data/josephus/${work}/${book}.morph.json`)
      morphCache.current[key] = r.ok ? await r.json() : null
    } catch {
      morphCache.current[key] = null
    }
    return morphCache.current[key]
  }
  // Same, for embedded Greek-prose works (Epictetus etc.): one sidecar per work, keyed
  // "<chapter>.<verse>" (verses restart per chapter, unlike Josephus's book-unique §§).
  async function loadProseMorph(w: CatalogWork): Promise<Record<string, MorphEntry[]> | null> {
    const prose = findProseWork(w.source)
    if (!w.greek || !prose) return null
    const url = prose.dataUrl.replace(/\.json$/, '.morph.json')
    if (url in morphCache.current) return morphCache.current[url]
    try {
      const r = await fetch(url)
      morphCache.current[url] = r.ok ? await r.json() : null
    } catch {
      morphCache.current[url] = null
    }
    return morphCache.current[url]
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
      const morph = await loadMorph(w.work!, item.book!)
      // Niese §§ carry parallel Greek; the Whiston English is attached once per Whiston
      // section (its first §), so most §§ have Greek only in the English column.
      return (ch?.sections ?? []).map((s: { number: number; text: string; greek?: string }) =>
        ({ num: s.number, english: s.text, greek: s.greek, morph: morph?.[String(s.number)] }))
    }
    // 2 Esdras / 1 Enoch / Jubilees / 2 Baruch / 2 Enoch — plain English prose stored as
    // chapter→verses; the registry knows where each one's JSON lives.
    const r = await fetch(findProseWork(w.source)!.dataUrl)
    const d = r.ok ? await r.json() : null
    const ch = d?.chapters?.find((c: { number: number }) => c.number === item.chapter)
    const morph = await loadProseMorph(w)
    return (ch?.verses ?? []).map((v: { number: number; text: string; greek?: string }) =>
      ({ num: v.number, english: v.text, greek: v.greek, morph: morph?.[`${item.chapter}.${v.number}`] }))
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

  // Reflect the current reading position (work + top-visible chapter/verse) into the URL's
  // `open=` deep-link param via replaceState (no navigation, no history entries). A right-click
  // search snapshots window.location for its "Return to page" — with the position in the URL,
  // returning re-opens this work at the same spot instead of an empty pane. Runs on scroll-idle
  // and after a chapter series (re)loads.
  const lastOpenRequestAt = useRef(0)   // suppress writes while an openRequest jump is in flight
  const writePositionToUrl = useCallback(() => {
    if (typeof window === 'undefined') return
    // An "open in Texts" request scrolls to its target over several frames (plus a font-ready
    // correction). Writing the position during that window would capture the pre-jump view and
    // overwrite the very target being restored — so hold off until the jump has settled.
    if (Date.now() - lastOpenRequestAt.current < 2000) return
    const w = workRef.current
    const params = new URLSearchParams(window.location.search)
    const put = () => window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params.toString()}`)
    if (!w) { if (params.has('open')) { params.delete('open'); put() } return }
    const panel = panelRef.current
    if (!panel || seriesRef.current.sections.length === 0) return
    const panelTop = panel.getBoundingClientRect().top
    // Top-visible section = the lowest section header at/above the panel top (fallback: first).
    let bestKey: string | null = null, bestTop = -Infinity, firstKey: string | null = null, firstTop = Infinity
    for (const [key, el] of Object.entries(sectionRefs.current)) {
      if (!el?.isConnected) continue
      const t = el.getBoundingClientRect().top
      if (t < firstTop) { firstTop = t; firstKey = key }
      if (t <= panelTop + 12 && t > bestTop) { bestTop = t; bestKey = key }
    }
    const key = bestKey ?? firstKey
    if (!key) return
    // First verse of that section at/below the panel top — the verse the reader is looking at.
    let verse: number | undefined, vBest = Infinity
    const prefix = `${key}.`
    for (const [vk, el] of Object.entries(verseRefs.current)) {
      if (!vk.startsWith(prefix) || !el?.isConnected) continue
      const t = el.getBoundingClientRect().top
      if (t >= panelTop - 8 && t < vBest) { vBest = t; verse = parseInt(vk.slice(prefix.length), 10) }
    }
    const [bookStr, chapStr] = key.split('.')
    const chapter = parseInt(chapStr, 10)
    const book = bookStr ? parseInt(bookStr, 10) : undefined
    if (!Number.isFinite(chapter)) return
    const target: OpenInTextsTarget = w.source === 'lxx'
      ? { source: 'lxx', osisId: w.osisId, chapter, verse }
      : w.source === 'josephus'
        ? { source: 'josephus', workDir: w.work, book, chapter, verse }
        : { source: w.source, book, chapter, verse }
    const json = JSON.stringify(target)
    if (params.get('open') !== json) { params.set('open', json); put() }
  }, [])
  const positionIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      // Update the URL's reading position once scrolling pauses (see writePositionToUrl).
      if (positionIdleTimer.current) clearTimeout(positionIdleTimer.current)
      positionIdleTimer.current = setTimeout(writePositionToUrl, 400)
    }
    panel.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      panel.removeEventListener('scroll', onScroll)
      if (positionIdleTimer.current) clearTimeout(positionIdleTimer.current)
    }
  }, [loadMore, loadPrev, writePositionToUrl])

  // Also record the position when a work opens/changes (before any scrolling happens).
  useEffect(() => {
    const t = setTimeout(writePositionToUrl, 250)
    return () => clearTimeout(t)
  }, [work, series.sections.length, writePositionToUrl])

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
    // the following frame, and re-align after the font is ready. Timer-based fallbacks run
    // alongside the rAF loop because browsers suspend rAF entirely in background/occluded
    // tabs — the same failure mode as the Reader's old jump-stranding — which would leave
    // a restored "Return to page" sitting at the top of the preloaded window.
    let tries = 0
    const attempt = () => {
      if (!doScroll() && tries++ < 20) { requestAnimationFrame(attempt); return }
      requestAnimationFrame(doScroll)
    }
    requestAnimationFrame(attempt)
    for (const ms of [120, 350, 800]) setTimeout(doScroll, ms)
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => { requestAnimationFrame(doScroll); setTimeout(doScroll, 60) })
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

  // Josephus: load a whole book's Niese §§ in one fetch (the JSON is stored per book), keeping
  // each §'s home chapter so selecting a § can open the right chapter. Fills the single § column.
  function loadLocateSections(w: CatalogWork, book: number) {
    setLocateSections(null)
    const token = ++fetchTokenRef.current
    fetch(`/data/josephus/${w.work}/${book}.json`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: { chapters?: { number: number; sections?: { number: number }[] }[] } | null) => {
        if (fetchTokenRef.current !== token) return
        const secs: { n: number; chapter: number }[] = []
        for (const ch of d?.chapters ?? [])
          for (const s of ch.sections ?? []) secs.push({ n: s.number, chapter: ch.number })
        setLocateSections(secs)
      })
      .catch(() => { if (fetchTokenRef.current === token) setLocateSections([]) })
  }

  function openWork(w: CatalogWork) {
    setWork(w); setTranslationId(translationsFor(w)[0]?.id ?? null); setOpenCat(null); setGreekHiddenPref(false); setProseMode('both')
    setLocateBook(1); setLocateChapter(1)
    setTermHighlight(null)
    void openAt(w, w.source === 'josephus' ? 1 : undefined, 1)
    if (w.source === 'josephus') loadLocateSections(w, 1)
    else loadLocateVerses(w, undefined, 1)
  }

  // "Open in Texts" hand-off from another tab (e.g. Backgrounds' cross-reference pane).
  useEffect(() => {
    if (!openRequest) return
    lastOpenRequestAt.current = Date.now()   // see writePositionToUrl
    const { target } = openRequest
    const w = target.source === 'lxx' ? findLxxWork(target.osisId!)
      : target.source === 'josephus' ? findJosephusWork(target.workDir!)
      : TEXT_CATEGORIES.flatMap(c => c.works).find(x => x.source === target.source)
    if (!w) return
    setWork(w); setTranslationId(translationsFor(w)[0]?.id ?? null); setOpenCat(null); setGreekHiddenPref(false); setProseMode('both')
    setLocateBook(target.book ?? 1); setLocateChapter(target.chapter)
    setTermHighlight(target.highlight?.trim() || null)
    void openAt(w, target.book, target.chapter, target.verse)
    if (w.source === 'josephus') loadLocateSections(w, target.book ?? 1)
    else loadLocateVerses(w, target.book, target.chapter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest])

  // Locate columns — Book (Josephus multi-book works) → Chapter → Verse. Selecting a
  // book or chapter jumps straight there (and loads the next column); selecting a verse
  // refines the scroll position within the already-loaded chapter.
  function selectLocateBook(book: number) {
    if (!work) return
    setLocateBook(book); setLocateChapter(1)
    void openAt(work, book, 1)
    // The Book column only exists for Josephus, which now goes straight to a whole-book § list.
    if (work.source === 'josephus') loadLocateSections(work, book)
    else loadLocateVerses(work, book, 1)
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

  // Josephus: a bare § resolves to its home chapter (content is still fetched per chapter),
  // then opens there. The § is unique within the book, so this mapping is unambiguous.
  function selectLocateSection(section: number) {
    if (!work) return
    const chapter = locateSections?.find(s => s.n === section)?.chapter ?? 1
    void openAt(work, locateBook, chapter, section)
    setLocateOpen(false)
  }

  // Build the cascade's columns (Book → Chapter → Verse) in order. All columns are
  // top-aligned so the numbers sit in neat parallel columns; the selected row in each is
  // highlighted (rather than offsetting the next column) to show the current location.
  type LocateItem = { n: number; selected: boolean; onClick: () => void }
  type LocateColumn = { key: string; label: string; marginTop: number; items: 'loading' | LocateItem[] }
  function buildLocateColumns(): LocateColumn[] {
    if (!work) return []

    // Josephus: pure Niese — Book (multi-book works only) → § (the whole book's sections in
    // one column). No chapter column; the § numbers run continuously so they alone locate.
    if (work.source === 'josephus') {
      const cols: LocateColumn[] = []
      if (work.books!.length > 1) {
        cols.push({
          key: 'book', label: 'Book', marginTop: 0,
          items: work.books!.map((_, i) => ({ n: i + 1, selected: locateBook === i + 1, onClick: () => selectLocateBook(i + 1) })),
        })
      }
      cols.push({
        key: 'vs', label: '§', marginTop: 0,
        items: locateSections === null ? 'loading'
          : locateSections.map(s => ({ n: s.n, selected: false, onClick: () => selectLocateSection(s.n) })),
      })
      return cols
    }

    const cols: LocateColumn[] = []
    const chapterCount = work.chapters ?? 1
    const chPresent = chapterCount > 1

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
  // Accent-insensitive query, so Beta-Code Greek typed without accents ("λογοσ") still matches
  // the accented text ("λόγος").
  const qNorm = q ? fold(q) : ''
  const termNorm = !q && termHighlight ? normalizeGreek(termHighlight) : null
  const matchesSearch = (r: Row) =>
    !q ||
    !!r.greek && fold(r.greek).includes(qNorm) ||
    !!r.english && fold(r.english).includes(qNorm) ||
    !!r.tokens?.some(t => fold(t.surface).includes(qNorm))

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
                <div className="absolute left-0 top-full z-20 w-56 max-h-72 overflow-y-auto bg-popover border border-brand-300 rounded-b-lg rounded-tr-lg shadow-lg py-1">
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
                <div className="absolute left-0 top-full z-30 mt-1 flex items-start bg-popover border border-gray-200 rounded-lg shadow-lg p-2 max-h-[70vh] overflow-y-auto">
                  {buildLocateColumns().map(col => (
                    <div key={col.key} style={{ marginTop: col.marginTop }} className={`shrink-0 ${col.key === 'vs' && work?.source === 'josephus' ? 'w-[4.5rem]' : 'w-14'}`}>
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

            {/* "About this work" — Summary popover (all sections), when available. */}
            {(() => {
              const summary = getTextSummary(work)
              if (!summary || summary.sections.length === 0) return null
              return (
                <div className="relative" ref={infoMenuRef}>
                  <button
                    type="button"
                    onClick={() => setInfoPanel(p => (p === 'summary' ? null : 'summary'))}
                    className={`text-xs font-medium transition-colors ${infoPanel === 'summary' ? 'text-brand-700' : 'text-gray-500 hover:text-brand-700'}`}
                  >
                    Summary
                  </button>
                  {infoPanel === 'summary' && (
                    <div className="absolute left-0 top-full z-30 mt-1 w-96 max-w-[90vw] max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 bg-popover shadow-lg p-3 space-y-2.5">
                      {summary.sections.map((s, i) => (
                        <div key={i}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{s.heading}</p>
                          <p className="text-sm leading-relaxed text-gray-700">{s.body}</p>
                        </div>
                      ))}
                      {summary.aiDrafted && (
                        <p className="pt-1.5 border-t border-gray-100 text-[11px] italic text-gray-400">
                          AI-drafted overview reflecting general scholarship — not verified against sources; please double-check before relying on it.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Compact search over the loaded text — sits inline with the title/Summary to keep
                the reading pane tall. Greek works transliterate Beta Code → Greek (like the Reader
                and Search word search); both scripts get predictive words from the loaded text.
                (Cross-corpus search is now the global right-click action.) */}
            <div className="relative" ref={searchWrapRef}>
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={onSearchChange}
                onFocus={() => { if (suggestions.length) setSuggestOpen(true) }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && suggestOpen && suggestions[0]) { e.preventDefault(); pickSuggestion(suggestions[0]) }
                  else if (e.key === 'Escape') setSuggestOpen(false)
                }}
                placeholder={greekTyping ? 'Search Greek…' : 'Search this text…'}
                className={`w-40 sm:w-52 rounded-md border border-gray-300 pl-7 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 ${greekSearchable && englishSearchable ? 'pr-8' : 'pr-2'} ${greekTyping ? 'greek-text' : ''}`}
              />
              {/* Greek ⇄ English input toggle, shown only when both are on screen. */}
              {greekSearchable && englishSearchable && (
                <button
                  type="button"
                  onClick={() => { setSearchLangPref(searchLang === 'grc' ? 'en' : 'grc'); setSearch(''); setSuggestions([]); searchInputRef.current?.focus() }}
                  title={greekTyping ? 'Searching Greek — click for English' : 'Searching English — click for Greek'}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors ${greekTyping ? 'font-reading' : ''}`}
                >
                  {greekTyping ? 'α' : 'A'}
                </button>
              )}

              {/* Predictive words from the loaded text */}
              {suggestOpen && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-40 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-popover py-1 shadow-lg">
                  {suggestions.map(w => (
                    <button
                      key={w}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); pickSuggestion(w) }}
                      className={`block w-full px-3 py-1 text-left text-xs text-gray-700 hover:bg-brand-50 ${greekTyping ? 'greek-text' : ''}`}
                    >
                      {w}
                    </button>
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
                  <div className="absolute left-0 top-full z-30 mt-1 min-w-[11rem] rounded-lg border border-gray-200 bg-popover py-1 shadow-lg">
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

            {greekProse && (
              <div className="relative" ref={translationMenuRef}>
                <button
                  type="button"
                  onClick={() => setTranslationMenuOpen(o => !o)}
                  className={`inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 ${
                    translationMenuOpen ? 'bg-gray-100' : ''}`}
                >
                  {proseModeLabel}
                  <ChevronDown size={13} className={`transition-transform ${translationMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {translationMenuOpen && (
                  <div className="absolute left-0 top-full z-30 mt-1 min-w-[11rem] rounded-lg border border-gray-200 bg-popover py-1 shadow-lg">
                    {([['greek', 'Greek only'], ['both', 'Greek + English'], ['english', 'English only']] as const).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => { setProseMode(mode); setTranslationMenuOpen(false) }}
                        className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${proseMode === mode ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <span className="text-xs text-gray-400 ml-auto">Scroll to keep reading</span>
          </div>
        )}

        {/* data-scroll-restore="skip": this pane restores its own position via the `open=` URL
            param (chapter/verse-precise), so the generic pixel-restorer must not fight it. */}
        <div ref={panelRef} data-scroll-restore="skip" onContextMenu={e => e.preventDefault()} className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-4">
          {!work ? (
            <p className="text-sm text-gray-400 italic">Choose a category above and select a text to start reading.</p>
          ) : initialLoading || series.sections.length === 0 ? (
            <p className="text-xs text-gray-300 italic">Loading…</p>
          ) : (
            <div className="space-y-4">
              <div ref={topSentinel} />
              {!series.backDone && <p className="text-xs text-gray-300 italic text-center">Loading previous chapter…</p>}

              {series.sections.map(section => {
                // In a greek-prose work's English-only mode, drop the Greek-only §§ (Josephus
                // English lives once per Whiston section) so the translation reads continuously.
                const filteredRows = section.rows.filter(matchesSearch)
                  .filter(r => !(greekProse && proseMode === 'english') || !!r.english)
                if (q && filteredRows.length === 0) return null
                const noteBook = noteBookFor(work, section)
                const refLabel = refLabelFor(work, section)
                const notedKeys = notedMap[`${noteBook}.${section.chapter}`] ?? new Set<number>()
                return (
                  <div key={section.key} ref={el => { if (el) sectionRefs.current[section.key] = el }}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                      {blockHeadingFor(work, section)}
                    </p>
                    <div className="space-y-2">
                      {filteredRows.map(row => {
                        // The English/primary column's highlight layer (Greek works anchor on
                        // the Greek; translation-only works on the English). Greek-prose works
                        // (Josephus, Epictetus) highlight BOTH columns independently — the Greek
                        // on its own 'grc' layer (greekHighlights), the English on 'en'.
                        const layer = isGreek ? 'grc' : 'en'
                        const verseHighlights = highlights.forVerse(noteBook, section.chapter, row.num, layer)
                        const greekHighlights = greekProse ? highlights.forVerse(noteBook, section.chapter, row.num, 'grc') : verseHighlights
                        return (
                        <div key={row.num} ref={el => { if (el) verseRefs.current[`${section.key}.${row.num}`] = el }}
                          className={`grid gap-4 ${!greekHidden && englishColShown ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
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
                            <sup className="text-[10px] text-brand-500 mr-0.5 font-sans">{row.num}</sup>
                            {isGreek ? (
                              <span className="font-greek" style={{ fontSize: 'var(--tx-fs, 1.45rem)' }} {...verseAnchorProps(noteBook, section.chapter, row.num, layer)}>
                                {row.tokens && row.tokens.length > 0
                                  ? withTokenOffsets(row.tokens).map(({ token: tok, start, end }, ti) => {
                                      const key = `${section.key}.${row.num}.${ti}`
                                      const select = () => { setSelectedInfo(toLexicalInfo(tok, `${refLabel}:${row.num}`)); setSelectedKey(key) }
                                      const matched = !!q && tok.surface.toLowerCase().includes(q)
                                      const matchedTerm = !!termNorm && normalizeGreek(tok.surface).includes(termNorm)
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
                                                onPick: c => existing ? void highlights.recolor(existing.id, noteBook, section.chapter, c) : void highlights.create(noteBook, section.chapter, row.num, start, end, c, layer),
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
                              <span className="font-greek" style={{ fontSize: 'var(--tx-fs, 1.45rem)' }}
                                {...verseAnchorProps(noteBook, section.chapter, row.num, 'grc')}>
                                {q ? highlight(row.greek ?? '', search)
                                  : termHighlight ? highlight(row.greek ?? '', termHighlight, SEARCH_RED)
                                  : <GreekWords text={row.greek ?? ''} reference={`${refLabel}:${row.num}`}
                                      analyses={row.morph} selectedKey={selectedKey} keyBase={`${section.key}.${row.num}`}
                                      onPick={(pick, key) => {
                                        setSelectedInfo(pick ? { surface: pick.surface, lexeme: pick.lemma, gloss: '', partOfSpeech: '', parsing: pick.parsing, reference: `${refLabel}:${row.num}` } : null)
                                        setSelectedKey(key)
                                      }}
                                      hl={isAuthenticated ? { isAuthenticated, verseHighlights: greekHighlights,
                                        create: (s, e, c) => void highlights.create(noteBook, section.chapter, row.num, s, e, c, 'grc'),
                                        recolor: (id, c) => void highlights.recolor(id, noteBook, section.chapter, c),
                                        remove: id => void highlights.remove(id, noteBook, section.chapter) } : undefined} />}
                              </span>
                            ) : (
                              <span style={{ fontSize: 'var(--tx-fs, 1.45rem)' }} {...verseAnchorProps(noteBook, section.chapter, row.num, layer)}>
                                {q ? highlight(row.english ?? '', search)
                                  : termHighlight ? highlight(row.english ?? '', termHighlight, SEARCH_RED)
                                  : <TransWords text={row.english ?? ''} lang="en" reference={`${refLabel}:${row.num}`} book={noteBook}
                                      hl={isAuthenticated ? { isAuthenticated, verseHighlights,
                                        create: (s, e, c) => void highlights.create(noteBook, section.chapter, row.num, s, e, c, layer),
                                        recolor: (id, c) => void highlights.recolor(id, noteBook, section.chapter, c),
                                        remove: id => void highlights.remove(id, noteBook, section.chapter) } : undefined} />}
                              </span>
                            )}
                          </p>
                          )}

                          {/* Parallel English column — for lxx Greek works and greek-prose
                              works (Epictetus). For greek-prose this is the primary text, so
                              it carries the note/highlight anchor. In translation-only mode
                              (Greek hidden) it's the sole column and carries the note button. */}
                          {englishColShown && (
                            <p className={`font-reading leading-relaxed text-gray-600 ${greekHidden ? '' : 'lg:border-l lg:border-gray-100 lg:pl-4'}`} style={{ fontSize: 'var(--tx-fs, 1.45rem)' }}
                              {...(greekProse ? verseAnchorProps(noteBook, section.chapter, row.num, layer) : {})}>
                              {isAuthenticated && greekHidden && (
                                <span className="font-sans align-middle mr-0.5">
                                  <VerseNoteButton book={noteBook} chapter={section.chapter} verse={row.num} noted={notedKeys.has(row.num)}
                                    onChanged={() => refreshNotesFor(noteBook, section.chapter)} />
                                </span>
                              )}
                              <sup className="text-[10px] text-brand-500 mr-0.5 font-sans">{row.num}</sup>
                              {greekProse
                                ? (q ? highlight(row.english ?? '', search)
                                   : termHighlight ? highlight(row.english ?? '', termHighlight, SEARCH_RED)
                                   : <TransWords text={row.english ?? ''} lang="en" reference={`${refLabel}:${row.num}`} book={noteBook}
                                       hl={isAuthenticated ? { isAuthenticated, verseHighlights,
                                         create: (s, e, c) => void highlights.create(noteBook, section.chapter, row.num, s, e, c, layer),
                                         recolor: (id, c) => void highlights.recolor(id, noteBook, section.chapter, c),
                                         remove: id => void highlights.remove(id, noteBook, section.chapter) } : undefined} />)
                                : row.english
                                ? (q ? highlight(row.english, search)
                                   : termHighlight ? highlight(row.english, termHighlight, SEARCH_RED)
                                   : <TransWords text={row.english} lang="en" reference={`${refLabel}:${row.num}`} book={noteBook}
                                       hl={isAuthenticated ? { isAuthenticated, verseHighlights,
                                         create: (s, e, c) => void highlights.create(noteBook, section.chapter, row.num, s, e, c, layer),
                                         recolor: (id, c) => void highlights.recolor(id, noteBook, section.chapter, c),
                                         remove: id => void highlights.remove(id, noteBook, section.chapter) } : undefined} />)
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
        {(isGreek || greekProse) && !greekHidden && <ResizableParsingPane storageKey="texts" info={selectedInfo} bgClass="bg-gray-50" />}
      </div>

      {isAuthenticated && highlightSelection.popup && (
        <HighlightPopup
          state={highlightSelection.popup}
          onPick={color => {
            const state = highlightSelection.popup!
            if (state.kind === 'new') for (const s of state.splits) void highlights.create(s.book, s.chapter, s.verse, s.start, s.end, color, s.layer)
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
