import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

// GET /api/enrollments/available — courses the student can enroll in
export async function GET() {
  const payload = getPayload()
  if (!payload || payload.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const courses = await prisma.course.findMany({
    where: {
      enrollments: { none: { userId: payload.sub } },
    },
    include: {
      instructor: { select: { firstName: true, surname: true, title: true } },
      institution: { select: { name: true } },
      _count: { select: { enrollments: true, assignments: true } },
    },
    orderBy: { startDate: 'desc' },
  })

  return NextResponse.json({ courses })
}

// POST /api/enrollments — enroll the current student in a course
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
      data: { userId: payload.sub, courseId },
    })
    return NextResponse.json({ enrollment }, { status: 201 })
  } catch {
    // unique constraint = already enrolled
    return NextResponse.json({ error: 'Already enrolled' }, { status: 409 })
  }
}

// DELETE /api/enrollments — unenroll the current student from a course
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
