'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/lib/api-client'
import { Check, ChevronDown, ChevronRight, ExternalLink, Loader2, Search, Undo2 } from 'lucide-react'
import {
  constructCorpusLabel, describeConstruct, parseConstructLink,
  type ConstructConfig, type ConstructFinding,
} from '@/lib/construct-assignment'

interface Row {
  userId: string
  name: string
  email: string
  submittedAt: string | null
  completeCount: number
  findings: ConstructFinding[]
  notes: string
  grade: number | null
  gradeNote: string | null
}
interface Data {
  assignment: { id: string; title: string; searchHref: string | null; config: ConstructConfig }
  rows: Row[]
}

// Instructor view for a CONSTRUCT_SEARCH assignment: every enrolled student, how many
// examples they found, their find-list in full, and a grade + feedback field. Lists stay
// readable before they're handed in, so you can see who is stuck mid-week.
export function ConstructSearchGrader({ assignmentId }: { assignmentId: string }) {
  const { data, isLoading, mutate } = useApi<Data>(`/api/assignments/${assignmentId}/construct-search/grade`)
  const [open, setOpen] = useState<string | null>(null)
  const search = useMemo(
    () => (data?.assignment.searchHref ? parseConstructLink(data.assignment.searchHref) : null),
    [data?.assignment.searchHref],
  )

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

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-4">
        <CardTitle>Construct Search — {data.assignment.title}</CardTitle>
        <span className="text-sm text-gray-500">
          Handed in: <span className="font-semibold text-gray-800">{submitted} / {data.rows.length}</span>
        </span>
      </div>

      {/* The search you set, so you can check their examples against it without leaving. */}
      {search && (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-800">
            <Search size={13} /> {constructCorpusLabel(search.query)}
          </p>
          <p className="mt-0.5 text-xs text-brand-700">{describeConstruct(search.query)}</p>
          {data.assignment.searchHref && (
            <Link
              href={data.assignment.searchHref}
              target="_blank"
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline"
            >
              Run it yourself <ExternalLink size={12} />
            </Link>
          )}
          <p className="mt-1.5 text-xs text-brand-600">
            Target: {data.assignment.config.requiredCount} example{data.assignment.config.requiredCount === 1 ? '' : 's'} each.
          </p>
        </div>
      )}

      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        {data.rows.map(row => (
          <StudentRow
            key={row.userId}
            row={row}
            assignmentId={assignmentId}
            config={data.assignment.config}
            expanded={open === row.userId}
            onToggle={() => setOpen(open === row.userId ? null : row.userId)}
            onSaved={() => mutate()}
          />
        ))}
      </div>
    </Card>
  )
}

function StudentRow({ row, assignmentId, config, expanded, onToggle, onSaved }: {
  row: Row
  assignmentId: string
  config: ConstructConfig
  expanded: boolean
  onToggle: () => void
  onSaved: () => void
}) {
  const [grade, setGrade] = useState(row.grade !== null ? String(row.grade) : '')
  const [gradeNote, setGradeNote] = useState(row.gradeNote ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setGrade(row.grade !== null ? String(row.grade) : '')
    setGradeNote(row.gradeNote ?? '')
  }, [row.grade, row.gradeNote])

  const dirty = grade !== (row.grade !== null ? String(row.grade) : '') || gradeNote !== (row.gradeNote ?? '')
  const short = row.completeCount < config.requiredCount

  async function post(body: Record<string, unknown>) {
    const res = await fetch(`/api/assignments/${assignmentId}/construct-search/grade`, {
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
      alert('Could not save the grade. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function reopen() {
    if (!window.confirm(`Reopen ${row.name}'s find-list so they can keep working on it?`)) return
    try {
      await post({ reopen: true })
      onSaved()
    } catch {
      alert('Could not reopen this submission. Please try again.')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50">
        <button onClick={onToggle} className="shrink-0 text-gray-400 hover:text-gray-700" title={expanded ? 'Collapse' : 'Expand find-list'}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <button onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className="truncate font-medium text-gray-800">{row.name}</p>
          <p className="truncate text-xs text-gray-400">{row.email}</p>
        </button>

        <div className="w-24 shrink-0 text-center">
          {row.submittedAt
            ? <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Handed in</span>
            : <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400">In progress</span>}
          <p className={`mt-1 text-[11px] ${short ? 'text-amber-600' : 'text-gray-400'}`}>
            {row.completeCount} / {config.requiredCount} found
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <input
            type="number" min={0} max={100} value={grade}
            onChange={e => setGrade(e.target.value)}
            placeholder="—"
            className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
            title="Grade (0–100)"
          />
          <span className="text-xs text-gray-400">%</span>
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty && !saved}>
            {saved ? <><Check size={13} /> Saved</> : 'Save'}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 bg-gray-50/60 px-3 pb-4 pt-1">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Feedback to student</label>
            <textarea
              value={gradeNote}
              onChange={e => setGradeNote(e.target.value)}
              rows={2}
              placeholder="Optional feedback shown to the student with their grade."
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {row.findings.length === 0 ? (
            <p className="py-2 text-sm italic text-gray-400">This student hasn&rsquo;t entered any examples yet.</p>
          ) : (
            <div className="space-y-2">
              {row.findings.map((f, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-surface p-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs text-gray-400">{i + 1}.</span>
                    <span className="text-xs font-semibold text-brand-700">{f.ref || 'no reference'}</span>
                    <span className="font-reading text-sm text-gray-800">{f.greek}</span>
                  </div>
                  {f.translation && <p className="mt-1 text-sm text-gray-700">{f.translation}</p>}
                  {f.comment && <p className="mt-1 whitespace-pre-wrap text-xs text-gray-500">{f.comment}</p>}
                </div>
              ))}
            </div>
          )}

          {row.notes && (
            <div className="rounded-lg border border-gray-200 bg-surface p-3">
              <p className="mb-1 text-xs font-semibold text-gray-600">What they noticed</p>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{row.notes}</p>
            </div>
          )}

          {row.submittedAt && (
            <button
              onClick={reopen}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-brand-700"
            >
              <Undo2 size={13} /> Reopen for this student
            </button>
          )}
        </div>
      )}
    </div>
  )
}
