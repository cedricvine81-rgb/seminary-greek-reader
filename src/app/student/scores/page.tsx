import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'Grades' }

function pctBadge(pct: number) {
  const variant = pct >= 90 ? 'green' : pct >= 70 ? 'amber' : 'red'
  return <Badge variant={variant}>{pct}%</Badge>
}

export default async function StudentScoresPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  // All enrolled courses with their published assignments + questions
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: payload.sub, status: 'APPROVED' },
    include: {
      course: {
        select: { id: true, name: true },
      },
    },
  })

  if (enrollments.length === 0) {
    return (
      <DashboardShell role="STUDENT" pageTitle="Grades">
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

  const assignmentIds = assignments.map(a => a.id)
  const passageExerciseIds = assignments
    .filter(a => a.type === 'TRANSLATION_EXERCISE' && a.questions.length === 0)
    .map(a => a.id)

  // Responses for question-based assignments (quizzes + question-based translation exercises)
  const [responses, exegesisSessions] = await Promise.all([
    prisma.response.findMany({
      where: {
        userId: payload.sub,
        assignmentId: { in: assignmentIds },
        questionId: { not: null },
      },
      select: { assignmentId: true, questionId: true, score: true, submittedAt: true, question: { select: { points: true } } },
    }),
    // Passage exercises: use ExegesisSession for submission status and instructor grade
    passageExerciseIds.length > 0
      ? prisma.exegesisSession.findMany({
          where: { userId: payload.sub, assignmentId: { in: passageExerciseIds } },
          select: { assignmentId: true, grade: true, submittedAt: true },
        })
      : Promise.resolve([]),
  ])

  // Group responses by assignmentId
  const responsesByAssignment: Record<string, typeof responses> = {}
  for (const r of responses) {
    if (!responsesByAssignment[r.assignmentId]) responsesByAssignment[r.assignmentId] = []
    responsesByAssignment[r.assignmentId].push(r)
  }
  const sessionByAssignment = Object.fromEntries(
    exegesisSessions.map(s => [s.assignmentId ?? '', s])
  )

  // Build per-assignment rows
  const rows = assignments.map(a => {
    const isPassage = a.type === 'TRANSLATION_EXERCISE' && a.questions.length === 0

    if (isPassage) {
      // Passage exercise — grade comes from instructor via ExegesisSession
      const sess = sessionByAssignment[a.id]
      const taken = !!sess?.submittedAt
      const graded = sess?.grade !== null && sess?.grade !== undefined
      return {
        id: a.id,
        title: a.title,
        courseTitle: a.course.name,
        weekNumber: a.weekNumber,
        type: a.type,
        totalPts: 100 as number,        // passage exercises are graded 0–100
        earnedPts: graded ? (sess!.grade as number) : null,
        pct: graded ? (sess!.grade as number) : null,
        taken,
        graded,
        isPassage: true,
        submittedAt: sess?.submittedAt ?? null,
      }
    }

    // Question-based assignment
    const aResponses = responsesByAssignment[a.id] ?? []
    const taken = aResponses.length > 0
    const earnedPts = aResponses.reduce((s, r) => s + (r.score ?? 0), 0)
    // Score out of the questions the student was actually shown (their stored
    // responses), not the whole pool — re-sampling vocab quizzes draw a subset.
    // Fixed quizzes answer every question, so this equals the full total.
    const answeredPts = aResponses.reduce((s, r) => s + (r.question?.points ?? 0), 0)
    const totalPts = answeredPts || a.questions.reduce((s, q) => s + q.points, 0)
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
      graded: taken,
      isPassage: false,
      submittedAt: lastSubmitted,
    }
  })

  // Summary stats — only include graded rows in running average; all rows in semester total
  const takenRows = rows.filter(r => r.taken)
  const gradedRows = rows.filter(r => r.graded && r.pct !== null)
  // For semester %, passage exercises count as 100pts each (same weight as their /100 grade)
  const totalPossibleAll = rows.reduce((s, r) => s + r.totalPts, 0)
  const totalPossibleTaken = gradedRows.reduce((s, r) => s + r.totalPts, 0)
  const totalEarned = gradedRows.reduce((s, r) => s + (r.earnedPts ?? 0), 0)

  const runningPct = totalPossibleTaken > 0 ? Math.round((totalEarned / totalPossibleTaken) * 100) : null
  const semesterPct = totalPossibleAll > 0 ? Math.round((totalEarned / totalPossibleAll) * 100) : null

  const multipleCourses = new Set(rows.map(r => r.courseTitle)).size > 1

  return (
    <DashboardShell role="STUDENT" pageTitle="Grades">
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
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[32rem]">
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
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {row.type === 'TRANSLATION_EXERCISE' ? 'Translation' : row.type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.pct !== null
                      ? pctBadge(row.pct)
                      : row.isPassage && row.taken
                        ? <span className="text-xs text-amber-600 font-medium">Awaiting grade</span>
                        : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">
                    {row.isPassage
                      ? row.pct !== null
                        ? `${row.earnedPts} / 100`
                        : <span className="text-gray-300">— / 100</span>
                      : row.taken
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

      </div>
    </DashboardShell>
  )
}
