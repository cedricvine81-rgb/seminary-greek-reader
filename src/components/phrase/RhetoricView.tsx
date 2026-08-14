'use client'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { DEVICES, GROUP_LABEL, GROUP_COLOR, GROUP_DESC, GROUP_ORDER, type Device, type DeviceGroup, type Occurrence } from '@/lib/rhetoric-devices'
import { X } from 'lucide-react'
import { useTc } from '@/lib/i18n/ContentProvider'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { content, type ContentCatalogue } from '@/lib/i18n/content'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
import { openWordSearch } from '@/lib/word-search-bus'
import { TransWords } from '@/components/highlights/TransWords'
import { useHighlights } from '@/components/highlights/useHighlights'
import { useHighlightSelection } from '@/components/highlights/useHighlightSelection'
import { HighlightPopup } from '@/components/highlights/HighlightPopup'
import { verseAnchorProps, withTokenOffsets, highlightAt } from '@/components/highlights/render'
import { highlightMarkClass } from '@/lib/highlight-colors'
import { HEBREW_LAYER } from '@/components/reader/HebrewVerse'
import { MT_OSIS, MT_BOOK_LIST } from '@/lib/mt-books'
import { translatable, greekText, hebrewText, segmentOriginalScripts } from '@/lib/i18n/machine-translation'
import { formatHebrewParse } from '@/lib/hebrew-morph'
import { loadHebrewLexicon, hebrewizeInfo, type HebrewLexicon } from '@/lib/hebrew-lexicon'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import type { LexicalInfoPanel } from '@/types/lexicon'

// ── Rhetoric tab ────────────────────────────────────────────────────────────────────────
// Three columns, like Backgrounds: the passage (left), the rhetorical device(s) present in
// each verse (middle, colour-coded by Bullinger-style group), and an explanation of the
// selected device (right) — with Bengel's Gnomon note on that verse underneath.

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
// The Hebrew Bible, in the same shape — an OT anchor gets Bullinger's OT figure data, the
// WLC in the passage column; the verse-note card is Bengel, and so New Testament only.
const OT_BOOKS: NT[] = MT_BOOK_LIST.map(b => ({ osis: b.osis, name: b.name, abbr: b.abbr }))
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '')
function matchBook(bp: string): NT | undefined {
  const b = norm(bp)
  // NT first: its exact/abbreviation matches must win before any OT prefix match does
  // ("Jn" is John, not Jonah; "Php" is Philippians, not Psalms).
  const find = (list: NT[]) => list.find(x => norm(x.name) === b || x.osis.toLowerCase() === b || x.abbr.includes(b))
  const prefix = (list: NT[]) => list.find(x => norm(x.name).startsWith(b) || x.osis.toLowerCase().startsWith(b))
  return find(NT_BOOKS) ?? find(OT_BOOKS) ?? prefix(NT_BOOKS) ?? prefix(OT_BOOKS)
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

// Bengel notes, fetched once and shared.
let bengelCache: Record<string, string> | null = null
let bengelInflight: Promise<Record<string, string>> | null = null
function loadBengel(): Promise<Record<string, string>> {
  if (bengelCache) return Promise.resolve(bengelCache)
  if (!bengelInflight) bengelInflight = fetch('/data/rhetoric/bengel.json').then(r => r.json())
    .then(d => (bengelCache = d)).catch(() => ({}))
  return bengelInflight
}

// Per-book Bullinger datasets (public/data/rhetoric/devices/<Osis>.json), fetched once each.
// These carry the comprehensive, book-by-book figure→verse data; the curated NT-wide DEVICES
// stay as the base layer, and the book file adds/enriches occurrences for that book.
const bookCache: Record<string, Device[]> = {}
const bookInflight: Record<string, Promise<Device[]>> = {}
function loadBookDevices(osis: string): Promise<Device[]> {
  if (bookCache[osis]) return Promise.resolve(bookCache[osis])
  if (!bookInflight[osis]) bookInflight[osis] = fetch(`/data/rhetoric/devices/${osis}.json`)
    .then(r => (r.ok ? r.json() : { devices: [] }))
    .then((d: { devices?: Device[] }) => (bookCache[osis] = d.devices ?? []))
    .catch(() => (bookCache[osis] = []))
  return bookInflight[osis]
}

// Translations of Bullinger's occurrence notes, fetched per book exactly as the notes themselves
// are (public/data/rhetoric/notes-<loc>/<Osis>.json, generated by scripts/i18n-content.ts).
//
// These do NOT travel in the page's content catalogue with the rest of the Rhetoric strings.
// There are 2,023 of them and some 46,000 words; putting them in the payload would make every
// /exegesis load in Spanish carry the notes on all 27 books to show the ones on one chapter.
// Fetched here, a reader in Matthew pays for Matthew. English fetches nothing at all.
const noteCache: Record<string, ContentCatalogue> = {}
const noteInflight: Record<string, Promise<ContentCatalogue>> = {}
function loadBookNotes(locale: string, osis: string): Promise<ContentCatalogue> {
  const k = `${locale}.${osis}`
  if (noteCache[k]) return Promise.resolve(noteCache[k])
  if (!noteInflight[k]) noteInflight[k] = fetch(`/data/rhetoric/notes-${locale}/${osis}.json`)
    .then(r => (r.ok ? r.json() : {}))
    .then((d: ContentCatalogue) => (noteCache[k] = d))
    .catch(() => (noteCache[k] = {}))
  return noteInflight[k]
}

// Merge the book file into the curated base: same id → union occurrences (keep the curated
// note, fill it from Bullinger only when missing); new ids are appended.
function mergeDevices(base: Device[], extra: Device[]): Device[] {
  const byId = new Map<string, Device>()
  for (const d of base) byId.set(d.id, { ...d, occurrences: d.occurrences.map(o => ({ ...o })) })
  for (const d of extra) {
    const cur = byId.get(d.id)
    if (!cur) { byId.set(d.id, { ...d, occurrences: d.occurrences.map(o => ({ ...o })) }); continue }
    const seen = new Map(cur.occurrences.map(o => [o.ref, o] as const))
    for (const o of d.occurrences) {
      const ex = seen.get(o.ref)
      if (!ex) { const c = { ...o }; cur.occurrences.push(c); seen.set(o.ref, c) }
      else {
        // the book (Bullinger) covers this verse too, so it isn't editorial-only any more
        if (ex.source) delete ex.source
        if (!ex.note && o.note) ex.note = o.note
      }
    }
  }
  return Array.from(byId.values())
}

// The full NT catalogue (curated + editorial + every book's Bullinger data), loaded once when
// the "All figures" browser is first opened, so it can list every figure's occurrences NT-wide.
let fullCache: Device[] | null = null
let fullInflight: Promise<Device[]> | null = null
function loadFullCatalogue(): Promise<Device[]> {
  if (fullCache) return Promise.resolve(fullCache)
  if (!fullInflight) fullInflight = Promise.all(NT_BOOKS.map(b =>
    fetch(`/data/rhetoric/devices/${b.osis}.json`).then(r => (r.ok ? r.json() : { devices: [] }))
      .then((d: { devices?: Device[] }) => d.devices ?? []).catch(() => [] as Device[])
  )).then(books => {
    let merged = DEVICES
    for (const b of books) merged = mergeDevices(merged, b)
    fullCache = merged
    return merged
  })
  return fullInflight
}

const SOURCE_ATTR = 'Figures classified after E. W. Bullinger, Figures of Speech Used in the Bible (1898), '
  + 'whose Old Testament data is taken from the public-domain first edition. '
  + 'Verse notes: Bengel’s Gnomon of the New Testament (1742; Eng. tr. 1857), via Biblehub, public domain. '
  + 'Parallelism follows Robert Lowth, De sacra poesi Hebraeorum (1753). '
  + 'Entries marked “Editorial” are identified editorially (AI-assisted, reviewed), not drawn from a printed source.'

type Hit = { device: Device; note?: string; ref: string; source?: 'editorial' }   // ref = exact occurrence ref (Bengel key)

// All reading prose on the tab shares this size (matches the left passage column).
const READING_FS: CSSProperties = { fontSize: 'var(--rh-fs)' }
// Break Bengel's roman-numeral outline markers (I. II. III. …) onto their own lines so a long
// analytical note reads as an outline instead of a run-on block. (Arabic markers are left inline
// to avoid colliding with verse numbers like "4:28.")
function tidyBengel(s: string): string {
  return s.replace(/\s+([IVX]{1,4})\.\s+(?=[A-Z])/g, '\n$1. ').trim()
}

// Versions the passage column can show: a Greek edition or a translation (mirrors the
// Synopsis / Backgrounds selector). Greek editions carry word-level tokens that feed the
// parsing pane; translations render as plain text.
const VERSIONS = [
  { code: 'na1904', label: 'Greek — Nestle 1904' },
  { code: 'gnt', label: 'Greek — Tischendorf' },
  { code: 'mt', label: 'Hebrew — Leningrad (WLC)' },
  { code: 'bsb', label: 'English (BSB)' },
  { code: 'en', label: 'English (WEB)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Mandarin' },
]
// Translations only (for the parallel line under the Greek in the example preview).
const TRANS_VERSIONS = VERSIONS.filter(v => v.code !== 'na1904' && v.code !== 'gnt' && v.code !== 'mt')
// Original-language editions, per testament: the selector offers the Hebrew for an OT
// anchor and the Greek editions for a NT one, never both. BSB's alignment file is the
// Greek NT only, so it drops out on the Hebrew side too.
const OT_ONLY = new Set(['mt'])
const NT_ONLY = new Set(['na1904', 'gnt', 'bsb'])
const VERSIONS_FOR = (hebrew: boolean) =>
  VERSIONS.filter(v => !(hebrew ? NT_ONLY : OT_ONLY).has(v.code))
const cacheKey = (v: string, osis: string, chapter: number) =>
  v === 'na1904' ? `na1904.${osis}` : v === 'bsb' ? 'bsb' : `${v}.${osis}.${chapter}`

// A clickable Greek word carries enough to fill the shared parsing pane (Strong's →
// Thayer's / Mounce / Abbott-Smith / LSJ). na1904 words come from the phrase tree with a
// ready `parsing` string + gloss; Tischendorf words ship structured morph we format the same.
type WordToken = { surface: string; parsing: string; lemma: string; gloss?: string; strongs?: string }
const GNT_MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
function formatGntMorph(m: Record<string, string | null> | undefined): string {
  if (!m) return ''
  return GNT_MORPH_ORDER.map(k => m[k]).filter(Boolean).join(', ')
}
function toLexicalInfo(tok: WordToken, reference: string): LexicalInfoPanel {
  return { surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '', partOfSpeech: '',
    parsing: tok.parsing, strongs: tok.strongs, reference }
}

export function RhetoricView({ controlledPassage, isAuthenticated = false, onAttribution, onNavigate }: {
  controlledPassage?: string
  isAuthenticated?: boolean
  onAttribution?: (a: string) => void
  onNavigate?: (ref: string) => void   // jump the shared passage box to a ref (stays on this tab)
}) {
  const t = useT()
  // The figure catalogue is curated English (rhetoric-devices.ts) and is translated per string,
  // so a device with no Spanish yet shows its English name and definition rather than nothing.
  // Under no provider — or in English — tc returns the English it is handed.
  const tc = useTc()
  const ui = useT()
  const locale = useLocale()
  const [bookNotes, setBookNotes] = useState<ContentCatalogue>({})
  const groupLabel = (g: DeviceGroup) => tc(`rhetoric.group.${g}.label`, GROUP_LABEL[g])
  const groupDesc = (g: DeviceGroup) => tc(`rhetoric.group.${g}.desc`, GROUP_DESC[g])
  const deviceName = (d: Device) => tc(`rhetoric.${d.id}.name`, d.name)
  const deviceDef = (d: Device) => tc(`rhetoric.${d.id}.definition`, d.definition)
  // Occurrence notes are keyed by device AND verse: the same verse can illustrate two figures
  // with a different note under each. Two catalogues, because the notes come from two layers: the curated occurrences travel in the
  // page's Rhetoric catalogue (tc), the Bullinger ones are fetched per book (bookNotes). Their
  // key spaces are disjoint by construction — the build skips a Bullinger note on a verse the
  // curated list already covers, since mergeDevices shows the curated wording there.
  const occNote = (d: Device | null | undefined, ref: string, note?: string) => {
    if (!note || !d) return note
    const key = `rhetoric.${d.id}.occ.${ref}`
    const curated = tc(key, note)
    return curated === note ? content(bookNotes, key, note) : curated
  }

  const parsed = useMemo(() => parseRef(controlledPassage ?? ''), [controlledPassage])
  const hebrewAnchor = !!parsed && MT_OSIS.has(parsed.osis)
  const [version, setVersion] = useState(() => (MT_OSIS.has(parseRef(controlledPassage ?? '')?.osis ?? '') ? 'mt' : 'na1904'))
  const [bengel, setBengel] = useState<Record<string, string>>(bengelCache ?? {})
  const [bookDevices, setBookDevices] = useState<Device[]>(() => bookCache[parseRef(controlledPassage ?? '')?.osis ?? ''] ?? [])
  const [selected, setSelected] = useState<{ id: string; ref: string } | null>(null)
  // Figures browser: 'passage' = figures in the open passage; 'browse' = the whole catalogue.
  const [mode, setMode] = useState<'passage' | 'browse'>('passage')
  const [browseId, setBrowseId] = useState<string | null>(null)
  const [fullCat, setFullCat] = useState<Device[] | null>(fullCache)
  // An example the user is previewing in the side panel (browse mode), read without leaving.
  const [previewRef, setPreviewRef] = useState<string | null>(null)
  const [previewTrans, setPreviewTrans] = useState('bsb')   // translation shown under the Greek
  // A device+ref to auto-select once the passage settles (set when jumping from an example),
  // so it survives the passage-change reset below instead of being cleared to null.
  const pendingSel = useRef<{ id: string; ref: string } | null>(null)
  // Clicked/hovered Greek word for the parsing pane, plus a key so only that instance lights up.
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  // version → verseId → text / Greek word-tokens, filled lazily by loadPassage().
  const textCache = useRef<Record<string, Record<string, string>>>({})
  const wordCache = useRef<Record<string, Record<string, WordToken[]>>>({})
  const loaded = useRef<Set<string>>(new Set())
  const settled = useRef<Set<string>>(new Set())
  const [, setTick] = useState(0)
  // Highlighting on the passage column: drag-to-select palette + right-click menu (same as
  // Synopsis / Backgrounds). Requires sign-in to save.
  const highlights = useHighlights(isAuthenticated)
  // Covers both reading surfaces (passage column + example preview); the hook no-ops on any
  // selection that doesn't intersect a [data-hl-verse] anchor.
  const highlightPaneRef = useRef<HTMLDivElement>(null)
  const highlightSelection = useHighlightSelection(highlightPaneRef)

  useEffect(() => { onAttribution?.(SOURCE_ATTR) }, [onAttribution])
  useEffect(() => { loadBengel().then(setBengel) }, [])
  // Follow the anchor across testaments: an OT reference must not be left showing a Greek
  // edition it has no text for (and vice versa).
  useEffect(() => {
    setVersion(v => (hebrewAnchor ? (NT_ONLY.has(v) ? 'mt' : v) : (OT_ONLY.has(v) ? 'na1904' : v)))
  }, [hebrewAnchor])
  // The Hebrew lexicon gives the parsing pane a lemma and gloss for a clicked Hebrew word,
  // as it does in the Reader; without it the pane would show only Strong's and the parsing.
  const [hebLex, setHebLex] = useState<HebrewLexicon | null>(null)
  useEffect(() => { if (hebrewAnchor && !hebLex) loadHebrewLexicon().then(setHebLex).catch(() => {}) }, [hebrewAnchor, hebLex])
  // Per-verse notes on the passage column, like every reading pane (signed-in only).
  const [notedKeys, setNotedKeys] = useState<Set<number>>(new Set())
  const loadNoted = async () => {
    if (!isAuthenticated || !parsed) { setNotedKeys(new Set()); return }
    try {
      const r = await fetch(`/api/notes?book=${encodeURIComponent(parsed.osis)}&chapter=${parsed.chapter}&verseStart=1&verseEnd=500`)
      const d = await r.json()
      setNotedKeys(new Set((d.notes ?? []).map((n: { verse: number }) => n.verse)))
    } catch { /* leave as-is */ }
  }
  useEffect(() => { void loadNoted() }, [isAuthenticated, parsed?.osis, parsed?.chapter]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => onNotesChanged(() => void loadNoted()), [isAuthenticated, parsed?.osis, parsed?.chapter]) // eslint-disable-line react-hooks/exhaustive-deps

  const osis = parsed?.osis
  useEffect(() => {
    if (!osis) { setBookDevices([]); return }
    let alive = true
    loadBookDevices(osis).then(d => { if (alive) setBookDevices(d) })
    return () => { alive = false }
  }, [osis])

  // The open book's Bullinger notes in the interface language. Accumulated rather than replaced,
  // so paging between books keeps what has already been fetched — and so the browse-mode load
  // below can add every book to the same map without racing this one.
  useEffect(() => {
    if (!osis || locale === 'en') return
    let alive = true
    loadBookNotes(locale, osis).then(n => { if (alive) setBookNotes(p => ({ ...p, ...n })) })
    return () => { alive = false }
  }, [osis, locale])

  const allDevices = useMemo(() => mergeDevices(DEVICES, bookDevices), [bookDevices])

  // Load the whole-NT catalogue the first time the browser is opened.
  useEffect(() => { if (mode === 'browse' && !fullCat) loadFullCatalogue().then(setFullCat) }, [mode, fullCat])
  // The browser lists every figure's occurrences NT-wide, so its notes come from all 27 books.
  // This is the one place the whole 46,000 words is wanted, and it is paid for only by a reader
  // who opened the browser in a language that has them.
  useEffect(() => {
    if (mode !== 'browse' || locale === 'en') return
    let alive = true
    Promise.all(NT_BOOKS.map(b => loadBookNotes(locale, b.osis)))
      .then(all => { if (alive) setBookNotes(p => Object.assign({}, p, ...all)) })
    return () => { alive = false }
  }, [mode, locale])
  const catalogue = fullCat ?? allDevices
  const browseDevice = mode === 'browse' && browseId ? catalogue.find(d => d.id === browseId) ?? null : null
  const showPreview = mode === 'browse' && !!previewRef && !!browseDevice

  // Load the previewed example's chapter (reuses the passage cache); clear the preview when
  // the browsed figure changes or we leave browse mode.
  useEffect(() => { const p = previewRef && parseRef(previewRef); if (p) { loadPassage(version, p.osis, p.chapter); loadPassage(previewTrans, p.osis, p.chapter); if (isAuthenticated) void highlights.loadFor(p.osis, p.chapter) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewRef, version, previewTrans, isAuthenticated])
  useEffect(() => { setPreviewRef(null) }, [browseId, mode])

  // Group a device's occurrences by book, in canonical NT order (for the browser detail view).
  function byBook(occs: Occurrence[]): [string, Occurrence[]][] {
    const groups = new Map<string, Occurrence[]>()
    for (const o of occs) { const n = parseRef(o.ref)?.name ?? '—'; (groups.get(n) ?? groups.set(n, []).get(n)!).push(o) }
    return NT_BOOKS.map(b => [b.name, groups.get(b.name)] as const).filter(([, v]) => v).map(([n, v]) => [n, v!])
  }
  // Right-click a Greek word → the shared word-search popup (same as Backgrounds/Synopsis).
  const wordMenu = (e: React.MouseEvent, tok: { surface: string; lemma?: string }, reference: string) => {
    e.preventDefault()
    openWordSearch({ x: e.clientX, y: e.clientY, surface: tok.surface, lemma: tok.lemma || null, reference, kind: 'greek', greekCorpus: 'GNT' })
  }

  // Preview an example in the side panel (stays on the browse page).
  const openExample = (ref: string) => setPreviewRef(ref)
  // Or fully open it on the page: jump the shared passage box and re-select the figure.
  const openOnPage = (ref: string, deviceId: string) => {
    if (!onNavigate) return
    pendingSel.current = { id: deviceId, ref }
    onNavigate(ref); setMode('passage'); setBrowseId(null); setPreviewRef(null)
  }

  // On passage change, reset selections — but honour a pending selection from an example jump.
  useEffect(() => {
    setSelected(pendingSel.current); pendingSel.current = null
    setSelectedInfo(null); setSelectedKey(null)
  }, [controlledPassage])

  // Load the passage text (and Greek word-tokens) for the chosen version.
  useEffect(() => {
    if (parsed) loadPassage(version, parsed.osis, parsed.chapter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, parsed?.osis, parsed?.chapter])

  // Load this chapter's saved highlights (signed-in users).
  useEffect(() => {
    if (isAuthenticated && parsed) void highlights.loadFor(parsed.osis, parsed.chapter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, parsed?.osis, parsed?.chapter])

  function loadPassage(v: string, osis: string, chapter: number) {
    const ck = cacheKey(v, osis, chapter)
    if (loaded.current.has(ck)) return
    loaded.current.add(ck)
    const done = () => { settled.current.add(ck); setTick(t => t + 1) }
    if (v === 'na1904') {
      // na1904 has no verse-text files — reconstruct from the per-book phrase tree (MACULA).
      type Node = { t: string; id?: string; w?: string; parsing?: string; lemma?: string; gloss?: string; strongs?: string; c?: Node[] }
      fetch(`/data/phrase-tree/${osis}.json`).then(r => r.json()).then((d: { sentences?: { tree: Node }[] }) => {
        const tmap = (textCache.current.na1904 ??= {}); const wmap = (wordCache.current.na1904 ??= {})
        const byVerse: Record<string, { i: number; tok: WordToken }[]> = {}
        const walk = (n: Node) => {
          if (n.t === 'w' && n.id) {
            const [bk, ch, vs, wd] = n.id.split('.')
            ;(byVerse[`${bk}.${ch}.${vs}`] ??= []).push({ i: parseInt(wd || '0', 10),
              tok: { surface: n.w ?? '', parsing: n.parsing ?? '', lemma: n.lemma ?? '', gloss: n.gloss, strongs: n.strongs } })
          } else (n.c ?? []).forEach(walk)
        }
        for (const s of d.sentences ?? []) walk(s.tree)
        for (const [vKey, ws] of Object.entries(byVerse)) {
          ws.sort((a, b) => a.i - b.i)
          tmap[vKey] = ws.map(x => x.tok.surface).join(' '); wmap[vKey] = ws.map(x => x.tok)
        }
        done()
      }).catch(done)
    } else if (v === 'gnt') {
      type GntWord = { surface: string; lemma?: string; strongs?: string; morph?: Record<string, string | null> }
      fetch(`/data/gnt/${osis}_${chapter}.json`).then(r => r.json()).then((d: { verses?: { verse: number; text: string; words?: GntWord[] }[] }) => {
        const tmap = (textCache.current.gnt ??= {}); const wmap = (wordCache.current.gnt ??= {})
        for (const vv of d.verses ?? []) {
          const vid = `${osis}.${chapter}.${vv.verse}`
          tmap[vid] = vv.text
          if (vv.words) wmap[vid] = vv.words.map(w => ({ surface: w.surface, parsing: formatGntMorph(w.morph), lemma: w.lemma ?? '', strongs: w.strongs }))
        }
        done()
      }).catch(done)
    } else if (v === 'mt') {
      // The Hebrew Bible from our own WLC corpus, with OSHB morphology for the parsing pane.
      type MtWord = { surface: string; strongs?: string; morph?: string }
      fetch(`/data/mt/${osis}_${chapter}.json`).then(r => r.json()).then((d: { verses?: { verse: number; words?: MtWord[] }[] }) => {
        const tmap = (textCache.current.mt ??= {}); const wmap = (wordCache.current.mt ??= {})
        for (const vv of d.verses ?? []) {
          const vid = `${osis}.${chapter}.${vv.verse}`
          const ws = vv.words ?? []
          tmap[vid] = ws.map(w => w.surface).join(' ')
          wmap[vid] = ws.map(w => ({
            surface: w.surface,
            parsing: w.morph ? formatHebrewParse(w.morph) : '',
            lemma: '',
            strongs: w.strongs ? `H${w.strongs}` : undefined,
          }))
        }
        done()
      }).catch(done)
    } else if (v === 'bsb') {
      fetch('/data/bsb-alignment.json?v=3').then(r => r.json()).then((d: Record<string, { text: string }>) => {
        const tmap = (textCache.current.bsb ??= {})
        for (const [vid, val] of Object.entries(d)) tmap[vid] = val.text
        done()
      }).catch(done)
    } else {
      fetch(`/api/translation?book=${osis}&chapter=${chapter}&lang=${v}`).then(r => r.json()).then((d: { verses?: Record<string, string> }) => {
        Object.assign((textCache.current[v] ??= {}), d.verses ?? {})
        done()
      }).catch(done)
    }
  }

  // Verses of the current chapter present in the chosen version's cache, in order.
  const verses = useMemo(() => {
    if (!parsed) return [] as { verse: number; text: string; tokens?: WordToken[] }[]
    const tmap = textCache.current[version] ?? {}; const wmap = wordCache.current[version] ?? {}
    const prefix = `${parsed.osis}.${parsed.chapter}.`
    return Object.keys(tmap).filter(k => k.startsWith(prefix))
      .map(k => ({ verse: parseInt(k.slice(prefix.length), 10), text: tmap[k], tokens: wmap[k] }))
      .filter(v => Number.isFinite(v.verse))
      .sort((a, b) => a.verse - b.verse)
    // settled is bumped via setTick, which re-runs this memo through a render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, version, settled.current.size, textCache.current[version]])

  const isGreek = version === 'gnt' || version === 'na1904'
  const isHebrew = version === 'mt'
  // Both Greek and Hebrew columns render word-by-word from tokens (clickable, parsable);
  // translations render as running text.
  const isOriginal = isGreek || isHebrew
  const origLayer = isGreek ? 'grc' : HEBREW_LAYER
  const status: 'idle' | 'nonNT' | 'loading' | 'ok' | 'missing' =
    !controlledPassage?.trim() ? 'idle'
      : !parsed ? 'nonNT'
        : verses.length > 0 ? 'ok'
          : settled.current.has(cacheKey(version, parsed.osis, parsed.chapter)) ? 'missing'
            : 'loading'

  // Devices occurring in this chapter, indexed by verse.
  const byVerse = useMemo(() => {
    const map: Record<number, Hit[]> = {}
    if (!parsed) return map
    for (const device of allDevices) {
      for (const occ of device.occurrences) {
        const p = parseRef(occ.ref)
        if (p && p.osis === parsed.osis && p.chapter === parsed.chapter) {
          (map[p.vStart] ||= []).push({ device, note: occ.note, ref: occ.ref, source: occ.source })
        }
      }
    }
    return map
  }, [parsed, allDevices])

  const shownVerses = useMemo(() => {
    if (!parsed) return verses
    if (parsed.vStart === 0) return verses
    return verses.filter(v => v.verse >= parsed.vStart && v.verse <= parsed.vEnd)
  }, [verses, parsed])

  const deviceById = (id: string) => allDevices.find(d => d.id === id)
  const versesWithDevices = shownVerses.filter(v => byVerse[v.verse]?.length)
  // Legend reflects only the shown verse range (not the whole chapter), so it stays empty
  // when the selected passage has no catalogued figures.
  const groupsPresent = useMemo(() => {
    const s = new Set<DeviceGroup>()
    for (const v of shownVerses) for (const h of (byVerse[v.verse] ?? [])) s.add(h.device.group)
    return Array.from(s)
  }, [shownVerses, byVerse])

  // Parsing-pane content before any word is clicked: the first Greek token of whatever is
  // in focus (the preview verse while previewing, else the passage). Computed each render so
  // it fills in as soon as the chapter's word-tokens load.
  const defaultParsingInfo: LexicalInfoPanel | null = (() => {
    if (!isOriginal) return null
    if (showPreview) {
      const pp = parseRef(previewRef!)
      const t = pp ? wordCache.current[version]?.[`${pp.osis}.${pp.chapter}.${pp.vStart}`]?.[0] : undefined
      return t ? hebrewizeInfo(toLexicalInfo(t, `${pp!.name} ${pp!.chapter}:${pp!.vStart}`), hebLex) : null
    }
    if (!parsed) return null
    const fv = shownVerses.find(v => v.tokens && v.tokens.length > 0)
    const ft = fv?.tokens?.[0]
    return ft ? hebrewizeInfo(toLexicalInfo(ft, `${parsed.name} ${parsed.chapter}:${fv!.verse}`), hebLex) : null
  })()

  const sel = selected && deviceById(selected.id)

  return (
    <div className="h-full flex flex-col min-h-0" style={{ '--rh-fs': '1.45rem' } as CSSProperties}>
      {status === 'idle' && <p className="text-gray-400 text-sm mt-6 text-center">{ui('rhetoric.idle')}</p>}
      {status === 'nonNT' && <p className="text-gray-500 text-sm mt-6 text-center">{ui('rhetoric.wholeBible', { nt: 'Romans 8:31-39', ot: 'Psalm 1:1-6' })}</p>}
      {status === 'loading' && <p className="text-gray-400 text-sm mt-6 text-center">{ui('rhetoric.loading')}</p>}
      {status === 'missing' && <p className="text-gray-500 text-sm mt-6 text-center">{ui('rhetoric.loadFailed', { ref: `${parsed?.name} ${parsed?.chapter}` })}</p>}

      {status === 'ok' && (
        <div ref={highlightPaneRef} className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* Column 1 — the passage (steps aside while previewing an example) */}
          {!showPreview && (
          <div className="min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{parsed!.name} {parsed!.chapter}</p>
              <select
                value={version}
                onChange={e => setVersion(e.target.value)}
                className="shrink-0 rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {VERSIONS_FOR(hebrewAnchor).map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
              </select>
            </div>
            <div dir={isHebrew ? 'rtl' : undefined}
              className={`space-y-1 leading-relaxed text-gray-900 ${isGreek ? 'font-greek' : isHebrew ? 'font-hebrew' : 'font-reading'}`} style={READING_FS}>
              {shownVerses.map(v => {
                const has = byVerse[v.verse]?.length
                const layer = isOriginal ? origLayer : version
                const verseHls = highlights.forVerse(parsed!.osis, parsed!.chapter, v.verse, layer)
                const refStr = `${parsed!.name} ${parsed!.chapter}:${v.verse}`
                return (
                  <p key={v.verse} className={has ? 'rounded px-1 -mx-1 bg-amber-50/40' : ''}>
                    {isAuthenticated && (
                      <span dir="ltr" className="mr-0.5 align-middle font-sans print:hidden" onClick={e => e.stopPropagation()}>
                        <VerseNoteButton book={parsed!.osis} chapter={parsed!.chapter} verse={v.verse}
                          noted={notedKeys.has(v.verse)} onChanged={loadNoted} />
                      </span>
                    )}
                    <sup className="text-[10px] text-brand-500 mr-0.5 font-sans">{v.verse}</sup>
                    {isOriginal && v.tokens && v.tokens.length > 0
                      ? <span {...verseAnchorProps(parsed!.osis, parsed!.chapter, v.verse, origLayer)}>
                          {withTokenOffsets(v.tokens).map(({ token: tok, start, end }, ti) => {
                            const key = `${v.verse}.${ti}`
                            const select = () => { setSelectedInfo(hebrewizeInfo(toLexicalInfo(tok, refStr), hebLex)); setSelectedKey(key) }
                            const hl = highlightAt(start, end, verseHls)
                            return (
                              <span
                                key={ti}
                                onMouseEnter={select}
                                onClick={select}
                                onContextMenu={e => {
                                  e.preventDefault()
                                  openWordSearch({
                                    x: e.clientX, y: e.clientY, surface: tok.surface, lemma: tok.lemma || null, reference: refStr,
                                    ...(isHebrew ? { kind: 'hebrew' as const } : { kind: 'greek' as const, greekCorpus: 'GNT' as const }),
                                    highlight: isAuthenticated ? {
                                      activeColor: hl?.color ?? null,
                                      onPick: c => hl ? void highlights.recolor(hl.id, parsed!.osis, parsed!.chapter, c) : void highlights.create(parsed!.osis, parsed!.chapter, v.verse, start, end, c, origLayer),
                                      onRemove: () => { if (hl) void highlights.remove(hl.id, parsed!.osis, parsed!.chapter) },
                                    } : undefined,
                                  })
                                }}
                                {...(hl ? { 'data-highlight-id': hl.id, 'data-hl-book': parsed!.osis, 'data-hl-chapter': parsed!.chapter, 'data-hl-color': hl.color } : {})}
                                className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''} ${hl ? highlightMarkClass(hl.color) : ''}`}
                              >
                                {tok.surface}{ti < v.tokens!.length - 1 ? ' ' : ''}
                              </span>
                            )
                          })}
                        </span>
                      : <span {...verseAnchorProps(parsed!.osis, parsed!.chapter, v.verse, version)}>
                          <TransWords text={v.text} lang={version} reference={refStr} book={parsed!.osis}
                            hl={isAuthenticated ? { isAuthenticated, verseHighlights: verseHls,
                              create: (s, e, c) => void highlights.create(parsed!.osis, parsed!.chapter, v.verse, s, e, c, version),
                              recolor: (id, c) => void highlights.recolor(id, parsed!.osis, parsed!.chapter, c),
                              remove: id => void highlights.remove(id, parsed!.osis, parsed!.chapter) } : undefined} />
                        </span>}
                  </p>
                )
              })}
            </div>
          </div>
          )}

          {/* Column 2 — figures: in this passage, or the whole-NT browser */}
          <div className="min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{ui(mode === 'browse' ? 'rhetoric.allFigures' : 'rhetoric.devicesPresent')}</p>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[10px] shrink-0">
                <button type="button" onClick={() => setMode('passage')} className={`px-2 py-0.5 transition-colors ${mode === 'passage' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{ui('rhetoric.inThisPassage')}</button>
                <button type="button" onClick={() => setMode('browse')} className={`px-2 py-0.5 transition-colors ${mode === 'browse' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{ui('rhetoric.allFigures')}</button>
              </div>
            </div>

            {mode === 'browse' ? (
              <div className="space-y-3">
                <p className="text-[11px] text-gray-500 leading-relaxed">{ui('rhetoric.intro')}</p>
                {!fullCat && <p className="text-xs text-gray-400 italic">{ui('rhetoric.loadingCatalogue')}</p>}
                {GROUP_ORDER.map(g => {
                  const devs = catalogue.filter(d => d.group === g && d.occurrences.length)
                    .sort((a, b) => deviceName(a).localeCompare(deviceName(b)))
                  if (!devs.length) return null
                  return (
                    <div key={g}>
                      <div className={`rounded-lg border px-2 py-1 ${GROUP_COLOR[g]}`}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide">{groupLabel(g)}</p>
                        <p className="text-[10px] opacity-80 leading-snug">{groupDesc(g)}</p>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {devs.map(d => (
                          <button key={d.id} type="button" onClick={() => setBrowseId(d.id)}
                            className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium transition ${GROUP_COLOR[d.group]} ${browseId === d.id ? 'ring-2 ring-brand-400' : 'hover:brightness-95'}`}>
                            {deviceName(d)} <span className="opacity-60">{d.occurrences.length}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <>
                {versesWithDevices.length === 0 ? (
                  <p className="text-sm text-gray-400">{ui('rhetoric.noneHere')}</p>
                ) : (
                  <div className="space-y-3">
                    {versesWithDevices.map(v => (
                      <div key={v.verse}>
                        <p className="text-[0.7rem] font-mono font-semibold text-gray-500 mb-1">{parsed!.chapter}:{v.verse}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {byVerse[v.verse].map((h, i) => {
                            const on = selected?.id === h.device.id && selected?.ref === h.ref
                            return (
                              <button
                                key={h.device.id + i}
                                type="button"
                                onClick={() => setSelected({ id: h.device.id, ref: h.ref })}
                                className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium transition ${GROUP_COLOR[h.device.group]} ${h.source === 'editorial' ? 'border-dashed' : ''} ${on ? 'ring-2 ring-brand-400' : 'hover:brightness-95'}`}
                                title={occNote(h.device, h.ref, h.note)}
                              >
                                {deviceName(h.device)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* colour key — hover a chip for the category’s plain-language meaning */}
                {groupsPresent.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                    {groupsPresent.map(g => (
                      <span key={g} title={groupDesc(g)} className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium cursor-help ${GROUP_COLOR[g]}`}>{groupLabel(g)}</span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Column 3 — explanation of the selected device (+Bengel), or the browsed device's examples */}
          <div className="min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{ui(browseDevice ? 'rhetoric.figure' : 'rhetoric.explanation')}</p>
            {browseDevice ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold text-gray-800">{deviceName(browseDevice)}</span>
                    {browseDevice.greek && <span className="font-greek text-sm text-gray-500">{browseDevice.greek}</span>}
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium ${GROUP_COLOR[browseDevice.group]}`}>{groupLabel(browseDevice.group)}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{groupDesc(browseDevice.group)}</p>
                  <p className="font-reading text-gray-700 leading-relaxed mt-1.5" style={READING_FS}>{deviceDef(browseDevice)}</p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                    Examples ({browseDevice.occurrences.length}) — click to preview
                  </p>
                  {byBook(browseDevice.occurrences).map(([bookName, occs]) => (
                    <div key={bookName} className="mb-2">
                      <p className="text-[10px] font-semibold text-gray-500 mb-1">{bookName}</p>
                      <div className="flex flex-wrap gap-1">
                        {occs.map(o => (
                          <button key={o.ref} type="button" onClick={() => openExample(o.ref)} title={occNote(browseDevice, o.ref, o.note)}
                            className={`rounded border px-1.5 py-0.5 text-[11px] font-mono transition hover:bg-brand-50 hover:border-brand-300 ${previewRef === o.ref ? 'ring-2 ring-brand-400' : ''} ${o.source === 'editorial' ? 'border-dashed border-amber-300 text-amber-700' : 'border-gray-200 text-gray-600'}`}>
                            {o.ref.replace(/^.*?\s(\d)/, '$1')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !sel ? (
              <p className="text-sm text-gray-400">{ui('rhetoric.clickPrompt')}</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold text-gray-800">{deviceName(sel)}</span>
                    {sel.greek && <span className="font-greek text-sm text-gray-500">{sel.greek}</span>}
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium ${GROUP_COLOR[sel.group]}`}>{groupLabel(sel.group)}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{groupDesc(sel.group)}</p>
                  <p className="font-reading text-gray-700 leading-relaxed mt-1.5" style={READING_FS}>{deviceDef(sel)}</p>
                </div>

                {/* the note for this specific occurrence, plus an editorial caveat if needed */}
                {(() => {
                  const occ = sel.occurrences.find(o => o.ref === selected!.ref)
                  return (
                    <div className="space-y-2">
                      {occ?.source === 'editorial' && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                          <span className="font-semibold uppercase tracking-wide">{ui('rhetoric.editorial')}</span> — {ui('rhetoric.editorialNote')}
                        </p>
                      )}
                      {occ?.note && <p className="font-reading text-gray-700 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-relaxed" style={READING_FS}><b className="font-mono text-[0.8em] text-gray-500">{selected!.ref}</b> — {occNote(sel, occ.ref, occ.note)}</p>}
                    </div>
                  )
                })()}

                {/* Bengel's Gnomon on this verse — New Testament only.
                    There is deliberately no Old Testament counterpart here. Keil & Delitzsch was
                    tried and removed: this column exists to explain a figure of speech, and K&D is
                    the wrong shape for it — median 262 words against Bengel's 127, 45% of entries
                    over 300, the longest 17,000 — so a single note pushed the explanation it sits
                    beside off the bottom of the column. K&D is a click away in the Commentary tab,
                    which is built to hold it. */}
                {(() => {
                  const sr = parseRef(selected!.ref)
                  if (sr && MT_OSIS.has(sr.osis)) return null
                  const note = bengel[selected!.ref]
                  return (
                    <div>
                      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-brand-500 mb-1">
                        {ui('rhetoric.gnomon')} · {selected!.ref}
                      </p>
                      {!note ? (
                        <p className="text-xs text-gray-400 italic">{ui('rhetoric.noGnomon')}</p>
                      ) : (
                        // Bengel is plain text, so the fence is built out of React instead: his Greek
                        // stays as written while the English around it may be translated.
                        <p {...translatable} className="font-reading text-gray-700 leading-relaxed whitespace-pre-line" style={READING_FS}>
                          {segmentOriginalScripts(tidyBengel(note)).map((seg, i) => seg.lang
                            ? <span key={i} {...(seg.lang === 'he' ? hebrewText : greekText)}>{seg.text}</span>
                            : <span key={i}>{seg.text}</span>)}
                        </p>
                      )}
                    </div>
                  )
                })()}

                {/* other occurrences of this figure */}
                {sel.occurrences.length > 1 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-gray-400 mb-1">{ui('rhetoric.alsoAppearsIn')}</p>
                    <div className="flex flex-wrap gap-1">
                      {sel.occurrences.map(o => (
                        <span key={o.ref} className="text-[11px] font-mono text-gray-500">{o.ref}</span>
                      )).reduce((acc: React.ReactNode[], el, i) => i === 0 ? [el] : [...acc, <span key={'s' + i} className="text-gray-300">·</span>, el], [])}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview column — read an example verse (text + note + Bengel) without leaving the
              browse page. Opens to the right; the passage column above steps aside for it. */}
          {showPreview && (() => {
            const p = parseRef(previewRef!)
            const vid = p ? `${p.osis}.${p.chapter}.${p.vStart}` : ''
            const text = p ? (textCache.current[version]?.[vid] ?? null) : null
            const ptoks = p ? wordCache.current[version]?.[vid] : undefined
            const pref = p ? `${p.name} ${p.chapter}:${p.vStart}` : previewRef!
            const pvHls = p ? highlights.forVerse(p.osis, p.chapter, p.vStart, isGreek ? 'grc' : version) : []
            const ptHls = p ? highlights.forVerse(p.osis, p.chapter, p.vStart, previewTrans) : []
            const occ = browseDevice!.occurrences.find(o => o.ref === previewRef)
            const gnomon = bengel[previewRef!]
            return (
              <div className="min-h-0 overflow-y-auto rounded-xl border border-brand-200 bg-brand-50/20 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{p?.name} {p?.chapter}:{p?.vStart} · {deviceName(browseDevice!)}</p>
                  <button type="button" onClick={() => setPreviewRef(null)} className="text-gray-400 hover:text-gray-700 shrink-0" title={ui('rhetoric.closePreview')}><X size={15} /></button>
                </div>
                {text ? (
                  <p className={`leading-relaxed text-gray-900 ${isGreek ? 'font-greek' : 'font-reading'}`} style={READING_FS}>
                    <sup className="text-[10px] text-brand-500 mr-0.5 font-sans align-super">{p!.vStart}</sup>
                    {!isGreek
                      ? <span {...verseAnchorProps(p!.osis, p!.chapter, p!.vStart, version)}>
                          <TransWords text={text} lang={version} reference={pref} book={p!.osis}
                            hl={isAuthenticated ? { isAuthenticated, verseHighlights: pvHls,
                              create: (s, e, c) => void highlights.create(p!.osis, p!.chapter, p!.vStart, s, e, c, version),
                              recolor: (id, c) => void highlights.recolor(id, p!.osis, p!.chapter, c),
                              remove: id => void highlights.remove(id, p!.osis, p!.chapter) } : undefined} />
                        </span>
                      : ptoks && ptoks.length > 0
                        ? <span {...verseAnchorProps(p!.osis, p!.chapter, p!.vStart, 'grc')}>
                            {withTokenOffsets(ptoks).map(({ token: tok, start, end }, ti) => {
                              const key = `prev.${ti}`
                              const select = () => { setSelectedInfo(hebrewizeInfo(toLexicalInfo(tok, pref), hebLex)); setSelectedKey(key) }
                              const hl = highlightAt(start, end, pvHls)
                              return (
                                <span key={ti} onMouseEnter={select} onClick={select}
                                  onContextMenu={e => {
                                    e.preventDefault()
                                    openWordSearch({
                                      x: e.clientX, y: e.clientY, surface: tok.surface, lemma: tok.lemma || null, reference: pref, kind: 'greek', greekCorpus: 'GNT',
                                      highlight: isAuthenticated ? {
                                        activeColor: hl?.color ?? null,
                                        onPick: c => hl ? void highlights.recolor(hl.id, p!.osis, p!.chapter, c) : void highlights.create(p!.osis, p!.chapter, p!.vStart, start, end, c, 'grc'),
                                        onRemove: () => { if (hl) void highlights.remove(hl.id, p!.osis, p!.chapter) },
                                      } : undefined,
                                    })
                                  }}
                                  {...(hl ? { 'data-highlight-id': hl.id, 'data-hl-book': p!.osis, 'data-hl-chapter': p!.chapter, 'data-hl-color': hl.color } : {})}
                                  className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''} ${hl ? highlightMarkClass(hl.color) : ''}`}>
                                  {tok.surface}{ti < ptoks.length - 1 ? ' ' : ''}
                                </span>
                              )
                            })}
                          </span>
                        : text}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">{t('reader.loading')}</p>
                )}
                {/* Parallel translation immediately below the Greek (user picks the version). */}
                {isGreek && text && (() => {
                  const tt = p ? (textCache.current[previewTrans]?.[vid] ?? null) : null
                  return (
                    <div className="mt-2 pt-2 border-t border-brand-100">
                      <select value={previewTrans} onChange={e => setPreviewTrans(e.target.value)}
                        className="mb-1 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-500">
                        {TRANS_VERSIONS.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
                      </select>
                      {tt ? (
                        <p className="font-reading text-gray-600 leading-relaxed" style={{ fontSize: 'calc(var(--rh-fs) * 0.82)' }}>
                          <span {...verseAnchorProps(p!.osis, p!.chapter, p!.vStart, previewTrans)}>
                            <TransWords text={tt} lang={previewTrans} reference={pref} book={p!.osis}
                              hl={isAuthenticated ? { isAuthenticated, verseHighlights: ptHls,
                                create: (s, e, c) => void highlights.create(p!.osis, p!.chapter, p!.vStart, s, e, c, previewTrans),
                                recolor: (id, c) => void highlights.recolor(id, p!.osis, p!.chapter, c),
                                remove: id => void highlights.remove(id, p!.osis, p!.chapter) } : undefined} />
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">{ui('rhetoric.loadingTranslation')}</p>
                      )}
                    </div>
                  )
                })()}
                {occ?.source === 'editorial' && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-2">
                    <span className="font-semibold uppercase tracking-wide">{ui('rhetoric.editorial')}</span> — {ui('rhetoric.editorialNote')}
                  </p>
                )}
                {occ?.note && <p className="font-reading text-gray-700 bg-white/70 rounded-lg px-2.5 py-1.5 leading-relaxed mt-2" style={READING_FS}>{occNote(browseDevice!, occ.ref, occ.note)}</p>}
                <div className="mt-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-brand-500 mb-1">Bengel’s Gnomon · {previewRef}</p>
                  {gnomon ? (
                    <p className="font-reading text-gray-700 leading-relaxed whitespace-pre-line" style={READING_FS}>{tidyBengel(gnomon)}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">{ui('rhetoric.noGnomon')}</p>
                  )}
                </div>
                {onNavigate && (
                  <button type="button" onClick={() => openOnPage(previewRef!, browseDevice!.id)} className="mt-3 text-xs font-medium text-brand-600 hover:underline">
                    Open this passage on the page →
                  </button>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Greek parsing pane at the bottom — the shared component (Strong's → Thayer's /
          Mounce / Abbott-Smith / LSJ), fed by hovering/clicking a Greek word above. Shown
          for a Greek edition in passage mode, and while previewing a Greek example. */}
      {status === 'ok' && isOriginal && (mode === 'passage' || showPreview) && (
        <ResizableParsingPane storageKey="rhetoric" info={selectedInfo ?? defaultParsingInfo} bgClass="bg-gray-50" />
      )}

      {/* Drag-to-select highlight palette (signed-in users). Right-click highlighting is wired
          into the word-search popup above. */}
      {isAuthenticated && highlightSelection.popup && (
        <HighlightPopup
          state={highlightSelection.popup}
          onPick={color => {
            const s = highlightSelection.popup!
            if (s.kind === 'new') for (const sp of s.splits) void highlights.create(sp.book, sp.chapter, sp.verse, sp.start, sp.end, color, sp.layer)
            else void highlights.recolor(s.id, s.book, s.chapter, color)
            highlightSelection.close()
          }}
          onRemove={() => {
            const s = highlightSelection.popup!
            if (s.kind === 'edit') void highlights.remove(s.id, s.book, s.chapter)
            highlightSelection.close()
          }}
          onClose={highlightSelection.close}
        />
      )}
    </div>
  )
}
