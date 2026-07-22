'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X, ChevronDown, Info, Printer } from 'lucide-react'
import { FONT_SIZE_MAP, FONT_SIZES, type PhraseFontSize } from './PhraseExplorer'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { openWordSearch } from '@/lib/word-search-bus'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { witnessInfo, FAMILY_COLOR, FAMILY_LABEL, type WitnessFamily } from '@/lib/witness-info'
import { VARIANT_NOTES } from '@/lib/variant-notes'

// ── Textual-variants tab ────────────────────────────────────────────────────────────────
// A Swanson-style manuscript collation: one line per witness, word-aligned into columns so
// differences line up vertically, with the sigla down the right margin. Data is built by
// scripts/build-variants.py from the CNTR transcriptions (CC BY-SA 4.0).
//
// The control bar lets the student narrow, denoise, and re-orient the comparison: pick which
// witnesses show, choose the reference line, hide spelling-only differences, collapse verses
// with no variation, and group identical readings onto one line. Any Greek word is clickable
// for the parsing pane; each verse carries a note button.

type Cell = string   // the witness's word for a column; "" = omission / unused insertion slot
type Row = { wid: string; sigil: string; family: WitnessFamily; cells: Cell[] }
type Verse = { verse: number; vid: string; refTokens: string[]; rows: Row[]; lac: string[] }
type WitRef = { wid: string; sigil: string; family: WitnessFamily }
type ChapterData = {
  book: string; chapter: number; reference: string
  witnesses: WitRef[]
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
// Greek key for surface-form lookup / letter-level difference: strip accents, lowercase, medial σ.
function gkey(s: string): string {
  const d = s.normalize('NFD').toLowerCase().replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ')
  return d.replace(/[^α-ω]/g, '')
}
// Orthographic fold: collapse the common spelling-only variations (itacism vowels, movable-ν,
// doubled consonants, final sigma) so "hide spelling" can tell a real variant from an itacism.
function ofold(s: string): string {
  let x = gkey(s)
  x = x.replace(/ει|οι|υι/g, 'ι').replace(/αι/g, 'ε')
  x = x.replace(/[ηυ]/g, 'ι').replace(/ω/g, 'ο')
  x = x.replace(/([βγδθκλμνπρστφχ])\1/g, '$1')
  x = x.replace(/ν$/, '')
  return x
}
// CNTR transcribes bare, medial-σ; restore the final sigma (σ → ς when not before a Greek letter).
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

// ── derived render model ────────────────────────────────────────────────────────────────
type VMCell = { shown: string; underline: boolean; omit: boolean }
type VMRow = { sigla: WitRef[]; family: WitnessFamily; isRef: boolean; cells: VMCell[] }
type VMVerse = { vid: string; verse: number; rows: VMRow[]; lac: string[]; hasVariant: boolean }

type Controls = { refWid: string; hidden: string[]; hideSpelling: boolean; onlyVariants: boolean; group: boolean }
// Default view: compare against Sinaiticus (ℵ), show only verses with variants, group identical
// readings. Falls back to 𝔐 automatically in chapters where ℵ is lacunose.
const DEFAULT_CONTROLS: Controls = { refWid: '01', hidden: [], hideSpelling: false, onlyVariants: true, group: true }

// On phones the wide grid becomes a per-variation-unit apparatus: for each column where the
// visible witnesses disagree, list each reading with the sigla that support it.
type Unit = { readings: { text: string; nothing: boolean; sigla: WitRef[] }[] }
function variationUnits(rows: VMRow[], hideSpelling: boolean): Unit[] {
  const keyFn = hideSpelling ? ofold : gkey
  const refRow = rows[0]
  const cols = refRow?.cells.length ?? 0
  const units: Unit[] = []
  for (let ci = 0; ci < cols; ci++) {
    const groups = new Map<string, { text: string; nothing: boolean; sigla: WitRef[] }>()
    for (const r of rows) {
      const c = r.cells[ci]; if (!c) continue
      const nothing = c.omit || !c.shown
      const key = nothing ? '∅' : keyFn(c.shown)
      const g = groups.get(key)
      if (g) g.sigla.push(...r.sigla)
      else groups.set(key, { text: c.shown, nothing, sigla: [...r.sigla] })
    }
    if (groups.size <= 1) continue   // all agree → not a variation unit
    const refKey = (() => { const c = refRow.cells[ci]; return (c.omit || !c.shown) ? '∅' : keyFn(c.shown) })()
    const readings = [groups.get(refKey), ...Array.from(groups.entries()).filter(([k]) => k !== refKey).map(([, v]) => v)].filter(Boolean) as Unit['readings']
    units.push({ readings })
  }
  return units
}

export function VariantsView({ controlledPassage, isAuthenticated = false, fontSize: controlledFontSize, onFontSize, onAttribution, diplomatic = false }: {
  controlledPassage?: string
  isAuthenticated?: boolean
  fontSize?: PhraseFontSize
  onFontSize?: (s: PhraseFontSize) => void
  onAttribution?: (a: string) => void
  diplomatic?: boolean   // raw CNTR transcription (bare, medial σ, unaccented) instead of the readable overlay
}) {
  const isFontControlled = controlledFontSize !== undefined
  const [internalFont, setInternalFont] = useState<PhraseFontSize>('lg')
  const fontSize = isFontControlled ? (controlledFontSize ?? 'lg') : internalFont
  const setFontSize = (s: PhraseFontSize) => { onFontSize?.(s); if (!isFontControlled) setInternalFont(s) }

  const parsed = useMemo(() => parseRef(controlledPassage ?? ''), [controlledPassage])
  const [data, setData] = useState<ChapterData | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'missing' | 'nonNT'>('idle')
  const [info, setInfo] = useState<{ wid: string; sigil: string; family: WitnessFamily; x: number; y: number } | null>(null)
  const [parseMap, setParseMap] = useState<Record<number, Record<string, WordToken>>>({})
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const reqRef = useRef(0)

  // ── control-bar state (persisted) ──────────────────────────────────────────────────────
  const [ctrl, setCtrl] = useState<Controls>(DEFAULT_CONTROLS)
  const [openMenu, setOpenMenu] = useState<'ref' | 'wit' | null>(null)
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [openNote, setOpenNote] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const on = () => setIsMobile(mq.matches); on()
    mq.addEventListener('change', on); return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem('variants-controls') || '{}'); setCtrl({ ...DEFAULT_CONTROLS, ...s }) } catch { /* ignore */ }
  }, [])
  const setControls = (patch: Partial<Controls>) => setCtrl(c => {
    const next = { ...c, ...patch }
    localStorage.setItem('variants-controls', JSON.stringify(next))
    return next
  })
  useEffect(() => {
    if (!openMenu) return
    const h = (e: MouseEvent) => { if (barRef.current && !barRef.current.contains(e.target as Node)) setOpenMenu(null) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [openMenu])

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

  // Load base-text morphology (gnt) for the same chapter → parsing-pane lookups + accent overlay.
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

  // ── the render model: reference, spelling fold, witness filter, grouping ─────────────────
  const viewModel: VMVerse[] = useMemo(() => {
    const { refWid, hidden, hideSpelling, group } = ctrl
    return shownVerses.map(v => {
      const refIdx = v.rows.findIndex(r => r.wid === refWid)
      const refRow = refIdx >= 0 ? v.rows[refIdx] : v.rows[0]
      const refCells = refRow.cells

      const overlay = (t: string, differs: boolean, refText: string, isRP: boolean): string => {
        if (!t) return ''
        if (diplomatic) return t
        if (isRP) return t
        const acc = parseMap[v.verse]?.[gkey(t)]?.surface
        if (acc) return acc
        if (!differs && refText) return refText.replace(/^[¶*]+/, '')
        return finalSigma(t)
      }
      const buildCells = (r: Row): VMCell[] => r.cells.map((c, ci) => {
        const refText = refCells[ci] ?? ''
        if (r === refRow) return { shown: overlay(c, false, c, r.wid === 'RP'), underline: false, omit: false }
        if (!c && !refText) return { shown: '', underline: false, omit: false }
        if (!c && refText) return { shown: '', underline: true, omit: true }          // omission
        if (c && !refText) return { shown: overlay(c, true, '', false), underline: true, omit: false }   // addition
        const differs = gkey(c) !== gkey(refText)
        const substantive = differs && ofold(c) !== ofold(refText)
        return { shown: overlay(c, differs, refText, false), underline: differs && (!hideSpelling || substantive), omit: false }
      })

      const others = v.rows.filter(r => r !== refRow && !hidden.includes(r.wid))
      let rows: VMRow[] = [
        { sigla: [{ wid: refRow.wid, sigil: refRow.sigil, family: refRow.family }], family: refRow.family, isRef: true, cells: buildCells(refRow) },
        ...others.map(r => ({ sigla: [{ wid: r.wid, sigil: r.sigil, family: r.family }], family: r.family, isRef: false, cells: buildCells(r) })),
      ]

      if (group) {   // collapse identical non-reference readings onto one line
        const merged = new Map<string, VMRow>()
        for (const row of rows.slice(1)) {
          const sig = row.cells.map(c => (c.omit ? '∅' : gkey(c.shown))).join('|')
          const ex = merged.get(sig)
          if (ex) { ex.sigla.push(...row.sigla); if (ex.family !== row.family) ex.family = 'other' }
          else merged.set(sig, { ...row, sigla: [...row.sigla] })
        }
        rows = [rows[0], ...Array.from(merged.values())]
      }

      const hasVariant = others.some(r => r.cells.some((c, ci) => {
        const refText = refCells[ci] ?? ''
        if (!c && !refText) return false
        if (!c || !refText) return true
        return ofold(c) !== ofold(refText)
      }))

      return { vid: v.vid, verse: v.verse, rows, lac: v.lac, hasVariant }
    })
  }, [shownVerses, ctrl, parseMap, diplomatic])

  const displayed = ctrl.onlyVariants ? viewModel.filter(v => v.hasVariant) : viewModel
  const hiddenVerses = viewModel.length - displayed.length

  function lexInfo(tok: WordToken, verse: number): LexicalInfoPanel {
    return {
      surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '', partOfSpeech: '',
      parsing: tok.parsing, strongs: tok.strongs, reference: `${parsed?.name ?? ''} ${parsed?.chapter}:${verse}`,
    }
  }
  function selectWord(text: string, verse: number, key: string) {
    const tok = parseMap[verse]?.[gkey(text)]
    if (!tok) return
    setSelectedInfo(lexInfo(tok, verse)); setSelectedKey(key)
  }
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

  // Landmark-variant significance notes: a badge on any verse that has one, expanding a panel.
  const noteFor = (verse: number) => (parsed ? VARIANT_NOTES[`${parsed.osis}.${parsed.chapter}.${verse}`] : undefined)
  function NoteBadge({ vid, verse }: { vid: string; verse: number }) {
    if (!noteFor(verse)) return null
    return (
      <button type="button" title="Why this variant matters" onClick={() => setOpenNote(openNote === vid ? null : vid)}
        className={`print:hidden ${openNote === vid ? 'text-amber-600' : 'text-amber-500 hover:text-amber-600'}`}>
        <Info size={13} />
      </button>
    )
  }
  function NotePanel({ vid, verse, force }: { vid: string; verse: number; force?: boolean }) {
    const n = noteFor(verse)
    if (!n || (openNote !== vid && !force)) return null
    return (
      <div className="mt-1 mb-2 rounded-lg border border-gray-200 bg-popover px-3 py-2 text-xs text-gray-700 max-w-2xl">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-amber-700 font-greek">{n.title}</span>
          {!force && <button onClick={() => setOpenNote(null)} className="text-gray-400 hover:text-gray-600 print:hidden"><X size={13} /></button>}
        </div>
        <p className="mt-0.5 leading-relaxed">{n.note}</p>
      </div>
    )
  }

  const fs = FONT_SIZE_MAP[fontSize]
  const witnesses = data?.witnesses ?? []
  const refSigil = witnesses.find(w => w.wid === ctrl.refWid)?.sigil ?? '𝔐'
  const visibleCount = witnesses.filter(w => w.wid === ctrl.refWid || !ctrl.hidden.includes(w.wid)).length
  const familiesPresent = useMemo(() => Array.from(new Set(witnesses.map(w => w.family))), [witnesses])

  function toggleFamily(fam: WitnessFamily) {
    const wids = witnesses.filter(w => w.family === fam && w.wid !== ctrl.refWid).map(w => w.wid)
    const anyVisible = wids.some(w => !ctrl.hidden.includes(w))
    setControls({ hidden: anyVisible ? Array.from(new Set([...ctrl.hidden, ...wids])) : ctrl.hidden.filter(w => !wids.includes(w)) })
  }
  function applyPreset(level: 'beginner' | 'advanced') {
    if (level === 'beginner') setControls({ hideSpelling: true, onlyVariants: true, group: true })
    else setControls({ hideSpelling: false, onlyVariants: false, group: false })
  }

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

  const ctrlBtn = 'inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50'

  return (
    <div className="h-full flex flex-col min-h-0 print:h-auto print:block">
      <div className="flex-1 overflow-y-auto px-1 pb-4 print:overflow-visible" onClick={() => info && setInfo(null)}>
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
            {/* Control bar */}
            <div ref={barRef} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 text-xs relative z-20 print:hidden">
              {/* Reference selector */}
              <div className="relative">
                <button type="button" className={ctrlBtn} onClick={() => setOpenMenu(openMenu === 'ref' ? null : 'ref')}>
                  <span className="text-gray-400">Compare to</span>
                  <span className="font-greek font-semibold text-gray-700">{refSigil}</span>
                  <ChevronDown size={12} className="text-gray-400" />
                </button>
                {openMenu === 'ref' && (
                  <div className="absolute left-0 top-full mt-1 w-44 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-popover shadow-lg py-1 z-30">
                    {witnesses.map(w => (
                      <button key={w.wid} type="button" onClick={() => { setControls({ refWid: w.wid }); setOpenMenu(null) }}
                        className={`flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-brand-50 ${w.wid === ctrl.refWid ? 'bg-brand-50' : ''}`}>
                        <span className="inline-block w-[7px] h-[7px] rounded-full shrink-0" style={{ background: FAMILY_COLOR[w.family] }} />
                        <span className="font-greek">{w.sigil}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Witness picker */}
              <div className="relative">
                <button type="button" className={ctrlBtn} onClick={() => setOpenMenu(openMenu === 'wit' ? null : 'wit')}>
                  <span className="text-gray-400">Witnesses</span>
                  <span className="font-medium text-gray-700">{visibleCount}/{witnesses.length}</span>
                  <ChevronDown size={12} className="text-gray-400" />
                </button>
                {openMenu === 'wit' && (
                  <div className="absolute left-0 top-full mt-1 w-56 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-popover shadow-lg z-30">
                    <div className="flex flex-wrap gap-1 px-2 py-1.5 border-b border-gray-100 sticky top-0 bg-popover">
                      <button type="button" className="rounded px-1.5 py-0.5 text-[11px] text-gray-600 hover:bg-gray-100" onClick={() => setControls({ hidden: [] })}>All</button>
                      <button type="button" className="rounded px-1.5 py-0.5 text-[11px] text-gray-600 hover:bg-gray-100"
                        onClick={() => setControls({ hidden: witnesses.filter(w => w.wid !== ctrl.refWid).map(w => w.wid) })}>None</button>
                      {familiesPresent.map(f => (
                        <button key={f} type="button" className="rounded px-1.5 py-0.5 text-[11px] hover:bg-gray-100 inline-flex items-center gap-1"
                          style={{ color: FAMILY_COLOR[f] }} onClick={() => toggleFamily(f)}>
                          <span className="inline-block w-[6px] h-[6px] rounded-full" style={{ background: FAMILY_COLOR[f] }} />{FAMILY_LABEL[f]}
                        </button>
                      ))}
                    </div>
                    {witnesses.map(w => {
                      const on = w.wid === ctrl.refWid || !ctrl.hidden.includes(w.wid)
                      return (
                        <label key={w.wid} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={on} disabled={w.wid === ctrl.refWid} className="accent-brand-600"
                            onChange={() => setControls({ hidden: on ? [...ctrl.hidden, w.wid] : ctrl.hidden.filter(x => x !== w.wid) })} />
                          <span className="inline-block w-[7px] h-[7px] rounded-full shrink-0" style={{ background: FAMILY_COLOR[w.family] }} />
                          <span className="font-greek">{w.sigil}</span>
                          {w.wid === ctrl.refWid && <span className="ml-auto text-[10px] text-brand-600 uppercase tracking-wide">ref</span>}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <label className="inline-flex items-center gap-1 cursor-pointer" title="Hide spelling-only (itacism) differences">
                <input type="checkbox" checked={ctrl.hideSpelling} className="accent-brand-600" onChange={e => setControls({ hideSpelling: e.target.checked })} />
                <span className="text-gray-600">Hide spelling</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer" title="Show only verses with a substantive variant">
                <input type="checkbox" checked={ctrl.onlyVariants} className="accent-brand-600" onChange={e => setControls({ onlyVariants: e.target.checked })} />
                <span className="text-gray-600">Only variants</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer" title="Group witnesses that share a reading onto one line">
                <input type="checkbox" checked={ctrl.group} className="accent-brand-600" onChange={e => setControls({ group: e.target.checked })} />
                <span className="text-gray-600">Group</span>
              </label>

              <span className="h-4 w-px bg-gray-200" />
              <button type="button" className="rounded-lg border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50" onClick={() => applyPreset('beginner')}>Beginner</button>
              <button type="button" className="rounded-lg border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50" onClick={() => applyPreset('advanced')}>Advanced</button>
              <button type="button" title="Print / save as PDF" className="ml-auto inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50"
                onClick={() => window.print()}><Printer size={13} /> Print</button>
            </div>

            {displayed.length === 0 && (
              <p className="text-gray-400 text-sm text-center mt-6">No substantive variants among the visible witnesses in this passage.</p>
            )}

            {isMobile && displayed.map(vm => {
              const units = variationUnits(vm.rows, ctrl.hideSpelling)
              return (
                <div key={vm.vid} className="mb-3 rounded-lg border border-gray-100 p-2.5">
                  <div className="flex items-center gap-1 text-[0.7rem] font-mono text-gray-400 mb-1.5">
                    <span className="font-semibold">{parsed!.chapter}:{vm.verse}</span>
                    <span className="font-sans"><VerseNoteButton book={parsed!.osis} chapter={parsed!.chapter} verse={vm.verse}
                      noted={notedKeys.has(`${parsed!.osis}.${parsed!.chapter}.${vm.verse}`)} onChanged={refreshNotes} /></span>
                    <NoteBadge vid={vm.vid} verse={vm.verse} />
                  </div>
                  <NotePanel vid={vm.vid} verse={vm.verse} />
                  {units.length === 0 ? (
                    <p className="text-xs text-gray-400">No variants among the visible witnesses.</p>
                  ) : units.map((u, ui) => (
                    <div key={ui} className="mb-2 last:mb-0 border-l-2 border-gray-100 pl-2">
                      {u.readings.map((rd, ri) => (
                        <div key={ri} className="flex gap-2 items-baseline py-0.5">
                          <span className="font-greek shrink-0 min-w-[4.5rem]" style={{ fontSize: fs }}>
                            {rd.nothing ? <span className="text-gray-300">⌀ omit</span>
                              : <GreekWord text={rd.text} verse={vm.verse} wkey={`${vm.vid}.m${ui}.${ri}`} bold={ri === 0} />}
                          </span>
                          <span className="flex flex-wrap gap-x-1.5 gap-y-0.5 items-center pt-0.5">
                            {rd.sigla.map(s => (
                              <button key={s.wid + s.sigil} type="button" title="Manuscript information"
                                onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setInfo({ wid: s.wid, sigil: s.sigil, family: s.family, x: r.left, y: r.bottom }) }}
                                className="font-mono text-[0.72rem] font-semibold" style={{ color: FAMILY_COLOR[s.family] }}>{s.sigil}</button>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {vm.lac.length > 0 && (
                    <div className="text-[0.68rem] text-gray-400 mt-1"><span className="font-mono font-semibold">lac.</span> {vm.lac.join(' ')}</div>
                  )}
                </div>
              )
            })}

            {!isMobile && displayed.map(vm => (
              <div key={vm.vid} className="mb-4">
                <div className="pl-6"><NotePanel vid={vm.vid} verse={vm.verse} /></div>
                <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 print:overflow-visible">
                  <table className="border-collapse font-greek" style={{ fontSize: fs, whiteSpace: 'nowrap' }} onMouseLeave={() => setHoverCol(null)}>
                    <tbody>
                      {vm.rows.map((r, ri) => (
                        <tr key={ri} className={r.isRef ? 'font-semibold' : ''}>
                          <td className="pr-2 align-baseline text-[0.7rem] font-mono text-gray-300 select-none whitespace-nowrap">
                            {ri === 0 && (
                              <span className="inline-flex items-center gap-1">
                                <span>{parsed!.chapter}:{vm.verse}</span>
                                <span className="font-sans"><VerseNoteButton book={parsed!.osis} chapter={parsed!.chapter} verse={vm.verse}
                                  noted={notedKeys.has(`${parsed!.osis}.${parsed!.chapter}.${vm.verse}`)} onChanged={refreshNotes} /></span>
                                <NoteBadge vid={vm.vid} verse={vm.verse} />
                              </span>
                            )}
                          </td>
                          {r.cells.map((c, ci) => (
                            <td key={ci} onMouseEnter={() => setHoverCol(ci)}
                              className={`pr-[7px] align-baseline ${c.underline ? 'underline decoration-1 underline-offset-2' : ''} ${c.omit ? 'text-gray-300' : ''} ${hoverCol === ci ? 'bg-brand-50' : ''}`}>
                              {c.omit ? '—' : <GreekWord text={c.shown} verse={vm.verse} wkey={`${vm.vid}.${ri}.${ci}`} bold={r.isRef} />}
                            </td>
                          ))}
                          <td className="sticky right-0 pl-3 align-baseline bg-white text-left border-l border-gray-100 print:static">
                            <span className="inline-flex flex-wrap items-center gap-x-1.5">
                              {r.sigla.map(s => (
                                <button key={s.wid + s.sigil} type="button"
                                  onClick={e => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setInfo({ wid: s.wid, sigil: s.sigil, family: s.family, x: rect.left, y: rect.bottom }) }}
                                  className="inline-flex items-center gap-1 font-mono text-[0.8rem] font-semibold text-gray-600 hover:text-brand-700"
                                  title="Manuscript information">
                                  <span className="inline-block w-[7px] h-[7px] rounded-full" style={{ background: FAMILY_COLOR[s.family] }} />
                                  {s.sigil}
                                </button>
                              ))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {vm.lac.length > 0 && (
                  <div className="text-[0.7rem] text-gray-400 mt-0.5 pl-6">
                    <span className="font-mono font-semibold">lac.</span> {vm.lac.join(' ')} <span className="text-gray-300">(absent here)</span>
                  </div>
                )}
              </div>
            ))}

            {ctrl.onlyVariants && hiddenVerses > 0 && (
              <p className="text-[0.7rem] text-gray-400 mt-1 pl-1">{hiddenVerses} verse{hiddenVerses > 1 ? 's' : ''} with no variants hidden ·
                <button type="button" className="ml-1 underline hover:text-brand-600" onClick={() => setControls({ onlyVariants: false })}>show all</button>
              </p>
            )}

            {/* Legend */}
            <div className="text-[0.7rem] text-gray-400 mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 items-center pl-1">
              <span>Reference: <b className="font-greek">{refSigil}</b></span>
              <span>Underline = differs · — = omission</span>
              {familiesPresent.map(f => (
                <span key={f} className="inline-flex items-center gap-1">
                  <span className="inline-block w-[7px] h-[7px] rounded-full" style={{ background: FAMILY_COLOR[f] }} />{FAMILY_LABEL[f]}
                </span>
              ))}
              <span className="text-gray-300">· Click a word to parse it · click a siglum for details</span>
            </div>
          </>
        )}
      </div>

      {/* Shared parsing pane — filled by clicking/hovering any Greek word above. */}
      {status === 'ok' && (
        <ResizableParsingPane storageKey="variants" info={selectedInfo ?? defaultParsingInfo} bgClass="bg-gray-50" className="print:hidden" />
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
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-popover border border-gray-200 rounded-full px-3 py-1.5 shadow z-40 print:hidden">
          <span className="text-gray-400 font-greek" style={{ fontSize: '0.8rem' }}>Α</span>
          <input type="range" min={0} max={FONT_SIZES.length - 1} value={FONT_SIZES.indexOf(fontSize)}
            onChange={e => setFontSize(FONT_SIZES[e.target.valueAsNumber])} className="accent-brand-600 w-24" />
          <span className="text-gray-400 font-greek" style={{ fontSize: '1.3rem' }}>Α</span>
        </div>
      )}
    </div>
  )
}
