import { Card, CardTitle } from '@/components/ui/Card'

interface GradeSummaryCardProps {
  totalStudents: number
  averageScore: number | null
  completionRate: number
  highestScore: number | null
  lowestScore: number | null
}

export function GradeSummaryCard({
  totalStudents, averageScore, completionRate, highestScore, lowestScore,
}: GradeSummaryCardProps) {
  return (
    <Card>
      <CardTitle>Grade Summary</CardTitle>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        {[
          { label: 'Students', value: totalStudents },
          { label: 'Avg. Score', value: averageScore !== null ? `${averageScore}%` : '—' },
          { label: 'Completion Rate', value: `${completionRate}%` },
          { label: 'Highest', value: highestScore !== null ? `${highestScore}%` : '—' },
          { label: 'Lowest', value: lowestScore !== null ? `${lowestScore}%` : '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="text-xl font-bold text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
