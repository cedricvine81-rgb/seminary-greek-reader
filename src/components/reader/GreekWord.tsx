'use client'
import { clsx } from 'clsx'
import type { VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { formatParsing } from '@/lib/morph-formatting'
import { normalizeGreek } from '@/lib/greek-utils'

interface GreekWordProps {
  word: VerseWord
  reference: string
  isActive: boolean
  searchWord?: string   // normalized search term — word is highlighted if it matches
  onHover: (info: LexicalInfoPanel | null) => void
  onClick: (info: LexicalInfoPanel | null) => void
  onRightClick?: (word: VerseWord, x: number, y: number) => void
}

export function GreekWord({ word, reference, isActive, searchWord, onHover, onClick, onRightClick }: GreekWordProps) {
  function buildInfo(): LexicalInfoPanel | null {
    if (!word.lexeme) return null
    const parse = word.parses?.[0]
    return {
      surface: word.surface,
      lexeme: word.lexeme.lexeme,
      gloss: word.lexeme.gloss,
      extendedGloss: word.lexeme.extendedGloss ?? undefined,
      partOfSpeech: word.lexeme.partOfSpeech,
      parsing: parse ? formatParsing(parse) : word.lexeme.partOfSpeech,
      strongs: word.lexeme.strongs ?? undefined,
      reference,
    }
  }

  const isMatch = searchWord ? normalizeGreek(word.surface).includes(searchWord) : false

  return (
    <span
      className={clsx(
        'greek-word cursor-pointer',
        isActive && 'active',
        isMatch && 'text-red-600 font-semibold',
      )}
      onMouseEnter={() => onHover(buildInfo())}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(buildInfo())}
      onContextMenu={onRightClick ? e => { e.preventDefault(); onRightClick(word, e.clientX, e.clientY) } : undefined}
    >
      {word.surface}
    </span>
  )
}
