import { Card, CardTitle } from '@/components/ui/Card'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { formatDate } from '@/lib/i18n/format'
import type { ProgressStats } from '@/types/quiz'

interface ProgressSummaryProps {
  stats: ProgressStats
}

export function ProgressSummary({ stats }: ProgressSummaryProps) {
  const t = getServerT()
  const locale = getServerLocale()
  return (
    <div className="space-y-6">
      {/* Overall */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'student.totalAssignments', value: stats.totalAssignments },
          { key: 'student.completed', value: stats.completedAssignments },
          { key: 'student.averageScore', value: `${Math.round(stats.averageScore)}%` },
          { key: 'student.completionRate', value: `${stats.totalAssignments > 0 ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100) : 0}%` },
        ].map(s => (
          <Card key={s.key} className="text-center">
            <p className="text-3xl font-bold text-brand-700">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{t(s.key)}</p>
          </Card>
        ))}
      </div>

      {/* Accuracy by type */}
      <Card>
        <CardTitle>{t('student.accuracyByCategory')}</CardTitle>
        <div className="mt-3 space-y-3">
          {Object.entries(stats.accuracyByType).map(([type, pct]) => (
            <div key={type}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{t(`assign.typePlural.${type}`)}</span>
                <span className="font-medium text-gray-900">{Math.round(pct)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardTitle>{t('student.recentActivity')}</CardTitle>
        <div className="mt-3 space-y-2">
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 italic">{t('student.noActivity')}</p>
          ) : (
            stats.recentActivity.map(item => (
              <div key={item.assignmentId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.assignmentTitle}</p>
                  <p className="text-xs text-gray-500">{formatDate(item.completedAt, locale)}</p>
                </div>
                <span className="text-sm font-semibold text-brand-700">{item.percentage}%</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
