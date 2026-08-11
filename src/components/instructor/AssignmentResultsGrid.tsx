'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { ExternalLink, Trash2 } from 'lucide-react'
import { useApi } from '@/lib/api-client'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { formatDate } from '@/lib/i18n/format'

interface StudentResult {
  userId: string
  name: string
  email: string
  attempted: boolean
  // Quiz fields
  earned: number | null
  totalPoints: number | null
  pct: number | null
  // Translation Exercise fields
  sessionId: string | null
  submittedAt: string | null
  grade: number | null
  gradeNote: string | null
}

interface ResultsData {
  rows: StudentResult[]
  totalPoints: number | null
  runningPct: number | null
  overallPct: number | null
  isTranslation: boolean
}

function PctBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-gray-300">—</span>
  const colour =
    pct >= 90 ? 'text-green-700 bg-green-50' :
    pct >= 70 ? 'text-amber-700 bg-amber-50' :
                'text-red-700 bg-red-50'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${colour}`}>
      {pct}%
    </span>
  )
}

export function AssignmentResultsGrid({ assignmentId, autoLoad = false }: { assignmentId: string; autoLoad?: boolean }) {
  // When not auto-loading, fetching is deferred until the user clicks "Load results".
  const [enabled, setEnabled] = useState(autoLoad)

  // SWR handles revalidate-on-focus automatically (replaces the old manual focus listener),
  // so navigating back after grading shows fresh data with no bespoke effect.
  const { data, isLoading, mutate } = useApi<ResultsData>(
    enabled ? `/api/assignments/${assignmentId}/results` : null,
  )

  const loaded = data !== undefined
  const loading = isLoading
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const t = useT()
  const locale = useLocale()

  function refresh() {
    if (!enabled) setEnabled(true)
    else mutate()
  }

  async function deleteSubmission(row: StudentResult) {
    if (!row.sessionId) return
    const ok = window.confirm(
      t('res.deleteConfirm', { name: row.name })
    )
    if (!ok) return
    setDeletingId(row.sessionId)
    try {
      const res = await fetch(
        `/api/assignments/${assignmentId}/results?sessionId=${encodeURIComponent(row.sessionId)}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || t('res.deleteFailed'))
        return
      }
      await mutate()
    } catch {
      alert(t('res.deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  const isTranslation = data?.isTranslation ?? false

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>{t('res.title')}</CardTitle>
        <Button variant="ghost" onClick={refresh} loading={loading} size="sm">
          {t(loaded ? 'res.refresh' : 'res.load')}
        </Button>
      </div>

      {!loaded && !loading && (
        <p className="text-sm text-gray-400 italic">{t('res.clickLoad')}</p>
      )}

      {loaded && data && data.rows.length === 0 && (
        <p className="text-sm text-gray-400 italic">{t('res.noStudents')}</p>
      )}

      {loaded && data && data.rows.length > 0 && (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="flex gap-6 text-sm px-1">
            <div>
              <span className="text-gray-500">{t('res.submitted')}: </span>
              <span className="font-semibold text-gray-800">
                {data.rows.filter(r => r.attempted).length} / {data.rows.length}
              </span>
            </div>
            {data.runningPct !== null && (
              <div>
                <span className="text-gray-500">{t(isTranslation ? 'res.avgGraded' : 'res.runningAvg')}: </span>
                <span className="font-semibold text-brand-700">{data.runningPct}%</span>
              </div>
            )}
            {!isTranslation && data.overallPct !== null && (
              <div>
                <span className="text-gray-500">{t('res.overallAvg')}: </span>
                <span className="font-semibold text-brand-700">{data.overallPct}%</span>
              </div>
            )}
          </div>

          {/* Results table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t('res.colStudent')}</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">{t('res.colStatus')}</th>
                  {isTranslation ? (
                    <>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">{t('res.colSubmitted')}</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-brand-700 bg-brand-50">{t('res.colGrade')}</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">{t('res.colViewWork')}</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">{t('res.colDelete')}</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">{t('res.colScore')}</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-brand-700 bg-brand-50">{t('res.colGrade')}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.rows.map(row => (
                  <tr key={row.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-800">{row.name}</p>
                      <p className="text-xs text-gray-400">{row.email}</p>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.attempted
                        ? <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md">{t('res.statusSubmitted')}</span>
                        : isTranslation && row.sessionId
                          ? <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">{t('res.statusInProgress')}</span>
                          : <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{t('res.statusNotSubmitted')}</span>
                      }
                    </td>
                    {isTranslation ? (
                      <>
                        <td className="px-3 py-2 text-center text-xs text-gray-500">
                          {row.submittedAt ? formatDate(row.submittedAt, locale) : '—'}
                        </td>
                        <td className="px-3 py-2 text-center bg-brand-50/30">
                          <PctBadge pct={row.grade} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.sessionId ? (
                            <Link
                              href={`/instructor/assignments/${assignmentId}/submissions/${row.sessionId}`}
                              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium"
                            >
                              {t('res.view')} <ExternalLink size={11} />
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.sessionId && row.submittedAt ? (
                            <button
                              onClick={() => deleteSubmission(row)}
                              disabled={deletingId === row.sessionId}
                              title={t('res.deleteTitle')}
                              className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                            >
                              <Trash2 size={12} /> {t(deletingId === row.sessionId ? 'res.deleting' : 'res.delete')}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-center text-xs text-gray-600">
                          {row.attempted ? `${row.earned} / ${row.totalPoints}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-center bg-brand-50/30">
                          <PctBadge pct={row.pct} />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-2.5 text-xs font-semibold text-gray-600" colSpan={isTranslation ? 3 : 2}>
                    {t(isTranslation ? 'res.footAvgGraded' : 'res.footClassAvg')}
                  </td>
                  <td className="px-3 py-2 text-center bg-brand-50/30">
                    <PctBadge pct={data.runningPct} />
                  </td>
                  {isTranslation && <td colSpan={2} />}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}
