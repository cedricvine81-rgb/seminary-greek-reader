import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import type { Assignment } from '@/types/assignment'
import { format } from 'date-fns'

interface AssignmentListProps {
  assignments: Assignment[]
  completedIds?: Set<string>
}

const typeColors: Record<string, 'blue' | 'purple' | 'green'> = {
  VOCABULARY_QUIZ: 'blue',
  MORPHOLOGY_QUIZ: 'purple',
  TRANSLATION_EXERCISE: 'green',
}

const typeLabels: Record<string, string> = {
  VOCABULARY_QUIZ: 'Vocabulary',
  MORPHOLOGY_QUIZ: 'Morphology',
  TRANSLATION_EXERCISE: 'Translation',
}

export function AssignmentList({ assignments, completedIds = new Set() }: AssignmentListProps) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <p className="text-sm text-gray-400">No assignments yet.</p>
        <p className="text-sm text-gray-400">
          Your instructor hasn't published any assignments.{' '}
          <Link href="/student/courses" className="text-brand-600 hover:underline">Check your courses →</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {assignments.map(a => {
        const done = completedIds.has(a.id)
        const overdue = !done && new Date(a.dueDate) < new Date()
        return (
          <Link
            key={a.id}
            href={`/student/assignments/${a.id}`}
            className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-gray-900">{a.title}</p>
              <p className="text-xs text-gray-500">Week {a.weekNumber} · Due {format(new Date(a.dueDate), 'MMM d, yyyy')}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={typeColors[a.type] ?? 'gray'}>{typeLabels[a.type] ?? a.type}</Badge>
              {done ? (
                <Badge variant="green">Done</Badge>
              ) : overdue ? (
                <Badge variant="red">Overdue</Badge>
              ) : (
                <Badge variant="amber">Pending</Badge>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
