'use client'
import { Fragment, memo } from 'react'
import type { BiblicalVerse, VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { HebrewLexicon } from '@/lib/hebrew-lexicon'
import { HebrewWord } from './HebrewWord'

interface HebrewVerseProps {
  verse: BiblicalVerse
  activeWordId: string | null
  highlighted: boolean
  lexicon: HebrewLexicon | null
  onWordHover: (wordId: string | null, info: LexicalInfoPanel | null) => void
  onWordClick: (info: LexicalInfoPanel | null) => void
  onWordRightClick?: (word: VerseWord, x: number, y: number) => void
  verseRefCallback?: (el: HTMLElement | null) => void
}

function HebrewVerseImpl({
  verse, activeWordId, highlighted, lexicon, onWordHover, onWordClick, onWordRightClick, verseRefCallback,
}: HebrewVerseProps) {
  const cls = `font-hebrew leading-loose mb-1 px-1 rounded ${highlighted ? 'bg-brand-50 ring-1 ring-brand-300' : ''}`

  // No per-word data (shouldn't happen for MT, but stay safe): render the plain verse text.
  if (!verse.words || verse.words.length === 0) {
    return (
      <p dir="rtl" ref={verseRefCallback} className={cls} style={{ fontSize: 'var(--greek-fs, 1.125rem)' }}>
        <sup className="text-[11px] text-gray-400 mx-1 font-sans align-super">{verse.verse}</sup>
        {verse.text}
      </p>
    )
  }

  return (
    <p dir="rtl" ref={verseRefCallback} className={cls} style={{ fontSize: 'var(--greek-fs, 1.125rem)' }}>
      <sup className="text-[11px] text-gray-400 mx-1 font-sans align-super">{verse.verse}</sup>
      {verse.words.map((w, i) => (
        <Fragment key={w.id}>
          <HebrewWord
            word={w}
            reference={verse.reference}
            isActive={w.id === activeWordId}
            lexicon={lexicon}
            onHover={info => onWordHover(info ? w.id : null, info)}
            onClick={onWordClick}
            onRightClick={onWordRightClick}
          />
          {/* Maqqef joins directly (no space); otherwise a normal space between words. */}
          {i < verse.words!.length - 1 ? (w.after === '־' ? '־' : ' ') : ''}
        </Fragment>
      ))}
    </p>
  )
}

function areEqual(prev: HebrewVerseProps, next: HebrewVerseProps): boolean {
  if (prev.verse !== next.verse) return false
  if (prev.highlighted !== next.highlighted) return false
  if (prev.lexicon !== next.lexicon) return false
  const prefix = next.verse.id + '.'
  const prevMine = !!prev.activeWordId && prev.activeWordId.startsWith(prefix)
  const nextMine = !!next.activeWordId && next.activeWordId.startsWith(prefix)
  if ((prevMine || nextMine) && prev.activeWordId !== next.activeWordId) return false
  return true
}

export const HebrewVerse = memo(HebrewVerseImpl, areEqual)
