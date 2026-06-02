import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { gradeResponse, getAssignmentScore } from '@/lib/grading'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

export async function POST(req: NextRequest) {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { assignmentId, responses } = body as {
    assignmentId: string
    responses: { questionId: string; answer: string }[]
  }

  if (!assignmentId || !Array.isArray(responses) || responses.length === 0) {
    return NextResponse.json({ error: 'assignmentId and responses are required' }, { status: 400 })
  }

  // Load assignment — include questions (prompt + points) to avoid N+1
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      courseId: true,
      maxRetakes: true,
      isPublished: true,
      questions: { select: { id: true, prompt: true, points: true } },
    },
  })
  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  if (!assignment.isPublished) return NextResponse.json({ error: 'Assignment not available' }, { status: 403 })

  // ── SECURITY: verify the student has an APPROVED enrollment in this course ──
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: payload.sub, courseId: assignment.courseId, status: 'APPROVED' },
    select: { id: true },
  })
  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
  }

  const questionMap = Object.fromEntries(assignment.questions.map(q => [q.id, q]))
  const totalPoints = assignment.questions.reduce((s, q) => s + q.points, 0)

  // Count previous attempts
  const previousAttempts = await prisma.quizAttempt.findMany({
    where: { userId: payload.sub, assignmentId },
    orderBy: { attemptNumber: 'asc' },
  })

  const attemptNumber = previousAttempts.length + 1
  const maxAllowed = assignment.maxRetakes === null ? null : assignment.maxRetakes + 1
  if (maxAllowed !== null && previousAttempts.length >= maxAllowed) {
    return NextResponse.json({ error: 'No retakes remaining.' }, { status: 403 })
  }

  // Grade — question data already loaded, no extra DB calls in loop
  const breakdown = []
  let earnedPoints = 0
  for (const r of responses) {
    const question = questionMap[r.questionId]
    if (!question) continue // skip unknown question IDs
    const graded = await gradeResponse(r.questionId, r.answer)
    earnedPoints += graded.score
    breakdown.push({
      questionId: r.questionId,
      prompt: question.prompt,
      yourAnswer: r.answer,
      correctAnswer: graded.correctAnswer,
      isCorrect: graded.isCorrect,
      points: graded.score,
    })
  }

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

  // Determine if this is the new best attempt
  const bestPrevious = previousAttempts.find(a => a.isBest)
  const isNewBest = !bestPrevious || earnedPoints >= bestPrevious.earnedPoints

  // Replace Response records if this is the new best
  if (isNewBest) {
    await prisma.response.deleteMany({ where: { userId: payload.sub, assignmentId } })
    await prisma.response.createMany({
      data: breakdown.map(b => ({
        userId: payload.sub,
        assignmentId,
        questionId: b.questionId,
        answer: b.yourAnswer,
        isCorrect: b.isCorrect,
        score: b.points,
      })),
    })
    if (bestPrevious) {
      await prisma.quizAttempt.updateMany({
        where: { userId: payload.sub, assignmentId },
        data: { isBest: false },
      })
    }
  }

  await prisma.quizAttempt.create({
    data: {
      userId: payload.sub,
      assignmentId,
      attemptNumber,
      earnedPoints,
      totalPoints,
      percentage,
      isBest: isNewBest,
    },
  })

  const scoreData = await getAssignmentScore(payload.sub, assignmentId)
  const retakesRemaining = maxAllowed === null ? null : Math.max(0, maxAllowed - attemptNumber)

  return NextResponse.json({
    result: {
      assignmentId,
      totalQuestions: breakdown.length,
      correctAnswers: breakdown.filter(b => b.isCorrect).length,
      score: scoreData?.earned ?? 0,
      percentage,
      breakdown,
      attemptNumber,
      retakesRemaining,
      isNewBest,
    },
  })
}
