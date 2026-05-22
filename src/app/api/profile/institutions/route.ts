import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export async function GET() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Collect distinct institution names from both User records and the Institution model
  const [userInstitutions, institutionRecords] = await Promise.all([
    prisma.user.findMany({
      where: { institution: { not: null } },
      select: { institution: true },
      distinct: ['institution'],
    }),
    prisma.institution.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const fromUsers = userInstitutions
    .map(u => u.institution as string)
    .filter(Boolean)

  const fromInstitutions = institutionRecords.map(i => i.name)

  const merged = Array.from(new Set([...fromInstitutions, ...fromUsers])).sort()

  return NextResponse.json({ institutions: merged })
}
