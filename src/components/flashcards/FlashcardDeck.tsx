'use client'
import { useState, useCallback } from 'react'
import { Flashcard } from './Flashcard'
import { DeckSelector } from './DeckSelector'
import { Button } from '@/components/ui/Button'
import { Shuffle, CheckCircle, XCircle } from 'lucide-react'
import type { FlashcardWithProgress, FrequencyLevel } from '@/types/flashcard'
import { sm2 } from '@/lib/spaced-repetition'

interface FlashcardDeckProps {
  initialCards: FlashcardWithProgress[]
  initialLevel: FrequencyLevel
  onLevelChange?: (level: FrequencyLevel) => void
  deckCounts: { BEGINNING: number; INTERMEDIATE: number }
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

type Response = 'know' | 'hard' | 'again'

const QUALITY: Record<Response, 0 | 1 | 2 | 3 | 4 | 5> = {
  know:  4,
  hard:  3,
  again: 1,
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

  const advance = useCallback(async (response: Response) => {
    if (!card) return

    const quality = QUALITY[response]
    const knew = response !== 'again'
    const prev = card.progress
    const updated = sm2({
      easeFactor: prev?.easeFactor ?? 2.5,
      interval: prev?.interval ?? 1,
      repetitions: prev?.repetitions ?? 0,
      quality,
    })

    setStats(s => ({ ...s, known: s.known + (knew ? 1 : 0), unknown: s.unknown + (knew ? 0 : 1) }))

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
        <div className="flex justify-end gap-3">
          <Button onClick={() => { setIdx(0); setIsFlipped(false); setFinished(false); setStats({ known: 0, unknown: 0 }) }}>
            Review Again
          </Button>
          <Button variant="secondary" onClick={handleShuffle}>Shuffle &amp; Restart</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Deck selector + shuffle */}
      <div className="flex items-center justify-between gap-4">
        <DeckSelector value={level} onChange={handleLevelChange} counts={deckCounts} />
        <Button variant="ghost" size="sm" onClick={handleShuffle} className="shrink-0">
          <Shuffle size={15} /> Shuffle
        </Button>
      </div>

      {card ? (
        <>
          {/* Progress strip */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle size={12} /> {stats.known}
              </span>
              <span className="flex items-center gap-1 text-red-400 font-medium">
                <XCircle size={12} /> {stats.unknown}
              </span>
            </span>
            <span>{idx + 1} / {cards.length}</span>
          </div>

          {/* Card + response buttons side by side */}
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <Flashcard
                card={card}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(f => !f)}
              />
            </div>

            {/* Response buttons — only visible after flip */}
            <div className="flex flex-col items-stretch gap-2 w-24 shrink-0">
              <Button
                onClick={() => advance('know')}
                disabled={!isFlipped}
                className={`py-3 text-sm font-semibold transition-opacity ${!isFlipped ? 'opacity-0 pointer-events-none' : ''}`}
              >
                Got it
              </Button>
              <div className={`flex gap-1.5 transition-opacity ${!isFlipped ? 'opacity-0 pointer-events-none' : ''}`}>
                <button
                  onClick={() => advance('again')}
                  className="flex-1 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  Again
                </button>
                <button
                  onClick={() => advance('hard')}
                  className="flex-1 py-2 text-xs font-medium rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 active:bg-amber-100 transition-colors"
                >
                  Hard
                </button>
              </div>
            </div>
          </div>

          {!isFlipped && (
            <p className="text-center text-xs text-gray-400">Tap the card to reveal the answer</p>
          )}
        </>
      ) : (
        <p className="text-gray-400 italic text-sm text-center py-8">No cards in this deck.</p>
      )}
    </div>
  )
}
