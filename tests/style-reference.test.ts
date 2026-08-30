/**
 * Reading a typed reference.
 *
 * A reference that resolves to the wrong chapters produces a confident ranking of a text the
 * reader did not ask about, and nothing on the screen looks wrong. Every form the box accepts
 * is pinned here.
 */
import { parseReference, formatReference, type RefBook } from '@/lib/style-reference'

const BOOKS: RefBook[] = [
  { osisId: 'Matt', corpus: 'GNT', name: 'Matthew', abbrev: 'Matt', totalChapters: 28 },
  { osisId: 'Mark', corpus: 'GNT', name: 'Mark', abbrev: 'Mark', totalChapters: 16 },
  { osisId: 'Luke', corpus: 'GNT', name: 'Luke', abbrev: 'Luke', totalChapters: 24 },
  { osisId: '1Cor', corpus: 'GNT', name: '1 Corinthians', abbrev: '1Cor', totalChapters: 16 },
  { osisId: 'Gen', corpus: 'LXX', name: 'Genesis', abbrev: 'Gen', totalChapters: 50 },
]
const p = (s: string) => parseReference(s, BOOKS)

describe('reference parsing', () => {
  it('takes a book on its own as the whole book', () => {
    expect(p('Mark')).toMatchObject({ fromCh: 1, toCh: 16, wholeBook: true })
    // Which matters beyond tidiness: a whole book already has a profile in the index, so it
    // needs no request at all.
    expect(p('Mark')!.wholeBook).toBe(true)
  })

  it('reads a chapter, a chapter range, a verse and a verse range', () => {
    expect(p('Mark 4')).toMatchObject({ fromCh: 4, toCh: 4, fromV: undefined })
    expect(p('Luke 1-2')).toMatchObject({ fromCh: 1, toCh: 2, wholeBook: false })
    expect(p('Mark 4:3')).toMatchObject({ fromCh: 4, toCh: 4, fromV: 3, toV: 3 })
    expect(p('Mark 4:1-9')).toMatchObject({ fromCh: 4, toCh: 4, fromV: 1, toV: 9 })
  })

  it('reads a range that crosses a chapter', () => {
    expect(p('Luke 1:5-2:52')).toMatchObject({ fromCh: 1, toCh: 2, fromV: 5, toV: 52 })
  })

  it('accepts an en dash, since that is what the presets and our own labels use', () => {
    expect(p('Luke 1–2')).toMatchObject({ fromCh: 1, toCh: 2 })
  })

  it('takes a book whose own name starts with a number', () => {
    expect(p('1 Corinthians 13')).toMatchObject({ book: { osisId: '1Cor' }, fromCh: 13 })
    expect(p('1Cor 13')).toMatchObject({ book: { osisId: '1Cor' }, fromCh: 13 })
  })

  it('matches on identity before prefix, so Mark is not swallowed by Matthew', () => {
    expect(p('Mark')!.book.osisId).toBe('Mark')
    expect(p('Ma')!.book.osisId).toBe('Matt')   // a genuine prefix still resolves
  })

  it('ignores case, spacing and full stops', () => {
    expect(p('  mark 4 ')!.book.osisId).toBe('Mark')
    expect(p('Matt. 5:3')!.book.osisId).toBe('Matt')
  })

  it('clamps a range that runs past the end rather than failing', () => {
    expect(p('Luke 1-99')).toMatchObject({ fromCh: 1, toCh: 24 })
  })

  it('orders a backwards range', () => {
    expect(p('Luke 9-3')).toMatchObject({ fromCh: 3, toCh: 9 })
  })

  it('answers to the reader\u2019s own book names', () => {
    // The Spanish placeholder invites "Marcos"; matching only English would leave the box
    // broken in Spanish and perfect in English, which is the kind of gap nobody reports.
    const es: RefBook[] = BOOKS.map(b => ({
      ...b,
      aliases: { Mark: 'Marcos', Luke: 'Lucas', Matt: 'Mateo', Gen: 'G\u00e9nesis', '1Cor': '1 Corintios' }[b.osisId]
        ? [{ Mark: 'Marcos', Luke: 'Lucas', Matt: 'Mateo', Gen: 'G\u00e9nesis', '1Cor': '1 Corintios' }[b.osisId]!]
        : [],
    }))
    expect(parseReference('Marcos 4:1-9', es)).toMatchObject({ book: { osisId: 'Mark' }, fromCh: 4, fromV: 1, toV: 9 })
    expect(parseReference('Lucas 1-2', es)).toMatchObject({ book: { osisId: 'Luke' }, fromCh: 1, toCh: 2 })
    expect(parseReference('G\u00e9nesis', es)).toMatchObject({ book: { osisId: 'Gen' }, wholeBook: true })
    // and the English name still resolves, so a shared link keeps working across languages
    expect(parseReference('Mark 4', es)).toMatchObject({ book: { osisId: 'Mark' }, fromCh: 4 })
  })

  it('returns null for nothing it recognises', () => {
    expect(p('')).toBeNull()
    expect(p('Enoch 1')).toBeNull()
    expect(p('Mark chapter four')).toBeNull()
  })

  it('reads a reference back the way it was written', () => {
    expect(formatReference(p('Mark')!, 'Marcos')).toBe('Marcos')
    expect(formatReference(p('Luke 1-2')!, 'Lucas')).toBe('Lucas 1–2')
    expect(formatReference(p('Mark 4:1-9')!, 'Marcos')).toBe('Marcos 4:1–9')
    expect(formatReference(p('Luke 1:5-2:52')!, 'Lucas')).toBe('Lucas 1:5–2:52')
  })
})
