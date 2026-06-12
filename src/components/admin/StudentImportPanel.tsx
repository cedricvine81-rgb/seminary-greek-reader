'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Upload, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useApi } from '@/lib/api-client'

interface Row { line: number; firstName: string; surname: string; email: string }
interface ParseError { line: number; raw: string; reason: string }
interface Duplicate { line: number; email: string; reason: string }
interface PreviewResponse {
  validRows: Row[]
  parseErrors: ParseError[]
  duplicates: Duplicate[]
  summary: { parsed: number; valid: number; parseErrors: number; duplicates: number }
}
interface CourseOpt { id: string; name: string }

export function StudentImportPanel({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [institution, setInstitution] = useState('Andrews University')
  const [courseId, setCourseId] = useState('')
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ created: number } | null>(null)

  // Course list for the optional auto-enroll dropdown
  const { data: coursesData } = useApi<{ courses: CourseOpt[] }>(open ? '/api/admin/courses' : null)
  const courses = coursesData?.courses ?? []

  function reset() {
    setInput(''); setCourseId(''); setPreview(null); setError(''); setResult(null)
  }

  async function runPreview() {
    setPreviewing(true); setError(''); setPreview(null)
    try {
      const res = await fetch('/api/admin/users/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Preview failed'); return }
      setPreview(data)
    } catch {
      setError('Network error during preview.')
    } finally {
      setPreviewing(false)
    }
  }

  async function commit() {
    if (!preview || preview.validRows.length === 0) return
    if (preview.parseErrors.length > 0 || preview.duplicates.length > 0) return
    if (!confirm(`Create ${preview.validRows.length} student account${preview.validRows.length === 1 ? '' : 's'}${courseId ? ' and enrol them in the selected course' : ''}? Each will be flagged to set their own password on first sign-in.`)) return

    setCommitting(true); setError('')
    try {
      const res = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, institution, courseId: courseId || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Import failed'); return }
      setResult({ created: data.created })
      onCreated()
    } catch {
      setError('Network error during import.')
    } finally {
      setCommitting(false)
    }
  }

  const canCommit = !!preview
    && preview.validRows.length > 0
    && preview.parseErrors.length === 0
    && preview.duplicates.length === 0

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => { reset(); setOpen(true) }} className="flex items-center gap-1.5">
        <Upload size={14} /> Import students
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Import students" size="xl">
        {result ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <p className="text-sm text-gray-700">
              Created <span className="font-semibold">{result.created}</span> student account{result.created === 1 ? '' : 's'}.
            </p>
            <p className="text-xs text-gray-500">
              Each new student has <code>mustChangePassword=true</code>. Use the ✉️ button in the Users table to email them a temporary password.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={reset}>Import more</Button>
              <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paste roster (one per line)
              </label>
              <p className="text-xs text-gray-500 mb-1.5">
                Two formats are accepted: <code>First, Surname, email</code> or <code>Full Name, email</code>. A header row is optional. Tabs and commas both work.
              </p>
              <textarea
                value={input}
                onChange={e => { setInput(e.target.value); setPreview(null); setError('') }}
                rows={8}
                placeholder={'Jane Doe, jane.doe@andrews.edu\nJohn Smith, john.smith@andrews.edu'}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Institution (applied to every new student)"
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                placeholder="Andrews University"
              />
              <Select
                label="Auto-enroll in course (optional)"
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                options={[
                  { value: '', label: 'No automatic enrollment' },
                  ...courses.map(c => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={runPreview} loading={previewing} disabled={!input.trim()} variant="secondary">
                Preview
              </Button>
              {preview && (
                <span className="text-xs text-gray-500">
                  <Badge variant={preview.summary.valid > 0 ? 'green' : 'gray'}>{preview.summary.valid} valid</Badge>{' '}
                  <Badge variant={preview.summary.parseErrors > 0 ? 'gray' : 'gray'}>{preview.summary.parseErrors} parse errors</Badge>{' '}
                  <Badge variant={preview.summary.duplicates > 0 ? 'gray' : 'gray'}>{preview.summary.duplicates} duplicates</Badge>
                </span>
              )}
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            {preview && (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {preview.parseErrors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Parse errors ({preview.parseErrors.length})
                    </p>
                    <ul className="space-y-1 text-xs">
                      {preview.parseErrors.map((e, i) => (
                        <li key={i} className="bg-red-50 border border-red-200 rounded px-2 py-1 text-red-700">
                          <span className="font-mono">line {e.line}:</span> {e.reason} <span className="text-red-400">— "{e.raw}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {preview.duplicates.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Already in database ({preview.duplicates.length})
                    </p>
                    <ul className="space-y-1 text-xs">
                      {preview.duplicates.map((d, i) => (
                        <li key={i} className="bg-amber-50 border border-amber-200 rounded px-2 py-1 text-amber-800">
                          <span className="font-mono">line {d.line}:</span> {d.email} — {d.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {preview.validRows.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> Ready to create ({preview.validRows.length})
                    </p>
                    <table className="w-full text-xs border border-gray-100 rounded overflow-hidden">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="text-left px-2 py-1">First</th>
                          <th className="text-left px-2 py-1">Surname</th>
                          <th className="text-left px-2 py-1">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.validRows.map(r => (
                          <tr key={r.line}>
                            <td className="px-2 py-1">{r.firstName}</td>
                            <td className="px-2 py-1">{r.surname}</td>
                            <td className="px-2 py-1 text-gray-600">{r.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={commit} loading={committing} disabled={!canCommit}>
                Create {preview?.validRows.length ?? 0} student{preview?.validRows.length === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
