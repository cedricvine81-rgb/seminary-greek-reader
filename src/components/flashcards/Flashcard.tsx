'use client'
import { clsx } from 'clsx'
import { CheckCircle, XCircle } from 'lucide-react'
import type { FlashcardWithProgress } from '@/types/flashcard'

interface FlashcardProps {
  card: FlashcardWithProgress
  isFlipped: boolean
  onFlip: () => void
  onKnow: () => void
  onDontKnow: () => void
}

export function Flashcard({ card, isFlipped, onFlip, onKnow, onDontKnow }: FlashcardProps) {
  return (
    <div
      className="flashcard-container w-full cursor-pointer select-none"
      style={{ height: '18rem' }}
    >
      <div className={clsx('flashcard-inner w-full h-full', isFlipped && 'flipped')}>

        {/* ── Front face ── */}
        <div
          className="flashcard-face bg-brand-800 rounded-2xl flex flex-col items-center justify-between p-6 shadow-lg"
          onClick={onFlip}
          role="button"
          aria-label="Flip flashcard"
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onFlip()}
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="greek-text text-5xl text-parchment-100 font-medium text-center leading-tight">
              {card.front}
            </p>
          </div>
          <p className="text-brand-300 text-xs mt-2 tracking-wide">Tap to reveal</p>
        </div>

        {/* ── Back face ── */}
        <div className="flashcard-face flashcard-back bg-white rounded-2xl border border-brand-100 flex flex-col shadow-lg overflow-hidden">
          {/* Answer area — tap to flip back */}
          <div
            className="flex-1 flex flex-col items-center justify-center px-6 pt-5 pb-3 cursor-pointer"
            onClick={onFlip}
            role="button"
            aria-label="Flip back"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onFlip()}
          >
            <p className="greek-text text-2xl text-brand-800 font-medium text-center mb-1">
              {card.backLexeme}
            </p>
            <p className="text-xl text-gray-800 font-semibold text-center">{card.backGloss}</p>
            {card.backParsing && (
              <p className="text-sm text-gray-500 text-center mt-1">{card.backParsing}</p>
            )}
          </div>

          {/* Controls embedded at the bottom of the card */}
          <div className="flex border-t border-gray-100">
            <button
              onClick={e => { e.stopPropagation(); onDontKnow() }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors rounded-bl-2xl"
            >
              <XCircle size={17} /> Don&apos;t Know
            </button>
            <div className="w-px bg-gray-100" />
            <button
              onClick={e => { e.stopPropagation(); onKnow() }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-green-600 hover:bg-green-50 transition-colors rounded-br-2xl"
            >
              <CheckCircle size={17} /> Know It
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
