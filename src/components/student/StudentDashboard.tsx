import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { StudentCourseCard, type StudentCourse } from '@/components/student/StudentCourseCard'

interface StudentDashboardProps {
  studentName: string
  courses: StudentCourse[]
  dueSoonCount: number
}

export function StudentDashboard({ studentName, courses, dueSoonCount }: StudentDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Welcome back, {studentName}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {dueSoonCount > 0
            ? <span className="text-amber-600 font-medium">{dueSoonCount} assignment{dueSoonCount > 1 ? 's' : ''} due soon — keep going!</span>
            : 'Open a course to see its assignments, grades, and schedule.'}
        </p>
      </div>

      {/* My Courses — each course expands into Assignments / Grade Book / Schedule */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">My Courses</h2>
          <Link href="/student/courses" className="text-xs text-brand-600 hover:underline whitespace-nowrap">
            + Join a course
          </Link>
        </div>
        {courses.length === 0 ? (
          <Card><p className="text-sm text-gray-400 italic">You&rsquo;re not enrolled in any courses yet.</p></Card>
        ) : (
          courses.map(c => <StudentCourseCard key={c.id} course={c} studentName={studentName} />)
        )}
      </div>
    </div>
  )
}
