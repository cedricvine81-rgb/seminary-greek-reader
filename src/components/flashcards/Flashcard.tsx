'use client'
import { useState, useEffect } from 'react'
import type { FlashcardWithProgress } from '@/types/flashcard'

interface FlashcardProps {
  card: FlashcardWithProgress
  isFlipped: boolean
  onFlip: () => void
}

export function Flashcard({ card, isFlipped, onFlip }: FlashcardProps) {
  const [flipping, setFlipping] = useState(false)
  const [showing, setShowing] = useState<'front' | 'back'>('front')

  useEffect(() => {
    if (isFlipped && showing === 'front') {
      setFlipping(true)
      const t = setTimeout(() => { setShowing('back'); setFlipping(false) }, 180)
      return () => clearTimeout(t)
    }
    if (!isFlipped && showing === 'back') {
      setFlipping(true)
      const t = setTimeout(() => { setShowing('front'); setFlipping(false) }, 180)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipped])

  function handleFlip() {
    if (flipping) return
    setFlipping(true)
    setTimeout(() => {
      setShowing(s => s === 'front' ? 'back' : 'front')
      setFlipping(false)
      onFlip()
    }, 180)
  }

  return (
    <div className={`flashcard-flip rounded-2xl shadow-md overflow-hidden select-none h-40 ${flipping ? 'flipping' : ''}`}>
      {showing === 'front' ? (
        <div
          className="bg-surface flex flex-col items-center justify-between p-6 cursor-pointer h-full border border-gray-100"
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          aria-label="Flip flashcard"
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleFlip()}
        >
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <p className="greek-text text-2xl text-brand-800 font-bold text-center leading-tight">
              {card.front}
            </p>
          </div>
          <p className="text-gray-400 text-xs tracking-wide mt-4 text-center leading-relaxed">
            Tap or <span className="font-medium">Enter</span> to reveal
            <span className="hidden sm:inline"> · <span className="font-medium">←</span> back · <span className="font-medium">→</span> next</span>
          </p>
        </div>
      ) : (
        <div
          className="bg-surface flex flex-col items-center justify-between py-6 px-8 h-full cursor-pointer"
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          aria-label="Flip flashcard back"
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleFlip()}
        >
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <p className="greek-text text-2xl text-brand-800 font-bold text-center mb-1">
              {card.backLexeme}
            </p>
            <p className="text-2xl text-gray-800 font-medium text-center">{card.backGloss}</p>
            {card.backParsing && (
              <p className="text-2xl text-gray-500 text-center mt-2">{card.backParsing}</p>
            )}
          </div>
          <p className="text-gray-400 text-xs tracking-wide mt-4 text-center leading-relaxed">
            Tap or <span className="font-medium">Enter</span> for Greek only
            <span className="hidden sm:inline"> · <span className="font-medium">←</span> back · <span className="font-medium">→</span> next</span>
          </p>
        </div>
      )}
    </div>
  )
}
