import React from 'react'

/**
 * Minimal, safe Markdown → React renderer for notes. Supports **bold**, *italic* /
 * _italic_, `code`, line breaks, and -/* and 1. lists. It builds React elements
 * (never dangerouslySetInnerHTML), so it is XSS-safe by construction.
 */
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g
  let last = 0, m: RegExpExecArray | null, i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    const key = `${keyBase}-${i++}`
    if (tok.startsWith('**')) nodes.push(<strong key={key}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('`')) nodes.push(<code key={key} className="rounded bg-gray-100 px-1 text-[0.9em]">{tok.slice(1, -1)}</code>)
    else nodes.push(<em key={key}>{tok.slice(1, -1)}</em>)
    last = m.index + tok.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export function renderMarkdown(text: string): React.ReactNode {
  const lines = (text ?? '').split('\n')
  const blocks: React.ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  const flush = () => {
    if (!list) return
    const items = list.items.map((it, i) => <li key={i}>{renderInline(it, `li-${blocks.length}-${i}`)}</li>)
    blocks.push(list.ordered
      ? <ol key={`b${blocks.length}`} className="list-decimal list-inside space-y-0.5">{items}</ol>
      : <ul key={`b${blocks.length}`} className="list-disc list-inside space-y-0.5">{items}</ul>)
    list = null
  }
  lines.forEach((line, idx) => {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/)
    if (bullet) { if (!list || list.ordered) { flush(); list = { ordered: false, items: [] } } list!.items.push(bullet[1]); return }
    if (ordered) { if (!list || !list.ordered) { flush(); list = { ordered: true, items: [] } } list!.items.push(ordered[1]); return }
    flush()
    if (line.trim() === '') { blocks.push(<div key={`b${blocks.length}`} className="h-2" />); return }
    blocks.push(<p key={`b${blocks.length}`}>{renderInline(line, `p${idx}`)}</p>)
  })
  flush()
  return <div className="space-y-1">{blocks}</div>
}
