import Link from 'next/link'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Course } from '@/types/course'
import { format } from 'date-fns'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'

interface CourseTableProps {
  courses: Course[]
}

export function CourseTable({ courses }: CourseTableProps) {
  return (
    <Table
      keyField="id"
      data={courses}
      emptyMessage="No courses yet. Create your first course."
      columns={[
        {
          key: 'name', header: 'Course',
          render: c => (
            <Link href={`/instructor/courses/${c.id}`} className="hover:underline">
              <span className="font-medium text-brand-700">{c.name}</span>
              {c.listing && (
                <span className="block text-xs text-gray-400 font-normal">{c.listing}</span>
              )}
            </Link>
          ),
        },
        {
          key: 'institution', header: 'Institution',
          render: c => (
            <span className="text-xs text-gray-500">{c.institutionName ?? '—'}</span>
          ),
        },
        {
          key: 'level', header: 'Level',
          render: c => (
            <Badge variant={COURSE_LEVEL_VARIANTS[c.level] ?? 'gray'}>
              {COURSE_LEVEL_LABELS[c.level] ?? c.level}
            </Badge>
          ),
        },
        {
          key: 'enrollmentCount', header: 'Students',
          render: c => <span>{c.enrollmentCount ?? 0}</span>,
        },
        {
          key: 'startDate', header: 'Dates',
          render: c => (
            <span className="text-gray-500 text-xs">
              {format(new Date(c.startDate), 'MMM d, yyyy')} – {format(new Date(c.endDate), 'MMM d, yyyy')}
            </span>
          ),
        },
        {
          key: 'actions', header: '',
          render: c => (
            <div className="flex gap-2 justify-end">
              <Link href={`/instructor/courses/${c.id}`}>
                <Button size="sm" variant="secondary">Manage</Button>
              </Link>
            </div>
          ),
        },
      ]}
    />
  )
}
