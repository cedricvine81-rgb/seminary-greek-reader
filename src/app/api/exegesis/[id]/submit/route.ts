import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

// POST /api/exegesis/[id]/submit — mark an exegesis session as submitted for its assignment
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = await prisma.exegesisSession.findFirst({
      where: { id: params.id, userId: payload.sub },
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

    // Mark session submitted + create a Response record (questionId=null) so the
    // student dashboard can detect this assignment as completed.
    await prisma.$transaction([
      prisma.exegesisSession.update({
        where: { id: params.id },
        data: { submittedAt: new Date() },
      }),
      prisma.response.create({
        data: {
          userId: payload.sub,
          assignmentId: session.assignmentId,
          questionId: null,
          answer: params.id, // store session ID as the "answer"
          isCorrect: null,
          score: null,
        },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
