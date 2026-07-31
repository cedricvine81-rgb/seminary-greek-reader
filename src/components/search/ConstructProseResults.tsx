'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { SEARCH_MARK } from '@/lib/highlight-terms'
import { shouldSnippet, snippetRanges } from '@/lib/snippet'

// Results for a construct searched in a prose corpus (Josephus, Philo, the Fathers, the
// Greco-Roman texts). Separate from GreekSearchResults, which builds its display from per-verse
// word data served by /api/reader — that only covers the biblical corpora, and bending it to serve
// prose too would put the working search paths at risk for no gain.
//
// Matches are marked by POSITION, not by lemma: the prose sidecars are token-aligned with their
// text (whitespace-splitting a verse yields exactly the sidecar's word count, checked across
// works), so exactly the matched words are marked. The biblical results still highlight by lemma,
// which is looser — every occurrence of a matched lexeme lights up, not only the one that matched.

export interface ProseHit {
  bookId: string
  chapter: number
  verse: number
  reference: string
  text: string                 // the Greek
  english: string
  target: { source: string; workDir?: string; book?: number; chapter: number; verse?: number } | null
  matchedWords?: number[]
  crossesVerse?: boolean
}

// Deep link into the Texts reader; the reader takes an encoded target (see /texts/page.tsx).
function textsHref(target: ProseHit['target']): string | null {
  return target ? `/texts?open=${encodeURIComponent(JSON.stringify(target))}` : null
}

// A passage long enough that showing all of it buries the match. Eusebius and Justin are divided
// by chapter rather than verse (mean ~400 words, longest 5,182), and the Greco-Roman texts have
// 2,229 units over 100 words — so this is the common case there, not an edge one.
const LONG_PASSAGE = 60
const CONTEXT_WORDS = 12

export function ConstructProseResults({ hits, showEnglish, onOpen }: {
  hits: ProseHit[]
  showEnglish: boolean
  /** Open the passage in the side panel beside the search. Absent = link out as before. */
  onOpen?: (h: ProseHit) => void
}) {
  // Which passages the reader has asked to see in full.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  return (
    <div className="divide-y divide-gray-100">
      {hits.map((h, i) => {
        const href = textsHref(h.target)
        const marked = new Set(h.matchedWords ?? [])
        const words = h.text ? h.text.trim().split(/\s+/) : []
        const key = `${h.bookId}.${h.chapter}.${h.verse}.${i}`
        // A window per cluster of matches rather than the whole passage. Only possible because the
        // matched positions are exact — there is no guessing where to centre them.
        const positions = h.matchedWords ?? []
        const long = !expanded[key] && shouldSnippet(words.length, positions, LONG_PASSAGE, CONTEXT_WORDS)
        const ranges = long
          ? snippetRanges(positions, words.length, CONTEXT_WORDS)
          : [{ from: 0, to: words.length }]
        return (
          <div key={`${h.bookId}.${h.chapter}.${h.verse}.${i}`} className="py-2.5">
            <div className="flex items-baseline gap-2">
              {href && onOpen ? (
                // Beside the search, not away from it — the query that found this stays on screen.
                <button type="button" onClick={() => onOpen(h)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                  title="Read this passage beside your search">
                  {h.reference} <ArrowUpRight size={11} className="flex-none" />
                </button>
              ) : href ? (
                <a href={href} target="_blank" rel="noopener"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                  title="Open this passage in the Texts reader">
                  {h.reference} <ArrowUpRight size={11} className="flex-none" />
                </a>
              ) : (
                <span className="text-xs font-medium text-gray-500">{h.reference}</span>
              )}
              {h.crossesVerse && (
                <span className="text-[10px] text-gray-300" title="Part of this construct is in the next section">
                  continues
                </span>
              )}
            </div>
            {words.length > 0 ? (
              <p className="greek-text mt-1 leading-relaxed text-gray-900">
                {ranges.map((rg, ri) => (
                  <span key={ri}>
                    {(ri > 0 || rg.from > 0) && <span className="text-gray-300">… </span>}
                    {words.slice(rg.from, rg.to).map((w, k) => {
                      const wi = rg.from + k
                      return (
                        <span key={wi} className={marked.has(wi) ? SEARCH_MARK : undefined}>
                          {w}{wi < rg.to - 1 ? ' ' : ''}
                        </span>
                      )
                    })}
                  </span>
                ))}
                {ranges[ranges.length - 1].to < words.length && <span className="text-gray-300"> …</span>}
                {long && (
                  <button type="button" onClick={() => setExpanded(e => ({ ...e, [key]: true }))}
                    className="ml-2 align-baseline font-sans text-[11px] text-brand-600 hover:underline">
                    show all {words.length} words
                  </button>
                )}
              </p>
            ) : (
              <p className="mt-1 text-xs italic text-gray-300">No Greek text stored for this passage.</p>
            )}
            {showEnglish && h.english && (
              <p className="font-reading mt-1 leading-relaxed text-gray-500">{h.english}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
