'use client'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Search } from 'lucide-react'
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

// Short, readable note-anchor prefixes for Josephus works (book string = "Ant.18" etc.).
const JOS_SHORT: Record<string, string> = { antiquities: 'Ant', 'jewish-war': 'JW', 'against-apion': 'AgAp', life: 'Life' }

const FONT_SIZE_MAP: Record<PhraseFontSize, string> = { sm: '1.05rem', md: '1.25rem', lg: '1.45rem', xl: '1.7rem' }

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
  const [jbook, setJbook] = useState(1)      // Josephus book number
  const [chapter, setChapter] = useState(1)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEnglish, setShowEnglish] = useState(true)
  const [search, setSearch] = useState('')

  // Parsing window (Greek only)
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // Per-verse notes
  const [notedKeys, setNotedKeys] = useState<Set<number>>(new Set())

  const brentonCache = useRef<Record<string, Record<string, string>>>({})
  const bsbCache = useRef<Record<string, string> | null>(null)

  const isGreek = work?.source === 'lxx'
  const hasEnglish = work ? (work.source === 'lxx' ? !!work.english : true) : false

  // The canonical note anchor (book string) for the current selection.
  const noteBook = !work ? ''
    : work.source === 'lxx' ? work.osisId!
    : work.source === '2esdras' ? '2Esdras'
    : `${JOS_SHORT[work.work!] ?? work.work}.${jbook}`

  const refLabel = !work ? ''
    : work.source === 'josephus'
      ? `${work.name} ${jbook}.${chapter}`
      : `${work.name} ${chapter}`

  const refreshNotes = useCallback(async () => {
    if (!isAuthenticated || !work) { setNotedKeys(new Set()); return }
    try {
      const r = await fetch(`/api/notes?book=${encodeURIComponent(noteBook)}&chapter=${chapter}&verseStart=1&verseEnd=500`)
      const d = await r.json()
      setNotedKeys(new Set((d.notes ?? []).map((n: { verse: number }) => n.verse)))
    } catch { /* ignore */ }
  }, [isAuthenticated, work, noteBook, chapter])

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

  // ── Load the current chapter/section whenever the selection changes ──
  useEffect(() => {
    if (!work) return
    let cancelled = false
    setLoading(true); setRows(null); setSelectedInfo(null); setSelectedKey(null)

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

    async function run() {
      const w = work!
      let out: Row[] = []
      if (w.source === 'lxx') {
        const r = await fetch(`/api/reader?book=${w.osisId}&chapter=${chapter}&corpus=NA1904`)
        const d = await r.json()
        type V = { verse: number; text?: string; words?: { surface: string; lexeme?: { lexeme: string; gloss?: string; strongs?: string }; parses?: Record<string, string | null>[] }[] }
        let eng: Record<string, string> = {}
        if (w.english === 'brenton') eng = await loadBrenton(w.osisId!)
        else if (w.english === 'bsb') eng = await loadBsb()
        out = (d.verses ?? []).map((v: V) => ({
          num: v.verse,
          tokens: (v.words ?? []).map(word => ({
            surface: word.surface, lemma: word.lexeme?.lexeme ?? '', gloss: word.lexeme?.gloss, strongs: word.lexeme?.strongs,
            parsing: word.parses?.[0] ? formatMorph(word.parses[0]) : '',
          })),
          greek: v.text ?? (v.words ?? []).map(word => word.surface).join(' '),
          english: eng[`${w.osisId}.${chapter}.${v.verse}`],
        }))
      } else if (w.source === 'josephus') {
        const r = await fetch(`/data/josephus/${w.work}/${jbook}.json`)
        const d = r.ok ? await r.json() : null
        const ch = d?.chapters?.find((c: { number: number }) => c.number === chapter)
        out = (ch?.sections ?? []).map((s: { number: number; text: string }) => ({ num: s.number, english: s.text }))
      } else if (w.source === '2esdras') {
        const r = await fetch('/data/apocrypha/2esdras.json')
        const d = r.ok ? await r.json() : null
        const ch = d?.chapters?.find((c: { number: number }) => c.number === chapter)
        out = (ch?.verses ?? []).map((v: { number: number; text: string }) => ({ num: v.number, english: v.text }))
      }
      if (!cancelled) { setRows(out); setLoading(false) }
    }
    void run()
    void refreshNotes()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [work, jbook, chapter])

  function openWork(w: CatalogWork) {
    setWork(w); setJbook(1); setChapter(1)
    setShowEnglish(true); setSearch('')
  }

  const chapterCount = work?.source === 'josephus'
    ? (work.books?.[jbook - 1] ?? 1)
    : (work?.chapters ?? 1)

  const q = search.trim().toLowerCase()
  const filteredRows = useMemo(() => {
    if (!rows || !q) return rows
    return rows.filter(r =>
      r.greek?.toLowerCase().includes(q) ||
      r.english?.toLowerCase().includes(q) ||
      r.tokens?.some(t => t.surface.toLowerCase().includes(q)))
  }, [rows, q])

  return (
    <div className="flex flex-col gap-3 h-full min-h-0" style={{ '--tx-fs': FONT_SIZE_MAP[fontSize] } as CSSProperties}>
      {/* ── Category headings — click one to reveal its books below ── */}
      <div className="flex-none flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {TEXT_CATEGORIES.map(cat => {
            const isActive = !!work && cat.works.some(w => w.id === work.id)
            return (
              <button
                key={cat.id}
                type="button"
                disabled={cat.comingSoon}
                onClick={() => setOpenCat(c => c === cat.id ? null : cat.id)}
                className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                  cat.comingSoon ? 'border-gray-200 text-gray-300 cursor-default'
                  : openCat === cat.id ? 'bg-brand-100 border-brand-300 text-brand-800'
                  : isActive ? 'border-brand-300 text-brand-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                {cat.label}{cat.comingSoon && <span className="ml-1 text-[10px]">soon</span>}
              </button>
            )
          })}
        </div>

        {openCat && (() => {
          const cat = TEXT_CATEGORIES.find(c => c.id === openCat)
          if (!cat) return null
          return (
            <select
              autoFocus
              value={work && cat.works.some(w => w.id === work.id) ? work.id : ''}
              onChange={e => {
                const w = cat.works.find(x => x.id === e.target.value)
                if (w) { openWork(w); setOpenCat(null) }
              }}
              className="w-full sm:w-64 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="" disabled>Select…</option>
              {cat.works.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          )
        })()}
      </div>

      {/* ── Reading pane — always visible ── */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        {work && (
          <div className="flex-none flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{work.name}</span>

            {work.source === 'josephus' && work.books!.length > 1 && (
              <label className="text-xs text-gray-500 inline-flex items-center gap-1">
                Book
                <select value={jbook} onChange={e => { setJbook(Number(e.target.value)); setChapter(1) }} className="rounded border border-gray-300 px-2 py-1 text-xs">
                  {work.books!.map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
              </label>
            )}

            {chapterCount > 1 && (
              <label className="text-xs text-gray-500 inline-flex items-center gap-1">
                Chapter
                <select value={chapter} onChange={e => setChapter(Number(e.target.value))} className="rounded border border-gray-300 px-2 py-1 text-xs">
                  {Array.from({ length: chapterCount }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            )}

            {isGreek && hasEnglish && (
              <button
                onClick={() => setShowEnglish(v => !v)}
                className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${showEnglish ? 'bg-brand-100 border-brand-300 text-brand-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                {showEnglish ? 'Hide English' : 'Show English'}
              </button>
            )}
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
            placeholder={work ? 'Search this chapter…' : 'Select a text above to begin reading'}
            className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-4">
          {!work ? (
            <p className="text-sm text-gray-400 italic">Choose a category above and select a text to start reading.</p>
          ) : loading || !rows ? (
            <p className="text-xs text-gray-300 italic">Loading…</p>
          ) : !filteredRows || filteredRows.length === 0 ? (
            <p className="text-xs text-gray-400 italic">{q ? 'No matches in this chapter.' : 'No text found.'}</p>
          ) : (
            <div className="space-y-2">
              {filteredRows.map(row => (
                <div key={row.num} className={`grid gap-4 ${isGreek && showEnglish && hasEnglish ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Greek (or, for prose works, the single English column) */}
                  <p className="leading-relaxed text-gray-900">
                    {isAuthenticated && (
                      <span className="font-sans align-middle mr-0.5">
                        <VerseNoteButton book={noteBook} chapter={chapter} verse={row.num} noted={notedKeys.has(row.num)} onChanged={refreshNotes} />
                      </span>
                    )}
                    <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{row.num}</sup>
                    {isGreek ? (
                      <span className="font-greek" style={{ fontSize: 'var(--tx-fs, 1.45rem)' }}>
                        {row.tokens && row.tokens.length > 0
                          ? row.tokens.map((tok, ti) => {
                              const key = `${row.num}.${ti}`
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
          )}
        </div>

        {/* Parsing window — Greek works only */}
        {isGreek && <ParsingPanel info={selectedInfo} bgClass="bg-gray-50" />}
      </div>
    </div>
  )
}
