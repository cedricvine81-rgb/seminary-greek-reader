'use client'
import { useState } from 'react'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/lib/api-client'
import type { ActivityLogConfig, ActivityLogEntries } from '@/lib/activity-log'

interface Row {
  userId: string
  name: string
  email: string
  entries: ActivityLogEntries
  notes: string
  reported: number
  submittedAt: string | null
  auto: number | null
  grade: number | null
  gradeNote: string | null
}

interface Data {
  assignment: { id: string; title: string; instructions: string | null }
  config: ActivityLogConfig
  deadlines: string[]
  rows: Row[]
}

/**
 * Instructor grading for an ACTIVITY_LOG assignment. Each student's Pass/Fail is computed
 * from the weeks they reported; the instructor can accept the computed result for the whole
 * class in one click, or override any individual.
 */
export function ActivityLogGrader({ assignmentId }: { assignmentId: string }) {
  const t = useT()
  const { data, isLoading, mutate } = useApi<Data>(`/api/assignments/${assignmentId}/activity-log/grade`)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        <Loader2 size={16} className="inline animate-spin" /> {t('alg.loading')}
      </p>
    )
  }
  if (!data) return <p className="py-8 text-sm italic text-gray-400">{t('al.couldNotLoad')}</p>
  if (data.rows.length === 0) return <p className="py-8 text-sm italic text-gray-400">{t('alg.noStudents')}</p>

  async function applyAuto() {
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/activity-log/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyAuto: true }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        setMessage(t('alg.applied', { n: body.count ?? 0 }))
        void mutate()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600">
          {t('al.progress', { done: data.config.requiredWeeks, total: data.config.weeks })}
        </span>
        <Button size="sm" variant="secondary" onClick={applyAuto} disabled={busy}>
          {busy && <Loader2 size={14} className="mr-1 inline animate-spin" />}
          {t('alg.applyAuto')}
        </Button>
        {message && <span className="text-xs text-green-700">{message}</span>}
      </div>

      <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        {data.rows.map(row => (
          <StudentRow key={row.userId} row={row} config={data.config} assignmentId={assignmentId} onSaved={() => void mutate()} />
        ))}
      </ul>
    </div>
  )
}

function StudentRow({ row, config, assignmentId, onSaved }: {
  row: Row
  config: ActivityLogConfig
  assignmentId: string
  onSaved: () => void
}) {
  const t = useT()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [gradeNote, setGradeNote] = useState(row.gradeNote ?? '')
  const [saving, setSaving] = useState(false)

  // What counts right now: the instructor's override if there is one, otherwise the
  // computed result. Null means the student can still reach a pass.
  const effective = row.grade ?? row.auto
  const dateFmt = new Intl.DateTimeFormat(locale === 'es' ? 'es' : 'en', { month: 'short', day: 'numeric' })

  async function save(grade: number | null) {
    setSaving(true)
    try {
      await fetch(`/api/assignments/${assignmentId}/activity-log/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: row.userId, grade, gradeNote }),
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
        >
          {open ? <ChevronDown size={15} className="shrink-0 text-gray-400" /> : <ChevronRight size={15} className="shrink-0 text-gray-400" />}
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-gray-800">{row.name}</span>
            <span className="block text-xs text-gray-500">
              {t('alg.weeksReported')}: {row.reported} / {config.weeks}
            </span>
          </span>
        </button>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            effective == null ? 'bg-gray-100 text-gray-600'
              : effective >= 50 ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {effective == null ? t('al.inProgress') : effective >= 50 ? t('al.pass') : t('al.fail')}
        </span>

        <span className="flex gap-1.5">
          <Button size="sm" variant={row.grade === 100 ? 'primary' : 'secondary'} disabled={saving} onClick={() => save(100)}>
            {t('al.pass')}
          </Button>
          <Button size="sm" variant={row.grade === 0 ? 'primary' : 'secondary'} disabled={saving} onClick={() => save(0)}>
            {t('al.fail')}
          </Button>
          {row.grade != null && (
            <Button size="sm" variant="ghost" disabled={saving} onClick={() => save(null)}>
              {t('alg.useComputed')}
            </Button>
          )}
        </span>
      </div>

      {open && (
        <div className="mt-3 space-y-3 pl-6">
          <ul className="flex flex-wrap gap-1.5">
            {Array.from({ length: config.weeks }, (_, i) => i + 1).map(week => {
              const entry = row.entries[String(week)]
              return (
                <li
                  key={week}
                  title={entry?.comment || undefined}
                  className={`rounded-lg px-2 py-1 text-xs ${
                    entry ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {week}
                  {entry && <span className="ml-1 opacity-70">{dateFmt.format(new Date(entry.at))}</span>}
                </li>
              )
            })}
          </ul>

          {Object.entries(row.entries)
            .filter(([, e]) => e.comment)
            .map(([week, e]) => (
              <p key={week} className="text-xs text-gray-600">
                <span className="font-medium">{t('al.week', { n: Number(week) })}:</span> {e.comment}
              </p>
            ))}

          {row.notes && <p className="whitespace-pre-wrap text-sm text-gray-600">{row.notes}</p>}

          <div>
            <label className="block text-xs font-medium text-gray-600" htmlFor={`note-${row.userId}`}>
              {t('alg.feedback')}
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id={`note-${row.userId}`}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                placeholder={t('alg.feedbackPlaceholder')}
                value={gradeNote}
                onChange={e => setGradeNote(e.target.value)}
              />
              <Button size="sm" variant="secondary" disabled={saving} onClick={() => save(row.grade)}>
                {t('alg.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}
