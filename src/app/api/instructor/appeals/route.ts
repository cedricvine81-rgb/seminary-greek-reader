import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/instructor/appeals
 *   ?status=PENDING|DECIDED|ALL  (default PENDING)
 *   ?courseId=…                  optional filter
 *
 * Lists vocab appeals for assignments in courses the instructor owns or co-teaches.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sp = req.nextUrl.searchParams
    const status = (sp.get('status') ?? 'PENDING').toUpperCase()
    const courseFilter = sp.get('courseId') ?? null

    // Courses the instructor can see
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { instructorId: payload.sub },
          { coInstructors: { some: { userId: payload.sub } } },
        ],
        ...(courseFilter ? { id: courseFilter } : {}),
      },
      select: { id: true },
    })
    const courseIds = courses.map(c => c.id)
    if (courseIds.length === 0) {
      return NextResponse.json({ appeals: [], pendingCount: 0 })
    }

    const baseWhere = { assignment: { courseId: { in: courseIds } } }
    const where = status === 'PENDING'
      ? { ...baseWhere, instructorDecision: 'PENDING' as const }
      : status === 'DECIDED'
        ? { ...baseWhere, instructorDecision: { in: ['ACCEPTED' as const, 'REJECTED' as const] } }
        : baseWhere

    const [appeals, pendingCount] = await Promise.all([
      prisma.vocabAppeal.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          studentAnswer: true,
          instructorDecision: true,
          instructorDecidedAt: true,
          instructorNote: true,
          adminDecision: true,
          createdAt: true,
          student: { select: { id: true, firstName: true, surname: true, email: true } },
          assignment: { select: { id: true, title: true, courseId: true, course: { select: { name: true } } } },
          question: { select: { id: true, prompt: true, correctAnswer: true } },
        },
      }),
      prisma.vocabAppeal.count({ where: { ...baseWhere, instructorDecision: 'PENDING' } }),
    ])

    return NextResponse.json({ appeals, pendingCount })
  } catch (err) {
    logError('api/instructor/appeals', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
