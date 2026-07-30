/**
 * Construct search tests (unit — reads the built public/data/construct-index.json.gz).
 * Covers the URL round-trip and the proximity semantics: distance is a GAP (adjacent words
 * are 1 apart), categories AND while alternatives within a category OR, and ordered /
 * same-verse are strict narrowings of the loose case.
 */
import {
  decodeConstruct, encodeConstruct, queryIsRunnable, termIsEmpty,
  CONSTRUCT_DEFAULT_WITHIN, type ConstructQuery,
} from '@/lib/construct-query'
import { searchConstruct } from '@/lib/construct-search'

const q = (o: Partial<ConstructQuery>): ConstructQuery =>
  ({ corpus: 'GNT', terms: [], within: 4, ordered: false, sameVerse: false, ...o }) as ConstructQuery

const ids = (r: { hits: { bookId: string; chapter: number; verse: number }[] }) =>
  r.hits.map(h => `${h.bookId} ${h.chapter}:${h.verse}`)

const AOR_PTCP = { features: { pos: ['verb'], tense: ['aorist'], mood: ['participle'] } }
const DAT_NOUN = { features: { pos: ['noun'], case: ['dative'] } }
const BIG = 1_000_000

describe('construct query encoding', () => {
  it('round-trips terms, distance, order and verse confinement', () => {
    const original = q({
      terms: [AOR_PTCP, { features: { pos: ['noun'], case: ['genitive', 'dative'] }, lemma: 'πνεῦμα' }],
      within: 7, ordered: true, sameVerse: true, corpus: 'LXX',
    })
    const back = decodeConstruct(Object.fromEntries(encodeConstruct(original).entries()))
    expect(back).toEqual(original)
  })

  it('preserves multiple alternatives in one category', () => {
    const back = decodeConstruct({ c: 'pos.noun:case.genitive|dative', w: '3' })
    expect(back.terms[0].features.case).toEqual(['genitive', 'dative'])
  })

  it('falls back to two blank terms and the default distance', () => {
    const back = decodeConstruct({})
    expect(back.terms).toHaveLength(2)
    expect(back.terms.every(termIsEmpty)).toBe(true)
    expect(back.within).toBe(CONSTRUCT_DEFAULT_WITHIN)
    expect(queryIsRunnable(back)).toBe(false)
  })

  it('clamps an absurd distance rather than trusting the URL', () => {
    expect(decodeConstruct({ w: '9999' }).within).toBeLessThanOrEqual(30)
    expect(decodeConstruct({ w: '-5' }).within).toBe(CONSTRUCT_DEFAULT_WITHIN)
  })
})

describe('construct search', () => {
  it('needs two constrained terms to return anything', () => {
    expect(searchConstruct(q({ terms: [AOR_PTCP, { features: {} }] })).hits).toHaveLength(0)
  })

  it('measures distance as a gap between words', () => {
    // Matt 2:1 — γεννηθέντος is word 4, Βηθλέεμ (dative) word 6, so it appears at 2 but not 1.
    const at = (within: number) =>
      ids(searchConstruct(q({ within, terms: [AOR_PTCP, DAT_NOUN] }), BIG)).includes('Matt 2:1')
    expect(at(1)).toBe(false)
    expect(at(2)).toBe(true)
  })

  it('finds a known adjacent pair by lexeme', () => {
    const r = searchConstruct(q({
      within: 2, ordered: true,
      terms: [
        { features: { pos: ['preposition'] }, lemma: 'ἐν' },
        { features: { pos: ['noun'], case: ['dative'] }, lemma: 'ἀρχή' },
      ],
    }), BIG)
    expect(ids(r)).toContain('John 1:1')
    expect(ids(r)).toContain('John 1:2')
  })

  it('widening the distance can only add verses', () => {
    const counts = [1, 2, 4, 8].map(within =>
      searchConstruct(q({ within, terms: [AOR_PTCP, DAT_NOUN] }), BIG).hits.length)
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1])
  })

  it('treats alternatives in one category as OR', () => {
    const base = { within: 3, terms: [{ features: { pos: ['noun'], case: [] as string[] } }, AOR_PTCP] }
    const gen = searchConstruct(q({ ...base, terms: [{ features: { pos: ['noun'], case: ['genitive'] } }, AOR_PTCP] }), BIG)
    const dat = searchConstruct(q({ ...base, terms: [{ features: { pos: ['noun'], case: ['dative'] } }, AOR_PTCP] }), BIG)
    const both = searchConstruct(q({ ...base, terms: [{ features: { pos: ['noun'], case: ['genitive', 'dative'] } }, AOR_PTCP] }), BIG)
    const union = new Set([...ids(gen), ...ids(dat)])
    expect(new Set(ids(both))).toEqual(union)
    expect(both.hits.length).toBeGreaterThan(Math.max(gen.hits.length, dat.hits.length))
  })

  it('ordered and same-verse are narrowings of the loose search', () => {
    const base = { within: 4, terms: [AOR_PTCP, DAT_NOUN] }
    const loose = new Set(ids(searchConstruct(q(base), BIG)))
    for (const narrowed of [q({ ...base, ordered: true }), q({ ...base, sameVerse: true })]) {
      const got = ids(searchConstruct(narrowed, BIG))
      expect(got.length).toBeLessThanOrEqual(loose.size)
      for (const id of got) expect(loose.has(id)).toBe(true)
    }
  })

  it('same-verse drops the cross-boundary matches', () => {
    const base = { within: 4, terms: [AOR_PTCP, DAT_NOUN] }
    const loose = searchConstruct(q(base), BIG)
    expect(loose.hits.some(h => h.crossesVerse)).toBe(true)
    // Every verse kept under sameVerse has an in-verse match, so none is cross-only.
    const confined = searchConstruct(q({ ...base, sameVerse: true }), BIG)
    expect(confined.hits.length).toBeLessThan(loose.hits.length)
  })

  it('reports the matched lemmas so the results view can highlight them', () => {
    const r = searchConstruct(q({ within: 2, terms: [AOR_PTCP, DAT_NOUN] }), BIG)
    const matt21 = r.hits.find(h => h.bookId === 'Matt' && h.chapter === 2 && h.verse === 1)
    expect(matt21?.matchedLemmas.sort()).toEqual(['βηθλεεμ', 'γενναω'])
  })

  it('searches the chosen corpus only', () => {
    const gnt = searchConstruct(q({ terms: [AOR_PTCP, DAT_NOUN] }), BIG)
    const lxx = searchConstruct(q({ corpus: 'LXX', terms: [AOR_PTCP, DAT_NOUN] }), BIG)
    expect(gnt.hits.length).toBeGreaterThan(0)
    expect(lxx.hits.length).toBeGreaterThan(0)
    // No book appears in both results — the two corpora share no osisIds.
    const gntBooks = new Set(gnt.hits.map(h => h.bookId))
    expect(lxx.hits.some(h => gntBooks.has(h.bookId))).toBe(false)
    expect(lxx.hits[0].bookId).toBe('Gen')
  })

  it('maps the Septuagint perfect, which its tagging encodes as X', () => {
    // πεπτωκότας and friends: absent unless the X tag is normalised to `perfect`.
    const r = searchConstruct(q({ corpus: 'LXX', within: 3, terms: [
      { features: { pos: ['verb'], tense: ['perfect'] } },
      { features: { pos: ['noun'] } },
    ] }), BIG)
    expect(r.hits.length).toBeGreaterThan(500)
  })

  it('honours a book scope and caps results', () => {
    const scoped = searchConstruct(q({ within: 4, terms: [AOR_PTCP, DAT_NOUN], books: ['Phlm', 'Jude'] }), BIG)
    expect(scoped.hits.every(h => h.bookId === 'Phlm' || h.bookId === 'Jude')).toBe(true)
    const capped = searchConstruct(q({ within: 4, terms: [AOR_PTCP, DAT_NOUN] }), 10)
    expect(capped.hits).toHaveLength(10)
    expect(capped.truncated).toBe(true)
  })
})
