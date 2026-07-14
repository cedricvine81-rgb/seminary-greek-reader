'use client'
import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useApi } from '@/lib/api-client'
import { mutate as globalMutate } from 'swr'
import { Check, X } from 'lucide-react'
import { format } from 'date-fns'

interface Appeal {
  id: string
  studentAnswer: string
  instructorDecision: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NOT_APPLICABLE'
  instructorDecidedAt: string | null
  instructorNote: string | null
  adminDecision: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NOT_APPLICABLE'
  adminDecidedAt: string | null
  adminNote: string | null
  createdAt: string
  student: { firstName: string; surname: string; email: string }
  assignment: { title: string; course: { name: string } }
  question: { prompt: string; correctAnswer: string }
}

interface Resp { appeals: Appeal[]; pendingCount: number }

export function AdminAppealsTable() {
  const [status, setStatus] = useState<'PENDING' | 'DECIDED'>('PENDING')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  const { data, isLoading, mutate } = useApi<Resp>(`/api/admin/appeals?status=${status}`)

  async function decide(a: Appeal, decision: 'ACCEPTED' | 'REJECTED') {
    const verb = decision === 'ACCEPTED' ? 'Accept' : 'Reject'
    const detail = decision === 'ACCEPTED'
      ? `\n\nAccepting will add "${a.studentAnswer}" to the global lexicon for lemma ${a.question.prompt}, so future quizzes auto-accept it. The student's grade is unaffected (the instructor already updated it).`
      : `\n\nRejecting leaves the global lexicon untouched. The student's grade is unaffected.`
    if (!confirm(`${verb} this admin appeal for "${a.studentAnswer}" (lemma: ${a.question.prompt})?${detail}`)) return

    setBusyId(a.id); setError(''); setInfo('')
    try {
      const res = await fetch(`/api/admin/appeals/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error ?? 'Action failed'); return }
      if (d.lexiconWarning) setInfo(d.lexiconWarning)
      else if (decision === 'ACCEPTED' && d.lexiconUpdated) setInfo(`Added "${a.studentAnswer}" to the global lexicon for ${a.question.prompt}.`)
      else setInfo('Decision recorded.')
      mutate()
      // Refresh the admin sidebar's pending-count badge immediately (otherwise stale for ~60s)
      globalMutate('/api/admin/appeals/pending')
    } catch {
      setError('Network error.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <CardTitle>
          Vocab Appeals
          {data && status === 'PENDING' && data.pendingCount > 0 && (
            <span className="ml-2 text-sm font-normal text-amber-700">({data.pendingCount} awaiting admin)</span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => setStatus('PENDING')}
            className={`px-3 py-1 rounded-none text-sm ${status === 'PENDING' ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Awaiting admin
          </button>
          <button
            onClick={() => setStatus('DECIDED')}
            className={`px-3 py-1 rounded-none text-sm ${status === 'DECIDED' ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            History
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Appeals the instructor accepted (so the student&rsquo;s grade was updated). Your decision affects only the
        <strong> global lexicon</strong> — whether this answer should be auto-accepted on <em>future</em> quizzes for
        the same lemma. Accepting an answer adds it to <code>LexicalEntry.acceptedAnswers</code>; rejecting leaves
        the lexicon untouched. Either way the student&rsquo;s grade stands.
      </p>

      {info && <p className="text-sm text-emerald-700 bg-emerald-50 rounded px-3 py-2 mb-3">{info}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-3">{error}</p>}
      {isLoading && <p className="text-sm text-gray-400 animate-pulse">Loading…</p>}

      {data && data.appeals.length === 0 && (
        <p className="text-sm text-gray-400 italic py-4">No {status === 'PENDING' ? 'pending' : 'decided'} appeals.</p>
      )}

      {data && data.appeals.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="pb-2 pr-3">Student</th>
                <th className="pb-2 pr-3">Quiz</th>
                <th className="pb-2 pr-3">Lemma</th>
                <th className="pb-2 pr-3">Their answer</th>
                <th className="pb-2 pr-3">Official</th>
                <th className="pb-2 pr-3 whitespace-nowrap">Instructor accepted</th>
                <th className="pb-2">Admin action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.appeals.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="py-2 pr-3">
                    <p className="font-medium text-gray-800">{a.student.firstName} {a.student.surname}</p>
                    <p className="text-xs text-gray-400">{a.student.email}</p>
                  </td>
                  <td className="py-2 pr-3">
                    <p className="text-gray-800">{a.assignment.title}</p>
                    <p className="text-xs text-gray-400">{a.assignment.course.name}</p>
                  </td>
                  <td className="py-2 pr-3 font-greek text-lg text-gray-800">{a.question.prompt}</td>
                  <td className="py-2 pr-3 text-red-700 font-medium">{a.studentAnswer}</td>
                  <td className="py-2 pr-3 text-emerald-700">{a.question.correctAnswer}</td>
                  <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                    {a.instructorDecidedAt ? format(new Date(a.instructorDecidedAt), 'MMM d, h:mm a') : '—'}
                  </td>
                  <td className="py-2">
                    {a.adminDecision === 'PENDING' ? (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => decide(a, 'ACCEPTED')} loading={busyId === a.id} title="Add to global lexicon">
                          <Check size={13} /> Add to lexicon
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => decide(a, 'REJECTED')} loading={busyId === a.id}>
                          <X size={13} /> Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <Badge variant={a.adminDecision === 'ACCEPTED' ? 'green' : 'gray'}>
                          {a.adminDecision}
                        </Badge>
                        {a.adminDecidedAt && (
                          <span className="text-[10px] text-gray-400">
                            {format(new Date(a.adminDecidedAt), 'MMM d')}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
