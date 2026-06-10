import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export async function GET() {
  try {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only return instructor-created institutions from the Institution model.
  // Student free-text entries on User records are intentionally excluded.
  const records = await prisma.institution.findMany({
    select: { name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ institutions: records.map(r => r.name) })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
