import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { requireStudentAccess } from '@/lib/subscription'
import { rateLimit } from '@/lib/rate-limit'

// GET /api/enrollments — available courses (for students, filtered by institution)
export async function GET() {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const gate = await requireStudentAccess(payload); if (gate) return gate

  const student = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { institution: true },
  })

  // Build filter: same institution as student (if set), or all courses if no institution
  const institutionFilter = student?.institution
    ? { institution: { name: student.institution } }
    : {}

  const courses = await prisma.course.findMany({
    where: {
      ...institutionFilter,
      enrollments: { none: { userId: payload.sub } },
    },
    include: {
      instructor: { select: { firstName: true, surname: true, title: true } },
      institution: { select: { name: true } },
      _count: { select: { enrollments: { where: { status: 'APPROVED' } }, assignments: true } },
    },
    orderBy: { startDate: 'desc' },
  })

  return NextResponse.json({ courses })

  } catch (err) {
    logError('api/enrollments', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// POST /api/enrollments — student requests to join a course (PENDING)
export async function POST(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const gate = await requireStudentAccess(payload); if (gate) return gate

  // Throttle enrollment requests per student
  const rl = rateLimit(`enroll:${payload.sub}`, 10, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests — please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const { courseId } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 })

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Check for existing enrollment before attempting create
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: payload.sub, courseId } },
    select: { status: true },
  })
  if (existing) {
    const msg = existing.status === 'PENDING'
      ? 'You already have a pending request for this course'
      : existing.status === 'APPROVED'
      ? 'You are already enrolled in this course'
      : 'Your previous request was rejected — contact your instructor'
    return NextResponse.json({ error: msg }, { status: 409 })
  }

  const enrollment = await prisma.enrollment.create({
    data: { userId: payload.sub, courseId, status: 'PENDING' },
  })

  // Bust instructor dashboard/course page cache so pending request appears immediately
  revalidatePath('/instructor')
  revalidatePath(`/instructor/courses/${courseId}`)

  return NextResponse.json({ enrollment }, { status: 201 })

  } catch (err) {
    logError('api/enrollments', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// DELETE /api/enrollments — student withdraws enrollment request
export async function DELETE(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const gate = await requireStudentAccess(payload); if (gate) return gate

  const { courseId } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 })

  await prisma.enrollment.deleteMany({
    where: { userId: payload.sub, courseId },
  })

  return NextResponse.json({ ok: true })

  } catch (err) {
    logError('api/enrollments', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
