import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { FlashcardDeck } from '@/components/flashcards/FlashcardDeck'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getFlashcardDeck } from '@/lib/flashcards'

export const metadata: Metadata = { title: 'Flashcards' }

export default async function FlashcardsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'STUDENT') redirect('/auth/sign-in')

  const [beginningCards, intermediateCards] = await Promise.all([
    getFlashcardDeck('BEGINNING', payload.sub),
    getFlashcardDeck('INTERMEDIATE', payload.sub),
  ])

  const serialize = (cards: typeof beginningCards) =>
    cards.map(c => ({
      ...c,
      progress: c.progress
        ? {
            ...c.progress,
            nextReviewDate: c.progress.nextReviewDate.toISOString(),
            lastReviewDate: c.progress.lastReviewDate?.toISOString() ?? undefined,
          }
        : null,
    }))

  return (
    <DashboardShell role="STUDENT" pageTitle="Flashcards" pageDescription="Study Greek vocabulary with spaced repetition.">
      <div className="max-w-lg mx-auto">
        <FlashcardDeck
          initialCards={serialize(beginningCards) as never}
          initialLevel="BEGINNING"
          deckCounts={{ BEGINNING: beginningCards.length, INTERMEDIATE: intermediateCards.length }}
        />
      </div>
    </DashboardShell>
  )
}
