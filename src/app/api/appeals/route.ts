import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/appeals
 * Body: { responseId: string }
 *
 * Student creates an appeal on a single wrong vocab response. Server enforces:
 *  - Caller is the student who owns the response
 *  - Assignment is a vocab quiz with maxAppeals > 0
 *  - Response is currently marked wrong
 *  - Student hasn't already appealed this response
 *  - Cap not exceeded (count of existing appeals < maxAppeals)
 */
export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Light rate-limit so a determined script can't carpet-bomb the endpoint
    const rl = rateLimit(`appeal-create:${payload.sub}`, 30, 60_000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests — please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const { responseId } = await req.json()
    if (typeof responseId !== 'string' || !responseId) {
      return NextResponse.json({ error: 'responseId is required' }, { status: 400 })
    }

    const response = await prisma.response.findUnique({
      where: { id: responseId },
      select: {
        id: true, userId: true, assignmentId: true, questionId: true,
        isCorrect: true, answer: true,
        assignment: { select: { type: true, maxAppeals: true, courseId: true } },
      },
    })
    if (!response) return NextResponse.json({ error: 'Response not found.' }, { status: 404 })
    if (response.userId !== payload.sub) {
      // Don't leak whose response this was
      return NextResponse.json({ error: 'Response not found.' }, { status: 404 })
    }
    if (response.isCorrect !== false) {
      return NextResponse.json({ error: 'Only wrong answers can be appealed.' }, { status: 400 })
    }
    if (!response.questionId) {
      return NextResponse.json({ error: 'This response is not linked to a question.' }, { status: 400 })
    }
    if (response.assignment.type !== 'VOCABULARY_QUIZ') {
      return NextResponse.json({ error: 'Appeals are only supported on vocab quizzes right now.' }, { status: 400 })
    }
    const cap = response.assignment.maxAppeals ?? 0
    if (cap <= 0) {
      return NextResponse.json({ error: 'Appeals are not enabled for this quiz.' }, { status: 400 })
    }

    // Already appealed?
    const existing = await prisma.vocabAppeal.findUnique({ where: { responseId } })
    if (existing) {
      return NextResponse.json({ error: 'You have already appealed this answer.' }, { status: 409 })
    }

    // Cap: count active appeals on this assignment for this student
    const used = await prisma.vocabAppeal.count({
      where: { studentId: payload.sub, assignmentId: response.assignmentId },
    })
    if (used >= cap) {
      return NextResponse.json({
        error: `You've used your ${cap} appeal${cap === 1 ? '' : 's'} for this quiz.`,
      }, { status: 429 })
    }

    const appeal = await prisma.vocabAppeal.create({
      data: {
        studentId: payload.sub,
        assignmentId: response.assignmentId,
        responseId: response.id,
        questionId: response.questionId,
        studentAnswer: response.answer,
      },
      select: { id: true, createdAt: true },
    })

    // Notify instructor surfaces (badge counts, lists)
    revalidatePath(`/instructor/courses/${response.assignment.courseId}`)
    revalidatePath('/instructor/appeals')

    const remaining = Math.max(0, cap - used - 1)
    return NextResponse.json({ ok: true, appealId: appeal.id, appealsRemaining: remaining }, { status: 201 })
  } catch (err) {
    logError('api/appeals', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

/**
 * GET /api/appeals?assignmentId=… — student fetches their own appeals state
 * for a quiz so the UI can render the correct buttons (used budget, which
 * responses are already appealed).
 */
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const assignmentId = req.nextUrl.searchParams.get('assignmentId')
    if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })

    const appeals = await prisma.vocabAppeal.findMany({
      where: { studentId: payload.sub, assignmentId },
      select: {
        id: true, responseId: true, questionId: true, studentAnswer: true,
        instructorDecision: true, adminDecision: true, createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ appeals })
  } catch (err) {
    logError('api/appeals', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
