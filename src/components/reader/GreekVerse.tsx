'use client'
import type { BiblicalVerse, VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { GreekWord } from './GreekWord'

interface GreekVerseProps {
  verse: BiblicalVerse
  activeWordId: string | null
  bsbHighlightPos?: number | null  // Greek word position highlighted from BSB English hover
  highlighted: boolean
  searchWord?: string      // normalized — passed to each GreekWord for red highlighting
  onWordHover: (wordId: string | null, info: LexicalInfoPanel | null) => void
  onWordClick: (info: LexicalInfoPanel | null) => void
  onWordRightClick?: (word: VerseWord, x: number, y: number) => void
  verseRefCallback?: (el: HTMLElement | null) => void
}

// Strip LXX-variant suffixes so "JoshB" → "Josh", "DanLXX" → "Dan", etc.
function displayAbbrev(bookId: string): string {
  return bookId.replace(/(B|Gr|LXX)$/, '')
}

function VerseRef({ verse }: { verse: BiblicalVerse }) {
  return (
    <span className="text-xs font-semibold text-brand-500 mr-2 select-none whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
      {displayAbbrev(verse.bookId)} {verse.chapter}:{verse.verse}
    </span>
  )
}

export function GreekVerse({
  verse, activeWordId, bsbHighlightPos, highlighted, searchWord, onWordHover, onWordClick, onWordRightClick, verseRefCallback
}: GreekVerseProps) {
  const baseClass = `greek-text mb-2 rounded px-1 transition-colors ${highlighted ? 'bg-brand-50 ring-1 ring-brand-300' : ''}`

  if (verse.words && verse.words.length > 0) {
    return (
      <p className={baseClass} ref={verseRefCallback}>
        <VerseRef verse={verse} />
        {verse.words.map((w, i) => (
          <>
            <GreekWord
              key={w.id}
              word={w}
              reference={verse.reference}
              isActive={w.id === activeWordId}
              searchWord={searchWord}

              isBsbHighlight={bsbHighlightPos != null && w.position === bsbHighlightPos}
              onHover={info => onWordHover(info ? w.id : null, info)}
              onClick={onWordClick}
              onRightClick={onWordRightClick}
            />
            {i < verse.words!.length - 1 ? ' ' : ''}
          </>
        ))}
      </p>
    )
  }

  const tokens = verse.text.split(/\s+/)
  return (
    <p className={baseClass} ref={verseRefCallback}>
      <VerseRef verse={verse} />
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
              searchWord={searchWord}

              onHover={info => onWordHover(info ? fakeWord.id : null, info)}
              onClick={onWordClick}
              onRightClick={onWordRightClick}
            />
            {' '}
          </>
        )
      })}
    </p>
  )
}
