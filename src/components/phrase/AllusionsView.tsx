'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, ChevronDown, ChevronRight, Sparkles, X } from 'lucide-react'
import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
import type { LexicalInfoPanel } from '@/types/lexicon'

// ── Allusions tab ───────────────────────────────────────────────────────────────────────
// Find and argue Old Testament allusions behind a New Testament passage, after Dale C.
// Allison's method (The New Moses, 1993). The student selects key words from the passage;
// the engine (src/lib/allusion-search.ts, /api/allusions) ranks LXX passages by shared
// vocabulary WEIGHTED BY RARITY, and flags verbatim runs (3+ passage words in the same
// order). The right column carries Allison's six devices as a working checklist: the app
// pre-fills what it can measure (devices 2, 4, 6); similar circumstances and narrative
// structure (3, 5) stay human judgments — deliberately. The final reveal compares the
// student's candidates with the Backgrounds cross-reference apparatus.

type NT = { osis: string; name: string; abbr: string[] }
const NT_BOOKS: NT[] = [
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
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '')
function matchBook(bp: string): NT | undefined {
  const b = norm(bp)
  return NT_BOOKS.find(x => norm(x.name) === b || x.osis.toLowerCase() === b || x.abbr.includes(b)
    || norm(x.name).startsWith(b) || x.osis.toLowerCase().startsWith(b))
}
function parseRef(ref: string): { osis: string; name: string; chapter: number; vStart: number; vEnd: number } | null {
  const q = ref.trim().replace(/[–—]/g, '-')
  const m = q.match(/^((?:\d\s*)?[A-Za-z][A-Za-z\s]*?)\s+(\d+)(?:\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!m) return null
  const book = matchBook(m[1]); if (!book) return null
  const chapter = parseInt(m[2], 10)
  const vStart = m[3] ? parseInt(m[3], 10) : 0
  const vEnd = m[4] ? parseInt(m[4], 10) : (m[3] ? vStart : 999)
  return { osis: book.osis, name: book.name, chapter, vStart, vEnd }
}

// Common OT abbreviations in the cross-reference apparatus → LXX osis ids, for the
// "compare with the apparatus" reveal.
const OT_ABBREV: Record<string, string> = {
  gen: 'Gen', exod: 'Exod', ex: 'Exod', lev: 'Lev', num: 'Num', deut: 'Deut', dt: 'Deut',
  josh: 'JoshB', judg: 'JudgB', ruth: 'Ruth', '1sam': '1Sam', '2sam': '2Sam',
  '1kgs': '1Kgs', '2kgs': '2Kgs', '1chr': '1Chr', '2chr': '2Chr', ezra: 'Ezra', neh: 'Neh',
  esth: 'EsthGr', job: 'Job', ps: 'Ps', pss: 'Ps', prov: 'Prov', eccl: 'Eccl', qoh: 'Eccl',
  song: 'Song', cant: 'Song', isa: 'Isa', jer: 'Jer', lam: 'Lam', ezek: 'Ezek', dan: 'DanLXX',
  hos: 'Hos', joel: 'Joel', amos: 'Amos', obad: 'Obad', jonah: 'Jonah', mic: 'Mic',
  nah: 'Nah', hab: 'Hab', zeph: 'Zeph', hag: 'Hag', zech: 'Zech', mal: 'Mal',
  wis: 'Wis', sir: 'Sir', tob: 'Tob', jdt: 'Jdt', bar: 'Bar', '1macc': '1Macc', '2macc': '2Macc',
}
function parseOtCitation(text: string): { osis: string; chapter: number } | null {
  // Apparatus rows sometimes carry an edition prefix ("LXX Isa 40:3", "MT Isa 40:3").
  const m = text.trim().replace(/^(?:LXX|MT|Heb\.?)\s+/i, '').match(/^((?:[1-4]\s*)?[A-Za-z]+)\.?\s+(\d+)/)
  if (!m) return null
  const key = m[1].toLowerCase().replace(/\s+/g, '').replace(/\.$/, '')
  const osis = OT_ABBREV[key]
  return osis ? { osis, chapter: parseInt(m[2], 10) } : null
}

// ── Data shapes (mirroring /api/allusions and the reader API) ──────────────────────────

interface WordTok { surface: string; strongs?: string; lemma: string; gloss?: string; parsing?: string }
interface Term { kind: 'word' | 'phrase'; strongs: string[]; forms: string[] }
interface Match { strongs: string; kind?: 'word' | 'phrase'; form: string; count: number; exactForm: boolean; verses: number }
interface Run { length: number; exactForms: number; text: string; strongs: string[] }
interface Hit { osis: string; chapter: number; vStart: number; vEnd: number; endChapter?: number; score: number; matches: Match[]; run?: Run }
interface LxxWord { surface: string; strongs?: string; lemma?: string; gloss?: string; parsing?: string }
interface CrossrefEntry { book: string; chapter: number; endChapter?: number; verseStart: number; verseEnd?: number; label: string; citations: { text: string; type: string }[] }

const RARE = 150   // LXX verse-count below which a shared word is treated as a strong signal

const foldGreek = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Module-level caches (survive tab switches; the Exegesis tabs stay mounted).
let bsbCache: Record<string, { text: string }> | null = null
let bsbInflight: Promise<void> | null = null
let lxxNamesCache: Record<string, string> | null = null
let crossrefsCache: CrossrefEntry[] | null = null
const brentonCache: Record<string, Record<string, string>> = {}   // osis → "Osis.ch.v" → English

const SOURCE_ATTR = 'Method: the allusion devices and criteria of Dale C. Allison, The New Moses (1993). '
  + 'Rankings weight shared vocabulary by its rarity in the Septuagint and flag words appearing in the same order; '
  + 'they SUGGEST candidates — they do not establish allusions. Septuagint text: Rahlfs; apparatus: Craig A. Evans, '
  + 'Ancient Texts for New Testament Studies, with additions.'

export function AllusionsView({ controlledPassage, onAttribution, onOpenInTexts }: {
  controlledPassage?: string
  onAttribution?: (a: string) => void
  onOpenInTexts?: (t: OpenInTextsTarget) => void
}) {
  const parsed = useMemo(() => parseRef(controlledPassage ?? ''), [controlledPassage])

  // Passage words (na1904 phrase tree), per verse of the open chapter.
  const [verses, setVerses] = useState<{ verse: number; words: WordTok[] }[]>([])
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ok' | 'missing'>('idle')
  const [showEnglish, setShowEnglish] = useState(true)
  const [, setBsbTick] = useState(0)

  // Selection: word keys `${verse}:${idx}`.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [freqs, setFreqs] = useState<Record<string, number>>({})
  // Adjacent selected words auto-group into a PHRASE; a group key in here is split back
  // into independent words instead.
  const [splitGroups, setSplitGroups] = useState<Set<string>>(new Set())
  // Frequencies per term key (strongs joined '+'): a phrase's is its SEQUENCE count.
  const [termFreqs, setTermFreqs] = useState<Record<string, number>>({})
  // Scope: search from the whole passage, or from one verse of it.
  const [scopeVerse, setScopeVerse] = useState<number | null>(null)

  // Results.
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchedFor, setSearchedFor] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [activeHit, setActiveHit] = useState<number | null>(null)
  const lxxChapters = useRef<Record<string, { verse: number; words: LxxWord[] }[]>>({})
  const [, setLxxTick] = useState(0)
  const [lxxNames, setLxxNames] = useState<Record<string, string>>(lxxNamesCache ?? {})

  // Allison checklist (working notes, session-only) + apparatus reveal.
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [showApparatus, setShowApparatus] = useState(false)
  const [apparatus, setApparatus] = useState<CrossrefEntry[] | null>(null)

  // Shared parsing pane, fed by hovering any Greek word (passage or LXX result).
  const [parseInfo, setParseInfo] = useState<LexicalInfoPanel | null>(null)

  useEffect(() => { onAttribution?.(SOURCE_ATTR) }, [onAttribution])

  // LXX book display names, once.
  useEffect(() => {
    if (lxxNamesCache) return
    fetch('/api/reader?corpus=LXX').then(r => r.json()).then((d: { books?: { osisId: string; name: string }[] }) => {
      lxxNamesCache = Object.fromEntries((d.books ?? []).map(b => [b.osisId, b.name]))
      setLxxNames(lxxNamesCache)
    }).catch(() => {})
  }, [])

  // BSB English (one static file, shared with the other tabs' pattern).
  useEffect(() => {
    if (bsbCache || !showEnglish) return
    bsbInflight ??= fetch('/data/bsb-alignment.json?v=3').then(r => r.json())
      .then(d => { bsbCache = d }).catch(() => { bsbCache = {} })
    bsbInflight.then(() => setBsbTick(t => t + 1))
  }, [showEnglish])

  // Load the passage words from the phrase tree; reset the working state on passage change.
  useEffect(() => {
    setSelected(new Set()); setHits(null); setActiveHit(null); setExpanded(new Set())
    setChecks({}); setShowApparatus(false); setSearchedFor([])
    setSplitGroups(new Set()); setScopeVerse(null)
    if (!parsed) { setVerses([]); setLoadState(controlledPassage?.trim() ? 'missing' : 'idle'); return }
    setLoadState('loading')
    let alive = true
    type Node = { t: string; id?: string; w?: string; lemma?: string; gloss?: string; strongs?: string; parsing?: string; c?: Node[] }
    fetch(`/data/phrase-tree/${parsed.osis}.json`).then(r => r.json()).then((d: { sentences?: { tree: Node }[] }) => {
      if (!alive) return
      const byVerse: Record<number, { i: number; tok: WordTok }[]> = {}
      const walk = (n: Node) => {
        if (n.t === 'w' && n.id) {
          const [, ch, vs, wd] = n.id.split('.')
          if (parseInt(ch, 10) === parsed.chapter) {
            (byVerse[parseInt(vs, 10)] ??= []).push({ i: parseInt(wd || '0', 10),
              tok: { surface: n.w ?? '', strongs: n.strongs, lemma: n.lemma ?? '', gloss: n.gloss, parsing: n.parsing } })
          }
        } else (n.c ?? []).forEach(walk)
      }
      for (const s of d.sentences ?? []) walk(s.tree)
      const out = Object.entries(byVerse)
        .map(([v, ws]) => ({ verse: parseInt(v, 10), words: ws.sort((a, b) => a.i - b.i).map(x => x.tok) }))
        .sort((a, b) => a.verse - b.verse)
      setVerses(out)
      setLoadState(out.length ? 'ok' : 'missing')
    }).catch(() => { if (alive) setLoadState('missing') })
    return () => { alive = false }
  }, [parsed, controlledPassage])

  // The verses of the committed passage — and, inside those, the current search scope
  // (all of them, or one verse to narrow the hunt).
  const passageVerses = useMemo(() => {
    if (!parsed) return verses
    if (parsed.vStart === 0) return verses
    return verses.filter(v => v.verse >= parsed.vStart && v.verse <= parsed.vEnd)
  }, [verses, parsed])
  const shownVerses = useMemo(
    () => (scopeVerse == null ? passageVerses : passageVerses.filter(v => v.verse === scopeVerse)),
    [passageVerses, scopeVerse])

  // Narrowing the scope drops any selected words that fell outside it.
  function setScope(v: number | null) {
    setScopeVerse(v)
    if (v != null) setSelected(prev => new Set(Array.from(prev).filter(k => k.startsWith(`${v}:`))))
  }

  // Rarity badges: fetch LXX verse-frequencies for every word of the shown passage.
  useEffect(() => {
    const all = Array.from(new Set(shownVerses.flatMap(v => v.words.map(w => w.strongs)).filter((s): s is string => !!s)))
    if (all.length === 0) return
    fetch('/api/allusions', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'freq', strongs: all }) })
      .then(r => r.json()).then((d: { counts?: Record<string, number> }) => { if (d.counts) setFreqs(f => ({ ...f, ...d.counts })) })
      .catch(() => {})
  }, [shownVerses])

  // The selection resolved into GROUPS: consecutive selected words in one verse form a
  // group; a group of 2+ is a phrase candidate (unless the student split it). This is how
  // "combination of the two" works — select ἐν + ἀρχῇ side by side and it becomes one
  // phrase chip; select φῶς elsewhere and it stays a word chip.
  interface SelGroup { key: string; verse: number; words: { key: string; tok: WordTok }[]; isPhrase: boolean }
  const selectedGroups = useMemo(() => {
    const groups: SelGroup[] = []
    for (const v of shownVerses) {
      let cur: { key: string; tok: WordTok }[] = []
      const flush = () => {
        if (cur.length === 0) return
        const key = `${v.verse}:${cur[0].key.split(':')[1]}-${cur[cur.length - 1].key.split(':')[1]}`
        groups.push({ key, verse: v.verse, words: cur, isPhrase: cur.length >= 2 && !splitGroups.has(key) })
        cur = []
      }
      v.words.forEach((tok, i) => {
        const key = `${v.verse}:${i}`
        if (selected.has(key) && tok.strongs) cur.push({ key, tok })
        else flush()
      })
      flush()
    }
    return groups
  }, [shownVerses, selected, splitGroups])

  // Groups → search terms: phrases as sequences, everything else as single words
  // (duplicate words merged, their inflected forms pooled).
  const terms = useMemo(() => {
    const out: Term[] = []
    const wordAt = new Map<string, Term>()
    const addWord = (tok: WordTok) => {
      const ex = wordAt.get(tok.strongs!)
      if (ex) { if (!ex.forms.includes(tok.surface)) ex.forms.push(tok.surface) }
      else { const t: Term = { kind: 'word', strongs: [tok.strongs!], forms: [tok.surface] }; wordAt.set(tok.strongs!, t); out.push(t) }
    }
    for (const g of selectedGroups) {
      if (g.isPhrase) out.push({ kind: 'phrase', strongs: g.words.map(w => w.tok.strongs!), forms: g.words.map(w => w.tok.surface) })
      else g.words.forEach(w => addWord(w.tok))
    }
    return out
  }, [selectedGroups])

  const termKey = (t: Term) => t.strongs.join('+')

  // Phrase-sequence frequencies for the chips (words reuse the passage-wide freq map).
  useEffect(() => {
    const missing = terms.filter(t => t.kind === 'phrase' && termFreqs[termKey(t)] == null)
    if (missing.length === 0) return
    const timer = setTimeout(() => {
      fetch('/api/allusions', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'termfreq', terms: missing }) })
        .then(r => r.json()).then((d: { counts?: Record<string, number> }) => { if (d.counts) setTermFreqs(f => ({ ...f, ...d.counts })) })
        .catch(() => {})
    }, 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terms])

  function toggleWord(verse: number, idx: number, tok: WordTok) {
    if (!tok.strongs) return
    const key = `${verse}:${idx}`
    setSelected(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n })
  }

  // Auto-suggest: the five rarest words present in the LXX at all (a word the LXX never
  // uses cannot match). Selects each word's first occurrence.
  function suggest() {
    const seen = new Map<string, { verse: number; idx: number }>()
    for (const v of shownVerses) v.words.forEach((tok, i) => {
      if (tok.strongs && !seen.has(tok.strongs)) seen.set(tok.strongs, { verse: v.verse, idx: i })
    })
    const ranked = Array.from(seen.entries())
      .map(([s, pos]) => ({ s, pos, n: freqs[s] ?? Infinity }))
      .filter(x => x.n > 0 && Number.isFinite(x.n))
      .sort((a, b) => a.n - b.n)
      .slice(0, 5)
    setSelected(new Set(ranked.map(x => `${x.pos.verse}:${x.pos.idx}`)))
  }

  async function runSearch() {
    if (terms.length === 0 || searching) return
    setSearching(true)
    try {
      // Run detection reads the scoped verses only — narrowing to one verse narrows both.
      const sourceTokens = shownVerses.flatMap(v => v.words.filter(w => w.strongs).map(w => ({ s: w.strongs!, f: w.surface })))
      const r = await fetch('/api/allusions', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', terms, sourceTokens }) })
      const d = await r.json()
      setHits(Array.isArray(d.hits) ? d.hits : [])
      setSearchedFor(terms.map(t => t.kind === 'phrase' ? `“${t.forms.join(' ')}”` : t.forms[0]))
      setExpanded(new Set()); setActiveHit(null)
    } catch {
      setHits([])
    } finally {
      setSearching(false)
    }
  }

  function loadLxxChapter(osis: string, chapter: number) {
    const ck = `${osis}.${chapter}`
    if (!lxxChapters.current[ck]) {
      lxxChapters.current[ck] = []
      type RWord = { surface: string; lexeme?: { lexeme?: string; strongs?: string; gloss?: string }; parses?: Record<string, string | null>[] }
      const MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
      fetch(`/api/reader?book=${osis}&chapter=${chapter}&corpus=LXX`).then(r => r.json())
        .then((d: { verses?: { verse: number; words?: RWord[] }[] }) => {
          lxxChapters.current[ck] = (d.verses ?? []).map(v => ({
            verse: v.verse,
            words: (v.words ?? []).map(w => ({
              surface: w.surface, strongs: w.lexeme?.strongs?.replace(/^G/, ''),
              lemma: w.lexeme?.lexeme, gloss: w.lexeme?.gloss,
              parsing: w.parses?.[0] ? MORPH_ORDER.map(k => w.parses![0][k]).filter(Boolean).join(', ') : '',
            })),
          }))
          setLxxTick(t => t + 1)
        }).catch(() => { delete lxxChapters.current[ck]; setLxxTick(t => t + 1) })
    }
    // Brenton's English for the right column, per book.
    if (!brentonCache[osis]) {
      fetch(`/data/brenton/${osis}.json`).then(r => (r.ok ? r.json() : {}))
        .then(d => { brentonCache[osis] = d; setLxxTick(t => t + 1) })
        .catch(() => { brentonCache[osis] = {} })
    }
  }

  function toggleExpand(i: number, h: Hit) {
    setExpanded(prev => {
      const n = new Set(prev)
      if (n.has(i)) n.delete(i)
      else {
        n.add(i)
        loadLxxChapter(h.osis, h.chapter)
        if (h.endChapter) loadLxxChapter(h.osis, h.endChapter)
      }
      return n
    })
    setActiveHit(i)
  }

  // Apparatus entries covering the shown passage, OT citations only.
  const apparatusRows = useMemo(() => {
    if (!apparatus || !parsed) return []
    const vLo = parsed.vStart === 0 ? 1 : parsed.vStart
    const vHi = parsed.vStart === 0 ? 999 : parsed.vEnd
    const rows: { label: string; text: string; found: boolean }[] = []
    for (const e of apparatus) {
      if (e.book !== parsed.osis) continue
      const c0 = e.chapter, c1 = e.endChapter ?? e.chapter
      if (!(c0 <= parsed.chapter && parsed.chapter <= c1)) continue
      if (c0 === c1 && (e.verseStart > vHi || (e.verseEnd ?? e.verseStart) < vLo)) continue
      for (const c of e.citations) {
        if (c.type !== 'OT' && c.type !== 'LXX') continue
        const ref = parseOtCitation(c.text)
        const found = !!ref && (hits ?? []).some(h => h.osis === ref.osis && (h.chapter === ref.chapter || h.endChapter === ref.chapter))
        rows.push({ label: e.label, text: c.text, found })
      }
    }
    return rows
  }, [apparatus, parsed, hits])

  function revealApparatus() {
    setShowApparatus(true)
    if (crossrefsCache) { setApparatus(crossrefsCache); return }
    fetch('/data/backgrounds-crossrefs.json').then(r => r.json())
      .then((d: { entries?: CrossrefEntry[] }) => { crossrefsCache = d.entries ?? []; setApparatus(crossrefsCache) })
      .catch(() => setApparatus([]))
  }

  const active = activeHit != null && hits ? hits[activeHit] : null
  const rareMatched = active ? active.matches.filter(m => m.verses > 0 && m.verses < RARE).length : 0
  const nearVerbatim = !!active?.run && active.run.length >= 4 && active.run.exactForms / active.run.length >= 0.7
  // A matched phrase is sequence evidence in its own right (Allison's device 6).
  const phraseMatched = active ? active.matches.filter(m => m.kind === 'phrase') : []
  const topScore = hits?.[0]?.score ?? 1

  const refLabel = (h: Hit) => {
    const name = lxxNames[h.osis] ?? h.osis
    return h.endChapter
      ? `${name} ${h.chapter}:${h.vStart}–${h.endChapter}:${h.vEnd}`
      : `${name} ${h.chapter}:${h.vStart}${h.vEnd !== h.vStart ? `–${h.vEnd}` : ''}`
  }

  // Before any word is hovered, the pane shows the passage's first word.
  const defaultParseInfo: LexicalInfoPanel | null = (() => {
    const fv = shownVerses.find(v => v.words.length > 0)
    const ft = fv?.words[0]
    return ft && parsed ? {
      surface: ft.surface, lexeme: ft.lemma, gloss: ft.gloss ?? '', partOfSpeech: '',
      parsing: ft.parsing ?? '', strongs: ft.strongs, reference: `${parsed.name} ${parsed.chapter}:${fv!.verse}`,
    } : null
  })()

  if (loadState === 'idle') return <p className="text-gray-400 text-sm mt-6 text-center">Enter a New Testament passage to hunt for its Old Testament allusions.</p>
  if (loadState === 'missing') return <p className="text-gray-500 text-sm mt-6 text-center">Allusion search works from a <b>New Testament</b> passage. Try e.g. <span className="font-medium">Mark 1:1-8</span>.</p>
  if (loadState === 'loading') return <p className="text-gray-400 text-sm mt-6 text-center">Loading…</p>

  return (
    <div className="h-full flex flex-col min-h-0">
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 pb-16 lg:flex lg:gap-6">
        {/* ── Main column ── */}
        <div className="flex-1 min-w-0">
          {/* Passage: tap words to select them */}
          <div className="mt-4 rounded-xl border border-gray-200 bg-surface px-4 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                {parsed!.name} {parsed!.chapter}{parsed!.vStart ? `:${parsed!.vStart}${parsed!.vEnd !== parsed!.vStart ? `–${parsed!.vEnd}` : ''}` : ''} — tap the words that feel loaded
              </p>
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input type="checkbox" checked={showEnglish} onChange={e => setShowEnglish(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                English
              </label>
            </div>

            {/* Search scope: the whole passage, or one verse of it. */}
            {passageVerses.length > 1 && (
              <div className="mb-2.5 flex flex-wrap items-center gap-1">
                <span className="text-[11px] text-gray-400 mr-1">Search from:</span>
                <button type="button" onClick={() => setScope(null)}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${scopeVerse == null ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-brand-50'}`}>
                  All verses
                </button>
                {passageVerses.map(v => (
                  <button key={v.verse} type="button" onClick={() => setScope(v.verse)}
                    className={`rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ${scopeVerse === v.verse ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-brand-50'}`}>
                    v.{v.verse}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2.5">
              {shownVerses.map(v => (
                <div key={v.verse}>
                  <p className="font-reading leading-relaxed" style={{ fontSize: '1.35rem' }}>
                    <sup className="text-[11px] text-gray-400 mr-1">{v.verse}</sup>
                    {v.words.map((w, i) => {
                      const key = `${v.verse}:${i}`
                      const sel = selected.has(key)
                      const n = w.strongs ? freqs[w.strongs] : undefined
                      const rare = n != null && n > 0 && n < RARE
                      return (
                        <span key={i}>
                          <button
                            type="button"
                            onClick={() => toggleWord(v.verse, i, w)}
                            onMouseEnter={() => setParseInfo({ surface: w.surface, lexeme: w.lemma, gloss: w.gloss ?? '', partOfSpeech: '', parsing: w.parsing ?? '', strongs: w.strongs, reference: `${parsed!.name} ${parsed!.chapter}:${v.verse}` })}
                            title={w.gloss ? `${w.gloss}${n != null ? ` — in ${n} LXX verses` : ''}` : undefined}
                            className={`rounded px-0.5 transition-colors ${
                              sel ? 'bg-brand-600 text-white'
                                : w.strongs ? `hover:bg-brand-100 ${rare ? 'underline decoration-dotted decoration-brand-400 underline-offset-4' : ''}`
                                : 'cursor-default'}`}
                          >{w.surface}</button>
                          {' '}
                        </span>
                      )
                    })}
                  </p>
                  {showEnglish && bsbCache && (
                    <p className="mt-0.5 ml-4 text-sm text-gray-500">
                      {bsbCache[`${parsed!.osis}.${parsed!.chapter}.${v.verse}`]?.text ?? ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-xs text-gray-400">
              Dotted words are <b>rare in the LXX</b> — sharing one is worth far more than sharing a common word.
              Tap <b>adjacent</b> words and they become a phrase, searched as a sequence
              (&ldquo;ἐν ἀρχῇ&rdquo; is two common words but a rare pairing). Hover a word for its gloss.
            </p>
          </div>

          {/* Selection chips + actions. A chip is a GROUP: a phrase (adjacent words, searched
              as a sequence, badge = how often that sequence occurs in the LXX) or one word. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selectedGroups.map(g => {
              if (g.isPhrase) {
                const key = g.words.map(w => w.tok.strongs).join('+')
                const n = termFreqs[key]
                const rare = n != null && n < RARE
                return (
                  <span key={g.key} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm ${
                    rare ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-blue-200 bg-blue-50/50 text-blue-800'}`}>
                    <span className="font-reading">“{g.words.map(w => w.tok.surface).join(' ')}”</span>
                    <span className={`text-[10px] ${rare ? 'text-blue-700 font-semibold' : 'text-blue-400'}`}>
                      {n == null ? 'phrase' : n === 0 ? 'sequence not in LXX' : `sequence ×${n}`}
                    </span>
                    <button type="button" title="Search these as separate words instead"
                      onClick={() => setSplitGroups(prev => new Set(prev).add(g.key))}
                      className="text-[10px] font-medium text-blue-400 hover:text-blue-700">split</button>
                    <button type="button" onClick={() => setSelected(prev => { const s = new Set(prev); g.words.forEach(w => s.delete(w.key)); return s })}
                      className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                  </span>
                )
              }
              return g.words.map(({ key, tok }) => {
                const n = tok.strongs ? freqs[tok.strongs] : undefined
                const rare = n != null && n > 0 && n < RARE
                return (
                  <span key={key} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm ${
                    rare ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                    <span className="font-reading">{tok.surface}</span>
                    {n != null && <span className={`text-[10px] ${rare ? 'text-brand-600 font-semibold' : 'text-gray-400'}`}>
                      {n === 0 ? 'not in LXX' : `×${n}`}
                    </span>}
                    {g.words.length >= 2 && (
                      <button type="button" title="Rejoin into a phrase"
                        onClick={() => setSplitGroups(prev => { const s = new Set(prev); s.delete(g.key); return s })}
                        className="text-[10px] font-medium text-gray-400 hover:text-brand-700">join</button>
                    )}
                    <button type="button" onClick={() => setSelected(prev => { const s = new Set(prev); s.delete(key); return s })}
                      className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                  </span>
                )
              })
            })}
            <button type="button" onClick={suggest}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-surface px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-brand-300 hover:text-brand-700">
              <Sparkles size={13} /> Suggest the rarest words
            </button>
            <button type="button" disabled={terms.length === 0 || searching} onClick={runSearch}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              <Search size={13} /> {searching ? 'Searching…' : 'Search the Septuagint'}
            </button>
          </div>

          {/* Results */}
          {hits && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                {hits.length === 0 ? 'No LXX passage shares two of those words closely.' :
                  <>Candidates, strongest first — searched for <span className="font-reading normal-case">{searchedFor.join(', ')}</span></>}
              </p>
              <div className="space-y-2">
                {hits.map((h, i) => {
                  const open = expanded.has(i)
                  const isNearVerbatim = !!h.run && h.run.length >= 4 && h.run.exactForms / h.run.length >= 0.7
                  return (
                    <div key={i} className={`rounded-xl border bg-surface transition-shadow ${activeHit === i ? 'border-brand-400 ring-1 ring-brand-200' : 'border-gray-200'}`}>
                      <button type="button" onClick={() => toggleExpand(i, h)} className="w-full px-3.5 py-2.5 text-left">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {open ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
                          <span className="text-sm font-semibold text-gray-900">{refLabel(h)}</span>
                          <span className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden">
                            <span className="block h-full bg-brand-500" style={{ width: `${Math.max(6, Math.round(100 * h.score / topScore))}%` }} />
                          </span>
                          {h.run && (
                            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                              isNearVerbatim ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>
                              {isNearVerbatim ? `near-verbatim — ${h.run.length} words in order` : `${h.run.length} words in the same order`}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 ml-6 flex flex-wrap gap-1.5">
                          {h.matches.map(m => (
                            <span key={m.strongs}
                              title={m.kind === 'phrase' ? `this sequence occurs ${m.verses}× in the LXX` : `in ${m.verses} LXX verses`}
                              className={`rounded px-1.5 py-0.5 text-xs font-reading ${
                                m.kind === 'phrase' ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : m.verses < RARE ? 'bg-brand-50 text-brand-800 border border-brand-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                              {m.kind === 'phrase' ? `“${m.form}”` : m.form}{m.count > 1 ? ` ×${m.count}` : ''}{m.exactForm ? ' ✓' : ''}
                            </span>
                          ))}
                          {h.run && <span className="text-xs text-gray-400 font-reading">“{h.run.text}”</span>}
                        </div>
                      </button>
                      {open && (
                        <ExpandedHit
                          hit={h}
                          label={refLabel(h)}
                          chapters={lxxChapters.current}
                          onOpenInTexts={onOpenInTexts}
                          onHoverWord={setParseInfo}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Apparatus reveal */}
              {hits.length > 0 && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
                  {!showApparatus ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-amber-900">
                        Formed your view? Compare your candidates with the scholarly cross-reference apparatus.
                      </p>
                      <button type="button" onClick={revealApparatus}
                        className="rounded-lg border border-amber-300 bg-surface px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100">
                        Compare with the apparatus
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-1.5">The apparatus on this passage</p>
                      {apparatus === null ? <p className="text-sm text-amber-800">Loading…</p>
                        : apparatusRows.length === 0 ? (
                          <p className="text-sm text-amber-900">No OT cross-references are catalogued for this passage — if your search surfaced a strong candidate, you may be looking at something the apparatus missed. Argue it with Allison&rsquo;s criteria.</p>
                        ) : (
                          <>
                            <ul className="space-y-1">
                              {apparatusRows.map((r, i) => (
                                <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                                  <span className={`text-xs font-medium ${r.found ? 'text-green-700' : 'text-gray-400'}`}>{r.found ? '✓ you found it' : '— not in your list'}</span>
                                  <span className="text-gray-800">{r.text}</span>
                                  <span className="text-xs text-gray-400">({r.label})</span>
                                </li>
                              ))}
                            </ul>
                            <p className="mt-2 text-xs text-amber-800">
                              A candidate of yours that the apparatus lacks is not automatically wrong — and an apparatus entry is not automatically an allusion. Both need the argument.
                            </p>
                          </>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right column: build the case ── */}
        <aside className="lg:w-[330px] lg:shrink-0 mt-4">
          <div className="rounded-xl border border-gray-200 bg-surface px-4 py-3.5 lg:sticky lg:top-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1">Build the case — Allison&rsquo;s tests</p>
            <p className="text-xs text-gray-500 mb-3">
              {active ? <>Assessing <b>{refLabel(active)}</b>. The app fills what it can measure; the rest is your judgment. Notes aren&rsquo;t saved.</>
                : 'Select a candidate on the left to assess it. The app fills what it can measure; the rest is your judgment.'}
            </p>
            <ul className="space-y-2.5 text-sm">
              <ChecklistRow label="1 · Explicit statement" auto={null} manual={checks['d1']} onManual={v => setChecks(c => ({ ...c, d1: v }))}
                hint="Does the author name the source or the figure (“as Moses…”)?" />
              <ChecklistRow label="2 · Implicit citation" hint="Words transplanted without acknowledgement."
                auto={active ? (nearVerbatim ? 'yes' : active.run ? 'partial' : 'no') : null}
                autoNote={active?.run ? `run of ${active.run.length}, ${active.run.exactForms} in the same inflected form` : 'no shared word-run found'} />
              <ChecklistRow label="3 · Similar circumstances" auto={null} manual={checks['d3']} onManual={v => setChecks(c => ({ ...c, d3: v }))}
                hint="Is the event circumstantially like the proposed subtext? Only you can judge this." />
              <ChecklistRow label="4 · Key words or phrases" hint="Shared vocabulary — weighted by rarity."
                auto={active ? (rareMatched >= 2 ? 'yes' : rareMatched === 1 ? 'partial' : 'no') : null}
                autoNote={active ? `${rareMatched} shared ${rareMatched === 1 ? 'word is' : 'words are'} rare in the LXX (under ${RARE} verses)` : undefined} />
              <ChecklistRow label="5 · Narrative structure" auto={null} manual={checks['d5']} onManual={v => setChecks(c => ({ ...c, d5: v }))}
                hint="Does the shape of the story itself follow the subtext? Only you can judge this." />
              <ChecklistRow label="6 · Word order & rhythm" hint="Imitative sequence."
                auto={active ? ((active.run && active.run.length >= 3) || phraseMatched.length > 0 ? 'yes' : 'no') : null}
                autoNote={active
                  ? [phraseMatched.length > 0 ? `matched the phrase ${phraseMatched.map(m => `“${m.form}”`).join(', ')}` : '',
                     active.run ? `${active.run.length} words appear in the same order` : '']
                      .filter(Boolean).join('; ') || undefined
                  : undefined} />
            </ul>
            <details className="mt-3">
              <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-xs font-medium text-brand-600 hover:text-brand-700">
                Allison&rsquo;s guidelines for weighing a case
              </summary>
              <ul className="mt-2 space-y-1.5 text-xs text-gray-600 list-disc pl-4">
                <li>The subtext must be <b>earlier</b> than the alluding text.</li>
                <li>The case strengthens if the proposed source book demonstrably <b>mattered to the author</b> elsewhere.</li>
                <li>Without explicit citation or clear borrowing, a typology needs <b>several</b> of devices 3–6 together.</li>
                <li>The type should be <b>prominent</b> — a famous figure or scene, not an obscurity.</li>
                <li>Confidence grows when other ancient writers made the <b>same typological use</b> of the material.</li>
                <li><b>Unusual imagery</b> shared between the texts counts for far more than commonplaces.</li>
              </ul>
            </details>
            <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
              Devices 1–2 are readily perceived; 3–6 are indistinct and can occur by chance. A high score here is a
              candidate, not a conclusion.
            </p>
          </div>
        </aside>
      </div>
    </div>

    {/* Greek parsing pane at the bottom — the shared component (Strong's → Thayer's / Mounce /
        Abbott-Smith / LSJ), fed by hovering any Greek word above (passage or LXX result). */}
    <ResizableParsingPane storageKey="allusions" info={parseInfo ?? defaultParseInfo} bgClass="bg-gray-50" />
    </div>
  )
}

// One row of the Allison checklist: auto-assessed (yes/partial/no), or a manual checkbox.
function ChecklistRow({ label, hint, auto, autoNote, manual, onManual }: {
  label: string
  hint: string
  auto: 'yes' | 'partial' | 'no' | null
  autoNote?: string
  manual?: boolean
  onManual?: (v: boolean) => void
}) {
  return (
    <li>
      <div className="flex items-start gap-2">
        {onManual ? (
          <input type="checkbox" checked={manual ?? false} onChange={e => onManual(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
        ) : (
          <span className={`mt-0.5 inline-block h-3.5 w-3.5 rounded-full text-[9px] leading-[14px] text-center font-bold ${
            auto === 'yes' ? 'bg-green-500 text-white' : auto === 'partial' ? 'bg-amber-400 text-white' : auto === 'no' ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-300'}`}>
            {auto === 'yes' ? '✓' : auto === 'partial' ? '~' : auto === 'no' ? '–' : ''}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-medium text-gray-800 leading-tight">{label}</p>
          <p className="text-xs text-gray-500">{hint}</p>
          {auto && autoNote && <p className="text-xs text-gray-600 mt-0.5 italic">{autoNote}</p>}
        </div>
      </div>
    </li>
  )
}

// The expanded LXX text of a hit: two columns — Greek (matched words in red) with
// Brenton's English to the right, verse by verse. Hovering a Greek word fills the
// shared parsing pane.
function ExpandedHit({ hit, label, chapters, onOpenInTexts, onHoverWord }: {
  hit: Hit
  label: string
  chapters: Record<string, { verse: number; words: LxxWord[] }[]>
  onOpenInTexts?: (t: OpenInTextsTarget) => void
  onHoverWord: (info: LexicalInfoPanel) => void
}) {
  // A phrase match's key is its members joined '+': split so each member word highlights.
  const matchSet = new Set(hit.matches.flatMap(m => m.strongs.split('+')))
  const segments: { chapter: number; vLo: number; vHi: number }[] = hit.endChapter
    ? [{ chapter: hit.chapter, vLo: hit.vStart, vHi: 999 }, { chapter: hit.endChapter, vLo: 1, vHi: hit.vEnd }]
    : [{ chapter: hit.chapter, vLo: hit.vStart, vHi: hit.vEnd }]
  const anyLoaded = segments.some(s => (chapters[`${hit.osis}.${s.chapter}`] ?? []).length > 0)
  const english = brentonCache[hit.osis] ?? {}
  return (
    <div className="border-t border-gray-100 px-3.5 py-3">
      {!anyLoaded && <p className="text-sm text-gray-400">Loading the Greek…</p>}
      {segments.map(seg => {
        const vv = (chapters[`${hit.osis}.${seg.chapter}`] ?? []).filter(v => v.verse >= seg.vLo && v.verse <= seg.vHi)
        return vv.map(v => (
          <div key={`${seg.chapter}.${v.verse}`} className="mb-2 md:grid md:grid-cols-2 md:gap-x-5">
            <p className="font-reading leading-relaxed" style={{ fontSize: '1.25rem' }}>
              <sup className="text-[11px] text-gray-400 mr-1">{seg.chapter}:{v.verse}</sup>
              {v.words.map((w, i) => (
                <span key={i}>
                  <span
                    onMouseEnter={() => onHoverWord({ surface: w.surface, lexeme: w.lemma ?? '', gloss: w.gloss ?? '', partOfSpeech: '', parsing: w.parsing ?? '', strongs: w.strongs, reference: `${label.split(' ').slice(0, -1).join(' ')} ${seg.chapter}:${v.verse}` })}
                    className={`cursor-default ${w.strongs && matchSet.has(w.strongs) ? 'text-red-600 font-semibold' : ''}`}
                  >{w.surface}</span>{' '}
                </span>
              ))}
            </p>
            <p className="mt-0.5 md:mt-1 text-sm leading-relaxed text-gray-600">
              {english[`${hit.osis}.${seg.chapter}.${v.verse}`] ?? ''}
            </p>
          </div>
        ))
      })}
      {onOpenInTexts && (
        <button type="button"
          onClick={() => onOpenInTexts({ source: 'lxx', osisId: hit.osis, chapter: hit.chapter, verse: hit.vStart })}
          className="mt-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline">
          Open in Texts →
        </button>
      )}
    </div>
  )
}
