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
        Each sentence is broken into its clause → phrase → word levels. Click a label to collapse a level.
        Hover a word for its lemma, parsing, and role.
      </p>

      {heading && !loading && <p className="text-sm font-medium text-gray-700">{heading}</p>}

      {message ? (
        <p className="text-sm text-gray-400 italic">{message}</p>
      ) : (
        shown.map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">{s.ref}</p>
            <NodeView node={s.tree} depth={0} />
          </div>
        ))
      )}

      {attribution && (
        <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">Syntax data: {attribution}</p>
      )}
    </div>
  )
}
