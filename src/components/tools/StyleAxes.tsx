'use client'

// Two axes that the scholarship already had names for, and the tool can now measure.
//
// The rest of the page answers "which works resemble this one?". This answers "what KIND of
// Greek is this?" — placing one text on two scales that have been argued over since Aristotle,
// without reference to any other work. It sits above the ranking because it is the question a
// reader has before they have a comparison in mind.

import Link from 'next/link'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { ColumnHint } from './ColumnHint'
import type { StyleMeta, StyleUnit } from '@/lib/style-register'

function Axis({ label, hint, value, range, low, high, format, scale, marks = [] }: {
  label: string
  hint: string[]
  value: number
  range: [number, number]
  low: string
  high: string
  format: (n: number) => string
  /** What the number IS, in a few words — a bare 0.43 says nothing on its own. */
  scale: string
  /** Named points ON the scale, so a value can be read as past one or short of it. */
  marks?: { at: number; label: string }[]
}) {
  // The range may run high-to-low: the Classical-lean scale reads chronologically, Classical
  // on the left because Classical came first, so its axis is passed reversed.
  const [from, to] = range
  const pct = from !== to ? Math.min(1, Math.max(0, (value - from) / (to - from))) : 0.5
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          <ColumnHint align="left" label={label} hint={hint} />
        </span>
        {/* The number and what it is, on one line — the figure alone was unreadable. */}
        <span className="shrink-0 text-right leading-tight">
          <span className="block font-mono text-xs tabular-nums text-gray-900">{format(value)}</span>
          <span className="block text-[10px] text-gray-400">{scale}</span>
        </span>
      </div>
      {/* A marker on a stated scale, not a filled bar: the value is a position between two
          named ends, and a bar would suggest "more is better". */}
      <div className="relative h-1.5 rounded-full bg-gray-100">
        {marks.map(m => {
          const p = from !== to ? (m.at - from) / (to - from) : 0.5
          return p < 0 || p > 1 ? null : (
            <span key={m.label} title={m.label}
              className="absolute top-0 h-1.5 w-px bg-gray-300"
              style={{ left: `${p * 100}%` }}
            />
          )
        })}
        <span
          className="absolute top-1/2 h-3 w-[3px] -translate-y-1/2 rounded-full bg-brand-600"
          style={{ left: `calc(${pct * 100}% - 1.5px)` }}
        />
      </div>
      {/* The ends are where the library ends, so they carry their values: a position is only
          readable against a stated scale — the same reason meta.barScale is published. */}
      <div className="mt-1 flex justify-between gap-2 text-[10px] text-gray-400">
        <span>{format(from)} {low}</span><span className="text-right">{high} {format(to)}</span>
      </div>
    </div>
  )
}

export function StyleAxes({ meta, unit, name }: {
  meta: StyleMeta
  unit: StyleUnit
  name: string
}) {
  const t = useT()
  const locale = useLocale()
  const range = meta.axisRange
  if (!range || unit.periodicity === undefined || unit.classicalLean === undefined) return null

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('reg.axes', { work: name })}</h3>
        <Link href="/tools/register/background" className="text-xs font-medium text-brand-700 hover:underline">
          {t('reg.axesMore')}
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Axis
          label={t('reg.axis.periodicity')}
          hint={['reg.hint.periodicity', 'reg.hint.periodicityHow']}
          value={unit.periodicity} range={range.periodicity}
          low={t('reg.axis.strungOn')} high={t('reg.axis.periodic')}
          format={n => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          scale={t('reg.axis.periodicityScale')}
        />
        <Axis
          label={t('reg.axis.lean')}
          hint={['reg.hint.lean', 'reg.hint.leanHow']}
          value={unit.classicalLean}
          range={[range.classicalLean[1], range.classicalLean[0]]}
          low={t('reg.axis.towardClassical')} high={t('reg.axis.towardKoine')}
          format={n => `${n >= 0 ? '+' : ''}${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          scale={t('reg.axis.leanScale')}
          // The two averages ARE +1 and −1 by construction; the ends of the bar are merely
          // where the library stops. Ticks put the reference points back on the scale.
          marks={[
            { at: 1, label: t('reg.axis.classicalAvg') },
            { at: -1, label: t('reg.axis.koineAvg') },
          ]}
        />
      </div>
    </div>
  )
}
