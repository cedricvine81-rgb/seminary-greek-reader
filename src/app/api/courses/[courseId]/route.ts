import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload, verifyPassword } from '@/lib/auth'
import { isInstructorOfCourse } from '@/lib/course-auth'
import { normalizeCategoryWeights } from '@/lib/grade-weights'
import { revalidatePath } from 'next/cache'

// PATCH /api/courses/[courseId] — update course settings (currently the final-grade
// category weights). Only the course's instructor (or a co-instructor) may change them.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!await isInstructorOfCourse(params.courseId, payload.sub)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if ('gradeCategoryWeights' in body) {
      const w = normalizeCategoryWeights(body.gradeCategoryWeights)
      data.gradeCategoryWeights = w === null ? Prisma.JsonNull : (w as Prisma.InputJsonValue)
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
    }
    await prisma.course.update({ where: { id: params.courseId }, data })
    revalidatePath(`/instructor/courses/${params.courseId}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/courses/[courseId] PATCH', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only the primary instructor may delete the course
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: { instructorId: true },
  })
  if (!course || course.instructorId !== payload.sub) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Require password confirmation
  const { password } = await req.json()
  if (!password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { password: true },
  })
  if (!user || !await verifyPassword(password, user.password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 403 })
  }

  // Delete in dependency order to satisfy foreign key constraints
  const assignments = await prisma.assignment.findMany({
    where: { courseId: params.courseId },
    select: { id: true },
  })
  const assignmentIds = assignments.map(a => a.id)

  await prisma.response.deleteMany({ where: { assignmentId: { in: assignmentIds } } })
  await prisma.question.deleteMany({ where: { assignmentId: { in: assignmentIds } } })
  await prisma.assignment.deleteMany({ where: { courseId: params.courseId } })
  await prisma.enrollment.deleteMany({ where: { courseId: params.courseId } })
  await prisma.course.delete({ where: { id: params.courseId } })

  return NextResponse.json({ ok: true })

  } catch (err) {
    logError('api/courses/[courseId]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
