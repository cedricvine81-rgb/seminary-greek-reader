'use client'
import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/lib/api-client'
import { sanitizeNoteHtml, toNoteHtml, isHtmlEmpty } from '@/lib/note-html'
import { ChevronDown, ChevronRight, Check, Loader2, FileText } from 'lucide-react'

interface Note {
  ref: string | null   // "John 1:1" for a verse note; null for a general course note
  title: string | null // heading, mainly for general notes
  body: string         // raw stored HTML; sanitized client-side before render
}
interface Row {
  userId: string
  name: string
  email: string
  folderId: string | null
  submittedAt: string | null
  grade: number | null
  gradeNote: string | null
  noteCount: number
  notes: Note[]
}
interface Data {
  assignment: { id: string; title: string; notesFolderName: string | null }
  rows: Row[]
}

// Instructor view for a COURSE_NOTES assignment: every enrolled student with their
// submission status, an expandable read-only view of their notes (verse-anchored and
// general), and a grade + feedback field. Notes stay live, so this always mirrors the
// current contents of each student's submission folder.
export function CourseNotesGrader({ assignmentId }: { assignmentId: string }) {
  const { data, isLoading, mutate } = useApi<Data>(`/api/assignments/${assignmentId}/course-notes`)
  const [open, setOpen] = useState<string | null>(null)

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-gray-400 py-6 text-center">
          <Loader2 size={16} className="inline animate-spin" /> Loading submissions…
        </p>
      </Card>
    )
  }
  if (!data) return <Card><p className="text-sm text-gray-400 italic py-6">Could not load submissions.</p></Card>
  if (data.rows.length === 0) return <Card><p className="text-sm text-gray-400 italic py-6">No enrolled students found.</p></Card>

  const submitted = data.rows.filter(r => r.submittedAt).length

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>Course Notes — {data.assignment.notesFolderName || data.assignment.title}</CardTitle>
        <span className="text-sm text-gray-500">
          Submitted: <span className="font-semibold text-gray-800">{submitted} / {data.rows.length}</span>
        </span>
      </div>

      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        {data.rows.map(row => (
          <StudentRow
            key={row.userId}
            row={row}
            assignmentId={assignmentId}
            expanded={open === row.userId}
            onToggle={() => setOpen(open === row.userId ? null : row.userId)}
            onSaved={() => mutate()}
          />
        ))}
      </div>
    </Card>
  )
}

function StudentRow({ row, assignmentId, expanded, onToggle, onSaved }: {
  row: Row
  assignmentId: string
  expanded: boolean
  onToggle: () => void
  onSaved: () => void
}) {
  const [grade, setGrade] = useState(row.grade !== null ? String(row.grade) : '')
  const [gradeNote, setGradeNote] = useState(row.gradeNote ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Keep the inputs in sync if the underlying data changes (e.g. after a mutate).
  useEffect(() => {
    setGrade(row.grade !== null ? String(row.grade) : '')
    setGradeNote(row.gradeNote ?? '')
  }, [row.grade, row.gradeNote])

  const dirty = grade !== (row.grade !== null ? String(row.grade) : '') || gradeNote !== (row.gradeNote ?? '')

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/course-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: row.userId, grade: grade === '' ? null : Number(grade), gradeNote: gradeNote || null }),
      })
      if (!res.ok) throw new Error('save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved()
    } catch {
      alert('Could not save the grade. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header row: name, status, note count, grade + feedback */}
      <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50">
        <button onClick={onToggle} className="shrink-0 text-gray-400 hover:text-gray-700" title={expanded ? 'Collapse' : 'Expand notes'}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <button onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className="font-medium text-gray-800 truncate">{row.name}</p>
          <p className="text-xs text-gray-400 truncate">{row.email}</p>
        </button>

        <div className="shrink-0 text-center w-24">
          {row.submittedAt
            ? <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md">Submitted</span>
            : <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Not submitted</span>}
          <p className="mt-1 text-[11px] text-gray-400">{row.noteCount} note{row.noteCount === 1 ? '' : 's'}</p>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <input
            type="number" min={0} max={100} value={grade}
            onChange={e => setGrade(e.target.value)}
            placeholder="—"
            className="w-16 text-center text-sm rounded-lg border border-gray-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
            title="Grade (0–100)"
          />
          <span className="text-xs text-gray-400">%</span>
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty && !saved}>
            {saved ? <><Check size={13} /> Saved</> : 'Save'}
          </Button>
        </div>
      </div>

      {/* Expanded: feedback field + read-only notes */}
      {expanded && (
        <div className="px-3 pb-4 pt-1 bg-gray-50/60 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Feedback to student</label>
            <textarea
              value={gradeNote}
              onChange={e => setGradeNote(e.target.value)}
              rows={2}
              placeholder="Optional feedback shown to the student with their grade."
              className="w-full text-sm rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {row.notes.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-2 flex items-center gap-1.5">
              <FileText size={14} /> No notes in this student&rsquo;s folder yet.
            </p>
          ) : (
            <div className="space-y-2">
              {row.notes.map((n, i) => {
                // Sanitize on the client so the note's formatting is preserved (server-side
                // sanitize is text-only).
                const html = sanitizeNoteHtml(toNoteHtml(n.body))
                return (
                  <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      {n.ref
                        ? <span className="text-xs font-semibold text-brand-700">{n.ref}</span>
                        : <span className="text-xs font-semibold text-gray-700">{n.title || 'Course note'}</span>}
                      {!n.ref && (
                        <span className="shrink-0 rounded-full bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5">Course note</span>
                      )}
                    </div>
                    {/* Verse note with its own title still shows it above the body. */}
                    {n.ref && n.title && <p className="text-xs font-medium text-gray-600 mb-1">{n.title}</p>}
                    {isHtmlEmpty(html)
                      ? <p className="text-xs text-gray-400 italic">Empty note.</p>
                      : <div
                          className="prose-notes text-sm leading-snug text-gray-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
