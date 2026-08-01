'use client'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { X, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react'
import { GreekVerse } from '@/components/reader/GreekVerse'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { openWordSearch } from '@/lib/word-search-bus'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { useCommentaryFontScale, useCommentaryLineSpacing } from '@/lib/note-prefs'
import type { BiblicalVerse } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { NoteAnchor } from '@/components/student/NotesView'
import { useHighlights } from '@/components/highlights/useHighlights'
import { useHighlightSelection } from '@/components/highlights/useHighlightSelection'
import { HighlightPopup } from '@/components/highlights/HighlightPopup'

/** Full-screen viewer for an original commentary page scan — lets a student read
 *  the source directly rather than a transcription. Click the image to toggle
 *  between fit-to-width and full-resolution (scrollable) zoom. */
function PageScanModal({ pages, pagesPath, book, sourceName, onClose }: {
  pages: number[]; pagesPath: string; book: string; sourceName: string; onClose: () => void
}) {
  const [zoomed, setZoomed] = useState(false)
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col" onClick={onClose}>
      <div className="flex-none flex items-center justify-between px-4 py-2.5 bg-black/40" onClick={e => e.stopPropagation()}>
        <span className="text-white text-sm font-medium">{sourceName} &mdash; {book} (p.{pages.join(', ')})</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoomed(z => !z)} title={zoomed ? 'Fit to width' : 'Full resolution'}
            className="p-1.5 rounded text-white hover:bg-surface/20">
            {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>
          <button onClick={onClose} title="Close" className="p-1.5 rounded text-white hover:bg-surface/20"><X size={18} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4" onClick={e => e.stopPropagation()}>
        <div className={`flex flex-col gap-3 ${zoomed ? '' : 'items-center'}`}>
          {pages.map(p => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p} src={`/data/commentary/${pagesPath}/${book}/p${p}.jpg`} alt={`Page ${p}`}
              className={zoomed ? '' : 'max-w-3xl w-full'} onClick={() => setZoomed(z => !z)} />
          ))}
        </div>
      </div>
    </div>
  )
}

// The commentary body is third-party HTML (dangerouslySetInnerHTML), not tokenized into word
// spans like the Greek/translation panes, so we resolve the word to search from the caret at
// right-click time: the current selection if the user selected one, else the word under the
// cursor. Greek words route to the Greek search, everything else to the translation search.
const CV_EDGE_PUNCT = /^[.,;:!?·"“”‘’'ʼ`()[\]{}<>«»…—–-]+|[.,;:!?·"“”‘’'ʼ`()[\]{}<>«»…—–-]+$/g
function wordAtPoint(x: number, y: number): string {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  }
  let node: Node | null = null, offset = 0
  if (doc.caretRangeFromPoint) {                       // WebKit / Blink (Safari, Chrome)
    const r = doc.caretRangeFromPoint(x, y)
    if (r) { node = r.startContainer; offset = r.startOffset }
  } else if (doc.caretPositionFromPoint) {             // standards / Firefox fallback
    const p = doc.caretPositionFromPoint(x, y)
    if (p) { node = p.offsetNode; offset = p.offset }
  }
  if (!node || node.nodeType !== Node.TEXT_NODE) return ''
  const text = node.textContent ?? ''
  let a = offset, b = offset
  while (a > 0 && !/\s/.test(text[a - 1])) a--
  while (b < text.length && !/\s/.test(text[b])) b++
  return text.slice(a, b)
}

interface CommentaryMeta { id: string; name: string; author?: string; attribution?: string; books?: string[]; kind?: 'original-view' }
interface OriginalSource { id: string; name: string; attribution: string; pagesPath: string; books: string[] }

/**
 * Commentary tab: the Greek text (NA1904) on the left with a parsing box beneath it,
 * and a verse-tracked commentary pane on the right. Pick a commentary from the
 * dropdown; the pane follows whichever verse you click in the Greek. Commentary data
 * is static, verse-keyed JSON (public/data/commentary/<id>/<book>.json).
 */
export function CommentaryView({ anchor, isAuthenticated = false, onAttribution }: { anchor: NoteAnchor | null; isAuthenticated?: boolean; onAttribution?: (a: string | null) => void }) {
  const [verses, setVerses] = useState<BiblicalVerse[]>([])
  const [activeVerse, setActiveVerse] = useState<number | null>(null)
  // The parsing pane shows the hovered word (transient) and falls back to the last clicked word
  // (sticky) when the mouse leaves — so hovering inspects, clicking pins and jumps the commentary.
  const [info, setInfo] = useState<LexicalInfoPanel | null>(null)
  const [hoverInfo, setHoverInfo] = useState<LexicalInfoPanel | null>(null)
  const [commentaries, setCommentaries] = useState<CommentaryMeta[]>([])
  const [commentaryId, setCommentaryId] = useState('robertson')
  const [verseMap, setVerseMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  // "Original View Commentaries" — instead of a transcription, this lists links to
  // scanned pages of one or more historical PDF sources (currently just Alford on
  // John). Each source has its own "chapter:verse" -> page-number(s) map.
  const [originalSources, setOriginalSources] = useState<OriginalSource[]>([])
  const [sourcePageMaps, setSourcePageMaps] = useState<Record<string, Record<string, number[]>>>({})
  const [activeScan, setActiveScan] = useState<{ source: OriginalSource; pages: number[] } | null>(null)
  // Greek edition shown alongside the commentary. Nestle 1904 = NA1904, Tischendorf 8th = GNT.
  const [gntEdition, setGntEdition] = useState<'nestle1904' | 'tischendorf'>('nestle1904')
  // The three-dot text-settings menu (font size / line spacing / copyright) is hoisted
  // up into the shared exegesis tools menu — this still needs the live values to style
  // its own text, kept in sync with that menu via the shared localStorage-backed hooks.
  const [fontScale] = useCommentaryFontScale()
  const [lineSpacing] = useCommentaryLineSpacing()
  const scrollRef = useRef<HTMLDivElement>(null)
  const verseEls = useRef<Map<number, HTMLElement>>(new Map())
  const meta = commentaries.find(c => c.id === commentaryId)
  const highlights = useHighlights(isAuthenticated)
  const highlightSelection = useHighlightSelection(scrollRef)
  // Verses that already have a note (filled note icon), for the loaded passage. Signed-in only.
  const [notedKeys, setNotedKeys] = useState<Set<number>>(new Set())
  const loadNoted = useCallback(async () => {
    if (!isAuthenticated || !anchor) { setNotedKeys(new Set()); return }
    try {
      const r = await fetch(`/api/notes?book=${encodeURIComponent(anchor.book)}&chapter=${anchor.chapter}&verseStart=1&verseEnd=500`)
      const d = await r.json()
      setNotedKeys(new Set((d.notes ?? []).map((n: { verse: number }) => n.verse)))
    } catch { /* leave as-is */ }
  }, [isAuthenticated, anchor])
  useEffect(() => { void loadNoted() }, [loadNoted])
  useEffect(() => onNotesChanged(() => void loadNoted()), [loadNoted])

  // Right-click inside the commentary prose → search the word under the cursor (or the current
  // selection). Greek → Greek search, otherwise the translation search — same menu the reading
  // panes use. Falls through to the native menu only when there's no word (e.g. blank space).
  const onCommentaryContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const sel = window.getSelection()
    let word = sel && !sel.isCollapsed ? sel.toString().trim() : ''
    if (!word) word = wordAtPoint(e.clientX, e.clientY)
    word = word.replace(CV_EDGE_PUNCT, '').trim()
    if (!word) return
    e.preventDefault()
    const isGreek = /[Ͱ-Ͽἀ-῿]/.test(word)
    const reference = anchor && activeVerse != null ? `${anchor.name} ${anchor.chapter}:${activeVerse}` : (meta?.name ?? 'Commentary')
    openWordSearch(isGreek
      ? { x: e.clientX, y: e.clientY, surface: word, lemma: null, reference, kind: 'greek', greekCorpus: 'GNT' }
      : { x: e.clientX, y: e.clientY, surface: word, reference, kind: 'translation', transLang: 'en' })
  }, [anchor, activeVerse, meta])

  // Registry of available commentaries.
  useEffect(() => {
    fetch('/data/commentary/index.json').then(r => r.json()).then(d => {
      const list: CommentaryMeta[] = d.commentaries ?? []
      setCommentaries(list)
      if (list.length && !list.some(c => c.id === commentaryId)) setCommentaryId(list[0].id)
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Greek text for the passage (Nestle 1904 or Tischendorf, per the dropdown).
  useEffect(() => {
    if (!anchor) { setVerses([]); setActiveVerse(null); return }
    setLoading(true); setInfo(null); setHoverInfo(null)
    const corpus = gntEdition === 'nestle1904' ? 'NA1904' : 'GNT'
    fetch(`/api/reader?corpus=${corpus}&book=${anchor.book}&chapter=${anchor.chapter}`)
      .then(r => r.json())
      .then(d => {
        const vs: BiblicalVerse[] = (d.verses ?? []).filter((v: BiblicalVerse) => v.verse >= anchor.verseStart && v.verse <= anchor.verseEnd)
        setVerses(vs); setActiveVerse(vs[0]?.verse ?? anchor.verseStart)
      }).catch(() => setVerses([])).finally(() => setLoading(false))
    void highlights.loadFor(anchor.book, anchor.chapter)
  }, [anchor?.book, anchor?.chapter, anchor?.verseStart, anchor?.verseEnd, gntEdition, highlights.loadFor]) // eslint-disable-line react-hooks/exhaustive-deps

  // Registry of "Original View" PDF sources (fetched once, lazily — only used when
  // that option is selected).
  useEffect(() => {
    fetch('/data/commentary/original-sources/index.json')
      .then(r => (r.ok ? r.json() : { sources: [] })).then(d => setOriginalSources(d.sources ?? [])).catch(() => {})
  }, [])

  // For the current book, fetch each original source's page-map (chapter:verse ->
  // page numbers) that covers it, so links can be shown for whichever ones apply.
  useEffect(() => {
    setActiveScan(null)
    if (!anchor) return
    originalSources.filter(s => s.books.includes(anchor.book)).forEach(s => {
      fetch(`/data/commentary/${s.pagesPath}/${anchor.book}.json`)
        .then(r => (r.ok ? r.json() : null))
        .then(map => { if (map) setSourcePageMaps(prev => ({ ...prev, [s.id]: map })) })
        .catch(() => {})
    })
  }, [originalSources, anchor?.book])

  // Commentary text for the current book + selected commentary (skipped for the
  // "Original View" option, which has no transcription — only page-scan links).
  useEffect(() => {
    if (!anchor || meta?.kind === 'original-view') { setVerseMap({}); return }
    fetch(`/data/commentary/${commentaryId}/${anchor.book}.json`)
      .then(r => (r.ok ? r.json() : {})).then(setVerseMap).catch(() => setVerseMap({}))
  }, [commentaryId, anchor?.book]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll-tracking: whichever verse sits nearest the top of the Greek pane becomes
  // active, so the commentary follows as you scroll (clicking a verse still works).
  useEffect(() => {
    const root = scrollRef.current
    if (!root || verses.length === 0) return
    const tops = new Map<number, number>()
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const v = Number((e.target as HTMLElement).dataset.verse)
        if (e.isIntersecting) tops.set(v, e.boundingClientRect.top)
        else tops.delete(v)
      }
      let pick: number | null = null, best = Infinity
      tops.forEach((t, v) => { if (t < best) { best = t; pick = v } })
      if (pick != null) setActiveVerse(pick)
    }, { root, rootMargin: '0px 0px -65% 0px', threshold: 0 })
    verseEls.current.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [verses])

  // Report the selected commentary's attribution up so the hoisted tools menu can
  // show the "Copyright" subheading without needing the commentary list itself.
  useEffect(() => { onAttribution?.(meta?.attribution ?? null) }, [meta?.attribution, onAttribution])

  if (!anchor) return <p className="text-sm text-gray-400 italic py-10 text-center">Enter a passage above to read the commentary.</p>

  const html = activeVerse != null ? verseMap[`${anchor.chapter}:${activeVerse}`] : undefined
  const isOriginalView = meta?.kind === 'original-view'
  // Sources that both cover this book and have a page-scan entry for the active verse.
  const availableScans = isOriginalView && activeVerse != null
    ? originalSources
        .filter(s => s.books.includes(anchor.book))
        .map(s => ({ source: s, pages: sourcePageMaps[s.id]?.[`${anchor.chapter}:${activeVerse}`] }))
        .filter((x): x is { source: OriginalSource; pages: number[] } => !!x.pages)
    : []

  return (
    // Two equal bounded rows when stacked (below lg) so the Greek+parsing pane and the commentary
    // each keep a scrollable share — a plain single-column grid let the Greek column's flex-1
    // collapse to nothing. Side-by-side (lg+) is one row, two columns.
    <div className="grid gap-4 h-full min-h-0 grid-rows-[minmax(0,1.45fr)_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-2">
      {/* Left: Greek text (scrolls) + parsing box (fixed, bottom-left) */}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Greek</span>
          <select value={gntEdition} onChange={e => setGntEdition(e.target.value as 'nestle1904' | 'tischendorf')}
            title="Choose the Greek edition"
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="nestle1904">Nestle 1904</option>
            <option value="tischendorf">Tischendorf 8th</option>
          </select>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-1.5"
          style={{ '--greek-fs': `${1.125 * fontScale}rem`, '--greek-lh': lineSpacing } as CSSProperties}>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : verses.map(v => (
            <div key={v.id} data-verse={v.verse}
              ref={el => { if (el) verseEls.current.set(v.verse, el); else verseEls.current.delete(v.verse) }}
              onClick={() => setActiveVerse(v.verse)}
              className={`rounded-lg px-2 py-1 transition-colors ${v.verse === activeVerse ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-gray-50'}`}>
              <div className="flex items-start gap-1">
                {isAuthenticated && anchor && (
                  <span className="pt-1 shrink-0 print:hidden" onClick={e => e.stopPropagation()}>
                    <VerseNoteButton book={anchor.book} chapter={anchor.chapter} verse={v.verse} noted={notedKeys.has(v.verse)} onChanged={loadNoted} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <GreekVerse verse={v} activeWordId={null} highlighted={false}
                    textHighlights={anchor ? highlights.forVerse(anchor.book, anchor.chapter, v.verse, 'grc') : []}
                    onWordHover={(_id, hi) => setHoverInfo(hi)}
                    onWordClick={i => { setInfo(i); setHoverInfo(null); if (i) setActiveVerse(v.verse) }}
                    onWordRightClick={anchor ? (word, x, y, start, end) => {
                      const existing = highlights.forVerse(anchor.book, anchor.chapter, v.verse, 'grc').find(h => start < h.endOffset && end > h.startOffset)
                      openWordSearch({ x, y, surface: word.surface, lemma: word.lexeme?.lexeme ?? null, reference: `${anchor.name} ${anchor.chapter}:${v.verse}`, kind: 'greek', greekCorpus: 'GNT',
                        highlight: isAuthenticated ? {
                          activeColor: existing?.color ?? null,
                          onPick: c => existing ? void highlights.recolor(existing.id, anchor.book, anchor.chapter, c) : void highlights.create(anchor.book, anchor.chapter, v.verse, start, end, c, 'grc'),
                          onRemove: () => { if (existing) void highlights.remove(existing.id, anchor.book, anchor.chapter) },
                        } : undefined })
                    } : undefined} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="shrink-0 mt-3">
          <ResizableParsingPane storageKey="commentary" info={hoverInfo ?? info} bgClass="bg-gray-50" />
        </div>
      </div>

      {/* Right: commentary, tracking the active verse */}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <select value={commentaryId} onChange={e => setCommentaryId(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {commentaries.length === 0 && <option value="robertson">Robertson — Word Pictures in the NT</option>}
            {commentaries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {isOriginalView ? (
          <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-surface p-4">
            {availableScans.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No original-source scan for this verse{activeVerse != null ? ` (${anchor.name} ${anchor.chapter}:${activeVerse})` : ''}.
              </p>
            ) : (
              <ul className="space-y-2">
                {availableScans.map(({ source, pages }) => (
                  <li key={source.id}>
                    <button onClick={() => setActiveScan({ source, pages })}
                      className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-900 hover:underline">
                      <ExternalLink size={14} /> View {source.name}
                    </button>
                  </li>
                ))}
                {/* More original-source links appear here automatically as they're added
                    to original-sources/index.json, as long as they cover this book. */}
              </ul>
            )}
          </div>
        ) : (
          <div
            onContextMenu={onCommentaryContextMenu}
            style={{ fontSize: `${0.875 * fontScale}rem`, lineHeight: lineSpacing }}
            className="font-reading flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-surface p-4 text-ink-900 [&_p]:mb-2.5 [&_b]:font-semibold [&_b]:text-ink-900 [&_i]:italic"
          >
            {html
              ? <div dangerouslySetInnerHTML={{ __html: html }} />
              : <p className="text-gray-400 italic">No commentary for this verse{activeVerse != null ? ` (${anchor.name} ${anchor.chapter}:${activeVerse})` : ''}.</p>}
          </div>
        )}
      </div>
      {activeScan && (
        <PageScanModal pages={activeScan.pages} pagesPath={activeScan.source.pagesPath} book={anchor.book}
          sourceName={activeScan.source.name} onClose={() => setActiveScan(null)} />
      )}

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
