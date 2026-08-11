'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { useT } from '@/lib/i18n/LocaleProvider'

interface PendingEnrollment {
  courseId: string
  course: {
    name: string
    instructor: { title: string | null; firstName: string; surname: string }
  }
}

interface Props {
  pending: PendingEnrollment[]
}

export function PendingEnrollments({ pending }: Props) {
  const router = useRouter()
  const t = useT()
  // Keep a stable ref so the interval closure always sees the latest list
  const pendingRef = useRef(pending)
  useEffect(() => { pendingRef.current = pending }, [pending])

  // Poll every 10 seconds; if any pending enrollment is no longer PENDING, refresh
  useEffect(() => {
    if (pending.length === 0) return

    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/enrollments/mine')
        if (!res.ok) return
        const { enrollments } = await res.json()

        const changed = pendingRef.current.some(p => {
          const live = enrollments.find((e: { courseId: string; status: string }) => e.courseId === p.courseId)
          return !live || live.status !== 'PENDING'
        })

        if (changed) router.refresh()
      } catch {
        // silently ignore
      }
    }, 10_000)

    return () => clearInterval(id)
  }, [pending.length > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  if (pending.length === 0) return null

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">{t('courses.pendingRequests')}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pending.map(e => {
          const instructorName = [
            e.course.instructor.title,
            e.course.instructor.firstName,
            e.course.instructor.surname,
          ].filter(Boolean).join(' ')
          return (
            <Card key={e.courseId} className="space-y-2 border-amber-200 bg-amber-50">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{e.course.name}</h3>
              </div>
              <p className="text-xs text-gray-500">{instructorName}</p>
              <p className="text-xs text-amber-700">{t('courses.awaitingApproval')}</p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
