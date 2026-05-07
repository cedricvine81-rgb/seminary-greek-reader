'use client'
import { useState, useCallback } from 'react'
import { Flashcard } from './Flashcard'
import { SpacedRepetitionControls } from './SpacedRepetitionControls'
import { DeckSelector } from './DeckSelector'
import { Button } from '@/components/ui/Button'
import { Shuffle } from 'lucide-react'
import type { FlashcardWithProgress, FrequencyLevel, FlashcardResponse } from '@/types/flashcard'
import { sm2, responseToQuality } from '@/lib/spaced-repetition'

interface FlashcardDeckProps {
  initialCards: FlashcardWithProgress[]
  initialLevel: FrequencyLevel
  onLevelChange?: (level: FrequencyLevel) => void
  deckCounts: { BEGINNING: number; INTERMEDIATE: number }
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export function FlashcardDeck({ initialCards, initialLevel, onLevelChange, deckCounts }: FlashcardDeckProps) {
  const [level, setLevel] = useState(initialLevel)
  const [cards, setCards] = useState(initialCards)
  const [idx, setIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [stats, setStats] = useState({ known: 0, unknown: 0 })
  const [finished, setFinished] = useState(false)

  const card = cards[idx]

  function handleLevelChange(newLevel: FrequencyLevel) {
    setLevel(newLevel)
    onLevelChange?.(newLevel)
    setIdx(0)
    setIsFlipped(false)
    setStats({ known: 0, unknown: 0 })
    setFinished(false)
  }

  function handleShuffle() {
    setCards(c => shuffle(c))
    setIdx(0)
    setIsFlipped(false)
    setFinished(false)
  }

  const advance = useCallback(async (knew: boolean) => {
    if (!card) return

    const quality = responseToQuality(knew)
    const prev = card.progress
    const updated = sm2({
      easeFactor: prev?.easeFactor ?? 2.5,
      interval: prev?.interval ?? 1,
      repetitions: prev?.repetitions ?? 0,
      quality,
    })

    setStats(s => ({ ...s, known: s.known + (knew ? 1 : 0), unknown: s.unknown + (knew ? 0 : 1) }))

    // Persist to backend (fire-and-forget)
    fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcardId: card.id, knew, ...updated }),
    }).catch(() => {})

    if (idx + 1 >= cards.length) {
      setFinished(true)
    } else {
      setIdx(i => i + 1)
      setIsFlipped(false)
    }
  }, [card, idx, cards.length])

  if (finished) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-2xl font-bold text-brand-700">Session Complete!</p>
        <p className="text-gray-600">{stats.known} known · {stats.unknown} unknown out of {cards.length}</p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => { setIdx(0); setIsFlipped(false); setFinished(false); setStats({ known: 0, unknown: 0 }) }}>
            Review Again
          </Button>
          <Button variant="secondary" onClick={handleShuffle}>Shuffle & Restart</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <DeckSelector value={level} onChange={handleLevelChange} counts={deckCounts} />
        <Button variant="ghost" size="sm" onClick={handleShuffle} className="shrink-0">
          <Shuffle size={15} /> Shuffle
        </Button>
      </div>

      {card ? (
        <>
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>Card {idx + 1} of {cards.length}</span>
            {card.progress && (
              <span>Next review in {card.progress.interval} day{card.progress.interval !== 1 ? 's' : ''}</span>
            )}
          </div>
          <Flashcard card={card} isFlipped={isFlipped} onClick={() => setIsFlipped(f => !f)} />
          <SpacedRepetitionControls
            isFlipped={isFlipped}
            onKnow={() => advance(true)}
            onDontKnow={() => advance(false)}
            sessionStats={stats}
          />
        </>
      ) : (
        <p className="text-gray-400 italic text-sm text-center py-8">No cards in this deck.</p>
      )}
    </div>
  )
}
