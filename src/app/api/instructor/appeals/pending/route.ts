import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** GET /api/instructor/appeals/pending — number of pending appeals for this instructor */
export async function GET() {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { instructorId: payload.sub },
          { coInstructors: { some: { userId: payload.sub } } },
        ],
      },
      select: { id: true },
    })
    const courseIds = courses.map(c => c.id)
    if (courseIds.length === 0) return NextResponse.json({ count: 0 })

    const count = await prisma.vocabAppeal.count({
      where: {
        instructorDecision: 'PENDING',
        assignment: { courseId: { in: courseIds } },
      },
    })
    return NextResponse.json({ count })
  } catch (err) {
    logError('api/instructor/appeals/pending', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
