import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

// PATCH /api/admin/institutions/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  try {
    const institution = await prisma.institution.update({
      where: { id: params.id },
      data: { name: name.trim() },
    })
    return NextResponse.json({ institution })
  } catch {
    return NextResponse.json({ error: 'Name already taken' }, { status: 409 })
  }
}

// DELETE /api/admin/institutions/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.institution.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
