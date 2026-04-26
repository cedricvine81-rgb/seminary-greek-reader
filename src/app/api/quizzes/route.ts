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

  const breakdown = []
  for (const r of responses) {
    const graded = await gradeResponse(r.questionId, r.answer)
    const question = await prisma.question.findUnique({ where: { id: r.questionId } })

    await prisma.response.create({
      data: {
        userId: payload.sub,
        assignmentId,
        questionId: r.questionId,
        answer: r.answer,
        isCorrect: graded.isCorrect,
        score: graded.score,
      },
    })

    breakdown.push({
      questionId: r.questionId,
      prompt: question?.prompt ?? '',
      yourAnswer: r.answer,
      correctAnswer: graded.correctAnswer,
      isCorrect: graded.isCorrect,
      points: graded.score,
    })
  }

  const scoreData = await getAssignmentScore(payload.sub, assignmentId)

  // Save summary score
  if (scoreData) {
    await prisma.response.create({
      data: {
        userId: payload.sub,
        assignmentId,
        answer: '',
        score: scoreData.percentage,
      },
    })
  }

  return NextResponse.json({
    result: {
      assignmentId,
      totalQuestions: breakdown.length,
      correctAnswers: breakdown.filter(b => b.isCorrect).length,
      score: scoreData?.earned ?? 0,
      percentage: scoreData?.percentage ?? 0,
      breakdown,
    },
  })
}
