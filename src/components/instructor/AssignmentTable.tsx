'use client'
import Link from 'next/link'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DeleteAssignmentButton } from './DeleteAssignmentButton'

interface Assignment {
  id: string
  title: string
  type: string
  weekNumber: number
  dueDate: Date | string
  instructions: string | null
  isPublished: boolean
  course: { name: string; id: string }
  _count: { questions: number }
}

interface Stats {
  submitted: number
  enrolled: number
  avgPct: number | null
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const typeLabel: Record<string, string> = {
  VOCABULARY_QUIZ: 'Vocab', MORPHOLOGY_QUIZ: 'Morph', TRANSLATION_EXERCISE: 'Trans',
}
const typeVariant: Record<string, 'blue' | 'purple' | 'green'> = {
  VOCABULARY_QUIZ: 'blue', MORPHOLOGY_QUIZ: 'purple', TRANSLATION_EXERCISE: 'green',
}

function extractSection(instructions: string | null): string | null {
  if (!instructions) return null
  const match = instructions.match(/Section\s+([\w\-:]+)/i)
  if (!match) return null
  return 'Section ' + match[1].replace('-', ':')
}

function ScorePct({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-gray-300 text-xs">—</span>
  const colour = pct >= 90 ? 'text-green-700' : pct >= 70 ? 'text-amber-600' : 'text-red-600'
  return <span className={`font-semibold text-sm ${colour}`}>{pct}%</span>
}

export function AssignmentTable({
  assignments,
  statsMap,
}: {
  assignments: Assignment[]
  statsMap: Record<string, Stats>
}) {
  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 px-6 py-10 text-center text-sm text-gray-400">
        No assignments yet.
      </div>
    )
  }

  // Group by course for cleaner display when instructor has multiple courses
  const courses = [...new Map(assignments.map(a => [a.course.id, a.course.name])).entries()]
  const grouped = courses.length > 1

  return (
    <div className="space-y-6">
      {courses.map(([courseId, courseName]) => {
        const rows = assignments.filter(a => a.course.id === courseId)
        return (
          <div key={courseId} className="overflow-x-auto rounded-xl border border-gray-100">
            {grouped && (
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {courseName}
              </div>
            )}
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Wk</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Day</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600">Quiz</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Type</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-600 text-center whitespace-nowrap">Submitted</th>
                  <th className="px-3 py-3 text-xs font-semibold text-brand-700 text-center whitespace-nowrap bg-brand-50">Avg Score</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(a => {
                  const due = new Date(a.dueDate)
                  const stats = statsMap[a.id]
                  const section = extractSection(a.instructions)
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700 font-medium">{a.weekNumber}</td>
                      <td className="px-3 py-3 text-gray-500 text-xs">{DAYS[due.getDay()]}</td>
                      <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{format(due, 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <Link href={`/instructor/assignments/${a.id}`} className="hover:text-brand-700">
                          {section && (
                            <span className="block text-xs font-semibold text-brand-600 mb-0.5">{section}</span>
                          )}
                          <span className="font-medium text-gray-800 line-clamp-1">{a.title}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={typeVariant[a.type] ?? 'gray'}>{typeLabel[a.type] ?? a.type}</Badge>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {stats ? (
                          <span className="text-xs text-gray-600">
                            <span className="font-semibold text-gray-800">{stats.submitted}</span>
                            <span className="text-gray-400"> / {stats.enrolled}</span>
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3 text-center bg-brand-50/30">
                        <ScorePct pct={stats?.avgPct ?? null} />
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={a.isPublished ? 'green' : 'gray'}>
                          {a.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1">
                          <Link href={`/instructor/assignments/${a.id}`}>
                            <Button size="sm" variant="secondary">Edit</Button>
                          </Link>
                          <DeleteAssignmentButton assignmentId={a.id} assignmentTitle={a.title} />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
