'use client'
import { openWordSearch } from '@/lib/word-search-bus'

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
 * in order.
 */
export function GreekWords({ text, reference, analyses, onPick, selectedKey, keyBase }: {
  text: string
  reference: string
  analyses?: MorphEntry[]
  onPick?: (pick: WordPick | null, key: string) => void
  selectedKey?: string | null
  keyBase?: string
}) {
  let wi = -1  // running index over words only (whitespace tokens don't advance it)
  return (
    <>
      {text.split(/(\s+)/).map((tok, i) => {
        if (/\s/.test(tok) || !tok) return tok
        wi += 1
        const entry = analyses?.[wi]
        const key = `${keyBase ?? ''}.${wi}`
        const select = onPick
          ? () => onPick(entry ? { lemma: entry[0], parsing: entry[1], surface: stripEdges(tok) } : null, key)
          : undefined
        const selected = selectedKey === key
        return (
          <span
            key={i}
            className={`rounded transition-colors ${onPick ? 'cursor-pointer' : 'cursor-context-menu'} hover:bg-brand-100 ${selected ? 'bg-brand-100' : ''}`}
            {...(select ? { onMouseEnter: select, onClick: select } : {})}
            onContextMenu={e => {
              e.preventDefault()
              openWordSearch({ x: e.clientX, y: e.clientY, surface: stripEdges(tok), reference, kind: 'greek', greekCorpus: 'LXX' })
            }}
          >
            {tok}
          </span>
        )
      })}
    </>
  )
}
