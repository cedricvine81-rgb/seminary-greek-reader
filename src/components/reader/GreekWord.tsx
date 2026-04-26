'use client'
import { clsx } from 'clsx'
import type { VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { formatParsing } from '@/lib/reader'

interface GreekWordProps {
  word: VerseWord
  reference: string
  isActive: boolean
  onHover: (info: LexicalInfoPanel | null) => void
}

export function GreekWord({ word, reference, isActive, onHover }: GreekWordProps) {
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

  return (
    <span
      className={clsx('greek-word', isActive && 'active')}
      onMouseEnter={() => onHover(buildInfo())}
      onMouseLeave={() => onHover(null)}
    >
      {word.surface}
    </span>
  )
}
