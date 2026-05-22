import Link from 'next/link'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BookOpen, Users, ClipboardList, BarChart2, Plus, FileText } from 'lucide-react'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'

interface DashboardStats {
  totalCourses: number
  totalStudents: number
  totalAssignments: number
  pendingGrades: number
}

interface RecentCourse {
  id: string
  name: string
  level: string
  enrollmentCount: number
}

interface InstructorDashboardProps {
  stats: DashboardStats
  recentCourses: RecentCourse[]
  instructorName: string
}

export function InstructorDashboard({ stats, recentCourses, instructorName }: InstructorDashboardProps) {
  const statCards = [
    { label: 'Courses', value: stats.totalCourses, icon: <BookOpen size={20} />, color: 'text-blue-600 bg-blue-50', href: '/instructor/courses' },
    { label: 'Students', value: stats.totalStudents, icon: <Users size={20} />, color: 'text-green-600 bg-green-50', href: '/instructor/students' },
    { label: 'Assignments', value: stats.totalAssignments, icon: <ClipboardList size={20} />, color: 'text-purple-600 bg-purple-50', href: '/instructor/assignments' },
    { label: 'Pending grades', value: stats.pendingGrades, icon: <BarChart2 size={20} />, color: 'text-amber-600 bg-amber-50', href: '/instructor/reports' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Welcome back, {instructorName}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Here's an overview of your courses and student activity.</p>
      </div>

      {/* Stats */}
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

      {/* Quick actions */}
      <Card>
        <CardTitle>Quick Actions</CardTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {[
            { href: '/instructor/courses/new', label: 'New Course', icon: <Plus size={16} />, color: 'btn-primary' },
            { href: '/instructor/assignments/new', label: 'New Assignment', icon: <ClipboardList size={16} />, color: 'btn-secondary' },
            { href: '/instructor/materials/new', label: 'Upload Material', icon: <FileText size={16} />, color: 'btn-secondary' },
            { href: '/instructor/students', label: 'Invite Students', icon: <Users size={16} />, color: 'btn-secondary' },
          ].map(a => (
            <Link key={a.href} href={a.href} className={`${a.color} flex items-center justify-center gap-2 py-2 text-sm`}>
              {a.icon} {a.label}
            </Link>
          ))}
        </div>
      </Card>

      {/* Recent courses */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Recent Courses</CardTitle>
          <Link href="/instructor/courses" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>
        {recentCourses.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No courses yet. Create your first course.</p>
        ) : (
          <div className="space-y-2">
            {recentCourses.map(c => (
              <Link key={c.id} href={`/instructor/courses/${c.id}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.enrollmentCount} student{c.enrollmentCount !== 1 ? 's' : ''}</p>
                </div>
                <Badge variant={COURSE_LEVEL_VARIANTS[c.level] ?? 'gray'}>
                  {COURSE_LEVEL_LABELS[c.level] ?? c.level}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
