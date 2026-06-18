import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import type { Assignment } from '@/types/assignment'
import { format } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import { LocalDeadline } from './LocalDeadline'

interface AssignmentListProps {
  assignments: Assignment[]
  completedIds?: Set<string>
}

const typeColors: Record<string, 'blue' | 'purple' | 'green'> = {
  VOCABULARY_QUIZ: 'blue',
  PASSAGE_VOCABULARY: 'blue',
  MORPHOLOGY_QUIZ: 'purple',
  TRANSLATION_EXERCISE: 'green',
  TRANSLATION_EXAM: 'green',
}

const typeLabels: Record<string, string> = {
  VOCABULARY_QUIZ: 'Vocabulary',
  PASSAGE_VOCABULARY: 'Passage Vocab',
  MORPHOLOGY_QUIZ: 'Morphology',
  TRANSLATION_EXERCISE: 'Translation',
  TRANSLATION_EXAM: 'Translation Exam',
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
        // Two-round passage exercises run until the Round 2 deadline, so judge
        // "overdue"/"due" by that, not their dueDate (the Round 1 cut-off).
        const finalDue = a.round2Deadline ?? a.round1Deadline ?? a.dueDate
        const overdue = !done && new Date(finalDue) < new Date()
        return (
          <Link
            key={a.id}
            href={`/student/assignments/${a.id}`}
            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-brand-200 hover:shadow-sm transition-all group"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={typeColors[a.type] ?? 'gray'}>{typeLabels[a.type] ?? a.type}</Badge>
                <span className="text-xs text-gray-400">Week {a.weekNumber} · Due {format(new Date(finalDue), 'MMM d, yyyy')}</span>
              </div>
              {(a.round1Deadline || a.round2Deadline) && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {a.round1Deadline && <LocalDeadline label="Round 1 closes" iso={a.round1Deadline} />}
                  {a.round2Deadline && <LocalDeadline label="Round 2 closes" iso={a.round2Deadline} />}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {done ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  Done
                </span>
              ) : overdue ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white">
                  Overdue — Submit
                  <ChevronRight size={13} />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-700 text-white group-hover:bg-brand-800 transition-colors">
                  Start
                  <ChevronRight size={13} />
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
