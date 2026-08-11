'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { formatDate, formatDateShort } from '@/lib/i18n/format'
import { assignmentTypeShort } from '@/lib/assignment-display'
import { clsx } from 'clsx'
import { ChevronDown, ChevronRight, CalendarClock, AlertTriangle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { membersPastCourseEnd, sharedValue, type AssignmentSeries } from '@/lib/assignment-series'

/**
 * Edits a whole run of assignments at once. The semester builder creates one row per
 * date, so fixing a schedule — shifting every due date, publishing the lot, dropping
 * occurrences that fall past the end of term — otherwise means opening each in turn.
 */
export function AssignmentSeriesEditor({
  series, courseEnd,
}: {
  series: AssignmentSeries[]
  courseEnd: string
}) {
  const t = useT()
  const locale = useLocale()
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  if (series.length === 0) return null

  async function run(
    ids: string[],
    body: Record<string, unknown>,
    method: 'PATCH' | 'DELETE',
    describe: (n: number) => string,
  ) {
    setBusy(true); setError(''); setMessage('')
    try {
      const res = await fetch('/api/assignments/series', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentIds: ids, ...body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? t('se.thatDidNotWork')); return }
      setMessage(describe(data.updated ?? data.deleted ?? ids.length))
      router.refresh()
    } catch {
      setError(t('se.networkError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-600">
          Series
          <span className="ml-1.5 font-normal text-gray-400">
            — change dates, publication or retakes for a whole run at once
          </span>
        </p>
      </div>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {series.map(s => {
        const isOpen = openKey === s.key
        const ids = s.members.map(m => m.id)
        const overrun = membersPastCourseEnd(s.members, courseEnd)
        const published = s.members.filter(m => m.isPublished).length
        const first = s.members[0]
        const last = s.members[s.members.length - 1]
        // What each setting currently is across the run (null = the occurrences differ),
        // so the active choice is shown filled in rather than the row looking untouched.
        const curRetakes = sharedValue(s.members, m => m.maxRetakes ?? -1)   // -1 = unlimited
        const curTime = sharedValue(s.members, m => m.timePerQuestion ?? 0)
        const curReview = sharedValue(s.members, m => m.vocabReviewPct ?? 0)
        const curFill = sharedValue(s.members, m => m.vocabFillPct ?? 0)
        const curLate = sharedValue(s.members, m => (m.allowLate ? (m.lateDaysLimit ?? -1) : 0))
        const mixed = <span className="ml-1.5 text-xs font-normal normal-case text-amber-700">{t('se.varies')}</span>

        return (
          <div key={s.key} className="rounded-lg border border-gray-200 overflow-hidden bg-surface">
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : s.key)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              {isOpen ? <ChevronDown size={16} className="text-gray-400 shrink-0" />
                      : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900">{s.stem}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {assignmentTypeShort(s.type, t)} · {t('se.quizCount', { count: s.members.length, n: s.members.length })} ·{' '}
                  {formatDateShort(first.dueDate, locale)} – {formatDate(last.dueDate, locale)}
                </span>
              </div>
              {overrun.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200 shrink-0">
                  {t('se.pastEndOfTerm', { n: overrun.length })}
                </span>
              )}
              <span className="text-xs text-gray-400 shrink-0">
                {t('se.publishedCount', { done: published, total: s.members.length })}
              </span>
              {/* The rest of the row is the toggle, but an explicit control is needed here:
                  every assignment below has a loud Edit button, so a bare chevron reads as
                  decoration and the series controls went unnoticed. */}
              <span className={clsx(
                'shrink-0 inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                isOpen ? 'border-brand-300 bg-brand-50 text-brand-700'
                       : 'border-gray-300 text-gray-700')}>
                <Settings size={12} />
                {t(isOpen ? 'se.close' : 'se.editSeries')}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                {overrun.length > 0 && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle size={14} />
                      {t('se.overrunTitle', { count: overrun.length, n: overrun.length })}
                    </p>
                    <p className="mt-1 text-amber-800">
                      {t('se.overrunBody', {
                        count: overrun.length,
                        vocab: s.type === 'VOCABULARY_QUIZ' ? t('se.overrunVocab') : '',
                      })}
                    </p>
                    <Button
                      size="sm" variant="secondary" disabled={busy}
                      className="mt-2"
                      onClick={() => {
                        if (!confirm(t('se.confirmDropOverrun', { count: overrun.length, n: overrun.length }))) return
                        void run(overrun.map(m => m.id), {}, 'DELETE', n => t('se.removed', { n }))
                      }}
                    >
                      {t('se.removeOverrun', { count: overrun.length, n: overrun.length })}
                    </Button>
                  </div>
                )}

                {/* Dates */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {t('se.moveDueDates')}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {[-7, -1, 1, 7].map(d => (
                      <Button
                        key={d} size="sm" variant="secondary" disabled={busy}
                        onClick={() => void run(ids, { action: 'shiftDays', value: d }, 'PATCH',
                          n => t('se.movedDates', {
                            count: n, n,
                            delta: t('se.dayDelta', { count: Math.abs(d), delta: d > 0 ? `+${d}` : d }),
                          }))}
                      >
                        <CalendarClock size={13} /> {t('se.dayDelta', { count: Math.abs(d), delta: d > 0 ? `+${d}` : d })}
                      </Button>
                    ))}
                    <span className="text-xs text-gray-400">{t('se.spacingKept')}</span>
                  </div>
                </div>

                {/* Publication + settings */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {t('se.publication')}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" disabled={busy}
                        onClick={() => void run(ids, { action: 'publish', value: true }, 'PATCH',
                          n => t('se.publishedN', { n }))}>
                        {t('se.publishAll')}
                      </Button>
                      <Button size="sm" variant="secondary" disabled={busy}
                        onClick={() => void run(ids, { action: 'publish', value: false }, 'PATCH',
                          n => t('se.unpublishedN', { n }))}>
                        {t('se.unpublishAll')}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {t('se.retakesEvery')}
                      {curRetakes === null ? mixed : (
                        <span className="ml-1.5 font-normal normal-case text-brand-700">
                          — {curRetakes === -1 ? t('se.unlimitedLower') : curRetakes}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3].map(n => (
                        <Button key={n} size="sm" variant={curRetakes === n ? 'primary' : 'secondary'} disabled={busy}
                          onClick={() => void run(ids, { action: 'maxRetakes', value: n }, 'PATCH',
                            c => t('se.setRetakes', { count: n, c, n }))}>
                          {n}
                        </Button>
                      ))}
                      <Button size="sm" variant={curRetakes === -1 ? 'primary' : 'secondary'} disabled={busy}
                        onClick={() => void run(ids, { action: 'maxRetakes', value: null }, 'PATCH',
                          c => t('se.setUnlimitedRetakes', { c }))}>
                        {t('se.unlimited')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Cumulative review — only meaningful for vocabulary series */}
                {s.type === 'VOCABULARY_QUIZ' && (() => {
                  const current = curReview
                  return (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {t('se.reviewHeading')} —{' '}
                        <span className="text-brand-700 normal-case">
                          {current === null ? t('se.reviewMixed')
                            : current === 0 ? t('se.reviewNone')
                            : t('se.reviewSplit', { earlier: current, rest: 100 - current })}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[0, 10, 20, 25, 30, 50].map(pc => (
                          <Button key={pc} size="sm" variant={current === pc ? 'primary' : 'secondary'} disabled={busy}
                            onClick={() => {
                              if (!confirm(`${t('se.confirmReviewPct', { n: s.members.length, pct: pc })}\n\n${t('se.regenerates')}`)) return
                              void run(ids, { action: 'reviewPct', value: pc }, 'PATCH',
                                n => t('se.rebuiltReview', { n, pct: pc }))
                            }}>
                            {pc === 0 ? t('se.none') : `${pc}%`}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {t('se.reviewFootnote')}
                      </p>
                    </div>
                  )
                })()}

                {/* Multiple-choice vs fill-in balance — vocabulary series only */}
                {s.type === 'VOCABULARY_QUIZ' && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {t('se.styleHeading')} —{' '}
                      {curFill === null ? mixed : (
                        <span className="text-brand-700 normal-case">
                          {curFill === 0 ? t('se.styleAllChoice')
                            : curFill === 100 ? t('se.styleAllFill')
                            : t('se.styleSplit', { fill: curFill, choice: 100 - curFill })}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[0, 25, 50, 75, 100].map(pc => (
                        <Button key={pc} size="sm" variant={curFill === pc ? 'primary' : 'secondary'} disabled={busy}
                          onClick={() => {
                            if (!confirm(`${t('se.confirmStylePct', { n: s.members.length, pct: pc })}\n\n${t('se.regenerates')}`)) return
                            void run(ids, { action: 'fillPct', value: pc }, 'PATCH',
                              n => t('se.rebuiltStyle', { n, pct: pc }))
                          }}>
                          {pc === 0 ? t('se.allChoice') : pc === 100 ? t('se.allFillIn') : t('se.stylePct', { n: pc })}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('se.styleFootnote')}
                    </p>
                  </div>
                )}

                {/* Morphology series: vocabulary cap. Regenerates from each quiz's stored
                    recipe (fields, filters, declensions), so the rebuild is faithful. */}
                {s.type === 'MORPHOLOGY_QUIZ' && (() => {
                  const capped = s.members.every(m => m.vocabThruLesson != null && m.vocabThruLesson === Math.min(m.weekNumber, 16))
                  const none = s.members.every(m => m.vocabThruLesson == null)
                  return (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {t('se.vocabulary')}
                        <span className="ml-1.5 font-normal normal-case text-brand-700">
                          {capped ? t('se.vocabCapped')
                           : none ? t('se.vocabNone')
                           : mixed}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant={capped ? 'primary' : 'secondary'} disabled={busy}
                          onClick={() => {
                            if (!confirm(t('se.confirmVocabAuto', { n: s.members.length }))) return
                            void run(ids, { action: 'morphVocab', value: 'auto' }, 'PATCH',
                              n => t('se.rebuiltVocabAuto', { n }))
                          }}>
                          Words taught so far
                        </Button>
                        <Button size="sm" variant={none ? 'primary' : 'secondary'} disabled={busy}
                          onClick={() => {
                            if (!confirm(t('se.confirmVocabNone', { n: s.members.length }))) return
                            void run(ids, { action: 'morphVocab', value: 'none' }, 'PATCH',
                              n => t('se.rebuiltVocabNone', { n }))
                          }}>
                          No cap
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Rebuilds the questions from each quiz&rsquo;s stored recipe, so it is
                        refused once students have answered.
                      </p>
                    </div>
                  )
                })()}

                {/* Timing + late policy */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {t('se.timeHeading')}
                      {curTime === null ? mixed : (
                        <span className="ml-1.5 font-normal normal-case text-brand-700">
                          — {curTime === 0 ? 'untimed' : `${curTime}s`}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[0, 10, 15, 20, 30, 45, 60].map(sec => (
                        <Button key={sec} size="sm" variant={curTime === sec ? 'primary' : 'secondary'} disabled={busy}
                          onClick={() => void run(ids, { action: 'timePerQuestion', value: sec }, 'PATCH',
                            n => sec === 0 ? t('se.setUntimed', { n })
                                           : t('se.setSeconds', { n, sec }))}>
                          {sec === 0 ? t('se.untimed') : t('se.timeSeconds', { n: sec })}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('se.timeFootnote')}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {t('se.lateSubmissions')}
                      {curLate === null ? mixed : (
                        <span className="ml-1.5 font-normal normal-case text-brand-700">
                          — {curLate === 0 ? t('se.notAllowed').toLowerCase()
                             : curLate === -1 ? t('se.lateAllowedNoLimit')
                             : t('se.lateDays', { count: curLate, n: curLate })}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={curLate === 0 ? 'primary' : 'secondary'} disabled={busy}
                        onClick={() => void run(ids, { action: 'allowLate', value: false }, 'PATCH',
                          n => t('se.closedLate', { n }))}>
                        Not allowed
                      </Button>
                      {[1, 3, 7].map(days => (
                        <Button key={days} size="sm" variant={curLate === days ? 'primary' : 'secondary'} disabled={busy}
                          onClick={async () => {
                            await run(ids, { action: 'allowLate', value: true }, 'PATCH', () => '')
                            await run(ids, { action: 'lateDaysLimit', value: days }, 'PATCH',
                              n => t('se.allowedLate', { count: days, n, days }))
                          }}>
                          {t('se.lateDaysButton', { n: days })}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* The occurrences themselves */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Occurrences — open one to edit it on its own
                  </p>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-100">
                    {s.members.map(m => {
                      const past = overrun.some(o => o.id === m.id)
                      return (
                        <Link
                          key={m.id}
                          href={`/instructor/assignments/${m.id}`}
                          className={clsx('flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                            past && 'bg-amber-50/60')}
                        >
                          <span className="text-xs text-gray-400 w-12 shrink-0">Wk {m.weekNumber}</span>
                          <span className={clsx('text-xs w-24 shrink-0', past ? 'text-amber-700 font-medium' : 'text-gray-400')}>
                            {formatDate(m.dueDate, locale)}
                          </span>
                          <span className="flex-1 min-w-0 truncate text-gray-800">{m.title}</span>
                          <span className="text-xs text-gray-400 shrink-0">{m.questionCount}q</span>
                          <span className={clsx('text-xs px-1.5 py-0.5 rounded shrink-0',
                            m.isPublished ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500 bg-gray-100')}>
                            {t(m.isPublished ? 'se.published' : 'se.draft')}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
