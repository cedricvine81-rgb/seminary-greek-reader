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
  explain, explainDelta, explainVocab, sharedFeatures, sharedWords,
  type BaselinePair, type Lens, type Neighbour, type StyleFeature, type StyleMeta,
  type StyleUnit, type VocabFile,
} from '@/lib/style-register'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { bookName } from '@/lib/i18n/book-names'
import { textAuthorLabel } from '@/lib/i18n/text-names'
import { isBiblical } from '@/lib/style-register'
import { formatDateLong } from '@/lib/i18n/format'

/** Detail tables are printed for this many parallels; the ranking table lists every one. */
export const REPORT_DETAIL_LIMIT = 25
/**
 * References are gathered for this many, and no further. Each one is a pass over a whole work
 * — and where the parallel is Strabo or Polybius, over a corpus that has to be read off disk
 * first — so the report says how far it went rather than quietly running for a minute.
 */
export const REPORT_CITATION_LIMIT = 8

/** What /api/register/citations returns, keyed by the work id it was asked about. */
export type CitationMap = Record<string, { refs: Record<string, string[]>; counts: Record<string, number> }>

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
  mode, outsideOnly, includeShort, citations, base, classicalLabel, koineLabel,
  glossed, nameOf, corpusOf, featureLabel,
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
  /** Keyed by work id, plus 'target' for the text being compared. Null until fetched. */
  citations: CitationMap | null
  /** Which pools the two baseline columns are drawn from. */
  base: BaselinePair
  classicalLabel: string
  koineLabel: string
  /** Greek word → gloss in the reader's language, falling back to the index's English. */
  glossed: (display: string, english: string) => string
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

      {/* ── why, for each parallel ────────────────────────────────────────────
          What they SHARE comes first and gets the space, because that is the claim the
          ranking is making. The differences follow, smaller, because they are the honest
          qualification to it rather than the argument. */}
      <section className="mb-5">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">{t('reg.rep.evidence')}</h2>
        <p className="mb-2 text-xs">{t('reg.sharedNote')}</p>
        <p className="mb-2 text-xs">{t('reg.periodNote')}</p>
        {lens === 'vocabulary' && <p className="mb-2 text-xs">{t('reg.vocabPeriodNote')}</p>}
        {citations && (
          <p className="mb-2 text-xs">
            {t('reg.rep.citedTo', { n: Math.min(REPORT_CITATION_LIMIT, detail.length) })}
          </p>
        )}
        {detail.map(({ unit, distance }, i) => {
          const traits = lens === 'syntax' ? sharedFeatures(targetUnit, unit, meta, base) : []
          const words = lens === 'register' ? sharedWords(targetUnit, unit, meta, base) : []
          const shared = lens === 'vocabulary' && vocab?.works[unit.work]
            ? explainVocab(
                targetVocab ?? vocab.works[targetUnit.work] ?? [],
                vocab.works[unit.work]!, vocab.periods,
              )
            : []
          const gaps = lens === 'syntax' ? explain(targetUnit, unit, meta.features, spread, 4) : []
          const wordGaps = lens === 'register' ? explainDelta(targetUnit, unit, meta, 4) : []
          const mine = citations?.target
          const theirs = citations?.[unit.work]

          const refLine = (key: string) => {
            if (!mine && !theirs) return null
            const one = (c: typeof mine, label: string) => {
              const list = c?.refs[key] ?? []
              const total = c?.counts[key] ?? 0
              if (!c) return null
              return `${label}: ${list.length ? list.join(', ') : t('reg.rep.none')}`
                + (total > list.length ? ` ${t('reg.rep.ofTotal', { n: total })}` : '')
            }
            const parts = [one(mine, nameOf(targetUnit)), one(theirs, nameOf(unit))].filter(Boolean)
            return parts.length ? parts.join('   ·   ') : null
          }

          return (
            <div key={unit.work} className="mb-4" style={{ breakInside: 'avoid' }}>
              <p className="border-b border-black text-xs font-bold">
                {i + 1}. {nameOf(unit)}
                <span className="font-normal"> — {corpusOf(unit)}, {t('reg.rep.distance')} {distance.toFixed(3)}</span>
              </p>

              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide">{t('reg.shared')}</p>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-left text-[9px]">
                    <th />
                    <th colSpan={4} className="text-right font-semibold uppercase tracking-wide">{t('reg.per1000')}</th>
                  </tr>
                  <tr className="border-b border-gray-400 text-left">
                    <th className="py-0.5 pr-2 font-medium">{t(lens === 'syntax' ? 'reg.feature' : 'reg.word')}</th>
                    <th className="py-0.5 pr-2 text-right font-medium">{nameOf(targetUnit)}</th>
                    <th className="py-0.5 pr-2 text-right font-medium">{nameOf(unit)}</th>
                    <th className="py-0.5 pr-2 text-right font-medium">{classicalLabel}</th>
                    <th className="py-0.5 text-right font-medium">{koineLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {traits.map(r => (
                    <tr key={r.feature.key} className="align-top">
                      <td className="py-0.5 pr-2">
                        {featureLabel(r.feature)}
                        {(r.feature.taggerSensitive || r.feature.approx) && <span className="text-gray-500"> ~</span>}
                        {refLine(r.feature.key) && (
                          <span className="block text-[9px] text-gray-600">{refLine(r.feature.key)}</span>
                        )}
                      </td>
                      <td className="py-0.5 pr-2 text-right tabular-nums">{r.target.toFixed(1)}</td>
                      <td className="py-0.5 pr-2 text-right tabular-nums">{r.other.toFixed(1)}</td>
                      <td className="py-0.5 pr-2 text-right tabular-nums text-gray-600">{Number.isNaN(r.classical) ? t('reg.noPool') : r.classical.toFixed(1)}</td>
                      <td className="py-0.5 text-right tabular-nums text-gray-600">{Number.isNaN(r.koine) ? t('reg.noPool') : r.koine.toFixed(1)}</td>
                    </tr>
                  ))}
                  {words.map(r => (
                    <tr key={r.lemma} className="align-top">
                      <td className="py-0.5 pr-2">
                        <span className="font-reading">{r.display}</span>
                        {glossed(r.display, r.gloss) && (
                          <span className="text-gray-600"> · {glossed(r.display, r.gloss)}</span>
                        )}
                        {refLine(r.lemma) && (
                          <span className="block text-[9px] text-gray-600">{refLine(r.lemma)}</span>
                        )}
                      </td>
                      <td className="py-0.5 pr-2 text-right tabular-nums">{r.target.toFixed(1)}</td>
                      <td className="py-0.5 pr-2 text-right tabular-nums">{r.other.toFixed(1)}</td>
                      <td className="py-0.5 pr-2 text-right tabular-nums text-gray-600">{Number.isNaN(r.classical) ? t('reg.noPool') : r.classical.toFixed(1)}</td>
                      <td className="py-0.5 text-right tabular-nums text-gray-600">{Number.isNaN(r.koine) ? t('reg.noPool') : r.koine.toFixed(1)}</td>
                    </tr>
                  ))}
                  {shared.map(r => (
                    <tr key={r.lemma} className="align-top">
                      <td className="py-0.5 pr-2">
                        <span className="font-reading">{vocab?.labels[r.lemma] ?? r.lemma}</span>
                        {refLine(r.lemma) && (
                          <span className="block text-[9px] text-gray-600">{refLine(r.lemma)}</span>
                        )}
                      </td>
                      <td className="py-0.5 pr-2 text-right tabular-nums">{r.target.toFixed(1)}</td>
                      <td className="py-0.5 pr-2 text-right tabular-nums">{r.other.toFixed(1)}</td>
                      <td className="py-0.5 pr-2 text-right tabular-nums text-gray-600">{Number.isNaN(r.classical) ? t('reg.noPool') : r.classical.toFixed(1)}</td>
                      <td className="py-0.5 text-right tabular-nums text-gray-600">{Number.isNaN(r.koine) ? t('reg.noPool') : r.koine.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(gaps.length > 0 || wordGaps.length > 0) && (
                <p className="mt-1 text-[9px] text-gray-700">
                  <span className="font-semibold uppercase tracking-wide">{t('reg.differs')}: </span>
                  {gaps.map(g => `${featureLabel(g.feature)} ${g.target.toFixed(1)}/${g.other.toFixed(1)}`)
                    .concat(wordGaps.map(g => `${g.display} ${g.target.toFixed(1)}/${g.other.toFixed(1)}`))
                    .join(' · ')}
                </p>
              )}
            </div>
          )
        })}
        {lens === 'syntax' && <p className="text-[10px]">~ {t('reg.approxTip')}</p>}
      </section>

      {/* ── what the two baselines are made of ──────────────────────────────
          Printed in full rather than linked: a reader holding the paper cannot open a
          disclosure, and an average whose composition is unavailable is not checkable. */}
      {meta.periods && (
        <section className="mb-5" style={{ breakInside: 'avoid' }}>
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">{t('reg.rep.baselines')}</h2>
          {/* The rosters follow the pools the columns were actually drawn from. */}
          {(['classical', 'koine'] as const).map(id => {
            const pool = base[id] ?? meta.periods[id]
            return (
            <div key={id} className="mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide">
                {(id === 'classical' ? classicalLabel : koineLabel)}{' — '}
                {t(id === 'classical' ? 'reg.sourcesClassical' : 'reg.sourcesKoine', {
                  authors: String(pool.members.length),
                  works: String(pool.members.reduce((a, m) => a + m.works, 0)),
                })}
              </p>
              <p className="text-[10px] leading-relaxed">
                {t(id === 'classical' ? 'reg.classicalIs' : 'reg.koineIs')}
              </p>
              <p className="text-[10px] leading-relaxed text-gray-700">
                {pool.members
                  .map(m => {
                    const name = m.work && isBiblical(m.corpus)
                      ? bookName(m.work, locale, m.author)
                      : textAuthorLabel(m.author, locale, m.author)
                    return m.works > 1 ? `${name} (${m.works})` : name
                  })
                  .join(' · ')}
              </p>
            </div>
            )
          })}
          {meta.periods.excluded.length > 0 && (
            <p className="text-[10px] leading-relaxed">
              {t('reg.epicExcluded', { works: meta.periods.excluded.map(e => e.label).join(' · ') })}
            </p>
          )}
        </section>
      )}

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
