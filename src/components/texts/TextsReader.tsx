'use client'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { MachineTranslationHint } from '@/components/texts/MachineTranslationHint'
import { translatable, greekText } from '@/lib/i18n/machine-translation'
import { Search, ChevronDown, MoreVertical, X, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { betaCodeToGreek } from '@/lib/greek-translit'
import { SEARCH_MARK } from '@/lib/highlight-terms'
import { normalizeGreek } from '@/lib/greek-utils'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { loadJastrow, lookupAramaic, strippedLabel, type JastrowData } from '@/lib/jastrow'
import { TEXT_CATEGORIES, findLxxWork, findJosephusWork, findWork, groupWorksByAuthor, type CatalogWork } from '@/lib/texts-catalog'
import { textCategoryLabel, textAuthorLabel } from '@/lib/i18n/text-names'
import { localizedWorkTitle, localizedWorkName } from '@/lib/i18n/text-catalog-labels'
import { getTextSummary } from '@/lib/texts-summaries'
import { useTc } from '@/lib/i18n/ContentProvider'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { effectiveReadingLang } from '@/lib/reading-language'
import { noteBookFor as sharedNoteBookFor } from '@/lib/note-book'
import { themesCiting, type ThemeBacklink } from '@/lib/theme-backlinks'
import { findProseWork } from '@/lib/prose-texts'
import { FONT_SIZES, type PhraseFontSize } from '@/components/phrase/PhraseExplorer'
import { TextSizeSlider } from '@/components/reader/TextSizeControls'
import { usePref } from '@/lib/use-pref'
import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'
import { openWordSearch } from '@/lib/word-search-bus'
import type { BgHit, BgLang } from '@/lib/backgrounds-search-types'
import { openBackgroundsSearch } from '@/lib/backgrounds-search-bus'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { useHighlights } from '@/components/highlights/useHighlights'
import { useHighlightSelection } from '@/components/highlights/useHighlightSelection'
import { HighlightPopup } from '@/components/highlights/HighlightPopup'
import { TouchHighlighter } from '@/components/highlights/TouchHighlighter'
import { DEUTERO_ES_BOOKS, ES_PROSE_WORKS, ES_ENGLISH_PROSE_WORKS, OUR_SPANISH_IDS } from '@/lib/spanish-texts'
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
// `ref` is the work's standard scholarly reference for the verse when it differs from the plain
// number — Plato's Stephanus page+letter ("172a"), Aristotle's Bekker number ("1094a"),
// Plutarch's Moralia Stephanus page ("351c"). Shown as the verse marker and used in citations;
// `num` stays the stable integer that anchors notes/highlights.
type Row = { num: number; ref?: string; tokens?: WordToken[]; greek?: string; english?: string; morph?: MorphEntry[]; heading?: string }

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

// brenton/ is the MECHANISM by which an LXX work gets English — a side-file keyed by osisId — and
// NOT a claim about who translated it. Brenton did not translate either of the works below (the
// Psalms of Solomon and the Odes are absent from his 1851 Septuagint), so naming him on their
// English would be a false attribution. They name their own translator instead.
const ENGLISH_BY_WORK: Record<string, { label: string; attribution: string; gapNote?: string }> = {
  PsSol: {
    label: 'Gray (1913)',
    attribution: 'English: G. Buchanan Gray’s translation in R. H. Charles, ed., “The Apocrypha and '
      + 'Pseudepigrapha of the Old Testament in English” (Oxford, 1913); public domain. Verses are '
      + 'numbered in the standard versification, not Gray’s own line numbering.',
  },
  Odes: {
    label: 'King James (1611)',
    attribution: 'English: the Prayer of Manasseh (Ode 12) in the Authorised (King James) Version '
      + 'of 1611, Apocrypha; public domain. The other Odes are canticles quoted from books that can '
      + 'be read in English elsewhere in this library, and appear here in Greek only.',
    gapNote: 'This Ode is a canticle quoted from the Old Testament, and is read in English there. '
      + 'Only Ode 12, the Prayer of Manasseh, is not a quotation, and it is the one carrying English here.',
  },
}

// Books where Swete prints the Old Greek and not Theodotion — the recension behind every
// printed Bible a student is likely to own. See reader.oldGreekNote.
const OLD_GREEK_BOOKS = new Set(['Sus', 'Bel'])

// The parallel translations available for a work. A work only gets a selector once it has more
// than one option — a single column needs no menu, which is why most works still return [].
function translationsFor(w: CatalogWork | null, t: (k: string, v?: Record<string, string>) => string): { id: string; label: string }[] {
  if (!w) return []
  const out: { id: string; label: string }[] = []
  if (w.source === 'lxx') {
    if (w.english) {
      const own = w.osisId ? ENGLISH_BY_WORK[w.osisId] : undefined
      out.push({ id: w.english, label: own?.label ?? TRANSLATION_LABELS[w.english] ?? w.english })
    }
    if (w.osisId && DEUTERO_ES_BOOKS.has(w.osisId)) {
      out.push({ id: 'deutero-es', label: t('texts.spanishOurs') })
    }
    return out
  }
  // greekOnly works (the Greek Sibylline) have no second column worth offering — its Latin
  // covers one acrostic — so they keep their previous behaviour of no column control at all.
  if (w.greek && !w.greekOnly) {
    // Every other Greek prose work offers its own published second column; only some also have ours.
    // Listing it even when it is the only option is what lets a single menu carry the whole
    // choice — original / original + translation / translation alone — instead of two menus that
    // could disagree with each other, as they did: picking Spanish in one left the other still
    // offering "+ English".
    const en = PROSE_ENGLISH_LABELS[w.id]
    out.push({ id: 'source', label: en ? t('texts.englishBy', { who: en })
      : w.secondaryLabel ?? t('texts.englishCol') })
    // ES_ENGLISH_PROSE_WORKS as well as ES_PROSE_WORKS: a work is in one or the other by how it
    // is ADDRESSED (book+§ vs chapter+verse), not by whether it has a Greek column. The
    // Testaments of the Twelve Patriarchs and the Testament of Job carry verse-level Greek and
    // are still chapter+verse works, so they load by the chapter route while landing here.
    if (ES_PROSE_WORKS[w.id] || ES_ENGLISH_PROSE_WORKS[w.id]) out.push({ id: 'es', label: t('texts.spanishOurs') })
    return out
  }
  // English-only prose that has our Spanish: same one-menu shape, but the first column is the
  // published English rather than the original, because there is no original to show.
  if (ES_ENGLISH_PROSE_WORKS[w.id]) {
    out.push({ id: 'source', label: w.secondaryLabel ?? t('texts.englishCol') })
    out.push({ id: 'es', label: t('texts.spanishOurs') })
  }
  return out
}

// Who translated the English a prose work ships with — named so the selector never implies our
// Spanish and the published English come from the same hand.
//
// The label leads with the COLUMN, not the translator. "Whiston (1737)" alone sits beside a
// layout control reading "Greek + English" and reads as though Whiston governs the whole pane,
// Greek included — which he does not: the Greek is Niese's, and Whiston never made a Greek text.
// Naming the column makes the Greek's absence from this control deliberate rather than ambiguous.
const PROSE_ENGLISH_LABELS: Record<string, string> = { antiquities: 'Whiston (1737)' }

const FONT_SIZE_MAP: Record<string, string> = { sm: '1.05rem', md: '1.25rem', lg: '1.45rem', xl: '1.7rem', '2xl': '2.1rem', '3xl': '2.6rem' }
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

// Every chapter of a work, in reading order — for Josephus that spans all its books.
function buildQueue(w: CatalogWork): QueueItem[] {
  if (w.source === 'josephus') {
    const out: QueueItem[] = []
    w.books!.forEach((count, bi) => { for (let c = 1; c <= count; c++) out.push({ book: bi + 1, chapter: c }) })
    return out
  }
  // Most works run 1..chapters; a few (Sibylline, Life of Adam and Eve, 3 Baruch) have gaps
  // and declare their real numbers, so we never queue a chapter that has no text.
  if (w.chapterNumbers?.length) return w.chapterNumbers.map(chapter => ({ chapter }))
  return Array.from({ length: w.chapters ?? 1 }, (_, i) => ({ chapter: i + 1 }))
}
function sameItem(a: QueueItem, book: number | undefined, chapter: number) {
  return a.chapter === chapter && (a.book ?? null) === (book ?? null)
}
// Delegates to the shared resolver so a note made here and one made from a search result
// land on the same key. See src/lib/note-book.ts.
function noteBookFor(w: CatalogWork, item: QueueItem): string {
  return sharedNoteBookFor(w.source, { osisId: w.osisId, workDir: w.work, book: item.book })
    ?? `${JOS_SHORT[w.work!] ?? w.work}.${item.book}`
}
function refLabelFor(w: CatalogWork, item: QueueItem): string {
  // Callers append `:${section}`, so Josephus reads "<name> <book>:<§>" (pure Niese, e.g.
  // "Antiquities 1:120") — the Whiston chapter is no longer part of the citation.
  return w.source === 'josephus' ? `${w.name} ${item.book}` : `${w.name} ${item.chapter}`
}

// Heading over each rendered block. Josephus is pure Niese — show the § span the block covers
// (prefixed with its book, for multi-book works) instead of the internal Whiston chapter.
// Works with a second, structural numbering (Hermas) head each chapter with its traditional
// reference ("Vision 3.6 · Ch. 14") so both citation systems stay visible.
function blockHeadingFor(w: CatalogWork, block: ChapterBlock, t: (k: string, v?: Record<string, string | number>) => string): string {
  if (w.source === 'josephus') {
    const nums = block.rows.map(r => r.num)
    const span = nums.length === 0 ? ''
      : nums[0] === nums[nums.length - 1] ? `§${nums[0]}`
      : `§§${nums[0]}–${nums[nums.length - 1]}`
    return w.books!.length > 1 ? t('texts.bookSpan', { n: block.book ?? '', span }) : span
  }
  // chapterLabel returns the complete heading (each work formats its own — Hermas appends the
  // continuous chapter, Eusebius names its preface); default to "Chapter N".
  // A work's own chapterLabel is authored data (Hermas' double numbering, Eusebius' preface)
  // and stays as written; only the generic default is a UI string.
  return findProseWork(w.source)?.chapterLabel?.(block.chapter) ?? t('texts.chapterN', { n: block.chapter })
}

interface TextsReaderProps {
  isAuthenticated?: boolean
  fontSize?: PhraseFontSize
  onFontSize?: (v: PhraseFontSize) => void
  onAttribution?: (a: string) => void
  // Set (with a bumped token) when another tab hands off a reference via "Open in Texts".
  openRequest?: { target: OpenInTextsTarget; token: number } | null
  // Standalone /texts page: open this work's id on mount (from the header Texts menu / ?work=).
  initialWorkId?: string
}


// One download per data file per session. Chapter loading used to re-fetch the WORK's whole
// JSON for every chapter it appended — opening a tractate downloaded the same file three
// times before the first scroll, and once more per chapter after that. The cache stores the
// in-flight promise, so parallel chapter loads share one request rather than racing three.
const workFileCache = new Map<string, Promise<unknown | null>>()
function fetchWorkJson(url: string): Promise<unknown | null> {
  let p = workFileCache.get(url)
  if (!p) {
    p = fetch(url).then(r => (r.ok ? r.json() : null)).catch(() => null)
    // A failed download must not poison the session — retry next time.
    p.then(d => { if (d === null) workFileCache.delete(url) })
    workFileCache.set(url, p)
  }
  return p
}

export function TextsReader({ isAuthenticated = false, fontSize: controlledFontSize, onFontSize, onAttribution, openRequest, initialWorkId }: TextsReaderProps) {
  // The Summary popover's five sections are curated content; the popover's own furniture is
  // chrome. Both fall back to English, so an untranslated work reads as English rather than
  // showing nothing.
  const tc = useTc()
  const t = useT()
  const locale = useLocale()
  const SUMMARY_HEADING_SLUG: Record<string, string> = {
    'Authorship': 'authorship', 'Historical Context': 'context', 'Contents': 'contents',
    'Theological Significance': 'significance', 'Relationship to New Testament': 'nt',
  }
  const headingSlug = (h: string) => SUMMARY_HEADING_SLUG[h] ?? h.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const summaryHeading = (h: string) => tc(`summary.heading.${headingSlug(h)}`, h)
  // Keyed by THIS work's id: several catalog works share a summary, and the build fans the one
  // translation out to every id that uses it, so the lookup here never has to know that.
  const summaryBody = (workId: string, heading: string, body: string) =>
    tc(`summary.${workId}.${headingSlug(heading)}`, body)

  const isFontSizeControlled = onFontSize !== undefined
  const [internalFontSize, pickFontSize] = usePref<PhraseFontSize>('texts-font-size', FONT_SIZES, 'lg')
  const fontSize = isFontSizeControlled ? (controlledFontSize ?? 'lg') : internalFontSize
  // Standalone /texts owns its size (no controlling parent), so it gets the same ⋮
  // display-options popover as the Reader/Search, remembered on this device.
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false)
  const displayMenuRef = useRef<HTMLDivElement | null>(null)

  const [work, setWork] = useState<CatalogWork | null>(null)
  // The single "Texts" dropdown (replaced the row of category chips to give the reading panes
  // more height): menuOpen shows the category list; menuCat drills into one category's works.
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuCat, setMenuCat] = useState<string | null>(null)
  // Drill level inside a category: an author whose works are being listed (e.g. Plato → its
  // dialogues). null = show the author list itself. Only used for categories that group by author.
  const [menuAuthor, setMenuAuthor] = useState<string | null>(null)
  // "Locate a passage" cascade, opened by clicking the work title (like the translation
  // menus). Columns are Book (Josephus multi-book works only) → Chapter → Verse; each new
  // column appears to the right with its first row aligned to the selected row of the one
  // before it. Click-based (not hover) so it doesn't fight the mouse as you reach across.
  const [locateOpen, setLocateOpen] = useState(false)
  const [locateBook, setLocateBook] = useState(1)
  const [locateChapter, setLocateChapter] = useState<number | null>(null)
  // The chapter the reader is actually looking at, for the "read alongside" link. Derived
  // by writePositionToUrl, which already works this out from the scroll position for the
  // URL — mirroring it here avoids a second, subtly different notion of "where am I".
  const [currentChapter, setCurrentChapter] = useState<number | null>(null)
  const [locateVerseNums, setLocateVerseNums] = useState<{ num: number; ref?: string }[] | null>(null)
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
  // fetchChapterRows is a useCallback the queue holds across renders, so it must read the
  // CURRENT choice rather than the one captured when it was created.
  const translationIdRef = useRef<string | null>(null)
  useEffect(() => { translationIdRef.current = translationId }, [translationId])
  // Switching translation has to REFETCH what is already on screen: the parallel text is baked
  // into Row.english when the chapter loads, not read at render. Until Spanish was offered no
  // work had two options, so a switch was impossible and nothing invalidated the rows — picking
  // Spanish left Brenton's English sitting in the column.
  const lastTransSigRef = useRef('')
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
  const deuteroEsCache = useRef<Record<string, Record<string, string>>>({})
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
  // Whole-work search (Enter). Typing still live-highlights the loaded text; pressing Enter
  // queries the prebuilt background index for THIS work, so a term anywhere in a twenty-book
  // work is findable from the reader rather than only in the chapters already scrolled past.
  const [workHits, setWorkHits] = useState<BgHit[] | null>(null)
  const [workSearching, setWorkSearching] = useState(false)
  const [workSearchTerm, setWorkSearchTerm] = useState('')
  const locateMenuRef = useRef<HTMLDivElement>(null)
  const translationMenuRef = useRef<HTMLDivElement>(null)
  // Whether the "Summary" popover is open, and its anchor. (A "Contents" popover was removed;
  // it will be reworked later.)
  const [infoPanel, setInfoPanel] = useState<'summary' | null>(null)
  const infoMenuRef = useRef<HTMLDivElement>(null)
  const workRef = useRef(work); useEffect(() => { workRef.current = work }, [work])
  // The open work's background collection (category id + label) — passed to the word menu so a
  // right-click searches this collection (bg:<id>) rather than the Bible (the words aren't in a
  // Bible book). null while no work is open.
  const bgCollection = useMemo(() => {
    if (!work) return undefined
    const cat = TEXT_CATEGORIES.find(c => c.works.some(w => w.id === work.id))
    return cat ? { id: cat.id, label: cat.label } : undefined
  }, [work])
  const queueRef = useRef(queue); useEffect(() => { queueRef.current = queue }, [queue])
  const seriesRef = useRef(series); useEffect(() => { seriesRef.current = series }, [series])
  const loadingRef = useRef(false)
  const backLoadingRef = useRef(false)

  // Full-height tool page: hide the marketing footer while the reader is mounted so its height
  // doesn't push the layout past the viewport — which would let the whole body scroll and carry
  // the controls row (Texts picker, work title, search) up under the sticky header. Mirrors
  // ExegesisTabs' html[data-exegesis] and the reader's html[data-reader]. See globals.css.
  useEffect(() => {
    document.documentElement.setAttribute('data-texts', 'on')
    return () => document.documentElement.removeAttribute('data-texts')
  }, [])

  const isGreek = work?.source === 'lxx'
  // A prose work that carries the original Greek per verse (e.g. Epictetus) — shown in a
  // parallel Greek | English layout, distinct from the word-parsed lxx Greek path.
  const greekProse = !!work?.greek
  // The Talmud Bavli's Aramaic occupies the same "original text" slot as a Greek prose work,
  // but reads right-to-left in a Hebrew face, and its words must not go through the Greek
  // tokeniser (which normalises Greek diacritics and offers Greek lexicon lookups).
  const hebrewProse = work?.script === 'hebrew'
  // Jastrow's dictionary, fetched once when a Talmud word is first consulted.
  const [jastrow, setJastrow] = useState<JastrowData | null>(null)
  useEffect(() => {
    if (hebrewProse && !jastrow) loadJastrow().then(setJastrow).catch(() => {})
  }, [hebrewProse, jastrow])

  /** A Talmud word's Jastrow candidates, shaped for the shared parsing pane. */
  const jastrowInfo = useCallback((word: string, reference: string): LexicalInfoPanel => {
    const hits = lookupAramaic(jastrow, word)
    if (hits.length === 0) {
      return { surface: word, lexeme: '', gloss: jastrow ? t('bg.noJastrow') : t('bg.loadingJastrow'),
               partOfSpeech: '', parsing: '', reference, script: 'hebrew' }
    }
    const first = hits[0]
    // Anything that needed a prefix or ending removed is a CANDIDATE, and says so: the text
    // carries no morphology, so the split is our guess rather than Jastrow's analysis.
    const label = strippedLabel(first)
    const others = hits.slice(1, 4).map(h => `${h.headword}${strippedLabel(h) ? ` (${strippedLabel(h)})` : ''} — ${h.entry.s[0] ?? ''}`)
    return {
      surface: word,
      lexeme: first.headword,
      gloss: first.entry.s[0] ?? '',
      partOfSpeech: first.entry.m ?? '',
      parsing: first.inferred ? `possible reading: ${label}` : 'Jastrow entry',
      reference,
      script: 'hebrew',
      definition: first.entry.s.slice(1).join(' · ') || undefined,
      bdbDefinition: others.length ? `Other possibilities: ${others.join('  |  ')}` : undefined,
    }
  }, [jastrow])
  // A Greek-only prose work (no translation shipped, e.g. Philostratus, Aratus,
  // Marcus Aurelius) is always shown Greek-only — even if a previously-open work
  // left proseMode on 'both' — and its mode selector is hidden, since there is
  // no second column to switch to. Derived so it can never get stuck showing an
  // empty English column.
  const greekOnlyWork = !!work?.greekOnly
  const proseModeEff = greekOnlyWork ? 'greek' : proseMode
  // The first ("original") column is Greek for almost everything, but Latin for Quintilian.
  // primaryLabel names it in the mode selector and the search box; it also turns off the
  // QWERTY→Greek Beta-Code transliteration, which would garble a Latin query.
  // Column names are localised: the catalog stores them in English because that is the language
  // of the code, but a Spanish reader must not meet "Greek + English" in an otherwise Spanish
  // interface. Only the non-default names (Latin, Aramaic) pass through as written.
  const primaryLabel = work?.primaryLabel ?? t('texts.greekCol')
  const primaryIsGreek = primaryLabel === 'Greek'
  const availableTranslations = translationsFor(work, t)
  // Whether a second column exists at all. For lxx works that means "any translation is on
  // offer", not "a published English exists": LXX Daniel has no English here at all (Brenton's
  // Daniel is Theodotion, a different text), so ours is its only second column, and keying this
  // off work.english left the menu offering a Spanish that could never render.
  const hasEnglish = work ? (work.source === 'lxx' ? availableTranslations.length > 0 : true) : false
  const showEnglish = translationId !== null
  // Greek-hidden (English-only): an lxx work with its translation showing, or a greek-prose
  // work whose mode is 'english'.
  const greekHidden = (greekHiddenPref && isGreek && showEnglish) || (greekProse && proseModeEff === 'english')
  // Whether the parallel English column is rendered at all.
  const englishColShown = (isGreek && showEnglish && hasEnglish) || (greekProse && proseModeEff !== 'greek')
  // The second column is English for most prose works, but Latin for the Greek Sibylline
  // (Augustine's rendering of the Book 8 acrostic).
  const secondLabel = work?.secondaryLabel ?? t('texts.englishCol')
  // The layout control is the only one that speaks for the Greek column, so it names the edition
  // where the work has one to name. Nothing else on screen says whose Greek this is.
  const primaryNamed = work?.greekEdition ? `${primaryLabel} (${work.greekEdition})` : primaryLabel
  const translationLabel = translationId
    ? (availableTranslations.find(t => t.id === translationId)?.label ?? t('texts.translationFallback'))
    : null
  const currentTranslationLabel = greekProse
    ? (proseModeEff === 'greek' ? t('texts.onlyLabel', { label: primaryNamed })
      : proseModeEff === 'english' ? t('texts.onlyLabel', { label: translationLabel ?? secondLabel })
      : t('texts.greekPlus2', { primary: primaryNamed, lang: translationLabel ?? secondLabel }))
    : !isGreek
    ? (translationLabel ?? '')
    : !translationId
      ? t('texts.greekOnly')
      : greekHidden
        ? t('texts.langOnly', { lang: translationLabel ?? '' })
        : t('texts.greekPlus', { lang: translationLabel ?? '' })

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
  // Beta-Code (QWERTY→Greek) transliteration only makes sense when the primary column really
  // is Greek — a Latin work (Quintilian) searches its text as typed.
  const greekTyping = searchLang === 'grc' && greekSearchable && primaryIsGreek
  // The LANGUAGE actually rendered in the translation column. Everything downstream that has to
  // name it — the word spans' `lang`, the right-click menu's search facet, this reader's own
  // search box — used to assume English, so a reader with the Spanish column open searched (and
  // right-clicked into) an English text they weren't looking at, and found nothing.
  const transLang = translationId && OUR_SPANISH_IDS.has(translationId) ? 'es' : 'en'
  // The highlight layer for the translation column. It has to name the EDITION, not just the
  // language, wherever two surfaces can show DIFFERENT English for the same verse: /texts shows
  // the Septuagint's own Brenton, while the Reader's English column is the World English Bible,
  // and both used to write 'en' — so a highlight made in one landed at the wrong offsets in the
  // other. A prose work keeps 'en' because it has exactly one English, so the language names it
  // unambiguously. Spanish stays 'es' on purpose: for the deuterocanon the Reader serves OUR
  // Spanish too (readDeuteroEs wins before Reina-Valera in /api/translation), so the two surfaces
  // are showing the same string and should share the layer.
  const transLayer = transLang !== 'en' ? transLang
    : (work?.source === 'lxx' && work.english) ? work.english : 'en'
  // The library-index facet that matches what's on screen (see backgrounds-search-<lang>.json.gz).
  const searchFacet: BgLang = searchLang === 'grc' ? 'grc' : transLang

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

  /** Enter: search the WHOLE open work through the prebuilt index. */
  async function runWorkSearch() {
    const q0 = search.trim()
    if (!work || q0.length < 2) return
    setSuggestOpen(false)
    setWorkSearching(true)
    setWorkSearchTerm(q0)
    try {
      const r = await fetch(`/api/search/backgrounds?q=${encodeURIComponent(q0)}&work=${encodeURIComponent(work.id)}&lang=${searchFacet}`)
      const d = await r.json()
      // One work = at most one group; take its hits (empty array, not null, so the panel
      // can say "nothing in this work" rather than staying invisible).
      setWorkHits((d.groups?.[0]?.hits ?? []) as BgHit[])
    } catch {
      setWorkHits([])
    } finally {
      setWorkSearching(false)
    }
  }

  /** Click a whole-work hit: jump the reader to it and highlight the term in place. */
  function goToWorkHit(hit: BgHit) {
    if (!work) return
    const tg = hit.target
    lastOpenRequestAt.current = Date.now()
    setWorkHits(null)
    setTermHighlight(workSearchTerm)
    setSearch('')                       // stop the find-on-page filter hiding the target
    setLocateBook(tg.book ?? 1)
    setLocateChapter(tg.chapter)
    setCurrentChapter(tg.chapter)
    void openAt(work, tg.book, tg.chapter, tg.verse)
    if (work.source === 'josephus') loadLocateSections(work, tg.book ?? 1)
    else loadLocateVerses(work, tg.book, tg.chapter)
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

  // Close the display-options (text size) popover on an outside click.
  useEffect(() => {
    if (!displayMenuOpen) return
    function onMouseDown(e: MouseEvent) {
      if (displayMenuRef.current && !displayMenuRef.current.contains(e.target as Node)) setDisplayMenuOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [displayMenuOpen])

  // Close the Texts dropdown on an outside click.
  useEffect(() => {
    if (!menuOpen) return
    function onMouseDown(e: MouseEvent) {
      if (catRowRef.current && !catRowRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [menuOpen])

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
    const parts = work.source === 'lxx' ? ['Greek text: Swete’s Septuagint (Cambridge, 1887–1912) via nathans/lxx-swete and First1KGreek (CC BY-SA 4.0); morphology machine-generated. Nestle 1904 is public domain.'] : []
    const ownEnglish = work.osisId ? ENGLISH_BY_WORK[work.osisId] : undefined
    if (work.english === 'brenton') parts.push(ownEnglish?.attribution
      ?? 'English: Brenton’s 1851 English Septuagint (public domain).')
    if (work.english === 'bsb') parts.push('English: the Berean Standard Bible (public domain).')
    const prose = findProseWork(work.source)
    if (prose) parts.push(prose.attribution)
    if (work.source === 'josephus') parts.push('Greek: B. Niese’s edition (1885–1895); English: William Whiston’s translation (1737); both public domain. Sections numbered per Niese. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.')
    // The one text here with no published edition behind it, because we made it — so it says so
    // whenever it is the column being read.
    if (translationId && OUR_SPANISH_IDS.has(translationId)) parts.push(t('texts.spanishOursCredit'))
    if (work.osisId && OLD_GREEK_BOOKS.has(work.osisId)) {
      parts.push(t('reader.oldGreekNote'))
      if (translationId === 'brenton') parts.push(t('reader.oldGreekBrenton'))
    }
    onAttribution?.(parts.join(' '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [work, translationId, onAttribution])

  /** Our Spanish for one deuterocanonical chapter. Missing chapters resolve to {} — the column
   *  is simply blank for anything not yet translated, as it is for a Brenton gap. */
  async function loadDeuteroEs(osisId: string, chapter: number): Promise<Record<string, string>> {
    const key = `${osisId}.${chapter}`
    if (deuteroEsCache.current[key]) return deuteroEsCache.current[key]
    const r = await fetch(`/data/deutero-es/${osisId}_${chapter}.json`)
    const d = r.ok ? await r.json() as { verses?: Record<string, string> } : {}
    const out: Record<string, string> = {}
    for (const [n, text] of Object.entries(d.verses ?? {})) out[`${osisId}.${chapter}.${n}`] = text
    deuteroEsCache.current[key] = out
    return out
  }

  /** Our Spanish for one book of a prose work, keyed by the section number the reader shows
   *  (Niese §§ for Josephus). Missing books resolve to {} and leave the column blank. */
  async function loadProseEs(workId: string, book: number): Promise<Record<string, string>> {
    const dir = ES_PROSE_WORKS[workId]
    if (!dir) return {}
    const key = `${workId}.${book}`
    if (deuteroEsCache.current[key]) return deuteroEsCache.current[key]
    const r = await fetch(`/data/es/${dir}/${book}.json`)
    const d = r.ok ? await r.json() as { sections?: Record<string, string> } : {}
    deuteroEsCache.current[key] = d.sections ?? {}
    return deuteroEsCache.current[key]
  }

  async function loadEnglishProseEs(workId: string, chapter: number): Promise<Record<string, string>> {
    const dir = ES_ENGLISH_PROSE_WORKS[workId]
    if (!dir) return {}
    const key = `enprose-es.${workId}.${chapter}`
    if (deuteroEsCache.current[key]) return deuteroEsCache.current[key]
    const r = await fetch(`/data/es/${dir}/${chapter}.json`)
    const d = r.ok ? await r.json() as { verses?: Record<string, string> } : {}
    deuteroEsCache.current[key] = d.verses ?? {}
    return deuteroEsCache.current[key]
  }

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
      // Which side-file fills the parallel column depends on what the reader PICKED, not on
      // the work's default English — Spanish is a second option on the same works.
      if (translationIdRef.current === 'deutero-es') eng = await loadDeuteroEs(w.osisId!, item.chapter!)
      else if (w.english === 'brenton') eng = await loadBrenton(w.osisId!)
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
      const d = await fetchWorkJson(`/data/josephus/${w.work}/${item.book}.json`) as { chapters?: { number: number; sections?: { number: number; text: string; greek?: string }[] }[] } | null
      const ch = d?.chapters?.find((c: { number: number }) => c.number === item.chapter)
      const morph = await loadMorph(w.work!, item.book!)
      // Our Spanish is keyed by § and so lines up section-for-section with the Greek, unlike
      // Whiston's English, which is attached once per Whiston section (its first §).
      const es = translationIdRef.current === 'es' ? await loadProseEs(w.id, item.book!) : null
      // Niese §§ carry parallel Greek; the Whiston English is attached once per Whiston
      // section (its first §), so most §§ have Greek only in the English column.
      return (ch?.sections ?? []).map((s: { number: number; text: string; greek?: string }) =>
        ({ num: s.number, english: es ? es[String(s.number)] : s.text, greek: s.greek, morph: morph?.[String(s.number)] }))
    }
    // 2 Esdras / 1 Enoch / Jubilees / 2 Baruch / 2 Enoch — plain English prose stored as
    // chapter→verses; the registry knows where each one's JSON lives.
    const d = await fetchWorkJson(findProseWork(w.source)!.dataUrl) as { chapters?: { number: number; verses?: { number: number; ref?: string; text: string; greek?: string; heading?: string }[] }[] } | null
    const ch = d?.chapters?.find((c: { number: number }) => c.number === item.chapter)
    const morph = await loadProseMorph(w)
    const enEs = translationIdRef.current === 'es' ? await loadEnglishProseEs(w.id, item.chapter!) : null
    return (ch?.verses ?? []).map((v: { number: number; ref?: string; text: string; greek?: string; heading?: string }) =>
      ({ num: v.number, ref: v.ref, english: enEs ? (enEs[String(v.number)] ?? v.text) : v.text, greek: v.greek, heading: v.heading, morph: morph?.[`${item.chapter}.${v.number}`] }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function keyFor(item: QueueItem): string {
    return `${item.book ?? ''}.${item.chapter}`
  }
  function blockFor(item: QueueItem, rows: Row[]): ChapterBlock {
    return { key: keyFor(item), book: item.book, chapter: item.chapter, rows }
  }

  useEffect(() => {
    const workKey = work?.osisId ?? ''
    const sig = `${workKey}|${translationId ?? ''}`
    const prev = lastTransSigRef.current
    lastTransSigRef.current = sig
    // A new work already fetched its rows with the right translation on open; only re-run when
    // the choice changed WITHIN the same work.
    if (!prev || prev.split('|')[0] !== workKey) return
    const w = workRef.current
    const secs = seriesRef.current.sections
    if (!w || secs.length === 0) return
    let cancelled = false
    void (async () => {
      const rows = await Promise.all(secs.map(sec => fetchChapterRows(w, { book: sec.book, chapter: sec.chapter })))
      if (cancelled) return
      setSeries(cur => ({
        ...cur,
        sections: cur.sections.map((sec, i) => (rows[i] ? { ...sec, rows: rows[i] } : sec)),
      }))
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationId, work])

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
      // Skip a chapter already on screen. Forward loading walks queueIdx down while backward
      // loading walks backIdx up, and the two are guarded independently — so when they meet in
      // the middle both can claim the same item and render it twice, giving React two children
      // with the same key (e.g. ".12") and licensing it to drop or duplicate a chapter.
      sections: prev.sections.some(s => s.key === keyFor(item))
        ? prev.sections
        : [...prev.sections, blockFor(item, rows)],
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
      // Same guard as loadMore, from the other end.
      sections: prev.sections.some(s => s.key === keyFor(item))
        ? prev.sections
        : [blockFor(item, rows), ...prev.sections],
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
    setCurrentChapter(chapter)
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
  // The row CONTAINING a numbered unit that isn't itself a row. Line-cited poetry (Homer,
  // Hesiod) is stored as line groups labelled with the group's first line, so only a line
  // that opens a group has a row of its own — "Il. 6.146" would otherwise find nothing and
  // fall back to the top of the book. Snap to the nearest preceding unit instead, which is
  // the group the line sits in. Works with exact-numbered texts too: they simply hit the
  // exact key first and never reach this.
  const containingUnit = (targetKey: string, verse: number): HTMLElement | null => {
    const prefix = `${targetKey}.`
    let best = -1, el: HTMLElement | null = null
    for (const [k, node] of Object.entries(verseRefs.current)) {
      if (!k.startsWith(prefix) || !node) continue
      const n = parseInt(k.slice(prefix.length), 10)
      if (Number.isFinite(n) && n <= verse && n > best) { best = n; el = node }
    }
    return el
  }

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
      const vTarget = verse != null
        ? verseRefs.current[`${targetKey}.${verse}`] ?? containingUnit(targetKey, verse)
        : null
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
      setLocateVerseNums(rows.map(r => ({ num: r.num, ref: r.ref })))
    }).catch(() => { if (fetchTokenRef.current === token) setLocateVerseNums([]) })
  }

  // Josephus: load a whole book's Niese §§ in one fetch (the JSON is stored per book), keeping
  // each §'s home chapter so selecting a § can open the right chapter. Fills the single § column.
  function loadLocateSections(w: CatalogWork, book: number) {
    setLocateSections(null)
    const token = ++fetchTokenRef.current
    const filePromise = fetchWorkJson(`/data/josephus/${w.work}/${book}.json`) as Promise<{ chapters?: { number: number; sections?: { number: number }[] }[] } | null>
    filePromise
      .then(d => {
        if (fetchTokenRef.current !== token) return
        const secs: { n: number; chapter: number }[] = []
        for (const ch of d?.chapters ?? [])
          for (const s of ch.sections ?? []) secs.push({ n: s.number, chapter: ch.number })
        setLocateSections(secs)
      })
      .catch(() => { if (fetchTokenRef.current === token) setLocateSections([]) })
  }

  /**
   * Which parallel column a work should OPEN with. Our own Spanish leads for a reader who reads
   * in Spanish, matching the Bible reader — which has always opened on the Spanish edition
   * rather than showing English first (see effectiveReadingLang). Works with no Spanish of ours
   * are unaffected, and an explicit reading-language choice still wins over the interface
   * language, so "I read in English" survives a Spanish interface.
   *
   * Read from the cookie at the moment of opening rather than through the hook: the hook resolves
   * in an effect, which lands a render too late for the ?work= open on first paint.
   */
  function initialTranslationFor(w: CatalogWork): string | null {
    const options = translationsFor(w, t)
    if (effectiveReadingLang(locale) === 'es') {
      const ours = options.find(o => OUR_SPANISH_IDS.has(o.id))
      if (ours) return ours.id
    }
    return options[0]?.id ?? null
  }

  function openWork(w: CatalogWork) {
    setWork(w); setTranslationId(initialTranslationFor(w)); setMenuOpen(false); setGreekHiddenPref(false); setProseMode(w.greekOnly ? 'greek' : 'both')
    setLocateBook(1); setLocateChapter(1); setCurrentChapter(1)
    setTermHighlight(null)
    void openAt(w, w.source === 'josephus' ? 1 : undefined, 1)
    if (w.source === 'josephus') loadLocateSections(w, 1)
    else loadLocateVerses(w, undefined, 1)
  }

  // Standalone /texts page: open the work named by ?work= (the header Texts menu links here).
  // Runs once; a later menu pick just calls openWork directly. openRequest (a Backgrounds
  // hand-off with a position) takes precedence when both are present.
  useEffect(() => {
    if (!initialWorkId || openRequest) return
    const found = findWork(initialWorkId)
    if (found) openWork(found.work)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWorkId])

  // "Open in Texts" hand-off from another tab (e.g. Backgrounds' cross-reference pane).
  useEffect(() => {
    if (!openRequest) return
    lastOpenRequestAt.current = Date.now()   // see writePositionToUrl
    const { target } = openRequest
    const w = target.source === 'lxx' ? findLxxWork(target.osisId!)
      : target.source === 'josephus' ? findJosephusWork(target.workDir!)
      : TEXT_CATEGORIES.flatMap(c => c.works).find(x => x.source === target.source)
    if (!w) return
    // Open in the column the hand-off asked for — our Spanish when the hit came from a Spanish
    // search — else the work's first (published) translation, as before. Landing a Spanish hit
    // in the English column shows a page that doesn't contain the words that were clicked.
    const options = translationsFor(w, t)
    const wanted = target.lang === 'es' ? options.find(o => OUR_SPANISH_IDS.has(o.id))?.id : undefined
    setWork(w); setTranslationId(wanted ?? initialTranslationFor(w)); setMenuOpen(false); setGreekHiddenPref(false); setProseMode(w.greekOnly ? 'greek' : 'both')
    setLocateBook(target.book ?? 1); setLocateChapter(target.chapter); setCurrentChapter(target.chapter)
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
    setLocateBook(book); setLocateChapter(1); setCurrentChapter(1)
    void openAt(work, book, 1)
    // The Book column only exists for Josephus, which now goes straight to a whole-book § list.
    if (work.source === 'josephus') loadLocateSections(work, book)
    else loadLocateVerses(work, book, 1)
  }

  function selectLocateChapter(chapter: number) {
    if (!work) return
    setLocateChapter(chapter); setCurrentChapter(chapter)
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
  type LocateItem = { n: number; label?: string; selected: boolean; onClick: () => void }
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
    const chapterNums = work.chapterNumbers?.length
      ? work.chapterNumbers
      : Array.from({ length: work.chapters ?? 1 }, (_, i) => i + 1)
    const chPresent = chapterNums.length > 1

    if (chPresent) {
      cols.push({
        key: 'ch', label: 'Ch.', marginTop: 0,
        items: chapterNums.map(n => ({ n, selected: locateChapter === n, onClick: () => selectLocateChapter(n) })),
      })
    }
    cols.push({
      key: 'vs', label: 'Vs.', marginTop: 0,
      items: locateVerseNums === null ? 'loading'
        : locateVerseNums.map(v => ({ n: v.num, label: v.ref, selected: false, onClick: () => selectLocateVerse(v.num) })),
    })
    return cols
  }

  const q = search.trim().toLowerCase()
  // Accent-insensitive query, so Beta-Code Greek typed without accents ("λογοσ") still matches
  // the accented text ("λόγος").
  const qNorm = q ? fold(q) : ''
  const termNorm = !q && termHighlight ? normalizeGreek(termHighlight) : null
  // Search marks used to be painted by swapping the word spans for a plain marked-up string,
  // which cost the reader its right-click menu, its highlighting and (on Greek prose) its
  // parsing pane for as long as a search was active — including every arrival from a search
  // result, which sets termHighlight. GreekWords/TransWords mark these themselves now, so the
  // words stay live. Folded the same way findTermRanges folds the text it scans.
  const markWords = qNorm ? [qNorm] : termNorm ? [termNorm] : undefined
  const matchesSearch = (r: Row) =>
    !q ||
    !!r.greek && fold(r.greek).includes(qNorm) ||
    !!r.english && fold(r.english).includes(qNorm) ||
    !!r.tokens?.some(t => fold(t.surface).includes(qNorm))
  // The in-text box filters the LOADED chapters only — it is a find-on-page, not a search of
  // the whole work. In a twenty-book work opened at Book 1, a name from Book 14 filters every
  // loaded section away and the pane went silently blank, which reads as a bug. When that
  // happens, say so and hand the query to the Master Search scoped to this collection.
  const anySearchMatch = !q || series.sections.some(section =>
    section.rows.filter(matchesSearch)
      .filter(r => !(greekProse && proseModeEff === 'english') || !!r.english).length > 0)

  // The one "Texts" dropdown (was a full row of category chips). Rendered inline at the start of
  // the controls row below so it shares a line with the work title, freeing the row it used to
  // own. Level 1 lists the categories; clicking one drills into its works (with a back row),
  // since flat would be unusable (Philo 36, Mishnah 40).
  const textsMenu = (
    // Redundant with the header's Texts mega-menu on desktop once a work is open, so hidden there.
    // Kept on mobile (the header menu is hover-only / hidden) and in the empty state (the labeled
    // entry point, and the empty-state hint points at it) so a work is always reachable.
    <div ref={catRowRef} className={`relative flex-none ${work ? 'md:hidden' : ''}`}>
      <button
        type="button"
        onClick={() => { setMenuOpen(o => !o); setMenuAuthor(null); setMenuCat(work ? TEXT_CATEGORIES.find(c => c.works.some(w => w.id === work.id))?.id ?? null : null) }}
        className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
          menuOpen ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
      >
        {t('nav.texts')}
        <ChevronDown size={13} className={`text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {menuOpen && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 max-h-[70vh] overflow-y-auto bg-popover border border-gray-200 rounded-lg shadow-lg py-1">
          {menuCat === null ? (
            TEXT_CATEGORIES.map(cat => {
              const isActive = !!work && cat.works.some(w => w.id === work.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  disabled={cat.comingSoon}
                  onClick={() => { setMenuAuthor(null); setMenuCat(cat.id) }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-left transition-colors ${
                    cat.comingSoon ? 'text-gray-300 cursor-default'
                    : isActive ? 'text-brand-700 font-medium hover:bg-brand-50'
                    : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span>{textCategoryLabel(cat.id, locale, cat.label)}{cat.comingSoon && <span className="ml-1.5 text-[10px] text-gray-300">{t('texts.comingSoon')}</span>}</span>
                  {!cat.comingSoon && <ChevronDown size={13} className="-rotate-90 text-gray-300" />}
                </button>
              )
            })
          ) : (() => {
            const cat = TEXT_CATEGORIES.find(c => c.id === menuCat)
            if (!cat) return null
            const groups = groupWorksByAuthor(cat.works)
            // Level 3 — an author's books (Plato → its dialogues).
            if (menuAuthor !== null) {
              const g = groups.find(x => x.author === menuAuthor)
              return (
                <>
                  <button
                    type="button"
                    onClick={() => setMenuAuthor(null)}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                  >
                    <ChevronDown size={13} className="rotate-90 text-gray-400" /> {textCategoryLabel(cat.id, locale, cat.label)} › {textAuthorLabel(menuAuthor, locale)}
                  </button>
                  {g?.works.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => { openWork(w); setMenuOpen(false) }}
                      className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                        work?.id === w.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {localizedWorkTitle(w, locale)}
                    </button>
                  ))}
                </>
              )
            }
            // Level 2 — the author list: multi-work authors drill to their books, lone works open.
            return (
              <>
                <button
                  type="button"
                  onClick={() => setMenuCat(null)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                >
                  <ChevronDown size={13} className="rotate-90 text-gray-400" /> {textCategoryLabel(cat.id, locale, cat.label)}
                </button>
                {groups.map(g => g.author ? (
                  <button
                    key={g.author}
                    type="button"
                    onClick={() => setMenuAuthor(g.author)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-left transition-colors ${
                      work && g.works.some(w => w.id === work.id) ? 'text-brand-700 font-medium hover:bg-brand-50' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span>{textAuthorLabel(g.author!, locale)}</span>
                    <ChevronDown size={13} className="-rotate-90 text-gray-300" />
                  </button>
                ) : (
                  <button
                    key={g.works[0].id}
                    type="button"
                    onClick={() => { openWork(g.works[0]); setMenuOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                      work?.id === g.works[0].id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {localizedWorkName(g.works[0], locale)}
                  </button>
                ))}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-3 h-full min-h-0" style={{ '--tx-fs': FONT_SIZE_MAP[fontSize] } as CSSProperties}>
      {/* ── Reading pane — always visible ── */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        {/* Controls row — Texts picker, work title, Summary, search. flex-none so it stays
            pinned above the scrolling reading pane (never slides under the app header). */}
        <div className="flex-none flex flex-wrap items-center gap-2">
          {textsMenu}
          {work && (<>
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
                {localizedWorkName(work, locale)}
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
                            {it.label ?? it.n}
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
                    {t('texts.summary')}
                  </button>
                  {infoPanel === 'summary' && (
                    <div className="absolute left-0 top-full z-30 mt-1 w-96 max-w-[90vw] max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 bg-popover shadow-lg p-3 space-y-2.5">
                      {summary.sections.map((s, i) => (
                        <div key={i}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{summaryHeading(s.heading)}</p>
                          <p className="text-sm leading-relaxed text-gray-700">{summaryBody(work.id, s.heading, s.body)}</p>
                        </div>
                      ))}
                      {summary.aiDrafted && (
                        <p className="pt-1.5 border-t border-gray-100 text-[11px] italic text-gray-400">
                          {t('texts.aiDraftedCaveat')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* "Read alongside" — open the sibling work at the SAME BOOK.
                Offered only for a work with `alongside` set, which today is the pair of
                Sibyllines. They are separate works because their LINE numbering does not
                correspond, so this deliberately carries the book across and nothing finer:
                verse 1, not the reader's current line, because that line has no counterpart.
                The tooltip says as much, so the coarseness reads as a fact about the texts
                rather than a limitation of the control. */}
            {(() => {
              if (!work.alongside || !currentChapter) return null
              const sib = findWork(work.alongside)?.work
              if (!sib) return null
              const target = { source: sib.source, chapter: currentChapter, verse: 1 }
              const href = `/texts?work=${encodeURIComponent(sib.id)}&open=${encodeURIComponent(JSON.stringify(target))}`
              const sibName = localizedWorkName(sib, locale)
              return (
                <a
                  href={href}
                  title={t('texts.readAlongsideTip', { work: sibName, book: String(currentChapter) })}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-700 transition-colors"
                >
                  <BookOpen size={13} />
                  {t('texts.readAlongside')}
                </a>
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
                  // Enter = search the whole work. (A suggestion is accepted with Tab or a
                  // click; Enter used to swallow the keypress to complete a word, which made
                  // the obvious "type and press Enter" do nothing at all.)
                  if (e.key === 'Enter') { e.preventDefault(); void runWorkSearch() }
                  else if (e.key === 'Tab' && suggestOpen && suggestions[0]) { e.preventDefault(); pickSuggestion(suggestions[0]) }
                  else if (e.key === 'Escape') { setSuggestOpen(false); setWorkHits(null) }
                }}
                placeholder={greekTyping ? t('texts.searchGreek') : t('texts.searchThisText')}
                className={`w-40 sm:w-52 rounded-md border border-gray-300 pl-7 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 ${greekSearchable && englishSearchable ? 'pr-8' : 'pr-2'} ${greekTyping ? 'greek-text' : ''}`}
              />
              {/* Greek ⇄ English input toggle, shown only when both are on screen. */}
              {greekSearchable && englishSearchable && (
                <button
                  type="button"
                  onClick={() => { setSearchLangPref(searchLang === 'grc' ? 'en' : 'grc'); setSearch(''); setSuggestions([]); searchInputRef.current?.focus() }}
                  title={greekTyping ? t('texts.searchingGreek') : t('texts.searchingEnglish')}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors ${greekTyping ? 'font-reading' : ''}`}
                >
                  {greekTyping ? 'α' : 'A'}
                </button>
              )}

              {/* Whole-work results (Enter). Replaces the suggestion list while open. */}
              {(workSearching || workHits) && (
                <div className="absolute left-0 top-full mt-1 z-50 w-[min(92vw,30rem)] max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-popover shadow-xl">
                  <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-gray-100 bg-popover px-3 py-1.5">
                    <p className="text-[11px] text-gray-500">
                      {workSearching
                        ? t('texts.workSearching')
                        : t('texts.workHits', { n: workHits?.length ?? 0, work: work?.name ?? '' })}
                    </p>
                    <button type="button" onClick={() => setWorkHits(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={13} />
                    </button>
                  </div>
                  {!workSearching && workHits?.length === 0 && (
                    <div className="px-3 py-3 space-y-2">
                      <p className="text-xs text-gray-500">{t('texts.workNoHits', { q: workSearchTerm })}</p>
                      <button
                        type="button"
                        onClick={() => { setWorkHits(null); openBackgroundsSearch(workSearchTerm, searchFacet, bgCollection?.id) }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs text-brand-800 hover:bg-brand-100"
                      >
                        <Search size={12} />
                        {t('texts.searchAllOf', { collection: bgCollection?.label ?? t('texts.allWorks') })}
                      </button>
                    </div>
                  )}
                  {workHits?.map((h, i) => (
                    <button
                      key={`${h.ref}-${i}`}
                      type="button"
                      onClick={() => goToWorkHit(h)}
                      className="block w-full border-b border-gray-50 px-3 py-2 text-left last:border-0 hover:bg-brand-50"
                    >
                      <p className="text-[11px] font-medium text-brand-700">{h.ref}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-gray-600">{h.text}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Predictive words from the loaded text */}
              {!workHits && !workSearching && suggestOpen && suggestions.length > 0 && (
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

            {availableTranslations.length > 0 && (
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
                    {isGreek && (
                      <button
                        type="button"
                        onClick={() => { setTranslationId(null); setGreekHiddenPref(false); setTranslationMenuOpen(false) }}
                        className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${!translationId ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {t('texts.greekOnly')}
                      </button>
                    )}
                    {greekProse && !greekOnlyWork && (
                      <button
                        type="button"
                        onClick={() => { setProseMode('greek'); setTranslationMenuOpen(false) }}
                        className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${proseModeEff === 'greek' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {t('texts.onlyLabel', { label: primaryNamed })}
                      </button>
                    )}
                    {availableTranslations.map(tr => (
                      <Fragment key={tr.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setTranslationId(tr.id); setGreekHiddenPref(false)
                            if (greekProse) setProseMode('both')
                            setTranslationMenuOpen(false)
                          }}
                          className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${
                            translationId === tr.id && !greekHidden && (!greekProse || proseModeEff === 'both')
                              ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {greekProse ? t('texts.greekPlus2', { primary: primaryNamed, lang: tr.label })
                            : isGreek ? t('texts.greekPlus', { lang: tr.label }) : tr.label}
                        </button>
                        {greekProse && !greekOnlyWork && (
                          <button
                            type="button"
                            onClick={() => { setTranslationId(tr.id); setProseMode('english'); setTranslationMenuOpen(false) }}
                            className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${
                              translationId === tr.id && proseModeEff === 'english'
                                ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {t('texts.onlyLabel', { label: tr.label })}
                          </button>
                        )}
                        {isGreek && (
                          <button
                            type="button"
                            onClick={() => { setTranslationId(tr.id); setGreekHiddenPref(true); setTranslationMenuOpen(false) }}
                            className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${translationId === tr.id && greekHidden ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {t('texts.onlyLabel', { label: tr.label })}
                          </button>
                        )}
                      </Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}

            <span className="text-xs text-gray-400 ml-auto">{t('texts.scrollToRead')}</span>

            {/* ⋮ display options (text size) — standalone page only; embedded use
                (Exegesis Backgrounds) gets its size from the parent tools menu. */}
            {!isFontSizeControlled && (
              <div className="relative flex-none" ref={displayMenuRef}>
                <button
                  type="button"
                  title={t('texts.displayOptions')}
                  aria-label={t('texts.displayOptions')}
                  aria-expanded={displayMenuOpen}
                  onClick={() => setDisplayMenuOpen(o => !o)}
                  className={`p-1.5 rounded-lg transition-colors ${displayMenuOpen ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <MoreVertical size={18} />
                </button>
                {displayMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-40 w-72 bg-popover border border-gray-200 rounded-xl p-4 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{t('texts.displayOptions')}</span>
                      <button onClick={() => setDisplayMenuOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={15} />
                      </button>
                    </div>
                    <TextSizeSlider options={FONT_SIZES} value={fontSize} onChange={pickFontSize} />
                  </div>
                )}
              </div>
            )}
          </>)}
        </div>

        {/* data-scroll-restore="skip": this pane restores its own position via the `open=` URL
            param (chapter/verse-precise), so the generic pixel-restorer must not fight it. */}
        <div ref={panelRef} data-scroll-restore="skip" onContextMenu={e => e.preventDefault()} className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-4">
          {!work ? (
            <p className="text-sm text-gray-400 italic">{t('texts.pickAText')}</p>
          ) : initialLoading || series.sections.length === 0 ? (
            <p className="text-xs text-gray-300 italic">{t('reader.loading')}</p>
          ) : (
            <div className="space-y-4">
              {/* Shown only where there is English the reader may want translated: a Greek work
                  with its English column hidden has nothing for the browser to act on, and a work
                  already showing our own Spanish is not English-only, so offering to machine
                  translate it would be false. */}
              {(englishColShown || (!isGreek && !greekProse))
                && !(translationId && OUR_SPANISH_IDS.has(translationId))
                && <MachineTranslationHint />}
              <div ref={topSentinel} />
              {!series.backDone && <p className="text-xs text-gray-300 italic text-center">{t('texts.loadingPrev')}</p>}

              {q && !anySearchMatch && (
                <div className="my-10 text-center space-y-2">
                  <p className="text-sm text-gray-500">
                    {t('texts.searchNoLoaded', { q })}
                  </p>
                  <button
                    type="button"
                    onClick={() => void runWorkSearch()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-sm text-brand-800 hover:bg-brand-100"
                  >
                    <Search size={14} />
                    {t('texts.searchThisWork', { work: work?.name ?? '' })}
                  </button>
                </div>
              )}
              {series.sections.map(section => {
                // In a greek-prose work's English-only mode, drop the Greek-only §§ (Josephus
                // English lives once per Whiston section) so the translation reads continuously.
                const filteredRows = section.rows.filter(matchesSearch)
                  .filter(r => !(greekProse && proseModeEff === 'english') || !!r.english)
                if (q && filteredRows.length === 0) return null
                const noteBook = noteBookFor(work, section)
                const refLabel = refLabelFor(work, section)
                // Citation for a row: a standard scholarly ref (Stephanus/Bekker) is a complete
                // locator, so it replaces the "<work> <chapter>:<verse>" form ("Plato, Symposium
                // 172a" rather than "…172:1").
                const citeFor = (row: Row): string => row.ref ? `${work.name} ${row.ref}` : `${refLabel}:${row.num}`
                const notedKeys = notedMap[`${noteBook}.${section.chapter}`] ?? new Set<number>()
                // A translation can cover only PART of a work — the Odes carry English for Ode 12
                // alone. Per verse, a missing translation is an em dash; a whole chapter of them is
                // a column of dashes that reads as a broken page. So when NOTHING in the chapter is
                // translated, say so once at the top and leave the rest of the column empty.
                const sectionUntranslated = !section.rows.some(r => !!r.english)
                return (
                  <div key={section.key} ref={el => { if (el) sectionRefs.current[section.key] = el }}>
                    {/* Daf sides are written lowercase ("28b"), so the Talmud opts out of the
                        heading's uppercasing — "28B" is not how anyone cites it. */}
                    <p className={`text-xs font-semibold tracking-wide text-gray-400 mb-2 ${hebrewProse ? 'normal-case' : 'uppercase'}`}>
                      {blockHeadingFor(work, section, t)}
                    </p>
                    {/* Sparse verse numbers read as missing data until you know the recension.
                        Both these books are one chapter long, so this shows exactly once. */}
                    {work.osisId && OLD_GREEK_BOOKS.has(work.osisId) && (
                      <p className="text-[10px] text-amber-700 leading-relaxed mb-2">
                        {t('reader.oldGreekNote')}
                        {translationId === 'brenton' && ` ${t('reader.oldGreekBrenton')}`}
                      </p>
                    )}
                    <div className="space-y-2">
                      {filteredRows.map(row => {
                        // Layer per column. A verse's Greek and its translation are different
                        // strings, so a highlight's offsets are only meaningful against one of
                        // them: the Greek column highlights on 'grc', the translation column on
                        // the LANGUAGE IT IS ACTUALLY SHOWING. Sharing one layer across both (as
                        // lxx works used to) paints the Greek offsets over the English text — and
                        // hard-coding 'en' here did the same thing one language over, filing a
                        // highlight drawn on our Spanish as English so that it reappeared over the
                        // English at Spanish offsets. `transLang` is the same value already used
                        // for the word spans' `lang`, the right-click search facet and the search
                        // box, for exactly this reason; the highlight layer was the one place it
                        // had not been applied. English keeps writing 'en', so nothing stored
                        // needs migrating.
                        const layer = isGreek ? 'grc' : transLayer
                        const verseHighlights = highlights.forVerse(noteBook, section.chapter, row.num, layer)
                        // Hebrew-script prose (Bavli, Tosefta) renders its Aramaic in the ORIGINAL
                        // column and anchors it on 'grc' like any other original text, so it must
                        // be read back from 'grc' too — `layer` above is 'en' for these works
                        // because they are not source==='lxx', and looking them up by it finds
                        // nothing.
                        const greekHighlights = greekProse || hebrewProse
                          ? highlights.forVerse(noteBook, section.chapter, row.num, 'grc')
                          : verseHighlights
                        const englishHighlights = layer === transLayer ? verseHighlights
                          : highlights.forVerse(noteBook, section.chapter, row.num, transLayer)
                        return (
                        <div key={row.num} ref={el => { if (el) verseRefs.current[`${section.key}.${row.num}`] = el }}>
                        {/* Editorial section heading (works whose source is unbroken prose —
                            see ProseVerse.heading). Spans both columns, above the row. */}
                        {row.heading && (
                          <p className="mt-3 mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-600/80">{row.heading}</p>
                        )}
                        <div
                          className={`grid gap-4 ${!greekHidden && englishColShown ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                          {/* Greek (or, for prose works, the single English column) — the
                              only column highlighting applies to (see render.tsx: a verse's
                              Greek and English text are different canonical strings, so a
                              highlight can only safely belong to one of them). Hidden in
                              translation-only mode (lxx works, "<translation> only"). */}
                          {!greekHidden && (
                          <p className="leading-relaxed text-gray-900 font-reading"
                            {...(isGreek || greekProse ? greekText : translatable)}>
                            {isAuthenticated && (
                              <span className="font-sans align-middle mr-0.5">
                                <VerseNoteButton book={noteBook} chapter={section.chapter} verse={row.num} noted={notedKeys.has(row.num)}
                                  onChanged={() => refreshNotesFor(noteBook, section.chapter)} />
                              </span>
                            )}
                            <sup className="text-[10px] text-brand-500 mr-0.5 font-sans">{row.ref ?? row.num}</sup>
                            {isGreek ? (
                              <span className="font-greek" style={{ fontSize: 'var(--tx-fs, 1.45rem)' }} {...verseAnchorProps(noteBook, section.chapter, row.num, layer)}>
                                {row.tokens && row.tokens.length > 0
                                  ? withTokenOffsets(row.tokens).map(({ token: tok, start, end }, ti) => {
                                      const key = `${section.key}.${row.num}.${ti}`
                                      const select = () => { setSelectedInfo(toLexicalInfo(tok, citeFor(row))); setSelectedKey(key) }
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
                                              reference: citeFor(row), kind: 'greek', greekCorpus: 'LXX',
                                              bgCollection: bgCollection?.id, bgCollectionLabel: bgCollection?.label,
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
                            ) : hebrewProse ? (
                              <span dir="rtl" lang="he" className="font-hebrew block" style={{ fontSize: 'var(--tx-fs, 1.35rem)' }}
                                {...verseAnchorProps(noteBook, section.chapter, row.num, 'grc')}>
                                {/* Offsets are tracked across the split so an existing highlight
                                    can be painted. Drag-selection already WORKED on these works —
                                    the verse carries data-hl-* like every other surface — but the
                                    saved highlight was then invisible, because this branch alone
                                    never looked one up. Creating something you cannot see is worse
                                    than not offering it, so the two halves now match. */}
                                {(() => { let pos = 0; return (row.greek ?? '').split(/(\s+)/).map((tok, ti) => {
                                  const start = pos
                                  pos += tok.length
                                  if (!tok.trim()) return tok
                                  const key = `${section.key}.${row.num}.${ti}`
                                  const select = () => { setSelectedInfo(jastrowInfo(tok, citeFor(row))); setSelectedKey(key) }
                                  const end = start + tok.length
                                  const hl = !q ? highlightAt(start, end, greekHighlights) : undefined
                                  return (
                                    <span key={ti} onMouseEnter={select} onClick={select}
                                      onContextMenu={e => {
                                        e.preventDefault()
                                        const existing = greekHighlights.find(h => start < h.endOffset && end > h.startOffset)
                                        openWordSearch({
                                          x: e.clientX, y: e.clientY, surface: tok, reference: citeFor(row), kind: 'hebrew',
                                          highlight: isAuthenticated ? {
                                            activeColor: existing?.color ?? null,
                                            onPick: c => existing ? void highlights.recolor(existing.id, noteBook, section.chapter, c) : void highlights.create(noteBook, section.chapter, row.num, start, end, c, 'grc'),
                                            onRemove: () => { if (existing) void highlights.remove(existing.id, noteBook, section.chapter) },
                                          } : undefined,
                                        })
                                      }}
                                      {...(hl ? { 'data-highlight-id': hl.id, 'data-hl-book': noteBook, 'data-hl-chapter': section.chapter, 'data-hl-color': hl.color } : {})}
                                      className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''} ${hl ? highlightMarkClass(hl.color) : ''}`}>
                                      {tok}
                                    </span>
                                  )
                                }) })()}
                              </span>
                            ) : greekProse ? (
                              <span className="font-greek" style={{ fontSize: 'var(--tx-fs, 1.45rem)' }}
                                {...verseAnchorProps(noteBook, section.chapter, row.num, 'grc')}>
                                {<GreekWords text={row.greek ?? ''} reference={citeFor(row)} terms={markWords}
                                      analyses={row.morph} selectedKey={selectedKey} keyBase={`${section.key}.${row.num}`}
                                      onPick={(pick, key) => {
                                        setSelectedInfo(pick ? { surface: pick.surface, lexeme: pick.lemma, gloss: '', partOfSpeech: '', parsing: pick.parsing, reference: citeFor(row) } : null)
                                        setSelectedKey(key)
                                      }}
                                      hl={isAuthenticated ? { isAuthenticated, verseHighlights: greekHighlights,
                                        create: (s, e, c) => void highlights.create(noteBook, section.chapter, row.num, s, e, c, 'grc'),
                                        recolor: (id, c) => void highlights.recolor(id, noteBook, section.chapter, c),
                                        remove: id => void highlights.remove(id, noteBook, section.chapter) } : undefined} />}
                              </span>
                            ) : (
                              <span style={{ fontSize: 'var(--tx-fs, 1.45rem)' }} {...verseAnchorProps(noteBook, section.chapter, row.num, layer)}>
                                {<TransWords text={row.english ?? ''} lang={transLang} reference={citeFor(row)} book={noteBook} bgCollection={bgCollection} terms={markWords}
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
                              {...translatable}
                              {...verseAnchorProps(noteBook, section.chapter, row.num, transLayer)}>
                              {isAuthenticated && greekHidden && (
                                <span className="font-sans align-middle mr-0.5">
                                  <VerseNoteButton book={noteBook} chapter={section.chapter} verse={row.num} noted={notedKeys.has(row.num)}
                                    onChanged={() => refreshNotesFor(noteBook, section.chapter)} />
                                </span>
                              )}
                              <sup className="text-[10px] text-brand-500 mr-0.5 font-sans">{row.ref ?? row.num}</sup>
                              {greekProse
                                ? (<TransWords text={row.english ?? ''} lang={transLang} reference={citeFor(row)} book={noteBook} bgCollection={bgCollection} terms={markWords}
                                       hl={isAuthenticated ? { isAuthenticated, verseHighlights: englishHighlights,
                                         create: (s, e, c) => void highlights.create(noteBook, section.chapter, row.num, s, e, c, transLayer),
                                         recolor: (id, c) => void highlights.recolor(id, noteBook, section.chapter, c),
                                         remove: id => void highlights.remove(id, noteBook, section.chapter) } : undefined} />)
                                : row.english
                                ? (<TransWords text={row.english} lang={transLang} reference={citeFor(row)} book={noteBook} bgCollection={bgCollection} terms={markWords}
                                       hl={isAuthenticated ? { isAuthenticated, verseHighlights: englishHighlights,
                                         create: (s, e, c) => void highlights.create(noteBook, section.chapter, row.num, s, e, c, transLayer),
                                         recolor: (id, c) => void highlights.recolor(id, noteBook, section.chapter, c),
                                         remove: id => void highlights.remove(id, noteBook, section.chapter) } : undefined} />)
                                : !sectionUntranslated
                                ? <span className="text-gray-300 italic">—</span>
                                : row.num === filteredRows[0]?.num
                                ? (<span className="text-xs text-gray-400 italic font-sans">
                                    {(work.osisId && ENGLISH_BY_WORK[work.osisId]?.gapNote)
                                      ?? 'No English translation is available for this chapter.'}
                                  </span>)
                                : null}
                            </p>
                          )}
                        </div>
                        {/* Themes cite this passage. The index runs the other way from the Themes
                            pages (src/lib/theme-backlinks.ts): those 588 citations were reachable
                            only by starting at Themes, so a reader meeting the passage itself was
                            never told it is part of an argument elsewhere in the app. */}
                        {(() => {
                          const cited = themesCiting(work.id, section.chapter, row.num, section.book)
                          if (!cited.length) return null
                          return (
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
                              <span className="uppercase tracking-wide">Theme{cited.length > 1 ? 's' : ''}</span>
                              {cited.map((b: ThemeBacklink) => (
                                <Link key={b.id} href={`/themes?topic=${b.id}`} title={b.summary}
                                  className="rounded-md border border-gray-200 px-1.5 py-0.5 text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-700">
                                  {b.label}
                                </Link>
                              ))}
                            </p>
                          )
                        })()}
                        </div>
                      )})}
                    </div>
                  </div>
                )
              })}

              {!series.done && <p className="text-xs text-gray-300 italic text-center">{t('texts.loadingNext')}</p>}
              <div ref={bottomSentinel} />
            </div>
          )}
        </div>

        {/* Parsing window — Greek works only */}
        {(isGreek || greekProse || hebrewProse) && !greekHidden && <ResizableParsingPane storageKey="texts" info={selectedInfo} bgClass="bg-gray-50" />}
      </div>

      {isAuthenticated && <TouchHighlighter containerRef={panelRef} onRange={highlightSelection.openForRange} />}
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
