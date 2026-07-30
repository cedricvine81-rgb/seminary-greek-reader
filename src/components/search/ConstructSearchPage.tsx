'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Plus, Search } from 'lucide-react'
import { GreekSearchResults, type GreekHit } from './GreekSearchResults'
import { ConstructTermCard } from './ConstructTermCard'
import {
  CONSTRUCT_MAX_TERMS, CONSTRUCT_MAX_WITHIN, emptyTerm, encodeConstruct, queryIsRunnable,
  termIsEmpty, type ConstructQuery, type ConstructTerm,
} from '@/lib/construct-query'
import { FEATURE_LABEL } from '@/lib/morph-features'
import { isExamLocked } from '@/lib/exam-lockdown'

// Construct search — "find an aorist participle within 4 words of a dative noun". Two or three
// morphological terms plus a distance, run over the flat GNT token index (construct-search.ts).
//
// Reached from the "Construct" link on the full /search page. Deliberately its own route rather
// than a scope of SearchPageView: the builder needs vertical room, and the text-query search is
// left completely untouched. Results reuse GreekSearchResults, so a hit behaves like any other
// search hit (click a word for parsing, right-click to highlight or search it).
//
// Matched words are red-highlighted by LEMMA (the same contract as the morphology search), so a
// verse that repeats a matched lexeme highlights each occurrence, not only the matched one.

type Hit = GreekHit & { crossesVerse?: boolean }

export function ConstructSearchPage({ initial, isAuthenticated = false }: {
  initial: ConstructQuery
  isAuthenticated?: boolean
}) {
  const router = useRouter()
  const [query, setQuery] = useState<ConstructQuery>(initial)
  // The query that produced the results below — set only when a search actually runs, so
  // editing the builder doesn't invalidate what's on screen until you press Search.
  const [ran, setRan] = useState<ConstructQuery | null>(() => (queryIsRunnable(initial) ? initial : null))
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookName, setBookName] = useState<Map<string, string>>(new Map())
  const [transLang, setTransLang] = useState('en')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // normalized lemma → part of speech, so typing a Greek word collapses that card's form
  // dropdowns to the categories the word can actually take (scripts/build-construct-index.mjs).
  const [lemmaPos, setLemmaPos] = useState<Map<string, string>>()

  // Book display names (osisId → name), as on the other search pages.
  useEffect(() => {
    fetch('/data/books.json').then(r => r.ok ? r.json() : null)
      .then((d: { gnt?: { osisId: string; name: string }[] } | null) => {
        if (!d?.gnt) return
        setBookName(new Map(d.gnt.map(b => [b.osisId, b.name])))
      }).catch(() => {})
    fetch('/data/lemma-pos.json').then(r => r.ok ? r.json() : null)
      .then((d: Record<string, string> | null) => { if (d) setLemmaPos(new Map(Object.entries(d))) })
      .catch(() => {})
  }, [])

  // Run whenever a search is committed (`ran`), including on load from a shared link.
  useEffect(() => {
    if (!ran) return
    let live = true
    setLoading(true)
    const params = encodeConstruct(ran)
    params.set('type', 'construct')
    fetch(`/api/search?${params.toString()}`)
      .then(r => r.ok ? r.json() : { results: [] })
      .then((d: { results?: { bookId: string; chapter: number; verse: number; text: string; matchedLemmas?: string[]; crossesVerse?: boolean }[]; truncated?: boolean }) => {
        if (!live) return
        setHits((d.results ?? []).map(v => ({
          osisId: v.bookId, chapter: v.chapter, verse: v.verse, text: v.text,
          matchedLemmas: v.matchedLemmas, crossesVerse: v.crossesVerse,
        })))
        setTruncated(!!d.truncated)
      })
      .catch(() => { if (live) { setHits([]); setTruncated(false) } })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [ran])

  const runnable = queryIsRunnable(query)

  // Commit the current builder state: push it into the URL so the search is a shareable link,
  // then run it.
  const runSearch = useCallback(() => {
    if (!runnable) return
    router.replace(`/search/construct?${encodeConstruct(query).toString()}`, { scroll: false })
    setRan(query)
  }, [query, runnable, router])

  const setTerm = (i: number, t: ConstructTerm) =>
    setQuery(q => ({ ...q, terms: q.terms.map((old, j) => (j === i ? t : old)) }))
  const addTerm = () =>
    setQuery(q => (q.terms.length >= CONSTRUCT_MAX_TERMS ? q : { ...q, terms: [...q.terms, emptyTerm()] }))
  const removeTerm = (i: number) =>
    setQuery(q => ({ ...q, terms: q.terms.filter((_, j) => j !== i) }))

  const openHit = useCallback((h: GreekHit) => {
    router.push(`/reader?ref=${encodeURIComponent(`${h.osisId} ${h.chapter}:${h.verse}`)}`)
  }, [router])

  // Plain-language echo of what was searched, above the results.
  const summary = useMemo(() => {
    if (!ran) return ''
    const parts = ran.terms.filter(t => !termIsEmpty(t)).map(t => {
      const feats = Object.values(t.features).flat().map(v => FEATURE_LABEL.get(v) ?? v)
      const desc = feats.length ? feats.join(' ') : 'any word'
      return t.lemma ? `${desc} (${t.lemma})` : desc
    })
    const join = ran.ordered ? ' then ' : ' + '
    return `${parts.join(join)} · within ${ran.within} word${ran.within === 1 ? '' : 's'}${ran.ordered ? ', in order' : ''}${ran.sameVerse ? ', same verse' : ''}`
  }, [ran])

  const crossCount = hits?.filter(h => h.crossesVerse).length ?? 0

  // Never available during a lockdown exam — same rule as the rest of Search.
  if (mounted && isExamLocked()) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center text-gray-500">
        Search is unavailable during a Translation Exam.
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <button type="button" onClick={() => router.push('/search')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-brand-600 transition-colors hover:text-brand-800">
        <ArrowLeft size={16} /> Back to Search
      </button>

      <div className="mb-1 flex items-baseline gap-2">
        <h1 className="text-lg font-semibold text-gray-900">Construct search</h1>
        <span className="text-[11px] text-gray-400">· New Testament</span>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        Find two or three words near each other by their grammar — e.g. an aorist participle within
        four words of a dative noun. Ticking more than one option in a box means <em>either</em>.
      </p>

      {/* ─── Builder ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {query.terms.map((t, i) => (
          <div key={i}>
            <ConstructTermCard
              index={i} term={t} lemmaPos={lemmaPos}
              onChange={nt => setTerm(i, nt)}
              onRemove={query.terms.length > 2 ? () => removeTerm(i) : undefined}
            />
            {/* Connector — the distance between this word and the next. */}
            {i < query.terms.length - 1 && (
              <div className="my-2 flex flex-wrap items-center gap-x-4 gap-y-2 px-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  within
                  <select value={query.within} onChange={e => setQuery(q => ({ ...q, within: Number(e.target.value) }))}
                    className="rounded border border-gray-300 bg-surface px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400">
                    {Array.from({ length: CONSTRUCT_MAX_WITHIN }, (_, n) => n + 1).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  word{query.within === 1 ? '' : 's'}
                </label>
                {/* Order and verse-confinement are properties of the whole construct, so they
                    only show once, on the first connector. */}
                {i === 0 && (
                  <>
                    <span className="flex items-center gap-2 text-xs text-gray-600">
                      {([[false, 'either order'], [true, 'in order']] as const).map(([val, label]) => (
                        <label key={label} className="flex cursor-pointer items-center gap-1">
                          <input type="radio" name="construct-order" checked={query.ordered === val}
                            onChange={() => setQuery(q => ({ ...q, ordered: val }))}
                            className="h-3 w-3 accent-brand-600" />
                          {label}
                        </label>
                      ))}
                    </span>
                    <label className="flex cursor-pointer items-center gap-1 text-xs text-gray-600"
                      title="Off: a construct may straddle a verse boundary (those hits are flagged in the results)">
                      <input type="checkbox" checked={query.sameVerse}
                        onChange={e => setQuery(q => ({ ...q, sameVerse: e.target.checked }))}
                        className="h-3 w-3 accent-brand-600" />
                      same verse only
                    </label>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {query.terms.length < CONSTRUCT_MAX_TERMS && (
          <button type="button" onClick={addTerm}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-surface px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
            <Plus size={13} /> Add a word
          </button>
        )}
        <button type="button" onClick={runSearch} disabled={!runnable}
          title={runnable ? undefined : 'Give at least two words something to match — a part of speech, a form, or a lexeme'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400">
          <Search size={14} /> Search
        </button>
        {!runnable && (
          <span className="text-xs text-gray-400">Set a part of speech, form, or lexeme on at least two words.</span>
        )}
      </div>

      {/* ─── Results ─────────────────────────────────────────────────────── */}
      {ran && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="mb-2 text-xs text-gray-500">{summary}</p>
          {loading ? (
            <p className="inline-flex w-full items-center justify-center gap-2 py-16 text-center text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" /> Searching…
            </p>
          ) : !hits || hits.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">No matches. Try a larger distance, or fewer constraints.</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 pb-2">
                <p className="text-xs text-gray-400">
                  {hits.length}{truncated ? '+' : ''} verse{hits.length === 1 ? '' : 's'}
                  {crossCount > 0 && <span className="text-gray-300"> · {crossCount} straddle a verse boundary</span>}
                </p>
                <select value={transLang} onChange={e => setTransLang(e.target.value)}
                  title="Parallel translation column"
                  className="rounded-md border border-gray-200 bg-surface px-2 py-1 text-[11px] text-gray-600">
                  <option value="none">No translation</option>
                  <option value="en">English (WEB)</option><option value="bsb">English (BSB)</option>
                  <option value="es">Spanish</option><option value="fr">French</option><option value="pt">Portuguese</option>
                  <option value="ru">Russian</option><option value="ko">Korean</option><option value="zh">Mandarin</option>
                </select>
              </div>
              {truncated && (
                <p className="mb-2 text-[11px] text-gray-400">
                  Showing the first {hits.length} verses — narrow the construct to see the rest.
                </p>
              )}
              <GreekSearchResults
                hits={hits}
                terms={[]}
                corpus="GNT"
                bookName={bookName}
                context={0}
                ctxMap={{}}
                transLang={transLang}
                onOpen={openHit}
                isAuthenticated={isAuthenticated}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
