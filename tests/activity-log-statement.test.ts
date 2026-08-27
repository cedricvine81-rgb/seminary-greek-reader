import { normalizeEntries, weeksReported, hasStatement } from '@/lib/activity-log'

/**
 * A weekly report now has to say what was done.
 *
 * It used to be a checkbox with an optional note beside it, framed as "anything to say about this
 * week?" — so a complete log could say nothing at all about the activity, which is little use to
 * the instructor reading it.
 *
 * Two things have to hold at once. A statement must be savable BEFORE the week is ticked, or text
 * typed and not yet ticked would be lost by closing the tab; and a draft must not count as a week
 * reported, or the requirement would hand out the credit it was meant to earn.
 */
describe('activity log statements', () => {
  it('keeps a statement written before the week is ticked', () => {
    const e = normalizeEntries({ '1': { done: false, comment: 'Read Mark 1 aloud.' } }, 4)
    expect(e['1'].comment).toBe('Read Mark 1 aloud.')
    expect(e['1'].done).toBe(false)
  })

  it('does not count a draft as a week reported', () => {
    const e = normalizeEntries({ '1': { done: false, comment: 'half a sen' } }, 4)
    expect(weeksReported(e)).toBe(0)
  })

  it('counts a week that is ticked', () => {
    const e = normalizeEntries({ '1': { done: true, comment: 'Read Mark 1 aloud.' } }, 4)
    expect(weeksReported(e)).toBe(1)
  })

  it('still drops an empty week entirely', () => {
    expect(normalizeEntries({ '1': { done: false, comment: '   ' } }, 4)).toEqual({})
  })

  it('ignores weeks outside the assignment', () => {
    expect(normalizeEntries({ '9': { done: true, comment: 'x' } }, 4)).toEqual({})
  })

  it('recognises whitespace as no statement', () => {
    expect(hasStatement({ done: true, at: '2026-01-01T00:00:00.000Z', comment: '  \n ' })).toBe(false)
    expect(hasStatement({ done: true, at: '2026-01-01T00:00:00.000Z', comment: 'did it' })).toBe(true)
    expect(hasStatement(undefined)).toBe(false)
  })
})
