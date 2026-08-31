'use client'

// Two axes that the scholarship already had names for, and the tool can now measure.
//
// The rest of the page answers "which works resemble this one?". This answers "what KIND of
// Greek is this?" — placing one text on two scales that have been argued over since Aristotle,
// without reference to any other work. It sits above the ranking because it is the question a
// reader has before they have a comparison in mind.
//
// READABILITY RULE. An earlier version put a number in every corner — range ends, reference
// values, a caption per axis — and the user could not read it. What a student actually asks
// of these bars is "where is my text relative to the two averages?", so that is what is
// drawn: a marker, two LABELLED ticks at the Classical and Koine averages, and one direction
// word at each end. The exact ranges, the Greek names, and the +1/−1 construction all live in
// the hint bubbles, where they are a hover away instead of in the way.

import clsx from 'clsx'
import Link from 'next/link'
import { useLayoutEffect, useRef, useState } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { periodicityOf } from '@/lib/style-features'
import { ColumnHint } from './ColumnHint'
import type { StyleMeta, StyleUnit } from '@/lib/style-register'

function Axis({ label, hint, display, caption, value, range, low, high, marks }: {
  label: string
  hint: string[]
  /** The value as the reader should say it — "43%" for a proportion, "−1.55" for the lean. */
  display: string
  /** What the number is, in a few words, under it. */
  caption?: string
  value: number
  range: [number, number]
  low: string
  high: string
  /** The two reference averages, drawn as labelled ticks ON the scale. */
  marks: { at: number; label: string }[]
}) {
  // The range may run high-to-low: the Classical-lean scale reads chronologically, Classical
  // on the left because Classical came first, so its axis is passed reversed.
  const [from, to] = range
  const pos = (v: number) => from !== to ? Math.min(1, Math.max(0, (v - from) / (to - from))) : 0.5
  const pct = pos(value)
  const shown = marks.filter(m => pos(m.at) > 0.02 && pos(m.at) < 0.98)
  const ordered = shown.slice().sort((a, b) => pos(a.at) - pos(b.at))

  // Measured, not estimated: label width depends on the locale's wording and the reader's
  // font, and this component renders in a column whose width varies with the viewport.
  const labelBox = useRef<HTMLDivElement>(null)
  const [stagger, setStagger] = useState(false)
  useLayoutEffect(() => {
    const box = labelBox.current
    if (!box) return
    const check = () => {
      const spans = Array.from(box.children) as HTMLElement[]
      if (spans.length < 2) return setStagger(false)
      // Compare against where each label WOULD sit on one line, so the test does not depend on
      // the answer it is about to produce.
      const w = box.getBoundingClientRect().width
      const at = (i: number) => pos(ordered[i].at) * w
      const half = (i: number) => spans[i].getBoundingClientRect().width / 2
      setStagger(at(0) + half(0) + 4 > at(1) - half(1))
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(box)
    return () => ro.disconnect()
    // Re-measures when the labels or their positions change, not on every render — the
    // observer handles the width.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered.map(m => `${m.label}@${Math.round(pos(m.at) * 1000)}`).join('|')])
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          <ColumnHint align="left" label={label} hint={hint} />
        </span>
        <span className="shrink-0 text-right leading-tight">
          <span className="block font-mono text-xs tabular-nums text-gray-900">{display}</span>
          {caption && <span className="block text-[10px] text-gray-400">{caption}</span>}
        </span>
      </div>
      {/* A marker on a stated scale, not a filled bar: the value is a position between two
          named ends, and a bar would suggest "more is better". */}
      <div className="relative h-1.5 rounded-full bg-gray-100">
        {shown.map(m => (
          <span key={m.label} title={m.label}
            className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-gray-300"
            style={{ left: `${pos(m.at) * 100}%` }}
          />
        ))}
        <span
          className="absolute top-1/2 h-3 w-[3px] -translate-y-1/2 rounded-full bg-brand-600"
          style={{ left: `calc(${pct * 100}% - 1.5px)` }}
        />
      </div>
      {/* The ticks say what they are, CENTRED under themselves — a label offset from its tick
          is a label the reader has to pair up by eye, which is the whole thing it was there to
          spare them. Where two centred labels would collide (a narrow column, a long
          translation) the second drops to its own line rather than sliding sideways: a second
          line costs 12px and keeps both labels exactly under their marks. */}
      <div ref={labelBox} className={clsx('relative', stagger ? 'h-7' : 'h-3.5')}>
        {ordered.map((m, i) => (
          <span key={m.label}
            className="absolute -translate-x-1/2 whitespace-nowrap text-[9px] leading-4 text-gray-400"
            style={{ left: `${pos(m.at) * 100}%`, top: stagger && i ? 14 : 0 }}
          >
            {m.label}
          </span>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{low}</span><span>{high}</span>
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
  const range = meta.axisRange
  if (!range || unit.periodicity === undefined || unit.classicalLean === undefined) return null

  // The same reference points on both bars: the two period averages, computed from the same
  // baselines every table on the page compares against.
  const perMarks = meta.periods
    ? [
        { at: periodicityOf(meta.periods.classical.features), label: t('reg.axis.avgC') },
        { at: periodicityOf(meta.periods.koine.features), label: t('reg.axis.avgK') },
      ]
    : []

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('reg.axes', { work: name })}</h3>
        <Link href="/tools/register/background" className="text-xs font-medium text-brand-700 hover:underline">
          {t('reg.axesMore')}
        </Link>
      </div>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Axis
          label={t('reg.axis.periodicity')}
          hint={['reg.hint.periodicity', 'reg.hint.periodicityHow']}
          // A proportion reads as a percentage or it does not read: 0.43 says nothing, "43%
          // of clause links subordinate" is a sentence.
          display={`${Math.round(unit.periodicity * 100)}%`}
          caption={t('reg.axis.periodicityScale')}
          value={unit.periodicity} range={range.periodicity}
          low={t('reg.axis.strungOn')} high={t('reg.axis.periodic')}
          marks={perMarks}
        />
        <Axis
          label={t('reg.axis.lean')}
          hint={['reg.hint.lean', 'reg.hint.leanHow']}
          display={`${unit.classicalLean >= 0 ? '+' : '−'}${Math.abs(unit.classicalLean).toFixed(2)}`}
          value={unit.classicalLean}
          range={[range.classicalLean[1], range.classicalLean[0]]}
          low={t('reg.axis.towardClassical')} high={t('reg.axis.towardKoine')}
          // The averages ARE +1 and −1 by construction; the ends of the bar are merely where
          // the library stops.
          marks={[
            { at: 1, label: t('reg.axis.avgC') },
            { at: -1, label: t('reg.axis.avgK') },
          ]}
        />
      </div>
    </div>
  )
}
