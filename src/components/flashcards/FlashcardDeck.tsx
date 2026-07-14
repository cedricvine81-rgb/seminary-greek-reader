'use client'
import { useState, useCallback, useEffect } from 'react'
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
    // If the card hasn't been revealed yet, flip it first instead of advancing
    if (!isFlipped) {
      setIsFlipped(true)
      return
    }

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
  }, [card, idx, cards.length, isFlipped])

  // Desktop keyboard controls:
  //  Enter — flip between Greek and Greek + translation
  //  ←     — previous card
  //  →     — next card
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (finished || !card) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      switch (e.key) {
        case 'Enter':
          e.preventDefault()
          setIsFlipped(f => !f)
          break
        case 'ArrowLeft':
          e.preventDefault()
          setIdx(i => Math.max(0, i - 1))
          setIsFlipped(false)
          break
        case 'ArrowRight':
          e.preventDefault()
          setIdx(i => Math.min(cards.length - 1, i + 1))
          setIsFlipped(false)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finished, card, cards.length])

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
      {/* Frequency deck selector — own full-width row so it's always visible */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Choose a deck</p>
        <DeckSelector value={level} onChange={handleLevelChange} counts={deckCounts} />
      </div>

      {card ? (
        <>
          {/* Progress strip + shuffle */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle size={12} /> {stats.known}
              </span>
              <span className="flex items-center gap-1 text-red-400 font-medium">
                <XCircle size={12} /> {stats.unknown}
              </span>
            </span>
            <span className="flex items-center gap-3">
              <span>{idx + 1} / {cards.length}</span>
              <button
                onClick={handleShuffle}
                className="inline-flex items-center gap-1 text-gray-500 hover:text-brand-700 font-medium"
              >
                <Shuffle size={13} /> Shuffle
              </button>
            </span>
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

            {/* Response buttons — permanently visible to the right of the card */}
            <div className="flex flex-col gap-2 w-28 shrink-0">
              <Button onClick={() => advance('know')} variant="primary" size="sm" className="w-full py-3 text-sm font-semibold">
                Got it
              </Button>
              <Button onClick={() => advance('again')} variant="danger" size="sm" className="w-full">
                Again
              </Button>
              <Button onClick={() => advance('hard')} variant="secondary" size="sm" className="w-full">
                Hard
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-400 italic text-sm text-center py-8">No cards in this deck.</p>
      )}
    </div>
  )
}
