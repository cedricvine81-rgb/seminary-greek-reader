import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'
import { StudentGradebook } from '@/components/student/StudentGradebook'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Grades' }

export default async function StudentScoresPage() {
  const t = getServerT()
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const me = await prisma.user.findUnique({ where: { id: payload.sub }, select: { firstName: true, surname: true } })
  const studentName = [me?.firstName, me?.surname].filter(Boolean).join(' ') || 'My grades'

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
        <p className="text-sm text-gray-500">{t('grades.notEnrolled')}</p>
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
  // Assignments whose grade comes from an ExegesisSession (instructor-graded 0–100):
  // passage translation exercises and translation exams.
  const isExegesisGraded = (a: { type: string; questions: { id: string }[] }) =>
    (a.type === 'TRANSLATION_EXERCISE' && a.questions.length === 0) || a.type === 'TRANSLATION_EXAM'
  const passageExerciseIds = assignments.filter(isExegesisGraded).map(a => a.id)

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
    const isPassage = isExegesisGraded(a)

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

  // Summary stats — based only on graded work. Not-yet-graded / not-yet-taken
  // assignments must NOT inflate the denominator (otherwise a single ungraded
  // 100-pt exercise drags the whole total down to a few percent).
  const takenRows = rows.filter(r => r.taken)
  const gradedRows = rows.filter(r => r.graded && r.pct !== null)
  const totalPossibleTaken = gradedRows.reduce((s, r) => s + r.totalPts, 0)
  const totalEarned = gradedRows.reduce((s, r) => s + (r.earnedPts ?? 0), 0)

  // Running average = unweighted mean of each graded assignment's percentage.
  const runningPct = gradedRows.length > 0
    ? Math.round(gradedRows.reduce((s, r) => s + (r.pct ?? 0), 0) / gradedRows.length)
    : null
  // Semester total = points-weighted across graded work (earned ÷ points possible).
  const semesterPct = totalPossibleTaken > 0 ? Math.round((totalEarned / totalPossibleTaken) * 100) : null

  return (
    <DashboardShell role="STUDENT" pageTitle="Grades">
      <div className="space-y-8 max-w-4xl">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-brand-700">
              {runningPct !== null ? `${runningPct}%` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">{t('grades.runningAverage')}</p>
            <p className="text-xs text-gray-400 mt-0.5">assignments taken so far</p>
          </div>
          <div className="bg-surface rounded-xl border border-gray-100 p-5 text-center">
            <p className={`text-3xl font-bold ${semesterPct !== null && semesterPct >= 70 ? 'text-green-600' : semesterPct !== null ? 'text-red-600' : 'text-gray-400'}`}>
              {semesterPct !== null ? `${semesterPct}%` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">{t('grades.semesterGrade')}</p>
            <p className="text-xs text-gray-400 mt-0.5">all assignments including not taken</p>
          </div>
          <div className="bg-surface rounded-xl border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-gray-700">
              {takenRows.length}<span className="text-lg text-gray-400"> / {rows.length}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">{t('course.completed')}</p>
            <p className="text-xs text-gray-400 mt-0.5">of {rows.length} total assignments</p>
          </div>
        </div>

        {/* Grade Book — grouped by type with per-group Avg + Overall (matches the
            instructor gradebook layout) */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('course.gradeBook')}</h2>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-400 italic">{t('assign.noAssignments')}</p>
          ) : (
            <StudentGradebook
              studentName={studentName}
              rows={rows.map(r => ({ id: r.id, title: r.title, weekNumber: r.weekNumber, type: r.type, pct: r.pct }))}
            />
          )}
        </div>

      </div>
    </DashboardShell>
  )
}
