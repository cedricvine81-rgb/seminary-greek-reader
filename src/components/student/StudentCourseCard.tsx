import Link from 'next/link'
import { Card, CardTitle } from '@/components/ui/Card'
import { ChevronDown, AtSign } from 'lucide-react'
import { differenceInCalendarDays } from 'date-fns'
import { MessageInstructorButton } from '@/components/student/MessageInstructorButton'
import { StudentGradebook, type GradebookRow } from '@/components/student/StudentGradebook'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'

export interface StudentCourse {
  id: string
  name: string
  instructorName: string
  instructorEmail: string
  assignments: { id: string; title: string; type: string; dueDate: string; weekNumber: number; completed: boolean }[]
  gradebookRows: GradebookRow[]
}

const TYPE_LABELS: Record<string, string> = {
  VOCABULARY_QUIZ: 'Vocab', MORPHOLOGY_QUIZ: 'Morphology',
  TRANSLATION_EXERCISE: 'Translation', PASSAGE_VOCABULARY: 'Passage',
}

function DueLabel({ dueDate }: { dueDate: string }) {
  const days = differenceInCalendarDays(new Date(dueDate), new Date())
  if (days < 0) return <span className="text-xs text-gray-400">Due {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
  if (days === 0) return <span className="text-xs text-red-500 font-semibold">Due today</span>
  if (days === 1) return <span className="text-xs text-amber-600 font-medium">Due tomorrow</span>
  if (days <= 3) return <span className="text-xs text-amber-500 font-medium">Due in {days} days</span>
  return <span className="text-xs text-gray-400">Due {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
}

export function StudentCourseCard({ course, studentName }: { course: StudentCourse; studentName: string }) {
  const sortedAssignments = [...course.assignments].sort((a, b) => a.weekNumber - b.weekNumber)

  return (
    <Card className="space-y-3">
      {/* Course header + contact actions */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900">{course.name}</h3>
          <p className="text-xs text-gray-500">{course.instructorName}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <MessageInstructorButton courseId={course.id} courseName={course.name} instructorName={course.instructorName} />
          {course.instructorEmail && (
            <a
              href={`mailto:${encodeURIComponent(course.instructorEmail)}?subject=${encodeURIComponent(`[${course.name}] `)}`}
              className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
              title={`Email ${course.instructorName} via your mail program`}
            >
              <AtSign size={14} /> Email
            </a>
          )}
        </div>
      </div>

      {/* ── Assignments ── */}
      <details open className="border-t border-gray-100 pt-3">
        <summary className="flex items-center justify-between cursor-pointer list-none">
          <CardTitle className="mb-0">
            Assignments <span className="ml-1 text-sm font-normal text-gray-400">({sortedAssignments.length})</span>
          </CardTitle>
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        </summary>
        <div className="mt-3">
          {sortedAssignments.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No assignments yet.</p>
          ) : (
            <div className="space-y-1.5">
              {sortedAssignments.map(a => (
                <Link
                  key={a.id}
                  href={`/student/assignments/${a.id}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors gap-3 ${a.completed ? 'opacity-60' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      <span className="text-gray-400 mr-1.5 text-xs">Wk {a.weekNumber}</span>{a.title}
                    </p>
                    <DueLabel dueDate={a.dueDate} />
                  </div>
                  <span className="shrink-0 text-xs text-gray-500">{TYPE_LABELS[a.type] ?? a.type}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </details>

      {/* ── Grade Book ── */}
      <details className="border-t border-gray-100 pt-3">
        <summary className="flex items-center justify-between cursor-pointer list-none">
          <CardTitle className="mb-0">Grade Book</CardTitle>
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        </summary>
        <div className="mt-3">
          {course.gradebookRows.length > 0
            ? <StudentGradebook studentName={studentName} rows={course.gradebookRows} />
            : <p className="text-sm text-gray-400 italic">No grades yet.</p>}
        </div>
      </details>

      {/* ── Schedule ── */}
      {sortedAssignments.length > 0 && (
        <details className="border-t border-gray-100 pt-3">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <CardTitle className="mb-0">Schedule</CardTitle>
            <ChevronDown size={16} className="text-gray-400 shrink-0" />
          </summary>
          <div className="mt-3">
            <CalendarGrid
              events={sortedAssignments.map(a => ({
                id: a.id,
                title: a.title,
                type: a.type,
                dueDate: a.dueDate,
                href: `/student/assignments/${a.id}`,
                isCompleted: a.completed,
              }))}
              initialDate={sortedAssignments[0]?.dueDate}
            />
          </div>
        </details>
      )}
    </Card>
  )
}
