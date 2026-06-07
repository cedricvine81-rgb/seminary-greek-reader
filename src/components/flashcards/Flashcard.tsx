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
    <div className={`flashcard-flip rounded-2xl shadow-md overflow-hidden select-none ${flipping ? 'flipping' : ''}`}>
      {showing === 'front' ? (
        <div
          className="bg-brand-800 flex flex-col items-center justify-between p-8 cursor-pointer min-h-[14rem]"
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          aria-label="Flip flashcard"
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleFlip()}
        >
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <p className="greek-text text-5xl text-parchment-100 font-medium text-center leading-tight">
              {card.front}
            </p>
          </div>
          <p className="text-brand-300 text-xs tracking-wide mt-4">Tap to reveal</p>
        </div>
      ) : (
        <div
          className="bg-white flex flex-col items-center justify-center px-8 min-h-[14rem] cursor-pointer"
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          aria-label="Flip flashcard back"
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleFlip()}
        >
          <p className="greek-text text-2xl text-brand-800 font-semibold text-center mb-1">
            {card.backLexeme}
          </p>
          <p className="text-xl text-gray-800 font-semibold text-center">{card.backGloss}</p>
          {card.backParsing && (
            <p className="text-sm text-gray-500 text-center mt-2">{card.backParsing}</p>
          )}
        </div>
      )}
    </div>
  )
}
