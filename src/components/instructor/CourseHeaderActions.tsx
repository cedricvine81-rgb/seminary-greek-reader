'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArchiveCourseButton } from './ArchiveCourseButton'
import { Users } from 'lucide-react'

interface CourseHeaderActionsProps {
  courseId: string
  courseName: string
  studentCount: number
  isArchived: boolean
}

/** Wraps course name link + action buttons in a client component so
 *  onClick stopPropagation (needed inside <summary>) is legal. */
export function CourseHeaderActions({
  courseId, courseName, studentCount, isArchived,
}: CourseHeaderActionsProps) {
  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <>
      <Link
        href={`/instructor/courses/${courseId}`}
        className="text-xl font-bold text-gray-900 hover:text-brand-700"
        onClick={stop}
      >
        {courseName}
      </Link>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto" onClick={stop}>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users size={14} />
          <span>{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
        </div>
        <Link href={`/instructor/courses/${courseId}`}>
          <Button size="sm" variant="secondary">Manage Course</Button>
        </Link>
        <ArchiveCourseButton courseId={courseId} isArchived={isArchived} />
      </div>
    </>
  )
}
