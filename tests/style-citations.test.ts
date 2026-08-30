/**
 * The references printed under each shared trait.
 *
 * A wrong citation in a document that leaves the app is worse than no citation, and nothing
 * about a wrong one looks wrong — "Jdt 5:3" is as plausible as "Jdt 5:4". So the corpora's four
 * different reference shapes are pinned here, and a handful of New Testament references are
 * checked against forms a reader can verify by eye.
 */
import { citationsFor } from '@/lib/style-citations'

const luke12 = { kind: 'passage' as const, ref: { corpus: 'GNT', book: 'Luke', fromCh: 1, toCh: 2 } }

describe('citations', () => {
  it('finds the optatives of Luke 1-2 exactly where they stand', () => {
    // εἴη (1:29), γένοιτο (1:38), θέλοι (1:62) — the three in the chapter, and no others.
    const c = citationsFor(luke12, ['optative'], [], 5)
    expect(c.counts.optative).toBe(3)
    expect(c.refs.optative).toEqual(['1:29', '1:38', '1:62'])
  })

  it('finds the periphrastics of Luke 1-2', () => {
    // ἦν προσευχόμενον (1:10) and ἦν ὁ λαὸς προσδοκῶν (1:21) both open the list.
    const c = citationsFor(luke12, ['periphrastic'], [], 3)
    expect(c.refs.periphrastic.slice(0, 2)).toEqual(['1:10', '1:21'])
  })

  it('stays inside the requested passage', () => {
    const c = citationsFor(luke12, ['aorist'], [], 6)
    for (const ref of c.refs.aorist) expect(Number(ref.split(':')[0])).toBeLessThanOrEqual(2)
  })

  it('reports a trait that is absent as absent, not as missing', () => {
    const c = citationsFor(luke12, [], ['ουν'], 3)
    expect(c.refs['ουν']).toEqual([])
    expect(c.counts['ουν']).toBeUndefined()
  })

  it('counts a folded lemma under its canonical form', () => {
    // The Septuagint stores γίγνομαι; asking for γινομαι must still find it.
    const c = citationsFor({ kind: 'work', corpus: 'LXX', work: 'Jdt' }, [], ['γινομαι'], 3)
    expect(c.refs['γινομαι'].length).toBeGreaterThan(0)
  })

  describe('the four reference shapes, one per corpus family', () => {
    it('gives chapter:verse for a biblical book', () => {
      const c = citationsFor({ kind: 'work', corpus: 'LXX', work: 'Jdt' }, ['optative'], [], 3)
      for (const r of c.refs.optative) expect(r).toMatch(/^\d+:\d+$/)
    })

    it('takes the book number from the verse table where Josephus puts it', () => {
      // Antiquities book 3 opens [3, 1, 0], so the book is already in the reference.
      const c = citationsFor({ kind: 'work', corpus: 'josephus', work: 'josephus/antiquities' }, ['optative'], [], 4)
      for (const r of c.refs.optative) expect(r).toMatch(/^\d+\.\d+$/)
      // Sampled across the work in reading order, not in the index's lexical key order.
      const books = c.refs.optative.map(r => Number(r.split('.')[0]))
      expect(books).toEqual(books.slice().sort((a, b) => a - b))
      expect(Math.max(...books)).toBeLessThanOrEqual(20)   // Antiquities has twenty books
    })

    it('takes the book number from the key where chapters restart', () => {
      // Herodotus book 4 chapter 1 is [1, ...] in its own file; without the key it would
      // be indistinguishable from book 1 chapter 1.
      const c = citationsFor({ kind: 'work', corpus: 'greco', work: 'greco/herodotus-histories' }, ['optative'], [], 4)
      for (const r of c.refs.optative) expect(r).toMatch(/^\d+\.\d+\.\d+$/)
      const books = c.refs.optative.map(r => Number(r.split('.')[0]))
      expect(Math.max(...books)).toBeLessThanOrEqual(9)    // nine books of the Histories
    })

    it('gives a bare section for a work numbered in one flat run', () => {
      // Philo's On Abraham is one sequence of Cohn-Wendland sections; "1.204" would invent
      // a book division the edition does not have.
      const c = citationsFor({ kind: 'work', corpus: 'philo', work: 'philo/abraham' }, ['optative'], [], 3)
      for (const r of c.refs.optative) expect(r).toMatch(/^\d+$/)
    })
  })

  it('samples across the text rather than taking the opening', () => {
    const c = citationsFor({ kind: 'work', corpus: 'LXX', work: 'Jdt' }, ['aorist'], [], 3)
    expect(c.counts.aorist).toBeGreaterThan(100)
    const chapters = c.refs.aorist.map(r => Number(r.split(':')[0]))
    expect(Math.max(...chapters)).toBeGreaterThan(Math.min(...chapters))
  })
})
