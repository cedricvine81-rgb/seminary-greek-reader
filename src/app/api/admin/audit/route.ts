import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

// This route reads from the live database, so never pre-render
export const dynamic = 'force-dynamic'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

const PAGE_SIZE = 50

/**
 * GET /api/admin/audit
 *
 * Read-only paginated audit log. Filters via query string:
 *   action=user.softDelete     — exact action match
 *   targetType=User            — exact target type
 *   targetId=cmq…              — exact target id
 *   actorId=cmq…               — exact actor id
 *   page=1                     — 1-based page index
 */
export async function GET(req: NextRequest) {
  try {
    if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = req.nextUrl.searchParams
    const where: Record<string, string> = {}
    for (const f of ['action', 'targetType', 'targetId', 'actorId'] as const) {
      const v = sp.get(f)
      if (v) where[f] = v
    }
    const page = Math.max(1, Number(sp.get('page')) || 1)

    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true, createdAt: true, actorId: true, actorEmail: true,
          action: true, targetType: true, targetId: true,
          before: true, after: true, context: true,
        },
      }),
    ])

    // Distinct action list for the filter dropdown — small table, cheap query
    const distinctActions = await prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    })

    return NextResponse.json({
      rows,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      actions: distinctActions.map(d => d.action),
    })
  } catch (err) {
    logError('api/admin/audit', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
