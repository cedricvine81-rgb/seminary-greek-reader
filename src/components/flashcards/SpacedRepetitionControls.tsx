'use client'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle } from 'lucide-react'

interface SpacedRepetitionControlsProps {
  isFlipped: boolean
  onKnow: () => void
  onDontKnow: () => void
  sessionStats: { known: number; unknown: number }
}

export function SpacedRepetitionControls({
  isFlipped, onKnow, onDontKnow, sessionStats,
}: SpacedRepetitionControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs text-gray-400">
        {isFlipped ? 'How did you do?' : 'Click the card to reveal the answer'}
      </p>

      {isFlipped && (
        <div className="flex gap-4">
          <Button
            variant="danger"
            onClick={onDontKnow}
            className="flex items-center gap-2 px-6"
          >
            <XCircle size={18} /> Don't Know
          </Button>
          <Button
            onClick={onKnow}
            className="flex items-center gap-2 px-6 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle size={18} /> Know It
          </Button>
        </div>
      )}

      <div className="flex gap-6 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <CheckCircle size={14} className="text-green-500" /> {sessionStats.known} known
        </span>
        <span className="flex items-center gap-1">
          <XCircle size={14} className="text-red-400" /> {sessionStats.unknown} unknown
        </span>
      </div>
    </div>
  )
}
