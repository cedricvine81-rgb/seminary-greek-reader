import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import { compareStudentsByName } from '@/lib/sort-students'

// Instructor grading for grammar-homework Translation Exercises (deck
// "Exercises A / B" sets worked word-by-word). GET returns every enrolled
// student's submitted answers alongside the model answers; PATCH sets a
// response's score. Scores feed the gradebook through the existing
// question-based translation-exercise path (sum of Response.score / points),
// and the student's QuizAttempt percentage is kept in sync.

function auth() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

export async function GET(_req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const payload = auth()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.assignmentId },
      select: {
        courseId: true, title: true,
        questions: { orderBy: { position: 'asc' }, select: { id: true, prompt: true, correctAnswer: true, options: true, points: true } },
      },
    })
    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: assignment.courseId, status: 'APPROVED' },
      select: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
    })
    const responses = await prisma.response.findMany({
      where: { assignmentId: params.assignmentId, questionId: { not: null } },
      select: { id: true, userId: true, questionId: true, answer: true, score: true, submittedAt: true },
    })

    const questions = assignment.questions.map(q => {
      let model: unknown = null
      try { model = q.options[0] ? JSON.parse(q.options[0]) : null } catch { /* ignore */ }
      return { id: q.id, prompt: q.prompt, points: q.points, modelTranslation: q.correctAnswer, model }
    })

    const students = enrollments
      .map(e => e.user)
      .sort((a, b) => compareStudentsByName(
        { firstName: a.firstName, surname: a.surname, email: a.email },
        { firstName: b.firstName, surname: b.surname, email: b.email },
      ))
      .map(u => {
        const rs = responses.filter(r => r.userId === u.id)
        return {
          userId: u.id,
          name: [u.firstName, u.surname].filter(Boolean).join(' ') || u.email,
          email: u.email,
          submittedAt: rs.length ? rs.reduce((m, r) => (r.submittedAt > m ? r.submittedAt : m), rs[0].submittedAt) : null,
          responses: rs.map(r => ({ id: r.id, questionId: r.questionId, answer: r.answer, score: r.score })),
        }
      })

    return NextResponse.json({ title: assignment.title, questions, students })
  } catch (err) {
    logError('api/assignments/[assignmentId]/homework GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const payload = auth()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { responseId, score } = await req.json() as { responseId: string; score: number }
    if (!responseId || typeof score !== 'number' || Number.isNaN(score) || score < 0) {
      return NextResponse.json({ error: 'responseId and a non-negative score are required.' }, { status: 400 })
    }

    const response = await prisma.response.findFirst({
      where: { id: responseId, assignmentId: params.assignmentId },
      select: { id: true, userId: true, questionId: true, question: { select: { points: true } } },
    })
    if (!response || !response.questionId) return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    const max = response.question?.points ?? 1
    const clamped = Math.min(score, max)

    await prisma.response.update({
      where: { id: response.id },
      data: { score: clamped, isCorrect: clamped >= max },
    })

    // Keep the student's best attempt in sync so results/gradebook agree.
    const [allResponses, questions] = await Promise.all([
      prisma.response.findMany({
        where: { assignmentId: params.assignmentId, userId: response.userId, questionId: { not: null } },
        select: { score: true },
      }),
      prisma.question.findMany({ where: { assignmentId: params.assignmentId }, select: { points: true } }),
    ])
    const totalPoints = questions.reduce((s, q) => s + q.points, 0)
    const earned = allResponses.reduce((s, r) => s + (r.score ?? 0), 0)
    const percentage = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0
    await prisma.quizAttempt.updateMany({
      where: { assignmentId: params.assignmentId, userId: response.userId, isBest: true },
      data: { earnedPoints: earned, percentage },
    })

    return NextResponse.json({ ok: true, score: clamped, percentage })
  } catch (err) {
    logError('api/assignments/[assignmentId]/homework PATCH', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
