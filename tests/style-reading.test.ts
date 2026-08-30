import { readingOf } from '@/lib/style-register'

// The sentence restates the table. Its failure mode is silent and serious: a direction word
// that says "less" where the numbers say "more" would read as authoritative and be wrong.
describe('readingOf', () => {
  const row = (target: number, other: number, classical: number, koine: number) =>
    ({ label: 'x', target, other, classical, koine })

  it('names the pool both texts fall the same side of', () => {
    // Literary particles: Luke 1-2 1.0, Judith 1.6, Classical 28.7, Koine 5.3.
    const r = readingOf([row(1.0, 1.6, 28.7, 5.3)], {})
    expect(r.traits[0]).toMatchObject({ rel: 'farLess', pool: 'classical', c: 28.7 })
  })

  it('says nothing where the two texts straddle the baseline', () => {
    // One above, one below: there is no shared statement to make about that pool.
    const r = readingOf([row(4.0, 60.0, 28.7, 5.3)], {})
    expect(r.traits).toHaveLength(0)
  })

  it('falls through to Koine when Classical says nothing', () => {
    const r = readingOf([row(6.0, 6.2, 6.1, 2.0)], {})
    expect(r.traits[0]).toMatchObject({ pool: 'koine', rel: 'farMore' })
  })

  it('measures "far" from the NEARER text, so the claim covers both', () => {
    // 0.7x and 0.2x of the pool: "far less" would overstate the first, so it is only "less".
    expect(readingOf([row(7, 2, 10, 1)], {}).traits[0].rel).toBe('less')
    // Both genuinely far: 0.2x and 0.3x.
    expect(readingOf([row(2, 3, 10, 1)], {}).traits[0].rel).toBe('farLess')
    // 0.9x is not a difference worth a sentence, so THAT pool is passed over and the other
    // one speaks instead — 9 and 3 against a Koine 30 is a real statement.
    expect(readingOf([row(9, 3, 10, 30)], {}).traits[0]).toMatchObject({ pool: 'koine', rel: 'farLess' })
    // …and when neither pool has anything to say, the trait is dropped rather than padded.
    expect(readingOf([row(9, 9.5, 10, 10)], {}).traits).toHaveLength(0)
  })

  it('drops a baseline the pool could not be built for', () => {
    expect(readingOf([row(1, 2, NaN, NaN)], {}).traits).toHaveLength(0)
  })

  it('speaks about the lean only when both texts are past the same average', () => {
    expect(readingOf([], { a: -2.21, b: -1.55 }).lean).toMatchObject({ side: 'koine' })
    expect(readingOf([], { a: 1.4, b: 2.0 }).lean).toMatchObject({ side: 'classical' })
    expect(readingOf([], { a: -2.21, b: -0.4 }).lean).toBeNull()   // one short of the average
    expect(readingOf([], { a: -2.21, b: 1.8 }).lean).toBeNull()    // opposite sides
    expect(readingOf([], { a: -2.21 }).lean).toBeNull()            // a passage with no profile
  })

  it('stops at the limit, strongest first', () => {
    const rows = [row(1, 1.6, 28.7, 5.3), row(88, 103, 52.2, 75.9), row(3.9, 4.0, 11.4, 5.9)]
    expect(readingOf(rows, {}).traits).toHaveLength(2)
    expect(readingOf(rows, {}, 3).traits).toHaveLength(3)
  })
})
