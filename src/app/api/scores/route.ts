import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getStudentScores } from '@/lib/scores'
import { requireStudentAccess } from '@/lib/subscription'

export async function GET(req: NextRequest) {
  try {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const gate = await requireStudentAccess(payload); if (gate) return gate

  const courseId = req.nextUrl.searchParams.get('courseId') ?? undefined
  const scores = await getStudentScores(payload.sub, courseId)
  return NextResponse.json({ scores })

  } catch (err) {
    logError('api/scores', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
