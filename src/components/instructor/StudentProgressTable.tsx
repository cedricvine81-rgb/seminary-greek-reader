import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'

interface StudentRow {
  userId: string
  name: string
  email: string
  completedAssignments: number
  totalAssignments: number
  averageScore: number | null
}

interface StudentProgressTableProps {
  students: StudentRow[]
}

export function StudentProgressTable({ students }: StudentProgressTableProps) {
  return (
    <Table
      keyField="userId"
      data={students}
      emptyMessage="No students enrolled."
      columns={[
        { key: 'name', header: 'Name', render: s => <span className="font-medium">{s.name}</span> },
        { key: 'email', header: 'Email', render: s => <span className="text-gray-500 text-xs">{s.email}</span> },
        {
          key: 'completedAssignments', header: 'Progress',
          render: s => (
            <span className="text-sm">{s.completedAssignments}/{s.totalAssignments}</span>
          ),
        },
        {
          key: 'averageScore', header: 'Avg. Score',
          render: s => {
            if (s.averageScore === null) return <span className="text-gray-400 text-xs">—</span>
            const v = s.averageScore as BadgeVariantScore
            const variant = v >= 80 ? 'green' : v >= 60 ? 'amber' : 'red'
            return <Badge variant={variant}>{s.averageScore}%</Badge>
          },
        },
      ]}
    />
  )
}

type BadgeVariantScore = number
