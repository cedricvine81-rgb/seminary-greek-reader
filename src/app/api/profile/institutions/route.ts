import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'

// This route reads from the live database, so it must never be pre-rendered
// at build time. Marking it dynamic also stops Next.js from attempting to
// statically generate it (which would crash if DATABASE_URL is unset during build).
export const dynamic = 'force-dynamic'

// Public: the institution list populates the sign-up dropdown, shown to
// not-yet-authenticated visitors. Institution names are non-sensitive.
export async function GET() {
  try {
  // Only return instructor-created institutions from the Institution model.
  // Student free-text entries on User records are intentionally excluded.
  const records = await prisma.institution.findMany({
    select: { name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ institutions: records.map(r => r.name) })

  } catch (err) {
    logError('api/profile/institutions', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
