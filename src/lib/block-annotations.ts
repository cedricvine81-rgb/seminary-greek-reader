import { fingerprint } from '@/lib/i18n/content'

/**
 * A highlight or margin note on a block of the app's own prose (the Grammar chapters).
 * Mirrors the BlockAnnotation model — see the schema for why the anchor carries a
 * fingerprint and a quote rather than bare offsets.
 */
export interface BlockAnnotationRecord {
  id: string
  page: string
  blockId: string
  locale: string
  startOffset: number
  endOffset: number
  quote: string
  fp: string
  color: string
  body: string
  ink: string | null
}

/** How an annotation relates to the block as it stands on screen right now. */
export type AnchorState =
  /** The block is unchanged since the annotation was made: paint the stored offsets. */
  | { kind: 'exact'; start: number; end: number }
  /** The block was edited, but the quoted words are still in it — paint the new position. */
  | { kind: 'repaired'; start: number; end: number }
  /** The block was edited and the quoted words are gone. Show the note against the block,
   *  never against arbitrary words. */
  | { kind: 'detached' }
  /** The annotation was made in another language, so its offsets mean nothing here. */
  | { kind: 'other-locale' }

/**
 * Where an annotation belongs in `text`, the block's plain text as it renders NOW.
 *
 * The whole point of the design: an anchor is allowed to fail, and failing must not look
 * like succeeding. A stale offset painted confidently over the wrong half-sentence is worse
 * than a note that says "this moved" — the reader would trust it.
 *
 * Order matters. The fingerprint is checked first because it is exact and cheap; only when
 * it fails do we go looking for the quote, and only then can a repair be wrong (the same
 * phrase may occur twice). Ties are broken toward the original position, which is right
 * whenever an edit happened elsewhere in the block.
 */
export function resolveAnchor(a: BlockAnnotationRecord, text: string, locale: string): AnchorState {
  if (a.locale !== locale) return { kind: 'other-locale' }
  if (a.fp === fingerprint(text)) return { kind: 'exact', start: a.startOffset, end: a.endOffset }
  if (!a.quote) return { kind: 'detached' }

  // Collect every occurrence, then take the one nearest where it used to be.
  const hits: number[] = []
  for (let i = text.indexOf(a.quote); i !== -1; i = text.indexOf(a.quote, i + 1)) hits.push(i)
  if (hits.length === 0) return { kind: 'detached' }
  const best = hits.reduce((b, i) => Math.abs(i - a.startOffset) < Math.abs(b - a.startOffset) ? i : b, hits[0])
  return { kind: 'repaired', start: best, end: best + a.quote.length }
}

/** A note the reader has actually put something in — typed or handwritten — as opposed to a
 *  bare highlight. Ink counts: a margin marker that ignored a drawing would hide it. */
export const hasNote = (a: { body: string; ink?: string | null }): boolean =>
  a.body.trim() !== '' || !!a.ink
