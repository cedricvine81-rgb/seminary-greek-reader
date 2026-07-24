import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Saved quiz-series configurations, so a semester's series can be rebuilt next term
 * with one click. Templates are personal to the instructor who saved them.
 *
 * GET            → list this instructor's templates (newest first)
 * POST   { name, quizType, config }  → save (same name overwrites — resaving updates)
 * DELETE { id }  → remove
 */

function auth() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload && payload.role === 'INSTRUCTOR' ? payload : null
}

export async function GET() {
  const payload = auth()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const templates = await prisma.seriesTemplate.findMany({
    where: { ownerId: payload.sub },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, quizType: true, config: true, createdAt: true },
  })
  return NextResponse.json({ templates })
}

export async function POST(req: NextRequest) {
  const payload = auth()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, quizType, config } = await req.json()
  if (!name?.trim() || !quizType || !config) {
    return NextResponse.json({ error: 'A name, quiz type and configuration are required.' }, { status: 400 })
  }
  // One template per name per instructor: saving under an existing name updates it.
  const existing = await prisma.seriesTemplate.findFirst({
    where: { ownerId: payload.sub, name: name.trim() },
  })
  const t = existing
    ? await prisma.seriesTemplate.update({
        where: { id: existing.id },
        data: { quizType, config },
      })
    : await prisma.seriesTemplate.create({
        data: { ownerId: payload.sub, name: name.trim(), quizType, config },
      })
  return NextResponse.json({ id: t.id, updated: !!existing })
}

export async function DELETE(req: NextRequest) {
  const payload = auth()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const t = await prisma.seriesTemplate.findUnique({ where: { id } })
  if (!t || t.ownerId !== payload.sub) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }
  await prisma.seriesTemplate.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
