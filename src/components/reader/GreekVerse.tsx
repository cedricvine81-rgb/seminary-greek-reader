'use client'
import { Fragment } from 'react'
import type { BiblicalVerse, VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { GreekWord } from './GreekWord'
import { verseAnchorProps, withTokenOffsets, highlightAt } from '@/components/highlights/render'
import type { HighlightRecord } from '@/components/highlights/useHighlights'

interface GreekVerseProps {
  verse: BiblicalVerse
  activeWordId: string | null
  bsbHighlightPos?: number | null  // Greek word position highlighted from BSB English hover
  highlighted: boolean
  searchWord?: string      // normalized — passed to each GreekWord for red highlighting
  // Persisted text highlights covering this verse (see src/components/highlights). Also
  // adds the data-hl-* anchor the drag-to-highlight selection capture looks for.
  textHighlights?: HighlightRecord[]
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
  verse, activeWordId, bsbHighlightPos, highlighted, searchWord, textHighlights = [], onWordHover, onWordClick, onWordRightClick, verseRefCallback
}: GreekVerseProps) {
  const baseClass = `greek-text mb-2 rounded px-1 transition-colors ${highlighted ? 'bg-brand-50 ring-1 ring-brand-300' : ''}`
  const anchorProps = verseAnchorProps(verse.bookId, verse.chapter, verse.verse)

  if (verse.words && verse.words.length > 0) {
    const withOffsets = withTokenOffsets(verse.words)
    return (
      <p className={baseClass} ref={verseRefCallback}>
        <VerseRef verse={verse} />
        {/* Anchor only wraps the words themselves — VerseRef's "Matt 1:1" label above
            must NOT be inside it, or its text would shift every offset computed against
            withTokenOffsets (which assumes position 0 is the first word). */}
        <span {...anchorProps}>
          {verse.words.map((w, i) => {
            const { start, end } = withOffsets[i]
            const hl = highlightAt(start, end, textHighlights)
            return (
              <Fragment key={w.id}>
                <GreekWord
                  word={w}
                  reference={verse.reference}
                  isActive={w.id === activeWordId}
                  searchWord={searchWord}

                  isBsbHighlight={bsbHighlightPos != null && w.position === bsbHighlightPos}
                  highlightId={hl?.id}
                  highlightColor={hl?.color}
                  hlBook={verse.bookId}
                  hlChapter={verse.chapter}
                  onHover={info => onWordHover(info ? w.id : null, info)}
                  onClick={onWordClick}
                  onRightClick={onWordRightClick}
                />
                {i < verse.words!.length - 1 ? ' ' : ''}
              </Fragment>
            )
          })}
        </span>
      </p>
    )
  }

  const tokens = verse.text.split(/\s+/)
  const withOffsets = withTokenOffsets(tokens.map(t => ({ surface: t })))
  return (
    <p className={baseClass} ref={verseRefCallback}>
      <VerseRef verse={verse} />
      <span {...anchorProps}>
        {tokens.map((token, i) => {
          const fakeWord: VerseWord = {
            id: `${verse.id}-${i}`,
            verseId: verse.id,
            position: i,
            surface: token,
          }
          const { start, end } = withOffsets[i]
          const hl = highlightAt(start, end, textHighlights)
          return (
            <Fragment key={fakeWord.id}>
              <GreekWord
                word={fakeWord}
                reference={verse.reference}
                isActive={fakeWord.id === activeWordId}
                searchWord={searchWord}

                highlightId={hl?.id}
                highlightColor={hl?.color}
                hlBook={verse.bookId}
                hlChapter={verse.chapter}
                onHover={info => onWordHover(info ? fakeWord.id : null, info)}
                onClick={onWordClick}
                onRightClick={onWordRightClick}
              />
              {' '}
            </Fragment>
          )
        })}
      </span>
    </p>
  )
}
