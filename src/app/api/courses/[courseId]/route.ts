import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken, verifyPassword } from '@/lib/auth'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
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

  await prisma.course.delete({ where: { id: params.courseId } })
  return NextResponse.json({ ok: true })
}
