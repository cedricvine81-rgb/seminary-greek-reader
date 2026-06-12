import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

// GET /api/enrollments/pending — returns pending enrollment requests for the current instructor
export async function GET() {
  try {
    const token = getTokenFromCookies()
    const payload = token ? verifyToken(token) : null
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courseIds = (
      await prisma.course.findMany({
        where: {
          isArchived: false,
          OR: [
            { instructorId: payload.sub },
            { coInstructors: { some: { userId: payload.sub } } },
          ],
        },
        select: { id: true },
      })
    ).map(c => c.id)

    const pending = await prisma.enrollment.findMany({
      where: { courseId: { in: courseIds }, status: 'PENDING' },
      select: {
        id: true,
        createdAt: true,
        user: { select: { firstName: true, surname: true, email: true } },
        course: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      pending: pending.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })),
    })
  } catch (err) {
    logError('api/enrollments/pending', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
