'use client'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { TEXT_CATEGORIES, type CatalogWork } from '@/lib/texts-catalog'
import type { PhraseFontSize } from '@/components/phrase/PhraseExplorer'

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

const FONT_SIZE_MAP: Record<PhraseFontSize, string> = { sm: '1.05rem', md: '1.25rem', lg: '1.45rem', xl: '1.7rem' }
const LOOKAHEAD = 1600   // px ahead of the sentinel to start loading the next/previous chapter

// Highlight every case-insensitive match of `q` inside `text` for the search box.
function highlight(text: string, q: string): ReactNode {
  if (!q.trim()) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 rounded-sm">{text.slice(idx, idx + q.length)}</mark>
      {highlight(text.slice(idx + q.length), q)}
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
  if (w.source === '2esdras') return '2Esdras'
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
}

export function TextsReader({ isAuthenticated = false, fontSize: controlledFontSize, onFontSize, onAttribution }: TextsReaderProps) {
  const isFontSizeControlled = onFontSize !== undefined
  const [internalFontSize, setInternalFontSize] = useState<PhraseFontSize>('lg')
  const fontSize = isFontSizeControlled ? (controlledFontSize ?? 'lg') : internalFontSize

  const [work, setWork] = useState<CatalogWork | null>(null)
  const [openCat, setOpenCat] = useState<string | null>(null)  // which category's dropdown is expanded
  // Hover-cascade "select a chapter/verse" menu: work → chapters → verses.
  const [hoverWork, setHoverWork] = useState<CatalogWork | null>(null)
  const [hoverChapter, setHoverChapter] = useState<QueueItem | null>(null)
  const [hoverVerseNums, setHoverVerseNums] = useState<number[] | null>(null)
  const hoverFetchToken = useRef(0)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [series, setSeries] = useState<Series>(EMPTY_SERIES)
  const [initialLoading, setInitialLoading] = useState(false)
  const [showEnglish, setShowEnglish] = useState(true)
  const [search, setSearch] = useState('')

  // Parsing window (Greek only)
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // Per-verse notes, keyed by "<noteBook>.<chapter>" since several chapters (and, for
  // Josephus, several books) can be on screen at once.
  const [notedMap, setNotedMap] = useState<Record<string, Set<number>>>({})

  const brentonCache = useRef<Record<string, Record<string, string>>>({})
  const bsbCache = useRef<Record<string, string> | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const topSentinel = useRef<HTMLDivElement>(null)
  const bottomSentinel = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement>>({})
  const verseRefs = useRef<Record<string, HTMLDivElement>>({})
  const catRowRef = useRef<HTMLDivElement>(null)
  const workRef = useRef(work); useEffect(() => { workRef.current = work }, [work])
  const queueRef = useRef(queue); useEffect(() => { queueRef.current = queue }, [queue])
  const seriesRef = useRef(series); useEffect(() => { seriesRef.current = series }, [series])
  const loadingRef = useRef(false)
  const backLoadingRef = useRef(false)

  const isGreek = work?.source === 'lxx'
  const hasEnglish = work ? (work.source === 'lxx' ? !!work.english : true) : false

  const refreshNotesFor = useCallback(async (noteBook: string, ch: number) => {
    if (!isAuthenticated) return
    try {
      const r = await fetch(`/api/notes?book=${encodeURIComponent(noteBook)}&chapter=${ch}&verseStart=1&verseEnd=500`)
      const d = await r.json()
      setNotedMap(prev => ({ ...prev, [`${noteBook}.${ch}`]: new Set((d.notes ?? []).map((n: { verse: number }) => n.verse)) }))
    } catch { /* ignore */ }
  }, [isAuthenticated])

  // Close the open category's book dropdown on an outside click.
  useEffect(() => {
    if (!openCat) return
    function onMouseDown(e: MouseEvent) {
      if (catRowRef.current && !catRowRef.current.contains(e.target as Node)) setOpenCat(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [openCat])

  // Sources & copyright, lifted to the shared tools menu (matches Backgrounds/Synopsis).
  useEffect(() => {
    if (!work) { onAttribution?.(''); return }
    const parts = ['Greek text: Rahlfs’ Septuagint (1935) and Nestle 1904, both public domain.']
    if (work.english === 'brenton') parts.push('English: Brenton’s 1851 English Septuagint (public domain).')
    if (work.english === 'bsb') parts.push('English: the Berean Standard Bible (public domain).')
    if (work.source === '2esdras') parts.push('Text: the King James Version, 2 Esdras (public domain).')
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
    // 2esdras
    const r = await fetch('/data/apocrypha/2esdras.json')
    const d = r.ok ? await r.json() : null
    const ch = d?.chapters?.find((c: { number: number }) => c.number === item.chapter)
    return (ch?.verses ?? []).map((v: { number: number; text: string }) => ({ num: v.number, english: v.text }))
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
    loadingRef.current = false
  }, [fetchChapterRows, refreshNotesFor])

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
    requestAnimationFrame(() => {
      if (panel) panel.scrollTop = prevTop + (panel.scrollHeight - prevHeight)
      backLoadingRef.current = false
    })
  }, [fetchChapterRows, refreshNotesFor])

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
    idxs.forEach(i => void refreshNotesFor(noteBookFor(w, q[i]), q[i].chapter))
    setInitialLoading(false)

    const targetKey = q[idx] ? keyFor(q[idx]) : null
    requestAnimationFrame(() => {
      const panel = panelRef.current
      const vTarget = targetKey && verse != null ? verseRefs.current[`${targetKey}.${verse}`] : null
      const target = vTarget ?? (targetKey ? sectionRefs.current[targetKey] : null)
      if (target && panel) panel.scrollTop = target.offsetTop - panel.offsetTop
      else if (panel) panel.scrollTop = 0
    })
  }, [fetchChapterRows, refreshNotesFor])

  function openWork(w: CatalogWork) {
    setWork(w); setShowEnglish(true); setOpenCat(null)
    setHoverWork(null); setHoverChapter(null)
    void openAt(w, w.source === 'josephus' ? 1 : undefined, 1)
  }

  function jumpToChapter(w: CatalogWork, item: QueueItem) {
    setWork(w); setShowEnglish(true); setOpenCat(null)
    setHoverWork(null); setHoverChapter(null)
    void openAt(w, item.book, item.chapter)
  }

  function jumpToVerse(w: CatalogWork, item: QueueItem, verse: number) {
    setWork(w); setShowEnglish(true); setOpenCat(null)
    setHoverWork(null); setHoverChapter(null)
    void openAt(w, item.book, item.chapter, verse)
  }

  // Hovering a chapter in the cascade menu lazily fetches its verse/section numbers
  // for the next flyout — cheap enough (one chapter) to do per hover, and avoids
  // needing per-chapter verse counts baked into the catalog.
  function handleHoverChapter(w: CatalogWork, item: QueueItem) {
    setHoverChapter(item)
    setHoverVerseNums(null)
    const token = ++hoverFetchToken.current
    fetchChapterRows(w, item).then(rows => {
      if (hoverFetchToken.current !== token) return
      setHoverVerseNums(rows.map(r => r.num))
    }).catch(() => { if (hoverFetchToken.current === token) setHoverVerseNums([]) })
  }

  const q = search.trim().toLowerCase()
  const matchesSearch = (r: Row) =>
    !q ||
    !!r.greek?.toLowerCase().includes(q) ||
    !!r.english?.toLowerCase().includes(q) ||
    !!r.tokens?.some(t => t.surface.toLowerCase().includes(q))

  return (
    <div className="flex flex-col gap-3 h-full min-h-0" style={{ '--tx-fs': FONT_SIZE_MAP[fontSize] } as CSSProperties}>
      {/* ── Category headings — click one to drop a Work / Chapter / Verse cascade below it ── */}
      <div ref={catRowRef} className="flex-none flex flex-wrap items-start gap-1.5">
        {TEXT_CATEGORIES.map(cat => {
          const isActive = !!work && cat.works.some(w => w.id === work.id)
          const chapterItems = hoverWork && cat.works.some(w => w.id === hoverWork.id) ? buildQueue(hoverWork) : null
          const multiBook = hoverWork?.source === 'josephus' && hoverWork.books!.length > 1
          return (
            <div
              key={cat.id}
              className="relative"
              onMouseLeave={() => { setHoverWork(null); setHoverChapter(null) }}
            >
              <button
                type="button"
                disabled={cat.comingSoon}
                onClick={() => { setOpenCat(c => c === cat.id ? null : cat.id); setHoverWork(null); setHoverChapter(null) }}
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
                <>
                  {/* Column 1 — works in this category */}
                  <div className="absolute left-0 top-full z-20 w-56 max-h-72 overflow-y-auto bg-white border border-brand-300 rounded-b-lg rounded-tr-lg shadow-lg py-1">
                    {cat.works.map(w => {
                      const expandable = buildQueue(w).length > 1
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onMouseEnter={() => { setHoverWork(w); setHoverChapter(null) }}
                          onClick={() => openWork(w)}
                          className={`w-full flex items-center justify-between gap-1 text-left px-3 py-1.5 text-sm transition-colors ${
                            work?.id === w.id ? 'bg-brand-50 text-brand-700 font-medium'
                            : hoverWork?.id === w.id ? 'bg-gray-50 text-gray-700'
                            : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <span className="truncate">{w.name}</span>
                          {expandable && <ChevronRight size={13} className="text-gray-300 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>

                  {/* Column 2 — every chapter of the hovered work (grouped by book, for Josephus) */}
                  {chapterItems && chapterItems.length > 1 && (
                    <div className="absolute left-56 top-full z-20 w-40 max-h-72 overflow-y-auto bg-white border border-brand-300 rounded-lg shadow-lg py-1">
                      {chapterItems.map((item, i) => {
                        const showBookHeader = multiBook && (i === 0 || chapterItems[i - 1].book !== item.book)
                        const isHovered = hoverChapter && keyFor(hoverChapter) === keyFor(item)
                        return (
                          <div key={keyFor(item)}>
                            {showBookHeader && (
                              <p className="px-3 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Book {item.book}</p>
                            )}
                            <button
                              type="button"
                              onMouseEnter={() => handleHoverChapter(hoverWork!, item)}
                              onClick={() => jumpToChapter(hoverWork!, item)}
                              className={`w-full flex items-center justify-between gap-1 text-left px-3 py-1 text-xs transition-colors ${
                                isHovered ? 'bg-gray-50 text-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span>Chapter {item.chapter}</span>
                              <ChevronRight size={11} className="text-gray-300" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Column 3 — every verse/section of the hovered chapter */}
                  {hoverChapter && chapterItems && chapterItems.length > 1 && (
                    <div className="absolute left-96 top-full z-20 w-24 max-h-72 overflow-y-auto bg-white border border-brand-300 rounded-lg shadow-lg py-1">
                      {hoverVerseNums === null ? (
                        <p className="px-3 py-1 text-xs text-gray-300 italic">…</p>
                      ) : hoverVerseNums.length === 0 ? (
                        <p className="px-3 py-1 text-xs text-gray-300 italic">—</p>
                      ) : (
                        hoverVerseNums.map(vn => (
                          <button
                            key={vn}
                            type="button"
                            onClick={() => jumpToVerse(hoverWork!, hoverChapter, vn)}
                            className="w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            v. {vn}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Reading pane — always visible ── */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        {work && (
          <div className="flex-none flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{work.name}</span>

            {isGreek && hasEnglish && (
              <button
                onClick={() => setShowEnglish(v => !v)}
                className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${showEnglish ? 'bg-brand-100 border-brand-300 text-brand-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                {showEnglish ? 'Hide English' : 'Show English'}
              </button>
            )}

            <span className="text-xs text-gray-400 ml-auto">Scroll to keep reading</span>
          </div>
        )}

        {/* Search this text */}
        <div className="flex-none relative">
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
                      {filteredRows.map(row => (
                        <div key={row.num} ref={el => { if (el) verseRefs.current[`${section.key}.${row.num}`] = el }}
                          className={`grid gap-4 ${isGreek && showEnglish && hasEnglish ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                          {/* Greek (or, for prose works, the single English column) */}
                          <p className="leading-relaxed text-gray-900">
                            {isAuthenticated && (
                              <span className="font-sans align-middle mr-0.5">
                                <VerseNoteButton book={noteBook} chapter={section.chapter} verse={row.num} noted={notedKeys.has(row.num)}
                                  onChanged={() => refreshNotesFor(noteBook, section.chapter)} />
                              </span>
                            )}
                            <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{row.num}</sup>
                            {isGreek ? (
                              <span className="font-greek" style={{ fontSize: 'var(--tx-fs, 1.45rem)' }}>
                                {row.tokens && row.tokens.length > 0
                                  ? row.tokens.map((tok, ti) => {
                                      const key = `${section.key}.${row.num}.${ti}`
                                      const select = () => { setSelectedInfo(toLexicalInfo(tok, `${refLabel}:${row.num}`)); setSelectedKey(key) }
                                      const matched = !!q && tok.surface.toLowerCase().includes(q)
                                      return (
                                        <span key={ti} onMouseEnter={select} onClick={select}
                                          className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''} ${matched ? 'bg-yellow-200' : ''}`}>
                                          {tok.surface}{ti < row.tokens!.length - 1 ? ' ' : ''}
                                        </span>
                                      )
                                    })
                                  : row.greek}
                              </span>
                            ) : (
                              <span style={{ fontSize: 'calc(var(--tx-fs, 1.45rem) * 0.65)' }}>{highlight(row.english ?? '', search)}</span>
                            )}
                          </p>

                          {/* Parallel English column (Greek works only) */}
                          {isGreek && showEnglish && hasEnglish && (
                            <p className="leading-relaxed text-gray-600 lg:border-l lg:border-gray-100 lg:pl-4" style={{ fontSize: 'calc(var(--tx-fs, 1.45rem) * 0.65)' }}>
                              <sup className="text-[10px] text-gray-300 mr-0.5 font-sans">{row.num}</sup>
                              {row.english ? highlight(row.english, search) : <span className="text-gray-300 italic">—</span>}
                            </p>
                          )}
                        </div>
                      ))}
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
        {isGreek && <ParsingPanel info={selectedInfo} bgClass="bg-gray-50" />}
      </div>
    </div>
  )
}
