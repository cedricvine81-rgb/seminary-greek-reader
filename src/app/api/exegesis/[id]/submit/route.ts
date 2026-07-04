import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { requireStudentAccess } from '@/lib/subscription'

// POST /api/exegesis/[id]/submit — mark an exegesis session as submitted for its assignment
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate

    // Throttle submit attempts per user
    const rl = rateLimit(`exegesis-submit:${payload.sub}`, 10, 60_000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests — please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const session = await prisma.exegesisSession.findFirst({
      where: { id: params.id, userId: payload.sub },
      select: { id: true, assignmentId: true, submittedAt: true, annotations: true },
    })
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (!session.assignmentId) return NextResponse.json({ error: 'This session is not linked to an assignment' }, { status: 400 })

    // Verify the assignment exists and the student is enrolled
    const assignment = await prisma.assignment.findUnique({
      where: { id: session.assignmentId },
      select: { id: true, courseId: true, isPublished: true, type: true },
    })
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    if (!assignment.isPublished) return NextResponse.json({ error: 'Assignment not available' }, { status: 403 })

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: payload.sub, courseId: assignment.courseId, status: 'APPROVED' },
    })
    if (!enrollment) return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })

    // Prevent double-submit
    if (session.submittedAt) {
      return NextResponse.json({ ok: true, alreadySubmitted: true })
    }

    // Mark session submitted, snapshot annotations at this moment for later diff comparison.
    // Create a sentinel Response record (questionId=null) so the student dashboard detects it as
    // completed. Guard against duplicate rows in case of concurrent submit requests.
    await prisma.$transaction(async tx => {
      await tx.exegesisSession.update({
        where: { id: params.id },
        data: {
          submittedAt: new Date(),
          submittedAnnotations: session.annotations ?? {},   // snapshot
        },
      })

      const existing = await tx.response.findFirst({
        where: { userId: payload.sub, assignmentId: session.assignmentId!, questionId: null },
        select: { id: true },
      })
      if (!existing) {
        await tx.response.create({
          data: {
            userId: payload.sub,
            assignmentId: session.assignmentId!,
            questionId: null,
            answer: params.id,   // session ID as the "answer"
            isCorrect: null,
            score: null,
          },
        })
      }
    })

    // Bust caches so the instructor's results/gradebook and the student's list reflect the submission
    revalidatePath(`/instructor/courses/${assignment.courseId}`)
    revalidatePath(`/instructor/assignments/${session.assignmentId}/grade`)
    revalidatePath('/student/assignments')
    revalidatePath(`/student/assignments/${session.assignmentId}`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/exegesis/[id]/submit', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
