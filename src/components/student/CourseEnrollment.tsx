'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Building2 } from 'lucide-react'
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
  sectionTitle: string
  sectionDescription: string
  buttonLabel: string
  showInstitution?: boolean
  isPreview?: boolean
}

export function CourseEnrollment({
  initialCourses,
  sectionTitle,
  sectionDescription,
  buttonLabel,
  showInstitution = false,
  isPreview = false,
}: Props) {
  const router = useRouter()
  const [courses, setCourses] = useState(initialCourses)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sync with server-rendered prop whenever the list changes (e.g. after router.refresh()
  // adds newly created courses or removes ones the student just enrolled in).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setCourses(initialCourses) }, [JSON.stringify(initialCourses)])

  async function request(courseId: string) {
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
        <h2 className="text-base font-semibold text-gray-900">{sectionTitle}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{sectionDescription}</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(course => {
          const instructorName = [course.instructor.title, course.instructor.firstName, course.instructor.surname]
            .filter(Boolean).join(' ')
          const start = new Date(course.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          const end = new Date(course.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

          return (
            <Card key={course.id} className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 leading-snug">{course.name}</h3>
                {course.listing && (
                  <p className="text-xs text-gray-400 mt-0.5">{course.listing}</p>
                )}
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                <p className="flex items-center gap-1.5">
                  <BookOpen size={12} className="shrink-0" />
                  {instructorName}
                </p>
                {showInstitution && course.institution && (
                  <p className="flex items-center gap-1.5">
                    <Building2 size={12} className="shrink-0" />
                    {course.institution.name}
                  </p>
                )}
                <p>{start} – {end} · {course._count.assignments} assignments · {course._count.enrollments} students</p>
              </div>

              {errors[course.id] && (
                <p className="text-xs text-red-600">{errors[course.id]}</p>
              )}

              {isPreview ? (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                  Enrollment disabled in preview mode
                </p>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => request(course.id)}
                  loading={requesting === course.id}
                  className="w-full"
                >
                  {buttonLabel}
                </Button>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
