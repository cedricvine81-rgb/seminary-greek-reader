import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { gradeResponse, getAssignmentScore } from '@/lib/grading'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Throttle quiz submissions per user (guards against rapid duplicate submits)
  const rl = rateLimit(`quiz-submit:${payload.sub}`, 10, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many submissions — please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

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
      provideDefinition: true,
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
  // Score out of the questions actually presented this attempt (the submitted set),
  // not all stored questions. For fixed quizzes the student answers every stored
  // question, so this equals the old total; for re-sampling pools it's the subset shown.
  const totalPoints = responses.reduce((s, r) => s + (questionMap[r.questionId]?.points ?? 0), 0)

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

  // Grade — pass provideDefinition to avoid N+1 (one DB query per question otherwise)
  const breakdown: { questionId: string; prompt: string; yourAnswer: string; correctAnswer: string; isCorrect: boolean; points: number; responseId?: string }[] = []
  let earnedPoints = 0
  for (const r of responses) {
    const question = questionMap[r.questionId]
    if (!question) continue // skip unknown question IDs
    const graded = await gradeResponse(r.questionId, r.answer, assignment.provideDefinition)
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

  // Persist results atomically — response records + attempt record in one transaction
  // so a mid-flight crash never leaves partial data.
  await prisma.$transaction(async tx => {
    if (isNewBest) {
      await tx.response.deleteMany({ where: { userId: payload.sub, assignmentId } })
      // Create one at a time so we can capture the new ids and feed them into
      // the breakdown — the client uses responseId to anchor appeals.
      for (const b of breakdown) {
        const created = await tx.response.create({
          data: {
            userId: payload.sub,
            assignmentId,
            questionId: b.questionId,
            answer: b.yourAnswer,
            isCorrect: b.isCorrect,
            score: b.points,
          },
          select: { id: true },
        })
        b.responseId = created.id
      }
      if (bestPrevious) {
        await tx.quizAttempt.updateMany({
          where: { userId: payload.sub, assignmentId },
          data: { isBest: false },
        })
      }
    } else {
      // Not a new best — no new Response rows. Look up the existing best-attempt
      // Response ids so the breakdown still carries them for the appeal button.
      const existing = await tx.response.findMany({
        where: { userId: payload.sub, assignmentId, questionId: { not: null } },
        select: { id: true, questionId: true },
      })
      const idByQuestion = new Map(existing.map(r => [r.questionId, r.id]))
      for (const b of breakdown) {
        const rid = idByQuestion.get(b.questionId)
        if (rid) b.responseId = rid
      }
    }
    await tx.quizAttempt.create({
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
  })

  // Bust Router Cache so instructor gradebook and student assignment list reflect the new score
  revalidatePath(`/instructor/courses/${assignment.courseId}`)
  revalidatePath(`/student/assignments`)
  revalidatePath(`/student/assignments/${assignmentId}`)

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

  } catch (err) {
    logError('api/quizzes', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
