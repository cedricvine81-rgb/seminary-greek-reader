import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getStudentScores } from '@/lib/scores'

export async function GET(req: NextRequest) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courseId = req.nextUrl.searchParams.get('courseId') ?? undefined
  const scores = await getStudentScores(payload.sub, courseId)
  return NextResponse.json({ scores })
}
