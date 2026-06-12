import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'

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

  // Bust student dashboard (they can now see their approved course / rejection)
  // and instructor course page (pending count changes)
  revalidatePath('/student')
  revalidatePath('/student/assignments')
  revalidatePath(`/instructor/courses/${enrollment.courseId}`)
  revalidatePath('/instructor')

  return NextResponse.json({ enrollment: updated })

  } catch (err) {
    logError('api/enrollments/[enrollmentId]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
