'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { ChevronDown, ChevronRight, CalendarClock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { membersPastCourseEnd, type AssignmentSeries } from '@/lib/assignment-series'

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
            ({series.length} — edit a whole run at once)
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
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3].map(n => (
                        <Button key={n} size="sm" variant="secondary" disabled={busy}
                          onClick={() => void run(ids, { action: 'maxRetakes', value: n }, 'PATCH',
                            c => `Set ${c} quizzes to ${n} retake${n !== 1 ? 's' : ''}.`)}>
                          {n}
                        </Button>
                      ))}
                      <Button size="sm" variant="secondary" disabled={busy}
                        onClick={() => void run(ids, { action: 'maxRetakes', value: null }, 'PATCH',
                          c => `Set ${c} quizzes to unlimited retakes.`)}>
                        Unlimited
                      </Button>
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
