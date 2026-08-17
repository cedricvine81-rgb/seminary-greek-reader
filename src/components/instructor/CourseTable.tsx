'use client'

// Load-bearing directive: this component calls useT, and /instructor/courses (a server
// page) renders it directly — without 'use client' the hook import is a client-reference
// proxy and the whole page crashes at render in the production build.

import Link from 'next/link'
import { useT } from '@/lib/i18n/LocaleProvider'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Course } from '@/types/course'
import { format } from 'date-fns'
import { COURSE_LEVEL_VARIANTS } from '@/lib/constants'

interface CourseTableProps {
  courses: Course[]
}

export function CourseTable({ courses }: CourseTableProps) {
  const t = useT()
  return (
    <Table
      keyField="id"
      data={courses}
      emptyMessage="No courses yet. Create your first course."
      columns={[
        {
          key: 'name', header: t('inst.col.course'),
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
          key: 'institution', header: t('inst.col.institution'),
          render: c => (
            <span className="text-xs text-gray-500">{c.institutionName ?? '—'}</span>
          ),
        },
        {
          key: 'level', header: t('inst.col.level'),
          render: c => (
            <Badge variant={COURSE_LEVEL_VARIANTS[c.level] ?? 'gray'}>
              {t(`course.level.${c.level}`)}
            </Badge>
          ),
        },
        {
          key: 'enrollmentCount', header: t('inst.col.students'),
          render: c => <span>{c.enrollmentCount ?? 0}</span>,
        },
        {
          key: 'startDate', header: t('inst.col.dates'),
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
                <Button size="sm" variant="secondary">{t('inst.manage')}</Button>
              </Link>
            </div>
          ),
        },
      ]}
    />
  )
}
