import Link from 'next/link'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ClipboardList, FlipHorizontal, TrendingUp, BookOpen } from 'lucide-react'
import type { Assignment } from '@/types/assignment'

interface StudentDashboardProps {
  studentName: string
  pendingAssignments: Assignment[]
  stats: {
    enrolledCourses: number
    pendingAssignments: number
    completedAssignments: number
    averageScore: number | null
  }
}

export function StudentDashboard({ studentName, pendingAssignments, stats }: StudentDashboardProps) {
  const statCards = [
    { label: 'Enrolled courses', value: stats.enrolledCourses, icon: <BookOpen size={20} />, color: 'text-blue-600 bg-blue-50', href: '/student/courses' },
    { label: 'Pending', value: stats.pendingAssignments, icon: <ClipboardList size={20} />, color: 'text-amber-600 bg-amber-50', href: '/student/assignments' },
    { label: 'Completed', value: stats.completedAssignments, icon: <TrendingUp size={20} />, color: 'text-green-600 bg-green-50', href: '/student/progress' },
    { label: 'Avg. score', value: stats.averageScore !== null ? `${stats.averageScore}%` : '—', icon: <FlipHorizontal size={20} />, color: 'text-purple-600 bg-purple-50', href: '/student/scores' },
  ]

  const assignmentTypeLabel: Record<string, string> = {
    VOCABULARY_QUIZ: 'Vocabulary',
    MORPHOLOGY_QUIZ: 'Morphology',
    TRANSLATION_EXERCISE: 'Translation',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Welcome back, {studentName}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Keep up your Greek studies.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Link key={s.label} href={s.href}>
            <Card hover className="flex items-center gap-3 p-5">
              <div className={`p-2.5 rounded-lg ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link href="/student/flashcards" className="btn-primary flex items-center justify-center gap-2 py-3 text-sm">
          <FlipHorizontal size={16} /> Study Flashcards
        </Link>
        <Link href="/student/assignments" className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm">
          <ClipboardList size={16} /> My Assignments
        </Link>
        <Link href="/reader" className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm">
          <BookOpen size={16} /> Open Reader
        </Link>
      </div>

      {/* Upcoming assignments */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Upcoming Assignments</CardTitle>
          <Link href="/student/assignments" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>
        {pendingAssignments.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No pending assignments.</p>
        ) : (
          <div className="space-y-2">
            {pendingAssignments.slice(0, 5).map(a => (
              <Link
                key={a.id}
                href={`/student/assignments/${a.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500">Due {new Date(a.dueDate).toLocaleDateString()}</p>
                </div>
                <Badge variant="amber">{assignmentTypeLabel[a.type] ?? a.type}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
