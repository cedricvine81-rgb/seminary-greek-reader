'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { FONT_SIZE_MAP, FONT_SIZES, type PhraseFontSize } from './PhraseExplorer'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { openWordSearch } from '@/lib/word-search-bus'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { witnessInfo, FAMILY_COLOR, FAMILY_LABEL, type WitnessFamily } from '@/lib/witness-info'

// ── Textual-variants tab ────────────────────────────────────────────────────────────────
// A Swanson-style manuscript collation: one line per witness, word-aligned into columns so
// differences line up vertically, with the sigla down the right margin. The Byzantine
// majority (Robinson–Pierpont) is the reference line; each early witness (great uncials +
// papyri) is shown against it. Data is built by scripts/build-variants.py from the CNTR
// transcriptions (CC BY-SA 4.0) into /data/variants/<Osis>_<ch>.json.
//
// Any Greek word (reference or witness) is clickable/hoverable to fill the shared parsing
// pane below (morphology comes from the base /data/gnt text, matched by surface form), and
// each verse carries a note button anchored to (book, chapter, verse) like the other tools.

type Cell = { t: string; d: boolean; o: boolean }
type Row = { wid: string; sigil: string; family: WitnessFamily; cells: Cell[] }
type Verse = { verse: number; vid: string; refTokens: string[]; rows: Row[]; lac: string[] }
type ChapterData = {
  book: string; chapter: number; reference: string
  witnesses: { wid: string; sigil: string; family: WitnessFamily }[]
  verses: Verse[]; source: string
}
type WordToken = { surface: string; parsing: string; lemma: string; gloss?: string; strongs?: string }

// gnt morph fields, in the order the parsing pane reads best.
const GNT_MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
function formatGntMorph(m: Record<string, string | null> | undefined): string {
  if (!m) return ''
  return GNT_MORPH_ORDER.map(k => m[k]).filter(Boolean).join(', ')
}

// NT books with the OSIS ids used for /data/variants/<osis>_<ch>.json filenames.
const NT_BOOKS: { osis: string; name: string; abbr: string[] }[] = [
  { osis: 'Matt', name: 'Matthew', abbr: ['mt', 'matt'] }, { osis: 'Mark', name: 'Mark', abbr: ['mk', 'mrk'] },
  { osis: 'Luke', name: 'Luke', abbr: ['lk', 'luk'] }, { osis: 'John', name: 'John', abbr: ['jn', 'jhn'] },
  { osis: 'Acts', name: 'Acts', abbr: ['ac', 'act'] }, { osis: 'Rom', name: 'Romans', abbr: ['ro', 'rom'] },
  { osis: '1Cor', name: '1 Corinthians', abbr: ['1co', '1cor'] }, { osis: '2Cor', name: '2 Corinthians', abbr: ['2co', '2cor'] },
  { osis: 'Gal', name: 'Galatians', abbr: ['ga', 'gal'] }, { osis: 'Eph', name: 'Ephesians', abbr: ['eph'] },
  { osis: 'Phil', name: 'Philippians', abbr: ['php', 'phil'] }, { osis: 'Col', name: 'Colossians', abbr: ['col'] },
  { osis: '1Thess', name: '1 Thessalonians', abbr: ['1th', '1thess'] }, { osis: '2Thess', name: '2 Thessalonians', abbr: ['2th', '2thess'] },
  { osis: '1Tim', name: '1 Timothy', abbr: ['1ti', '1tim'] }, { osis: '2Tim', name: '2 Timothy', abbr: ['2ti', '2tim'] },
  { osis: 'Titus', name: 'Titus', abbr: ['tit'] }, { osis: 'Phlm', name: 'Philemon', abbr: ['phm', 'phlm'] },
  { osis: 'Heb', name: 'Hebrews', abbr: ['heb'] }, { osis: 'Jas', name: 'James', abbr: ['jas', 'jm'] },
  { osis: '1Pet', name: '1 Peter', abbr: ['1pe', '1pet'] }, { osis: '2Pet', name: '2 Peter', abbr: ['2pe', '2pet'] },
  { osis: '1John', name: '1 John', abbr: ['1jn', '1jhn'] }, { osis: '2John', name: '2 John', abbr: ['2jn', '2jhn'] },
  { osis: '3John', name: '3 John', abbr: ['3jn', '3jhn'] }, { osis: 'Jude', name: 'Jude', abbr: ['jud', 'jude'] },
  { osis: 'Rev', name: 'Revelation', abbr: ['re', 'rev', 'rv'] },
]
const AVAILABLE_HINT = 'Matt 12 · all of John · Luke 11 · Luke 23 · Rom 3 · 1 Cor 13 · Gal 1 · Rev 1 · 1 Pet 1 · Jude'

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '')
// Greek key for surface-form lookup: strip accents/breathing, lowercase, final-sigma → σ.
function gkey(s: string): string {
  const d = s.normalize('NFD').toLowerCase().replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ')
  return d.replace(/[^α-ω]/g, '')
}
// CNTR transcribes the manuscripts in bare lowercase with medial σ everywhere. Restore the
// final-sigma form (σ → ς when the sigma isn't followed by another Greek letter) so witness
// words read naturally; accents are supplied separately from the reference / base text.
function finalSigma(s: string): string {
  return s.replace(/σ(?![Ͱ-Ͽἀ-῿])/g, 'ς')
}

function parseRef(ref: string): { osis: string; name: string; chapter: number; vStart: number; vEnd: number } | null {
  const q = ref.trim().replace(/[–—]/g, '-')
  const m = q.match(/^((?:\d\s*)?[A-Za-z][A-Za-z\s]*?)\s+(\d+)(?:\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!m) return null
  const bp = norm(m[1])
  const book = NT_BOOKS.find(b => norm(b.name) === bp || b.osis.toLowerCase() === bp || b.abbr.includes(bp)
    || norm(b.name).startsWith(bp) || b.osis.toLowerCase().startsWith(bp))
  if (!book) return null
  const chapter = parseInt(m[2], 10)
  const vStart = m[3] ? parseInt(m[3], 10) : 0                 // 0 = whole chapter
  const vEnd = m[4] ? parseInt(m[4], 10) : (m[3] ? vStart : 999)
  return { osis: book.osis, name: book.name, chapter, vStart, vEnd }
}

const SOURCE_ATTR = 'Manuscript transcriptions: Center for New Testament Restoration (Alan Bunning), CC BY-SA 4.0. '
  + 'Reference line: Robinson–Pierpont Byzantine Majority Text. Reproduces the layout of R. Swanson’s New Testament Greek Manuscripts.'

export function VariantsView({ controlledPassage, isAuthenticated = false, fontSize: controlledFontSize, onFontSize, onAttribution, diplomatic = false }: {
  controlledPassage?: string
  isAuthenticated?: boolean
  fontSize?: PhraseFontSize
  onFontSize?: (s: PhraseFontSize) => void
  onAttribution?: (a: string) => void
  diplomatic?: boolean   // show the raw CNTR transcription (bare, medial σ, unaccented) instead of the readable overlay
}) {
  const isFontControlled = controlledFontSize !== undefined
  const [internalFont, setInternalFont] = useState<PhraseFontSize>('lg')
  const fontSize = isFontControlled ? (controlledFontSize ?? 'lg') : internalFont
  const setFontSize = (s: PhraseFontSize) => { onFontSize?.(s); if (!isFontControlled) setInternalFont(s) }

  const parsed = useMemo(() => parseRef(controlledPassage ?? ''), [controlledPassage])
  const [data, setData] = useState<ChapterData | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'missing' | 'nonNT'>('idle')
  const [info, setInfo] = useState<{ wid: string; sigil: string; family: WitnessFamily; x: number; y: number } | null>(null)
  // Parsing pane: morphology per verse, keyed by Greek surface form (from the base gnt text).
  const [parseMap, setParseMap] = useState<Record<number, Record<string, WordToken>>>({})
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const reqRef = useRef(0)

  useEffect(() => { onAttribution?.(SOURCE_ATTR) }, [onAttribution])

  // Load the collation for the chapter.
  useEffect(() => {
    setInfo(null); setSelectedInfo(null); setSelectedKey(null)
    if (!controlledPassage?.trim()) { setStatus('idle'); return }
    if (!parsed) { setStatus('nonNT'); setData(null); return }
    const id = ++reqRef.current
    setStatus('loading')
    fetch(`/data/variants/${parsed.osis}_${parsed.chapter}.json`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: ChapterData) => { if (id === reqRef.current) { setData(d); setStatus('ok') } })
      .catch(() => { if (id === reqRef.current) { setData(null); setStatus('missing') } })
  }, [controlledPassage, parsed])

  // Load base-text morphology (gnt) for the same chapter → parsing-pane lookups.
  useEffect(() => {
    setParseMap({})
    if (!parsed) return
    let alive = true
    type GntWord = { surface: string; lemma?: string; strongs?: string; morph?: Record<string, string | null> }
    fetch(`/data/gnt/${parsed.osis}_${parsed.chapter}.json`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: { verses?: { verse: number; words?: GntWord[] }[] }) => {
        if (!alive) return
        const map: Record<number, Record<string, WordToken>> = {}
        for (const v of d.verses ?? []) {
          const byWord: Record<string, WordToken> = {}
          for (const w of v.words ?? []) {
            const tok: WordToken = { surface: w.surface, parsing: formatGntMorph(w.morph), lemma: w.lemma ?? '', strongs: w.strongs }
            const k = gkey(w.surface)
            if (k && !byWord[k]) byWord[k] = tok
          }
          map[v.verse] = byWord
        }
        setParseMap(map)
      })
      .catch(() => { if (alive) setParseMap({}) })
    return () => { alive = false }
  }, [parsed])

  // Per-verse note markers for this chapter (signed-in users). Keyed "osis.chapter.verse".
  const [notedKeys, setNotedKeys] = useState<Set<string>>(new Set())
  const refreshNotes = useCallback(async () => {
    if (!isAuthenticated || !parsed) { setNotedKeys(new Set()); return }
    try {
      const r = await fetch(`/api/notes?book=${parsed.osis}&chapter=${parsed.chapter}&verseStart=1&verseEnd=200`)
      const d = await r.json()
      const keys = new Set<string>()
      for (const n of (d.notes ?? []) as { verse: number }[]) keys.add(`${parsed.osis}.${parsed.chapter}.${n.verse}`)
      setNotedKeys(keys)
    } catch { setNotedKeys(new Set()) }
  }, [isAuthenticated, parsed])
  useEffect(() => { refreshNotes() }, [refreshNotes])
  useEffect(() => onNotesChanged(refreshNotes), [refreshNotes])

  const shownVerses = useMemo(() => {
    if (!data || !parsed) return []
    if (parsed.vStart === 0) return data.verses
    return data.verses.filter(v => v.verse >= parsed.vStart && v.verse <= parsed.vEnd)
  }, [data, parsed])

  function lexInfo(tok: WordToken, verse: number): LexicalInfoPanel {
    return {
      surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '', partOfSpeech: '',
      parsing: tok.parsing, strongs: tok.strongs, reference: `${parsed?.name ?? ''} ${parsed?.chapter}:${verse}`,
    }
  }
  // Selecting a Greek word: look up its parse by surface form in the base text for that verse.
  function selectWord(text: string, verse: number, key: string) {
    const tok = parseMap[verse]?.[gkey(text)]
    if (!tok) return
    setSelectedInfo(lexInfo(tok, verse)); setSelectedKey(key)
  }

  // Default pane content before any click: the first reference word we can parse.
  const defaultParsingInfo: LexicalInfoPanel | null = useMemo(() => {
    for (const v of shownVerses) {
      for (const t of v.refTokens) {
        const tok = parseMap[v.verse]?.[gkey(t)]
        if (tok) return lexInfo(tok, v.verse)
      }
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownVerses, parseMap])

  const fs = FONT_SIZE_MAP[fontSize]

  // One clickable Greek word inside a collation cell.
  function GreekWord({ text, verse, wkey, bold }: { text: string; verse: number; wkey: string; bold?: boolean }) {
    const parsable = !!parseMap[verse]?.[gkey(text)]
    return (
      <span
        onMouseEnter={parsable ? () => selectWord(text, verse, wkey) : undefined}
        onClick={parsable ? e => { e.stopPropagation(); selectWord(text, verse, wkey) } : undefined}
        onContextMenu={e => {
          e.preventDefault()
          openWordSearch({ x: e.clientX, y: e.clientY, surface: text, lemma: parseMap[verse]?.[gkey(text)]?.lemma || null,
            reference: `${parsed?.name ?? ''} ${parsed?.chapter}:${verse}`, kind: 'greek', greekCorpus: 'GNT' })
        }}
        className={`rounded px-0.5 ${parsable ? 'cursor-pointer hover:bg-brand-100' : ''} ${selectedKey === wkey ? 'bg-brand-100' : ''} ${bold ? 'font-semibold' : ''}`}
      >
        {text}
      </span>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-1 pb-4" onClick={() => info && setInfo(null)}>
        {status === 'idle' && (
          <p className="text-gray-400 text-sm mt-6 text-center">Enter a New Testament passage to compare its manuscript witnesses.</p>
        )}
        {status === 'nonNT' && (
          <p className="text-gray-500 text-sm mt-6 text-center">Textual-variant data covers the <b>New Testament</b>. Try e.g. <span className="font-medium">John 1:1-5</span>.</p>
        )}
        {status === 'loading' && <p className="text-gray-400 text-sm mt-6 text-center">Loading witnesses…</p>}
        {status === 'missing' && (
          <div className="text-gray-500 text-sm mt-6 text-center space-y-1">
            <p>No collation generated for <b>{parsed?.name} {parsed?.chapter}</b> yet.</p>
            <p className="text-gray-400">Available now: {AVAILABLE_HINT}.</p>
          </div>
        )}

        {status === 'ok' && data && (
          <>
            <div className="text-center mb-3 mt-1">
              <div className="text-[0.7rem] tracking-widest font-semibold text-gray-400 uppercase">Manuscript Collation</div>
              <div className="text-lg font-semibold text-gray-800 font-greek">{data.reference}</div>
            </div>

            {shownVerses.map(v => (
              <div key={v.vid} className="mb-4">
                <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5">
                  <table className="border-collapse font-greek" style={{ fontSize: fs, whiteSpace: 'nowrap' }}>
                    <tbody>
                      {v.rows.map((r, ri) => {
                        const isRef = r.wid === 'RP'
                        return (
                          <tr key={`${r.wid}-${ri}`} className={isRef ? 'font-semibold' : ''}>
                            <td className="pr-2 align-baseline text-[0.7rem] font-mono text-gray-300 select-none whitespace-nowrap">
                              {ri === 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <span>{v.verse}</span>
                                  <span className="font-sans"><VerseNoteButton book={parsed!.osis} chapter={parsed!.chapter} verse={v.verse}
                                    noted={notedKeys.has(`${parsed!.osis}.${parsed!.chapter}.${v.verse}`)} onChanged={refreshNotes} /></span>
                                </span>
                              )}
                            </td>
                            {r.cells.map((c, ci) => {
                              // Overlay proper Greek on the bare CNTR witness forms: prefer the
                              // accented base-text form, else the accented reference word when the
                              // witness agrees, else just restore the final sigma.
                              const refCell = v.rows[0].cells[ci]
                              const acc = parseMap[v.verse]?.[gkey(c.t)]?.surface
                              const shown = isRef ? c.t
                                : diplomatic ? c.t   // raw CNTR form, as transcribed
                                : acc ?? (!c.d && refCell?.t ? refCell.t.replace(/^[¶*]+/, '') : finalSigma(c.t))
                              return (
                                <td key={ci} className={`pr-[7px] align-baseline ${c.d ? 'underline decoration-1 underline-offset-2' : ''} ${c.o ? 'text-gray-300' : ''}`}>
                                  {c.o ? '—' : <GreekWord text={shown} verse={v.verse} wkey={`${v.vid}.${ri}.${ci}`} bold={isRef} />}
                                </td>
                              )
                            })}
                            <td className="sticky right-0 pl-3 align-baseline bg-white text-left border-l border-gray-100">
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setInfo({ wid: r.wid, sigil: r.sigil, family: r.family, x: rect.left, y: rect.bottom }) }}
                                className="inline-flex items-center gap-1.5 font-mono text-[0.8rem] font-semibold text-gray-600 hover:text-brand-700"
                                title="Manuscript information"
                              >
                                <span className="inline-block w-[7px] h-[7px] rounded-full" style={{ background: FAMILY_COLOR[r.family] }} />
                                {r.sigil}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {v.lac.length > 0 && (
                  <div className="text-[0.7rem] text-gray-400 mt-0.5 pl-6">
                    <span className="font-mono font-semibold">lac.</span> {v.lac.join(' ')} <span className="text-gray-300">(absent here)</span>
                  </div>
                )}
              </div>
            ))}

            {/* Legend */}
            <div className="text-[0.7rem] text-gray-400 mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 items-center pl-1">
              <span>Reference: <b className="font-greek">𝔐</b> Byzantine majority</span>
              <span>Underline = differs · — = omission</span>
              {(['alexandrian', 'byzantine', 'western', 'mixed'] as WitnessFamily[]).map(f => (
                <span key={f} className="inline-flex items-center gap-1">
                  <span className="inline-block w-[7px] h-[7px] rounded-full" style={{ background: FAMILY_COLOR[f] }} />{FAMILY_LABEL[f]}
                </span>
              ))}
              <span className="text-gray-300">· Click a word to parse it · click a siglum for manuscript details</span>
            </div>
          </>
        )}
      </div>

      {/* Shared parsing pane — filled by clicking/hovering any Greek word above. */}
      {status === 'ok' && (
        <ResizableParsingPane storageKey="variants" info={selectedInfo ?? defaultParsingInfo} bgClass="bg-gray-50" />
      )}

      {/* Witness info popover */}
      {info && (() => {
        const wi = witnessInfo(info.wid, info.sigil, info.family)
        const left = Math.min(info.x, (typeof window !== 'undefined' ? window.innerWidth : 400) - 340)
        const top = Math.min(info.y + 6, (typeof window !== 'undefined' ? window.innerHeight : 600) - 260)
        return (
          <div className="fixed z-50 w-80 max-w-[92vw] rounded-xl border border-gray-200 bg-popover shadow-xl p-4"
            style={{ left: Math.max(8, left), top: Math.max(8, top) }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <span className="font-greek text-xl font-semibold text-gray-800">{wi.sigil}</span>
                {wi.ga && <span className="ml-2 text-xs font-mono text-gray-400">GA {wi.ga}</span>}
                <div className="text-sm font-medium text-gray-700 leading-tight">{wi.name}</div>
              </div>
              <button onClick={() => setInfo(null)} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={15} /></button>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: FAMILY_COLOR[wi.family] }} />
              <span className="text-xs text-gray-500">{FAMILY_LABEL[wi.family]} text</span>
            </div>
            <dl className="space-y-1 text-xs text-gray-600">
              <div className="flex gap-2"><dt className="w-20 shrink-0 text-gray-400">Date</dt><dd>{wi.date}</dd></div>
              <div className="flex gap-2"><dt className="w-20 shrink-0 text-gray-400">Contents</dt><dd>{wi.contents}</dd></div>
              <div className="flex gap-2"><dt className="w-20 shrink-0 text-gray-400">Provenance</dt><dd>{wi.provenance}</dd></div>
            </dl>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed border-t border-gray-100 pt-2">{wi.importance}</p>
          </div>
        )
      })()}

      {/* Non-controlled font control (standalone use, outside the shared tools menu) */}
      {!isFontControlled && status === 'ok' && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-popover border border-gray-200 rounded-full px-3 py-1.5 shadow z-40">
          <span className="text-gray-400 font-greek" style={{ fontSize: '0.8rem' }}>Α</span>
          <input type="range" min={0} max={FONT_SIZES.length - 1} value={FONT_SIZES.indexOf(fontSize)}
            onChange={e => setFontSize(FONT_SIZES[e.target.valueAsNumber])} className="accent-brand-600 w-24" />
          <span className="text-gray-400 font-greek" style={{ fontSize: '1.3rem' }}>Α</span>
        </div>
      )}
    </div>
  )
}
