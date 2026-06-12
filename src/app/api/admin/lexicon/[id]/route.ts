import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

/**
 * PATCH /api/admin/lexicon/[id]
 * Body: { acceptedAnswers: string | null }
 *
 * Admin-only. Sets the curated synonym list for a single lexeme. Audited.
 * Does not touch any student data — only the lexicon row itself.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { acceptedAnswers } = await req.json()
    // Normalize: trim each entry, drop blanks, lower-case, de-duplicate
    let normalized: string | null = null
    if (typeof acceptedAnswers === 'string') {
      const list = acceptedAnswers
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
      const unique = Array.from(new Set(list))
      normalized = unique.length > 0 ? unique.join(', ') : null
    }

    const before = await prisma.lexicalEntry.findUnique({
      where: { id: params.id },
      select: { lexeme: true, acceptedAnswers: true },
    })
    if (!before) return NextResponse.json({ error: 'Lexicon entry not found.' }, { status: 404 })

    const updated = await prisma.lexicalEntry.update({
      where: { id: params.id },
      data: { acceptedAnswers: normalized },
      select: { id: true, lexeme: true, acceptedAnswers: true },
    })

    await recordAudit({
      actorId: admin.sub,
      actorEmail: admin.email,
      action: 'lexicon.synonymsUpdate',
      targetType: 'LexicalEntry',
      targetId: params.id,
      before: { lexeme: before.lexeme, acceptedAnswers: before.acceptedAnswers },
      after: { acceptedAnswers: updated.acceptedAnswers },
    })

    return NextResponse.json({ ok: true, entry: updated })
  } catch (err) {
    logError('api/admin/lexicon/[id]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
