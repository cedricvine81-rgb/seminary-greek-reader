import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'

interface StudentResult {
  userId: string
  name: string
  email: string
  completedAssignments: number
  totalAssignments: number
  averageScore: number | null
}

export function StudentResultsTable({ students }: { students: StudentResult[] }) {
  return (
    <Table
      keyField="userId"
      data={students}
      emptyMessage="No student data."
      columns={[
        { key: 'name', header: 'Student', render: s => <span className="font-medium">{s.name}</span> },
        { key: 'email', header: 'Email', render: s => <span className="text-xs text-gray-500">{s.email}</span> },
        {
          key: 'progress', header: 'Completed',
          render: s => <span>{s.completedAssignments}/{s.totalAssignments}</span>,
        },
        {
          key: 'averageScore', header: 'Avg. Score',
          render: s => {
            if (s.averageScore === null) return <span className="text-gray-400">—</span>
            const v = s.averageScore
            return <Badge variant={v >= 80 ? 'green' : v >= 60 ? 'amber' : 'red'}>{v}%</Badge>
          },
        },
      ]}
    />
  )
}
