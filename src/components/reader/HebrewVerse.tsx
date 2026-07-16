'use client'
import { Fragment, memo } from 'react'
import type { BiblicalVerse, VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { HebrewLexicon } from '@/lib/hebrew-lexicon'
import { HebrewWord } from './HebrewWord'
import { verseAnchorProps, withTokenOffsets, highlightAt } from '@/components/highlights/render'
import { highlightMarkClass } from '@/lib/highlight-colors'
import type { HighlightRecord } from '@/components/highlights/useHighlights'

// The Hebrew highlight layer — kept distinct from 'grc'/'en' so Hebrew marks never collide with
// a translation column's marks that happen to share offsets.
export const HEBREW_LAYER = 'he'

// The connector rendered after a word: a maqqef joins directly (no space), otherwise a space.
// Both are exactly one character, so withTokenOffsets' single-char gap between tokens lines up
// with the anchor's rendered text for highlight measurement.
function connectorChar(w: VerseWord): string {
  return w.after === '־' ? '־' : ' '
}

interface HebrewVerseProps {
  verse: BiblicalVerse
  activeWordId: string | null
  highlighted: boolean
  lexicon: HebrewLexicon | null
  textHighlights?: HighlightRecord[]
  onWordHover: (wordId: string | null, info: LexicalInfoPanel | null) => void
  onWordClick: (info: LexicalInfoPanel | null) => void
  onWordRightClick?: (word: VerseWord, x: number, y: number, start: number, end: number) => void
  verseRefCallback?: (el: HTMLElement | null) => void
}

function HebrewVerseImpl({
  verse, activeWordId, highlighted, lexicon, textHighlights = [], onWordHover, onWordClick, onWordRightClick, verseRefCallback,
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

  const withOffsets = withTokenOffsets(verse.words)
  return (
    <p dir="rtl" ref={verseRefCallback} className={cls} style={{ fontSize: 'var(--greek-fs, 1.125rem)' }}>
      <sup className="text-[11px] text-gray-400 mx-1 font-sans align-super">{verse.verse}</sup>
      {/* Anchor wraps only the words (not the verse-number sup) so drag-to-highlight offsets
          measured off this element line up with the stored ones; the 'he' layer keeps Hebrew
          marks independent from any translation column. */}
      <span {...verseAnchorProps(verse.bookId, verse.chapter, verse.verse, HEBREW_LAYER)}>
        {verse.words.map((w, i) => {
          const { start, end } = withOffsets[i]
          const hl = highlightAt(start, end, textHighlights)
          // Paint the connector when the highlight run continues across it, so consecutive
          // highlighted words read as one continuous stroke.
          const gapHl = i < verse.words!.length - 1 ? highlightAt(end, end + 1, textHighlights) : undefined
          const gap = connectorChar(w)
          return (
            <Fragment key={w.id}>
              <HebrewWord
                word={w}
                reference={verse.reference}
                isActive={w.id === activeWordId}
                lexicon={lexicon}
                highlightId={hl?.id}
                highlightColor={hl?.color}
                hlBook={verse.bookId}
                hlChapter={verse.chapter}
                onHover={info => onWordHover(info ? w.id : null, info)}
                onClick={onWordClick}
                onRightClick={onWordRightClick ? (word, x, y) => onWordRightClick(word, x, y, start, end) : undefined}
              />
              {i < verse.words!.length - 1
                ? (gapHl ? <span className={highlightMarkClass(gapHl.color)}>{gap}</span> : gap)
                : ''}
            </Fragment>
          )
        })}
      </span>
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
  // textHighlights is a freshly-filtered array each render — compare by content.
  const a = prev.textHighlights ?? []
  const b = next.textHighlights ?? []
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].color !== b[i].color ||
        a[i].startOffset !== b[i].startOffset || a[i].endOffset !== b[i].endOffset) return false
  }
  return true
}

export const HebrewVerse = memo(HebrewVerseImpl, areEqual)
