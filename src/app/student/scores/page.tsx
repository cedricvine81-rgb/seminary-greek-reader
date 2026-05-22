import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'My Scores' }

function pctBadge(pct: number) {
  const variant = pct >= 90 ? 'green' : pct >= 70 ? 'amber' : 'red'
  return <Badge variant={variant}>{pct}%</Badge>
}

export default async function StudentScoresPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'STUDENT') redirect('/auth/sign-in')

  // All enrolled courses with their published assignments + questions
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: payload.sub },
    include: {
      course: {
        select: { id: true, name: true },
      },
    },
  })

  if (enrollments.length === 0) {
    return (
      <DashboardShell role="STUDENT" pageTitle="My Scores">
        <p className="text-sm text-gray-500">You are not enrolled in any courses yet.</p>
      </DashboardShell>
    )
  }

  const courseIds = enrollments.map(e => e.courseId)

  // All published assignments with their questions
  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: courseIds }, isPublished: true },
    include: {
      questions: { select: { id: true, points: true } },
      course: { select: { id: true, name: true } },
    },
    orderBy: [{ weekNumber: 'asc' }, { createdAt: 'asc' }],
  })

  // All responses for this student across these assignments
  const assignmentIds = assignments.map(a => a.id)
  const responses = await prisma.response.findMany({
    where: {
      userId: payload.sub,
      assignmentId: { in: assignmentIds },
      questionId: { not: null },
    },
    select: { assignmentId: true, questionId: true, score: true, submittedAt: true },
  })

  // Group responses by assignmentId
  const responsesByAssignment: Record<string, typeof responses> = {}
  for (const r of responses) {
    if (!responsesByAssignment[r.assignmentId]) responsesByAssignment[r.assignmentId] = []
    responsesByAssignment[r.assignmentId].push(r)
  }

  // Build per-assignment rows
  const rows = assignments.map(a => {
    const totalPts = a.questions.reduce((s, q) => s + q.points, 0)
    const aResponses = responsesByAssignment[a.id] ?? []
    const taken = aResponses.length > 0
    const earnedPts = aResponses.reduce((s, r) => s + (r.score ?? 0), 0)
    const pct = taken && totalPts > 0 ? Math.round((earnedPts / totalPts) * 100) : null
    const lastSubmitted = taken
      ? aResponses.reduce((latest, r) => (r.submittedAt > latest ? r.submittedAt : latest), aResponses[0].submittedAt)
      : null

    return {
      id: a.id,
      title: a.title,
      courseTitle: a.course.name,
      weekNumber: a.weekNumber,
      type: a.type,
      totalPts,
      earnedPts: taken ? earnedPts : null,
      pct,
      taken,
      submittedAt: lastSubmitted,
    }
  })

  // Summary stats
  const takenRows = rows.filter(r => r.taken)
  const totalPossibleAll = rows.reduce((s, r) => s + r.totalPts, 0)
  const totalPossibleTaken = takenRows.reduce((s, r) => s + r.totalPts, 0)
  const totalEarned = takenRows.reduce((s, r) => s + (r.earnedPts ?? 0), 0)

  const runningPct = totalPossibleTaken > 0 ? Math.round((totalEarned / totalPossibleTaken) * 100) : null
  const semesterPct = totalPossibleAll > 0 ? Math.round((totalEarned / totalPossibleAll) * 100) : null

  const multipleCourses = new Set(rows.map(r => r.courseTitle)).size > 1

  return (
    <DashboardShell role="STUDENT" pageTitle="My Scores">
      <div className="space-y-8 max-w-4xl">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-brand-700">
              {runningPct !== null ? `${runningPct}%` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Running Average</p>
            <p className="text-xs text-gray-400 mt-0.5">assignments taken so far</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
            <p className={`text-3xl font-bold ${semesterPct !== null && semesterPct >= 70 ? 'text-green-600' : semesterPct !== null ? 'text-red-600' : 'text-gray-400'}`}>
              {semesterPct !== null ? `${semesterPct}%` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Semester Grade</p>
            <p className="text-xs text-gray-400 mt-0.5">all assignments including not taken</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-gray-700">
              {takenRows.length}<span className="text-lg text-gray-400"> / {rows.length}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Completed</p>
            <p className="text-xs text-gray-400 mt-0.5">of {rows.length} total assignments</p>
          </div>
        </div>

        {/* Assignment table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignment</th>
                {multipleCourses && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Week</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Points</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(row => (
                <tr key={row.id} className={row.taken ? '' : 'opacity-60'}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/student/assignments/${row.id}`}
                      className="font-medium text-gray-900 hover:text-brand-700 hover:underline"
                    >
                      {row.title}
                    </Link>
                  </td>
                  {multipleCourses && (
                    <td className="px-4 py-3 text-xs text-gray-500">{row.courseTitle}</td>
                  )}
                  <td className="px-4 py-3 text-gray-600">Wk {row.weekNumber}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{row.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-right">
                    {row.pct !== null
                      ? pctBadge(row.pct)
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">
                    {row.taken
                      ? `${row.earnedPts} / ${row.totalPts}`
                      : <span className="text-gray-300">0 / {row.totalPts}</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-400">
                    {row.submittedAt ? format(new Date(row.submittedAt), 'MMM d') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer totals row */}
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-xs text-gray-700" colSpan={multipleCourses ? 4 : 3}>
                    Semester Total
                  </td>
                  <td className="px-4 py-3 text-right">
                    {semesterPct !== null ? pctBadge(semesterPct) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-600">
                    {totalEarned} / {totalPossibleAll}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </div>
    </DashboardShell>
  )
}
