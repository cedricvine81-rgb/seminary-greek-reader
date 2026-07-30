/**
 * Windowing long passages around their matches.
 *
 * The case that forced clustering: 1 Kings 12:24 in our Septuagint carries the whole of Rahlfs's
 * 12:24a-24z — the alternate Jeroboam narrative — as a single 1,017-word verse, and a construct can
 * match near its start and again 800 words later. A single window spanning every match showed 800
 * of those words, which defeats the point.
 */
import { shouldSnippet, snippetRanges } from '@/lib/snippet'

const width = (rs: { from: number; to: number }[]) => rs.reduce((n, r) => n + (r.to - r.from), 0)

describe('snippetRanges', () => {
  it('gives each cluster of matches its own window', () => {
    // The real positions from 1Kgs 12:24, which span nearly the whole verse.
    const ranges = snippetRanges([46, 47, 52, 53, 106, 107, 815, 816], 1017, 12)
    expect(ranges).toHaveLength(3)
    expect(width(ranges)).toBeLessThan(120)      // not the 794 a single window gave
    // Every match still falls inside a window.
    for (const p of [46, 47, 52, 53, 106, 107, 815, 816]) {
      expect(ranges.some(r => p >= r.from && p < r.to)).toBe(true)
    }
  })

  it('merges windows that touch, so adjacent words are not split by an ellipsis', () => {
    // 20 and 26 are close enough that their windows overlap.
    expect(snippetRanges([20, 26], 200, 12)).toEqual([{ from: 8, to: 39 }])
  })

  it('clamps to the ends of the passage', () => {
    expect(snippetRanges([1], 10, 12)).toEqual([{ from: 0, to: 10 }])
  })

  it('returns the whole passage when there is nothing to centre on', () => {
    expect(snippetRanges([], 40, 12)).toEqual([{ from: 0, to: 40 }])
  })
})

describe('shouldSnippet', () => {
  it('leaves short passages alone', () => {
    // The New Testament's longest verse is Revelation 20:4 at 58 words, so it is never windowed.
    expect(shouldSnippet(58, [10], 60, 12)).toBe(false)
  })

  it('windows a long passage that would actually be shortened', () => {
    expect(shouldSnippet(1017, [46, 815], 60, 12)).toBe(true)
  })

  it('declines when the windows would cover the whole passage anyway', () => {
    // Matches spread evenly through a 70-word passage: nothing would be hidden, so an ellipsis
    // would be a lie.
    const everywhere = Array.from({ length: 70 }, (_, i) => i)
    expect(shouldSnippet(70, everywhere, 60, 12)).toBe(false)
  })

  it('declines when there are no matched positions to centre on', () => {
    expect(shouldSnippet(1017, [], 60, 12)).toBe(false)
  })
})
