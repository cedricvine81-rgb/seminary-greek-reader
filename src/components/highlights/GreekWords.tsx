'use client'
import { openWordSearch } from '@/lib/word-search-bus'
import { highlightAt } from '@/components/highlights/render'
import { highlightMarkClass } from '@/lib/highlight-colors'
import { findTermRanges, SEARCH_MARK } from '@/lib/highlight-terms'
import type { TransHl } from '@/components/highlights/TransWords'

// Strip leading/trailing punctuation (literal class — no \p{} for the repo's TS target),
// including the Greek ano teleia (·) and elision mark (ʼ), leaving the bare word to search.
const EDGE_PUNCT = /^[.,;:!?·"“”‘’'ʼ`()[\]{}<>«»…—–-]+|[.,;:!?·"“”‘’'ʼ`()[\]{}<>«»…—–-]+$/g
function stripEdges(s: string): string { return s.replace(EDGE_PUNCT, '') }

// A word's analysis for the parsing pane: [lemma, parse] or null (punctuation/unanalyzable).
type MorphEntry = [string, string] | null
type WordPick = { lemma: string; parsing: string; surface: string }

/**
 * Split a run of Greek prose into word spans. On right-click each opens the "search this word"
 * menu (Greek corpora + background library). When `analyses` is supplied (from a morphology
 * sidecar, aligned 1:1 with the words here), hovering/clicking a word also feeds the parsing
 * pane via `onPick` — this is how untagged prose (e.g. Josephus) gets a parsing pane without
 * disturbing the exact text/punctuation. `analyses` indexes the *words* (non-whitespace tokens)
 * in order. When `hl` is supplied, each word also renders + toggles a highlight (character
 * offsets into `text`) and the right-click menu carries the highlight palette — the same model
 * the Greek reader and translation panes use.
 *
 * `terms` (already folded, as findTermRanges expects) marks the words a search matched. Marking
 * here rather than swapping in a plain marked-up string is the point: a searching reader used to
 * lose the word menu and the parsing pane on the very passage the search found.
 */
export function GreekWords({ text, reference, analyses, onPick, selectedKey, keyBase, hl, terms }: {
  text: string
  reference: string
  analyses?: MorphEntry[]
  onPick?: (pick: WordPick | null, key: string) => void
  selectedKey?: string | null
  keyBase?: string
  hl?: TransHl
  terms?: string[]
}) {
  const termRanges = terms?.length ? findTermRanges(text, terms) : []
  const inTerm = (start: number, end: number) =>
    termRanges.some(([rs, re]) => start < re && end > rs)
  let wi = -1  // running index over words only (whitespace tokens don't advance it)
  let pos = 0  // running character offset into `text` (for highlight anchors)
  return (
    <>
      {text.split(/(\s+)/).map((tok, i) => {
        const start = pos
        pos += tok.length
        if (!tok) return tok
        const end = start + tok.length
        if (/\s/.test(tok)) {
          // A newline is a real line break in verse texts (Homer, Hesiod: the group's lines are
          // joined with "\n") — render it as <br/> so poetry keeps its lines beside the English.
          if (tok.includes('\n')) return <br key={i} />
          // Paint whitespace inside a highlight so consecutive words read as one continuous stroke.
          const sp = hl ? highlightAt(start, end, hl.verseHighlights) : undefined
          return sp ? <span key={i} className={highlightMarkClass(sp.color)}>{tok}</span> : tok
        }
        wi += 1
        const entry = analyses?.[wi]
        const key = `${keyBase ?? ''}.${wi}`
        const select = onPick
          ? () => onPick(entry ? { lemma: entry[0], parsing: entry[1], surface: stripEdges(tok) } : null, key)
          : undefined
        const selected = selectedKey === key
        const mark = hl ? highlightAt(start, end, hl.verseHighlights) : undefined
        return (
          <span
            key={i}
            className={`reading-word rounded transition-colors ${onPick ? 'cursor-pointer' : 'cursor-context-menu'} hover:bg-brand-100 ${selected ? 'bg-brand-100' : ''}${mark ? ` ${highlightMarkClass(mark.color)}` : ''}${
              !mark && inTerm(start, end) ? ` ${SEARCH_MARK}` : ''}`}
            {...(select ? { onMouseEnter: select, onClick: select } : {})}
            {...(mark ? { 'data-highlight-id': mark.id } : {})}
            onContextMenu={e => {
              e.preventDefault()
              openWordSearch({
                x: e.clientX, y: e.clientY, surface: stripEdges(tok), reference, kind: 'greek', greekCorpus: 'LXX',
                highlight: hl?.isAuthenticated ? {
                  activeColor: mark?.color ?? null,
                  onPick: c => mark ? hl.recolor(mark.id, c) : hl.create(start, end, c),
                  onRemove: () => { if (mark) hl.remove(mark.id) },
                } : undefined,
              })
            }}
          >
            {tok}
          </span>
        )
      })}
    </>
  )
}
