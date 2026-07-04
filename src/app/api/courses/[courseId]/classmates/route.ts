import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { logError } from '@/lib/logger'

// GET /api/courses/[courseId]/classmates — coursemates a student is allowed to
// message directly: approved, opted-in (messagingConsent) students in the same
// course, excluding the caller. Only reachable by students enrolled in the course.
export async function GET(
  _req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId: params.courseId, userId: payload.sub, status: 'APPROVED' },
      select: { id: true },
    })
    if (!enrollment) return NextResponse.json({ error: 'You are not enrolled in this course.' }, { status: 403 })

    const classmates = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        deletedAt: null,
        messagingConsent: true,
        id: { not: payload.sub },
        enrollments: { some: { courseId: params.courseId, status: 'APPROVED' } },
      },
      select: { id: true, firstName: true, surname: true, title: true, email: true },
      orderBy: [{ surname: 'asc' }, { firstName: 'asc' }],
    })

    return NextResponse.json({ classmates })
  } catch (err) {
    logError('api/courses/[courseId]/classmates', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
