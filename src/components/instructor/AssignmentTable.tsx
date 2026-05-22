'use client'
import Link from 'next/link'
import { format } from 'date-fns'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DeleteAssignmentButton } from './DeleteAssignmentButton'

interface Assignment {
  id: string
  title: string
  type: string
  weekNumber: number
  dueDate: Date | string
  isPublished: boolean
  course: { name: string }
  _count: { questions: number }
}

const typeLabel: Record<string, string> = {
  VOCABULARY_QUIZ: 'Vocabulary', MORPHOLOGY_QUIZ: 'Morphology', TRANSLATION_EXERCISE: 'Translation',
}
const typeVariant: Record<string, 'blue' | 'purple' | 'green'> = {
  VOCABULARY_QUIZ: 'blue', MORPHOLOGY_QUIZ: 'purple', TRANSLATION_EXERCISE: 'green',
}

export function AssignmentTable({ assignments }: { assignments: Assignment[] }) {
  return (
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
          key: 'status', header: 'Status',
          render: a => <Badge variant={a.isPublished ? 'green' : 'gray'}>{a.isPublished ? 'Published' : 'Draft'}</Badge>,
        },
        {
          key: 'actions', header: '',
          render: a => (
            <span className="inline-flex items-center gap-1">
              <Link href={`/instructor/assignments/${a.id}`}>
                <Button size="sm" variant="secondary">Edit</Button>
              </Link>
              <DeleteAssignmentButton assignmentId={a.id} assignmentTitle={a.title} />
            </span>
          ),
        },
      ]}
    />
  )
}
