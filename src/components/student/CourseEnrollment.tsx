'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'

interface AvailableCourse {
  id: string
  name: string
  listing: string | null
  level: string
  startDate: string | Date
  endDate: string | Date
  instructor: { firstName: string; surname: string; title: string | null }
  institution: { name: string } | null
  _count: { enrollments: number; assignments: number }
}

interface Props {
  initialCourses: AvailableCourse[]
  institutionName: string | null
}

export function CourseEnrollment({ initialCourses, institutionName }: Props) {
  const router = useRouter()
  const [courses, setCourses] = useState(initialCourses)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function requestEnroll(courseId: string) {
    setRequesting(courseId)
    setErrors(prev => ({ ...prev, [courseId]: '' }))
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrors(prev => ({ ...prev, [courseId]: data.error ?? 'Failed to submit request' }))
        return
      }
      setCourses(prev => prev.filter(c => c.id !== courseId))
      router.refresh()
    } finally {
      setRequesting(null)
    }
  }

  if (courses.length === 0) return null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Available Courses</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {institutionName
            ? <>Courses at <span className="font-medium">{institutionName}</span>. Your instructor will approve your request.</>
            : 'Browse available courses. Your instructor will approve your request.'}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(course => {
          const instructorName = [course.instructor.title, course.instructor.firstName, course.instructor.surname]
            .filter(Boolean).join(' ')
          const start = new Date(course.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          const end = new Date(course.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

          return (
            <Card key={course.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 leading-snug">{course.name}</h3>
                  {course.listing && (
                    <p className="text-xs text-gray-400 mt-0.5">{course.listing}</p>
                  )}
                </div>
                <Badge variant={COURSE_LEVEL_VARIANTS[course.level] ?? 'gray'} className="shrink-0">
                  {COURSE_LEVEL_LABELS[course.level] ?? course.level}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                <p className="flex items-center gap-1.5">
                  <BookOpen size={12} className="shrink-0" />
                  {instructorName}
                </p>
                {course.institution && (
                  <p>{course.institution.name}</p>
                )}
                <p>{start} – {end} · {course._count.assignments} assignments · {course._count.enrollments} students</p>
              </div>

              {errors[course.id] && (
                <p className="text-xs text-red-600">{errors[course.id]}</p>
              )}

              <Button
                size="sm"
                variant="secondary"
                onClick={() => requestEnroll(course.id)}
                loading={requesting === course.id}
                className="w-full"
              >
                Request to Join
              </Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
