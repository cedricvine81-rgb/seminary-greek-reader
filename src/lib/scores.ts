import { prisma } from './db'

export async function getStudentScores(userId: string, courseId?: string) {
  const assignments = courseId
    ? await prisma.assignment.findMany({ where: { courseId }, select: { id: true } })
    : []

  const assignmentIds = assignments.map(a => a.id)

  return prisma.response.findMany({
    where: {
      userId,
      ...(courseId ? { assignmentId: { in: assignmentIds } } : {}),
      questionId: null,
    },
    include: {
      assignment: { select: { title: true, type: true, weekNumber: true, dueDate: true } },
    },
    orderBy: { submittedAt: 'desc' },
  })
}

export async function saveAssignmentScore(userId: string, assignmentId: string, score: number) {
  return prisma.response.upsert({
    where: {
      id: `score-${userId}-${assignmentId}`,
    },
    update: { score, submittedAt: new Date() },
    create: {
      id: `score-${userId}-${assignmentId}`,
      userId,
      assignmentId,
      answer: '',
      score,
    },
  })
}

export async function getCourseLeaderboard(courseId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: { user: { select: { id: true, firstName: true, surname: true } } },
  })

  const results = await Promise.all(
    enrollments.map(async e => {
      const responses = await prisma.response.findMany({
        where: { userId: e.userId, questionId: null },
        select: { score: true },
      })
      const avg =
        responses.length > 0
          ? responses.reduce((s, r) => s + (r.score ?? 0), 0) / responses.length
          : 0
      return { user: e.user, averageScore: Math.round(avg) }
    })
  )

  return results.sort((a, b) => b.averageScore - a.averageScore)
}
