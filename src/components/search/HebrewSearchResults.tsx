'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { openWordSearch } from '@/lib/word-search-bus'
import { mtToEnglish } from '@/lib/versification'
import { normalizeHebrew } from '@/lib/hebrew-fold'
import { SEARCH_MARK } from '@/lib/highlight-terms'
import { loadHebrewLexicon, type HebrewLexicon } from '@/lib/hebrew-lexicon'
import { buildHebrewInfo } from '@/components/reader/HebrewWord'
import { TransWords, forwardContextMenuToNearestTransWord } from '@/components/highlights/TransWords'
import { useHighlights } from '@/components/highlights/useHighlights'
import { highlightAt, verseAnchorProps } from '@/components/highlights/render'
import { useHighlightSelection } from '@/components/highlights/useHighlightSelection'
import { HighlightPopup } from '@/components/highlights/HighlightPopup'
import { TouchHighlighter } from '@/components/highlights/TouchHighlighter'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { highlightMarkClass } from '@/lib/highlight-colors'
import { HEBREW_LAYER } from '@/components/reader/HebrewVerse'
import { ParsingDock } from './ParsingDock'
import { emitParsingInfo, hasParsingSink } from '@/lib/parsing-info-bus'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { VerseWord } from '@/types/biblical-text'

// Two-column parallel view for a Hebrew (MT) search: each hit verse shows the pointed Hebrew
// beside a parallel translation. Each Hebrew word is clickable → the parsing pane (same as the
// Reader): the word's MT data (surface / Strong's / OSHB morph / morphemes) + the Hebrew lexicon
// build the panel via buildHebrewInfo. Embedded over the Reader, parses route to the Reader's
// pane (parsing-info-bus); on the full /search page a ParsingDock is docked here. Translations
// are the reader's per-chapter index (/api/translation); BHS↔English versification diverges in
// ~30 chapters, so each hit maps through mtToEnglish before the translation is looked up.

// `transLang === 'none'` turns the parallel column off. The selector lives in SearchPageView's
// controls bar (shared with the Greek results).

// matchWords: the matched word surfaces of an "all forms" (Strong's) hit, computed server-side
// from the index's per-word Strong's — the query is a lexeme, so its inflected forms can't be
// found by text matching.
export type HebrewHit = { osisId: string; chapter: number; verse: number; text: string; matchWords?: string[] }

type MtVerse = { id: string; words?: VerseWord[] }

export function HebrewSearchResults({ hits, bookName, onOpen, query = '', transLang, embedded = false, isAuthenticated = false }: {
  hits: HebrewHit[]
  bookName: Map<string, string>
  onOpen: (h: HebrewHit, transLang: string) => void
  query?: string
  // Parallel-translation column language ('none' = Hebrew only); owned by SearchPageView.
  transLang: string
  embedded?: boolean
  isAuthenticated?: boolean
}) {
  // Highlighting, as the Greek results panel already had it. Offsets are into the hit's own
  // `text`, which is character-for-character the Reader's canonical `words.join(' ')` string
  // (verified across a sample of 200 verses — the index keeps maqqef where the Reader joins
  // with a space, and both are one character), so a mark made here lands on the same words in
  // the Reader and vice versa.
  const highlights = useHighlights(isAuthenticated)
  // Marks made here are the marks the Reader shows: the Hebrew renders on the same canonical
  // basis and anchors on the same layer, so a drag-selection resolves identically.
  const resultsRef = useRef<HTMLDivElement>(null)
  const highlightSelection = useHighlightSelection(resultsRef)

  const [notedKeys, setNotedKeys] = useState<Set<string>>(new Set())
  const loadedHl = useRef<Set<string>>(new Set())
  const chapterKeys = Array.from(new Set(hits.map(h => `${h.osisId}.${h.chapter}`))).join(',')
  const loadNoted = useCallback(async () => {
    if (!isAuthenticated || !chapterKeys) { setNotedKeys(new Set()); return }
    const chapters = chapterKeys.split(',').map(k => { const i = k.lastIndexOf('.'); return [k.slice(0, i), k.slice(i + 1)] as const })
    try {
      const sets = await Promise.all(chapters.map(([book, ch]) =>
        fetch(`/api/notes?book=${encodeURIComponent(book)}&chapter=${ch}&verseStart=1&verseEnd=500`)
          .then(r => (r.ok ? r.json() : { notes: [] }))
          .then((d: { notes?: { verse: number }[] }) => (d.notes ?? []).map(n => `${book}.${ch}.${n.verse}`))))
      setNotedKeys(new Set(sets.flat()))
    } catch { /* leave as-is */ }
  }, [isAuthenticated, chapterKeys])
  useEffect(() => { void loadNoted() }, [loadNoted])
  useEffect(() => onNotesChanged(() => void loadNoted()), [loadNoted])
  // Saved highlights for the chapters on screen — without it, only this session's marks appear.
  useEffect(() => {
    if (!isAuthenticated) return
    for (const h of hits) {
      const key = `${h.osisId}.${h.chapter}`
      if (loadedHl.current.has(key)) continue
      loadedHl.current.add(key)
      void highlights.loadFor(h.osisId, h.chapter)
    }
  }, [hits, isAuthenticated, highlights.loadFor])
  const [, bump] = useState(0)
  const [selKey, setSelKey] = useState<string | null>(null)
  const [info, setInfo] = useState<LexicalInfoPanel | null>(null)
  // Embedded over a page with its own parsing pane (the Reader): send parses THERE and skip the
  // local dock. Decided once at mount (the host registers its sink before the panel can open).
  const [useSink] = useState(() => embedded && hasParsingSink())
  const showInfo = (i: LexicalInfoPanel | null) => { if (useSink) emitParsingInfo(i); else setInfo(i) }

  // Hebrew Strong's lexicon (lemma / gloss / BDB / transliteration for the parse), loaded once.
  const lexRef = useRef<HebrewLexicon | null>(null)
  useEffect(() => { loadHebrewLexicon().then(l => { lexRef.current = l }).catch(() => {}) }, [])

  // verseId → MT word data, filled lazily the first time a word in that chapter is touched (the
  // verse text alone drives the *rendering*, so this only loads for chapters actually parsed).
  const mtWords = useRef<Record<string, VerseWord[]>>({})
  const fetchedCh = useRef<Set<string>>(new Set())

  // verseId → translation text (per lang), lazily filled; a ref so late fetches always store.
  const trans = useRef<Record<string, Record<string, string>>>({})
  const fetchedTr = useRef<Set<string>>(new Set())

  // A word is the searched one (this-form search) if its consonantal fold contains the folded
  // query — the same fold the index matched with. (All-forms hits use h.matchWords instead.)
  const qParts = normalizeHebrew(query).split(' ').filter(Boolean)
  const isMatch = (surface: string): boolean => qParts.length > 0 && qParts.some(p => normalizeHebrew(surface).includes(p))

  async function selectWord(h: HebrewHit, wordIdx: number, surface: string, key: string) {
    setSelKey(key)
    const reference = `${bookName.get(h.osisId) ?? h.osisId} ${h.chapter}:${h.verse}`
    const verseId = `${h.osisId}.${h.chapter}.${h.verse}`
    if (!mtWords.current[verseId]) {
      const ck = `${h.osisId}.${h.chapter}`
      if (!fetchedCh.current.has(ck)) {
        fetchedCh.current.add(ck)
        try {
          const r = await fetch(`/data/mt/${h.osisId}_${h.chapter}.json`)
          const d: { verses?: MtVerse[] } | null = r.ok ? await r.json() : null
          for (const v of d?.verses ?? []) mtWords.current[v.id] = v.words ?? []
        } catch { fetchedCh.current.delete(ck) }
      }
    }
    const w = mtWords.current[verseId]?.[wordIdx]
    showInfo(w
      ? buildHebrewInfo(w, reference, lexRef.current)
      : { surface, lexeme: surface, gloss: '', partOfSpeech: '', parsing: '', reference, script: 'hebrew' })
  }

  // The verse rendered word-by-word from its text (split on whitespace / maqqef, separators
  // preserved so maqqef joins directly). Each word is clickable → parse; the searched word(s)
  // carry the red search mark. Word index counts only word tokens, aligning with the MT words
  // array (validated corpus-wide) so a click resolves the right word's data.
  function hebrewVerse(h: HebrewHit) {
    const verseId = `${h.osisId}.${h.chapter}.${h.verse}`
    const parts = h.text.split(/(\s+|־)/)
    const verseHl = isAuthenticated ? highlights.forVerse(h.osisId, h.chapter, h.verse, HEBREW_LAYER) : []
    let wi = -1
    let pos = 0
    return parts.map((part, pi) => {
      const start = pos
      pos += part.length
      const end = start + part.length
      if (part === '') return null
      if (/^(?:\s+|־)$/.test(part)) {
        // Paint a separator that sits INSIDE a highlight so a run reads as one stroke.
        const sp = highlightAt(start, end, verseHl)
        return <span key={pi} className={sp ? highlightMarkClass(sp.color) : undefined}>{part}</span>
      }
      wi += 1
      const idx = wi
      const key = `${verseId}.${idx}`
      const matched = h.matchWords?.length ? h.matchWords.includes(part) : isMatch(part)
      const pick = () => void selectWord(h, idx, part, key)
      const mark = highlightAt(start, end, verseHl)
      return (
        <span key={pi} onMouseEnter={pick} onClick={pick}
          onContextMenu={e => {
            e.preventDefault()
            // Hebrew has no Greek corpus to scope to; the menu still offers the word
            // search, the highlight row and the copy row.
            openWordSearch({ x: e.clientX, y: e.clientY, surface: part,
              reference: `${bookName.get(h.osisId) ?? h.osisId} ${h.chapter}:${h.verse}`,
              kind: 'translation', transLang: 'he', book: h.osisId,
              highlight: isAuthenticated ? {
                activeColor: mark?.color ?? null,
                onPick: c => mark
                  ? void highlights.recolor(mark.id, h.osisId, h.chapter, c)
                  : void highlights.create(h.osisId, h.chapter, h.verse, start, end, c, HEBREW_LAYER),
                onRemove: () => { if (mark) void highlights.remove(mark.id, h.osisId, h.chapter) },
              } : undefined })
          }}
          {...(mark ? { 'data-highlight-id': mark.id } : {})}
          className={`cursor-pointer rounded transition-colors hover:bg-brand-100 ${selKey === key ? 'bg-brand-100' : ''}${
            mark ? ` ${highlightMarkClass(mark.color)}` : matched ? ` ${SEARCH_MARK}` : ''}`}>
          {part}
        </span>
      )
    })
  }

  // Fetch the English chapters the hits map ONTO (which can differ from the Hebrew chapter, e.g.
  // Heb Joel 4 → Eng Joel 3), so the right chapter's verses are on hand for the lookup.
  const chapters = new Set<string>()
  for (const h of hits) {
    const eng = mtToEnglish(h.osisId, h.chapter, h.verse)
    if (eng) chapters.add(`${h.osisId}.${eng.chapter}`)
  }

  useEffect(() => {
    if (transLang === 'none') return
    for (const ck of Array.from(chapters)) {
      const [osis, ch] = ck.split('.')
      const trKey = `${transLang}.${ck}`
      if (fetchedTr.current.has(trKey)) continue
      fetchedTr.current.add(trKey)
      fetch(`/api/translation?book=${osis}&chapter=${ch}&lang=${transLang}`)
        .then(r => (r.ok ? r.json() : { verses: {} }))
        .then((d: { verses?: Record<string, string> }) => {
          Object.assign((trans.current[transLang] ??= {}), d.verses ?? {})
          bump(x => x + 1)
        })
        .catch(() => { fetchedTr.current.delete(trKey) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, transLang])

  const showTrans = transLang !== 'none'
  const trMap = showTrans ? trans.current[transLang] ?? {} : {}

  return (
    <div ref={resultsRef}>
      <div className="divide-y divide-gray-100">
        {hits.map((h, i) => {
          const eng = mtToEnglish(h.osisId, h.chapter, h.verse)
          const vid = eng ? `${h.osisId}.${eng.chapter}.${eng.verse}` : null
          return (
            <div key={i} className="py-2.5">
              <span className="inline-flex items-center gap-1.5">
                <button onClick={() => onOpen(h, transLang)} className="text-xs font-medium text-brand-600 hover:underline">
                  {bookName.get(h.osisId) ?? h.osisId} {h.chapter}:{h.verse}
                </button>
                {isAuthenticated && (
                  <VerseNoteButton book={h.osisId} chapter={h.chapter} verse={h.verse}
                    noted={notedKeys.has(`${h.osisId}.${h.chapter}.${h.verse}`)}
                    onChanged={() => void loadNoted()} />
                )}
              </span>
              <div className={`mt-1 grid gap-x-4 gap-y-1 items-baseline ${showTrans ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Same size the Reader's Hebrew column uses so the split view reads as one surface. */}
                <p dir="rtl" className="font-hebrew leading-loose text-gray-800" style={{ fontSize: 'var(--greek-fs, 1.125rem)' }}
                  {...verseAnchorProps(h.osisId, h.chapter, h.verse, HEBREW_LAYER)}>
                  {hebrewVerse(h)}
                </p>
                {showTrans && (
                  // The English carries the same word menu as the Hebrew beside it — it used to
                  // render as an inert string, so a word noticed in the translation could not be
                  // searched or looked up without first finding it somewhere else.
                  <p onContextMenu={forwardContextMenuToNearestTransWord}
                    className="font-reading leading-relaxed text-gray-700 sm:border-l sm:border-gray-100 sm:pl-4">
                    {vid === null
                      ? <span className="text-gray-400 italic">(superscription)</span>
                      : trMap[vid]
                        ? <TransWords text={trMap[vid]} lang={transLang} book={h.osisId}
                            reference={`${bookName.get(h.osisId) ?? h.osisId} ${h.chapter}:${h.verse}`}
                            hl={isAuthenticated ? {
                              isAuthenticated,
                              verseHighlights: highlights.forVerse(h.osisId, h.chapter, h.verse, transLang),
                              create: (st, en, c) => void highlights.create(h.osisId, h.chapter, h.verse, st, en, c, transLang),
                              recolor: (id, c) => void highlights.recolor(id, h.osisId, h.chapter, c),
                              remove: id => void highlights.remove(id, h.osisId, h.chapter),
                            } : undefined} />
                        : <span className="text-gray-300 italic">…</span>}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Full page (no host pane): dock the parsing pane here, like the Greek results. */}
      {!useSink && <ParsingDock info={info} />}

      {isAuthenticated && <TouchHighlighter containerRef={resultsRef} onRange={highlightSelection.openForRange} />}
      {isAuthenticated && highlightSelection.popup && (
        <HighlightPopup
          state={highlightSelection.popup}
          onPick={color => {
            const state = highlightSelection.popup!
            if (state.kind === 'new') for (const sp of state.splits) void highlights.create(sp.book, sp.chapter, sp.verse, sp.start, sp.end, color, sp.layer)
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
