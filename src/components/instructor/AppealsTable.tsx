'use client'
import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useApi } from '@/lib/api-client'
import { mutate as globalMutate } from 'swr'
import { Check, X } from 'lucide-react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { formatDateTime } from '@/lib/i18n/format'

interface Appeal {
  id: string
  studentAnswer: string
  instructorDecision: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NOT_APPLICABLE'
  instructorDecidedAt: string | null
  instructorNote: string | null
  adminDecision: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NOT_APPLICABLE'
  createdAt: string
  student: { id: string; firstName: string; surname: string; email: string }
  assignment: { id: string; title: string; courseId: string; course: { name: string } }
  question: { id: string; prompt: string; correctAnswer: string }
}

interface AppealsResp { appeals: Appeal[]; pendingCount: number }

export function AppealsTable() {
  const [status, setStatus] = useState<'PENDING' | 'DECIDED'>('PENDING')
  const [busyId, setBusyId] = useState<string | null>(null)
  const t = useT()
  const locale = useLocale()
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const { data, isLoading, mutate } = useApi<AppealsResp>(`/api/instructor/appeals?status=${status}`)

  async function decide(id: string, decision: 'ACCEPTED' | 'REJECTED') {
    const a = data?.appeals.find(x => x.id === id)
    if (!a) return
    const verb = decision === 'ACCEPTED' ? 'Accept' : 'Reject'
    const detail = decision === 'ACCEPTED'
      ? `\n\nAccepting will mark "${a.studentAnswer}" correct for this student AND for any other student who gave the same answer on this quiz. Their scores will update. The answer will then go to the admin queue for global-lexicon review.`
      : `\n\nRejecting closes this appeal with no grade change. The student will be told it was reviewed.`
    if (!confirm(`${verb} this appeal for "${a.studentAnswer}" (lemma: ${a.question.prompt})?${detail}`)) return

    setBusyId(id); setError(''); setInfo('')
    try {
      const res = await fetch(`/api/instructor/appeals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error ?? t('ap.actionFailed')); return }
      if (decision === 'ACCEPTED' && d.responsesFlipped) {
        setInfo(t('ap.updated', {
          count: d.responsesFlipped, n: d.responsesFlipped,
          students: t('ap.studentCount', { count: d.affectedUsers, n: d.affectedUsers }),
        }))
      } else {
        setInfo(t('ap.decisionRecorded'))
      }
      mutate()
      // Refresh the sidebar's pending-count badge immediately (it polls every 60s otherwise).
      globalMutate('/api/instructor/appeals/pending')
    } catch {
      setError(t('ap.networkError'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <CardTitle>
          {t('ap.title')}
          {data && status === 'PENDING' && data.pendingCount > 0 && (
            <span className="ml-2 text-sm font-normal text-amber-700">{t('ap.pendingCount', { n: data.pendingCount })}</span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => setStatus('PENDING')}
            className={`px-3 py-1 rounded-lg text-sm ${status === 'PENDING' ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {t('ap.tabPending')}
          </button>
          <button
            onClick={() => setStatus('DECIDED')}
            className={`px-3 py-1 rounded-lg text-sm ${status === 'DECIDED' ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {t('ap.tabHistory')}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-4">{t('ap.intro')}</p>

      {info && <p className="text-sm text-emerald-700 bg-emerald-50 rounded px-3 py-2 mb-3">{info}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-3">{error}</p>}
      {isLoading && <p className="text-sm text-gray-400 animate-pulse">{t('ap.loading')}</p>}

      {data && data.appeals.length === 0 && (
        <p className="text-sm text-gray-400 italic py-4">{t(status === 'PENDING' ? 'ap.nonePending' : 'ap.noneDecided')}</p>
      )}

      {data && data.appeals.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="pb-2 pr-3">{t('ap.colStudent')}</th>
                <th className="pb-2 pr-3">{t('ap.colQuiz')}</th>
                <th className="pb-2 pr-3">{t('ap.colLemma')}</th>
                <th className="pb-2 pr-3">{t('ap.colTheirAnswer')}</th>
                <th className="pb-2 pr-3">{t('ap.colOfficial')}</th>
                <th className="pb-2 pr-3 whitespace-nowrap">{t('ap.colWhen')}</th>
                <th className="pb-2">{t('ap.colAction')}</th>
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
                  <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(a.createdAt, locale)}</td>
                  <td className="py-2">
                    {a.instructorDecision === 'PENDING' ? (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => decide(a.id, 'ACCEPTED')} loading={busyId === a.id} title={t('ap.acceptTitle')}>
                          <Check size={13} /> {t('ap.accept')}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => decide(a.id, 'REJECTED')} loading={busyId === a.id}>
                          <X size={13} /> {t('ap.reject')}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <Badge variant={a.instructorDecision === 'ACCEPTED' ? 'green' : 'gray'}>
                          {a.instructorDecision}
                        </Badge>
                        {a.instructorDecision === 'ACCEPTED' && (
                          <span className="text-[10px] text-gray-400">
                            {t('ap.adminPrefix', { state: a.adminDecision === 'PENDING' ? t('ap.adminInQueue') : a.adminDecision.toLowerCase() })}
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
