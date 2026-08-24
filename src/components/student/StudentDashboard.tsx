import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'
import { Card } from '@/components/ui/Card'
import { StudentCourseCard, type StudentCourse } from '@/components/student/StudentCourseCard'

interface StudentDashboardProps {
  studentName: string
  courses: StudentCourse[]
  dueSoonCount: number
}

export function StudentDashboard({ studentName, courses, dueSoonCount }: StudentDashboardProps) {
  // Server component: the translator comes from the cookie, not a hook.
  const t = getServerT()
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t('student.welcome', { name: studentName })}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {dueSoonCount > 0
            ? <span className="text-amber-600 font-medium">{t('student.dueSoon', { count: dueSoonCount, n: dueSoonCount })}</span>
            : t('student.openACourse')}
        </p>
      </div>

      {/* My Courses — each course expands into Assignments / Grade Book / Schedule */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{t('student.myCourses')}</h2>
          <Link href="/student/courses" className="inline-flex items-center whitespace-nowrap rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700">
            {t('student.joinACourse')}
          </Link>
        </div>
        {courses.length === 0 ? (
          <Card><p className="text-sm text-gray-400 italic">{t('student.noCourses')}</p></Card>
        ) : (
          courses.map(c => <StudentCourseCard key={c.id} course={c} studentName={studentName} />)
        )}
      </div>
    </div>
  )
}
