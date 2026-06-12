import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { logError } from '@/lib/logger'

// Reads live DB; never pre-render
export const dynamic = 'force-dynamic'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

// GET /api/admin/users?includeDeleted=true — list all users (optionally including soft-deleted ones)
export async function GET(req: NextRequest) {
  try {
    if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const includeDeleted = req.nextUrl.searchParams.get('includeDeleted') === 'true'

    const users = await prisma.user.findMany({
      // When includeDeleted is true, drop the where clause entirely (no filter)
      ...(includeDeleted ? {} : { where: { deletedAt: null } }),
      // Pending (unapproved) users first so admins see approvals needed at the top.
      orderBy: [{ approved: 'asc' }, { role: 'asc' }, { surname: 'asc' }],
      select: {
        id: true, firstName: true, surname: true, email: true,
        role: true, institution: true, approved: true, createdAt: true,
        deletedAt: true,
        _count: { select: { instructorCourses: true, enrollments: true } },
      },
    })
    return NextResponse.json({ users })
  } catch (err) {
    logError('api/admin/users', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
