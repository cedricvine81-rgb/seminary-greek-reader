import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

// GET /api/enrollments/mine — returns the current student's enrollment statuses
export async function GET() {
  try {
    const token = getTokenFromCookies()
    const payload = token ? verifyToken(token) : null
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: payload.sub },
      select: { id: true, courseId: true, status: true },
    })

    return NextResponse.json({ enrollments })
  } catch (err) {
    logError('api/enrollments/mine', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
