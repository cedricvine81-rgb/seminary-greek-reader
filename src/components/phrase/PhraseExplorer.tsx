'use client'
import { useEffect, useMemo, useState } from 'react'

// One node of the Macula phrase/clause tree (see scripts/import-macula-phrase-tree.js).
type TreeNode =
  | { t: 'g'; cls?: string; role?: string; rule?: string; c: TreeNode[] }
  | { t: 'w'; id: string; w: string; gloss?: string; lemma?: string; morph?: string; role?: string; cls?: string }

interface Sentence { ref: string; startVerse: number; endVerse: number; tree: TreeNode }
interface Data { book: string; chapter: number; attribution: string; sentences: Sentence[] }

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
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [verse, setVerse] = useState<number | 'all'>(1)

  useEffect(() => {
    fetch('/data/phrase-tree-john.json')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then(setData)
      .catch(() => setError('Could not load phrase data.'))
  }, [])

  const verses = useMemo(() => {
    if (!data) return []
    const max = Math.max(...data.sentences.map(s => s.endVerse))
    return Array.from({ length: max }, (_, i) => i + 1)
  }, [data])

  const shown = useMemo(() => {
    if (!data) return []
    if (verse === 'all') return data.sentences
    return data.sentences.filter(s => verse >= s.startVerse && verse <= s.endVerse)
  }, [data, verse])

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p className="text-gray-400 animate-pulse">Loading phrase data…</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium">Passage</span>
        <span className="text-sm font-medium text-gray-700">{data.book} {data.chapter}</span>
        <select
          value={String(verse)}
          onChange={e => setVerse(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {verses.map(v => <option key={v} value={v}>Verse {v}</option>)}
          <option value="all">Whole chapter</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">Prototype · {data.book} {data.chapter} only</span>
      </div>

      <p className="text-xs text-gray-500">
        Each sentence is broken into its clause → phrase → word levels. Click a label to collapse a level.
        Hover a word for its lemma, parsing, and role.
      </p>

      {shown.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No sentence for that verse.</p>
      ) : (
        shown.map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">{s.ref}</p>
            <NodeView node={s.tree} depth={0} />
          </div>
        ))
      )}

      <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
        Syntax data: {data.attribution}
      </p>
    </div>
  )
}
