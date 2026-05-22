import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

async function verifyPrimaryInstructor(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  })
  return course?.instructorId === userId ? course : null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const coInstructors = await prisma.courseCoInstructor.findMany({
    where: { courseId: params.courseId },
    include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ coInstructors })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const course = await verifyPrimaryInstructor(params.courseId, payload.sub)
  if (!course) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, firstName: true, surname: true, email: true, role: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'No account found with that email address' }, { status: 404 })
  }
  if (user.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'That account does not have instructor access' }, { status: 400 })
  }
  if (user.id === payload.sub) {
    return NextResponse.json({ error: 'You are already the primary instructor' }, { status: 400 })
  }

  const coInstructor = await prisma.courseCoInstructor.upsert({
    where: { courseId_userId: { courseId: params.courseId, userId: user.id } },
    update: {},
    create: { courseId: params.courseId, userId: user.id },
    include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
  })

  return NextResponse.json({ coInstructor }, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const course = await verifyPrimaryInstructor(params.courseId, payload.sub)
  if (!course) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

  await prisma.courseCoInstructor.deleteMany({
    where: { courseId: params.courseId, userId },
  })

  return NextResponse.json({ ok: true })
}
