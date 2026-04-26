import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getFlashcardDeck, upsertProgress } from '@/lib/flashcards'
import type { FrequencyLevel } from '@/types/flashcard'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

export async function GET(req: NextRequest) {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const level = (req.nextUrl.searchParams.get('level') ?? 'BEGINNING') as FrequencyLevel
  const cards = await getFlashcardDeck(level, payload.sub)
  return NextResponse.json({ cards })
}

export async function POST(req: NextRequest) {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { flashcardId, easeFactor, interval, repetitions, nextReviewDate } = body

  const progress = await upsertProgress(payload.sub, flashcardId, {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: new Date(nextReviewDate),
    lastReviewDate: new Date(),
    knownCount: body.knew ? 1 : 0,
    unknownCount: body.knew ? 0 : 1,
  })

  return NextResponse.json({ progress })
}
