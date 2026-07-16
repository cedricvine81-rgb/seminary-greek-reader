'use client'
import { Fragment, memo } from 'react'
import type { BiblicalVerse, VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { GreekWord } from './GreekWord'
import { verseAnchorProps, withTokenOffsets, highlightAt } from '@/components/highlights/render'
import { highlightMarkClass } from '@/lib/highlight-colors'
import type { HighlightRecord } from '@/components/highlights/useHighlights'

// The space between two words, painted with the highlight when the run continues across it —
// so consecutive highlighted words read as one continuous stroke, not separate marks. `end` is
// the preceding word's end offset; the space occupies [end, end+1].
function wordGap(end: number, highlights: HighlightRecord[]) {
  const g = highlightAt(end, end + 1, highlights)
  return g ? <span className={highlightMarkClass(g.color)}> </span> : ' '
}

interface GreekVerseProps {
  verse: BiblicalVerse
  activeWordId: string | null
  bsbHighlightPos?: number | null  // Greek word position highlighted from BSB English hover
  highlighted: boolean
  searchWord?: string      // normalized — passed to each GreekWord for red highlighting
  searchLemma?: string     // normalized lemma — highlights every word sharing it ("all forms")
  // Persisted text highlights covering this verse (see src/components/highlights). Also
  // adds the data-hl-* anchor the drag-to-highlight selection capture looks for.
  textHighlights?: HighlightRecord[]
  onWordHover: (wordId: string | null, info: LexicalInfoPanel | null) => void
  onWordClick: (info: LexicalInfoPanel | null) => void
  // start/end are the word's character offsets within the verse (for highlighting it).
  onWordRightClick?: (word: VerseWord, x: number, y: number, start: number, end: number) => void
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

function GreekVerseImpl({
  verse, activeWordId, bsbHighlightPos, highlighted, searchWord, searchLemma, textHighlights = [], onWordHover, onWordClick, onWordRightClick, verseRefCallback
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
                  searchLemma={searchLemma}

                  isBsbHighlight={bsbHighlightPos != null && w.position === bsbHighlightPos}
                  highlightId={hl?.id}
                  highlightColor={hl?.color}
                  hlBook={verse.bookId}
                  hlChapter={verse.chapter}
                  onHover={info => onWordHover(info ? w.id : null, info)}
                  onClick={onWordClick}
                  onRightClick={onWordRightClick ? (word, x, y) => onWordRightClick(word, x, y, start, end) : undefined}
                />
                {i < verse.words!.length - 1 ? wordGap(end, textHighlights) : ''}
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
                onRightClick={onWordRightClick ? (word, x, y) => onWordRightClick(word, x, y, start, end) : undefined}
              />
              {i < tokens.length - 1 ? wordGap(end, textHighlights) : ' '}
            </Fragment>
          )
        })}
      </span>
    </p>
  )
}

// A chapter can hold hundreds of these, each with many interactive word spans, so a verse
// must not re-render just because the parent did (e.g. another chapter loaded, or a hover
// changed a word in a DIFFERENT verse). The parent passes stable (useCallback'd) handlers
// and per-verse ref callbacks, and the verse object itself is stable in state, so we can
// skip re-render unless something that actually affects THIS verse's output changed.
function areEqual(prev: GreekVerseProps, next: GreekVerseProps): boolean {
  if (prev.verse !== next.verse) return false
  if (prev.highlighted !== next.highlighted) return false
  if (prev.searchWord !== next.searchWord) return false
  if (prev.searchLemma !== next.searchLemma) return false
  if (prev.bsbHighlightPos !== next.bsbHighlightPos) return false

  // activeWordId only affects this verse when it points at one of its words. If neither
  // the old nor the new value targets this verse, the change is irrelevant here.
  const prefix = next.verse.id + '.'
  const prevMine = !!prev.activeWordId && prev.activeWordId.startsWith(prefix)
  const nextMine = !!next.activeWordId && next.activeWordId.startsWith(prefix)
  if ((prevMine || nextMine) && prev.activeWordId !== next.activeWordId) return false

  // textHighlights is a freshly-filtered array every render, so compare by content.
  const a = prev.textHighlights ?? []
  const b = next.textHighlights ?? []
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].color !== b[i].color ||
        a[i].startOffset !== b[i].startOffset || a[i].endOffset !== b[i].endOffset) return false
  }
  return true
}

export const GreekVerse = memo(GreekVerseImpl, areEqual)
