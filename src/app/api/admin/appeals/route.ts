import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/appeals
 *   ?status=PENDING|DECIDED|ALL  (default PENDING)
 *
 * Lists appeals the instructor has accepted, awaiting admin decision on
 * whether to add the answer to the global lexicon. Rejected-by-instructor
 * appeals never appear here (their adminDecision is NOT_APPLICABLE).
 */
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = (req.nextUrl.searchParams.get('status') ?? 'PENDING').toUpperCase()

    // Only consider appeals the instructor has accepted.
    const baseWhere = { instructorDecision: 'ACCEPTED' as const }
    const where = status === 'PENDING'
      ? { ...baseWhere, adminDecision: 'PENDING' as const }
      : status === 'DECIDED'
        ? { ...baseWhere, adminDecision: { in: ['ACCEPTED' as const, 'REJECTED' as const] } }
        : baseWhere

    const [appeals, pendingCount] = await Promise.all([
      prisma.vocabAppeal.findMany({
        where,
        orderBy: [{ adminDecision: 'asc' }, { instructorDecidedAt: 'asc' }],
        select: {
          id: true,
          studentAnswer: true,
          instructorDecision: true,
          instructorDecidedAt: true,
          instructorNote: true,
          adminDecision: true,
          adminDecidedAt: true,
          adminNote: true,
          createdAt: true,
          student: { select: { firstName: true, surname: true, email: true } },
          assignment: { select: { title: true, course: { select: { name: true } } } },
          question: { select: { prompt: true, correctAnswer: true } },
        },
      }),
      prisma.vocabAppeal.count({
        where: { instructorDecision: 'ACCEPTED', adminDecision: 'PENDING' },
      }),
    ])

    return NextResponse.json({ appeals, pendingCount })
  } catch (err) {
    logError('api/admin/appeals', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
