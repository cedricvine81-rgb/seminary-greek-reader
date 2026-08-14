import { resolveAnchor, type BlockAnnotationRecord } from '@/lib/block-annotations'
import { fingerprint } from '@/lib/i18n/content'

// The block a note was made on, and the note: "the ending" in the middle of it.
const BLOCK = 'A Greek noun carries its case in the ending, not in its position.'
const START = BLOCK.indexOf('the ending')
const QUOTE = 'the ending'

function ann(over: Partial<BlockAnnotationRecord> = {}): BlockAnnotationRecord {
  return {
    id: 'a1', page: 'nouns', blockId: 'nouns-intro', locale: 'en',
    startOffset: START, endOffset: START + QUOTE.length,
    quote: QUOTE, fp: fingerprint(BLOCK), color: 'yellow', body: 'ask about this',
    ...over,
  }
}

describe('resolveAnchor', () => {
  it('paints the stored offsets while the block is unchanged', () => {
    expect(resolveAnchor(ann(), BLOCK, 'en')).toEqual({ kind: 'exact', start: START, end: START + QUOTE.length })
  })

  it('re-finds the quote when the block was edited around it', () => {
    // A clause added at the FRONT: every stored offset is now wrong by that much. This is the
    // case that silently misplaces a note in any offset-only design.
    const edited = 'Unlike English, ' + BLOCK
    const r = resolveAnchor(ann(), edited, 'en')
    expect(r.kind).toBe('repaired')
    if (r.kind !== 'repaired') throw new Error('unreachable')
    expect(edited.slice(r.start, r.end)).toBe(QUOTE)
  })

  it('detaches rather than guessing when the quoted words are gone', () => {
    const rewritten = 'A Greek noun carries its case in its inflection, not in its position.'
    expect(resolveAnchor(ann(), rewritten, 'en')).toEqual({ kind: 'detached' })
  })

  it('picks the occurrence nearest the original when the quote appears twice', () => {
    // Both copies match. Choosing the first would drag the note to the top of a paragraph
    // whenever an editor repeated a phrase earlier in it.
    const twice = 'the ending matters. ' + BLOCK
    const r = resolveAnchor(ann({ startOffset: twice.indexOf(QUOTE, 20) - 3 }), twice, 'en')
    expect(r.kind).toBe('repaired')
    if (r.kind !== 'repaired') throw new Error('unreachable')
    expect(r.start).toBe(twice.indexOf(QUOTE, 20))
  })

  it('does not paint an English range onto the Spanish rendering of the block', () => {
    // The whole reason `locale` is stored: these offsets index different words in Spanish.
    const spanish = 'Un sustantivo griego lleva su caso en la desinencia, no en su posición.'
    expect(resolveAnchor(ann(), spanish, 'es')).toEqual({ kind: 'other-locale' })
  })

  it('keeps a note anchored to its block when the language changes', () => {
    // "other-locale" is not "lost": the note still belongs to blockId, which is what the
    // margin marker keys off, so it is still on screen next to the right paragraph.
    const a = ann()
    const r = resolveAnchor(a, 'cualquier texto', 'es')
    expect(r.kind).toBe('other-locale')
    expect(a.blockId).toBe('nouns-intro')
  })

  it('detaches a highlight with no quote once its block changes', () => {
    expect(resolveAnchor(ann({ quote: '' }), BLOCK + ' Extra.', 'en')).toEqual({ kind: 'detached' })
  })
})
