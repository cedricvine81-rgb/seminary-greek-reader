'use client'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { X } from 'lucide-react'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { PhraseFontSize } from './PhraseExplorer'

// Text-size control — same scale as the Phrasing tab (shares its type/values so the
// shared exegesis tools menu can drive both with one slider implementation).
type SynFontSize = PhraseFontSize
const FONT_SIZE_MAP: Record<SynFontSize, string> = { sm: '1.05rem', md: '1.25rem', lg: '1.45rem', xl: '1.7rem' }

type RefBook = { osisId: string; name: string; abbrev: string; totalChapters: number }

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
type WordToken = { surface: string; parsing: string; lemma: string; gloss?: string; strongs?: string }
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
  // Clear any clicked-word selection when the anchor passage changes, so the pane falls
  // back to the new passage's default word instead of showing a stale selection.
  useEffect(() => { setSelectedInfo(null); setSelectedKey(null) }, [controlledPassage])
  const cache = useRef<Record<string, Record<string, string>>>({})  // version → verseId → text
  // Greek word-level tokens (surface + parse) for the clickable parsing pane.
  const wordCache = useRef<Record<string, Record<string, WordToken[]>>>({})  // version → verseId → tokens
  // The word whose lexical detail is shown in the parsing pane, plus a key identifying
  // its exact instance (so highlighting doesn't light up every occurrence of a word).
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const loaded = useRef<Set<string>>(new Set())
  const [, setVer] = useState(0)
  const bump = () => setVer(v => v + 1)

  const anchor = (controlledPassage ?? '').trim()
  const columns = [anchor, ...extraRefs].filter(Boolean)

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
    fetch('/api/reader?corpus=GNT').then(r => r.json()).then(d => setBooks(d.books ?? [])).catch(() => {})
    fetch('/data/gospel-parallels.json').then(r => r.json()).then((d: { attribution?: string; pericopes?: Record<string, string>[] }) => {
      setPericopes(d.pericopes ?? [])
      setParallelsAttribution(d.attribution ?? '')
    }).catch(() => {})
    fetch('/data/nt-parallels.json').then(r => r.json()).then((d: { attribution?: string; parallels?: { title: string; refs: string[] }[] }) => {
      setNtParallels(d.parallels ?? [])
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
  const parallelsLabel = bestGospel ? 'Gospel parallels' : 'Parallel passages'
  // Chips offer to re-add any parallel the user has removed.
  const suggestionChips = best ? best.refs.filter(r => !columns.includes(r)) : []

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

  const addRef = () => {
    const raw = addInput.trim()
    if (!raw) return
    if (!parseRef(raw, books)) { setAddError(true); return }
    setExtraRefs(r => [...r, raw])
    setAddInput(''); setAddError(false)
  }

  const isGreek = version === 'gnt' || version === 'na1904'

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
              className="inline-flex items-center gap-1 rounded-none border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs text-brand-700 hover:bg-brand-100"
            >
              + {r}
            </button>
          ))}
        </div>
      )}

      {!anchor ? (
        <p className="text-sm text-gray-400 italic">Enter a passage above to anchor the synopsis.</p>
      ) : (
        // Capped height with its own scroll (rather than letting the page grow), so a
        // long passage can't push the parsing pane below the fold — it stays visible
        // right after the columns without the user needing to scroll to find it.
        <div className="flex gap-4 overflow-x-auto max-h-[48vh] pb-2" style={{ '--syn-fs': FONT_SIZE_MAP[fontSize] } as CSSProperties}>
          {columns.map((ref, i) => {
            const col = column(ref)
            return (
              <div key={i} className="w-72 shrink-0 rounded-xl border border-gray-200 p-3 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2 gap-2 shrink-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{col?.label ?? ref}{i === 0 && <span className="ml-1 text-[10px] font-normal text-brand-600 uppercase tracking-wide">anchor</span>}</p>
                  {i > 0 && (
                    <button onClick={() => setExtraRefs(r => r.filter((_, j) => j !== i - 1))} className="text-gray-400 hover:text-red-600 shrink-0" title="Remove column"><X size={14} /></button>
                  )}
                </div>
                {i === 0 && (
                  <select
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                    className="mb-2 w-full shrink-0 rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    {VERSIONS.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
                  </select>
                )}
                {col && col.verses.length > 0 ? (
                  <div
                    className={`flex-1 min-h-0 overflow-y-auto space-y-1 leading-relaxed ${isGreek ? 'font-greek text-gray-900' : 'font-reading text-gray-700'}`}
                    style={{ fontSize: isGreek ? 'var(--syn-fs, 1.45rem)' : 'calc(var(--syn-fs, 1.45rem) * 0.82)' }}
                  >
                    {col.verses.map(v => (
                      <p key={v.ref}>
                        {isAuthenticated && (
                          <span className="font-sans align-middle mr-0.5"><VerseNoteButton book={col.book} chapter={col.chapter} verse={v.verse} noted={notedKeys.has(`${col.book}.${col.chapter}.${v.verse}`)} onChanged={refreshNotes} /></span>
                        )}
                        <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{v.ref.split(':')[1]}</sup>
                        {/* Greek: hovering (or clicking, for touch) a word updates the parsing
                            pane below — same interaction as the Phrasing tab. Falls back to
                            plain text if word-level tokens haven't loaded (or aren't available). */}
                        {isGreek && v.tokens && v.tokens.length > 0
                          ? v.tokens.map((tok, ti) => {
                              const key = `${col.book}.${col.chapter}.${v.verse}.${ti}`
                              const select = () => { setSelectedInfo(toLexicalInfo(tok, col.bookName, v.ref)); setSelectedKey(key) }
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
            <button onClick={addRef} className="mt-2 w-full rounded-none bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">Add</button>
            {addError && <p className="text-xs text-red-500 mt-1">Couldn&rsquo;t parse that reference.</p>}
          </div>
        </div>
      )}

      {/* Parsing pane — the same shared component used on the Phrasing tab (Strong's,
          Thayer's, Mounce, Abbott-Smith, LSJ). Always visible for a Greek edition so its
          presence is obvious; defaults to the anchor's first word until one is hovered or
          clicked. Placed in normal flow directly under the columns (not sticky/overlaid),
          so the text ends cleanly above it instead of the pane floating over it. */}
      {isGreek && (
        <ParsingPanel info={selectedInfo ?? defaultParsingInfo} bgClass="bg-gray-50" />
      )}
    </div>
  )
}
