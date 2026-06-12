import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** GET /api/admin/appeals/pending — count of appeals awaiting admin decision */
export async function GET() {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const count = await prisma.vocabAppeal.count({
      where: { instructorDecision: 'ACCEPTED', adminDecision: 'PENDING' },
    })
    return NextResponse.json({ count })
  } catch (err) {
    logError('api/admin/appeals/pending', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
