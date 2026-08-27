import { lxxToEnglish, mtToEnglish } from '@/lib/versification'

/**
 * The Septuagint numbers the Psalter differently from the Hebrew, and every translation this app
 * pairs with a Greek column is numbered from the Hebrew. So Septuagint Psalm 22 — Κύριος ποιμαίνει
 * με, the shepherd psalm — was shown against Psalm 22 of the translation: "My God, my God, why
 * have you forsaken me". A different psalm, silently, for most of the Psalter.
 *
 * The joins below are the ones the arithmetic of our own texts confirms exactly:
 * LXX 9 = MT 9 + 10 (39 verses = 21 + 18), LXX 113 = MT 114 + 115 (26 = 8 + 18),
 * LXX 114 + 115 = MT 116 (10 + 9 = 19).
 */
describe('Septuagint → English versification', () => {
  it('puts the shepherd psalm against the shepherd psalm', () => {
    // Septuagint Ps 22 is Κύριος ποιμαίνει με — English Psalm 23, verse for verse.
    expect(lxxToEnglish('Ps', 22, 1)).toEqual({ chapter: 23, verse: 1 })
    expect(lxxToEnglish('Ps', 22, 6)).toEqual({ chapter: 23, verse: 6 })
  })

  it('leaves the first eight psalms alone', () => {
    expect(lxxToEnglish('Ps', 3, 2)).toEqual(mtToEnglish('Ps', 3, 2))
    expect(lxxToEnglish('Ps', 8, 2)).toEqual(mtToEnglish('Ps', 8, 2))
  })

  it('splits Psalm 9, which the Hebrew counts as two', () => {
    expect(lxxToEnglish('Ps', 9, 5)).toEqual(mtToEnglish('Ps', 9, 5))
    // Everything past verse 21 belongs to Hebrew Psalm 10.
    expect(lxxToEnglish('Ps', 9, 22)?.chapter).toBe(10)
  })

  it('shifts the long middle stretch by one', () => {
    // Verse 4 rather than 2, because some Hebrew psalms count a two-line title as verses 1-2 and
    // those have no English number at all — which mtToEnglish already handles and reports as null.
    for (const ch of [10, 50, 100, 112]) expect(lxxToEnglish('Ps', ch, 4)?.chapter).toBe(ch + 1)
    for (const ch of [116, 130, 145]) expect(lxxToEnglish('Ps', ch, 4)?.chapter).toBe(ch + 1)
  })

  it('reports no English for a Hebrew superscription instead of guessing one', () => {
    // Hebrew Ps 51 counts its two-line title as verses 1-2; English numbers neither.
    expect(lxxToEnglish('Ps', 50, 2)).toBeNull()
    expect(lxxToEnglish('Ps', 50, 3)).toEqual({ chapter: 51, verse: 1 })
  })

  it('splits Psalm 113 and rejoins 114 and 115', () => {
    expect(lxxToEnglish('Ps', 113, 1)?.chapter).toBe(114)
    expect(lxxToEnglish('Ps', 113, 9)?.chapter).toBe(115)
    expect(lxxToEnglish('Ps', 114, 1)?.chapter).toBe(116)
    expect(lxxToEnglish('Ps', 115, 1)).toEqual({ chapter: 116, verse: 11 })
  })

  it('leaves the last three psalms alone', () => {
    for (const ch of [148, 149, 150]) expect(lxxToEnglish('Ps', ch, 2)?.chapter).toBe(ch)
  })

  it('gives Psalm 151 no English, rather than someone else’s', () => {
    expect(lxxToEnglish('Ps', 151, 1)).toBeNull()
  })

  it('passes every other book through the Hebrew map unchanged', () => {
    expect(lxxToEnglish('Gen', 1, 1)).toEqual({ chapter: 1, verse: 1 })
    expect(lxxToEnglish('Isa', 40, 3)).toEqual({ chapter: 40, verse: 3 })
  })
})
