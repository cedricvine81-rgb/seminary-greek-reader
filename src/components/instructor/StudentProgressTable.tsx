import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { getServerT } from '@/lib/i18n/server'

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
  const t = getServerT()
  return (
    <Table
      keyField="userId"
      data={students}
      emptyMessage={t('sp.noStudents')}
      columns={[
        { key: 'name', header: t('sp.name'), render: s => <span className="font-medium">{s.name}</span> },
        { key: 'email', header: t('sp.email'), render: s => <span className="text-gray-500 text-xs">{s.email}</span> },
        {
          key: 'completedAssignments', header: t('sp.progress'),
          render: s => (
            <span className="text-sm">{s.completedAssignments}/{s.totalAssignments}</span>
          ),
        },
        {
          key: 'averageScore', header: t('sp.avgScore'),
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
