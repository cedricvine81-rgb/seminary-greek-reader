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

  // Load assignment for retake limit
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { maxRetakes: true, questions: { select: { points: true } } },
  })
  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

  const totalPoints = assignment.questions.reduce((s, q) => s + q.points, 0)

  // Count previous attempts
  const previousAttempts = await prisma.quizAttempt.findMany({
    where: { userId: payload.sub, assignmentId },
    orderBy: { attemptNumber: 'asc' },
  })

  const attemptNumber = previousAttempts.length + 1
  const maxAllowed = assignment.maxRetakes === null ? null : assignment.maxRetakes + 1 // retakes + initial
  if (maxAllowed !== null && previousAttempts.length >= maxAllowed) {
    return NextResponse.json({ error: 'No retakes remaining.' }, { status: 403 })
  }

  // Grade the new attempt
  const breakdown = []
  let earnedPoints = 0
  for (const r of responses) {
    const graded = await gradeResponse(r.questionId, r.answer)
    const question = await prisma.question.findUnique({ where: { id: r.questionId } })
    earnedPoints += graded.score
    breakdown.push({
      questionId: r.questionId,
      prompt: question?.prompt ?? '',
      yourAnswer: r.answer,
      correctAnswer: graded.correctAnswer,
      isCorrect: graded.isCorrect,
      points: graded.score,
    })
  }

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

  // Find the current best attempt
  const bestPrevious = previousAttempts.find(a => a.isBest)
  const isNewBest = !bestPrevious || earnedPoints >= bestPrevious.earnedPoints

  // If this is the new best, replace Response records and update isBest flags
  if (isNewBest) {
    await prisma.response.deleteMany({ where: { userId: payload.sub, assignmentId } })
    for (const r of responses) {
      const graded = breakdown.find(b => b.questionId === r.questionId)!
      await prisma.response.create({
        data: {
          userId: payload.sub,
          assignmentId,
          questionId: r.questionId,
          answer: r.answer,
          isCorrect: graded.isCorrect,
          score: graded.points,
        },
      })
    }
    // Clear isBest on all previous attempts
    if (bestPrevious) {
      await prisma.quizAttempt.updateMany({
        where: { userId: payload.sub, assignmentId },
        data: { isBest: false },
      })
    }
  }

  // Record this attempt
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
