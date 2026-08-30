'use client'

// Register — the tool page. Fetches the prebuilt index once and does the arithmetic in the
// browser: 433 works over 150 dimensions is milliseconds, and keeping it client-side means
// changing lens or target is instant rather than a round trip.
//
// A PASSAGE is the exception: it has to be profiled from the tagged corpus, which lives on the
// server, so that one selection costs a request. Everything after it — the ranking, the
// why-table, switching lens — runs on the returned profile like any other unit.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Info, Printer } from 'lucide-react'
import clsx from 'clsx'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { bookName } from '@/lib/i18n/book-names'
import {
  CORPUS_KEY, chunksOf, explain, explainDelta, explainVocab, featureSpread, isBiblical,
  neighbours, passageUnit, sharedFeatures, sharedWords,
  type Lens, type PassageManifest, type PassageProfile, type StyleFeature, type StyleMeta,
  type StyleUnit, type VocabFile,
} from '@/lib/style-register'
import { PassagePicker, type PassageSelection } from './PassagePicker'
import { RegisterReport, REPORT_CITATION_LIMIT, type CitationMap } from './RegisterReport'

const LENSES: { id: Lens; key: string }[] = [
  { id: 'register', key: 'reg.lens.register' },
  { id: 'syntax', key: 'reg.lens.syntax' },
  { id: 'vocabulary', key: 'reg.lens.vocabulary' },
]

type Mode = 'work' | 'passage'

/* ── the comparison as a link ────────────────────────────────────────────────
 * A ranking nobody can send to anyone is half a tool: the natural next move after finding
 * that Luke 1-2 sits with the Septuagint is to show someone. The state goes in the query
 * string, and is read back on mount so a pasted link opens on the same comparison.
 *
 * Written with history.replaceState rather than the router: this is a bookmark, not a
 * navigation, and every keystroke in a chapter box should not become a history entry.
 */
interface UrlState {
  mode: Mode
  work: string
  lens: Lens
  outside: boolean
  short: boolean
  passage: { corpus: string; book: string; fromCh: number; toCh: number } | null
}

function readUrl(): UrlState {
  const fallback: UrlState = {
    mode: 'work', work: 'Mark', lens: 'register', outside: false, short: false, passage: null,
  }
  if (typeof window === 'undefined') return fallback
  const q = new URLSearchParams(window.location.search)
  const book = q.get('book')
  const from = Number(q.get('from'))
  const to = Number(q.get('to'))
  const hasPassage = !!book && Number.isFinite(from) && from > 0 && Number.isFinite(to) && to > 0
  return {
    mode: q.get('mode') === 'passage' && hasPassage ? 'passage' : 'work',
    work: q.get('work') || fallback.work,
      lens: q.get('lens') === 'syntax' ? 'syntax'
      : q.get('lens') === 'vocabulary' ? 'vocabulary' : 'register',
    outside: q.get('outside') === '1',
    short: q.get('short') === '1',
    passage: hasPassage
      ? { corpus: (q.get('corpus') || 'GNT').toUpperCase(), book: book!, fromCh: from, toCh: to }
      : null,
  }
}

function writeUrl(s: UrlState): void {
  if (typeof window === 'undefined') return
  const q = new URLSearchParams()
  q.set('mode', s.mode)
  q.set('lens', s.lens)
  if (s.outside) q.set('outside', '1')
  if (s.short) q.set('short', '1')
  if (s.mode === 'passage' && s.passage) {
    q.set('corpus', s.passage.corpus)
    q.set('book', s.passage.book)
    q.set('from', String(s.passage.fromCh))
    q.set('to', String(s.passage.toCh))
  } else {
    q.set('work', s.work)
  }
  window.history.replaceState(null, '', `${window.location.pathname}?${q}`)
}

export function RegisterView() {
  const t = useT()
  const locale = useLocale()
  const [meta, setMeta] = useState<StyleMeta | null>(null)
  const [units, setUnits] = useState<StyleUnit[] | null>(null)
  const [manifest, setManifest] = useState<PassageManifest | null>(null)
  const [error, setError] = useState(false)
  const initial = useMemo(readUrl, [])
  const [mode, setMode] = useState<Mode>(initial.mode)
  const [target, setTarget] = useState(initial.work)
  const [lens, setLens] = useState<Lens>(initial.lens)
  const [outsideOnly, setOutsideOnly] = useState(initial.outside)
  const [includeShort, setIncludeShort] = useState(initial.short)
  const [showAll, setShowAll] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState<PassageSelection | null>(null)
  const [passage, setPassage] = useState<StyleUnit | null>(null)
  const [loadingPassage, setLoadingPassage] = useState(false)
  const [passageError, setPassageError] = useState(false)
  const [vocab, setVocab] = useState<VocabFile | null>(null)
  const [passageVocab, setPassageVocab] = useState<[string, number][] | null>(null)
  const [citations, setCitations] = useState<CitationMap | null>(null)
  const [preparing, setPreparing] = useState(false)

  // The biblical books localize through book-names.ts; a prose title stays as it is cited.
  const nameOf = (u: StyleUnit) => (isBiblical(u.corpus) && !u.work.startsWith('passage:')
    ? bookName(u.work, locale, u.label) : u.label)
  const corpusOf = (u: StyleUnit) => (CORPUS_KEY[u.corpus] ? t(CORPUS_KEY[u.corpus]) : u.corpus)
  // Keyed off the feature id so the builder stays the single source of the feature set; a
  // feature added there before its message exists shows its English label, not a key.
  const featureLabel = (f: StyleFeature) => {
    const key = `reg.f.${f.key}`
    const hit = t(key)
    return hit === key ? f.label : hit
  }

  useEffect(() => {
    let live = true

    // One file, because a unit's `delta` is positional against meta.deltaWords and scored
    // against meta.norm — fetched separately, an hour of cache could pair a fresh half with a
    // stale one after a deploy.
    //
    // That leaves the other half of the same problem: public/data is cached for an hour, so a
    // reader who was here before a deploy gets an index that is internally consistent and
    // simply OLD. An index missing a field the code now reads does not fail — it silently
    // computes against a default, and the page shows plausible wrong numbers. So the shape is
    // checked, and a stale one is refetched past the cache once before giving up.
    const complete = (idx: unknown) => {
      const i = idx as { meta?: StyleMeta; units?: unknown[] } | null
      return !!i?.meta?.norm?.mu && !!i.meta.center && !!i.meta.spread
        && Array.isArray(i.units) && i.units.length > 0
    }

    const load = async () => {
      let idx = await fetch('/data/style/index.json').then(r => r.json())
      if (!complete(idx)) {
        idx = await fetch('/data/style/index.json', { cache: 'reload' }).then(r => r.json())
      }
      if (!complete(idx)) throw new Error('style index is not usable')
      const passages = await fetch('/data/style/passages.json').then(r => r.json())
      return { idx, passages }
    }

    load()
      .then(({ idx, passages }) => {
        if (!live) return
        setMeta(idx.meta); setUnits(idx.units); setManifest(passages)
      })
      .catch(() => { if (live) setError(true) })
    return () => { live = false }
  }, [])

  // 1.9MB of content-word lists, fetched only if the reader asks for that lens.
  useEffect(() => {
    if (lens !== 'vocabulary' || vocab) return
    let live = true
    fetch('/data/style/vocab.json').then(r => r.json())
      .then((v: VocabFile) => { if (live && v?.works) setVocab(v) })
      .catch(() => { if (live) setError(true) })
    return () => { live = false }
  }, [lens, vocab])

  const works = useMemo(
    () => (units ?? []).filter(u => u.kind === 'work')
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b), locale)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [units, locale],
  )
  const spread = useMemo(() => (units ? featureSpread(units) : {}), [units])

  /* ── the passage request ──────────────────────────────────────────────────
   * Debounced, because the chapter inputs fire on every keystroke and profiling is the cheap
   * half — reading the corpus index is not.
   */
  const fetchPassage = useCallback((s: PassageSelection, alive: () => boolean) => {
    setLoadingPassage(true)
    setPassageError(false)
    const url = `/api/register/passage?corpus=${encodeURIComponent(s.corpus)}`
      + `&book=${encodeURIComponent(s.book)}&from=${s.fromCh}&to=${s.toCh}`
    fetch(url)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('bad'))))
      .then((p: PassageProfile) => {
        if (!alive()) return
        const range = p.span.toCh === p.span.fromCh
          ? `${p.span.fromCh}` : `${p.span.fromCh}–${p.span.toCh}`
        setPassage(passageUnit(p, s.corpus, s.book, `${s.label} ${range}`))
        setPassageVocab(p.content ?? null)
        setOpen(null)
      })
      .catch(() => { if (alive()) { setPassage(null); setPassageError(true) } })
      .finally(() => { if (alive()) setLoadingPassage(false) })
  }, [])

  useEffect(() => {
    if (mode !== 'passage' || !selection) return
    let live = true
    const id = setTimeout(() => fetchPassage(selection, () => live), 250)
    return () => { live = false; clearTimeout(id) }
  }, [mode, selection, fetchPassage])

  useEffect(() => {
    writeUrl({
      mode, work: target, lens, outside: outsideOnly, short: includeShort,
      passage: selection
        ? { corpus: selection.corpus, book: selection.book, fromCh: selection.fromCh, toCh: selection.toCh }
        : null,
    })
  }, [mode, target, lens, outsideOnly, includeShort, selection])

  // A link can name a work the index does not hold — a book under the 400-word floor, or a
  // stale URL. Falling back silently would answer a question nobody asked.
  const requested = works.find(w => w.work === target)
  const workUnit = requested ?? works[0]
  const missingWork = mode === 'work' && !requested && target !== workUnit?.work
  const targetUnit = mode === 'passage' ? passage : workUnit

  // Any change to the comparison makes the gathered references stale; they are re-fetched on
  // the next print rather than kept and printed against a different ranking.
  useEffect(() => { setCitations(null) }, [targetUnit?.work, lens, outsideOnly, includeShort])

  const results = useMemo(() => {
    if (!units || !targetUnit) return []
    if (lens === 'vocabulary' && !vocab) return []
    return neighbours(targetUnit, units, lens, spread, {
      excludeSameCorpus: outsideOnly, reliableOnly: !includeShort,
      limit: showAll ? units.length : 25,
      vocab: vocab?.works,
      targetVocab: mode === 'passage' ? passageVocab : undefined,
    })
  }, [units, targetUnit, lens, spread, outsideOnly, includeShort, showAll, vocab, mode, passageVocab])

  /**
   * Printing gathers the references first.
   *
   * Each one is a pass over a whole work, so this is not something to do on every render or
   * behind the reader's back — it happens once, when they ask for the document, and the button
   * says so while it runs. If it fails the report still prints, with rates and no references:
   * a document short of its citations beats no document.
   */
  const printReport = useCallback(async () => {
    if (!targetUnit || !results.length) return
    if (citations) { window.print(); return }
    setPreparing(true)
    try {
      const cited = results.slice(0, REPORT_CITATION_LIMIT)
      const features = new Set<string>()
      const lemmas = new Set<string>()
      for (const { unit } of cited) {
        if (lens === 'syntax') {
          sharedFeatures(targetUnit, unit, meta!).forEach(r => features.add(r.feature.key))
          explain(targetUnit, unit, meta!.features, spread, 4).forEach(r => features.add(r.feature.key))
        } else if (lens === 'register') {
          sharedWords(targetUnit, unit, meta!).forEach(r => lemmas.add(r.lemma))
        } else if (vocab?.works[unit.work]) {
          explainVocab(
            (mode === 'passage' ? passageVocab : vocab.works[targetUnit.work]) ?? [],
            vocab.works[unit.work]!,
          ).forEach(r => lemmas.add(r.lemma))
        }
      }
      const targetSpec = mode === 'passage' && selection
        ? { id: 'target', corpus: selection.corpus, book: selection.book, fromCh: selection.fromCh, toCh: selection.toCh }
        : { id: 'target', corpus: targetUnit.corpus, work: targetUnit.work }
      const res = await fetch('/api/register/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          units: [targetSpec, ...cited.map(({ unit }) => ({ id: unit.work, corpus: unit.corpus, work: unit.work }))],
          features: Array.from(features), lemmas: Array.from(lemmas), limit: 3,
        }),
      })
      if (res.ok) setCitations(await res.json())
    } catch {
      // The report is still worth printing without them.
    } finally {
      setPreparing(false)
    }
    // Let the state land before the print dialogue freezes the page.
    setTimeout(() => window.print(), 60)
  }, [targetUnit, results, citations, lens, meta, spread, vocab, mode, passageVocab, selection])

  const filteredWorks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? works.filter(w => nameOf(w).toLowerCase().includes(q)) : works
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works, query, locale])

  if (error) return <p className="py-10 text-sm text-red-600">{t('reg.loadFailed')}</p>
  if (!meta || !units || !manifest || !workUnit) {
    return <p className="py-10 text-sm italic text-gray-400">{t('reg.loading')}</p>
  }

  // Absolute, not relative to what is on screen — see meta.barScale for why.
  const [barNear, barFar] = meta.barScale?.[lens] ?? [0.2, 1]
  const barFor = (d: number) => Math.min(1, Math.max(0, (barFar - d) / (barFar - barNear)))
  const chunks = targetUnit ? chunksOf(targetUnit.work, units) : []

  return (
    <div className="space-y-6">
      {targetUnit && (
        <RegisterReport
          meta={meta} lens={lens} targetUnit={targetUnit} results={results} spread={spread}
          vocab={vocab} targetVocab={mode === 'passage' ? passageVocab : null}
          mode={mode} outsideOnly={outsideOnly} includeShort={includeShort}
          citations={citations}
          nameOf={nameOf} corpusOf={corpusOf} featureLabel={featureLabel}
        />
      )}

      {/* The whole interactive surface stands down for print; RegisterReport above is the
          document. Controls and a ranking truncated to what fits a screen are not what
          belongs on paper. */}
      <div className="space-y-6 print:hidden">
      {/* ── what this is, and what it is not ─────────────────────────────── */}
      <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Info size={15} className="shrink-0 text-brand-600" />
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {t('reg.whatItMeasures')}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-gray-700">{t('reg.blurb')}</p>
      </div>

      {/* ── what to compare ──────────────────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-gray-200 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">{t('reg.compare')}</span>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5" role="tablist">
            {(['work', 'passage'] as Mode[]).map(m => (
              <button
                key={m} role="tab" aria-selected={mode === m}
                onClick={() => { setMode(m); setOpen(null) }}
                className={clsx('rounded-md px-3 py-1 text-sm font-medium transition-colors',
                  mode === m ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900')}
              >
                {t(m === 'work' ? 'reg.mode.work' : 'reg.mode.passage')}
              </button>
            ))}
          </div>
        </div>

        {mode === 'work' ? (
          <div className="max-w-md">
            <input
              id="reg-search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder={t('reg.filterWorks')} className="input mb-1.5 w-full text-sm"
            />
            <select
              id="reg-target" value={workUnit.work}
              onChange={e => { setTarget(e.target.value); setOpen(null) }}
              className="input w-full" size={1}
            >
              {filteredWorks.map(w => (
                <option key={w.work} value={w.work}>
                  {nameOf(w)} — {corpusOf(w)} ({w.n.toLocaleString(locale)})
                </option>
              ))}
            </select>
            {query.trim() && !filteredWorks.some(w => w.work === workUnit.work) && (
              <p className="mt-1 text-xs text-amber-700">{t('reg.filterHidesTarget')}</p>
            )}
          </div>
        ) : (
          <PassagePicker manifest={manifest} initial={initial.passage} onChange={setSelection} />
        )}
      </div>

      {/* ── lens ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{t('reg.lens')}</span>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5" role="tablist">
            {LENSES.map(l => (
              <button
                key={l.id} role="tab" aria-selected={lens === l.id}
                onClick={() => setLens(l.id)}
                className={clsx('rounded-md px-3 py-1 text-sm font-medium transition-colors',
                  lens === l.id ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900')}
              >
                {t(l.key)}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={outsideOnly} onChange={e => setOutsideOnly(e.target.checked)} />
          {t('reg.outsideOnly')}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={includeShort} onChange={e => setIncludeShort(e.target.checked)} />
          {t('reg.includeShort')}
        </label>

        {/* The browser's own print dialogue, which is where "save as PDF" lives on every
            platform — the same route the Exegesis workspace takes. */}
        <button
          type="button" onClick={printReport} disabled={!targetUnit || !results.length || preparing}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-40"
        >
          <Printer size={14} /> {preparing ? t('reg.preparing') : t('reg.print')}
        </button>
      </div>

      {missingWork && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t('reg.unknownWork', { work: target })}
        </p>
      )}
      {mode === 'passage' && passageError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t('reg.passageFailed')}
        </p>
      )}
      {targetUnit && !targetUnit.reliable && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t('reg.shortWork', { n: targetUnit.n.toLocaleString(locale) })}
        </p>
      )}

      {/* ── results ──────────────────────────────────────────────────────── */}
      {!targetUnit ? (
        <p className="py-6 text-sm italic text-gray-400">
          {loadingPassage ? t('reg.profiling') : t('reg.pickPassage')}
        </p>
      ) : (
        <div className={clsx(loadingPassage && 'opacity-50 transition-opacity')}>
          <h2 className="mb-1 text-base font-semibold text-gray-900">
            {t(lens === 'vocabulary' ? 'reg.closestVocab'
              : lens === 'syntax' ? 'reg.closestSyntax' : 'reg.closestTo',
              { work: nameOf(targetUnit) })}
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            {t('reg.scaleNoteAbs')}
            {lens === 'vocabulary' && <> {t('reg.vocabCaveat')}</>}
          </p>

          <ul className="divide-y divide-gray-100 border-y border-gray-100">
            {results.map(({ unit, distance }, i) => {
              const pct = barFor(distance)
              const isOpen = open === unit.work
              // The explanation follows the lens. Ranking on function words and then
              // explaining with syntax would justify one number with another.
              //
              // Shared traits lead, because they ARE the claim; the differences follow as its
              // qualification. Listing the biggest differences first argued the opposite case.
              const traits = isOpen && lens === 'syntax' ? sharedFeatures(targetUnit, unit, meta) : []
              const words = isOpen && lens === 'register' ? sharedWords(targetUnit, unit, meta) : []
              const gaps = isOpen && lens === 'syntax'
                ? explain(targetUnit, unit, meta.features, spread, 4) : []
              const wordGaps = isOpen && lens === 'register'
                ? explainDelta(targetUnit, unit, meta, 4) : []
              const shared = isOpen && lens === 'vocabulary' && vocab?.works[unit.work]
                ? explainVocab(
                    (mode === 'passage' ? passageVocab : vocab.works[targetUnit.work]) ?? [],
                    vocab.works[unit.work]!,
                  )
                : []
              return (
                <li key={unit.work}>
                  <button
                    onClick={() => setOpen(isOpen ? null : unit.work)}
                    className="group flex w-full items-center gap-3 py-2.5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="w-6 shrink-0 text-right font-mono text-xs text-gray-400">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900 group-hover:text-brand-700">
                        {nameOf(unit)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {corpusOf(unit)} · {unit.n.toLocaleString(locale)} {t('reg.words')}
                      </span>
                    </span>
                    <span className="hidden h-1.5 w-28 shrink-0 overflow-hidden rounded-full bg-gray-100 sm:block">
                      <span className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.max(2, pct * 100)}%` }} />
                    </span>
                    <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-gray-500">
                      {distance.toFixed(2)}
                    </span>
                    <ChevronRight size={14} className={clsx('shrink-0 text-gray-300 transition-transform', isOpen && 'rotate-90')} />
                  </button>

                  {isOpen && (
                    <div className="pb-4 pl-9 pr-2">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                        {t('reg.shared')}
                      </p>
                      <p className="mb-2 text-xs text-gray-500">{t('reg.sharedNote')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[26rem] text-sm">
                          <thead>
                            {/* Two rows: the two right-hand columns are a pair of rates, and
                                naming the unit over them is the only thing that tells a reader
                                what "6.9" is. It was a footnote under the table before. */}
                            <tr className="text-xs uppercase tracking-wide text-gray-500">
                              <th />
                              <th colSpan={3} className="pb-1 text-right font-semibold">{t('reg.per1000')}</th>
                            </tr>
                            <tr className="text-xs uppercase tracking-wide text-gray-400">
                              <th className="py-1 text-left font-medium">{t(lens === 'syntax' ? 'reg.feature' : 'reg.word')}</th>
                              <th className="py-1 pr-3 text-right font-medium">{nameOf(targetUnit)}</th>
                              <th className="py-1 pr-3 text-right font-medium">{nameOf(unit)}</th>
                              <th className="py-1 text-right font-medium">{t('reg.libraryAvg')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {traits.map(r => (
                              <tr key={r.feature.key} className="border-t border-gray-50">
                                <td className="py-1 pr-3">
                                  <Link href={`/grammar?chapter=${r.feature.chapter}&level=intermediate&track=greek`}
                                    className="text-gray-700 hover:text-brand-700 hover:underline">
                                    {featureLabel(r.feature)}
                                  </Link>
                                  {(r.feature.taggerSensitive || r.feature.approx) && (
                                    <span className="ml-1 text-gray-300" title={t('reg.approxTip')}>~</span>
                                  )}
                                </td>
                                <td className="py-1 pr-3 text-right font-mono tabular-nums text-gray-900">{r.target.toFixed(1)}</td>
                                <td className="py-1 pr-3 text-right font-mono tabular-nums text-gray-900">{r.other.toFixed(1)}</td>
                                <td className="py-1 text-right font-mono tabular-nums text-gray-400">{r.average.toFixed(1)}</td>
                              </tr>
                            ))}
                            {words.map(r => (
                              <tr key={r.lemma} className="border-t border-gray-50">
                                <td className="py-1 pr-3">
                                  <span className="font-reading text-gray-900">{r.display}</span>
                                  {r.gloss && <span className="ml-2 text-xs text-gray-500">{r.gloss}</span>}
                                </td>
                                <td className="py-1 pr-3 text-right font-mono tabular-nums text-gray-900">{r.target.toFixed(1)}</td>
                                <td className="py-1 pr-3 text-right font-mono tabular-nums text-gray-900">{r.other.toFixed(1)}</td>
                                <td className="py-1 text-right font-mono tabular-nums text-gray-400">{r.average.toFixed(1)}</td>
                              </tr>
                            ))}
                            {shared.map(g => (
                              <tr key={g.lemma} className="border-t border-gray-50">
                                <td className="py-1 pr-3 font-reading text-gray-900">{vocab?.labels[g.lemma] ?? g.lemma}</td>
                                <td className="py-1 pr-3 text-right font-mono tabular-nums text-gray-900">{g.target.toFixed(1)}</td>
                                <td className="py-1 pr-3 text-right font-mono tabular-nums text-gray-900">{g.other.toFixed(1)}</td>
                                <td className="py-1 text-right font-mono tabular-nums text-gray-400">—</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {(gaps.length > 0 || wordGaps.length > 0) && (
                        <p className="mt-2 text-xs text-gray-500">
                          <span className="font-semibold uppercase tracking-wide text-gray-400">{t('reg.differs')}: </span>
                          {gaps.map(g => `${featureLabel(g.feature)} ${g.target.toFixed(1)}/${g.other.toFixed(1)}`)
                            .concat(wordGaps.map(g => `${g.display} ${g.target.toFixed(1)}/${g.other.toFixed(1)}`))
                            .join(' · ')}
                        </p>
                      )}
                      {lens === 'syntax' && (
                        <p className="mt-2 text-xs text-gray-500">
                          <span className="text-gray-400">~</span> {t('reg.approxTip')}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          {!showAll && results.length >= 25 && (
            <button onClick={() => setShowAll(true)}
              className="mt-3 text-xs font-medium text-brand-700 hover:underline">
              {t('reg.showAll')}
            </button>
          )}
        </div>
      )}

      {mode === 'work' && targetUnit && chunks.length > 2 && (
        <p className="text-xs text-gray-500">
          {t('reg.chunkNote', { n: chunks.length, work: nameOf(targetUnit), size: meta.chunkWords.toLocaleString(locale) })}
        </p>
      )}
      </div>
    </div>
  )
}
