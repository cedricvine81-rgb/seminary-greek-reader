'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { ChevronDown, ChevronRight, CalendarClock, AlertTriangle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { membersPastCourseEnd, sharedValue, type AssignmentSeries } from '@/lib/assignment-series'

const TYPE_LABEL: Record<string, string> = {
  VOCABULARY_QUIZ: 'Vocabulary', MORPHOLOGY_QUIZ: 'Morphology',
  TRANSLATION_EXERCISE: 'Translation', TRANSLATION_EXAM: 'Exam',
  PASSAGE_VOCABULARY: 'Passage vocab', GROUP_PRESENTATION: 'Group presentation',
  COURSE_NOTES: 'Notes', GRAMMAR_HOMEWORK: 'Grammar',
}

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
      if (!res.ok) { setError(data.error ?? 'That did not work.'); return }
      setMessage(describe(data.updated ?? data.deleted ?? ids.length))
      router.refresh()
    } catch {
      setError('Network error — please try again.')
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
        const curLate = sharedValue(s.members, m => (m.allowLate ? (m.lateDaysLimit ?? -1) : 0))
        const mixed = <span className="ml-1.5 text-xs font-normal normal-case text-amber-700">(varies across the series)</span>

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
                  {TYPE_LABEL[s.type] ?? s.type} · {s.members.length} quizzes ·{' '}
                  {format(new Date(first.dueDate), 'MMM d')} – {format(new Date(last.dueDate), 'MMM d, yyyy')}
                </span>
              </div>
              {overrun.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200 shrink-0">
                  {overrun.length} past end of term
                </span>
              )}
              <span className="text-xs text-gray-400 shrink-0">
                {published}/{s.members.length} published
              </span>
              {/* The rest of the row is the toggle, but an explicit control is needed here:
                  every assignment below has a loud Edit button, so a bare chevron reads as
                  decoration and the series controls went unnoticed. */}
              <span className={clsx(
                'shrink-0 inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                isOpen ? 'border-brand-300 bg-brand-50 text-brand-700'
                       : 'border-gray-300 text-gray-700')}>
                <Settings size={12} />
                {isOpen ? 'Close' : 'Edit series'}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                {overrun.length > 0 && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle size={14} />
                      {overrun.length} quiz{overrun.length !== 1 ? 'zes' : ''} fall after the course ends
                    </p>
                    <p className="mt-1 text-amber-800">
                      Students will never see {overrun.length !== 1 ? 'them' : 'it'}
                      {s.type === 'VOCABULARY_QUIZ' && ', so those vocabulary sections go untaught'}.
                      Shift the series earlier, or remove {overrun.length !== 1 ? 'them' : 'it'}.
                    </p>
                    <Button
                      size="sm" variant="secondary" disabled={busy}
                      className="mt-2"
                      onClick={() => {
                        if (!confirm(`Remove ${overrun.length} quiz(zes) dated after the course ends?`)) return
                        void run(overrun.map(m => m.id), {}, 'DELETE', n => `Removed ${n}.`)
                      }}
                    >
                      Remove {overrun.length} past-end quiz{overrun.length !== 1 ? 'zes' : ''}
                    </Button>
                  </div>
                )}

                {/* Dates */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Move every due date
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {[-7, -1, 1, 7].map(d => (
                      <Button
                        key={d} size="sm" variant="secondary" disabled={busy}
                        onClick={() => void run(ids, { action: 'shiftDays', value: d }, 'PATCH',
                          n => `Moved ${n} due dates by ${d > 0 ? '+' : ''}${d} day${Math.abs(d) !== 1 ? 's' : ''}.`)}
                      >
                        <CalendarClock size={13} /> {d > 0 ? `+${d}` : d} day{Math.abs(d) !== 1 ? 's' : ''}
                      </Button>
                    ))}
                    <span className="text-xs text-gray-400">spacing between quizzes is kept</span>
                  </div>
                </div>

                {/* Publication + settings */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Publication
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" disabled={busy}
                        onClick={() => void run(ids, { action: 'publish', value: true }, 'PATCH',
                          n => `Published ${n}.`)}>
                        Publish all
                      </Button>
                      <Button size="sm" variant="secondary" disabled={busy}
                        onClick={() => void run(ids, { action: 'publish', value: false }, 'PATCH',
                          n => `Unpublished ${n}.`)}>
                        Unpublish all
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Retakes allowed (every quiz)
                      {curRetakes === null ? mixed : (
                        <span className="ml-1.5 font-normal normal-case text-brand-700">
                          — {curRetakes === -1 ? 'unlimited' : curRetakes}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3].map(n => (
                        <Button key={n} size="sm" variant={curRetakes === n ? 'primary' : 'secondary'} disabled={busy}
                          onClick={() => void run(ids, { action: 'maxRetakes', value: n }, 'PATCH',
                            c => `Set ${c} quizzes to ${n} retake${n !== 1 ? 's' : ''}.`)}>
                          {n}
                        </Button>
                      ))}
                      <Button size="sm" variant={curRetakes === -1 ? 'primary' : 'secondary'} disabled={busy}
                        onClick={() => void run(ids, { action: 'maxRetakes', value: null }, 'PATCH',
                          c => `Set ${c} quizzes to unlimited retakes.`)}>
                        Unlimited
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
                        Review from earlier sections —{' '}
                        <span className="text-brand-700 normal-case">
                          {current === null ? 'mixed across the series'
                            : current === 0 ? 'none: each quiz is its own section only'
                            : `${current}% earlier / ${100 - current}% this section`}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[0, 10, 20, 25, 30, 50].map(pc => (
                          <Button key={pc} size="sm" variant={current === pc ? 'primary' : 'secondary'} disabled={busy}
                            onClick={() => {
                              if (!confirm(`Rebuild all ${s.members.length} quizzes so ${pc}% of each comes from earlier sections?\n\nThis regenerates their questions.`)) return
                              void run(ids, { action: 'reviewPct', value: pc }, 'PATCH',
                                n => `Rebuilt ${n} quizzes with ${pc}% earlier-section review.`)
                            }}>
                            {pc === 0 ? 'None' : `${pc}%`}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Week 1 has nothing earlier, so it stays on its own words. Rebuilds the
                        questions, so it is refused once students have answered.
                      </p>
                    </div>
                  )
                })()}

                {/* Morphology series: vocabulary cap status. Changing the cap regenerates
                    questions with each quiz's own fields and filters, which are set at
                    creation — so the cap is chosen in the series builder ("Match vocabulary
                    schedule"); here it is reported, so its state is never invisible. */}
                {s.type === 'MORPHOLOGY_QUIZ' && (() => {
                  const capped = s.members.every(m => m.vocabThruLesson != null && m.vocabThruLesson === Math.min(m.weekNumber, 16))
                  const none = s.members.every(m => m.vocabThruLesson == null)
                  return (
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Vocabulary
                      <span className="ml-1.5 font-normal normal-case text-brand-700">
                        {capped ? '— each quiz uses only words taught by its week'
                         : none ? '— no cap: quizzes may use any parsing example'
                         : '— mixed caps across the series'}
                      </span>
                    </p>
                  )
                })()}

                {/* Timing + late policy */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Time per question (every quiz)
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
                            n => sec === 0 ? `Set ${n} quizzes to untimed.`
                                           : `Set ${n} quizzes to ${sec}s per question.`)}>
                          {sec === 0 ? 'Untimed' : `${sec}s`}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      The student&rsquo;s clock is per question, so a 20-question quiz at 30s runs 10 minutes.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Late submissions (every quiz)
                      {curLate === null ? mixed : (
                        <span className="ml-1.5 font-normal normal-case text-brand-700">
                          — {curLate === 0 ? 'not allowed'
                             : curLate === -1 ? 'allowed, no limit'
                             : `${curLate} day${curLate !== 1 ? 's' : ''}`}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={curLate === 0 ? 'primary' : 'secondary'} disabled={busy}
                        onClick={() => void run(ids, { action: 'allowLate', value: false }, 'PATCH',
                          n => `Closed ${n} quizzes to late work.`)}>
                        Not allowed
                      </Button>
                      {[1, 3, 7].map(days => (
                        <Button key={days} size="sm" variant={curLate === days ? 'primary' : 'secondary'} disabled={busy}
                          onClick={async () => {
                            await run(ids, { action: 'allowLate', value: true }, 'PATCH', () => '')
                            await run(ids, { action: 'lateDaysLimit', value: days }, 'PATCH',
                              n => `Allowed late work on ${n} quizzes for ${days} day${days !== 1 ? 's' : ''}.`)
                          }}>
                          {days}d late
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
                            {format(new Date(m.dueDate), 'MMM d, yyyy')}
                          </span>
                          <span className="flex-1 min-w-0 truncate text-gray-800">{m.title}</span>
                          <span className="text-xs text-gray-400 shrink-0">{m.questionCount}q</span>
                          <span className={clsx('text-xs px-1.5 py-0.5 rounded shrink-0',
                            m.isPublished ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500 bg-gray-100')}>
                            {m.isPublished ? 'Published' : 'Draft'}
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
