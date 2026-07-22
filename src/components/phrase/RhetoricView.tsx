'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DEVICES, GROUP_LABEL, GROUP_COLOR, type Device, type DeviceGroup } from '@/lib/rhetoric-devices'

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
      else if (!ex.note && o.note) ex.note = o.note
    }
  }
  return Array.from(byId.values())
}

const SOURCE_ATTR = 'Figures classified after E. W. Bullinger, Figures of Speech Used in the Bible (1898). '
  + 'Verse notes: Bengel’s Gnomon of the New Testament (1742; Eng. tr. 1857), via Biblehub. Both public domain.'

type Hit = { device: Device; note?: string; ref: string }   // ref = the exact occurrence ref (Bengel key)

export function RhetoricView({ controlledPassage, onAttribution }: {
  controlledPassage?: string
  isAuthenticated?: boolean
  onAttribution?: (a: string) => void
}) {
  const parsed = useMemo(() => parseRef(controlledPassage ?? ''), [controlledPassage])
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'missing' | 'nonNT'>('idle')
  const [bengel, setBengel] = useState<Record<string, string>>(bengelCache ?? {})
  const [bookDevices, setBookDevices] = useState<Device[]>(() => bookCache[parseRef(controlledPassage ?? '')?.osis ?? ''] ?? [])
  const [selected, setSelected] = useState<{ id: string; ref: string } | null>(null)
  const reqRef = useRef(0)

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

  useEffect(() => {
    setSelected(null)
    if (!controlledPassage?.trim()) { setStatus('idle'); return }
    if (!parsed) { setStatus('nonNT'); setVerses([]); return }
    const id = ++reqRef.current
    setStatus('loading')
    fetch(`/data/gnt/${parsed.osis}_${parsed.chapter}.json`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: { verses?: { verse: number; text: string }[] }) => {
        if (id !== reqRef.current) return
        setVerses((d.verses ?? []).map(v => ({ verse: v.verse, text: v.text })))
        setStatus('ok')
      })
      .catch(() => { if (id === reqRef.current) { setVerses([]); setStatus('missing') } })
  }, [controlledPassage, parsed])

  // Devices occurring in this chapter, indexed by verse.
  const byVerse = useMemo(() => {
    const map: Record<number, Hit[]> = {}
    if (!parsed) return map
    for (const device of allDevices) {
      for (const occ of device.occurrences) {
        const p = parseRef(occ.ref)
        if (p && p.osis === parsed.osis && p.chapter === parsed.chapter) {
          (map[p.vStart] ||= []).push({ device, note: occ.note, ref: occ.ref })
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
  const groupsPresent = useMemo(() => {
    const s = new Set<DeviceGroup>()
    for (const hits of Object.values(byVerse)) for (const h of hits) s.add(h.device.group)
    return Array.from(s)
  }, [byVerse])
  const versesWithDevices = shownVerses.filter(v => byVerse[v.verse]?.length)

  const sel = selected && deviceById(selected.id)

  return (
    <div className="h-full flex flex-col min-h-0">
      {status === 'idle' && <p className="text-gray-400 text-sm mt-6 text-center">Enter a New Testament passage to see its rhetorical figures.</p>}
      {status === 'nonNT' && <p className="text-gray-500 text-sm mt-6 text-center">Rhetoric data covers the <b>New Testament</b>. Try e.g. <span className="font-medium">Romans 8:31-39</span>.</p>}
      {status === 'loading' && <p className="text-gray-400 text-sm mt-6 text-center">Loading…</p>}
      {status === 'missing' && <p className="text-gray-500 text-sm mt-6 text-center">Couldn’t load {parsed?.name} {parsed?.chapter}.</p>}

      {status === 'ok' && (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* Column 1 — the passage */}
          <div className="min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{parsed!.name} {parsed!.chapter}</p>
            <div className="space-y-1.5 font-greek text-[1.05rem] leading-relaxed">
              {shownVerses.map(v => {
                const has = byVerse[v.verse]?.length
                return (
                  <p key={v.verse} className={has ? 'rounded px-1 -mx-1 bg-amber-50/40' : ''}>
                    <sup className="text-[0.6rem] font-sans font-semibold text-gray-500 mr-1 align-super">{v.verse}</sup>
                    {v.text}
                  </p>
                )
              })}
            </div>
          </div>

          {/* Column 2 — devices present, per verse */}
          <div className="min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Devices present</p>
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
                            className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium transition ${GROUP_COLOR[h.device.group]} ${on ? 'ring-2 ring-brand-400' : 'hover:brightness-95'}`}
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
            {/* group legend */}
            {groupsPresent.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                {groupsPresent.map(g => (
                  <span key={g} className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium ${GROUP_COLOR[g]}`}>{GROUP_LABEL[g]}</span>
                ))}
              </div>
            )}
          </div>

          {/* Column 3 — explanation of the selected device + Bengel */}
          <div className="min-h-0 overflow-y-auto rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Explanation</p>
            {!sel ? (
              <p className="text-sm text-gray-400">Click a device to see what it is and how it works here.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold text-gray-800">{sel.name}</span>
                    {sel.greek && <span className="font-greek text-sm text-gray-500">{sel.greek}</span>}
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium ${GROUP_COLOR[sel.group]}`}>{GROUP_LABEL[sel.group]}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mt-1.5">{sel.definition}</p>
                </div>

                {/* the note for this specific occurrence */}
                {(() => {
                  const occ = sel.occurrences.find(o => o.ref === selected!.ref)
                  return occ?.note ? <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5"><b className="font-mono">{selected!.ref}</b> — {occ.note}</p> : null
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
    </div>
  )
}
