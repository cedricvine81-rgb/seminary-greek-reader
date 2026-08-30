'use client'

// The evidence table said in a sentence.
//
// One component, rendered on the page and again in the printed report, because the two must
// never drift: a reader comparing the paper with the screen would have no way to tell which
// one was wrong. The arithmetic is readingOf() in style-register.ts; this is only the wording.

import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import type { Reading } from '@/lib/style-register'

/**
 * A rate here must be the SAME STRING as the rate in the table above it — toFixed and
 * toLocaleString round 1.65 differently, and a sentence saying 1.7 over a row saying 1.6 reads
 * as a second, disagreeing measurement.
 */
const rate = (n: number) => n.toFixed(1)

export function ReadingLine({ reading, className }: { reading: Reading; className: string }) {
  const t = useT()
  const locale = useLocale()
  if (!reading.traits.length) return null

  // The lean values follow the axes, which is where the reader just saw them, so those ARE
  // locale-formatted.
  const lean = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <p className={className}>
      <span className="font-semibold uppercase tracking-wide text-gray-400">{t('reg.reading')}: </span>
      {t('reg.readingLead')}
      {reading.traits.map((r, i) => (
        <span key={r.label + i}>
          {i > 0 && t('reg.readingAnd')}
          {t(`reg.reading.${r.rel}`, {
            // A feature label is a heading elsewhere and a phrase here, so it loses its
            // capital — but only a Latin one: γάρ must not be touched, and neither must a name.
            feature: /^[A-Z][a-z]/.test(r.label)
              ? r.label[0].toLocaleLowerCase(locale) + r.label.slice(1)
              : r.label,
            pool: t(r.pool === 'classical' ? 'reg.readingPool.classical' : 'reg.readingPool.koine'),
            a: rate(r.a), b: rate(r.b), c: rate(r.c),
          })}
        </span>
      ))}
      {'. '}
      {reading.lean && t(`reg.readingLean.${reading.lean.side}`, {
        a: lean(reading.lean.a), b: lean(reading.lean.b),
      })}
    </p>
  )
}

/** The rows the sentence reads, in whichever lens is showing. */
export function readingRows(
  lens: string,
  traits: { feature: unknown; target: number; other: number; classical: number; koine: number }[],
  words: { display: string; target: number; other: number; classical: number; koine: number }[],
  featureLabel: (f: never) => string,
) {
  // Never the subject-word lens: content words follow what a text is ABOUT, so "both use
  // Ἰησοῦς far more than Classical prose" would be a true sentence making a false point — the
  // very trap that lens is captioned to warn about.
  if (lens === 'syntax') return traits.map(r => ({ label: featureLabel(r.feature as never), ...r }))
  if (lens === 'register') return words.map(r => ({ label: r.display, ...r }))
  return []
}
