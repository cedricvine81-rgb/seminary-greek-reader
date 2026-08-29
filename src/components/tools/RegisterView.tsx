'use client'

// Register — the tool page. Fetches the prebuilt index once and does the arithmetic in the
// browser: 433 works over 150 dimensions is milliseconds, and keeping it client-side means
// changing lens or target is instant rather than a round trip.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Info } from 'lucide-react'
import clsx from 'clsx'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { bookName } from '@/lib/i18n/book-names'
import {
  CORPUS_KEY, chunksOf, explain, featureSpread, isBiblical, neighbours,
  type Lens, type StyleFeature, type StyleMeta, type StyleUnit,
} from '@/lib/style-register'

const LENSES: { id: Lens; key: string }[] = [
  { id: 'register', key: 'reg.lens.register' },
  { id: 'syntax', key: 'reg.lens.syntax' },
]

export function RegisterView() {
  const t = useT()
  const locale = useLocale()
  const [meta, setMeta] = useState<StyleMeta | null>(null)
  const [units, setUnits] = useState<StyleUnit[] | null>(null)
  const [error, setError] = useState(false)
  const [target, setTarget] = useState('Mark')
  const [lens, setLens] = useState<Lens>('register')
  const [outsideOnly, setOutsideOnly] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // The biblical books localize through book-names.ts; a prose title stays as it is cited.
  const nameOf = (u: StyleUnit) => (isBiblical(u.corpus) ? bookName(u.work, locale, u.label) : u.label)
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
    Promise.all([
      fetch('/data/style/meta.json').then(r => r.json()),
      fetch('/data/style/units.json').then(r => r.json()),
    ])
      .then(([m, u]) => { if (live) { setMeta(m); setUnits(u) } })
      .catch(() => { if (live) setError(true) })
    return () => { live = false }
  }, [])

  const works = useMemo(
    () => (units ?? []).filter(u => u.kind === 'work')
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b), locale)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [units, locale],
  )
  const spread = useMemo(() => (units ? featureSpread(units) : {}), [units])
  const targetUnit = works.find(w => w.work === target) ?? works[0]

  const results = useMemo(() => {
    if (!units || !targetUnit) return []
    return neighbours(targetUnit, units, lens, spread, {
      excludeSameCorpus: outsideOnly, limit: 25,
    })
  }, [units, targetUnit, lens, spread, outsideOnly])

  const filteredWorks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? works.filter(w => nameOf(w).toLowerCase().includes(q)) : works
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works, query, locale])

  if (error) return <p className="py-10 text-sm text-red-600">{t('reg.loadFailed')}</p>
  if (!meta || !units || !targetUnit) {
    return <p className="py-10 text-sm italic text-gray-400">{t('reg.loading')}</p>
  }

  const maxD = results.length ? results[results.length - 1].distance : 1
  const minD = results.length ? results[0].distance : 0
  const chunks = chunksOf(targetUnit.work, units)

  return (
    <div className="space-y-6">
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

      {/* ── controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="reg-target" className="mb-1 block text-sm font-medium text-gray-700">
            {t('reg.compare')}
          </label>
          <input
            id="reg-search" value={query} onChange={e => setQuery(e.target.value)}
            placeholder={t('reg.filterWorks')} className="input mb-1.5 w-full text-sm"
          />
          <select
            id="reg-target" value={targetUnit.work} onChange={e => { setTarget(e.target.value); setOpen(null) }}
            className="input w-full" size={1}
          >
            {filteredWorks.map(w => (
              <option key={w.work} value={w.work}>
                {nameOf(w)} — {corpusOf(w)} ({w.n.toLocaleString(locale)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700">{t('reg.lens')}</span>
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

        <label className="flex items-center gap-2 pb-1.5 text-sm text-gray-700">
          <input type="checkbox" checked={outsideOnly} onChange={e => setOutsideOnly(e.target.checked)} />
          {t('reg.outsideOnly')}
        </label>
      </div>

      {!targetUnit.reliable && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t('reg.shortWork', { n: targetUnit.n.toLocaleString(locale) })}
        </p>
      )}

      {/* ── results ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          {t('reg.closestTo', { work: nameOf(targetUnit) })}
        </h2>
        <p className="mb-3 text-xs text-gray-500">{t('reg.scaleNote')}</p>

        <ul className="divide-y divide-gray-100 border-y border-gray-100">
          {results.map(({ unit, distance }, i) => {
            const pct = maxD > minD ? 1 - (distance - minD) / (maxD - minD) : 1
            const isOpen = open === unit.work
            const gaps = isOpen ? explain(targetUnit, unit, meta.features, spread) : []
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
                    <span className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.max(4, pct * 100)}%` }} />
                  </span>
                  <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-gray-500">
                    {distance.toFixed(2)}
                  </span>
                  <ChevronRight size={14} className={clsx('shrink-0 text-gray-300 transition-transform', isOpen && 'rotate-90')} />
                </button>

                {isOpen && (
                  <div className="pb-4 pl-9 pr-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                      {t('reg.why')}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[26rem] text-sm">
                        <thead>
                          <tr className="text-xs uppercase tracking-wide text-gray-400">
                            <th className="py-1 text-left font-medium">{t('reg.feature')}</th>
                            <th className="py-1 pr-3 text-right font-medium">{nameOf(targetUnit)}</th>
                            <th className="py-1 text-right font-medium">{nameOf(unit)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gaps.map(g => (
                            <tr key={g.feature.key} className="border-t border-gray-50">
                              <td className="py-1 pr-3">
                                <Link href={`/grammar?chapter=${g.feature.chapter}&level=intermediate&track=greek`}
                                  className="text-gray-700 hover:text-brand-700 hover:underline">
                                  {featureLabel(g.feature)}
                                </Link>
                                {(g.feature.taggerSensitive || g.feature.approx) && (
                                  <span className="ml-1 text-gray-300" title={t('reg.approxTip')}>~</span>
                                )}
                              </td>
                              <td className="py-1 pr-3 text-right font-mono tabular-nums text-gray-900">{g.target.toFixed(1)}</td>
                              <td className="py-1 text-right font-mono tabular-nums text-gray-900">{g.other.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">{t('reg.per1000')} · <span className="text-gray-400">~</span> {t('reg.approxTip')}</p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {chunks.length > 2 && (
        <p className="text-xs text-gray-500">
          {t('reg.chunkNote', { n: chunks.length, work: nameOf(targetUnit), size: meta.chunkWords.toLocaleString(locale) })}
        </p>
      )}
    </div>
  )
}
