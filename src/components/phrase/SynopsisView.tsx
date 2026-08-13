'use client'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { X } from 'lucide-react'
import { compareRedaction, isFunctionWord, isGlueWord, morphFacts, type CompareResult, type CompareToken, type RedactionTag } from '@/lib/redaction-compare'
import { computeColumnIndicators, computeSequenceShift, type Indicator } from '@/lib/redaction-indicators'
import { RedactionKey } from './RedactionKey'
import { PERICOPE_ANNOTATIONS, SOURCE_MODELS, noteFor, type SourceModel } from '@/lib/redaction-annotations'
import { phraseTreeVerses, type PhraseTreeDoc } from '@/lib/phrase-tree-tokens'
import { MT_OSIS } from '@/lib/mt-books'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
import { PassageAutocomplete } from './PassageAutocomplete'
import { openWordSearch } from '@/lib/word-search-bus'
import { useHighlights } from '@/components/highlights/useHighlights'
import { useHighlightSelection } from '@/components/highlights/useHighlightSelection'
import { HighlightPopup } from '@/components/highlights/HighlightPopup'
import { verseAnchorProps, withTokenOffsets, highlightAt } from '@/components/highlights/render'
import { highlightMarkClass } from '@/lib/highlight-colors'
import { TransWords } from '@/components/highlights/TransWords'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { PhraseFontSize } from './PhraseExplorer'

// Text-size control — same scale as the Phrasing tab (shares its type/values so the
// shared exegesis tools menu can drive both with one slider implementation).
type SynFontSize = PhraseFontSize
const FONT_SIZE_MAP: Record<SynFontSize, string> = { sm: '1.05rem', md: '1.25rem', lg: '1.45rem', xl: '1.7rem' }

type RefBook = { osisId: string; name: string; abbrev: string; totalChapters: number }

// The redaction categories that carry a colour, in legend order. 'omitted' is the source
// column's strike-through rather than one of compareRedaction's target tags, so this is a
// superset of RedactionTag minus 'same' (verbatim words are simply left unmarked).
const MARK_TAGS = ['form', 'moved', 'subst', 'added', 'omitted'] as const
type MarkTag = typeof MARK_TAGS[number]
const MARK_LABELS: Record<MarkTag, string> = {
  form: 'form change', moved: 'moved', subst: 'substituted', added: 'added', omitted: 'omitted',
}

// Rationale bubble support: each coloured word can explain itself, because the aligner
// records which source word it was judged against (CompareResult.links).
const TAG_TITLES: Record<MarkTag, string> = {
  form: 'Form change · Theon: variation in syntax',
  moved: 'Moved · Theon: variation in syntax',
  subst: 'Substituted · Theon: substitution',
  added: 'Added · Theon: addition',
  omitted: 'Omitted · Theon: subtraction',
}
// Which computed signals corroborate which curated narrative device — used to append a
// "computed signals agree" line to an open curated note.
const DEVICE_SIGNALS: Record<string, Indicator['id'][]> = {
  Transferal: ['transferal'],
  Spotlighting: ['spotlight-names', 'spotlight-number'],
  Simplification: ['spotlight-names', 'condense'],
  Compression: ['condense'],
  'Expansion of narrative details': ['expand'],
  Displacement: ['sequence'],
  Paraphrase: ['hist-present'],
}
const ROLE_LABELS: Record<string, string> = {
  s: 'subject', o: 'object', io: 'indirect object', v: 'verb', adv: 'adverbial',
  p: 'predicate', vc: 'copular complement', aux: 'auxiliary', o2: 'second object', topic: 'topic',
}
/** "Genitive Plural → Nominative Plural" style summary of what changed between two
 *  parsing strings — just the categories that differ. */
function parsingDiff(a?: string, b?: string): string {
  if (!a || !b) return ''
  const A = a.split(',').map(s => s.trim()).filter(Boolean)
  const B = b.split(',').map(s => s.trim()).filter(Boolean)
  const sa = new Set(A), sb = new Set(B)
  const from = A.filter(x => !sb.has(x))
  const to = B.filter(x => !sa.has(x))
  if (!from.length && !to.length) return ''
  return `${from.join(' ') || '—'} → ${to.join(' ') || '—'}`
}

/** Parse "John 1:1-5" against the book list (mirror of the other tools' parser). */
function parseRef(ref: string, books: RefBook[]): { book: RefBook; chapter: number; verseStart: number; verseEnd: number } | null {
  const q = ref.trim().replace(/[–—]/g, '-')
  const m = q.match(/^((?:\d\s*)?\w[\w\s]*?)\s+(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?(?:\s*-\s*(\d+))?$/)
  if (!m) return null
  const bookPart = m[1].trim().toLowerCase().replace(/\s+/g, '')
  const chapter = parseInt(m[2]); const vs = m[3] ? parseInt(m[3]) : 1; const ve = m[4] ? parseInt(m[4]) : (m[3] ? vs : 200)
  const dashEnd = m[5] ? parseInt(m[5]) : undefined   // bare "N-M" verse range (single-chapter books)
  const book = books.find(b => [b.osisId, b.name, b.abbrev].some(s => {
    const c = s.toLowerCase().replace(/\s+/g, ''); return c === bookPart || c.startsWith(bookPart) || bookPart.startsWith(c.slice(0, Math.max(3, bookPart.length)))
  }))
  if (!book) return null
  // Single-chapter books (Jude, Obadiah, …): bare numbers are verses of ch.1, "14-15" a range.
  if (book.totalChapters === 1 && !m[3]) return { book, chapter: 1, verseStart: chapter, verseEnd: dashEnd ?? chapter }
  return { book, chapter, verseStart: vs, verseEnd: ve }
}

// Versions a synopsis column can be shown in: a Greek edition or a translation.
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

// A clickable Greek word carries enough to fill the parsing pane (the same shared
// ParsingPanel used on the Phrasing tab, which looks up Thayer's/Mounce/Abbott-Smith/
// LSJ by Strong's number). Nestle 1904 words (from the phrase tree) ship a ready-made
// `parsing` string + gloss; Tischendorf words (from /data/gnt) ship structured morph we
// format the same way. Both ship a Strong's number.
type WordToken = { surface: string; parsing: string; lemma: string; gloss?: string; strongs?: string; id?: string; syn?: { role?: string; headId?: string } }
const GNT_MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
function formatGntMorph(m: Record<string, string | null> | undefined): string {
  if (!m) return ''
  return GNT_MORPH_ORDER.map(k => m[k]).filter(Boolean).join(', ')
}

/**
 * Synopsis: the shared (coordinated) passage as the anchor column, plus comparison
 * references the user adds, all shown side by side in a chosen version (Greek edition
 * or translation). Auto-suggested gospel parallels are a planned follow-up.
 */
export function SynopsisView({ controlledPassage, isAuthenticated = false, fontSize: controlledFontSize, onFontSize, onAttribution }: {
  controlledPassage?: string
  isAuthenticated?: boolean
  fontSize?: SynFontSize
  onFontSize?: (v: SynFontSize) => void
  onAttribution?: (a: string) => void
}) {
  const t = useT()
  const [books, setBooks] = useState<RefBook[]>([])
  const [version, setVersion] = useState('na1904')
  // Text size — the settings panel that used to live here is now hoisted into the
  // shared exegesis tools menu (when coordinated); fontSize becomes controlled then.
  const isFontSizeControlled = onFontSize !== undefined
  const [internalFontSize, setInternalFontSize] = useState<SynFontSize>('lg')
  const fontSize = isFontSizeControlled ? (controlledFontSize ?? 'lg') : internalFontSize
  const setFontSize = onFontSize ?? setInternalFontSize
  const [extraRefs, setExtraRefs] = useState<string[]>([])
  const [addInput, setAddInput] = useState('')
  const [addError, setAddError] = useState(false)
  const [pericopes, setPericopes] = useState<Record<string, string>[]>([])
  // Non-Gospel NT parallels (Ephesians/Colossians, Jude/2 Peter, Acts doublets) — a
  // separate, smaller curated set, since "parallel" there means literary/verbal overlap
  // rather than a multi-Gospel narrative event.
  const [ntParallels, setNtParallels] = useState<{ title: string; refs: string[] }[]>([])
  const [parallelsAttribution, setParallelsAttribution] = useState('')
  const [ntParallelsAttribution, setNtParallelsAttribution] = useState('')
  // Report combined attribution up so the hoisted tools menu can show it without
  // duplicating either parallels fetch.
  useEffect(() => {
    onAttribution?.([parallelsAttribution, ntParallelsAttribution].filter(Boolean).join(' '))
  }, [parallelsAttribution, ntParallelsAttribution, onAttribution])
  const cache = useRef<Record<string, Record<string, string>>>({})  // version → verseId → text
  // Greek word-level tokens (surface + parse) for the clickable parsing pane.
  const wordCache = useRef<Record<string, Record<string, WordToken[]>>>({})  // version → verseId → tokens
  // The word whose lexical detail is shown in the parsing pane, plus a key identifying
  // its exact instance (so highlighting doesn't light up every occurrence of a word).
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  // Clear any clicked-word selection when the anchor passage changes, so the pane falls
  // back to the new passage's default word instead of showing a stale selection. (Must
  // sit AFTER the state it sets — it previously ran above the declarations.)
  useEffect(() => { setSelectedInfo(null); setSelectedKey(null) }, [controlledPassage])
  const loaded = useRef<Set<string>>(new Set())
  // `ver` also keys the compare-mode memo: token caches are refs, so this counter is
  // what tells the alignment "new text has arrived, recompute".
  const [ver, setVer] = useState(0)
  const bump = () => setVer(v => v + 1)
  // Compare mode: color each column's editorial changes relative to a chosen source column.
  const [compareOn, setCompareOn] = useState(false)
  // Which redaction categories are painted. The legend chips toggle these (same idiom as
  // the Backgrounds cross-reference type filter), so a student can isolate one device —
  // show only substitutions, say — instead of reading five colours at once. Hidden
  // categories fall back to plain text; the stats line still reports the full comparison.
  const [visibleTags, setVisibleTags] = useState<Set<MarkTag>>(new Set(MARK_TAGS))
  const toggleTag = (t: MarkTag) => setVisibleTags(prev => {
    const next = new Set(prev)
    if (next.has(t)) next.delete(t); else next.add(t)
    return next
  })
  const [sourceIdx, setSourceIdx] = useState(0)
  const [showKey, setShowKey] = useState(false)
  // Which curated device chip's note is open (index into the pericope's annotations).
  const [openDevice, setOpenDevice] = useState<number | null>(null)
  // The word currently under the pointer, as "columnIndex.verseIndex.tokenIndex" — drives
  // the cross-column link highlight (its counterparts in every other column light up).
  const [hoverWord, setHoverWord] = useState<string | null>(null)
  // Rationale bubble for the hovered coloured word: why it wears its tag, citing the
  // source word and reference it was judged against.
  const [hoverTip, setHoverTip] = useState<{ x: number; y: number; title: string; body: string } | null>(null)
  // The signal chip whose evidence is currently ringed in the columns, as
  // "columnIndex:indicatorId" plus the word keys it highlights.
  const [evidence, setEvidence] = useState<{ key: string; keys: Set<string> } | null>(null)
  // Synoptic source model for model-dependent notes (Farrer vs Two-Source/Q).
  // Defaults to Farrer; persisted per browser. Initialized in an effect so SSR and
  // first client render agree (no hydration mismatch).
  const [sourceModel, setSourceModel] = useState<SourceModel>('farrer')
  useEffect(() => {
    const s = typeof localStorage !== 'undefined' ? localStorage.getItem('synopsis-source-model') : null
    if (s === 'q' || s === 'farrer') setSourceModel(s)
  }, [])
  const pickSourceModel = (m: SourceModel) => {
    setSourceModel(m)
    try { localStorage.setItem('synopsis-source-model', m) } catch { /* private mode */ }
  }
  const highlights = useHighlights(isAuthenticated)
  const synPaneRef = useRef<HTMLDivElement>(null)
  const highlightSelection = useHighlightSelection(synPaneRef)

  const anchor = (controlledPassage ?? '').trim()
  const columns = [anchor, ...extraRefs].filter(Boolean)

  // Load persisted highlights for every column's chapter (signed-in users).
  useEffect(() => {
    if (!isAuthenticated || books.length === 0) return
    const seen = new Set<string>()
    for (const ref of columns) {
      const c = column(ref)
      if (c && !seen.has(`${c.book}.${c.chapter}`)) { seen.add(`${c.book}.${c.chapter}`); void highlights.loadFor(c.book, c.chapter) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, books, columns.join('|'), highlights.loadFor])

  // Per-verse personal notes across every column (signed-in users). Keyed "book.chapter.verse".
  const [notedKeys, setNotedKeys] = useState<Set<string>>(new Set())
  const refreshNotes = useCallback(async () => {
    if (!isAuthenticated || books.length === 0) { setNotedKeys(new Set()); return }
    const chapters = new Map<string, { book: string; chapter: number }>()
    for (const ref of columns) {
      const p = parseRef(ref, books)
      if (p) chapters.set(`${p.book.osisId}.${p.chapter}`, { book: p.book.osisId, chapter: p.chapter })
    }
    const keys = new Set<string>()
    await Promise.all(Array.from(chapters.values()).map(async ({ book, chapter }) => {
      try {
        const r = await fetch(`/api/notes?book=${book}&chapter=${chapter}&verseStart=1&verseEnd=200`)
        const d = await r.json()
        for (const n of (d.notes ?? []) as { verse: number }[]) keys.add(`${book}.${chapter}.${n.verse}`)
      } catch { /* ignore */ }
    }))
    setNotedKeys(keys)
  }, [isAuthenticated, books, columns.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { refreshNotes() }, [refreshNotes])
  useEffect(() => onNotesChanged(refreshNotes), [refreshNotes])

  useEffect(() => {
    // GNT + MT: the OT parallels (Samuel–Kings ‖ Chronicles, the Psalms doublets, Isa 36–39)
    // need Hebrew books to parse; NT first so ambiguous prefixes resolve as before.
    fetch('/data/books.json').then(r => r.json()).then(d => setBooks([...(d.gnt ?? []), ...(d.mt ?? [])])).catch(() => {})
    fetch('/data/gospel-parallels.json').then(r => r.json()).then((d: { attribution?: string; pericopes?: Record<string, string>[] }) => {
      setPericopes(d.pericopes ?? [])
      setParallelsAttribution(d.attribution ?? '')
    }).catch(() => {})
    // The OT parallels ride the same { title, refs[] } machinery as the non-Gospel NT
    // parallels — anchors can never collide (different books), so one list serves both.
    Promise.all([
      fetch('/data/nt-parallels.json').then(r => r.json()),
      fetch('/data/ot-parallels.json').then(r => r.json()),
    ]).then(([d, ot]: { attribution?: string; parallels?: { title: string; refs: string[] }[] }[]) => {
      setNtParallels([...(d.parallels ?? []), ...(ot.parallels ?? [])])
      if (ot.attribution) setNtParallelsAttribution(a => a ? `${a} ${ot.attribution}` : ot.attribution!)
      setNtParallelsAttribution(d.attribution ?? '')
    }).catch(() => {})
  }, [])

  // Find the best-matching gospel pericope for the anchor and its parallel refs.
  // Collect every pericope whose entry for the anchor's gospel overlaps the anchor,
  // then prefer the one with the most parallels (so a single-gospel pericope sharing a
  // verse range never hides a richer multi-gospel match).
  const GOSPELS = ['Matt', 'Mark', 'Luke', 'John']
  function computeBest(anchorRef: string): { title: string; refs: string[] } | null {
    if (!anchorRef || !books.length || !pericopes.length) return null
    const p = parseRef(anchorRef, books)
    if (!p || !GOSPELS.includes(p.book.osisId)) return null
    const osis = p.book.osisId
    const matches: { title: string; refs: string[]; score: number }[] = []
    for (const per of pericopes) {
      const cell = per[osis]
      if (!cell) continue
      const cp = parseRef(cell, books)
      if (cp && cp.book.osisId === osis && cp.chapter === p.chapter && cp.verseStart <= p.verseEnd && cp.verseEnd >= p.verseStart) {
        const others = GOSPELS.filter(g => g !== osis && per[g])
        matches.push({ title: per.title, refs: others.map(g => per[g]), score: others.length })
      }
    }
    if (!matches.length) return null
    matches.sort((a, b) => b.score - a.score)
    return { title: matches[0].title, refs: matches[0].refs }
  }

  // Non-Gospel NT parallels (Ephesians/Colossians, Jude/2 Peter, Acts doublets): a flat
  // list of { title, refs[] } entries rather than the Gospel table's book-keyed columns,
  // since these span arbitrary book pairs (and Acts pairs a book with itself). Returns
  // the first entry whose refs overlap the anchor, plus its other refs to suggest.
  function computeBestNt(anchorRef: string): { title: string; refs: string[] } | null {
    if (!anchorRef || !books.length || !ntParallels.length) return null
    const p = parseRef(anchorRef, books)
    if (!p) return null
    for (const par of ntParallels) {
      const idx = par.refs.findIndex(r => {
        const cp = parseRef(r, books)
        return !!cp && cp.book.osisId === p.book.osisId && cp.chapter === p.chapter && cp.verseStart <= p.verseEnd && cp.verseEnd >= p.verseStart
      })
      if (idx !== -1) return { title: par.title, refs: par.refs.filter((_, i) => i !== idx) }
    }
    return null
  }

  // Gospel pericopes take priority (richer, denser dataset); the NT parallels only
  // apply outside the Gospels anyway, so the two never really compete for the same anchor.
  const bestGospel = computeBest(anchor)
  const bestNt = !bestGospel ? computeBestNt(anchor) : null
  const best = bestGospel ?? bestNt
  const parallelsLabel = bestGospel ? t('syn.gospelParallels') : t('syn.parallelPassages')
  // Chips offer to re-add any parallel the user has removed.
  const suggestionChips = best ? best.refs.filter(r => !columns.includes(r)) : []
  // Tier-3 curated compositional-device notes for this pericope (may be undefined —
  // the annotation set grows pericope-by-pericope).
  const deviceNotes = bestGospel ? PERICOPE_ANNOTATIONS[bestGospel.title] : undefined
  // Close any open note when the pericope changes.
  useEffect(() => { setOpenDevice(null) }, [bestGospel?.title])

  // Auto-load the parallels as columns when the anchor passage changes.
  useEffect(() => {
    const b = computeBest(anchor) ?? computeBestNt(anchor)
    setExtraRefs(b ? b.refs : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, books, pericopes, ntParallels])

  // Load verse text for every column's chapter in the chosen version.
  useEffect(() => {
    if (!books.length) return
    for (const ref of columns) {
      const p = parseRef(ref, books)
      if (!p) continue
      ensure(version, p.book.osisId, p.chapter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.join('|'), version, books])

  function ensure(v: string, osis: string, chapter: number) {
    // na1904 has no verse-text files — reconstruct verse text from the per-book phrase
    // tree (MACULA = Nestle 1904), loaded once per book.
    const ck = v === 'bsb' ? 'bsb' : v === 'na1904' ? `na1904.${osis}` : `${v}.${osis}.${chapter}`
    if (loaded.current.has(ck)) return
    loaded.current.add(ck)
    const done = (map: Record<string, string>, patch: Record<string, string>) => { Object.assign(map, patch); bump() }
    if (v === 'na1904') {
      // Shared extraction (phrase-tree-tokens.ts): words in verse order, each carrying
      // its clause role + phrase head from the MACULA tree, which the compare-mode
      // alignment uses for slot-aware substitution and article-to-noun attachment.
      fetch(`/data/phrase-tree/${osis}.json`).then(r => r.json()).then((d: PhraseTreeDoc) => {
        const verses = phraseTreeVerses(d)
        const patch: Record<string, string> = {}
        const wpatch: Record<string, WordToken[]> = {}
        for (const [vKey, toks] of Object.entries(verses)) {
          patch[vKey] = toks.map(t => t.surface).join(' ')
          wpatch[vKey] = toks
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
      fetch('/data/bsb-alignment.json?v=3').then(r => r.json()).then((d: Record<string, { text: string }>) => {
        const map = (cache.current.bsb ??= {})
        done(map, Object.fromEntries(Object.entries(d).map(([vid, val]) => [vid, val.text])))
      }).catch(() => {})
    } else {
      fetch(`/api/translation?book=${osis}&chapter=${chapter}&lang=${v}`).then(r => r.json()).then((d: { verses?: Record<string, string> }) => {
        done((cache.current[v] ??= {}), d.verses ?? {})
      }).catch(() => {})
    }
  }

  function column(ref: string): { label: string; book: string; bookName: string; chapter: number; verses: { ref: string; verse: number; text: string; tokens?: WordToken[] }[] } | null {
    const p = parseRef(ref, books)
    if (!p) return null
    const map = cache.current[version] ?? {}
    const wmap = wordCache.current[version] ?? {}
    const verses: { ref: string; verse: number; text: string; tokens?: WordToken[] }[] = []
    for (let v = p.verseStart; v <= p.verseEnd; v++) {
      const vid = `${p.book.osisId}.${p.chapter}.${v}`
      const t = map[vid]
      if (t) verses.push({ ref: `${p.chapter}:${v}`, verse: v, text: t, tokens: wmap[vid] })
    }
    const label = `${p.book.name} ${p.chapter}:${p.verseStart}${p.verseEnd !== p.verseStart ? `–${verses.length ? verses[verses.length - 1].ref.split(':')[1] : p.verseEnd}` : ''}`
    return { label, book: p.book.osisId, bookName: p.book.name, chapter: p.chapter, verses }
  }

  /** Build the ParsingPanel's info object for a clicked word, given its owning column + verse. */
  function toLexicalInfo(tok: WordToken, bookName: string, verseRef: string): LexicalInfoPanel {
    return {
      surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '', partOfSpeech: '',
      parsing: tok.parsing, strongs: tok.strongs, reference: `${bookName} ${verseRef}`,
    }
  }

  const addRef = (raw: string = addInput) => {
    const r = raw.trim()
    if (!r) return
    if (!parseRef(r, books)) { setAddError(true); return }
    setExtraRefs(prev => [...prev, r])
    setAddInput(''); setAddError(false)
  }

  const isGreek = version === 'gnt' || version === 'na1904'
  // OT anchors: the 'na1904' code reads the phrase trees, which for the OT are the Macula
  // HEBREW (WLC) — so the "original" column is Hebrew, and the NT-only Tischendorf/BSB
  // files are withheld. Parallels pair OT with OT, so one flag serves every column.
  const anchorParsed = books.length ? parseRef(anchor, books) : null
  const anchorHebrew = !!anchorParsed && MT_OSIS.has(anchorParsed.book.osisId)

  // Keep the source pointer valid if the user removes columns while comparing.
  useEffect(() => { if (sourceIdx >= columns.length) setSourceIdx(0) }, [columns.length, sourceIdx])
  // Drop any ringed signal evidence when the comparison it came from changes.
  useEffect(() => { setEvidence(null) }, [compareOn, sourceIdx, columns.join('|'), version]) // eslint-disable-line react-hooks/exhaustive-deps

  // Default the source to a Mark column when compare is switched on (the most common
  // classroom direction), but leave the choice fully user-editable — the tool takes no
  // position on Synoptic source theories.
  const toggleCompare = () => {
    setHoverTip(null)
    setCompareOn(on => {
      if (!on) {
        const mk = columns.findIndex(r => r.trim().toLowerCase().startsWith('mark'))
        setSourceIdx(mk !== -1 ? mk : 0)
      }
      return !on
    })
  }

  // Word-level redaction comparison: every non-source Greek column aligned against the
  // source (lemma-level LCS in redaction-compare.ts), tags mapped back onto each
  // column's per-verse token arrays for rendering. A source word counts as "omitted"
  // only if no compared column picked it up in any form.
  type ColCompare = {
    tagsByVerse: Record<number, RedactionTag[]>
    stats: CompareResult['stats']
    /** [verse index][token index] → the source token's flat index, or null if added. */
    linkByVerse: Record<number, (number | null)[]>
    /** source flat index → every position in THIS column that matched it. */
    bySource: Map<number, { vi: number; ti: number }[]>
    /** source verse index → the verses of this column it corresponds to (content-word
     *  aggregate, thresholded — see verseMapOf). */
    verseMap: Record<number, number[]>
    /** target flat index → position, for mapping indicator evidence back to words. */
    tgtPos: { vi: number; ti: number }[]
    /** Narrative-device signals computed from this column's alignment. */
    indicators: Indicator[]
  }
  // The alignment runs whenever two Greek columns are up, not only in compare mode:
  // "which verse matches which" is useful to a student who isn't thinking about redaction
  // yet. `compareOn` governs only whether the words get coloured.
  const compareData = useMemo(() => {
    if (!isGreek || columns.length < 2) return null
    const cols = columns.map(ref => column(ref))
    const src = sourceIdx < cols.length ? cols[sourceIdx] : null
    if (!src) return null
    const flatten = (c: NonNullable<ReturnType<typeof column>>) => {
      const tokens: CompareToken[] = []
      const map: { vi: number; ti: number }[] = []
      c.verses.forEach((v, vi) => (v.tokens ?? []).forEach((t, ti) => {
        tokens.push({ lemma: t.lemma, surface: t.surface, parsing: t.parsing, id: t.id, role: t.syn?.role, headId: t.syn?.headId })
        map.push({ vi, ti })
      }))
      return { tokens, map }
    }
    const srcFlat = flatten(src)
    if (!srcFlat.tokens.length) return null

    /** Aggregate word links into verse correspondences. Content words only — καί and ὁ
     *  link to nearly everything, so counting them would make every verse "match" every
     *  other. A target verse is kept when at least two content words land in it AND it
     *  holds a third of the best-matching verse's share, which keeps genuine two-verse
     *  spans while dropping one-word coincidences. */
    const verseMapOf = (links: (number | null)[], tgtMap: { vi: number; ti: number }[]) => {
      const tally = new Map<number, Map<number, number>>()   // srcVi → tgtVi → count
      links.forEach((si, k) => {
        if (si === null || isFunctionWord(srcFlat.tokens[si])) return
        const sVi = srcFlat.map[si].vi, tVi = tgtMap[k].vi
        const inner = tally.get(sVi) ?? new Map<number, number>()
        inner.set(tVi, (inner.get(tVi) ?? 0) + 1)
        tally.set(sVi, inner)
      })
      const out: Record<number, number[]> = {}
      // Array.from rather than spreading the Map iterators: next dev tolerates the spread
      // but the strict build (Vercel Production) rejects it without downlevelIteration.
      Array.from(tally.entries()).forEach(([sVi, inner]) => {
        const counts = Array.from(inner.values())
        const top = Math.max.apply(null, counts)
        const kept = Array.from(inner.entries())
          .filter(([, n]) => n >= 2 && n >= top / 3)
          .map(([tVi]) => tVi)
          .sort((a, b) => a - b)
        if (kept.length) out[sVi] = kept
      })
      return out
    }

    const perCol = new Map<number, ColCompare>()
    const usedAny: boolean[] = new Array(srcFlat.tokens.length).fill(false)
    cols.forEach((c, i) => {
      if (i === sourceIdx || !c) return
      const tgtFlat = flatten(c)
      if (!tgtFlat.tokens.length) return
      const r = compareRedaction(srcFlat.tokens, tgtFlat.tokens)
      const tagsByVerse: Record<number, RedactionTag[]> = {}
      const linkByVerse: Record<number, (number | null)[]> = {}
      const bySource = new Map<number, { vi: number; ti: number }[]>()
      tgtFlat.map.forEach((m, k) => {
        (tagsByVerse[m.vi] ??= [])[m.ti] = r.tags[k]
        ;(linkByVerse[m.vi] ??= [])[m.ti] = r.links[k]
        const si = r.links[k]
        if (si !== null) bySource.set(si, [...(bySource.get(si) ?? []), { vi: m.vi, ti: m.ti }])
      })
      // Narrative-device signals for this column: the word-level detectors, plus the
      // pericope-order displacement check when both columns are gospels the harmony
      // dataset places.
      const indicators = computeColumnIndicators(srcFlat.tokens, tgtFlat.tokens, r)
      if (bestGospel && src.book !== c.book && GOSPELS.includes(src.book) && GOSPELS.includes(c.book)) {
        const shift = computeSequenceShift(pericopes, bestGospel.title, src.book, c.book)
        if (shift) indicators.push({
          id: 'sequence', device: 'Displacement',
          label: `sequence · ${shift.dir}`,
          title: `Among the pericopes both ${src.bookName} and ${c.bookName} contain, this episode sits ${Math.abs(shift.diff)} positions ${shift.dir} in ${c.bookName}'s order than in ${src.bookName}'s — a displacement signal.`,
          srcEvidence: [], tgtEvidence: [],
        })
      }
      perCol.set(i, { tagsByVerse, stats: r.stats, linkByVerse, bySource, verseMap: verseMapOf(r.links, tgtFlat.map), tgtPos: tgtFlat.map, indicators })
      r.sourceUsed.forEach((u, k) => { if (u) usedAny[k] = true })
    })
    if (!perCol.size) return null
    // Strike-through in the source column. Glue words (articles, particles, …) are only
    // struck alongside an omitted neighbouring content word — an unused stray καί is not
    // an omission worth asserting, but a dropped phrase is struck whole.
    const omitByVerse: Record<number, boolean[]> = {}
    let struck = 0
    srcFlat.map.forEach((m, k) => {
      let strike = !usedAny[k]
      if (strike && isGlueWord(srcFlat.tokens[k])) {
        strike = [k - 2, k - 1, k + 1, k + 2].some(j =>
          j >= 0 && j < srcFlat.tokens.length && !usedAny[j] && !isGlueWord(srcFlat.tokens[j]))
      }
      if (strike) struck++
      ;(omitByVerse[m.vi] ??= [])[m.ti] = strike
    })
    // Position → flat index for the source column, so hovering a source word can find
    // everything that matched it.
    const srcFlatOf: Record<string, number> = {}
    srcFlat.map.forEach((m, k) => { srcFlatOf[`${m.vi}.${m.ti}`] = k })
    return { sourceIdx, perCol, omitByVerse, srcFlatOf, srcPos: srcFlat.map, omittedByAll: struck }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGreek, sourceIdx, columns.join('|'), version, ver, books, pericopes, bestGospel?.title])

  // Every position that aligns with the hovered word, keyed "col.verse.token" — the word
  // itself plus its counterpart in each other column. Hovering anywhere in the chain
  // lights up the whole chain, so a word in Matthew shows both its Markan source and its
  // Lukan cousin.
  const linkedKeys = useMemo(() => {
    const out = new Set<string>()
    if (!compareData || !hoverWord) return out
    const [c, v, t] = hoverWord.split('.').map(Number)
    // Resolve the hovered word to a source-column flat index, whichever side it's on.
    const srcFlat = c === compareData.sourceIdx
      ? compareData.srcFlatOf[`${v}.${t}`]
      : compareData.perCol.get(c)?.linkByVerse[v]?.[t] ?? null
    if (srcFlat === undefined || srcFlat === null) return out
    const sp = compareData.srcPos[srcFlat]
    if (sp) out.add(`${compareData.sourceIdx}.${sp.vi}.${sp.ti}`)
    Array.from(compareData.perCol.entries()).forEach(([ci, cc]) => {
      for (const p of cc.bySource.get(srcFlat) ?? []) out.add(`${ci}.${p.vi}.${p.ti}`)
    })
    return out
  }, [compareData, hoverWord])

  /** "Matt 3:16–17" for a run of corresponding verses in a compared column. */
  const verseMapLabel = (colIdx: number, verseIdxs: number[]): string | null => {
    const c = column(columns[colIdx])
    if (!c) return null
    const nums = verseIdxs.map(vi => c.verses[vi]?.verse).filter((n): n is number => n != null)
    if (!nums.length) return null
    // Collapse consecutive runs: [16,17] → "16–17".
    const parts: string[] = []
    let start = nums[0], prev = nums[0]
    for (const n of nums.slice(1)) {
      if (n === prev + 1) { prev = n; continue }
      parts.push(start === prev ? `${start}` : `${start}–${prev}`)
      start = prev = n
    }
    parts.push(start === prev ? `${start}` : `${start}–${prev}`)
    return `${c.book} ${c.chapter}:${parts.join(', ')}`
  }

  // Default parsing-pane content before any word is clicked: the anchor column's first
  // available token, so the pane never sits empty (mirrors the Phrasing tab's behavior).
  const defaultParsingInfo: LexicalInfoPanel | null = (() => {
    if (!isGreek || !anchor) return null
    const col0 = column(anchor)
    if (!col0) return null
    const firstVerse = col0.verses.find(v => v.tokens && v.tokens.length > 0)
    const firstTok = firstVerse?.tokens?.[0]
    if (!firstVerse || !firstTok) return null
    return toLexicalInfo(firstTok, col0.bookName, firstVerse.ref)
  })()

  return (
    <div className="space-y-4">
      {/* Matched pericope + auto-loaded parallels. Removed columns can be re-added here. */}
      {best && (
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs font-medium text-gray-500">{parallelsLabel} — <span className="text-gray-700">{best.title}</span></span>
          {suggestionChips.map(r => (
            <button
              key={r}
              onClick={() => setExtraRefs(prev => prev.includes(r) ? prev : [...prev, r])}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs text-brand-700 hover:bg-brand-100"
            >
              + {r}
            </button>
          ))}
        </div>
      )}

      {/* Curated compositional-device notes for this pericope (Tier 3): chips name the
          narrative-level devices scholarship most often identifies here; clicking one
          opens its study note. Independent of compare mode — these are episode-level
          observations, not word-level computations. */}
      {deviceNotes && deviceNotes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-medium text-gray-500">Narrative devices <span className="text-[10px] font-normal text-gray-400">· curated</span></span>
            {deviceNotes.map((a, idx) => (
              <button
                key={idx}
                onClick={() => setOpenDevice(d => d === idx ? null : idx)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${openDevice === idx ? 'border-parchment-400 bg-parchment-200 text-gray-800' : 'border-parchment-300 bg-parchment-50 text-gray-600 hover:bg-parchment-100'}`}
              >
                {a.device}
              </button>
            ))}
            {/* Source-model toggle: notes whose direction depends on the Synoptic
                source hypothesis carry two wordings; this picks which one is shown. */}
            <label className="ml-auto flex items-center gap-1.5 text-[11px] text-gray-400" title="Both models assume Mark wrote first. Farrer: Luke also used Matthew (no Q). Two-Source: Matthew and Luke independently used the sayings source Q. Notes whose direction depends on the model change wording accordingly.">
              Source model
              <select
                value={sourceModel}
                onChange={e => pickSourceModel(e.target.value as SourceModel)}
                className="rounded border border-gray-300 px-1.5 py-0.5 text-[11px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {SOURCE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
          </div>
          {openDevice !== null && deviceNotes[openDevice] && (
            <div className="max-w-3xl rounded-lg border border-parchment-200 bg-parchment-50 px-3 py-2 text-xs leading-relaxed text-gray-600">
              <span className="font-semibold text-gray-700">{deviceNotes[openDevice].device}. </span>
              {noteFor(deviceNotes[openDevice], sourceModel)}
              {/* Corroboration: when this curated device's computed signal also fires in
                  the live comparison, say so — the two registers agreeing is itself
                  evidence worth showing. Silence when compare mode is off. */}
              {compareOn && compareData && (() => {
                const ids = DEVICE_SIGNALS[deviceNotes[openDevice].device] ?? []
                if (!ids.length) return null
                const hits: string[] = []
                Array.from(compareData.perCol.entries()).forEach(([ci, cc]) => {
                  const col = column(columns[ci])
                  cc.indicators.filter(x => ids.includes(x.id)).forEach(x => hits.push(`${col?.label ?? ''} — ${x.label}`))
                })
                if (!hits.length) return null
                return (
                  <p className="mt-1.5 border-t border-parchment-200 pt-1.5 text-[11px] text-gray-500">
                    Computed signals agree: {hits.join(' · ')}. Click the dashed chips under each column to ring the evidence.
                  </p>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Compare mode: color-code each column's editorial changes against a chosen
          source column (Theon's four modes of paraphrase — see the techniques key).
          Greek editions only: the alignment runs on lemmas. */}
      {anchor && isGreek && columns.length >= 2 && (
        <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
          <button
            onClick={toggleCompare}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${compareOn ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            Compare editorial changes
          </button>
          {compareOn && (
            <>
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                Source
                <select
                  value={sourceIdx}
                  onChange={e => setSourceIdx(parseInt(e.target.value))}
                  className="rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {columns.map((r, i) => <option key={i} value={i}>{column(r)?.label ?? r}</option>)}
                </select>
              </label>
              <button
                onClick={() => setShowKey(k => !k)}
                className={`rounded-lg border px-2.5 py-1 text-xs ${showKey ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                Techniques key
              </button>
              {/* Legend doubles as a filter: click a category to hide its colour and read
                  those words as plain text. Dimmed chip = hidden (same idiom as the
                  Backgrounds type filter). */}
              <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-600">
                <span className="text-[9px] uppercase tracking-wide text-gray-400">{t('syn.wordLevel')}</span>
                <span className="rounded border border-gray-300 px-1.5">plain = verbatim</span>
                {MARK_TAGS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    aria-pressed={visibleTags.has(t)}
                    title={visibleTags.has(t) ? `Hide ${MARK_LABELS[t]}` : `Show ${MARK_LABELS[t]}`}
                    className={`rc-mark rc-${t} rounded px-1.5 transition-opacity ${visibleTags.has(t) ? '' : 'opacity-30'}`}
                  >
                    {MARK_LABELS[t]}
                  </button>
                ))}
                {visibleTags.size < MARK_TAGS.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleTags(new Set(MARK_TAGS))}
                    className="rounded border border-gray-300 px-1.5 text-gray-500 hover:bg-gray-50"
                  >
                    show all
                  </button>
                )}
              </span>
            </>
          )}
        </div>
      )}

      {!anchor ? (
        <p className="text-sm text-gray-400 italic">{t('syn.enterPassage')}</p>
      ) : (
        // Capped height with its own scroll (rather than letting the page grow), so a
        // long passage can't push the parsing pane below the fold — it stays visible
        // right after the columns without the user needing to scroll to find it.
        <div ref={synPaneRef} onMouseLeave={() => { setHoverWord(null); setHoverTip(null) }} onScrollCapture={() => setHoverTip(null)} className="flex gap-4 overflow-x-auto max-h-[48vh] pb-2" style={{ '--syn-fs': FONT_SIZE_MAP[fontSize] } as CSSProperties}>
          {columns.map((ref, i) => {
            const col = column(ref)
            return (
              <div key={i} className="w-72 shrink-0 rounded-xl border border-gray-200 p-3 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2 gap-2 shrink-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{col?.label ?? ref}{i === 0 && <span className="ml-1 text-[10px] font-normal text-brand-600 uppercase tracking-wide">anchor</span>}{compareOn && compareData && i === compareData.sourceIdx && <span className="ml-1 text-[10px] font-normal text-red-600 uppercase tracking-wide">source</span>}</p>
                  {i > 0 && (
                    <button onClick={() => setExtraRefs(r => r.filter((_, j) => j !== i - 1))} className="text-gray-400 hover:text-red-600 shrink-0" title={t('syn.removeColumn')}><X size={14} /></button>
                  )}
                </div>
                {i === 0 && (
                  <select
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                    className="mb-2 w-full shrink-0 rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {VERSIONS
                      .filter(v => !(anchorHebrew && (v.code === 'gnt' || v.code === 'bsb')))
                      .map(v => <option key={v.code} value={v.code}>{
                        v.code === 'na1904' && anchorHebrew ? 'Hebrew — Leningrad (WLC)' : v.label
                      }</option>)}
                  </select>
                )}
                {/* Compare mode: the redaction profile — how much of the source this
                    column keeps and what it does to the rest (Tier-2 summary). */}
                {compareOn && compareData && (i === compareData.sourceIdx
                  ? <p className="mb-1 shrink-0 text-[10px] leading-snug text-gray-400">{compareData.omittedByAll} word{compareData.omittedByAll === 1 ? '' : 's'} picked up by no compared column</p>
                  : (() => {
                      const cc = compareData.perCol.get(i)
                      if (!cc) return null
                      const s = cc.stats
                      return (
                        <>
                        <p className="mb-1 shrink-0 text-[10px] leading-snug text-gray-400" title="Retention counts source words kept verbatim, re-inflected, or moved. The headline % is over content words only (articles, conjunctions, prepositions, particles, and pronouns excluded); the all-words figure follows in parentheses.">
                          retains {s.contentRetentionPct}% of content words ({s.retentionPct}% overall) · +{s.added} added · −{s.omitted} omitted · {s.subst} substituted · {s.form + s.moved} recast{s.tenseChanges > 0 ? ` (${s.tenseChanges} tense)` : ''}
                        </p>
                        {/* Narrative-device SIGNALS — dashed chips, deliberately styled apart
                            from both the word-level colour marks (automatic) and the curated
                            parchment device chips (human judgment). Clicking one rings the
                            words that generated it. */}
                        {cc.indicators.length > 0 && (
                          <div className="mb-1 shrink-0 flex flex-wrap items-center gap-1">
                            <span className="text-[9px] uppercase tracking-wide text-gray-400">signals</span>
                            {cc.indicators.map(ind => {
                              const k = `${i}:${ind.id}`
                              const active = evidence?.key === k
                              const clickable = ind.srcEvidence.length + ind.tgtEvidence.length > 0
                              // Same styled rationale bubble the coloured words get —
                              // the native title tooltip was slow to appear and
                              // invisible on touch.
                              const showChipTip = (e: React.MouseEvent) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const x = Math.min(Math.max(rect.left + rect.width / 2, 152), Math.max(window.innerWidth - 152, 152))
                                setHoverTip({
                                  x, y: rect.top,
                                  title: ind.device ? `Signal · ${ind.device.toLowerCase()}` : 'Note',
                                  body: ind.title + (clickable ? (active ? t('syn.clickToClear') : t('syn.clickToRing')) : ''),
                                })
                              }
                              return (
                                <button
                                  key={ind.id}
                                  type="button"
                                  onMouseEnter={showChipTip}
                                  onMouseLeave={() => setHoverTip(null)}
                                  onClick={e => {
                                    if (!clickable) { showChipTip(e); return }
                                    if (active) { setEvidence(null); showChipTip(e); return }
                                    const keys = new Set<string>()
                                    for (const sk of ind.srcEvidence) { const p = compareData.srcPos[sk]; if (p) keys.add(`${compareData.sourceIdx}.${p.vi}.${p.ti}`) }
                                    for (const tk of ind.tgtEvidence) { const p = cc.tgtPos[tk]; if (p) keys.add(`${i}.${p.vi}.${p.ti}`) }
                                    setEvidence({ key: k, keys })
                                    showChipTip(e)
                                  }}
                                  className={`rounded border border-dashed px-1.5 py-px text-[10px] transition-colors ${active ? 'border-parchment-500 bg-parchment-100 text-gray-800' : 'border-gray-400 text-gray-600 hover:bg-gray-50'} ${clickable ? '' : 'cursor-default opacity-75'}`}
                                >
                                  {ind.label}
                                </button>
                              )
                            })}
                          </div>
                        )}
                        </>
                      )
                    })())}
                {col && col.verses.length > 0 ? (
                  <div
                    dir={isGreek && anchorHebrew ? 'rtl' : undefined}
                    className={`flex-1 min-h-0 overflow-y-auto space-y-1 leading-relaxed ${isGreek ? (anchorHebrew ? 'font-hebrew text-gray-900' : 'font-greek text-gray-900') : 'font-reading text-gray-700'}`}
                    style={{ fontSize: isGreek ? (anchorHebrew ? 'calc(var(--syn-fs, 1.45rem) * 0.92)' : 'var(--syn-fs, 1.45rem)') : 'calc(var(--syn-fs, 1.45rem) * 0.82)' }}
                  >
                    {col.verses.map((v, vi) => (
                      <p key={v.ref}>
                        {isAuthenticated && (
                          <span className="font-sans align-middle mr-0.5"><VerseNoteButton book={col.book} chapter={col.chapter} verse={v.verse} noted={notedKeys.has(`${col.book}.${col.chapter}.${v.verse}`)} onChanged={refreshNotes} /></span>
                        )}
                        <sup className="text-[10px] text-brand-500 mr-0.5 font-sans">{v.ref.split(':')[1]}</sup>
                        {/* Verse correspondence: in the source column, which verse of each
                            compared column this one aligns with (aggregated from the word
                            links, content words only). The parallel structure is then
                            readable at rest, without hovering anything. */}
                        {compareData && i === compareData.sourceIdx && (() => {
                          const chips = Array.from(compareData.perCol.entries())
                            .map(([ci, cc]) => verseMapLabel(ci, cc.verseMap[vi] ?? []))
                            .filter((s): s is string => !!s)
                          if (!chips.length) return null
                          return (
                            <span className="font-sans align-middle mr-1 inline-flex flex-wrap gap-1" title={t('syn.correspondingVerses')}>
                              {chips.map(t => (
                                <span key={t} className="rounded bg-brand-50 px-1 py-px text-[9px] font-medium text-brand-700 ring-1 ring-brand-100">{t}</span>
                              ))}
                            </span>
                          )
                        })()}
                        {/* Greek: hovering (or clicking, for touch) a word updates the parsing
                            pane below — same interaction as the Phrasing tab. Falls back to
                            plain text if word-level tokens haven't loaded (or aren't available). */}
                        {isGreek && v.tokens && v.tokens.length > 0
                          ? (() => {
                              const verseHighlights = highlights.forVerse(col.book, col.chapter, v.verse, 'grc')
                              return (
                                <span {...verseAnchorProps(col.book, col.chapter, v.verse, 'grc')}>
                                  {withTokenOffsets(v.tokens).map(({ token: tok, start, end }, ti) => {
                                    const key = `${col.book}.${col.chapter}.${v.verse}.${ti}`
                                    const select = () => { setSelectedInfo(toLexicalInfo(tok, col.bookName, v.ref)); setSelectedKey(key) }
                                    const hl = highlightAt(start, end, verseHighlights)
                                    // Compare mode: the redaction tag colors the word; personal
                                    // highlight marks pause while comparing so the two ink
                                    // systems never stack on one word.
                                    const rcTag = compareData
                                      ? (i === compareData.sourceIdx
                                          ? (compareData.omitByVerse[vi]?.[ti] ? 'omitted' : null)
                                          : (compareData.perCol.get(i)?.tagsByVerse[vi]?.[ti] ?? null))
                                      : null
                                    // Painted only if the category is a marked one AND the
                                    // legend has it switched on; otherwise the word reads plain.
                                    const rcClass = rcTag && rcTag !== 'same' && visibleTags.has(rcTag as MarkTag)
                                      ? `rc-mark rc-${rcTag}` : ''
                                    // Cross-column link: this word aligns with the one under
                                    // the pointer, so ring it. Uses an outline rather than a
                                    // background so it stacks cleanly on a redaction colour.
                                    const linked = linkedKeys.has(`${i}.${vi}.${ti}`)
                                    // Evidence ring for the active signal chip — parchment,
                                    // to tie it visually to the narrative-device register
                                    // (and apart from the brand-blue hover-link ring).
                                    const evid = evidence?.keys.has(`${i}.${vi}.${ti}`) ?? false
                                    // Rationale bubble for the word's tag, citing the source
                                    // word + reference it was judged against (the aligner's
                                    // own evidence, not a generated gloss).
                                    const showTip = (e: React.MouseEvent) => {
                                      if (!compareOn || !compareData || !rcClass || !rcTag) { setHoverTip(null); return }
                                      const rect = e.currentTarget.getBoundingClientRect()
                                      const x = Math.min(Math.max(rect.left + rect.width / 2, 152), Math.max(window.innerWidth - 152, 152))
                                      const srcCol = column(columns[compareData.sourceIdx])
                                      let body = ''
                                      if (rcTag === 'omitted') body = 'No compared column takes this word up in any form.'
                                      else if (rcTag === 'added') body = `No counterpart in ${srcCol?.label ?? 'the source'} — new material.`
                                      else {
                                        const sFlat = compareData.perCol.get(i)?.linkByVerse[vi]?.[ti]
                                        const sp = sFlat != null ? compareData.srcPos[sFlat] : undefined
                                        const sv = sp && srcCol ? srcCol.verses[sp.vi] : undefined
                                        const stok = sp ? sv?.tokens?.[sp.ti] : undefined
                                        if (stok && sv && srcCol) {
                                          const ref = `${srcCol.bookName} ${srcCol.chapter}:${sv.verse}`
                                          if (rcTag === 'form') {
                                            const d = parsingDiff(stok.parsing, tok.parsing)
                                            body = `${stok.surface} (${ref}) → ${tok.surface}${d ? ` — ${d}` : ''}.`
                                          } else if (rcTag === 'moved') {
                                            const sameForm = stok.surface.replace(/[.,·;]/g, '') === tok.surface.replace(/[.,·;]/g, '')
                                            body = `Same word as ${stok.surface} at ${ref}, relocated${sameForm ? '' : ' and re-inflected'}.`
                                          } else if (rcTag === 'subst') {
                                            const role = tok.syn?.role ? ROLE_LABELS[tok.syn.role] : undefined
                                            body = `Replaces ${stok.surface} (${ref}) in the same slot${role ? ` (${role})` : ''}.`
                                          }
                                          // Narrative-signal note, when this very pair is one:
                                          // the bridge from the word-level colour to the
                                          // device vocabulary.
                                          const fa = morphFacts({ lemma: stok.lemma, surface: stok.surface, parsing: stok.parsing })
                                          const fb = morphFacts({ lemma: tok.lemma, surface: tok.surface, parsing: tok.parsing })
                                          if (fa.person && fb.person && fa.person !== fb.person) body += ` Person ${fa.person} → ${fb.person} — a transferal signal.`
                                          else if (fa.cls === 'verb' && fb.cls === 'verb' && fa.number === 'plural' && fb.number === 'singular') body += ' Plural → singular — a spotlighting signal.'
                                          else if (fa.cls === 'verb' && fb.cls === 'verb' && fa.indicative && fb.indicative && fa.tense === 'present' && fb.tense === 'aorist') body += ' Historical present smoothed to aorist.'
                                        }
                                      }
                                      if (!body) { setHoverTip(null); return }
                                      setHoverTip({ x, y: rect.top, title: TAG_TITLES[rcTag as MarkTag] ?? rcTag, body })
                                    }
                                    return (
                                      <span
                                        key={ti}
                                        onMouseEnter={e => { select(); setHoverWord(`${i}.${vi}.${ti}`); showTip(e) }}
                                        onClick={e => { select(); setHoverWord(`${i}.${vi}.${ti}`); showTip(e) }}
                                        onContextMenu={e => {
                                          e.preventDefault()
                                          openWordSearch({
                                            x: e.clientX, y: e.clientY, surface: tok.surface, lemma: tok.lemma || null,
                                            reference: `${col.bookName} ${v.ref}`, kind: 'greek', greekCorpus: 'GNT',
                                            highlight: isAuthenticated ? {
                                              activeColor: hl?.color ?? null,
                                              onPick: c => hl ? void highlights.recolor(hl.id, col.book, col.chapter, c) : void highlights.create(col.book, col.chapter, v.verse, start, end, c, 'grc'),
                                              onRemove: () => { if (hl) void highlights.remove(hl.id, col.book, col.chapter) },
                                            } : undefined,
                                          })
                                        }}
                                        {...(hl ? { 'data-highlight-id': hl.id, 'data-hl-book': col.book, 'data-hl-chapter': col.chapter, 'data-hl-color': hl.color } : {})}
                                        className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''} ${compareOn ? rcClass : (hl ? highlightMarkClass(hl.color) : '')} ${evid ? 'outline outline-2 outline-offset-1 outline-parchment-500' : linked ? 'outline outline-1 outline-offset-1 outline-brand-500' : ''}`}
                                      >
                                        {tok.surface}{ti < v.tokens!.length - 1 ? ' ' : ''}
                                      </span>
                                    )
                                  })}
                                </span>
                              )
                            })()
                          : <span {...verseAnchorProps(col.book, col.chapter, v.verse, version)}>
                              <TransWords text={v.text} lang={version} reference={`${col.bookName} ${v.ref}`} book={col.book}
                                hl={isAuthenticated ? { isAuthenticated, verseHighlights: highlights.forVerse(col.book, col.chapter, v.verse, version),
                                  create: (s, e, c) => void highlights.create(col.book, col.chapter, v.verse, s, e, c, version),
                                  recolor: (id, c) => void highlights.recolor(id, col.book, col.chapter, c),
                                  remove: id => void highlights.remove(id, col.book, col.chapter) } : undefined} />
                            </span>}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 italic">{t('reader.loading')}</p>
                )}
              </div>
            )
          })}

          {/* Add a comparison column */}
          <div className="w-60 shrink-0 rounded-xl border border-dashed border-gray-300 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">{t('syn.addPassage')}</p>
            <PassageAutocomplete
              value={addInput}
              onChange={v => { setAddInput(v); if (addError) setAddError(false) }}
              onCommit={v => addRef(v)}
              placeholder={t('syn.refPlaceholder')}
              error={addError}
              inputClassName="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button onClick={() => addRef()} className="mt-2 w-full rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">{t('syn.add')}</button>
            {addError && <p className="text-xs text-red-500 mt-1">{t('syn.parseError')}</p>}
          </div>
        </div>
      )}

      {/* Techniques key — the ancient editorial techniques (Theon / Quintilian / Licona)
          and how each maps to the compare-mode colors. */}
      {compareOn && showKey && isGreek && <RedactionKey />}

      {/* Parsing pane — the same shared component used on the Phrasing tab (Strong's,
          Thayer's, Mounce, Abbott-Smith, LSJ). Always visible for a Greek edition so its
          presence is obvious; defaults to the anchor's first word until one is hovered or
          clicked. Placed in normal flow directly under the columns (not sticky/overlaid),
          so the text ends cleanly above it instead of the pane floating over it. */}
      {isGreek && (
        <ResizableParsingPane storageKey="synopsis" info={selectedInfo ?? defaultParsingInfo} bgClass="bg-gray-50" growDown />
      )}

      {/* Rationale bubble — why the hovered word wears its colour, citing the source
          word and reference the aligner judged it against. */}
      {hoverTip && (
        <div className="fixed z-40 -translate-x-1/2 -translate-y-full pointer-events-none" style={{ left: hoverTip.x, top: hoverTip.y - 6 }}>
          <div className="max-w-[19rem] rounded-lg border border-gray-200 bg-popover px-2.5 py-1.5 shadow-lg">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{hoverTip.title}</p>
            <p className="text-xs leading-snug text-gray-700">{hoverTip.body}</p>
          </div>
        </div>
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
