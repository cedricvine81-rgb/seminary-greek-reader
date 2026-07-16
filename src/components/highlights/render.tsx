import type { ReactNode } from 'react'
import { highlightMarkClass } from '@/lib/highlight-colors'
import type { HighlightRecord } from './useHighlights'

// Spread onto each verse's wrapper element so useHighlightSelection can find verse
// boundaries and measure offsets relative to that verse's own text.
export function verseAnchorProps(book: string, chapter: number, verse: number, layer: string = 'grc') {
  return { 'data-hl-book': book, 'data-hl-chapter': chapter, 'data-hl-verse': verse, 'data-hl-layer': layer } as const
}

// Precomputes each token's [start, end) offset into the verse's canonical text (tokens
// joined by single spaces — the same string /api/reader's `.text` field or a plain
// `tokens.map(t => t.surface).join(' ')` reconstruction produces), so a per-token render
// loop can look up whether it falls inside a highlight without redoing the math itself.
export function withTokenOffsets<T extends { surface: string }>(tokens: T[]): { token: T; start: number; end: number }[] {
  let pos = 0
  return tokens.map(token => {
    const start = pos
    const end = start + token.surface.length
    pos = end + 1
    return { token, start, end }
  })
}

// The highlight (if any) covering this character range — used per-token for Greek word
// spans, where the caller merges the returned color into its own className/data-attrs.
export function highlightAt(start: number, end: number, highlights: HighlightRecord[]): HighlightRecord | undefined {
  return highlights.find(h => start < h.endOffset && end > h.startOffset)
}

// Renders plain prose (English translations, Josephus, Commentary) as a run of text and
// <mark> spans for whatever highlights cover it — the plain-text equivalent of the
// per-token path above, for views that don't already render word-by-word spans.
export function renderHighlightedPlainText(text: string, book: string, chapter: number, highlights: HighlightRecord[]): ReactNode {
  if (highlights.length === 0) return text
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset)
  const nodes: ReactNode[] = []
  let pos = 0
  for (const h of sorted) {
    const s = Math.max(pos, h.startOffset), e = Math.min(text.length, h.endOffset)
    if (s >= e) continue
    if (s > pos) nodes.push(text.slice(pos, s))
    nodes.push(
      <mark
        key={h.id}
        data-highlight-id={h.id}
        data-hl-book={book}
        data-hl-chapter={chapter}
        data-hl-color={h.color}
        className={`${highlightMarkClass(h.color)} rounded-sm cursor-pointer`}
      >
        {text.slice(s, e)}
      </mark>,
    )
    pos = e
  }
  if (pos < text.length) nodes.push(text.slice(pos))
  return nodes
}
