'use client'
import { useState } from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { useApi } from '@/lib/api-client'
import type { ActivityLogConfig, ActivityLogEntries } from '@/lib/activity-log'

interface Data {
  assignment: { id: string; title: string; instructions: string | null }
  config: ActivityLogConfig
  deadlines: string[]
  open: boolean
  late: boolean
  submission: {
    entries: ActivityLogEntries
    notes: string
    submittedAt: string | null
    grade: number | null
    gradeNote: string | null
  }
}

/** A student's workspace for an ACTIVITY_LOG assignment: one row per week, tick and go. */
export function ActivityLogWorkspace({ assignmentId, previewMode = false }: { assignmentId: string; previewMode?: boolean }) {
  const t = useT()
  const { data, isLoading, mutate } = useApi<Data>(`/api/assignments/${assignmentId}/activity-log`)

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        <Loader2 size={16} className="inline animate-spin" /> {t('al.loading')}
      </p>
    )
  }
  if (!data) return <p className="py-8 text-sm italic text-gray-400">{t('al.couldNotLoad')}</p>

  return <Log data={data} assignmentId={assignmentId} previewMode={previewMode} onSaved={() => mutate()} />
}

function Log({ data, assignmentId, previewMode, onSaved }: {
  data: Data
  assignmentId: string
  previewMode: boolean
  onSaved: () => void
}) {
  const t = useT()
  const locale = useLocale()
  const { config, deadlines } = data
  // Read-only once the window closes, or when an instructor is previewing.
  const locked = !data.open || previewMode

  const [entries, setEntries] = useState<ActivityLogEntries>({ ...data.submission.entries })
  const [notes, setNotes] = useState(data.submission.notes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const done = Object.values(entries).filter(e => e.done).length
  const passed = done >= config.requiredWeeks
  const dateFmt = new Intl.DateTimeFormat(locale === 'es' ? 'es' : 'en', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  // Every change posts the whole map, so a dropped request loses nothing but its own save.
  async function persist(nextEntries: ActivityLogEntries, nextNotes: string) {
    if (locked) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/activity-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: nextEntries, notes: nextNotes }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? t('al.saveFailed'))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('al.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  function toggleWeek(week: number, on: boolean) {
    const next = { ...entries }
    const existing = next[String(week)]
    if (on) next[String(week)] = { done: true, at: new Date().toISOString(), comment: existing?.comment ?? '' }
    // Un-ticking keeps whatever statement was written — the student may be correcting the tick,
    // not withdrawing what they said, and losing the text would punish the correction.
    else if (existing?.comment.trim()) next[String(week)] = { ...existing, done: false }
    else delete next[String(week)]
    setEntries(next)
    void persist(next, notes)
  }

  // The statement can be written before the week is ticked — it has to be, since the tick now
  // depends on it — so this creates the entry if it does not exist yet. An entry with done:false
  // is a draft: it is saved, but weeksReported does not count it.
  function setComment(week: number, comment: string) {
    const existing = entries[String(week)]
    setEntries({
      ...entries,
      [String(week)]: existing
        ? { ...existing, comment }
        : { done: false, at: new Date().toISOString(), comment },
    })
  }

  return (
    <div className="space-y-5">
      {data.assignment.instructions && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-800">{t('al.requirements')}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-brand-900">{data.assignment.instructions}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">
          {t('al.progress', { done, total: config.weeks })}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            passed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {passed ? t('al.pass') : t('al.inProgress')}
        </span>
        {config.requiredWeeks < config.weeks && !passed && (
          <span className="text-xs text-gray-500">{t('al.passesAt', { n: config.requiredWeeks })}</span>
        )}
        {saving && <Loader2 size={14} className="animate-spin text-gray-400" />}
        {saved && <span className="text-xs text-green-700"><Check size={13} className="inline" /> {t('al.saved')}</span>}
      </div>

      {locked && !previewMode && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{t('al.closed')}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle size={14} className="inline" /> {error}
        </p>
      )}

      <ul className="space-y-2">
        {Array.from({ length: config.weeks }, (_, i) => i + 1).map(week => {
          const entry = entries[String(week)]
          const done = !!entry?.done
          // A statement is required before the week can be reported. A week already ticked stays
          // ticked whatever it says: the rule arrived mid-course and must not un-report work
          // done under the old one.
          const written = !!entry?.comment.trim()
          const deadline = deadlines[week - 1]
          const overdue = !done && deadline != null && new Date(deadline) < new Date()
          return (
            <li
              key={week}
              className={`rounded-xl border p-3 ${
                done ? 'border-green-200 bg-green-50/60' : overdue ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200'
              }`}
            >
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-brand-600"
                  checked={done}
                  disabled={locked || (!done && !written)}
                  onChange={e => toggleWeek(week, e.target.checked)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold text-gray-800">{t('al.week', { n: week })}</span>
                    {deadline && (
                      <span className="text-xs text-gray-500">
                        {t('al.dueBy', { date: dateFmt.format(new Date(deadline)) })}
                      </span>
                    )}
                    {overdue && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {t('al.overdue')}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-600">
                    {done ? t('al.reportedOn', { date: dateFmt.format(new Date(entry!.at)) })
                      : written ? t('al.markDone') : t('al.statementFirst')}
                  </span>
                </span>
              </label>

              {/* The statement of completion. Always available, because it has to be written
                  before the week can be ticked — it is the report, not a note about it. */}
              <label className="mt-2 block">
                <span className="sr-only">{t('al.statementLabel', { n: week })}</span>
                <textarea
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                  rows={2}
                  placeholder={t('al.statementPlaceholder')}
                  value={entry?.comment ?? ''}
                  disabled={locked}
                  onChange={e => setComment(week, e.target.value)}
                  onBlur={() => void persist(entries, notes)}
                />
              </label>
            </li>
          )
        })}
      </ul>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="al-notes">
          {t('al.notesLabel')}
        </label>
        <textarea
          id="al-notes"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          rows={3}
          placeholder={t('al.notesPlaceholder')}
          value={notes}
          disabled={locked}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => void persist(entries, notes)}
        />
      </div>

      {data.submission.grade != null && (
        <div className="rounded-xl border border-gray-200 p-3">
          <p className="text-sm">
            <span className="font-medium text-gray-700">{t('al.result')}: </span>
            <span className={data.submission.grade >= 50 ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
              {data.submission.grade >= 50 ? t('al.pass') : t('al.fail')}
            </span>
          </p>
          {data.submission.gradeNote && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{data.submission.gradeNote}</p>
          )}
        </div>
      )}
    </div>
  )
}
