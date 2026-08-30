'use client'

// The printable report — what the Register tool produces when the answer has to leave the
// screen: handed to a class, attached to a paper, kept as evidence for a claim.
//
// It is NOT the interactive view with the chrome hidden. A document read away from the app has
// to carry what the app was providing implicitly: what was compared, how it was measured, what
// the numbers mean, and which edition of which text every parallel is drawn from. All of that
// is printed whether or not the reader had it open on screen.
//
// Rendered always, shown only by the print stylesheet (see @media print in globals.css).

import {
  explain, explainDelta, explainVocab,
  type Lens, type Neighbour, type StyleFeature, type StyleMeta, type StyleUnit, type VocabFile,
} from '@/lib/style-register'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { formatDateLong } from '@/lib/i18n/format'

/** Detail tables are printed for this many parallels; the ranking table lists every one. */
export const REPORT_DETAIL_LIMIT = 25

/**
 * Which edition and which morphology each corpus rests on.
 *
 * This belongs in a printed report more than anywhere else in the app. Every syntactic figure
 * in it is a count over an automatic parse for eight of the nine corpora and a hand-checked one
 * for the ninth, and a reader holding the paper cannot see the "~" the screen shows. The keys
 * carry the specifics; only corpora actually present are printed.
 */
const SOURCE_KEY: Record<string, string> = {
  GNT: 'reg.src.gnt',
  LXX: 'reg.src.lxx',
  josephus: 'reg.src.josephus',
  philo: 'reg.src.philo',
  'apostolic-fathers': 'reg.src.af',
  pseudepigrapha: 'reg.src.pseudepigrapha',
  eusebius: 'reg.src.eusebius',
  justin: 'reg.src.justin',
  greco: 'reg.src.greco',
}

export function RegisterReport({
  meta, lens, targetUnit, results, spread, vocab, targetVocab,
  mode, outsideOnly, includeShort, nameOf, corpusOf, featureLabel,
}: {
  meta: StyleMeta
  lens: Lens
  targetUnit: StyleUnit
  results: Neighbour[]
  spread: Record<string, number>
  vocab: VocabFile | null
  targetVocab: [string, number][] | null
  mode: 'work' | 'passage'
  outsideOnly: boolean
  includeShort: boolean
  nameOf: (u: StyleUnit) => string
  corpusOf: (u: StyleUnit) => string
  featureLabel: (f: StyleFeature) => string
}) {
  const t = useT()
  const locale = useLocale()

  const lensName = t(
    lens === 'syntax' ? 'reg.lens.syntax'
      : lens === 'vocabulary' ? 'reg.lens.vocabulary' : 'reg.lens.register',
  )
  const detail = results.slice(0, REPORT_DETAIL_LIMIT)
  // Only the corpora that actually appear, target included — a sources list naming texts the
  // report never cites is noise.
  const corpora = Array.from(new Set([targetUnit.corpus, ...results.map(r => r.unit.corpus)]))
    .filter(c => SOURCE_KEY[c])

  const num = (n: number) => n.toLocaleString(locale)

  return (
    <div className="hidden print:block text-black">
      {/* ── who, what, when ─────────────────────────────────────────────────
          A <div>, not a <header>: the app's print stylesheet hides header/nav/aside/footer
          outright to strip the chrome, and this report's own masthead is inside that net. */}
      <div className="mb-4 border-b border-black pb-3">
        <h1 className="text-xl font-bold">{t('reg.title')}</h1>
        <p className="mt-1 text-base">
          {t(lens === 'vocabulary' ? 'reg.closestVocab'
            : lens === 'syntax' ? 'reg.closestSyntax' : 'reg.closestTo',
            { work: nameOf(targetUnit) })}
        </p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
          <dt className="font-semibold">{t('reg.rep.compared')}</dt>
          <dd>
            {nameOf(targetUnit)} · {corpusOf(targetUnit)} · {num(targetUnit.n)} {t('reg.words')}
            {mode === 'passage' && <> · {t('reg.rep.asPassage')}</>}
            {!targetUnit.reliable && <> · {t('reg.rep.belowFloor')}</>}
          </dd>
          <dt className="font-semibold">{t('reg.lens')}</dt>
          <dd>{lensName}</dd>
          <dt className="font-semibold">{t('reg.rep.scope')}</dt>
          <dd>
            {outsideOnly ? t('reg.rep.scopeOutside', { corpus: corpusOf(targetUnit) }) : t('reg.rep.scopeAll')}
            {includeShort ? <> · {t('reg.rep.scopeShort')}</> : null}
          </dd>
          <dt className="font-semibold">{t('reg.rep.ranked')}</dt>
          <dd>{t('reg.rep.rankedCount', { shown: num(results.length), detail: num(detail.length) })}</dd>
          <dt className="font-semibold">{t('reg.rep.printed')}</dt>
          <dd>{formatDateLong(new Date(), locale)}</dd>
          {/* The tool keeps its whole state in the query string, so the paper can say where
              to go to get this same comparison back and carry on with it. */}
          <dt className="font-semibold">{t('reg.rep.reproduce')}</dt>
          <dd className="break-all">{typeof window === 'undefined' ? '' : window.location.href}</dd>
        </dl>
      </div>

      {/* ── the caveat travels with the document ────────────────────────── */}
      <section className="mb-4" style={{ breakInside: 'avoid' }}>
        <h2 className="text-sm font-bold uppercase tracking-wide">{t('reg.whatItMeasures')}</h2>
        <p className="mt-1 text-xs leading-relaxed">{t('reg.blurb')}</p>
        <p className="mt-1 text-xs leading-relaxed">{t(`reg.rep.method.${lens}`)}</p>
        {lens === 'vocabulary' && <p className="mt-1 text-xs leading-relaxed">{t('reg.vocabCaveat')}</p>}
      </section>

      {/* ── the whole ranking ───────────────────────────────────────────── */}
      <section className="mb-5">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">{t('reg.rep.ranking')}</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-1 pr-2 font-semibold">#</th>
              <th className="py-1 pr-2 font-semibold">{t('reg.rep.work')}</th>
              <th className="py-1 pr-2 font-semibold">{t('reg.rep.collection')}</th>
              <th className="py-1 pr-2 text-right font-semibold">{t('reg.words')}</th>
              <th className="py-1 text-right font-semibold">{t('reg.rep.distance')}</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ unit, distance }, i) => (
              <tr key={unit.work} className="border-b border-gray-300">
                <td className="py-0.5 pr-2 tabular-nums">{i + 1}</td>
                <td className="py-0.5 pr-2">
                  {nameOf(unit)}
                  {!unit.reliable && <span className="ml-1 text-gray-500">{t('reg.rep.shortMark')}</span>}
                </td>
                <td className="py-0.5 pr-2">{corpusOf(unit)}</td>
                <td className="py-0.5 pr-2 text-right tabular-nums">{num(unit.n)}</td>
                <td className="py-0.5 text-right tabular-nums">{distance.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── why, for each parallel ──────────────────────────────────────── */}
      <section className="mb-5">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">
          {t(lens === 'syntax' ? 'reg.why' : lens === 'vocabulary' ? 'reg.whyShared' : 'reg.whyWords')}
        </h2>
        <div className="grid grid-cols-2 gap-x-6">
          {detail.map(({ unit, distance }, i) => {
            const gaps = lens === 'syntax' ? explain(targetUnit, unit, meta.features, spread) : []
            const wordGaps = lens === 'register' ? explainDelta(targetUnit, unit, meta) : []
            const shared = lens === 'vocabulary' && vocab?.works[unit.work]
              ? explainVocab(targetVocab ?? vocab.works[targetUnit.work] ?? [], vocab.works[unit.work]!)
              : []
            return (
              <div key={unit.work} className="mb-3" style={{ breakInside: 'avoid' }}>
                <p className="text-xs font-semibold">
                  {i + 1}. {nameOf(unit)}
                  <span className="font-normal"> — {corpusOf(unit)}, {t('reg.rep.distance')} {distance.toFixed(3)}</span>
                </p>
                <table className="w-full text-[10px]">
                  <thead>
                    {/* Repeated per table rather than stated once for the section: a reader
                        who turns to page four of the printout gets the unit with the table. */}
                    <tr className="text-left text-[10px]">
                      <th />
                      <th colSpan={2} className="pb-0.5 text-right font-semibold uppercase tracking-wide">{t('reg.per1000')}</th>
                    </tr>
                    <tr className="border-b border-gray-400 text-left">
                      <th className="py-0.5 pr-2 font-medium">
                        {t(lens === 'syntax' ? 'reg.feature' : 'reg.word')}
                      </th>
                      <th className="py-0.5 pr-2 text-right font-medium">{nameOf(targetUnit)}</th>
                      <th className="py-0.5 text-right font-medium">{nameOf(unit)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gaps.map(g => (
                      <tr key={g.feature.key}>
                        <td className="py-0.5 pr-2">
                          {featureLabel(g.feature)}
                          {(g.feature.taggerSensitive || g.feature.approx) && <span className="text-gray-500"> ~</span>}
                        </td>
                        <td className="py-0.5 pr-2 text-right tabular-nums">{g.target.toFixed(1)}</td>
                        <td className="py-0.5 text-right tabular-nums">{g.other.toFixed(1)}</td>
                      </tr>
                    ))}
                    {wordGaps.map(g => (
                      <tr key={g.lemma}>
                        <td className="py-0.5 pr-2">
                          <span className="font-reading">{g.display}</span>
                          {g.gloss && <span className="text-gray-600"> · {g.gloss}</span>}
                        </td>
                        <td className="py-0.5 pr-2 text-right tabular-nums">{g.target.toFixed(1)}</td>
                        <td className="py-0.5 text-right tabular-nums">{g.other.toFixed(1)}</td>
                      </tr>
                    ))}
                    {shared.map(g => (
                      <tr key={g.lemma}>
                        <td className="py-0.5 pr-2 font-reading">{vocab?.labels[g.lemma] ?? g.lemma}</td>
                        <td className="py-0.5 pr-2 text-right tabular-nums">{g.target.toFixed(1)}</td>
                        <td className="py-0.5 text-right tabular-nums">{g.other.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
        {lens === 'syntax' && <p className="text-[10px]">~ {t('reg.approxTip')}</p>}
      </section>

      {/* ── where the Greek came from ───────────────────────────────────── */}
      <section style={{ breakInside: 'avoid' }}>
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">{t('reg.rep.sources')}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[10px]">
          {corpora.map(c => (
            <div key={c} className="contents">
              <dt className="font-semibold">{t(`reg.corpus.${c === 'apostolic-fathers' ? 'apostolicFathers' : c.toLowerCase()}`)}</dt>
              <dd>{t(SOURCE_KEY[c])}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[10px]">{t('reg.rep.footer')}</p>
      </section>
    </div>
  )
}
