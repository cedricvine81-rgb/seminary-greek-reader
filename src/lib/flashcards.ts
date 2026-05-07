import { prisma } from './db'
import type { FrequencyLevel } from '@/types/flashcard'

export async function getFlashcardDeck(level: FrequencyLevel, userId?: string) {
  const cards = await prisma.flashcard.findMany({
    where: { level },
    include: { lexeme: true },
    orderBy: { lexeme: { frequency: 'desc' } },
  })

  if (!userId) return cards.map(card => ({ ...card, progress: null }))

  const progress = await prisma.flashcardProgress.findMany({
    where: { userId, flashcardId: { in: cards.map(c => c.id) } },
  })

  const progressMap = new Map(progress.map(p => [p.flashcardId, p]))

  return cards.map(card => ({
    ...card,
    progress: progressMap.get(card.id) ?? null,
  }))
}

export async function getDueCards(userId: string, level: FrequencyLevel) {
  const now = new Date()
  const progress = await prisma.flashcardProgress.findMany({
    where: {
      userId,
      nextReviewDate: { lte: now },
      flashcard: { level },
    },
    include: { flashcard: { include: { lexeme: true } } },
    orderBy: { nextReviewDate: 'asc' },
  })
  return progress.map(p => ({ ...p.flashcard, progress: p }))
}

export async function upsertProgress(
  userId: string,
  flashcardId: string,
  updates: Partial<{
    easeFactor: number
    interval: number
    repetitions: number
    nextReviewDate: Date
    lastReviewDate: Date
    knownCount: number
    unknownCount: number
  }>
) {
  return prisma.flashcardProgress.upsert({
    where: { userId_flashcardId: { userId, flashcardId } },
    update: { ...updates },
    create: { userId, flashcardId, ...updates },
  })
}
