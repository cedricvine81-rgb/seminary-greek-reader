'use client'
import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/lib/api-client'
import { useT } from '@/lib/i18n/LocaleProvider'
import { Check, ChevronDown, ChevronRight, Loader2, Undo2 } from 'lucide-react'
import { DiagramCanvas, type DiagramData } from '@/components/phrase/DiagramCanvas'
import { treeWords, type Sentence } from '@/components/phrase/PhraseExplorer'
import { sentenceKey, usePhraseSentences } from '@/components/student/DiagramWorkspace'

interface Row {
  userId: string
  name: string
  email: string
  submittedAt: string | null
  sentenceCount: number
  diagrams: Record<string, DiagramData>
  notes: string
  grade: number | null
  gradeNote: string | null
}
interface Data {
  assignment: { id: string; title: string; reference: string | null; instructions: string | null }
  rows: Row[]
}

// Instructor view for a DIAGRAM assignment: every enrolled student, how many sentences
// they arranged, their canvases rendered read-only, and a grade + feedback field.
// Work stays readable before it's handed in, so you can see who is stuck mid-week.
export function DiagramGrader({ assignmentId }: { assignmentId: string }) {
  const t = useT()
  const { data, isLoading, mutate } = useApi<Data>(`/api/assignments/${assignmentId}/diagram/grade`)
  const [open, setOpen] = useState<string | null>(null)
  const sentences = usePhraseSentences(data?.assignment.reference ?? null)

  if (isLoading) {
    return (
      <Card>
        <p className="py-6 text-center text-sm text-gray-400">
          <Loader2 size={16} className="inline animate-spin" /> Loading submissions…
        </p>
      </Card>
    )
  }
  if (!data) return <Card><p className="py-6 text-sm italic text-gray-400">Could not load submissions.</p></Card>
  if (data.rows.length === 0) return <Card><p className="py-6 text-sm italic text-gray-400">No enrolled students found.</p></Card>

  const submitted = data.rows.filter(r => r.submittedAt).length
  const total = sentences.status === 'ready' ? sentences.sentences.length : null

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-4">
        <CardTitle>{data.assignment.title}</CardTitle>
        <span className="text-sm text-gray-500">
          {t('cs.handedInCount')}: <span className="font-semibold text-gray-800">{submitted} / {data.rows.length}</span>
        </span>
      </div>

      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        {data.rows.map(row => (
          <StudentRow
            key={row.userId}
            row={row}
            assignmentId={assignmentId}
            sentences={sentences.status === 'ready' ? sentences.sentences : null}
            hebrew={sentences.status === 'ready' ? sentences.hebrew : false}
            total={total}
            expanded={open === row.userId}
            onToggle={() => setOpen(open === row.userId ? null : row.userId)}
            onSaved={() => mutate()}
          />
        ))}
      </div>
    </Card>
  )
}

function StudentRow({ row, assignmentId, sentences, hebrew, total, expanded, onToggle, onSaved }: {
  row: Row
  assignmentId: string
  sentences: Sentence[] | null
  hebrew: boolean
  total: number | null
  expanded: boolean
  onToggle: () => void
  onSaved: () => void
}) {
  const [grade, setGrade] = useState(row.grade !== null ? String(row.grade) : '')
  const [gradeNote, setGradeNote] = useState(row.gradeNote ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const t = useT()

  useEffect(() => {
    setGrade(row.grade !== null ? String(row.grade) : '')
    setGradeNote(row.gradeNote ?? '')
  }, [row.grade, row.gradeNote])

  const dirty = grade !== (row.grade !== null ? String(row.grade) : '') || gradeNote !== (row.gradeNote ?? '')

  async function post(body: Record<string, unknown>) {
    const res = await fetch(`/api/assignments/${assignmentId}/diagram/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: row.userId, ...body }),
    })
    if (!res.ok) throw new Error('request failed')
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await post({ grade: grade === '' ? null : Number(grade), gradeNote: gradeNote || null })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved()
    } catch {
      alert(t('gr.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function reopen() {
    if (!window.confirm(t('cs.reopenConfirm', { name: row.name }))) return
    try {
      await post({ reopen: true })
      onSaved()
    } catch {
      alert(t('cs.reopenFailed'))
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50">
        <button onClick={onToggle} className="shrink-0 text-gray-400 hover:text-gray-700" title={t(expanded ? 'cs.collapse' : 'da.expand')}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <button onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className="truncate font-medium text-gray-800">{row.name}</p>
          <p className="truncate text-xs text-gray-400">{row.email}</p>
        </button>

        <div className="w-24 shrink-0 text-center">
          {row.submittedAt
            ? <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">{t('cs.statusHandedIn')}</span>
            : <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400">{t('cs.statusInProgress')}</span>}
          <p className="mt-1 text-[11px] text-gray-400">
            {total !== null ? t('da.workedCount', { done: row.sentenceCount, total }) : row.sentenceCount}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <input
            type="number" min={0} max={100} value={grade}
            onChange={e => setGrade(e.target.value)}
            placeholder="—"
            className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
            title={t('gr.gradeTitle')}
          />
          <span className="text-xs text-gray-400">%</span>
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty && !saved}>
            {saved ? <><Check size={13} /> {t('gr.saved')}</> : t('gr.save')}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 bg-gray-50/60 px-3 pb-4 pt-1">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">{t('gr.feedbackToStudent')}</label>
            <textarea
              value={gradeNote}
              onChange={e => setGradeNote(e.target.value)}
              rows={2}
              placeholder={t('gr.feedbackExample')}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {sentences === null ? (
            <p className="py-2 text-sm italic text-gray-400">{t('da.noSentences')}</p>
          ) : (
            sentences.map(s => {
              const key = sentenceKey(s)
              const d = row.diagrams[key]
              return (
                <div key={key} className="rounded-lg border border-gray-200 bg-surface p-3">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-400">
                    {s.ref}
                    {!d && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">{t('da.notStarted')}</span>}
                  </p>
                  {d && (
                    <DiagramCanvas words={treeWords(s.tree)} rtl={hebrew} initialData={d} readOnly />
                  )}
                </div>
              )
            })
          )}

          {row.notes && (
            <div className="rounded-lg border border-gray-200 bg-surface p-3">
              <p className="mb-1 text-xs font-semibold text-gray-600">{t('da.studentComment')}</p>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{row.notes}</p>
            </div>
          )}

          {row.submittedAt && (
            <button
              onClick={reopen}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-brand-700"
            >
              <Undo2 size={13} /> {t('cs.reopen')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
