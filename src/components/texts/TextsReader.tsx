'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { TEXT_CATEGORIES, type CatalogWork } from '@/lib/texts-catalog'

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

export function TextsReader({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [catId, setCatId] = useState('apocrypha')
  const [work, setWork] = useState<CatalogWork | null>(null)
  const [jbook, setJbook] = useState(1)      // Josephus book number
  const [chapter, setChapter] = useState(1)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEnglish, setShowEnglish] = useState(true)

  // Parsing window (Greek only)
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // Per-verse notes
  const [notedKeys, setNotedKeys] = useState<Set<number>>(new Set())

  const brentonCache = useRef<Record<string, Record<string, string>>>({})
  const bsbCache = useRef<Record<string, string> | null>(null)

  const category = TEXT_CATEGORIES.find(c => c.id === catId)!
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
    setShowEnglish(true)
  }

  const chapterCount = work?.source === 'josephus'
    ? (work.books?.[jbook - 1] ?? 1)
    : (work?.chapters ?? 1)

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* ── Category rail + work grid ── */}
      <div className="flex flex-wrap gap-1.5">
        {TEXT_CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => { if (!c.comingSoon) { setCatId(c.id); setWork(null) } }}
            disabled={c.comingSoon}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              c.id === catId ? 'bg-brand-100 border-brand-300 text-brand-800'
              : c.comingSoon ? 'border-gray-200 text-gray-300 cursor-default'
              : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
          >
            {c.label}{c.comingSoon && <span className="ml-1 text-[10px]">soon</span>}
          </button>
        ))}
      </div>

      {!work ? (
        <div>
          {category.blurb && <p className="text-sm text-gray-500 mb-3">{category.blurb}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {category.works.map(w => (
              <button
                key={w.id}
                onClick={() => openWork(w)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 text-left hover:border-brand-300 hover:bg-brand-50 transition-colors"
              >
                {w.name}
                <span className="block text-[11px] text-gray-400 mt-0.5">
                  {w.source === 'josephus' ? `${w.books!.length} book${w.books!.length > 1 ? 's' : ''}`
                    : w.source === 'lxx' ? (w.english ? 'Greek + English' : 'Greek') : 'English'}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col min-h-0 flex-1 gap-3">
          {/* Selection bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setWork(null)} className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">← {category.label}</button>
            <span className="text-sm font-semibold text-gray-800">{work.name}</span>

            {work.source === 'josephus' && work.books!.length > 1 && (
              <label className="text-xs text-gray-500 inline-flex items-center gap-1">
                Book
                <select value={jbook} onChange={e => { setJbook(Number(e.target.value)); setChapter(1) }} className="rounded-lg border border-gray-300 px-2 py-1 text-sm">
                  {work.books!.map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
              </label>
            )}

            {chapterCount > 1 && (
              <label className="text-xs text-gray-500 inline-flex items-center gap-1">
                {work.source === 'lxx' || work.source === '2esdras' ? 'Chapter' : 'Chapter'}
                <select value={chapter} onChange={e => setChapter(Number(e.target.value))} className="rounded-lg border border-gray-300 px-2 py-1 text-sm">
                  {Array.from({ length: chapterCount }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            )}

            {isGreek && hasEnglish && (
              <button
                onClick={() => setShowEnglish(v => !v)}
                className={`ml-auto rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${showEnglish ? 'bg-brand-100 border-brand-300 text-brand-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                {showEnglish ? 'Hide English' : 'Show English'}
              </button>
            )}
          </div>

          {/* Reading pane */}
          <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-4">
            {loading || !rows ? (
              <p className="text-xs text-gray-300 italic">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No text found.</p>
            ) : (
              <div className="space-y-2">
                {rows.map(row => (
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
                        <span className="font-greek text-[1.35rem]">
                          {row.tokens && row.tokens.length > 0
                            ? row.tokens.map((tok, ti) => {
                                const key = `${row.num}.${ti}`
                                const select = () => { setSelectedInfo(toLexicalInfo(tok, `${refLabel}:${row.num}`)); setSelectedKey(key) }
                                return (
                                  <span key={ti} onMouseEnter={select} onClick={select}
                                    className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''}`}>
                                    {tok.surface}{ti < row.tokens!.length - 1 ? ' ' : ''}
                                  </span>
                                )
                              })
                            : row.greek}
                        </span>
                      ) : (
                        <span className="text-[0.95rem]">{row.english}</span>
                      )}
                    </p>

                    {/* Parallel English column (Greek works only) */}
                    {isGreek && showEnglish && hasEnglish && (
                      <p className="leading-relaxed text-gray-600 text-[0.95rem] lg:border-l lg:border-gray-100 lg:pl-4">
                        <sup className="text-[10px] text-gray-300 mr-0.5 font-sans">{row.num}</sup>
                        {row.english ?? <span className="text-gray-300 italic">—</span>}
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
      )}
    </div>
  )
}
