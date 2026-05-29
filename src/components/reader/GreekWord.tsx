'use client'
import React, { useRef } from 'react'
import { clsx } from 'clsx'
import type { VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { formatParsing } from '@/lib/morph-formatting'
import { normalizeGreek } from '@/lib/greek-utils'

interface GreekWordProps {
  word: VerseWord
  reference: string
  isActive: boolean
  isBsbHighlight?: boolean  // highlighted because the corresponding BSB English token is hovered
  searchWord?: string   // normalized search term — word is highlighted if it matches
  onHover: (info: LexicalInfoPanel | null) => void
  onClick: (info: LexicalInfoPanel | null) => void
  onRightClick?: (word: VerseWord, x: number, y: number) => void
}

export function GreekWord({ word, reference, isActive, isBsbHighlight, searchWord, onHover, onClick, onRightClick }: GreekWordProps) {
  // Long-press state for touch devices (fires the same handler as desktop right-click)
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressCoords = useRef<{ x: number; y: number } | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    if (!onRightClick) return
    const touch = e.touches[0]
    longPressCoords.current = { x: touch.clientX, y: touch.clientY }
    longPressTimer.current = setTimeout(() => {
      if (longPressCoords.current) {
        onRightClick(word, longPressCoords.current.x, longPressCoords.current.y)
      }
      longPressTimer.current  = null
      longPressCoords.current = null
    }, 500)
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    longPressCoords.current = null
  }

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

  const bsbStyle = isBsbHighlight && !isMatch
    ? { color: 'rgb(220 38 38)', fontWeight: 500 } as React.CSSProperties
    : undefined

  return (
    <span
      className={clsx(
        'greek-word cursor-pointer select-none',
        isActive && 'active',
        isMatch && 'text-red-600 font-semibold',
      )}
      style={bsbStyle}
      onMouseEnter={() => onHover(buildInfo())}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(buildInfo())}
      onContextMenu={onRightClick ? e => { e.preventDefault(); onRightClick(word, e.clientX, e.clientY) } : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
    >
      {word.surface}
    </span>
  )
}
