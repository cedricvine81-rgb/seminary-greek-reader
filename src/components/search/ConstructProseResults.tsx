'use client'

import { ArrowUpRight } from 'lucide-react'
import { SEARCH_MARK } from '@/lib/highlight-terms'

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

export function ConstructProseResults({ hits, showEnglish }: { hits: ProseHit[]; showEnglish: boolean }) {
  return (
    <div className="divide-y divide-gray-100">
      {hits.map((h, i) => {
        const href = textsHref(h.target)
        const marked = new Set(h.matchedWords ?? [])
        const words = h.text ? h.text.trim().split(/\s+/) : []
        return (
          <div key={`${h.bookId}.${h.chapter}.${h.verse}.${i}`} className="py-2.5">
            <div className="flex items-baseline gap-2">
              {href ? (
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
                {words.map((w, wi) => (
                  <span key={wi} className={marked.has(wi) ? SEARCH_MARK : undefined}>
                    {w}{wi < words.length - 1 ? ' ' : ''}
                  </span>
                ))}
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
