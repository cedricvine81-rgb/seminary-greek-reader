import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

// GET /api/enrollments — available courses (for students, filtered by institution)
export async function GET() {
  const payload = getPayload()
  if (!payload || payload.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
}

// POST /api/enrollments — student requests to join a course (PENDING)
export async function POST(req: NextRequest) {
  const payload = getPayload()
  if (!payload || payload.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 })

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  try {
    const enrollment = await prisma.enrollment.create({
      data: { userId: payload.sub, courseId, status: 'PENDING' },
    })
    return NextResponse.json({ enrollment }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Already requested or enrolled' }, { status: 409 })
  }
}

// DELETE /api/enrollments — student withdraws enrollment request
export async function DELETE(req: NextRequest) {
  const payload = getPayload()
  if (!payload || payload.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 })

  await prisma.enrollment.deleteMany({
    where: { userId: payload.sub, courseId },
  })

  return NextResponse.json({ ok: true })
}
