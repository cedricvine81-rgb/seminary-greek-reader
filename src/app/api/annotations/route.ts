import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requireStudentAccess } from '@/lib/subscription'

// Highlights and margin notes on the app's own prose (the Grammar chapters). Same auth and
// subscription gate as /api/highlights — annotations are part of "saved progress and notes".

const SELECT = {
  id: true, page: true, blockId: true, locale: true,
  startOffset: true, endOffset: true, quote: true, fp: true, color: true, body: true,
} as const

// A note is prose the reader wrote; the quote is a slice of a paragraph. Both are bounded so
// a malformed client can't post a novel into a column that is read on every chapter open.
const MAX_BODY = 20_000
const MAX_QUOTE = 2_000

// GET: every annotation this user has on one page — ?surface=&page=
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    const p = req.nextUrl.searchParams
    const page = p.get('page')
    if (!page) return NextResponse.json({ error: 'Missing page' }, { status: 400 })
    const annotations = await prisma.blockAnnotation.findMany({
      where: { userId: payload.sub, surface: p.get('surface') ?? 'morphology', page },
      select: SELECT,
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ annotations })
  } catch (err) {
    logError('api/annotations GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    const b = await req.json()
    if (!b.page || !b.blockId || b.startOffset == null || b.endOffset == null || !b.fp) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (Number(b.endOffset) <= Number(b.startOffset)) {
      return NextResponse.json({ error: 'Empty range' }, { status: 400 })
    }
    const annotation = await prisma.blockAnnotation.create({
      data: {
        userId: payload.sub,
        surface: typeof b.surface === 'string' ? b.surface : 'morphology',
        page: String(b.page),
        blockId: String(b.blockId),
        locale: typeof b.locale === 'string' ? b.locale : 'en',
        startOffset: Number(b.startOffset),
        endOffset: Number(b.endOffset),
        quote: String(b.quote ?? '').slice(0, MAX_QUOTE),
        fp: String(b.fp),
        color: typeof b.color === 'string' ? b.color : 'yellow',
        body: String(b.body ?? '').slice(0, MAX_BODY),
      },
      select: SELECT,
    })
    return NextResponse.json({ annotation }, { status: 201 })
  } catch (err) {
    logError('api/annotations POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// PATCH ?id= — recolour, or edit the note. Also re-stamps the anchor, which is how a
// repaired annotation stops being repaired: once the reader touches it we save the offsets
// and fingerprint it resolved to, so the next open is an exact match again.
export async function PATCH(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const b = await req.json()
    const data: Record<string, unknown> = {}
    if (typeof b.color === 'string') data.color = b.color
    if (typeof b.body === 'string') data.body = b.body.slice(0, MAX_BODY)
    if (b.startOffset != null && b.endOffset != null && typeof b.fp === 'string') {
      data.startOffset = Number(b.startOffset)
      data.endOffset = Number(b.endOffset)
      data.fp = b.fp
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    // updateMany, not update: it scopes by userId in the same statement, so one user cannot
    // edit another's annotation by guessing an id.
    const { count } = await prisma.blockAnnotation.updateMany({ where: { id, userId: payload.sub }, data })
    if (count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const annotation = await prisma.blockAnnotation.findUnique({ where: { id }, select: SELECT })
    return NextResponse.json({ annotation })
  } catch (err) {
    logError('api/annotations PATCH', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await prisma.blockAnnotation.deleteMany({ where: { id, userId: payload.sub } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/annotations DELETE', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
