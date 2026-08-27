/**
 * Copying out of the Variants collation.
 *
 * The readings sit in a table — one row per witness, one cell per word — so the browser's own
 * copy puts a TAB between every word and a newline between every witness. Dragging across a
 * reading and pasting it into an essay produced `ἐν→ἀρχῇ→ἦν→ὁ→λόγος`, which is not a quotation
 * of anything. The page rewrites what goes on the clipboard.
 *
 * Line breaks BETWEEN witnesses are deliberately kept: selecting three witnesses is asking for
 * three readings, and running them together would misrepresent all three.
 */
function cleanCollationCopy(raw: string): string {
  return raw
    .split('\n')
    .map(line => line.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

describe('copying a collation selection', () => {
  it('turns a tab-separated row into a readable reading', () => {
    expect(cleanCollationCopy('ἐν\tἀρχῇ\tἦν\tὁ\tλόγος')).toBe('ἐν ἀρχῇ ἦν ὁ λόγος')
  })

  it('keeps witnesses on separate lines', () => {
    expect(cleanCollationCopy('ἐν\tἀρχῇ\tἦν\nἐν\tἀρχῇ\tην'))
      .toBe('ἐν ἀρχῇ ἦν\nἐν ἀρχῇ ην')
  })

  it('drops the blank lines the sticky verse-number column leaves behind', () => {
    expect(cleanCollationCopy('\t\nἐν\tἀρχῇ\n\t\n')).toBe('ἐν ἀρχῇ')
  })

  it('keeps the sigla that identify the witness', () => {
    expect(cleanCollationCopy('ἐν\tἀρχῇ\tἦν\t\tℵ B C')).toBe('ἐν ἀρχῇ ἦν ℵ B C')
  })

  it('keeps the omission mark, which is a reading in its own right', () => {
    expect(cleanCollationCopy('ἐν\t—\tἦν')).toBe('ἐν — ἦν')
  })

  it('returns nothing for an empty selection, so the browser keeps its own behaviour', () => {
    expect(cleanCollationCopy('')).toBe('')
    expect(cleanCollationCopy('\t\t\n  \n')).toBe('')
  })
})
