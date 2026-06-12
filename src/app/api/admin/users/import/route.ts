import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken, hashPassword } from '@/lib/auth'
import { parseRoster } from '@/lib/csv-import'
import { recordAudit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

// Writes to live DB; never pre-render
export const dynamic = 'force-dynamic'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

/**
 * POST /api/admin/users/import
 * Body: { input: string, institution?: string, courseId?: string | null }
 *
 * Re-validates input on the server (do not trust the client's preview), then
 * creates every valid row as a STUDENT in a single transaction, with
 * mustChangePassword=true. If courseId is supplied, each new student is
 * enrolled in that course as APPROVED.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = getAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Throttle the whole feature to prevent runaway scripts.
    // 10 imports per admin per 24h is more than enough; each import can create dozens of rows.
    const rl = rateLimit(`admin-bulk-import:${admin.sub}`, 10, 24 * 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Daily import limit reached. Try again later or contact support.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const body = await req.json()
    const { input, institution, courseId } = body as {
      input: unknown
      institution?: unknown
      courseId?: unknown
    }
    if (typeof input !== 'string') {
      return NextResponse.json({ error: 'input (string) is required' }, { status: 400 })
    }

    const cleanInstitution = typeof institution === 'string' && institution.trim() ? institution.trim() : null
    const cleanCourseId = typeof courseId === 'string' && courseId ? courseId : null

    // Re-validate from scratch on the server — do not trust a client-side preview
    const { rows, errors: parseErrors } = parseRoster(input)
    if (parseErrors.length > 0) {
      return NextResponse.json({
        error: 'Input has errors — re-run preview and fix them before committing.',
        parseErrors,
      }, { status: 400 })
    }
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows to import.' }, { status: 400 })
    }

    // Cross-check against DB
    const existing = await prisma.user.findMany({
      where: { email: { in: rows.map(r => r.email) } },
      select: { email: true },
    })
    if (existing.length > 0) {
      return NextResponse.json({
        error: 'Some emails already exist in the database. Re-run preview.',
        duplicates: existing.map(u => u.email),
      }, { status: 409 })
    }

    // If a course was specified, confirm it exists (don't 500 later inside the transaction)
    if (cleanCourseId) {
      const course = await prisma.course.findUnique({ where: { id: cleanCourseId }, select: { id: true } })
      if (!course) return NextResponse.json({ error: 'Selected course not found.' }, { status: 404 })
    }

    // Placeholder password — the admin will reset to a real temp via the ✉️ button.
    // mustChangePassword=true forces the student through the password-change screen on first sign-in.
    const placeholder = crypto.randomBytes(32).toString('base64')
    const hashed = await hashPassword(placeholder)

    const created: { id: string; email: string; firstName: string; surname: string }[] = []

    await prisma.$transaction(async tx => {
      for (const r of rows) {
        const u = await tx.user.create({
          data: {
            firstName: r.firstName,
            surname: r.surname,
            email: r.email,
            password: hashed,
            role: 'STUDENT',
            institution: cleanInstitution,
            approved: true,
            mustChangePassword: true,
          },
          select: { id: true, email: true, firstName: true, surname: true },
        })
        if (cleanCourseId) {
          await tx.enrollment.create({
            data: { userId: u.id, courseId: cleanCourseId, status: 'APPROVED' },
          })
        }
        created.push(u)
      }
    }, { timeout: 120_000 })

    // Audit after the transaction commits — recordAudit is best-effort and uses
    // the global prisma client, so it belongs outside the transaction scope.
    await recordAudit({
      actorId: admin.sub,
      actorEmail: admin.email,
      action: 'bulk.csvImport',
      targetType: cleanCourseId ? 'Course' : null,
      targetId: cleanCourseId,
      after: {
        studentsCreated: created.length,
        institution: cleanInstitution,
        enrolledIn: cleanCourseId,
      },
    })

    return NextResponse.json({
      ok: true,
      created: created.length,
      users: created,
    })
  } catch (err) {
    logError('api/admin/users/import', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
