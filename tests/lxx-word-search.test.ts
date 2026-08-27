import { searchByMorph, searchByStrongs, searchByLemma } from '@/lib/search'

/**
 * Morphology and Strong's search over the Septuagint.
 *
 * Neither could work before. Both read a per-word index built from a parse on every word, and the
 * Rahlfs data carried none we could use — its `lemma` field held the inflected surface form rather
 * than a dictionary form. Asking for the Septuagint returned the empty set, silently, because the
 * verse ids in the index were all New Testament and filtering them by corpus left nothing. Our own
 * Stanza tagging of Swete supplies the parses, so the question is now answerable.
 *
 * The failure being guarded here is that silence: a corpus that returns nothing looks exactly like
 * a search with no matches.
 */
const NT = new Set(['Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph',
  'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet',
  '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'])

describe('Septuagint morphology search', () => {
  it('finds aorist participles in the Septuagint', async () => {
    const hits = await searchByMorph({ features: ['verb', 'aorist', 'participle'] }, 'LXX')
    expect(hits.length).toBeGreaterThan(500)
    expect(hits.every(h => !NT.has(h.bookId))).toBe(true)
  })

  it('searches both Testaments together, and the total is the sum of the halves', async () => {
    const [gnt, lxx, both] = await Promise.all([
      searchByMorph({ features: ['verb', 'aorist', 'participle'] }, 'GNT'),
      searchByMorph({ features: ['verb', 'aorist', 'participle'] }, 'LXX'),
      searchByMorph({ features: ['verb', 'aorist', 'participle'] }, 'BOTH'),
    ])
    expect(gnt.length).toBeGreaterThan(0)
    expect(lxx.length).toBeGreaterThan(0)
    expect(both.length).toBe(gnt.length + lxx.length)
  })

  it('reaches the deuterocanonical books', async () => {
    const hits = await searchByMorph({ features: ['verb', 'aorist', 'participle'] }, 'LXX')
    const books = hits.map(h => h.bookId)
    expect(books.some(b => ['Tob', 'Jdt', 'Wis', 'Sir', '1Macc', '2Macc'].includes(b))).toBe(true)
  })
})

describe("Septuagint Strong's search", () => {
  it("finds ἀδελφός (G80) in the Septuagint", async () => {
    const hits = await searchByStrongs('80', 'LXX')
    expect(hits.length).toBeGreaterThan(100)
    expect(hits.every(h => !NT.has(h.bookId))).toBe(true)
  })

  it('agrees with the lemma index, which is built separately', async () => {
    // Two independent paths to the same set: one keyed by Strong's number in the word index,
    // one by lemma in the lemma index. They disagreeing would mean one of them is wrong.
    const [byNumber, byLemma] = await Promise.all([
      searchByStrongs('80', 'LXX'),
      searchByLemma('ἀδελφός', 'LXX'),
    ])
    expect(byNumber.length).toBe(byLemma.length)
  })

  it('still answers for the New Testament alone', async () => {
    const hits = await searchByStrongs('80', 'GNT')
    expect(hits.length).toBeGreaterThan(100)
    expect(hits.every(h => NT.has(h.bookId))).toBe(true)
  })
})
