import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { getFlashcardDeck, upsertProgress } from '@/lib/flashcards'
import type { FrequencyLevel } from '@/types/flashcard'

export async function GET(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const level = (req.nextUrl.searchParams.get('level') ?? 'BEGINNING') as FrequencyLevel
  const cards = await getFlashcardDeck(level, payload.sub)
  return NextResponse.json({ cards })

  } catch (err) {
    logError('api/flashcards', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
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

  } catch (err) {
    logError('api/flashcards', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
