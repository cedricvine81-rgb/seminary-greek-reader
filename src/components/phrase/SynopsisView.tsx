'use client'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

type RefBook = { osisId: string; name: string; abbrev: string; totalChapters: number }

/** Parse "John 1:1-5" against the book list (mirror of the other tools' parser). */
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

/**
 * Synopsis: the shared (coordinated) passage as the anchor column, plus comparison
 * references the user adds, all shown side by side in a chosen version (Greek edition
 * or translation). Auto-suggested gospel parallels are a planned follow-up.
 */
export function SynopsisView({ controlledPassage }: { controlledPassage?: string }) {
  const [books, setBooks] = useState<RefBook[]>([])
  const [version, setVersion] = useState('bsb')
  const [extraRefs, setExtraRefs] = useState<string[]>([])
  const [addInput, setAddInput] = useState('')
  const [addError, setAddError] = useState(false)
  const [pericopes, setPericopes] = useState<Record<string, string>[]>([])
  const [parallelsAttribution, setParallelsAttribution] = useState('')
  const cache = useRef<Record<string, Record<string, string>>>({})  // version → verseId → text
  const loaded = useRef<Set<string>>(new Set())
  const [, setVer] = useState(0)
  const bump = () => setVer(v => v + 1)

  const anchor = (controlledPassage ?? '').trim()
  const columns = [anchor, ...extraRefs].filter(Boolean)

  useEffect(() => {
    fetch('/api/reader?corpus=GNT').then(r => r.json()).then(d => setBooks(d.books ?? [])).catch(() => {})
    fetch('/data/gospel-parallels.json').then(r => r.json()).then((d: { attribution?: string; pericopes?: Record<string, string>[] }) => {
      setPericopes(d.pericopes ?? [])
      setParallelsAttribution(d.attribution ?? '')
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
  const best = computeBest(anchor)
  // Chips offer to re-add any parallel the user has removed.
  const suggestionChips = best ? best.refs.filter(r => !columns.includes(r)) : []

  // Auto-load the parallels as columns when the anchor passage changes.
  useEffect(() => {
    const b = computeBest(anchor)
    setExtraRefs(b ? b.refs : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, books, pericopes])

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
      type Node = { t: string; id?: string; w?: string; c?: Node[] }
      fetch(`/data/phrase-tree/${osis}.json`).then(r => r.json()).then((d: { sentences?: { tree: Node }[] }) => {
        const byVerse: Record<string, { i: number; w: string }[]> = {}
        const walk = (n: Node) => {
          if (n.t === 'w' && n.id) {
            const [bk, ch, vs, wd] = n.id.split('.')
            ;(byVerse[`${bk}.${ch}.${vs}`] ??= []).push({ i: parseInt(wd || '0', 10), w: n.w ?? '' })
          } else (n.c ?? []).forEach(walk)
        }
        for (const s of d.sentences ?? []) walk(s.tree)
        const patch: Record<string, string> = {}
        for (const [vKey, ws] of Object.entries(byVerse)) { ws.sort((a, b) => a.i - b.i); patch[vKey] = ws.map(x => x.w).join(' ') }
        done((cache.current.na1904 ??= {}), patch)
      }).catch(() => {})
    } else if (v === 'gnt') {
      fetch(`/data/gnt/${osis}_${chapter}.json`).then(r => r.json()).then((d: { verses?: { verse: number; text: string }[] }) => {
        const map = (cache.current.gnt ??= {})
        done(map, Object.fromEntries((d.verses ?? []).map(x => [`${osis}.${chapter}.${x.verse}`, x.text])))
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

  function column(ref: string): { label: string; verses: { ref: string; text: string }[] } | null {
    const p = parseRef(ref, books)
    if (!p) return null
    const map = cache.current[version] ?? {}
    const verses: { ref: string; text: string }[] = []
    for (let v = p.verseStart; v <= p.verseEnd; v++) {
      const t = map[`${p.book.osisId}.${p.chapter}.${v}`]
      if (t) verses.push({ ref: `${p.chapter}:${v}`, text: t })
    }
    const label = `${p.book.name} ${p.chapter}:${p.verseStart}${p.verseEnd !== p.verseStart ? `–${verses.length ? verses[verses.length - 1].ref.split(':')[1] : p.verseEnd}` : ''}`
    return { label, verses }
  }

  const addRef = () => {
    const raw = addInput.trim()
    if (!raw) return
    if (!parseRef(raw, books)) { setAddError(true); return }
    setExtraRefs(r => [...r, raw])
    setAddInput(''); setAddError(false)
  }

  const isGreek = version === 'gnt' || version === 'na1904'

  return (
    <div className="space-y-4">
      <div className="flex items-center flex-wrap gap-3">
        <label className="text-sm font-medium text-gray-700">Version</label>
        <select
          value={version}
          onChange={e => setVersion(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {VERSIONS.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
        </select>
      </div>

      {/* Matched pericope + auto-loaded parallels. Removed columns can be re-added here. */}
      {best && (
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs font-medium text-gray-500">Gospel parallels — <span className="text-gray-700">{best.title}</span></span>
          {suggestionChips.map(r => (
            <button
              key={r}
              onClick={() => setExtraRefs(prev => prev.includes(r) ? prev : [...prev, r])}
              className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs text-brand-700 hover:bg-brand-100"
            >
              + {r}
            </button>
          ))}
        </div>
      )}

      {!anchor ? (
        <p className="text-sm text-gray-400 italic">Enter a passage above to anchor the synopsis.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((ref, i) => {
            const col = column(ref)
            return (
              <div key={i} className="w-72 shrink-0 rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-sm font-semibold text-gray-700 truncate">{col?.label ?? ref}{i === 0 && <span className="ml-1 text-[10px] font-normal text-brand-600 uppercase tracking-wide">anchor</span>}</p>
                  {i > 0 && (
                    <button onClick={() => setExtraRefs(r => r.filter((_, j) => j !== i - 1))} className="text-gray-400 hover:text-red-600 shrink-0" title="Remove column"><X size={14} /></button>
                  )}
                </div>
                {col && col.verses.length > 0 ? (
                  <div className={`space-y-1 text-sm ${isGreek ? 'font-greek text-gray-900 text-base leading-relaxed' : 'text-gray-700 leading-relaxed'}`}>
                    {col.verses.map(v => (
                      <p key={v.ref}><sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{v.ref.split(':')[1]}</sup>{v.text}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 italic">Loading…</p>
                )}
              </div>
            )
          })}

          {/* Add a comparison column */}
          <div className="w-60 shrink-0 rounded-xl border border-dashed border-gray-300 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Add a passage to compare</p>
            <input
              type="text"
              value={addInput}
              onChange={e => { setAddInput(e.target.value); if (addError) setAddError(false) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRef() } }}
              placeholder="e.g. Mark 1:9-11"
              className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 ${addError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-brand-400'}`}
            />
            <button onClick={addRef} className="mt-2 w-full rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">Add</button>
            {addError && <p className="text-xs text-red-500 mt-1">Couldn&rsquo;t parse that reference.</p>}
          </div>
        </div>
      )}

      {parallelsAttribution && (
        <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">{parallelsAttribution}</p>
      )}
    </div>
  )
}
