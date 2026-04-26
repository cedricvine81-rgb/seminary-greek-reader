import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'Assignments' }

export default async function InstructorAssignmentsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const assignments = await prisma.assignment.findMany({
    where: { createdById: payload.sub },
    include: { course: { select: { name: true } }, _count: { select: { questions: true } } },
    orderBy: [{ weekNumber: 'asc' }, { dueDate: 'asc' }],
  })

  const typeLabel: Record<string, string> = {
    VOCABULARY_QUIZ: 'Vocabulary', MORPHOLOGY_QUIZ: 'Morphology', TRANSLATION_EXERCISE: 'Translation',
  }
  const typeVariant: Record<string, 'blue' | 'purple' | 'green'> = {
    VOCABULARY_QUIZ: 'blue', MORPHOLOGY_QUIZ: 'purple', TRANSLATION_EXERCISE: 'green',
  }

  return (
    <DashboardShell
      role="INSTRUCTOR"
      pageTitle="Assignments"
      actions={<Link href="/instructor/assignments/new"><Button size="sm"><Plus size={14} /> New Assignment</Button></Link>}
    >
      <Table
        keyField="id"
        data={assignments}
        emptyMessage="No assignments yet."
        columns={[
          { key: 'title', header: 'Title', render: a => <span className="font-medium">{a.title}</span> },
          { key: 'course', header: 'Course', render: a => <span className="text-xs text-gray-500">{a.course.name}</span> },
          { key: 'type', header: 'Type', render: a => <Badge variant={typeVariant[a.type] ?? 'gray'}>{typeLabel[a.type] ?? a.type}</Badge> },
          { key: 'week', header: 'Week', render: a => <span>Week {a.weekNumber}</span> },
          { key: 'dueDate', header: 'Due', render: a => <span className="text-xs text-gray-500">{format(new Date(a.dueDate), 'MMM d, yyyy')}</span> },
          { key: 'questions', header: 'Q', render: a => <span>{a._count.questions}</span> },
          {
            key: 'actions', header: '',
            render: a => (
              <Link href={`/instructor/assignments/${a.id}`}>
                <Button size="sm" variant="secondary">Edit</Button>
              </Link>
            ),
          },
        ]}
      />
    </DashboardShell>
  )
}
