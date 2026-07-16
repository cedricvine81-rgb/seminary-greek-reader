'use client'
import type { MouseEvent } from 'react'
import { openWordSearch } from '@/lib/word-search-bus'
import { highlightAt } from '@/components/highlights/render'
import { highlightMarkClass, type HighlightColor } from '@/lib/highlight-colors'
import type { HighlightRecord } from '@/components/highlights/useHighlights'

// Strip leading/trailing punctuation from a token (literal class — no \p{} for the repo's
// TS target), leaving the bare word to search.
const EDGE_PUNCT = /^[.,;:!?"“”‘’'`()[\]{}<>«»¿¡…—–-]+|[.,;:!?"“”‘’'`()[\]{}<>«»¿¡…—–-]+$/g
function stripEdges(s: string): string { return s.replace(EDGE_PUNCT, '') }

// Translation words render as individual `.trans-word` spans separated by whitespace, so a
// right-click that lands between words (or in the line padding) hits no word and does nothing.
// Put this on the enclosing element: a direct hit on a word is left to the word's own handler;
// any other click is forwarded to the nearest word span so its menu (and highlight palette)
// still opens.
export function forwardContextMenuToNearestTransWord(e: MouseEvent<HTMLElement>) {
  if ((e.target as HTMLElement).closest('.trans-word')) return
  const spans = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('.trans-word'))
  if (spans.length === 0) return
  let best: HTMLElement | null = null, bestD = Infinity
  for (const el of spans) {
    const r = el.getBoundingClientRect()
    const dx = e.clientX < r.left ? r.left - e.clientX : e.clientX > r.right ? e.clientX - r.right : 0
    const dy = e.clientY < r.top ? r.top - e.clientY : e.clientY > r.bottom ? e.clientY - r.bottom : 0
    const d = dx * dx + dy * dy
    if (d < bestD) { bestD = d; best = el }
  }
  if (!best) return
  e.preventDefault()
  best.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY }))
}

// Per-word highlight adapter a pane supplies (its useHighlights instance, bound to this verse)
// so a translation word can render + toggle its mark. Offsets are into the plain string.
export interface TransHl {
  isAuthenticated: boolean
  verseHighlights: HighlightRecord[]
  create: (start: number, end: number, color: HighlightColor) => void
  recolor: (id: string, color: HighlightColor) => void
  remove: (id: string) => void
}

/**
 * Split a translation string into word spans that open the "search this word" menu on
 * right-click (this book / whole Bible / library texts, from WordSearchProvider). When `hl`
 * is supplied, each word also renders + toggles a highlight (character offsets into the plain
 * string — the same anchor the Greek side uses, per the Highlight model). Used by every
 * non-Greek reading pane so the interaction is identical everywhere.
 */
export function TransWords({ text, lang, reference, book, hl }: {
  text: string
  lang: string
  reference: string
  book?: string          // current book's osisId — enables the "this book" search scope
  hl?: TransHl
}) {
  let pos = 0
  return (
    <>
      {text.split(/(\s+)/).map((tok, i) => {
        const start = pos
        pos += tok.length
        if (!tok) return tok
        const end = start + tok.length
        if (/\s/.test(tok)) {
          // Paint whitespace that sits INSIDE a highlight so consecutive highlighted words read
          // as one continuous stroke rather than separate marks with a gap between them.
          const sp = hl ? highlightAt(start, end, hl.verseHighlights) : undefined
          return sp ? <span key={i} className={highlightMarkClass(sp.color)}>{tok}</span> : tok
        }
        const mark = hl ? highlightAt(start, end, hl.verseHighlights) : undefined
        return (
          <span
            key={i}
            onContextMenu={e => {
              e.preventDefault()
              openWordSearch({
                x: e.clientX, y: e.clientY, surface: stripEdges(tok), reference,
                kind: 'translation', transLang: lang, book,
                highlight: hl?.isAuthenticated ? {
                  activeColor: mark?.color ?? null,
                  onPick: c => mark ? hl.recolor(mark.id, c) : hl.create(start, end, c),
                  onRemove: () => { if (mark) hl.remove(mark.id) },
                } : undefined,
              })
            }}
            {...(mark ? { 'data-highlight-id': mark.id } : {})}
            className={`trans-word${mark ? ` ${highlightMarkClass(mark.color)}` : ''}`}
          >
            {tok}
          </span>
        )
      })}
    </>
  )
}
