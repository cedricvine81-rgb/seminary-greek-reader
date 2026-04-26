'use client'
import { clsx } from 'clsx'
import type { FrequencyLevel } from '@/types/flashcard'

interface DeckSelectorProps {
  value: FrequencyLevel
  onChange: (level: FrequencyLevel) => void
  counts?: { BEGINNING: number; INTERMEDIATE: number }
}

export function DeckSelector({ value, onChange, counts }: DeckSelectorProps) {
  const decks: { level: FrequencyLevel; label: string; sublabel: string }[] = [
    { level: 'BEGINNING', label: 'Beginning Greek', sublabel: 'NT words used 50+ times' },
    { level: 'INTERMEDIATE', label: 'Intermediate Greek', sublabel: 'NT words used 30+ times' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {decks.map(({ level, label, sublabel }) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          className={clsx(
            'p-4 rounded-xl border-2 text-left transition-colors',
            value === level
              ? 'border-brand-600 bg-brand-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <p className="font-semibold text-gray-900 text-sm">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>
          {counts && (
            <p className="text-xs font-medium text-brand-600 mt-1">{counts[level]} cards</p>
          )}
        </button>
      ))}
    </div>
  )
}
