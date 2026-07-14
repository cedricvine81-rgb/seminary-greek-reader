'use client'
import { openWordSearch } from '@/lib/word-search-bus'

// Strip leading/trailing punctuation (literal class — no \p{} for the repo's TS target),
// including the Greek ano teleia (·) and elision mark (ʼ), leaving the bare word to search.
const EDGE_PUNCT = /^[.,;:!?·"“”‘’'ʼ`()[\]{}<>«»…—–-]+|[.,;:!?·"“”‘’'ʼ`()[\]{}<>«»…—–-]+$/g
function stripEdges(s: string): string { return s.replace(EDGE_PUNCT, '') }

/**
 * Split a run of Greek prose into word spans that open the "search this word" menu on
 * right-click (Greek corpora + background library, from WordSearchProvider). Used for
 * unparsed Greek prose (e.g. Josephus), which has no per-word morphology tokens, so — unlike
 * the parsed lxx path — there is no parsing pane or per-word highlight here; the words are
 * still searchable everywhere the Greek is.
 */
export function GreekWords({ text, reference }: { text: string; reference: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((tok, i) => {
        if (/\s/.test(tok) || !tok) return tok
        return (
          <span
            key={i}
            className="cursor-context-menu rounded transition-colors hover:bg-brand-100"
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
