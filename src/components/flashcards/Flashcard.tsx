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
        /* ── Back — entire card is split into two tap zones ── */
        <div className="bg-white flex min-h-[14rem] relative">
          {/* Word content — centred overlay, pointer-events-none so taps pass through */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 pointer-events-none z-10">
            <p className="greek-text text-2xl text-brand-800 font-semibold text-center mb-1">
              {card.backLexeme}
            </p>
            <p className="text-xl text-gray-800 font-semibold text-center">{card.backGloss}</p>
            {card.backParsing && (
              <p className="text-sm text-gray-500 text-center mt-2">{card.backParsing}</p>
            )}
          </div>

          {/* Left half — Don't Know */}
          <button
            onClick={e => { e.stopPropagation(); onDontKnow() }}
            className="flex-1 flex flex-col items-center justify-end pb-4 gap-1 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-l-2xl"
            aria-label="Don't know"
          >
            <XCircle size={20} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400">Don&apos;t Know</span>
          </button>

          {/* Divider */}
          <div className="w-px bg-gray-100 self-stretch" />

          {/* Right half — Know It */}
          <button
            onClick={e => { e.stopPropagation(); onKnow() }}
            className="flex-1 flex flex-col items-center justify-end pb-4 gap-1 hover:bg-brand-50 active:bg-brand-100 transition-colors rounded-r-2xl"
            aria-label="Know it"
          >
            <CheckCircle size={20} className="text-brand-600" />
            <span className="text-xs font-medium text-brand-600">Know It</span>
          </button>
        </div>
      )}
    </div>
  )
}
