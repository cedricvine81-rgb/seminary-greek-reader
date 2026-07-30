'use client'

import { ChevronRight } from 'lucide-react'
import { GreekSearchResults, type GreekHit } from './GreekSearchResults'
import { ConstructProseResults, type ProseHit } from './ConstructProseResults'
import { corpusInfo, type ConstructCorpus } from '@/lib/construct-query'

// "Search all" reported as a DISTRIBUTION: how often the construction occurs in each text, then a
// few examples from each. A flat capped list would have been misleading — corpora are stored in
// canonical order, so the cap would fill from the New Testament and never reach Josephus or the
// Greco-Roman texts, implying a construction is rare outside the NT when it may be the opposite.
//
// Counts are true totals, not sample sizes. Each corpus's examples render through whichever view
// that corpus already uses, so nothing here duplicates a results renderer.

export interface CorpusBlock {
  corpus: ConstructCorpus
  count: number
  prose: boolean
  results: unknown[]
}

export function ConstructAllResults({ blocks, total, bookName, transLang, onOpen, onDrillDown, isAuthenticated }: {
  blocks: CorpusBlock[]
  total: number
  bookName: Map<string, string>
  transLang: string
  onOpen: (h: GreekHit) => void
  // Switch the search to one corpus, to see all of its matches rather than the sample.
  onDrillDown: (corpus: ConstructCorpus) => void
  isAuthenticated: boolean
}) {
  const max = Math.max(1, ...blocks.map(b => b.count))
  const present = blocks.filter(b => b.count > 0)

  return (
    <div>
      {/* The distribution — the part that answers "is this distinctive, or ordinary Greek?" */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-surface p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Where it occurs · {total.toLocaleString()} passage{total === 1 ? '' : 's'} in all
        </p>
        <div className="space-y-1">
          {blocks.map(b => {
            const info = corpusInfo(b.corpus)
            return (
              <button key={b.corpus} type="button" disabled={b.count === 0}
                onClick={() => onDrillDown(b.corpus)}
                title={b.count ? `Search ${info.label} on its own to see all ${b.count.toLocaleString()}` : undefined}
                className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-xs transition-colors ${
                  b.count ? 'hover:bg-brand-50' : 'cursor-default opacity-40'}`}>
                <span className="w-44 flex-none truncate text-gray-700">
                  {info.label}
                  {info.tagging === 'machine' && (
                    <span className="ml-1 text-[10px] text-amber-600" title="Machine-parsed, roughly 90–95% accurate">~</span>
                  )}
                </span>
                <span className="w-14 flex-none text-right tabular-nums text-gray-500">{b.count.toLocaleString()}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <span className="block h-full rounded-full bg-brand-400"
                    style={{ width: `${Math.round((b.count / max) * 100)}%` }} />
                </span>
                {b.count > 0 && <ChevronRight size={12} className="flex-none text-gray-300" />}
              </button>
            )
          })}
        </div>
        <p className="mt-2 border-t border-gray-100 pt-1.5 text-[10px] leading-snug text-gray-400">
          <span className="text-amber-600">~</span> machine-parsed, so those counts carry more noise than the
          hand-tagged New Testament and Septuagint. Click a text to see all of its matches.
        </p>
      </div>

      {/* A few examples from each text that has any. */}
      {present.map(b => {
        const info = corpusInfo(b.corpus)
        return (
          <div key={b.corpus} className="mb-5">
            <div className="mb-1 flex items-baseline justify-between gap-2 border-b border-gray-100 pb-1">
              <p className="text-xs font-semibold text-gray-700">{info.label}</p>
              <button type="button" onClick={() => onDrillDown(b.corpus)}
                className="text-[11px] text-brand-600 hover:underline">
                {b.count > b.results.length ? `see all ${b.count.toLocaleString()}` : 'open'}
              </button>
            </div>
            {b.prose
              ? <ConstructProseResults hits={b.results as ProseHit[]} showEnglish={false} />
              : <GreekSearchResults
                  hits={b.results as GreekHit[]}
                  terms={[]}
                  corpus={b.corpus === 'LXX' ? 'LXX' : 'GNT'}
                  bookName={bookName}
                  context={0}
                  ctxMap={{}}
                  transLang={transLang}
                  onOpen={onOpen}
                  isAuthenticated={isAuthenticated}
                />}
          </div>
        )
      })}
    </div>
  )
}
