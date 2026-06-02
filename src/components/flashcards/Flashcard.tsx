'use client'
import { useState, useEffect } from 'react'
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
  // Drive a brief scale-to-zero → swap content → scale-back animation
  const [flipping, setFlipping] = useState(false)
  const [showing, setShowing] = useState<'front' | 'back'>('front')

  // Sync when parent flips (e.g. advancing to next card resets isFlipped)
  useEffect(() => {
    if (!isFlipped && showing === 'back') {
      // Animate back to front
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
        /* ── Front ── */
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
        /* ── Back ── */
        <div className="bg-white flex flex-col min-h-[14rem]">
          {/* Answer — tap to flip back */}
          <div
            className="flex-1 flex flex-col items-center justify-center px-8 py-6 cursor-pointer"
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            aria-label="Flip back"
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleFlip()}
          >
            <p className="greek-text text-2xl text-brand-800 font-semibold text-center mb-1">
              {card.backLexeme}
            </p>
            <p className="text-xl text-gray-800 font-semibold text-center">{card.backGloss}</p>
            {card.backParsing && (
              <p className="text-sm text-gray-500 text-center mt-2">{card.backParsing}</p>
            )}
            <p className="text-xs text-gray-300 mt-3">Tap to flip back</p>
          </div>

          {/* Controls pinned to the bottom of the card */}
          <div className="flex border-t border-gray-100">
            <button
              onClick={e => { e.stopPropagation(); onDontKnow() }}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              <XCircle size={18} /> Don&apos;t Know
            </button>
            <div className="w-px bg-gray-100" />
            <button
              onClick={e => { e.stopPropagation(); onKnow() }}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold text-green-600 hover:bg-green-50 active:bg-green-100 transition-colors"
            >
              <CheckCircle size={18} /> Know It
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
