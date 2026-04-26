import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'My Scores' }

export default async function StudentScoresPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'STUDENT') redirect('/auth/sign-in')

  const responses = await prisma.response.findMany({
    where: { userId: payload.sub, questionId: null, score: { not: null } },
    include: { assignment: { select: { title: true, type: true, weekNumber: true } } },
    orderBy: { submittedAt: 'desc' },
  })

  const rows = responses.map(r => ({
    id: r.id,
    title: r.assignment.title,
    type: r.assignment.type,
    week: r.assignment.weekNumber,
    score: r.score as number,
    submittedAt: r.submittedAt.toISOString(),
  }))

  return (
    <DashboardShell role="STUDENT" pageTitle="My Scores">
      <Table
        keyField="id"
        data={rows}
        emptyMessage="No scores yet."
        columns={[
          { key: 'title', header: 'Assignment', render: r => <span className="font-medium">{r.title}</span> },
          { key: 'week', header: 'Week', render: r => <span>Week {r.week}</span> },
          { key: 'type', header: 'Type', render: r => <span className="text-xs text-gray-500">{r.type.replace(/_/g, ' ')}</span> },
          {
            key: 'score', header: 'Score',
            render: r => <Badge variant={r.score >= 80 ? 'green' : r.score >= 60 ? 'amber' : 'red'}>{r.score}%</Badge>,
          },
          { key: 'submittedAt', header: 'Date', render: r => <span className="text-xs text-gray-500">{format(new Date(r.submittedAt), 'MMM d, yyyy')}</span> },
        ]}
      />
    </DashboardShell>
  )
}
