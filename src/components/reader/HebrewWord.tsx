'use client'
import React, { memo, useRef } from 'react'
import { clsx } from 'clsx'
import type { VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel, HebrewSegment } from '@/types/lexicon'
import { formatHebrewParse, hebrewMorphRole, hebrewPartOfSpeech } from '@/lib/hebrew-morph'
import { lookupHebrewStrongs, type HebrewLexicon } from '@/lib/hebrew-lexicon'
import { highlightMarkClass } from '@/lib/highlight-colors'

// Build the parsing-pane payload for a Hebrew word: dictionary lemma + transliteration + gloss
// from the Strong's lexicon, the decoded OSHB parse, and (for compounds) the prefix/suffix
// segment breakdown. Exported so the mobile sheet path can reuse it if needed.
export function buildHebrewInfo(word: VerseWord, reference: string, lex: HebrewLexicon | null): LexicalInfoPanel {
  const lang = word.lang ?? 'H'
  const entry = lookupHebrewStrongs(lex, word.strongs)

  const segments: HebrewSegment[] | undefined =
    word.morphemes && word.morphemes.length > 1
      ? word.morphemes.map(m => {
          const mEntry = /^\d/.test(m.strongs) ? lookupHebrewStrongs(lex, m.strongs) : null
          return { text: m.text, label: hebrewMorphRole(m.morph, lang), gloss: mEntry?.gloss }
        })
      : undefined

  return {
    surface: word.surface,
    lexeme: entry?.lemma ?? word.surface,
    gloss: entry?.gloss ?? '',
    partOfSpeech: hebrewPartOfSpeech(word.morph ?? ''),
    parsing: word.morph ? formatHebrewParse(word.morph, lang) : hebrewPartOfSpeech(word.morph ?? ''),
    strongs: word.strongs ? `H${word.strongs}` : undefined,
    reference,
    script: 'hebrew',
    transliteration: entry?.xlit || undefined,
    definition: entry?.def || undefined,
    segments,
  }
}

interface HebrewWordProps {
  word: VerseWord
  reference: string
  isActive: boolean
  lexicon: HebrewLexicon | null
  // Persisted highlight covering this word, if any (see src/components/highlights).
  highlightId?: string
  highlightColor?: string
  hlBook?: string
  hlChapter?: number
  onHover: (info: LexicalInfoPanel | null) => void
  onClick: (info: LexicalInfoPanel | null) => void
  onRightClick?: (word: VerseWord, x: number, y: number) => void
}

function HebrewWordImpl({ word, reference, isActive, lexicon, highlightId, highlightColor, hlBook, hlChapter, onHover, onClick, onRightClick }: HebrewWordProps) {
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressCoords = useRef<{ x: number; y: number } | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    if (!onRightClick) return
    const touch = e.touches[0]
    longPressCoords.current = { x: touch.clientX, y: touch.clientY }
    longPressTimer.current = setTimeout(() => {
      if (longPressCoords.current) onRightClick(word, longPressCoords.current.x, longPressCoords.current.y)
      longPressTimer.current = null
      longPressCoords.current = null
    }, 500)
  }
  function cancelLongPress() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
    longPressCoords.current = null
  }

  const info = () => buildHebrewInfo(word, reference, lexicon)

  return (
    <span
      className={clsx('greek-word cursor-pointer', isActive && 'active', highlightColor && highlightMarkClass(highlightColor))}
      {...(highlightId ? { 'data-highlight-id': highlightId, 'data-hl-book': hlBook, 'data-hl-chapter': hlChapter, 'data-hl-color': highlightColor } : {})}
      onMouseEnter={() => onHover(info())}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(info())}
      onContextMenu={onRightClick ? e => { e.preventDefault(); onRightClick(word, e.clientX, e.clientY) } : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
    >
      {word.surface}
    </span>
  )
}

function areEqual(prev: HebrewWordProps, next: HebrewWordProps): boolean {
  return (
    prev.word === next.word &&
    prev.reference === next.reference &&
    prev.isActive === next.isActive &&
    prev.lexicon === next.lexicon &&
    prev.highlightId === next.highlightId &&
    prev.highlightColor === next.highlightColor
  )
}

export const HebrewWord = memo(HebrewWordImpl, areEqual)
