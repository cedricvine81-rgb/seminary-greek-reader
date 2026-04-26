'use client'
import type { BiblicalVerse, VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { GreekWord } from './GreekWord'

interface GreekVerseProps {
  verse: BiblicalVerse
  activeWordId: string | null
  onWordHover: (wordId: string | null, info: LexicalInfoPanel | null) => void
}

export function GreekVerse({ verse, activeWordId, onWordHover }: GreekVerseProps) {
  if (verse.words && verse.words.length > 0) {
    return (
      <p className="greek-text mb-3">
        <sup className="verse-number">{verse.verse}</sup>
        {verse.words.map((w, i) => (
          <>
            <GreekWord
              key={w.id}
              word={w}
              reference={verse.reference}
              isActive={w.id === activeWordId}
              onHover={info => onWordHover(info ? w.id : null, info)}
            />
            {i < verse.words!.length - 1 ? ' ' : ''}
          </>
        ))}
      </p>
    )
  }

  // Fallback: render plain text with simple word splitting
  const tokens = verse.text.split(/\s+/)
  return (
    <p className="greek-text mb-3">
      <sup className="verse-number">{verse.verse}</sup>
      {tokens.map((token, i) => {
        const fakeWord: VerseWord = {
          id: `${verse.id}-${i}`,
          verseId: verse.id,
          position: i,
          surface: token,
        }
        return (
          <>
            <GreekWord
              key={fakeWord.id}
              word={fakeWord}
              reference={verse.reference}
              isActive={fakeWord.id === activeWordId}
              onHover={info => onWordHover(info ? fakeWord.id : null, info)}
            />
            {' '}
          </>
        )
      })}
    </p>
  )
}
