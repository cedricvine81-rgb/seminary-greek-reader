'use client'
import React, { useRef, memo } from 'react'
import { clsx } from 'clsx'
import type { VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { formatParsing } from '@/lib/morph-formatting'
import { normalizeGreek } from '@/lib/greek-utils'
import { highlightMarkClass } from '@/lib/highlight-colors'

interface GreekWordProps {
  word: VerseWord
  reference: string
  /** The case this word governs, when it is a preposition — see LexicalInfoPanel.objectCase. */
  objectCase?: string
  isActive: boolean
  isBsbHighlight?: boolean  // highlighted because the corresponding BSB English token is hovered
  searchWord?: string   // normalized search term — word is highlighted if it matches
  searchLemma?: string  // normalized lemma — word highlighted if its lemma matches (e.g. "all forms")
  // Persisted text highlight covering this word, if any (see src/components/highlights).
  highlightId?: string
  highlightColor?: string
  hlBook?: string
  hlChapter?: number
  onHover: (info: LexicalInfoPanel | null) => void
  onClick: (info: LexicalInfoPanel | null) => void
  onRightClick?: (word: VerseWord, x: number, y: number) => void
}

function GreekWordImpl({ word, reference, objectCase, isActive, isBsbHighlight, searchWord, searchLemma, highlightId, highlightColor, hlBook, hlChapter, onHover, onClick, onRightClick }: GreekWordProps) {
  // Long-press state for touch devices (fires the same handler as desktop right-click)
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressCoords = useRef<{ x: number; y: number } | null>(null)
  // True once THIS touch's long-press has opened the word menu. iOS then fires synthetic
  // mousedown+click on the word ~300ms after the finger lifts, and the menu closes itself on
  // any outside mousedown — so the menu used to vanish the instant it appeared. Preventing
  // the default on that touchend suppresses the synthetic mouse events and the menu stays.
  const longPressFired  = useRef(false)

  function handleTouchStart(e: React.TouchEvent) {
    if (!onRightClick) return
    longPressFired.current = false
    const touch = e.touches[0]
    longPressCoords.current = { x: touch.clientX, y: touch.clientY }
    longPressTimer.current = setTimeout(() => {
      if (longPressCoords.current) {
        longPressFired.current = true
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

  function handleTouchEnd(e: React.TouchEvent) {
    cancelLongPress()
    if (longPressFired.current) {
      e.preventDefault()
      longPressFired.current = false
    }
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
      objectCase,
    }
  }

  const isMatch =
    (!!searchWord && normalizeGreek(word.surface).includes(searchWord)) ||
    (!!searchLemma && normalizeGreek(word.lexeme?.lexeme ?? '') === searchLemma)

  const bsbStyle = isBsbHighlight && !isMatch
    ? { color: 'rgb(220 38 38)', fontWeight: 500 } as React.CSSProperties
    : undefined

  return (
    <span
      className={clsx(
        'greek-word cursor-pointer',
        isActive && 'active',
        isMatch && 'text-red-600 font-semibold',
        highlightColor && highlightMarkClass(highlightColor),
      )}
      style={bsbStyle}
      {...(highlightId ? { 'data-highlight-id': highlightId, 'data-hl-book': hlBook, 'data-hl-chapter': hlChapter, 'data-hl-color': highlightColor } : {})}
      onMouseEnter={() => onHover(buildInfo())}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(buildInfo())}
      onContextMenu={onRightClick ? e => { e.preventDefault(); onRightClick(word, e.clientX, e.clientY) } : undefined}
      data-longpress-own=""
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={cancelLongPress}
      onTouchCancel={cancelLongPress}
    >
      {word.surface}
    </span>
  )
}

// Memoized: within a verse that re-renders (e.g. a hover moved the active word), only the
// words whose visual props actually changed should re-render. The word object is stable in
// state and the handlers behave stably, so their identity is intentionally not compared.
function areEqual(prev: GreekWordProps, next: GreekWordProps): boolean {
  return (
    prev.word === next.word &&
    prev.reference === next.reference &&
    prev.objectCase === next.objectCase &&
    prev.isActive === next.isActive &&
    prev.isBsbHighlight === next.isBsbHighlight &&
    prev.searchWord === next.searchWord &&
    prev.searchLemma === next.searchLemma &&
    prev.highlightId === next.highlightId &&
    prev.highlightColor === next.highlightColor &&
    prev.hlBook === next.hlBook &&
    prev.hlChapter === next.hlChapter
  )
}

export const GreekWord = memo(GreekWordImpl, areEqual)
