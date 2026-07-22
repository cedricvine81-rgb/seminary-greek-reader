'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DEVICES, GROUP_LABEL, GROUP_COLOR, GROUP_DESC, GROUP_ORDER, type Device, type DeviceGroup, type Occurrence } from '@/lib/rhetoric-devices'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
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

const RHETORIC_INTRO = 'Rhetorical figures are the patterns of language — comparison, word-play, '
  + 'repetition, structure — that give a text its force. Each verse’s figures appear below, '
  + 'colour-coded by category; click one to see what it is and how it works here. Switch to '
  + '“All figures” to browse every figure by category, read its definition, and jump to each of '
  + 'its examples across the New Testament.'

const SOURCE_ATTR = 'Figures classified after E. W. Bullinger, Figures of Speech Used in the Bible (1898). '
  + 'Verse notes: Bengel’s Gnomon of the New Testament (1742; Eng. tr. 1857), via Biblehub. Both public domain. '
  + 'Entries marked “Editorial” are identified editorially (AI-assisted, reviewed), not drawn from a printed source.'

type Hit = { device: Device; note?: string; ref: string; source?: 'editorial' }   // ref = exact occurrence ref (Bengel key)

// Versions the passage column can show: a Greek edition or a translation (mirrors the
// Synopsis / Backgrounds selector). Greek editions carry word-level tokens that feed the
// parsing pane; translations render as plain text.
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

export function RhetoricView({ controlledPassage, onAttribution, onNavigate }: {
  controlledPassage?: string
  isAuthenticated?: boolean
  onAttribution?: (a: string) => void
  onNavigate?: (ref: string) => void   // jump the shared passage box to a ref (stays on this tab)
}) {
  const parsed = useMemo(() => parseRef(controlledPassage ?? ''), [controlledPassage])
  const [version, setVersion] = useState('na1904')
  const [bengel, setBengel] = useState<Record<string, string>>(bengelCache ?? {})
  const [bookDevices, setBookDevices] = useState<Device[]>(() => bookCache[parseRef(controlledPassage ?? '')?.osis ?? ''] ?? [])
  const [selected, setSelected] = useState<{ id: string; ref: string } | null>(null)
  // Figures browser: 'passage' = figures in the open passage; 'browse' = the whole catalogue.
  const [mode, setMode] = useState<'passage' | 'browse'>('passage')
  const [browseId, setBrowseId] = useState<string | null>(null)
  const [fullCat, setFullCat] = useState<Device[] | null>(fullCache)
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

  useEffect(() => { onAttribution?.(SOURCE_ATTR) }, [onAttribution])
  useEffect(() => { loadBengel().then(setBengel) }, [])

  const osis = parsed?.osis
  useEffect(() => {
    if (!osis) { setBookDevices([]); return }
    let alive = true
    loadBookDevices(osis).then(d => { if (alive) setBookDevices(d) })
    return () => { alive = false }
  }, [osis])

  const allDevices = useMemo(() => mergeDevices(DEVICES, bookDevices), [bookDevices])

  // Load the whole-NT catalogue the first time the browser is opened.
  useEffect(() => { if (mode === 'browse' && !fullCat) loadFullCatalogue().then(setFullCat) }, [mode, fullCat])
  const catalogue = fullCat ?? allDevices
  const browseDevice = mode === 'browse' && browseId ? catalogue.find(d => d.id === browseId) ?? null : null

  // Group a device's occurrences by book, in canonical NT order (for the browser detail view).
  function byBook(occs: Occurrence[]): [string, Occurrence[]][] {
    const groups = new Map<string, Occurrence[]>()
    for (const o of occs) { const n = parseRef(o.ref)?.name ?? '—'; (groups.get(n) ?? groups.set(n, []).get(n)!).push(o) }
    return NT_BOOKS.map(b => [b.name, groups.get(b.name)] as const).filter(([, v]) => v).map(([n, v]) => [n, v!])
  }
  // Jump the shared passage box to an example and remember which figure to re-select.
  const openExample = (ref: string, deviceId: string) => {
    if (!onNavigate) return
    pendingSel.current = { id: deviceId, ref }
    onNavigate(ref); setMode('passage'); setBrowseId(null)
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

  // Parsing-pane content before any word is clicked: the passage's first Greek token, so
  // the pane never sits empty (mirrors the Synopsis / Phrasing tabs).
  const defaultParsingInfo = useMemo<LexicalInfoPanel | null>(() => {
    if (!isGreek || !parsed) return null
    const fv = shownVerses.find(v => v.tokens && v.tokens.length > 0)
    const ft = fv?.tokens?.[0]
    return ft ? toLexicalInfo(ft, `${parsed.name} ${parsed.chapter}:${fv!.verse}`) : null
  }, [isGreek, parsed, shownVerses])

  const sel = selected && deviceById(selected.id)

  return (
    <div className="h-full flex flex-col min-h-0">
      {status === 'idle' && <p className="text-gray-400 text-sm mt-6 text-center">Enter a New Testament passage to see its rhetorical figures.</p>}
      {status === 'nonNT' && <p className="text-gray-500 text-sm mt-6 text-center">Rhetoric data covers the <b>New Testament</b>. Try e.g. <span className="font-medium">Romans 8:31-39</span>.</p>}
      {status === 'loading' && <p className="text-gray-400 text-sm mt-6 text-center">Loading…</p>}
      {status === 'missing' && <p className="text-gray-500 text-sm mt-6 text-center">Couldn’t load {parsed?.name} {parsed?.chapter}.</p>}

      {status === 'ok' && (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* Column 1 — the passage, in a chosen Greek edition or translation */}
          <div className="min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{parsed!.name} {parsed!.chapter}</p>
              <select
                value={version}
                onChange={e => setVersion(e.target.value)}
                className="shrink-0 rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {VERSIONS.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
              </select>
            </div>
            <div className={`space-y-1 leading-relaxed text-gray-900 ${isGreek ? 'font-greek' : 'font-reading'}`} style={{ fontSize: '1.45rem' }}>
              {shownVerses.map(v => {
                const has = byVerse[v.verse]?.length
                return (
                  <p key={v.verse} className={has ? 'rounded px-1 -mx-1 bg-amber-50/40' : ''}>
                    <sup className="text-[10px] text-brand-500 mr-0.5 font-sans">{v.verse}</sup>
                    {isGreek && v.tokens && v.tokens.length > 0
                      ? v.tokens.map((tok, ti) => {
                          const key = `${v.verse}.${ti}`
                          const select = () => { setSelectedInfo(toLexicalInfo(tok, `${parsed!.name} ${parsed!.chapter}:${v.verse}`)); setSelectedKey(key) }
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
                )
              })}
            </div>
          </div>

          {/* Column 2 — figures: in this passage, or the whole-NT browser */}
          <div className="min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{mode === 'browse' ? 'All figures' : 'Devices present'}</p>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[10px] shrink-0">
                <button type="button" onClick={() => setMode('passage')} className={`px-2 py-0.5 transition-colors ${mode === 'passage' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>In this passage</button>
                <button type="button" onClick={() => setMode('browse')} className={`px-2 py-0.5 transition-colors ${mode === 'browse' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>All figures</button>
              </div>
            </div>

            {mode === 'browse' ? (
              <div className="space-y-3">
                <p className="text-[11px] text-gray-500 leading-relaxed">{RHETORIC_INTRO}</p>
                {!fullCat && <p className="text-xs text-gray-400 italic">Loading the full catalogue…</p>}
                {GROUP_ORDER.map(g => {
                  const devs = catalogue.filter(d => d.group === g && d.occurrences.length).sort((a, b) => a.name.localeCompare(b.name))
                  if (!devs.length) return null
                  return (
                    <div key={g}>
                      <div className={`rounded-lg border px-2 py-1 ${GROUP_COLOR[g]}`}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide">{GROUP_LABEL[g]}</p>
                        <p className="text-[10px] opacity-80 leading-snug">{GROUP_DESC[g]}</p>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {devs.map(d => (
                          <button key={d.id} type="button" onClick={() => setBrowseId(d.id)}
                            className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium transition ${GROUP_COLOR[d.group]} ${browseId === d.id ? 'ring-2 ring-brand-400' : 'hover:brightness-95'}`}>
                            {d.name} <span className="opacity-60">{d.occurrences.length}</span>
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
                  <p className="text-sm text-gray-400">No catalogued figures in this passage yet.</p>
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
                                title={h.note}
                              >
                                {h.device.name}
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
                      <span key={g} title={GROUP_DESC[g]} className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium cursor-help ${GROUP_COLOR[g]}`}>{GROUP_LABEL[g]}</span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Column 3 — explanation of the selected device (+Bengel), or the browsed device's examples */}
          <div className="min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{browseDevice ? 'Figure' : 'Explanation'}</p>
            {browseDevice ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold text-gray-800">{browseDevice.name}</span>
                    {browseDevice.greek && <span className="font-greek text-sm text-gray-500">{browseDevice.greek}</span>}
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium ${GROUP_COLOR[browseDevice.group]}`}>{GROUP_LABEL[browseDevice.group]}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{GROUP_DESC[browseDevice.group]}</p>
                  <p className="text-sm text-gray-700 leading-relaxed mt-1.5">{browseDevice.definition}</p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                    Examples ({browseDevice.occurrences.length}){!onNavigate && ' — open a passage to jump'}
                  </p>
                  {byBook(browseDevice.occurrences).map(([bookName, occs]) => (
                    <div key={bookName} className="mb-2">
                      <p className="text-[10px] font-semibold text-gray-500 mb-1">{bookName}</p>
                      <div className="flex flex-wrap gap-1">
                        {occs.map(o => (
                          <button key={o.ref} type="button" onClick={() => openExample(o.ref, browseDevice.id)} title={o.note}
                            className={`rounded border px-1.5 py-0.5 text-[11px] font-mono transition hover:bg-brand-50 hover:border-brand-300 ${o.source === 'editorial' ? 'border-dashed border-amber-300 text-amber-700' : 'border-gray-200 text-gray-600'}`}>
                            {o.ref.replace(/^.*?\s(\d)/, '$1')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !sel ? (
              <p className="text-sm text-gray-400">Click a device to see what it is and how it works here.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold text-gray-800">{sel.name}</span>
                    {sel.greek && <span className="font-greek text-sm text-gray-500">{sel.greek}</span>}
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium ${GROUP_COLOR[sel.group]}`}>{GROUP_LABEL[sel.group]}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{GROUP_DESC[sel.group]}</p>
                  <p className="text-sm text-gray-700 leading-relaxed mt-1.5">{sel.definition}</p>
                </div>

                {/* the note for this specific occurrence, plus an editorial caveat if needed */}
                {(() => {
                  const occ = sel.occurrences.find(o => o.ref === selected!.ref)
                  return (
                    <div className="space-y-2">
                      {occ?.source === 'editorial' && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                          <span className="font-semibold uppercase tracking-wide">Editorial</span> — editorially identified (AI-assisted, reviewed), not from a printed source.
                        </p>
                      )}
                      {occ?.note && <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5"><b className="font-mono">{selected!.ref}</b> — {occ.note}</p>}
                    </div>
                  )
                })()}

                {/* Bengel's Gnomon on this verse */}
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-brand-500 mb-1">Bengel’s Gnomon · {selected!.ref}</p>
                  {bengel[selected!.ref] ? (
                    <p className="text-xs text-gray-600 leading-relaxed font-greek-mixed">{bengel[selected!.ref]}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No Gnomon note for this verse.</p>
                  )}
                </div>

                {/* other occurrences of this figure */}
                {sel.occurrences.length > 1 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-gray-400 mb-1">Also appears in</p>
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
        </div>
      )}

      {/* Greek parsing pane at the bottom — the shared component (Strong's → Thayer's /
          Mounce / Abbott-Smith / LSJ), fed by hovering/clicking a Greek word above.
          Shown only for a Greek edition; defaults to the passage's first word. */}
      {status === 'ok' && isGreek && (
        <ResizableParsingPane storageKey="rhetoric" info={selectedInfo ?? defaultParsingInfo} bgClass="bg-gray-50" />
      )}
    </div>
  )
}
