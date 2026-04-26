import { prisma } from './db'

export async function getCourseReport(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      enrollments: { include: { user: true } },
      assignments: { include: { _count: { select: { questions: true } } } },
    },
  })
  if (!course) return null

  const studentStats = await Promise.all(
    course.enrollments.map(async e => {
      const responses = await prisma.response.findMany({
        where: {
          userId: e.userId,
          assignmentId: { in: course.assignments.map(a => a.id) },
          questionId: null,
        },
        select: { score: true, assignmentId: true, submittedAt: true },
      })

      const avgScore =
        responses.length > 0
          ? Math.round(responses.reduce((s, r) => s + (r.score ?? 0), 0) / responses.length)
          : null

      return {
        userId: e.userId,
        name: `${e.user.firstName} ${e.user.surname}`,
        email: e.user.email,
        completedAssignments: responses.length,
        totalAssignments: course.assignments.length,
        averageScore: avgScore,
      }
    })
  )

  return {
    course,
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
