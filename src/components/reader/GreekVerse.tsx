'use client'
import { Fragment, memo, type MouseEvent } from 'react'
import type { BiblicalVerse, VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { GreekWord } from './GreekWord'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { bookAbbrev, formatRef } from '@/lib/i18n/book-names'
import { governingCase } from '@/lib/i18n/form-gloss'
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

// Index of the `.greek-word` span nearest the click point (0 when the point is inside a box),
// so a right-click that lands in the gap between words, on the verse number, or in the line
// padding still resolves to a word instead of doing nothing.
function nearestWordIndex(spans: HTMLElement[], x: number, y: number): number {
  let best = -1, bestD = Infinity
  spans.forEach((el, i) => {
    const r = el.getBoundingClientRect()
    const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0
    const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0
    const d = dx * dx + dy * dy
    if (d < bestD) { bestD = d; best = i }
  })
  return best
}

// Verse-level right-click fallback: if the click didn't land on a word span, route it to the
// nearest word so the word menu (and its Highlight palette) still opens. The word's own
// onContextMenu handles direct hits, so we only act when the target isn't a word. Exported so
// HebrewVerse (whose words also carry the `.greek-word` class) can reuse it.
export function verseContextMenu(
  e: MouseEvent<HTMLElement>,
  words: VerseWord[],
  offsets: { start: number; end: number }[],
  onWordRightClick?: (word: VerseWord, x: number, y: number, start: number, end: number) => void,
) {
  if (!onWordRightClick) return
  if ((e.target as HTMLElement).closest('.greek-word')) return   // a real word will handle it
  const spans = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('.greek-word'))
  if (spans.length === 0) return
  const idx = nearestWordIndex(spans, e.clientX, e.clientY)
  if (idx < 0 || idx >= words.length || idx >= offsets.length) return
  e.preventDefault()
  onWordRightClick(words[idx], e.clientX, e.clientY, offsets[idx].start, offsets[idx].end)
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
  // Display only. The verse's own `reference` field is the English string baked in by
  // src/lib/reader.ts and persisted on BiblicalVerse — it stays English so notes, assignment
  // references and grading keep matching; what the reader SEES is built here from the id.
  const locale = useLocale()
  const abbrev = bookAbbrev(verse.bookId, locale, displayAbbrev(verse.bookId))
  return (
    <span className="text-xs font-semibold text-brand-500 mr-2 select-none whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
      {abbrev} {verse.chapter}:{verse.verse}
    </span>
  )
}

function GreekVerseImpl({
  verse, activeWordId, bsbHighlightPos, highlighted, searchWord, searchLemma, textHighlights = [], onWordHover, onWordClick, onWordRightClick, verseRefCallback
}: GreekVerseProps) {
  // What the parsing pane shows above a word. Built from the id rather than reusing
  // verse.reference, which is the English string baked in server-side and persisted.
  const locale = useLocale()
  const displayRef = formatRef(verse.bookId, locale, verse.chapter, verse.verse,
    verse.reference?.replace(/\s+\d+:\d+$/, ''))
  const baseClass = `greek-text mb-2 rounded px-1 transition-colors ${highlighted ? 'bg-brand-50 ring-1 ring-brand-300' : ''}`
  const anchorProps = verseAnchorProps(verse.bookId, verse.chapter, verse.verse)

  if (verse.words && verse.words.length > 0) {
    const withOffsets = withTokenOffsets(verse.words)
    return (
      <p className={baseClass} ref={verseRefCallback}
        onContextMenu={e => verseContextMenu(e, verse.words!, withOffsets, onWordRightClick)}>
        <VerseRef verse={verse} />
        {/* Anchor only wraps the words themselves — VerseRef's "Matt 1:1" label above
            must NOT be inside it, or its text would shift every offset computed against
            withTokenOffsets (which assumes position 0 is the first word). */}
        <span {...anchorProps}>
          {verse.words.map((w, i) => {
            const { start, end } = withOffsets[i]
            const hl = highlightAt(start, end, textHighlights)
            // A preposition governs a case it does not itself carry — see governingCase().
            const objectCase = w.parses?.[0]?.partOfSpeech === 'Preposition'
              ? governingCase(verse.words!.map(n => ({ lemma: n.lexeme?.lexeme, casus: n.parses?.[0]?.casus })), i)
              : undefined
            return (
              <Fragment key={w.id}>
                <GreekWord
                  word={w}
                  objectCase={objectCase}
                  reference={displayRef}
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
  const fakeWords: VerseWord[] = tokens.map((token, i) => ({ id: `${verse.id}-${i}`, verseId: verse.id, position: i, surface: token }))
  return (
    <p className={baseClass} ref={verseRefCallback}
      onContextMenu={e => verseContextMenu(e, fakeWords, withOffsets, onWordRightClick)}>
      <VerseRef verse={verse} />
      <span {...anchorProps}>
        {tokens.map((token, i) => {
          const fakeWord = fakeWords[i]
          const { start, end } = withOffsets[i]
          const hl = highlightAt(start, end, textHighlights)
          return (
            <Fragment key={fakeWord.id}>
              <GreekWord
                word={fakeWord}
                reference={displayRef}
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
