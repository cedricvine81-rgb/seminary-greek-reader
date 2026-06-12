import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { logError } from '@/lib/logger'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

// GET /api/admin/courses — list all courses
export async function GET() {
  try {
    if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        instructor: { select: { firstName: true, surname: true, email: true } },
        institution: { select: { name: true } },
        _count: { select: { enrollments: true, assignments: true } },
      },
    })
    return NextResponse.json({ courses })
  } catch (err) {
    logError('api/admin/courses', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
