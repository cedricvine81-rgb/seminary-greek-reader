import { prisma } from './db'

export async function getCourseReport(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      // Only approved enrollments; select only safe fields — never include password
      enrollments: {
        where: { status: 'APPROVED' },
        include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
      },
      assignments: { include: { _count: { select: { questions: true } } } },
    },
  })
  if (!course) return null

  const assignmentIds = course.assignments.map(a => a.id)
  const studentIds = course.enrollments.map(e => e.userId)

  // Single query for all best quiz attempts (no N+1)
  const attempts = assignmentIds.length > 0 && studentIds.length > 0
    ? await prisma.quizAttempt.findMany({
        where: { assignmentId: { in: assignmentIds }, userId: { in: studentIds }, isBest: true },
        select: { userId: true, assignmentId: true, percentage: true },
      })
    : []

  // Single query for all graded passage-exercise sessions
  const exegesisSessions = assignmentIds.length > 0 && studentIds.length > 0
    ? await prisma.exegesisSession.findMany({
        where: { assignmentId: { in: assignmentIds }, userId: { in: studentIds } },
        select: { userId: true, assignmentId: true, submittedAt: true, grade: true },
      })
    : []

  const studentStats = course.enrollments.map(e => {
    const uid = e.userId

    const completedAssignments =
      attempts.filter(a => a.userId === uid).length +
      exegesisSessions.filter(s => s.userId === uid && s.submittedAt !== null).length

    const gradedScores = [
      ...attempts.filter(a => a.userId === uid).map(a => a.percentage),
      ...exegesisSessions.filter(s => s.userId === uid && s.grade !== null).map(s => s.grade as number),
    ]

    const avgScore =
      gradedScores.length > 0
        ? Math.round(gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length)
        : null

    return {
      userId: uid,
      name: `${e.user.firstName} ${e.user.surname}`,
      email: e.user.email,
      completedAssignments,
      totalAssignments: course.assignments.length,
      averageScore: avgScore,
    }
  })

  return {
    courseId: course.id,
    courseName: course.name,
    studentStats,
    totalStudents: course.enrollments.length,
    totalAssignments: course.assignments.length,
  }
}

export async function exportCourseResultsCSV(courseId: string): Promise<string> {
  const report = await getCourseReport(courseId)
  if (!report) return ''

  const header = 'Name,Email,Completed,Total Assignments,Average Score'
  const rows = report.studentStats.map(
    s => `"${s.name}","${s.email}",${s.completedAssignments},${s.totalAssignments},${s.averageScore ?? 'N/A'}`
  )
  return [header, ...rows].join('\n')
}
