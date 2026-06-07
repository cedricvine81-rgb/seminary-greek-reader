import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

// PATCH /api/enrollments/[enrollmentId] — instructor approves or rejects
export async function PATCH(
  req: NextRequest,
  { params }: { params: { enrollmentId: string } }
) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { status } = await req.json() as { status: 'APPROVED' | 'REJECTED' }
  if (status !== 'APPROVED' && status !== 'REJECTED') {
    return NextResponse.json({ error: 'status must be APPROVED or REJECTED' }, { status: 400 })
  }

  // Verify the enrollment is for a course this instructor owns
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: params.enrollmentId },
    include: { course: { select: { instructorId: true, coInstructors: { select: { userId: true } } } } },
  })
  if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const authorized =
    enrollment.course.instructorId === payload.sub ||
    enrollment.course.coInstructors.some(c => c.userId === payload.sub)
  if (!authorized) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.enrollment.update({
    where: { id: params.enrollmentId },
    data: { status },
    include: { user: { select: { firstName: true, surname: true, email: true } } },
  })

  return NextResponse.json({ enrollment: updated })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
