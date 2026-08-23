'use client'
import { createContext, useContext, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
import { PassageAutocomplete } from './PassageAutocomplete'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { openWordSearch } from '@/lib/word-search-bus'
import { useHighlights } from '@/components/highlights/useHighlights'
import { highlightAt } from '@/components/highlights/render'
import { highlightMarkClass } from '@/lib/highlight-colors'
import { formatParsing } from '@/lib/morph-formatting'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { hebrewizeInfo, loadHebrewLexicon, type HebrewLexicon } from '@/lib/hebrew-lexicon'
import { DiagramCanvas, type DiagramData } from './DiagramCanvas'
import { usePref } from '@/lib/use-pref'
import { Printer } from 'lucide-react'

// One node of the Macula phrase/clause tree (see scripts/import-macula-phrase-tree.js).
// Exported for the DiagramCanvas, which renders the same word nodes as draggable chips.
export type WordNodeT = { t: 'w'; id: string; w: string; gloss?: string; lemma?: string; morph?: string; role?: string; cls?: string; strongs?: string; parsing?: string }
type TreeNode =
  | { t: 'g'; cls?: string; role?: string; rule?: string; c: TreeNode[] }
  | WordNodeT

// Lets the recursively-rendered words report clicks + know if they're selected,
// without threading callbacks through every tree level. Exported so the DiagramCanvas's
// chips drive the same parsing pane.
export const WordCtx = createContext<{ selectedId: string | null; onWord: (n: WordNodeT) => void }>({ selectedId: null, onWord: () => {} })

// Highlighting for the running Greek column: the highlighter instance + auth flag, so a
// GreekColWord (given its verse + character offsets) can render its mark and set/clear it.
type Highlighter = ReturnType<typeof useHighlights>
const HlCtx = createContext<{ hl: Highlighter | null; isAuth: boolean }>({ hl: null, isAuth: false })

interface Sentence { ref: string; chapter: number; startVerse: number; endVerse: number; tree: TreeNode }
interface BookData { book: string; attribution: string; sentences: Sentence[] }

type RefBook = { osisId: string; name: string; abbrev: string; totalChapters: number; corpus?: string }

/** Parse a reference like "John 1:1-5" against the book list (mirrors the Reader/Exegesis parser). */
function parseRef(ref: string, books: RefBook[]): { osisId: string; chapter: number; verseStart: number; verseEnd: number } | null {
  const q = ref.trim().replace(/[–—]/g, '-')
  const m = q.match(/^((?:\d\s*)?\w[\w\s]*?)\s+(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?(?:\s*-\s*(\d+))?$/)
  if (!m) return null
  const bookPart = m[1].trim().toLowerCase().replace(/\s+/g, '')
  const chapter = parseInt(m[2]); const vs = m[3] ? parseInt(m[3]) : 1; const ve = m[4] ? parseInt(m[4]) : (m[3] ? vs : 999)
  const dashEnd = m[5] ? parseInt(m[5]) : undefined   // bare "N-M" verse range (single-chapter books)
  const book = books.find(b => [b.osisId, b.name, b.abbrev].some(s => {
    const c = s.toLowerCase().replace(/\s+/g, ''); return c === bookPart || c.startsWith(bookPart) || bookPart.startsWith(c.slice(0, Math.max(3, bookPart.length)))
  }))
  if (!book) return null
  // Single-chapter books (Jude, Obadiah, …): bare numbers are verses of ch.1, "14-15" a range.
  if (book.totalChapters === 1 && !m[3]) return { osisId: book.osisId, chapter: 1, verseStart: chapter, verseEnd: dashEnd ?? chapter }
  return { osisId: book.osisId, chapter, verseStart: vs, verseEnd: ve }
}

// Human labels for the syntactic group classes/roles Macula uses.
const CLASS_LABEL: Record<string, string> = {
  cl: 'Clause', pp: 'Prepositional phrase', np: 'Noun phrase', vp: 'Verb phrase',
  adjp: 'Adjective phrase', advp: 'Adverbial phrase',
  // Macula Hebrew adds these:
  nump: 'Numeral phrase', cjp: 'Conjunction', ijp: 'Interjection', relp: 'Relative',
}
const ROLE_LABEL: Record<string, string> = {
  s: 'Subject', v: 'Verb', vc: 'Verb (copula)', o: 'Object', o2: 'Second object',
  io: 'Indirect object', p: 'Complement', adv: 'Adverbial', apposition: 'Apposition',
  pp: 'Prepositional', aj: 'Adjunct',
}
const label = (m: Record<string, string>, k?: string) => (k ? (m[k] ?? k) : '')

/** A group node: collapsible box with its clause/phrase label; words render as leaves. */
function GroupNode({ node, depth }: { node: Extract<TreeNode, { t: 'g' }>; depth: number }) {
  const cls = label(CLASS_LABEL, node.cls)
  const role = label(ROLE_LABEL, node.role)
  const isClause = node.cls === 'cl'
  // Only the meaningful, named groups get a labelled box; bare structural wrappers
  // just pass their children through so the tree isn't a wall of empty boxes.
  const named = !!(cls || role)
  if (!named) return <>{node.c.map((c, i) => <NodeView key={i} node={c} depth={depth} />)}</>

  return (
    <details open className="mt-1">
      <summary className={`cursor-pointer select-none text-xs font-semibold uppercase tracking-wide ${isClause ? 'text-brand-700' : 'text-gray-500'}`}>
        {cls || 'Group'}{role && <span className="ml-1 font-normal normal-case text-gray-400">· {role}</span>}
      </summary>
      {/* Logical-property spacing (ms/ps/border-s), so the indent mirrors under dir="rtl". */}
      <div className={`ms-3 mt-1 border-s-2 ps-3 ${isClause ? 'border-brand-200' : 'border-gray-200'}`}>
        {node.c.map((c, i) => <NodeView key={i} node={c} depth={depth + 1} />)}
      </div>
    </details>
  )
}

/** A word leaf: Greek surface + gloss. Hover (or click, for touch) to show its lexical detail below. */
function WordNode({ node }: { node: WordNodeT }) {
  const { selectedId, onWord } = useContext(WordCtx)
  const active = selectedId === node.id
  return (
    <button
      type="button"
      onMouseEnter={() => onWord(node)}
      onClick={() => onWord(node)}
      onContextMenu={e => { e.preventDefault(); const [b, ch, v] = node.id.split('.'); openWordSearch({ x: e.clientX, y: e.clientY, surface: node.w, lemma: node.lemma ?? null, reference: b && ch && v ? `${b} ${ch}:${v}` : undefined, ...(hasHebrew(node.w) ? { kind: 'hebrew' as const } : { kind: 'greek' as const, greekCorpus: 'GNT' as const }) }) }}
      title={[node.lemma && `lemma: ${node.lemma}`, node.morph && `morph: ${node.morph}`, node.role && `role: ${node.role}`].filter(Boolean).join('\n')}
      className={`inline-flex flex-col items-start me-3 mb-1 align-top rounded px-1 -mx-1 transition-colors ${active ? 'bg-brand-100' : 'hover:bg-gray-100'}`}
    >
      <span className={`${hasHebrew(node.w) ? 'font-hebrew' : 'font-greek'} text-gray-900 leading-tight`} style={{ fontSize: 'var(--phrase-fs, 1.45rem)' }}>{node.w}</span>
      {node.gloss && <span className="text-gray-400 leading-tight" style={{ fontSize: 'calc(var(--phrase-fs, 1.45rem) * 0.6)' }}>{node.gloss}</span>}
    </button>
  )
}

function NodeView({ node, depth }: { node: TreeNode; depth: number }) {
  if (node.t === 'w') return <WordNode node={node} />
  // Words directly under a group flow inline; nested groups stack.
  return <GroupNode node={node} depth={depth} />
}

// Re-exported from lib/reading-language.ts, which the Reader and the Settings picker also
// read. This was a hand-maintained copy of the Reader's list and had already drifted from it.
export { READING_LANGS as LANGS } from '@/lib/reading-language'
import { READING_LANGS as LANGS, defaultReadingLang } from '@/lib/reading-language'
import { hasHebrew } from '@/lib/script-detect'
const langLabel = (code: string, t: (k: string) => string) => {
  const l = LANGS.find(x => x.code === code)
  return l ? t(l.labelKey) : code
}

// Greek editions for the middle column (the tree itself is Nestle 1904).
const GREEK_EDITIONS = [
  { code: 'na1904', label: 'Greek — Nestle 1904' },
  { code: 'gnt', label: 'Greek — Tischendorf' },
]
// For an OT passage the middle column IS the tree's text — the Westminster Leningrad
// Codex — and there is no second edition to offer.
const HEBREW_EDITIONS = [{ code: 'na1904', label: 'Hebrew — Leningrad (WLC)' }]
const greekLabel = (code: string, hebrew = false) =>
  (hebrew ? HEBREW_EDITIONS : GREEK_EDITIONS).find(g => g.code === code)?.label ?? code

// Adjustable Greek text size (default larger than before). Children scale off the
// --phrase-fs CSS variable set on the container.
export type PhraseFontSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export const FONT_SIZES: PhraseFontSize[] = ['sm', 'md', 'lg', 'xl', '2xl', '3xl']
// Exported so other reading surfaces (e.g. the Search results) share the same size steps.
export const FONT_SIZE_MAP: Record<PhraseFontSize, string> = {
  sm: '1.05rem', md: '1.25rem', lg: '1.45rem', xl: '1.7rem', '2xl': '2.1rem', '3xl': '2.6rem',
}

/** Static "Sources & copyright" content for the Phrasing tab's settings menu. */
export function PhrasingSourcesPanel() {
  const t = useT()
  return (
    <details className="border-t border-gray-100 pt-2">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-gray-500">{t('phr.sourcesCopyright')}</summary>
      <div className="space-y-3 text-xs text-gray-600 mt-2">
        <div>
          <p className="font-semibold text-gray-700">{t('phr.greekTextSyntax')}</p>
          <p className="mt-0.5">
            Syntax trees: MACULA Greek Linguistic Datasets over the Nestle 1904 Greek New Testament (public domain),
            licensed <span className="font-medium">CC BY 4.0</span>.{' '}
            <a href="https://github.com/Clear-Bible/macula-greek" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Clear-Bible/macula-greek</a>
          </p>
          <p className="mt-1">Greek editions: Nestle 1904 and Tischendorf (8th ed.) — both public domain.</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">Hebrew text &amp; syntax</p>
          <p className="mt-0.5">
            Syntax trees: MACULA Hebrew Linguistic Datasets over the Westminster Leningrad Codex (public domain),
            licensed <span className="font-medium">CC BY 4.0</span>.{' '}
            <a href="https://github.com/Clear-Bible/macula-hebrew" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Clear-Bible/macula-hebrew</a>
          </p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">{t('phr.translations')}</p>
          <ul className="mt-0.5 space-y-0.5">
            {LANGS.map(l => (
              <li key={l.code}><span className="text-gray-700">{t(l.labelKey)}</span> — {t(l.subKey)}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-700">{t('phr.gospelParallels')}</p>
          <p className="mt-0.5">{t('phr.wikipediaAttr')}</p>
        </div>
        <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
          All sources are public-domain or openly licensed, used with attribution.
        </p>
      </div>
    </details>
  )
}

function OptionSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { code: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      {options.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
    </select>
  )
}

/** "John.1.3.5" → "John 1:3" for the lexical panel's reference line. */
function refFromId(id: string): string {
  const [book, ch, v] = id.split('.')
  return book && ch && v ? `${book} ${ch}:${v}` : id
}

/** Collect a sentence's Greek words (Nestle 1904) in order from its tree. */
function treeGreek(node: TreeNode): string {
  if (node.t === 'w') return node.w
  return node.c.map(treeGreek).filter(Boolean).join(' ')
}

/** Collect the word nodes (in order) so the Greek column can render clickable words. */
function treeWords(node: TreeNode): WordNodeT[] {
  if (node.t === 'w') return [node]
  return node.c.flatMap(treeWords)
}

/** A Greek word in the running-text column → hover (or click, for touch) opens the lexical
 *  panel; right-click opens the word menu (with highlighting when signed in). `book/chapter/
 *  verse/start/end` are the word's highlight anchor (character offsets within its verse). */
function GreekColWord({ node, book, chapter, verse, start, end }: {
  node: WordNodeT; book?: string; chapter?: number; verse?: number; start?: number; end?: number
}) {
  const { selectedId, onWord } = useContext(WordCtx)
  const { hl: highlights, isAuth } = useContext(HlCtx)
  const canHl = !!highlights && book != null && chapter != null && verse != null && start != null && end != null
  const mark = canHl ? highlightAt(start!, end!, highlights!.forVerse(book!, chapter!, verse!, 'grc')) : undefined
  return (
    <button
      type="button"
      onMouseEnter={() => onWord(node)}
      onClick={() => onWord(node)}
      onContextMenu={e => {
        e.preventDefault()
        const [b, ch, v] = node.id.split('.')
        openWordSearch({
          x: e.clientX, y: e.clientY, surface: node.w, lemma: node.lemma ?? null,
          reference: b && ch && v ? `${b} ${ch}:${v}` : undefined, kind: 'greek', greekCorpus: 'GNT',
          highlight: isAuth && canHl ? {
            activeColor: mark?.color ?? null,
            onPick: c => mark ? void highlights!.recolor(mark.id, book!, chapter!, c) : void highlights!.create(book!, chapter!, verse!, start!, end!, c, 'grc'),
            onRemove: () => { if (mark) void highlights!.remove(mark.id, book!, chapter!) },
          } : undefined,
        })
      }}
      {...(mark ? { 'data-highlight-id': mark.id, 'data-hl-book': book, 'data-hl-chapter': chapter, 'data-hl-color': mark.color } : {})}
      className={`rounded px-0.5 transition-colors hover:bg-gray-100 ${selectedId === node.id ? 'bg-brand-100' : mark ? highlightMarkClass(mark.color) : ''}`}
    >
      {node.w}
    </button>
  )
}

export function PhraseExplorer({ controlledPassage, isAuthenticated = false, fontSize: controlledFontSize, onFontSize }: {
  controlledPassage?: string
  isAuthenticated?: boolean
  fontSize?: PhraseFontSize
  onFontSize?: (v: PhraseFontSize) => void
} = {}) {
  const t = useT()
  const locale = useLocale()
  const [books, setBooks] = useState<RefBook[]>([])
  const [input, setInput] = useState('John 1:1-5')
  const [inputError, setInputError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shown, setShown] = useState<Sentence[]>([])
  const [message, setMessage] = useState('')
  // The Greek word whose lexical detail is shown in the panel below.
  const [selected, setSelected] = useState<WordNodeT | null>(null)
  // Hebrew lexicon for OT passages: without it (and the hebrewize step) the pane treated a
  // Hebrew Strong's number as Greek — Thayer's-on-the-wrong-word territory.
  const hebLexRef = useRef<HebrewLexicon | null>(null)
  useEffect(() => { loadHebrewLexicon().then(l => { hebLexRef.current = l }).catch(() => {}) }, [])
  const selectedInfo: LexicalInfoPanel | null = selected ? hebrewizeInfo({
    surface: selected.w,
    lexeme: selected.lemma ?? '',
    gloss: selected.gloss ?? '',
    partOfSpeech: '',
    parsing: selected.parsing ?? '',
    strongs: selected.strongs,
    reference: refFromId(selected.id),
  }, hebLexRef.current) : null
  // True when the selected word belongs to this sentence (so its card shows the panel).
  const selInSentence = (s: Sentence): boolean => {
    if (!selected) return false
    const [, ch, v] = selected.id.split('.')
    return Number(ch) === s.chapter && Number(v) >= s.startVerse && Number(v) <= s.endVerse
  }
  const infoFor = (w: WordNodeT): LexicalInfoPanel => hebrewizeInfo({
    surface: w.w,
    lexeme: w.lemma ?? '',
    gloss: w.gloss ?? '',
    partOfSpeech: '',
    parsing: w.parsing ?? '',
    strongs: w.strongs,
    reference: refFromId(w.id),
  }, hebLexRef.current)
  // The parsing box always shows something so users know it's there: the clicked
  // word if one is selected in this sentence, otherwise the verse's first word.
  const panelInfo = (s: Sentence): LexicalInfoPanel | null => {
    if (selInSentence(s)) return selectedInfo
    const first = greekWordsFor(s)[0]
    return first ? infoFor(first) : null
  }
  const cache = useRef<Record<string, BookData>>({})

  // Middle column = a Greek edition; right column = a modern translation.
  // The Greek edition is a scholarly choice and stays put; the translation follows the
  // reader's language, falling back to English where there is no edition in it.
  const [greekEd, setGreekEd] = useState('na1904')
  const [transLang, setTransLang] = useState(() => defaultReadingLang(locale) === 'en' ? 'bsb' : defaultReadingLang(locale))
  const [cur, setCur] = useState<{ osis: string; chapter: number; hebrew?: boolean } | null>(null)
  // Hebrew books have exactly one text (the WLC in the tree), so the Greek-edition choice
  // is pinned to the from-the-tree code while an OT passage is shown.
  const effEd = cur?.hebrew ? 'na1904' : greekEd
  // Text highlights for the running Greek column (signed-in users).
  const highlights = useHighlights(isAuthenticated)
  useEffect(() => {
    if (isAuthenticated && cur) void highlights.loadFor(cur.osis, cur.chapter)
  }, [isAuthenticated, cur, highlights.loadFor])
  // Per-verse personal notes (signed-in users).
  const [notedVerses, setNotedVerses] = useState<Set<number>>(new Set())
  const refreshNotes = useCallback(async () => {
    if (!isAuthenticated || !cur) { setNotedVerses(new Set()); return }
    try {
      const r = await fetch(`/api/notes?book=${cur.osis}&chapter=${cur.chapter}&verseStart=1&verseEnd=200`)
      const d = await r.json()
      setNotedVerses(new Set((d.notes ?? []).map((n: { verse: number }) => n.verse)))
    } catch { /* ignore */ }
  }, [isAuthenticated, cur])
  useEffect(() => { refreshNotes() }, [refreshNotes])
  useEffect(() => onNotesChanged(refreshNotes), [refreshNotes])
  // Translation text keyed by lang → verseId ("John.1.1") → text, with a version
  // counter to re-render after async loads. `loaded` dedupes fetches.
  const transCache = useRef<Record<string, Record<string, string>>>({})
  // Tischendorf (gnt) words per verseId, so the Greek column can be clickable too.
  const gntWords = useRef<Record<string, WordNodeT[]>>({})
  const loaded = useRef<Set<string>>(new Set())
  const [, setTransVer] = useState(0)
  const bump = () => setTransVer(v => v + 1)

  // Left pane view: the drag-and-drop diagram canvas (default), or the Macula phrase
  // tree. Remembered on this device — instructors tend to live in one mode or the other.
  const [viewMode, setViewMode] = usePref<'tree' | 'diagram'>('phrase-view-mode', ['tree', 'diagram'], 'diagram')

  // Saved diagrams for the current chapter, keyed "verseStart-verseEnd". null while the
  // signed-in fetch is in flight — the canvases wait for it, or they'd seed the default
  // layout and then ignore the saved one (a canvas reads its initialData only on mount).
  const [diagrams, setDiagrams] = useState<Record<string, DiagramData> | null>(null)
  useEffect(() => {
    if (!cur) return
    if (!isAuthenticated) { setDiagrams({}); return }
    setDiagrams(null)
    let alive = true
    fetch(`/api/diagrams?book=${cur.osis}&chapter=${cur.chapter}`)
      .then(r => r.json())
      .then((d: { diagrams?: { verseStart: number; verseEnd: number; data: DiagramData }[] }) => {
        if (!alive) return
        const m: Record<string, DiagramData> = {}
        for (const g of d.diagrams ?? []) m[`${g.verseStart}-${g.verseEnd}`] = g.data
        setDiagrams(m)
      })
      .catch(() => { if (alive) setDiagrams({}) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, isAuthenticated])
  // Signed-out diagrams live in localStorage under the same anchor.
  const localKey = (s: Sentence) => `phrase-diagram:${cur?.osis}.${s.chapter}.${s.startVerse}-${s.endVerse}`
  const readLocal = (s: Sentence): DiagramData | null => {
    if (typeof window === 'undefined') return null
    try { const raw = localStorage.getItem(localKey(s)); return raw ? JSON.parse(raw) as DiagramData : null } catch { return null }
  }
  async function saveDiagram(s: Sentence, data: DiagramData | null) {
    const k = `${s.startVerse}-${s.endVerse}`
    // Keep the in-memory map current so a remount (mode flip, tab switch) restores it.
    setDiagrams(d => {
      const next = { ...(d ?? {}) }
      if (data) next[k] = data; else delete next[k]
      return next
    })
    if (isAuthenticated && cur) {
      if (data) {
        await fetch('/api/diagrams', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ book: cur.osis, chapter: s.chapter, verseStart: s.startVerse, verseEnd: s.endVerse, data }),
        })
      } else {
        await fetch(`/api/diagrams?book=${cur.osis}&chapter=${s.chapter}&verseStart=${s.startVerse}&verseEnd=${s.endVerse}`, { method: 'DELETE' })
      }
    } else {
      try { if (data) localStorage.setItem(localKey(s), JSON.stringify(data)); else localStorage.removeItem(localKey(s)) } catch { /* private mode */ }
    }
  }

  // Text size — the settings/sources panel that used to live here is now hoisted into
  // the shared exegesis tools menu (when coordinated); fontSize becomes controlled then.
  const isFontSizeControlled = onFontSize !== undefined
  const [internalFontSize, setInternalFontSize] = useState<PhraseFontSize>('lg')
  const fontSize = isFontSizeControlled ? (controlledFontSize ?? 'lg') : internalFontSize
  const setFontSize = onFontSize ?? setInternalFontSize

  // Ensure both columns' text is loaded for the current passage's chapter.
  // 'na1904' needs nothing (it comes straight from the tree); 'gnt' is the static
  // Tischendorf chapter file; 'bsb' is the alignment file; others use /api/translation.
  useEffect(() => {
    if (!cur) return
    const { osis, chapter } = cur
    for (const code of Array.from(new Set([effEd, transLang]))) {
      if (code === 'na1904') continue
      const ck = code === 'bsb' ? 'bsb' : `${code}.${osis}.${chapter}`
      if (loaded.current.has(ck)) continue
      loaded.current.add(ck)
      if (code === 'gnt') {
        type GntMorph = { partOfSpeech: string; tense?: string | null; voice?: string | null; mood?: string | null; person?: string | null; number?: string | null; casus?: string | null; gender?: string | null }
        type GntWord = { id: string; surface: string; lemma?: string; strongs?: string; morph?: GntMorph }
        fetch(`/data/gnt/${osis}_${chapter}.json`)
          .then(r => r.json())
          .then((d: { verses?: { verse: number; text: string; words?: GntWord[] }[] }) => {
            const map = (transCache.current.gnt ??= {})
            for (const v of d.verses ?? []) {
              const vid = `${osis}.${chapter}.${v.verse}`
              map[vid] = v.text
              if (v.words) gntWords.current[vid] = v.words.map(w => ({
                t: 'w', id: w.id, w: w.surface, lemma: w.lemma, strongs: w.strongs,
                parsing: w.morph ? formatParsing(w.morph) : '',
              }))
            }
            bump()
          })
          .catch(() => {})
      } else if (code === 'bsb') {
        fetch('/data/bsb-alignment.json?v=3')
          .then(r => r.json())
          .then((d: Record<string, { text: string }>) => {
            const map = (transCache.current.bsb ??= {})
            for (const [vid, val] of Object.entries(d)) map[vid] = val.text
            bump()
          })
          .catch(() => {})
      } else {
        fetch(`/api/translation?book=${osis}&chapter=${chapter}&lang=${code}`)
          .then(r => r.json())
          .then((d: { verses?: Record<string, string> }) => {
            const map = (transCache.current[code] ??= {})
            Object.assign(map, d.verses ?? {})
            bump()
          })
          .catch(() => {})
      }
    }
  }, [cur, effEd, transLang])

  /** Text for a column (Greek edition or translation) over a sentence's verse range. */
  const colText = (code: string, s: Sentence): string => {
    if (code === 'na1904') return treeGreek(s.tree)
    const map = transCache.current[code]
    if (!map) return ''
    const parts: string[] = []
    for (let v = s.startVerse; v <= s.endVerse; v++) {
      const t = map[`${cur?.osis}.${s.chapter}.${v}`]
      if (t) parts.push(t)
    }
    return parts.join(' ')
  }

  /** Clickable Greek words for the middle column (Nestle 1904 from the tree; Tischendorf
   *  from the loaded gnt word data). Empty until gnt words load → caller falls back to text. */
  const greekWordsFor = (s: Sentence): WordNodeT[] => {
    if (effEd === 'na1904') return treeWords(s.tree)
    const out: WordNodeT[] = []
    for (let v = s.startVerse; v <= s.endVerse; v++) {
      const ws = gntWords.current[`${cur?.osis}.${s.chapter}.${v}`]
      if (ws) out.push(...ws)
    }
    return out
  }

  // Load the GNT book list (for reference parsing), then the default passage.
  useEffect(() => {
    // GNT + MT merged: Hebrew phrase trees ship for every OT book, from the same Macula
    // family as the Greek (books.json stamps each book's corpus).
    fetch('/data/books.json')
      .then(r => r.json())
      .then((d) => {
        const bs: RefBook[] = [...(d.gnt ?? []), ...(d.mt ?? [])]
        setBooks(bs)
        // In coordinated mode the shared passage effect below drives loading.
        if (bs.length && controlledPassage === undefined) loadPassage('John 1:1-5', bs)
      })
      .catch(() => setMessage('Could not load the book list.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Coordinated mode: load whatever the shared passage box dictates.
  useEffect(() => {
    if (controlledPassage === undefined || books.length === 0) return
    const raw = controlledPassage.trim()
    if (!raw) return
    setInput(raw)
    loadPassage(raw, books)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledPassage, books])

  async function loadPassage(ref: string, bookList: RefBook[]) {
    const p = parseRef(ref, bookList)
    if (!p) { setInputError(true); return }
    setInputError(false)
    setLoading(true)
    setMessage('')
    try {
      let data = cache.current[p.osisId]
      if (!data) {
        const res = await fetch(`/data/phrase-tree/${p.osisId}.json`)
        if (!res.ok) throw new Error('no data')
        data = await res.json()
        cache.current[p.osisId] = data
      }
      const matches = data.sentences.filter(
        s => s.chapter === p.chapter && s.startVerse <= p.verseEnd && s.endVerse >= p.verseStart,
      )
      setShown(matches)
      setSelected(null)
      setCur({ osis: p.osisId, chapter: p.chapter, hebrew: bookList.find(b => b.osisId === p.osisId)?.corpus === 'MT' })
      if (matches.length === 0) setMessage('No sentences found for that reference.')
    } catch {
      setMessage('No syntax data for that book yet.')
      setShown([])
    } finally {
      setLoading(false)
    }
  }

  const submit = (val: string = input) => { if (books.length) loadPassage(val, books) }

  return (
    <WordCtx.Provider value={{ selectedId: selected?.id ?? null, onWord: setSelected }}>
    <HlCtx.Provider value={{ hl: highlights, isAuth: isAuthenticated }}>
    <div className="space-y-4" style={{ '--phrase-fs': FONT_SIZE_MAP[fontSize] } as CSSProperties}>
      {/* Passage entry (matches the Reader / Exegesis tools). Hidden in coordinated
          mode — a shared passage box drives all tabs, and settings (text size, sources
          & copyright) live in that page's shared tools menu instead of here. */}
      {controlledPassage === undefined && (
        <div className="flex items-center flex-wrap gap-3 print:hidden">
          <div className="flex items-center">
            <span className="px-3 py-1.5 rounded-l-lg bg-brand-600 text-white text-sm font-medium">{t('exeg.passage')}</span>
            <PassageAutocomplete
              value={input}
              onChange={v => { setInput(v); if (inputError) setInputError(false) }}
              onCommit={v => submit(v)}
              commitOnBlur
              error={inputError}
              placeholder={t('exeg.refPlaceholder')}
              inputClassName="border border-gray-300 rounded-l-none rounded-r-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {loading && <span className="text-sm text-gray-400">{t('reader.loading')}</span>}
          {inputError && <span className="text-xs text-red-500">{t('exeg.refNotFound')}</span>}
        </div>
      )}

      {/* Header row: view toggle (diagram ⇄ tree) top-left; (Greek edition + translation)
          dropdowns right-aligned (lg+ — on mobile they stack below). */}
      {!message && shown.length > 0 && (
        <div className="flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="inline-flex shrink-0 rounded-lg border border-gray-200 p-0.5">
              {(['diagram', 'tree'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMode(m)}
                  className={`px-2.5 py-1 rounded-md text-[13px] font-medium transition-colors ${viewMode === m ? 'bg-brand-100 text-brand-800' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {m === 'tree' ? t('tab.phrasing') : t('phr.diagram')}
                </button>
              ))}
            </div>
            {/* Print / save as PDF — the diagrams themselves (chrome is print-hidden). */}
            {viewMode === 'diagram' && (
              <button
                type="button"
                title={t('phr.printPdf')}
                aria-label={t('phr.printPdf')}
                onClick={() => window.print()}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Printer size={16} />
              </button>
            )}
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4 w-[31rem]">
            <OptionSelect value={effEd} onChange={setGreekEd} options={cur?.hebrew ? HEBREW_EDITIONS : GREEK_EDITIONS} />
            <OptionSelect value={transLang} onChange={setTransLang} options={LANGS.filter(l => !cur?.hebrew || l.code !== 'bsb').map(l => ({ code: l.code, label: t(l.labelKey) }))} />
          </div>
        </div>
      )}
      {/* Signed-out users still get the canvas — saved on this device only. */}
      {!message && shown.length > 0 && viewMode === 'diagram' && !isAuthenticated && (
        <p className="text-xs text-gray-400 -mt-2 print:hidden">{t('phr.savedLocally')}</p>
      )}
      {/* On mobile the dropdowns stack above the cards. */}
      {!message && shown.length > 0 && (
        <div className="grid grid-cols-2 gap-2 lg:hidden print:hidden">
          <OptionSelect value={effEd} onChange={setGreekEd} options={cur?.hebrew ? HEBREW_EDITIONS : GREEK_EDITIONS} />
          <OptionSelect value={transLang} onChange={setTransLang} options={LANGS.filter(l => !cur?.hebrew || l.code !== 'bsb').map(l => ({ code: l.code, label: t(l.labelKey) }))} />
        </div>
      )}

      {message ? (
        <p className="text-sm text-gray-400 italic">{message}</p>
      ) : (
        shown.map((s, i) => {
          const mid = colText(effEd, s)
          const right = colText(transLang, s)
          return (
            <div key={i} className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                {s.ref}
                {isAuthenticated && cur && (
                  <VerseNoteButton book={cur.osis} chapter={s.chapter} verse={s.startVerse} noted={notedVerses.has(s.startVerse)} onChanged={refreshNotes} />
                )}
              </p>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_31rem] lg:items-start">
                <div className="min-w-0" dir={cur?.hebrew && viewMode === 'tree' ? 'rtl' : undefined}>
                  {viewMode === 'diagram' ? (
                    diagrams === null ? (
                      <p className="text-sm text-gray-400 italic">{t('reader.loading')}</p>
                    ) : (
                      <DiagramCanvas
                        key={`${cur?.osis}.${s.chapter}.${s.startVerse}-${s.endVerse}`}
                        words={treeWords(s.tree)}
                        rtl={cur?.hebrew}
                        initialData={diagrams[`${s.startVerse}-${s.endVerse}`] ?? (isAuthenticated ? null : readLocal(s))}
                        onSave={d => saveDiagram(s, d)}
                      />
                    )
                  ) : (
                    <NodeView node={s.tree} depth={0} />
                  )}
                </div>
                {/* Greek + translation columns and the parsing box grouped together, so the
                    box sits directly beneath the text (not below the taller phrase tree).
                    Print-hidden: printing this tab yields just the reference + diagram. */}
                <div className="space-y-3 print:hidden">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="text-gray-800 leading-relaxed lg:border-l lg:border-gray-100 lg:pl-4">
                      <span className="lg:hidden block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{greekLabel(effEd, cur?.hebrew)}</span>
                      <span dir={cur?.hebrew ? 'rtl' : undefined} className={`${cur?.hebrew ? 'font-hebrew block text-right' : 'font-greek'} leading-relaxed`} style={{ fontSize: 'calc(var(--phrase-fs, 1.45rem) * 0.92)' }}>
                        {(() => {
                          const gw = greekWordsFor(s)
                          if (gw.length) {
                            // Character offset of each word within its verse (same convention as
                            // withTokenOffsets: single-space joins), so highlights anchor correctly.
                            const posByVerse: Record<string, number> = {}
                            return gw.map((w, wi) => {
                              const [b, ch, v] = w.id.split('.')
                              const vk = `${b}.${ch}.${v}`
                              const start = posByVerse[vk] ?? 0
                              const end = start + w.w.length
                              posByVerse[vk] = end + 1
                              // Hebrew morphemes of ONE word share an id (בְּ + רֵאשִׁית are
                              // both Gen.1.1.1) — join them solid so the column reads
                              // בְּרֵאשִׁית, not "בְּ רֵאשִׁית". Greek ids are unique, so
                              // nothing changes there.
                              const joined = wi > 0 && gw[wi - 1].id === w.id
                              return (
                                <span key={`${w.id}.${wi}`}>{wi > 0 && !joined ? ' ' : ''}
                                  <GreekColWord node={w} book={b} chapter={Number(ch)} verse={Number(v)} start={start} end={end} />
                                </span>
                              )
                            })
                          }
                          return mid || <span className="font-sans text-sm text-gray-300 italic">—</span>
                        })()}
                      </span>
                    </div>
                    <div className="text-gray-700 leading-relaxed lg:border-l lg:border-gray-100 lg:pl-4" style={{ fontSize: 'calc(var(--phrase-fs, 1.45rem) * 0.8)' }}>
                      <span className="lg:hidden block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{langLabel(transLang, t)}</span>
                      {right || <span className="text-gray-300 italic">—</span>}
                    </div>
                  </div>
                  {/* Parsing box, always shown under the text — defaults to the verse's
                      first word so its presence is obvious; updates on word click. */}
                  <ResizableParsingPane storageKey="phrasing" info={panelInfo(s)} bgClass="bg-gray-50" />
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
    </HlCtx.Provider>
    </WordCtx.Provider>
  )
}
