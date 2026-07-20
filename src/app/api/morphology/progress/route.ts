import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Morphology course-mode progress: which chapters the signed-in user has
// marked complete. Gated on login only (any role) — completion flags are
// harmless personal state, so no subscription check. Logged-out users keep
// their progress in localStorage client-side and never hit this route.

export async function GET() {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await prisma.morphologyProgress.findMany({
      where: { userId: payload.sub },
      select: { chapterId: true },
    })
    return NextResponse.json({ chapters: rows.map(r => r.chapterId) })
  } catch (e) {
    logError('morphology-progress GET', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const chapterId = body?.chapterId
    const completed = body?.completed
    // Chapter ids are the stable tab ids ("nouns", "2nd-aorists", …). Validate
    // shape rather than an exact list so adding a chapter needs no API change;
    // stray ids are harmless and cleaned up if a chapter is ever removed.
    if (typeof chapterId !== 'string' || !/^[a-z0-9-]{1,40}$/.test(chapterId) || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    if (completed) {
      await prisma.morphologyProgress.upsert({
        where: { userId_chapterId: { userId: payload.sub, chapterId } },
        create: { userId: payload.sub, chapterId },
        update: {},
      })
    } else {
      await prisma.morphologyProgress.deleteMany({ where: { userId: payload.sub, chapterId } })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    logError('morphology-progress POST', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
