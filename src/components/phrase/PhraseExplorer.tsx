'use client'
import { useEffect, useRef, useState } from 'react'

// One node of the Macula phrase/clause tree (see scripts/import-macula-phrase-tree.js).
type TreeNode =
  | { t: 'g'; cls?: string; role?: string; rule?: string; c: TreeNode[] }
  | { t: 'w'; id: string; w: string; gloss?: string; lemma?: string; morph?: string; role?: string; cls?: string }

interface Sentence { ref: string; chapter: number; startVerse: number; endVerse: number; tree: TreeNode }
interface BookData { book: string; attribution: string; sentences: Sentence[] }

type RefBook = { osisId: string; name: string; abbrev: string; totalChapters: number }

/** Parse a reference like "John 1:1-5" against the book list (mirrors the Reader/Exegesis parser). */
function parseRef(ref: string, books: RefBook[]): { osisId: string; chapter: number; verseStart: number; verseEnd: number } | null {
  const q = ref.trim().replace(/[–—]/g, '-')
  const m = q.match(/^((?:\d\s*)?\w[\w\s]*?)\s+(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!m) return null
  const bookPart = m[1].trim().toLowerCase().replace(/\s+/g, '')
  const chapter = parseInt(m[2]); const vs = m[3] ? parseInt(m[3]) : 1; const ve = m[4] ? parseInt(m[4]) : (m[3] ? vs : 999)
  const book = books.find(b => [b.osisId, b.name, b.abbrev].some(s => {
    const c = s.toLowerCase().replace(/\s+/g, ''); return c === bookPart || c.startsWith(bookPart) || bookPart.startsWith(c.slice(0, Math.max(3, bookPart.length)))
  }))
  if (!book) return null
  if (book.totalChapters === 1 && !m[3]) return { osisId: book.osisId, chapter: 1, verseStart: chapter, verseEnd: chapter }
  return { osisId: book.osisId, chapter, verseStart: vs, verseEnd: ve }
}

// Human labels for the syntactic group classes/roles Macula uses.
const CLASS_LABEL: Record<string, string> = {
  cl: 'Clause', pp: 'Prepositional phrase', np: 'Noun phrase', vp: 'Verb phrase',
  adjp: 'Adjective phrase', advp: 'Adverbial phrase',
}
const ROLE_LABEL: Record<string, string> = {
  s: 'Subject', v: 'Verb', vc: 'Verb (copula)', o: 'Object', o2: 'Second object',
  io: 'Indirect object', p: 'Complement', adv: 'Adverbial', apposition: 'Apposition',
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
      <div className={`ml-3 mt-1 border-l-2 pl-3 ${isClause ? 'border-brand-200' : 'border-gray-200'}`}>
        {node.c.map((c, i) => <NodeView key={i} node={c} depth={depth + 1} />)}
      </div>
    </details>
  )
}

/** A word leaf: Greek surface + gloss, with lemma/morph on hover. */
function WordNode({ node }: { node: Extract<TreeNode, { t: 'w' }> }) {
  return (
    <span
      className="inline-flex flex-col items-start mr-3 mb-1 align-top"
      title={[node.lemma && `lemma: ${node.lemma}`, node.morph && `morph: ${node.morph}`, node.role && `role: ${node.role}`].filter(Boolean).join('\n')}
    >
      <span className="font-greek text-lg text-gray-900 leading-tight">{node.w}</span>
      {node.gloss && <span className="text-[11px] text-gray-400 leading-tight">{node.gloss}</span>}
    </span>
  )
}

function NodeView({ node, depth }: { node: TreeNode; depth: number }) {
  if (node.t === 'w') return <WordNode node={node} />
  // Words directly under a group flow inline; nested groups stack.
  return <GroupNode node={node} depth={depth} />
}

// Translations available in the Reader (mirrors GreekReader's PARALLEL_LANGS).
const LANGS = [
  { code: 'bsb', label: 'English (BSB)' },
  { code: 'en', label: 'English (WEB)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Mandarin' },
]
const langLabel = (code: string) => LANGS.find(l => l.code === code)?.label ?? code

function LangSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
    >
      {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
    </select>
  )
}

export function PhraseExplorer() {
  const [books, setBooks] = useState<RefBook[]>([])
  const [input, setInput] = useState('John 1:1-5')
  const [inputError, setInputError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [heading, setHeading] = useState('')
  const [shown, setShown] = useState<Sentence[]>([])
  const [attribution, setAttribution] = useState('')
  const [message, setMessage] = useState('')
  const cache = useRef<Record<string, BookData>>({})

  // The two side-by-side translation columns.
  const [lang1, setLang1] = useState('bsb')
  const [lang2, setLang2] = useState('en')
  const [cur, setCur] = useState<{ osis: string; chapter: number } | null>(null)
  // Translation text keyed by lang → verseId ("John.1.1") → text, with a version
  // counter to re-render after async loads. `loaded` dedupes fetches.
  const transCache = useRef<Record<string, Record<string, string>>>({})
  const loaded = useRef<Set<string>>(new Set())
  const [, setTransVer] = useState(0)
  const bump = () => setTransVer(v => v + 1)

  // Ensure both columns' translations are loaded for the current passage's chapter.
  useEffect(() => {
    if (!cur) return
    const { osis, chapter } = cur
    for (const lang of Array.from(new Set([lang1, lang2]))) {
      const ck = lang === 'bsb' ? 'bsb' : `${lang}.${osis}.${chapter}`
      if (loaded.current.has(ck)) continue
      loaded.current.add(ck)
      if (lang === 'bsb') {
        fetch('/data/bsb-alignment.json?v=3')
          .then(r => r.json())
          .then((d: Record<string, { text: string }>) => {
            const map = (transCache.current.bsb ??= {})
            for (const [vid, val] of Object.entries(d)) map[vid] = val.text
            bump()
          })
          .catch(() => {})
      } else {
        fetch(`/api/translation?book=${osis}&chapter=${chapter}&lang=${lang}`)
          .then(r => r.json())
          .then((d: { verses?: Record<string, string> }) => {
            const map = (transCache.current[lang] ??= {})
            Object.assign(map, d.verses ?? {})
            bump()
          })
          .catch(() => {})
      }
    }
  }, [cur, lang1, lang2])

  /** Joined translation text for a sentence's verse range in the chosen language. */
  const sentenceText = (lang: string, s: Sentence): string => {
    const map = transCache.current[lang]
    if (!map) return ''
    const parts: string[] = []
    for (let v = s.startVerse; v <= s.endVerse; v++) {
      const t = map[`${cur?.osis}.${s.chapter}.${v}`]
      if (t) parts.push(t)
    }
    return parts.join(' ')
  }

  // Load the GNT book list (for reference parsing), then the default passage.
  useEffect(() => {
    fetch('/api/reader?corpus=GNT')
      .then(r => r.json())
      .then((d) => {
        const bs: RefBook[] = d.books ?? []
        setBooks(bs)
        if (bs.length) loadPassage('John 1:1-5', bs)
      })
      .catch(() => setMessage('Could not load the book list.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      setCur({ osis: p.osisId, chapter: p.chapter })
      setAttribution(data.attribution)
      const vLabel = p.verseStart === p.verseEnd ? `${p.verseStart}` : `${p.verseStart}–${p.verseEnd === 999 ? 'end' : p.verseEnd}`
      setHeading(`${data.book} ${p.chapter}:${vLabel}`)
      if (matches.length === 0) setMessage('No sentences found for that reference.')
    } catch {
      setMessage('No syntax data for that book yet.')
      setShown([])
    } finally {
      setLoading(false)
    }
  }

  const submit = () => { if (books.length) loadPassage(input, books) }

  return (
    <div className="space-y-4">
      {/* Passage entry — matches the Reader / Exegesis tools */}
      <div className="flex items-center flex-wrap gap-3">
        <div className="flex items-center">
          <span className="px-3 py-1.5 rounded-l-lg bg-brand-600 text-white text-sm font-medium">Passage</span>
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); if (inputError) setInputError(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
            onBlur={submit}
            placeholder="e.g. Matthew 3:1-3"
            className={`border rounded-l-none rounded-r-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 ${inputError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-brand-400'}`}
          />
        </div>
        {loading && <span className="text-sm text-gray-400">Loading…</span>}
        {inputError && <span className="text-xs text-red-500">Couldn&rsquo;t find that reference — try e.g. &ldquo;John 1:1-5&rdquo;</span>}
      </div>

      <p className="text-xs text-gray-500">
        Each sentence is broken into its clause → phrase → word levels (left), with two
        translation columns alongside. Click a label to collapse a level; hover a word for
        its lemma, parsing, and role.
      </p>

      {heading && !loading && <p className="text-sm font-medium text-gray-700">{heading}</p>}

      {/* Column header with the two translation dropdowns (aligned over the columns on lg+). */}
      {!message && shown.length > 0 && (
        <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_15rem_15rem] gap-4 items-end">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Greek — clause / phrase structure</span>
          <LangSelect value={lang1} onChange={setLang1} />
          <LangSelect value={lang2} onChange={setLang2} />
        </div>
      )}
      {/* On mobile the dropdowns stack above the cards. */}
      {!message && shown.length > 0 && (
        <div className="grid grid-cols-2 gap-2 lg:hidden">
          <LangSelect value={lang1} onChange={setLang1} />
          <LangSelect value={lang2} onChange={setLang2} />
        </div>
      )}

      {message ? (
        <p className="text-sm text-gray-400 italic">{message}</p>
      ) : (
        shown.map((s, i) => {
          const t1 = sentenceText(lang1, s)
          const t2 = sentenceText(lang2, s)
          return (
            <div key={i} className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">{s.ref}</p>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem_15rem]">
                <div className="min-w-0">
                  <NodeView node={s.tree} depth={0} />
                </div>
                <div className="text-sm text-gray-700 leading-relaxed lg:border-l lg:border-gray-100 lg:pl-4">
                  <span className="lg:hidden block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{langLabel(lang1)}</span>
                  {t1 || <span className="text-gray-300 italic">—</span>}
                </div>
                <div className="text-sm text-gray-700 leading-relaxed lg:border-l lg:border-gray-100 lg:pl-4">
                  <span className="lg:hidden block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{langLabel(lang2)}</span>
                  {t2 || <span className="text-gray-300 italic">—</span>}
                </div>
              </div>
            </div>
          )
        })
      )}

      {attribution && (
        <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">Syntax data: {attribution}</p>
      )}
    </div>
  )
}
