import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

// GET /api/admin/institutions
export async function GET() {
  if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const institutions = await prisma.institution.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { courses: true } } },
  })
  return NextResponse.json({ institutions })
}

// POST /api/admin/institutions — create new
export async function POST(req: NextRequest) {
  if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  try {
    const institution = await prisma.institution.create({ data: { name: name.trim() } })
    return NextResponse.json({ institution })
  } catch {
    return NextResponse.json({ error: 'Institution already exists' }, { status: 409 })
  }
}
