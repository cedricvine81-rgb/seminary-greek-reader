'use client'
import { clsx } from 'clsx'
import type { FlashcardWithProgress } from '@/types/flashcard'

interface FlashcardProps {
  card: FlashcardWithProgress
  isFlipped: boolean
  onClick: () => void
}

export function Flashcard({ card, isFlipped, onClick }: FlashcardProps) {
  return (
    <div
      className="flashcard-container w-full h-56 cursor-pointer select-none"
      onClick={onClick}
      role="button"
      aria-label="Flip flashcard"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? onClick() : undefined}
    >
      <div className={clsx('flashcard-inner w-full h-full', isFlipped && 'flipped')}>
        {/* Front */}
        <div className="flashcard-face bg-brand-800 rounded-2xl flex flex-col items-center justify-center p-8 shadow-lg">
          <p className="greek-text text-4xl text-parchment-100 font-medium text-center">
            {card.front}
          </p>
          <p className="text-brand-300 text-xs mt-4">Click to reveal</p>
        </div>

        {/* Back */}
        <div className="flashcard-face flashcard-back bg-white rounded-2xl border-2 border-brand-100 flex flex-col items-center justify-center p-8 shadow-lg gap-2">
          <p className="greek-text text-2xl text-brand-800 font-medium text-center">
            {card.backLexeme}
          </p>
          <p className="text-lg text-gray-800 font-semibold text-center">{card.backGloss}</p>
          {card.backParsing && (
            <p className="text-sm text-gray-500 text-center mt-1">{card.backParsing}</p>
          )}
        </div>
      </div>
    </div>
  )
}
