'use client'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { PhraseFontSize } from './PhraseExplorer'

type BgFontSize = PhraseFontSize
const FONT_SIZE_MAP: Record<BgFontSize, string> = { sm: '1.05rem', md: '1.25rem', lg: '1.45rem', xl: '1.7rem' }

type RefBook = { osisId: string; name: string; abbrev: string; totalChapters: number; corpus?: string }

/** Parse "John 1:1-5" against a book list (mirrors the Synopsis/Phrasing tools' parser). */
function parseRef(ref: string, books: RefBook[]): { book: RefBook; chapter: number; verseStart: number; verseEnd: number } | null {
  const q = ref.trim().replace(/[–—]/g, '-')
  const m = q.match(/^((?:\d\s*)?\w[\w\s]*?)\s+(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!m) return null
  const bookPart = m[1].trim().toLowerCase().replace(/\s+/g, '')
  const chapter = parseInt(m[2]); const vs = m[3] ? parseInt(m[3]) : 1; const ve = m[4] ? parseInt(m[4]) : (m[3] ? vs : 200)
  const book = books.find(b => [b.osisId, b.name, b.abbrev].some(s => {
    const c = s.toLowerCase().replace(/\s+/g, ''); return c === bookPart || c.startsWith(bookPart) || bookPart.startsWith(c.slice(0, Math.max(3, bookPart.length)))
  }))
  if (!book) return null
  if (book.totalChapters === 1 && !m[3]) return { book, chapter: 1, verseStart: chapter, verseEnd: chapter }
  return { book, chapter, verseStart: vs, verseEnd: ve }
}

// A clickable Greek word carries enough to fill the shared parsing pane (Strong's,
// Thayer's, Mounce, Abbott-Smith, LSJ lookups happen inside ParsingPanel itself).
type WordToken = { surface: string; parsing: string; lemma: string; gloss?: string; strongs?: string }
const GNT_MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
function formatGntMorph(m: Record<string, string | null> | undefined): string {
  if (!m) return ''
  return GNT_MORPH_ORDER.map(k => m[k]).filter(Boolean).join(', ')
}
function toLexicalInfo(tok: WordToken, bookName: string, verseRef: string): LexicalInfoPanel {
  return {
    surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '', partOfSpeech: '',
    parsing: tok.parsing, strongs: tok.strongs, reference: `${bookName} ${verseRef}`,
  }
}

// Versions either column can be shown in: a Greek edition or a translation. Only the
// 66 canonical Bible books have translation data (see /api/translation) — this list
// applies to the Greek NT passage (left) and to OT/LXX/NT cross-references (right);
// other cross-reference types (DSS, Second Temple lit, etc.) have a single fixed source.
const VERSIONS = [
  { code: 'na1904', label: 'Greek — Nestle 1904' },
  { code: 'gnt', label: 'Greek — Tischendorf' },
  { code: 'bsb', label: 'English (BSB)' },
  { code: 'en', label: 'English (WEB)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Mandarin' },
]

// ── Cross-reference dataset (public/data/backgrounds-crossrefs.json) ──────────────────
interface CrossRefCitation {
  text: string
  type: 'OT' | 'LXX' | 'DSS' | 'Second Temple' | 'Christian Apocrypha' | 'Rabbinic' | 'Greco-Roman' | 'NT' | 'Other'
  cf?: boolean
  ref?: { book: string; chapter: number; verse: number }
}
interface CrossRefEntry {
  book: string; chapter: number; endChapter: number; verseStart: number; verseEnd: number
  label: string; citations: CrossRefCitation[]
}
const TYPE_LABELS: Record<CrossRefCitation['type'], string> = {
  OT: 'Old Testament', LXX: 'LXX (Septuagint)', DSS: 'Dead Sea Scrolls',
  'Second Temple': 'Second Temple Literature', 'Christian Apocrypha': 'Christian Apocrypha',
  Rabbinic: 'Rabbinic Literature', 'Greco-Roman': 'Greco-Roman Literature', NT: 'New Testament', Other: 'Other',
}
const TYPE_ORDER: CrossRefCitation['type'][] = ['OT', 'LXX', 'DSS', 'Second Temple', 'Christian Apocrypha', 'Rabbinic', 'Greco-Roman', 'NT', 'Other']
const TYPE_COLORS: Record<CrossRefCitation['type'], string> = {
  OT: 'bg-blue-50 border-blue-200 text-blue-800', LXX: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  DSS: 'bg-amber-50 border-amber-200 text-amber-800', 'Second Temple': 'bg-emerald-50 border-emerald-200 text-emerald-800',
  'Christian Apocrypha': 'bg-teal-50 border-teal-200 text-teal-800', Rabbinic: 'bg-purple-50 border-purple-200 text-purple-800',
  'Greco-Roman': 'bg-rose-50 border-rose-200 text-rose-800', NT: 'bg-gray-100 border-gray-300 text-gray-700',
  Other: 'bg-gray-50 border-gray-200 text-gray-600',
}
// A (chapter, verse) pair as one sortable number, for range-overlap checks that may
// span a chapter boundary (a handful of entries do, e.g. "Rom 3:21–4:25").
const posKey = (ch: number, vs: number) => ch * 1000 + vs

/**
 * Backgrounds: the passage's Greek text (Nestle 1904 / Tischendorf) with a scholarly
 * cross-reference apparatus (OT, LXX, Dead Sea Scrolls, Second Temple literature,
 * rabbinic literature, Greco-Roman literature — adapted from Craig A. Evans, Ancient
 * Texts for New Testament Studies, Appendix Two) and a reading pane for whichever
 * cross-referenced passage the student selects. OT/LXX cross-references open in full
 * (the app already has that corpus); other sources show their citation only for now.
 */
export function BackgroundsView({ controlledPassage, isAuthenticated = false, fontSize: controlledFontSize, onFontSize, onAttribution }: {
  controlledPassage?: string
  isAuthenticated?: boolean
  fontSize?: BgFontSize
  onFontSize?: (v: BgFontSize) => void
  onAttribution?: (a: string) => void
}) {
  const [gntBooks, setGntBooks] = useState<RefBook[]>([])
  const [lxxBooks, setLxxBooks] = useState<RefBook[]>([])
  const [version, setVersion] = useState('na1904')
  const isFontSizeControlled = onFontSize !== undefined
  const [internalFontSize, setInternalFontSize] = useState<BgFontSize>('lg')
  const fontSize = isFontSizeControlled ? (controlledFontSize ?? 'lg') : internalFontSize
  const setFontSize = onFontSize ?? setInternalFontSize

  const anchor = (controlledPassage ?? '').trim()

  // ── Left column: passage text (Greek) ──
  const cache = useRef<Record<string, Record<string, string>>>({})          // version -> verseId -> text
  const wordCache = useRef<Record<string, Record<string, WordToken[]>>>({}) // version -> verseId -> tokens
  const loaded = useRef<Set<string>>(new Set())
  const [, setVer] = useState(0)
  const bump = () => setVer(v => v + 1)

  // ── Shared parsing pane (driven by either column) ──
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // ── Per-verse personal notes (signed-in users), left + right columns share one set ──
  const [notedKeys, setNotedKeys] = useState<Set<number>>(new Set())
  const refreshNotes = useCallback(async (book: string, chapter: number) => {
    if (!isAuthenticated || !book) { setNotedKeys(new Set()); return }
    try {
      const r = await fetch(`/api/notes?book=${book}&chapter=${chapter}&verseStart=1&verseEnd=200`)
      const d = await r.json()
      setNotedKeys(new Set((d.notes ?? []).map((n: { verse: number }) => n.verse)))
    } catch { /* ignore */ }
  }, [isAuthenticated])

  // ── Cross-reference dataset ──
  const [crossRefData, setCrossRefData] = useState<{ attribution: string; entries: CrossRefEntry[] } | null>(null)
  const [typeFilter, setTypeFilter] = useState<Set<CrossRefCitation['type']>>(new Set(TYPE_ORDER))

  // ── Right column: the selected cross-reference's text ──
  // Only OT/LXX/NT citations carry a `ref` (book+chapter+verse) that the app's own Bible
  // text/translation APIs can resolve — those are the ones this version selector applies
  // to. Other cross-reference types (DSS, Second Temple lit, etc.) have a single fixed
  // source and show a citation only, unaffected by this dropdown.
  const [rightRef, setRightRef] = useState<{ label: string; citation: CrossRefCitation } | null>(null)
  const [rightVersion, setRightVersion] = useState('na1904')
  const rightCache = useRef<Record<string, Record<string, { verse: number; text: string }[]>>>({}) // version -> "book.chapter" -> verses
  const [rightVerses, setRightVerses] = useState<{ verse: number; text: string; tokens?: WordToken[] }[] | null>(null)
  const [rightLoading, setRightLoading] = useState(false)

  useEffect(() => { onAttribution?.(crossRefData?.attribution ?? '') }, [crossRefData, onAttribution])

  useEffect(() => {
    fetch('/data/books.json').then(r => r.json()).then((d: { gnt?: RefBook[]; lxx?: RefBook[] }) => {
      setGntBooks(d.gnt ?? [])
      setLxxBooks(d.lxx ?? [])
    }).catch(() => {})
    fetch('/data/backgrounds-crossrefs.json').then(r => r.json()).then(setCrossRefData).catch(() => {})
  }, [])

  const parsed = parseRef(anchor, gntBooks)

  // Load the anchor passage's text (left column) whenever it or the version changes.
  useEffect(() => {
    if (!parsed) return
    ensure(version, parsed.book.osisId, parsed.chapter)
    refreshNotes(parsed.book.osisId, parsed.chapter)
    setSelectedInfo(null); setSelectedKey(null)
    setRightRef(null); setRightVerses(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, version, gntBooks.length])

  function ensure(v: string, osis: string, chapter: number) {
    const ck = v === 'na1904' ? `na1904.${osis}` : v === 'bsb' ? 'bsb' : `${v}.${osis}.${chapter}`
    if (loaded.current.has(ck)) { bump(); return }
    loaded.current.add(ck)
    const done = (map: Record<string, string>, patch: Record<string, string>) => { Object.assign(map, patch); bump() }
    if (v === 'na1904') {
      type Node = { t: string; id?: string; w?: string; parsing?: string; lemma?: string; gloss?: string; strongs?: string; c?: Node[] }
      fetch(`/data/phrase-tree/${osis}.json`).then(r => r.json()).then((d: { sentences?: { tree: Node }[] }) => {
        const byVerse: Record<string, { i: number; tok: WordToken }[]> = {}
        const walk = (n: Node) => {
          if (n.t === 'w' && n.id) {
            const [bk, ch, vs, wd] = n.id.split('.')
            ;(byVerse[`${bk}.${ch}.${vs}`] ??= []).push({
              i: parseInt(wd || '0', 10),
              tok: { surface: n.w ?? '', parsing: n.parsing ?? '', lemma: n.lemma ?? '', gloss: n.gloss, strongs: n.strongs },
            })
          } else (n.c ?? []).forEach(walk)
        }
        for (const s of d.sentences ?? []) walk(s.tree)
        const patch: Record<string, string> = {}
        const wpatch: Record<string, WordToken[]> = {}
        for (const [vKey, ws] of Object.entries(byVerse)) {
          ws.sort((a, b) => a.i - b.i)
          patch[vKey] = ws.map(x => x.tok.surface).join(' ')
          wpatch[vKey] = ws.map(x => x.tok)
        }
        Object.assign((wordCache.current.na1904 ??= {}), wpatch)
        done((cache.current.na1904 ??= {}), patch)
      }).catch(() => {})
    } else if (v === 'gnt') {
      type GntWord = { surface: string; lemma?: string; strongs?: string; morph?: Record<string, string | null> }
      fetch(`/data/gnt/${osis}_${chapter}.json`).then(r => r.json()).then((d: { verses?: { verse: number; text: string; words?: GntWord[] }[] }) => {
        const map = (cache.current.gnt ??= {})
        const wmap = (wordCache.current.gnt ??= {})
        for (const vv of d.verses ?? []) {
          const vid = `${osis}.${chapter}.${vv.verse}`
          map[vid] = vv.text
          if (vv.words) wmap[vid] = vv.words.map(w => ({ surface: w.surface, parsing: formatGntMorph(w.morph), lemma: w.lemma ?? '', strongs: w.strongs }))
        }
        bump()
      }).catch(() => {})
    } else if (v === 'bsb') {
      // Berean Standard Bible — pre-aligned static file (covers the whole Bible at once).
      fetch('/data/bsb-alignment.json?v=3').then(r => r.json()).then((d: Record<string, { text: string }>) => {
        const map = (cache.current.bsb ??= {})
        done(map, Object.fromEntries(Object.entries(d).map(([vid, val]) => [vid, val.text])))
      }).catch(() => {})
    } else {
      // WEB (en) and the other translations, one chapter at a time.
      fetch(`/api/translation?book=${osis}&chapter=${chapter}&lang=${v}`).then(r => r.json()).then((d: { verses?: Record<string, string> }) => {
        done((cache.current[v] ??= {}), d.verses ?? {})
      }).catch(() => {})
    }
  }

  const leftVerses: { verse: number; text: string; tokens?: WordToken[] }[] = (() => {
    if (!parsed) return []
    const map = cache.current[version] ?? {}
    const wmap = wordCache.current[version] ?? {}
    const out: { verse: number; text: string; tokens?: WordToken[] }[] = []
    for (let v = parsed.verseStart; v <= parsed.verseEnd; v++) {
      const vid = `${parsed.book.osisId}.${parsed.chapter}.${v}`
      const t = map[vid]
      if (t) out.push({ verse: v, text: t, tokens: wmap[vid] })
    }
    return out
  })()

  // ── Cross-references applicable to the loaded passage ──
  const applicableRefs: CrossRefEntry[] = (() => {
    if (!parsed || !crossRefData) return []
    const startKey = posKey(parsed.chapter, parsed.verseStart)
    const endKey = posKey(parsed.chapter, parsed.verseEnd)
    return crossRefData.entries.filter(e => {
      if (e.book !== parsed.book.osisId) return false
      const eStart = posKey(e.chapter, e.verseStart)
      const eEnd = posKey(e.endChapter, e.verseEnd)
      return eStart <= endKey && eEnd >= startKey
    })
  })()

  // ── Right column: load a cross-reference's actual text, in whichever version the
  // right-column dropdown is set to. Greek editions (na1904/gnt) go through the Reader
  // API (word-level tokens, for the parsing pane); translations go through the same
  // Bible-translation endpoints the left column and Synopsis use. Re-runs when either
  // the open reference or the right-column version changes.
  const loadRightRef = useCallback(async (citation: CrossRefCitation, rv: string) => {
    if (!citation.ref) { setRightVerses(null); return }
    const { book: osis, chapter } = citation.ref
    const cacheForVersion = (rightCache.current[rv] ??= {})
    const ck = `${osis}.${chapter}`
    setRightLoading(true)
    try {
      if (!cacheForVersion[ck]) {
        if (rv === 'na1904' || rv === 'gnt') {
          const corpus = rv === 'na1904' ? 'NA1904' : 'GNT'
          const r = await fetch(`/api/reader?book=${osis}&chapter=${chapter}&corpus=${corpus}`)
          const d = await r.json()
          const wmap = (wordCache.current[`right.${rv}`] ??= {})
          cacheForVersion[ck] = (d.verses ?? []).map((v: { verse: number; text?: string; words?: { surface: string; lexeme?: { lexeme: string; gloss?: string; strongs?: string }; parses?: { partOfSpeech: string; tense?: string; voice?: string; mood?: string; person?: string; number?: string; casus?: string; gender?: string }[] }[] }) => {
            if (v.words) {
              wmap[`${osis}.${chapter}.${v.verse}`] = v.words.map(w => ({
                surface: w.surface, lemma: w.lexeme?.lexeme ?? '', gloss: w.lexeme?.gloss, strongs: w.lexeme?.strongs,
                parsing: w.parses?.[0] ? formatGntMorph(w.parses[0] as unknown as Record<string, string | null>) : '',
              }))
            }
            return { verse: v.verse, text: v.text ?? (v.words ?? []).map(w => w.surface).join(' ') }
          })
        } else if (rv === 'bsb') {
          const r = await fetch('/data/bsb-alignment.json?v=3')
          const d: Record<string, { text: string }> = await r.json()
          cacheForVersion[ck] = Object.entries(d)
            .filter(([vid]) => vid.startsWith(`${osis}.${chapter}.`))
            .map(([vid, val]) => ({ verse: parseInt(vid.split('.')[2], 10), text: val.text }))
        } else {
          const r = await fetch(`/api/translation?book=${osis}&chapter=${chapter}&lang=${rv}`)
          const d: { verses?: Record<string, string> } = await r.json()
          cacheForVersion[ck] = Object.entries(d.verses ?? {})
            .map(([vid, text]) => ({ verse: parseInt(vid.split('.')[2], 10), text }))
        }
      }
      const wmap = wordCache.current[`right.${rv}`] ?? {}
      setRightVerses(cacheForVersion[ck].map(v => ({ ...v, tokens: wmap[`${osis}.${chapter}.${v.verse}`] })))
    } catch {
      setRightVerses(null)
    } finally {
      setRightLoading(false)
    }
  }, [])

  function openRightRef(label: string, citation: CrossRefCitation) {
    setRightRef({ label, citation })
    void loadRightRef(citation, rightVersion)
  }
  // Re-fetch the currently open reference when the right-column version dropdown changes.
  useEffect(() => {
    if (rightRef?.citation.ref) void loadRightRef(rightRef.citation, rightVersion)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightVersion])

  const isGreek = version === 'gnt' || version === 'na1904'
  const isRightGreek = rightVersion === 'gnt' || rightVersion === 'na1904'
  const rightBookName = rightRef?.citation.ref
    ? (lxxBooks.find(b => b.osisId === rightRef.citation.ref!.book)?.name ?? gntBooks.find(b => b.osisId === rightRef.citation.ref!.book)?.name ?? rightRef.citation.ref.book)
    : ''

  function toggleType(t: CrossRefCitation['type']) {
    setTypeFilter(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t); else next.add(t)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full gap-3" style={{ '--bg-fs': FONT_SIZE_MAP[fontSize] } as CSSProperties}>
      <div className="flex items-center flex-wrap gap-3">
        <label className="text-sm font-medium text-gray-700">Version</label>
        <select
          value={version}
          onChange={e => setVersion(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {VERSIONS.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
        </select>
        {isGreek && (
          <span className="text-xs text-gray-500">
            <span className="hidden sm:inline">Tip: </span>click any Greek word to see its parsing.
          </span>
        )}
        {/* Type filter chips for the middle column */}
        <div className="flex items-center flex-wrap gap-1.5 ml-auto">
          {TYPE_ORDER.map(t => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-opacity ${TYPE_COLORS[t]} ${typeFilter.has(t) ? '' : 'opacity-30'}`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {!anchor || !parsed ? (
        <p className="text-sm text-gray-400 italic">Enter a passage above to load its background apparatus.</p>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* ── Left: Greek text ── */}
          <div className="flex flex-col min-h-0 rounded-xl border border-gray-200 overflow-hidden">
            <p className="shrink-0 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 uppercase tracking-wide">
              {parsed.book.name} {parsed.chapter}:{parsed.verseStart}{parsed.verseEnd !== parsed.verseStart ? `–${parsed.verseEnd}` : ''}
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {leftVerses.length === 0 ? (
                <p className="text-xs text-gray-300 italic">Loading…</p>
              ) : (
                <div
                  className={`space-y-1 leading-relaxed text-gray-900 ${isGreek ? 'font-greek' : ''}`}
                  style={{ fontSize: isGreek ? 'var(--bg-fs, 1.45rem)' : 'calc(var(--bg-fs, 1.45rem) * 0.65)' }}
                >
                  {leftVerses.map(v => (
                    <p key={v.verse}>
                      {isAuthenticated && (
                        <span className="font-sans align-middle mr-0.5">
                          <VerseNoteButton book={parsed.book.osisId} chapter={parsed.chapter} verse={v.verse} noted={notedKeys.has(v.verse)} onChanged={() => refreshNotes(parsed.book.osisId, parsed.chapter)} />
                        </span>
                      )}
                      <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{v.verse}</sup>
                      {v.tokens && v.tokens.length > 0
                        ? v.tokens.map((tok, ti) => {
                            const key = `left.${parsed.book.osisId}.${parsed.chapter}.${v.verse}.${ti}`
                            const select = () => { setSelectedInfo(toLexicalInfo(tok, parsed.book.name, `${parsed.chapter}:${v.verse}`)); setSelectedKey(key) }
                            return (
                              <span
                                key={ti}
                                onMouseEnter={select}
                                onClick={select}
                                className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''}`}
                              >
                                {tok.surface}{ti < v.tokens!.length - 1 ? ' ' : ''}
                              </span>
                            )
                          })
                        : v.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Middle: cross-references ── */}
          <div className="flex flex-col min-h-0 rounded-xl border border-gray-200 overflow-hidden">
            <p className="shrink-0 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 uppercase tracking-wide">
              Cross-references
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
              {!crossRefData ? (
                <p className="text-xs text-gray-300 italic">Loading…</p>
              ) : applicableRefs.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No cataloged cross-references for this passage.</p>
              ) : (
                applicableRefs.map((entry, ei) => {
                  const cites = entry.citations.filter(c => typeFilter.has(c.type))
                  if (cites.length === 0) return null
                  return (
                    <div key={ei}>
                      <p className="text-[11px] font-semibold text-gray-500 mb-1">{entry.label}</p>
                      <div className="space-y-1">
                        {cites.map((c, ci) => (
                          <button
                            key={ci}
                            onClick={() => openRightRef(entry.label, c)}
                            disabled={!c.ref}
                            title={c.ref ? 'View text' : 'Full text not yet available for this source'}
                            className={`block w-full text-left rounded-lg border px-2 py-1 text-xs transition-colors ${TYPE_COLORS[c.type]} ${c.ref ? 'hover:brightness-95 cursor-pointer' : 'cursor-default opacity-80'} ${rightRef?.citation === c ? 'ring-2 ring-brand-400' : ''}`}
                          >
                            {c.cf && <span className="italic mr-1">cf.</span>}{c.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Right: the selected cross-reference's text ── */}
          <div className="flex flex-col min-h-0 rounded-xl border border-gray-200 overflow-hidden">
            <div className="shrink-0 px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                {rightRef ? rightRef.citation.text : 'Referenced text'}
              </p>
              {/* Only meaningful for OT/LXX/NT cross-references — the app's own Bible
                  text/translations. Harmless to leave visible otherwise; it just won't
                  affect a citation-only source. */}
              {rightRef?.citation.ref && (
                <select
                  value={rightVersion}
                  onChange={e => setRightVersion(e.target.value)}
                  className="shrink-0 rounded-lg border border-gray-300 px-1.5 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {VERSIONS.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
                </select>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {!rightRef ? (
                <p className="text-xs text-gray-400 italic">Click a cross-reference to view its text here.</p>
              ) : rightLoading ? (
                <p className="text-xs text-gray-300 italic">Loading…</p>
              ) : !rightRef.citation.ref ? (
                <div className="text-xs text-gray-500 space-y-2">
                  <p className="italic">Full text not yet available for this source ({TYPE_LABELS[rightRef.citation.type]}).</p>
                  <p className="text-gray-400">Citation: {rightRef.citation.text}</p>
                </div>
              ) : !rightVerses || rightVerses.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No text found for this reference.</p>
              ) : (
                <div
                  className={`space-y-1 leading-relaxed text-gray-900 ${isRightGreek ? 'font-greek' : ''}`}
                  style={{ fontSize: isRightGreek ? 'calc(var(--bg-fs, 1.45rem) * 0.85)' : 'calc(var(--bg-fs, 1.45rem) * 0.6)' }}
                >
                  {rightVerses.map(v => (
                    <p key={v.verse}>
                      {isAuthenticated && rightRef.citation.ref && (
                        <span className="font-sans align-middle mr-0.5">
                          <VerseNoteButton book={rightRef.citation.ref.book} chapter={rightRef.citation.ref.chapter} verse={v.verse} noted={false} />
                        </span>
                      )}
                      <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{v.verse}</sup>
                      {v.tokens && v.tokens.length > 0
                        ? v.tokens.map((tok, ti) => {
                            const key = `right.${rightRef.citation.ref!.book}.${rightRef.citation.ref!.chapter}.${v.verse}.${ti}`
                            const select = () => { setSelectedInfo(toLexicalInfo(tok, rightBookName, `${rightRef.citation.ref!.chapter}:${v.verse}`)); setSelectedKey(key) }
                            return (
                              <span
                                key={ti}
                                onMouseEnter={select}
                                onClick={select}
                                className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''}`}
                              >
                                {tok.surface}{ti < v.tokens!.length - 1 ? ' ' : ''}
                              </span>
                            )
                          })
                        : v.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Parsing pane — shared by both the left (passage) and right (cross-reference)
          columns; same component used on Phrasing and Synopsis. */}
      {isGreek && (
        <ParsingPanel info={selectedInfo} bgClass="bg-gray-50" />
      )}
    </div>
  )
}
