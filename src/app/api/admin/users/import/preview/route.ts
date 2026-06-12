import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { parseRoster } from '@/lib/csv-import'

// Reads live DB; never pre-render
export const dynamic = 'force-dynamic'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

/**
 * POST /api/admin/users/import/preview
 * Body: { input: string }
 *
 * Pure dry-run: parses the pasted text, validates it, and cross-checks against
 * the User table for emails that already exist. Writes NOTHING.
 *
 * Returns the parsed rows + the list of issues so the UI can render a preview
 * before the admin confirms.
 */
export async function POST(req: NextRequest) {
  try {
    if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { input } = await req.json()
    if (typeof input !== 'string') {
      return NextResponse.json({ error: 'input (string) is required' }, { status: 400 })
    }

    const { rows, errors: parseErrors } = parseRoster(input)

    // Cross-check against the DB — flag any emails already on file (even soft-deleted)
    const existing = rows.length > 0
      ? await prisma.user.findMany({
          where: { email: { in: rows.map(r => r.email) } },
          select: { email: true, deletedAt: true },
        })
      : []
    const existingMap = new Map(existing.map(u => [u.email, u]))

    const duplicates = rows
      .filter(r => existingMap.has(r.email))
      .map(r => {
        const e = existingMap.get(r.email)!
        return {
          line: r.line,
          email: r.email,
          reason: e.deletedAt
            ? `Already exists (soft-deleted) — restore from "Show deleted" rather than re-create`
            : `Already exists in the database`,
        }
      })

    const validRows = rows.filter(r => !existingMap.has(r.email))

    return NextResponse.json({
      validRows,
      parseErrors,
      duplicates,
      summary: {
        parsed: rows.length,
        valid: validRows.length,
        parseErrors: parseErrors.length,
        duplicates: duplicates.length,
      },
    })
  } catch (err) {
    logError('api/admin/users/import/preview', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
