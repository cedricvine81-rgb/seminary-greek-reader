'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { READING_LANGS, defaultReadingLang } from '@/lib/reading-language'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { formatNumber } from '@/lib/i18n/format'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Library, Lightbulb, Link2, Loader2, Plus, Search } from 'lucide-react'
import { GreekSearchResults, type GreekHit } from './GreekSearchResults'
import { ConstructTermCard } from './ConstructTermCard'
import { ConstructProseResults, type ProseHit } from './ConstructProseResults'
import { ConstructAllResults, type CorpusBlock } from './ConstructAllResults'
import { ConstructScopePicker, type ScopeEntry } from './ConstructScopePicker'
import { CONSTRUCT_PRESETS } from '@/lib/construct-presets'
import { HEBREW_CONSTRUCT_PRESETS } from '@/lib/construct-presets-hebrew'
import { vocabFor } from '@/lib/morph-vocab'
import {
  CONSTRUCT_MAX_TERMS, CONSTRUCT_MAX_WITHIN, emptyTerm, encodeConstruct, queryIsRunnable,
  termIsEmpty, toBiblicalHit, CONSTRUCT_ALL, CONSTRUCT_CORPORA, corpusInfo, isProseCorpus,
  type ConstructCorpus, type ConstructQuery, type ConstructTerm, type LemmaForms,
} from '@/lib/construct-query'
import { describeConstruct } from '@/lib/construct-assignment'
import { ConstructTextPanel, type ConstructTextTarget } from './ConstructTextPanel'
import { FEATURE_LABEL } from '@/lib/morph-features'
import { isExamLocked } from '@/lib/exam-lockdown'

// Construct search — "find an aorist participle within 4 words of a dative noun". Two or three
// morphological terms plus a distance, run over the flat token index for the chosen corpus —
// New Testament or Septuagint, one at a time (construct-search.ts).
//
// Reached from the "Construct" link on the full /search page. Deliberately its own route rather
// than a scope of SearchPageView: the builder needs vertical room, and the text-query search is
// left completely untouched. Results reuse GreekSearchResults, so a hit behaves like any other
// search hit (click a word for parsing, right-click to highlight or search it).
//
// Matched words are red-highlighted by LEMMA (the same contract as the morphology search), so a
// verse that repeats a matched lexeme highlights each occurrence, not only the matched one.

type Hit = GreekHit & { crossesVerse?: boolean }

// Why a construct found nothing. A term matching zero words is a different problem from two terms
// that both match but never stand near each other, and without this the two look identical — which
// is how a stale part of speech ("a verb whose lemma is ἵνα") once returned nothing in silence.
function NoMatches({ query, termTotals }: { query: ConstructQuery; termTotals: number[] }) {
  const t = useT()
  const used = query.terms.filter(term => !termIsEmpty(term) && !term.negate)
  const describe = (term: ConstructTerm) => {
    const feats = Object.values(term.features).flat().map(v => FEATURE_LABEL.get(v) ?? v)
    const desc = feats.length ? feats.join(' ') : t('cq.anyWord')
    return term.lemma ? `${desc} (${term.lemma})` : desc
  }
  const empties = used.filter((_, i) => (termTotals[i] ?? 0) === 0)
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-gray-500">No matches.</p>
      {termTotals.length > 0 && (
        <div className="mx-auto mt-3 max-w-md text-left">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">What each word found on its own</p>
          <div className="space-y-0.5">
            {used.map((term, i) => (
              <p key={i} className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate text-gray-600">{describe(term)}</span>
                <span className={`flex-none tabular-nums ${(termTotals[i] ?? 0) === 0 ? 'font-semibold text-red-600' : 'text-gray-400'}`}>
                  {(termTotals[i] ?? 0).toLocaleString()}
                </span>
              </p>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-snug text-gray-500">
            {empties.length > 0
              ? t('cq.noneOnItsOwn')
              : t('cq.neverWithinDistance')}
          </p>
        </div>
      )}
    </div>
  )
}

export function ConstructSearchPage({ initial, isAuthenticated = false }: {
  initial: ConstructQuery
  isAuthenticated?: boolean
}) {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const [query, setQuery] = useState<ConstructQuery>(initial)
  // The query that produced the results below — set only when a search actually runs, so
  // editing the builder doesn't invalidate what's on screen until you press Search.
  const [ran, setRan] = useState<ConstructQuery | null>(() => (queryIsRunnable(initial) ? initial : null))
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [proseHits, setProseHits] = useState<ProseHit[] | null>(null)
  const [truncated, setTruncated] = useState(false)
  // The true number of matching passages, which can exceed the number returned.
  const [total, setTotal] = useState(0)
  // How many words each term matched on its own — the explanation when a construct finds nothing.
  const [termTotals, setTermTotals] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [bookName, setBookName] = useState<Map<string, string>>(new Map())
  // Follows the reader's language, like the other parallel columns.
  const [transLang, setTransLang] = useState(() => defaultReadingLang(locale))
  const [showProseEnglish, setShowProseEnglish] = useState(false)
  // 'Search all' returns a per-corpus distribution rather than one list.
  const [allBlocks, setAllBlocks] = useState<{ blocks: CorpusBlock[]; total: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // normalized lemma → the forms that lemma is attested in, so typing a Greek word narrows that
  // card to real choices only (scripts/build-construct-index.mjs).
  const [lemmaForms, setLemmaForms] = useState<Map<string, LemmaForms>>()
  // What each corpus can be limited to — books for the biblical texts, works for the prose ones.
  const [scopes, setScopes] = useState<Record<string, ScopeEntry[]>>({})
  const [showScope, setShowScope] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [copied, setCopied] = useState(false)

  // Book display names (osisId → name) for both corpora, as on the other search pages.
  useEffect(() => {
    fetch('/data/construct/works.json').then(r => r.ok ? r.json() : null)
      .then((d: Record<string, ScopeEntry[]> | null) => { if (d) setScopes(d) })
      .catch(() => {})
    fetch('/data/books.json').then(r => r.ok ? r.json() : null)
      .then((d: { gnt?: { osisId: string; name: string }[]; lxx?: { osisId: string; name: string }[] } | null) => {
        if (!d) return
        setBookName(new Map([...(d.gnt ?? []), ...(d.lxx ?? [])].map(b => [b.osisId, b.name])))
      }).catch(() => {})
  }, [])

  // The lemma table for the chosen corpus. Small enough to hold in the page for both, so the word
  // field never waits on a request; re-fetched when the corpus changes (cached by the browser).
  useEffect(() => {
    let live = true
    setLemmaForms(undefined)
    fetch(`/data/lemma-forms-${query.corpus.toLowerCase()}.json`).then(r => r.ok ? r.json() : null)
      .then((d: Record<string, LemmaForms> | null) => { if (live && d) setLemmaForms(new Map(Object.entries(d))) })
      .catch(() => {})
    return () => { live = false }
  }, [query.corpus])

  // Run whenever a search is committed (`ran`), including on load from a shared link.
  useEffect(() => {
    if (!ran) return
    let live = true
    setLoading(true)
    // "All Greek texts" runs ONE REQUEST PER CORPUS rather than one that walks all nine. Measured in
    // production, the single-request version took a flat 6.8-7.6s — it has to JSON.parse 160 MB of
    // index every time — which sits uncomfortably close to Vercel's function limit. Nine parallel
    // requests spread that across instances, each parsing one corpus, and rows appear as they land.
    if (ran.corpus === CONSTRUCT_ALL) {
      const blocks: CorpusBlock[] = []
      let done = 0
      CONSTRUCT_CORPORA.forEach(c => {
        const p = encodeConstruct({ ...ran, corpus: c.id })
        p.set('type', 'construct')
        p.set('limit', '5')
        fetch(`/api/search?${p.toString()}`)
          .then(r => (r.ok ? r.json() : null))
          .then((d: any) => {
            if (!live) return
            blocks.push({
              corpus: c.id,
              count: d?.total ?? 0,
              prose: !!d?.prose,
              results: d?.prose ? (d.results ?? []) : (d?.results ?? []).map(toBiblicalHit),
            })
            // Show the table as each corpus reports, in the canonical order rather than arrival.
            const ordered = CONSTRUCT_CORPORA
              .map(x => blocks.find(b => b.corpus === x.id))
              .filter((b): b is CorpusBlock => !!b)
            setAllBlocks({ blocks: ordered, total: ordered.reduce((n, b) => n + b.count, 0) })
          })
          .catch(() => {})
          .finally(() => { if (live && ++done === CONSTRUCT_CORPORA.length) setLoading(false) })
      })
      setHits(null); setProseHits(null); setTruncated(false)
      return () => { live = false }
    }

    const params = encodeConstruct(ran)
    params.set('type', 'construct')
    fetch(`/api/search?${params.toString()}`)
      .then(r => r.ok ? r.json() : { results: [] })
      .then((d: { all?: boolean; corpora?: any[]; total?: number; termTotals?: number[]; prose?: boolean; results?: any[]; truncated?: boolean }) => {
        if (!live) return
        if (d.all) {
          // The biblical renderer keys hits by `osisId`; the API speaks `bookId`. Without this the
          // reference renders as a bare "2:1" with no book name.
          const blocks = (d.corpora ?? []).map((b: any) => b.prose ? b : {
            ...b,
            results: (b.results ?? []).map(toBiblicalHit),
          })
          setAllBlocks({ blocks: blocks as CorpusBlock[], total: d.total ?? 0 })
          setHits(null); setProseHits(null); setTruncated(false)
          return
        }
        setAllBlocks(null)
        if (d.prose) {
          setProseHits((d.results ?? []) as ProseHit[])
          setHits(null)
        } else {
          setProseHits(null)
          setHits((d.results ?? []).map(toBiblicalHit))
        }
        setTruncated(!!d.truncated)
        setTotal(d.total ?? (d.results ?? []).length)
        setTermTotals(d.termTotals ?? [])
      })
      .catch(() => { if (live) { setHits([]); setProseHits(null); setAllBlocks(null); setTruncated(false) } })
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

  // Clicking a hit opens the passage in a side panel rather than navigating to the reader
  // and losing the search. Both kinds of result feed the same panel; it knows how to load each.
  const [panel, setPanel] = useState<{ target: ConstructTextTarget; nonce: number } | null>(null)
  const showPanel = useCallback((target: ConstructTextTarget) => {
    // nonce keys the panel, so clicking a second hit while one is open remounts it on the new
    // passage (fresh fetch + scroll) instead of leaving the previous text in place.
    setPanel(prev => ({ target, nonce: (prev?.nonce ?? 0) + 1 }))
  }, [])

  const openHit = useCallback((h: GreekHit) => {
    showPanel({
      kind: 'biblical',
      osisId: h.osisId,
      chapter: h.chapter,
      verse: h.verse,
      corpus: ran?.corpus === 'LXX' ? 'LXX' : 'NA1904',
      label: `${bookName.get(h.osisId) ?? h.osisId} ${h.chapter}:${h.verse}`,
    })
  }, [showPanel, ran, bookName])

  const openProseHit = useCallback((h: ProseHit) => {
    if (!h.target) return
    showPanel({
      kind: 'prose',
      source: h.target.source,
      chapter: h.target.chapter,
      verse: h.target.verse ?? h.verse,
      label: h.reference,
      href: `/texts?open=${encodeURIComponent(JSON.stringify(h.target))}`,
    })
  }, [showPanel])

  // Plain-language echo of what was searched, above the results. Shared with the
  // Construct Search assignment views, which print the same line without running anything.
  const summary = useMemo(() => (ran ? describeConstruct(ran) : ''), [ran])

  const crossCount = hits?.filter(h => h.crossesVerse).length ?? 0
  const scopeIsWorks = isProseCorpus(query.corpus)
  const scopeAvailable = query.corpus !== CONSTRUCT_ALL && (scopes[query.corpus]?.length ?? 0) > 0

  // Never available during a lockdown exam — same rule as the rest of Search.
  if (mounted && isExamLocked()) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center text-gray-500">
        {t('cq.unavailableInExam')}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold text-gray-900">{t('cq.title')}</h1>
        {/* Which Greek text. One at a time — see ConstructCorpus. Switching corpus keeps the
            construct you've built, so you can run the same query against the other text. */}
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          {t('cq.searchIn')}
          <select value={query.corpus}
            onChange={e => {
              // Book ids are corpus-specific, so a scope can't survive the switch.
              const corpus = e.target.value as ConstructCorpus
              setQuery(q => ({ ...q, corpus, books: undefined }))
              setShowScope(false)
            }}
            className="rounded border border-gray-300 bg-surface px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value={CONSTRUCT_ALL}>{t('cq.allGreekTexts')}</option>
            <optgroup label={t('cq.biblicalHandTagged')}>
              {CONSTRUCT_CORPORA.filter(c => c.kind === 'bible').map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </optgroup>
            <optgroup label={t('cq.otherMachineTagged')}>
              {CONSTRUCT_CORPORA.filter(c => c.kind === 'prose').map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </optgroup>
          </select>
        </label>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        <span dangerouslySetInnerHTML={{ __html: t('cq.intro') }} />
      </p>
      {/* Worked constructions. The builder is powerful and a blank one teaches nothing — these open
          it on something real, and each is an ordinary query that can then be edited or re-scoped.
          Counts are the New Testament's, checked against the corpus, so a wrong result shows. */}
      <div className="mb-3">
        {/* Both pickers share one row — they are each a single short chip, and stacking them
            cost a whole row of vertical space above the builder. Their panels open beneath. */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowExamples(v => !v)} aria-expanded={showExamples}
            className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors ${
              showExamples ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-surface text-gray-600 hover:bg-gray-50'}`}>
            <Lightbulb size={13} /> {t('cq.examples')}
            <ChevronDown size={12} className={`transition-transform ${showExamples ? 'rotate-180' : ''}`} />
          </button>
          {/* Limit to particular books or works. Not offered for "search all", where a book id
              would be ambiguous across corpora — the distribution is how you narrow there. */}
          {scopeAvailable && (
            <button type="button" onClick={() => setShowScope(v => !v)} aria-expanded={showScope}
              className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors ${
                query.books?.length
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-gray-300 bg-surface text-gray-600 hover:bg-gray-50'}`}>
              <Library size={13} />
              {query.books?.length
                ? t(scopeIsWorks ? 'cq.workCount' : 'cq.bookCount', { count: query.books.length, n: query.books.length })
                : t(scopeIsWorks ? 'cq.allWorks' : 'cq.allBooks')}
              <ChevronDown size={12} className={`transition-transform ${showScope ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        {scopeAvailable && showScope && (
          <ConstructScopePicker
            entries={scopes[query.corpus] ?? []}
            selected={query.books ?? []}
            biblical={!isProseCorpus(query.corpus)}
            onChange={ids => setQuery(q => ({ ...q, books: ids.length ? ids : undefined }))}
            onClose={() => setShowScope(false)}
          />
        )}
        {showExamples && (
          <div className="mt-2 max-h-[46vh] space-y-3 overflow-y-auto rounded-xl border border-gray-200 bg-surface p-3">
            {(query.corpus === 'MT' ? HEBREW_CONSTRUCT_PRESETS : CONSTRUCT_PRESETS).map(group => (
              <div key={group.heading}>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">{group.heading}</p>
                <div className="space-y-1">
                  {group.presets.map(preset => (
                    <button key={preset.label} type="button"
                      onClick={() => {
                        const next = { ...preset.query, corpus: query.corpus } as ConstructQuery
                        setQuery(next)
                        setShowExamples(false)
                        router.replace(`/search/construct?${encodeConstruct(next).toString()}`, { scroll: false })
                        setRan(next)
                      }}
                      className="w-full rounded-lg border border-gray-100 px-2.5 py-1.5 text-left transition-colors hover:border-brand-200 hover:bg-brand-50">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-xs font-medium text-gray-800">{preset.label}</span>
                        <span className="flex-none text-[10px] tabular-nums text-gray-400">{t('cq.approxIn', { n: formatNumber(preset.approx, locale), corpus: query.corpus === 'MT' ? 'MT' : 'NT' })}</span>
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">{preset.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {query.corpus !== CONSTRUCT_ALL && corpusInfo(query.corpus).tagging === 'machine' && (
        <p className="mb-4 rounded-lg border border-amber-200/70 bg-amber-50/50 px-3 py-2 text-xs text-gray-600">
          <span dangerouslySetInnerHTML={{ __html: t('cq.machineParsedWarning') }} />
        </p>
      )}

      {/* ─── Builder ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {query.terms.map((term, i) => (
          <div key={i}>
            <ConstructTermCard
              index={i} termCount={query.terms.length} term={term} corpus={query.corpus}
              lemmaForms={lemmaForms}
              onChange={nt => setTerm(i, nt)}
              onRemove={query.terms.length > 2 ? () => removeTerm(i) : undefined}
            />
            {/* Connector — the distance between this word and the next. */}
            {i < query.terms.length - 1 && (
              <div className="my-2 flex flex-wrap items-center gap-x-4 gap-y-2 px-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  {t('cq.withinPrefix')}
                  <select value={query.within} onChange={e => setQuery(q => ({ ...q, within: Number(e.target.value) }))}
                    className="rounded border border-gray-300 bg-surface px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500">
                    {Array.from({ length: CONSTRUCT_MAX_WITHIN }, (_, n) => n + 1).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  {t('cq.wordUnit', { count: query.within })}
                </label>
                {/* Order and verse-confinement are properties of the whole construct, so they
                    only show once, on the first connector. */}
                {i === 0 && (
                  <>
                    <span className="flex items-center gap-2 text-xs text-gray-600">
                      {([[false, t('cq.eitherOrder')], [true, t('cq.inOrder')]] as const).map(([val, label]) => (
                        <label key={label} className="flex cursor-pointer items-center gap-1">
                          <input type="radio" name="construct-order" checked={query.ordered === val}
                            onChange={() => setQuery(q => ({ ...q, ordered: val }))}
                            className="h-3 w-3 accent-brand-600" />
                          {label}
                        </label>
                      ))}
                    </span>
                    <label className="flex cursor-pointer items-center gap-1 text-xs text-gray-600"
                      title={t('cq.sameVerseTitle')}>
                      <input type="checkbox" checked={query.sameVerse}
                        onChange={e => setQuery(q => ({ ...q, sameVerse: e.target.checked }))}
                        className="h-3 w-3 accent-brand-600" />
                      {t('cq.sameVerseOnly')}
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
            <Plus size={13} /> {t('cq.addWord')}
          </button>
        )}
        {/* A construct is entirely described by its URL, so a search can be handed to students as a
            link — pasted into an assignment's instructions, or into a message. Copies the search
            that RAN, not the one being edited, so the link always matches what was seen. */}
        {ran && (
          <button type="button"
            onClick={() => {
              const url = `${window.location.origin}/search/construct?${encodeConstruct(ran).toString()}`
              const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000) }
              // The clipboard API needs a secure context and permission, and silently rejects
              // otherwise — leaving the button looking broken. Fall back to a selected textarea,
              // which works anywhere, and only report success when something actually copied.
              const fallback = () => {
                const el = document.createElement('textarea')
                el.value = url
                el.style.position = 'fixed'
                el.style.opacity = '0'
                document.body.appendChild(el)
                el.select()
                let ok = false
                try { ok = document.execCommand('copy') } catch { ok = false }
                document.body.removeChild(el)
                if (ok) done(); else window.prompt(t('cq.copyThisLink'), url)
              }
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(url).then(done).catch(fallback)
              } else {
                fallback()
              }
            }}
            title={t('cq.copyLinkTitle')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-surface px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
            {copied ? <><Check size={13} /> {t('cq.linkCopied')}</> : <><Link2 size={13} /> {t('cq.copyLink')}</>}
          </button>
        )}
                <button type="button" onClick={runSearch} disabled={!runnable}
          title={runnable ? undefined : t('cq.needSomethingToMatch')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400">
          <Search size={14} /> {t('cq.search')}
        </button>
        {!runnable && (
          <span className="text-xs text-gray-400">Set a part of speech, form, or lexeme on at least one word.</span>
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
          ) : ran.corpus === CONSTRUCT_ALL ? (
            !allBlocks || allBlocks.total === 0 ? (
              <p className="py-16 text-center text-sm text-gray-400">No matches in any text. Try a larger distance, or fewer constraints.</p>
            ) : (
              <ConstructAllResults
                blocks={allBlocks.blocks}
                total={allBlocks.total}
                bookName={bookName}
                transLang="none"
                onOpen={openHit}
                onDrillDown={c => { const next = { ...query, corpus: c }; setQuery(next); router.replace(`/search/construct?${encodeConstruct(next).toString()}`, { scroll: false }); setRan(next) }}
                isAuthenticated={isAuthenticated}
              />
            )
          ) : isProseCorpus(ran.corpus) ? (
            // Prose corpora get their own view — see ConstructProseResults.
            !proseHits || proseHits.length === 0 ? (
              <NoMatches query={ran} termTotals={termTotals} />
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 pb-2">
                  <p className="text-xs text-gray-400">
                    {truncated
                      ? <>{t('cq.showingOf', { shown: proseHits.length, total: formatNumber(total, locale) })}</>
                      : <>{t('cq.passageCount', { count: total, n: formatNumber(total, locale) })}</>}
                  </p>
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <input type="checkbox" checked={showProseEnglish}
                      onChange={e => setShowProseEnglish(e.target.checked)}
                      className="h-3 w-3 accent-brand-600" />
                    {t('cq.showTheEnglish')}
                  </label>
                </div>
                {truncated && (
                  <p className="mb-2 text-[11px] text-gray-400">
                    {t('cq.showingFirstOf', { shown: proseHits.length, total: formatNumber(total, locale) })}
                  </p>
                )}
                <ConstructProseResults hits={proseHits} showEnglish={showProseEnglish} onOpen={openProseHit} />
              </>
            )
          ) : !hits || hits.length === 0 ? (
            <NoMatches query={ran} termTotals={termTotals} />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 pb-2">
                <p className="text-xs text-gray-400">
                  {truncated
                    ? <>showing {hits.length} of {total.toLocaleString()} verses</>
                    : <>{total.toLocaleString()} verse{total === 1 ? '' : 's'}</>}
                  {crossCount > 0 && <span className="text-gray-300"> · {crossCount} straddle a verse boundary</span>}
                </p>
                <select value={transLang} onChange={e => setTransLang(e.target.value)}
                  title={t('search.parallelTitle')}
                  className="rounded-md border border-gray-200 bg-surface px-2 py-1 text-[11px] text-gray-600">
                  <option value="none">{t('search.noTranslation')}</option>
                  {/* Driven by READING_LANGS rather than a hand-written list: this was the
                      fourth copy of the same eight languages, and it had already lost the
                      labels the others use. */}
                  {READING_LANGS.map(l => <option key={l.code} value={l.code}>{t(l.labelKey)}</option>)}
                </select>
              </div>
              {truncated && (
                <p className="mb-2 text-[11px] text-gray-400">
                  {t('cq.showingFirstOf', { shown: hits.length, total: formatNumber(total, locale) })}
                </p>
              )}
              {/* Biblical only — the prose branch above returns before reaching this. */}
              <GreekSearchResults
                hits={hits}
                terms={[]}
                corpus={ran.corpus === 'LXX' ? 'LXX' : ran.corpus === 'MT' ? 'MT' : 'NA1904'}
                snippetLongVerses
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

      {/* The clicked passage, read beside the builder and results (see ConstructTextPanel). */}
      {panel && (
        <ConstructTextPanel key={panel.nonce} target={panel.target} onClose={() => setPanel(null)} />
      )}
    </div>
  )
}
