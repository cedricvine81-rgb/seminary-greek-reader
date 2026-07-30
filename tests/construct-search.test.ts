/**
 * Construct search tests (unit — reads the built public/data/construct-index.json.gz).
 * Covers the URL round-trip and the proximity semantics: distance is a GAP (adjacent words
 * are 1 apart), categories AND while alternatives within a category OR, and ordered /
 * same-verse are strict narrowings of the loose case.
 */
import {
  decodeConstruct, encodeConstruct, queryIsRunnable, termIsEmpty,
  CONSTRUCT_CORPORA, CONSTRUCT_DEFAULT_WITHIN, type ConstructQuery,
} from '@/lib/construct-query'
import { searchConstruct, searchConstructAll } from '@/lib/construct-search'

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

  it('finds every form of a Septuagint lexeme from the word alone', () => {
    // The LXX chapter files store the surface form in their `lemma` field, so ἀγαπάω — a dictionary
    // form that never occurs as a surface form — would be unfindable by string. The engine resolves
    // the word against that corpus's own table and matches on its Strong's number instead, so the
    // caller needs to supply nothing but the word. The regression this guards is silent emptiness:
    // string matching returned zero rather than failing loudly.
    const ANY_NOUN = { features: { pos: ['noun'] } }
    const fromWord = searchConstruct(q({ corpus: 'LXX', within: 5, terms: [{ features: {}, lemma: 'ἀγαπάω' }, ANY_NOUN] }), BIG)
    expect(fromWord.hits.length).toBeGreaterThan(200)
    // Supplying the number explicitly must land in the same place.
    const withNumber = searchConstruct(q({ corpus: 'LXX', within: 5, terms: [{ features: {}, lemma: 'ἀγαπάω', strongs: ['25'] }, ANY_NOUN] }), BIG)
    expect(withNumber.hits.length).toBe(fromWord.hits.length)
  })

  it("ignores Strong's numbers belonging to another corpus", () => {
    // A term keeps whatever numbers the last corpus's table gave it, so the engine re-resolves the
    // word rather than trusting them — otherwise switching corpus would search for the wrong word.
    const ANY_NOUN = { features: { pos: ['noun'] } }
    const honest = searchConstruct(q({ corpus: 'LXX', within: 5, terms: [{ features: {}, lemma: 'πνεῦμα' }, ANY_NOUN] }), BIG)
    const stale = searchConstruct(q({ corpus: 'LXX', within: 5, terms: [{ features: {}, lemma: 'πνεῦμα', strongs: ['25'] }, ANY_NOUN] }), BIG)
    expect(stale.hits.length).toBe(honest.hits.length)
  })

  it('reports the same total whether or not a corpus is drilled into', () => {
    // The inconsistency this guards: the distribution said Josephus 2,748 while opening Josephus
    // said "300+".
    const terms = [AOR_PTCP, DAT_NOUN]
    const { tallies } = searchConstructAll(q({ within: 4, terms }), 5)
    for (const id of ['GNT', 'josephus'] as const) {
      const drilled = searchConstruct(q({ corpus: id, within: 4, terms }))
      expect(drilled.total).toBe(tallies.find(t => t.corpus === id)!.count)
    }
  })

  it('reports a per-corpus distribution when searching every text', () => {
    const { tallies, total } = searchConstructAll(q({ within: 4, terms: [AOR_PTCP, DAT_NOUN] }), 3)
    expect(tallies).toHaveLength(CONSTRUCT_CORPORA.length)
    // Counts are true totals, not sample sizes — that's the whole point of the view.
    const gnt = tallies.find(t => t.corpus === 'GNT')!
    expect(gnt.hits.length).toBe(3)
    expect(gnt.count).toBeGreaterThan(300)
    expect(total).toBe(tallies.reduce((n, t) => n + t.count, 0))
    // Every corpus reached, including the last one in the list.
    expect(tallies.find(t => t.corpus === 'greco')!.count).toBeGreaterThan(0)
  })

  it("round-trips Strong's numbers through the URL", () => {
    const original = q({ corpus: 'LXX', terms: [
      { features: { pos: ['verb'] }, lemma: 'ἀγαπάω', strongs: ['25'] },
      { features: { pos: ['noun'] } },
    ] })
    expect(decodeConstruct(Object.fromEntries(encodeConstruct(original).entries()))).toEqual(original)
  })

  it('requires agreement in the named categories', () => {
    const ART = { features: { pos: ['article'] } }
    const ADJ = { features: { pos: ['adjective'] } }
    const NOUN = { features: { pos: ['noun'] } }
    const loose = searchConstruct(q({ within: 3, ordered: true, terms: [ART, ADJ, NOUN] }), BIG)
    const concord = searchConstruct(q({ within: 3, ordered: true, terms: [
      ART,
      { ...ADJ, agreeWith: 0, agreeOn: ['case', 'number', 'gender'] },
      { ...NOUN, agreeWith: 0, agreeOn: ['case', 'number', 'gender'] },
    ] }), BIG)
    // Attributive position: τὰ καλὰ ἔργα. A strict narrowing of the unconstrained search.
    expect(concord.hits.length).toBeGreaterThan(0)
    expect(concord.hits.length).toBeLessThan(loose.hits.length)
    const looseIds = new Set(loose.hits.map(h => h.verseId))
    expect(concord.hits.every(h => looseIds.has(h.verseId))).toBe(true)
  })

  it('fails agreement rather than passing when a word has no value in the category', () => {
    // A conjunction has no case, so "agreeing in case" is unsatisfiable — it must return nothing
    // instead of quietly ignoring the constraint.
    const r = searchConstruct(q({ within: 4, terms: [
      { features: { pos: ['verb'], mood: ['indicative'] } },
      { features: { pos: ['conjunction'] }, agreeWith: 0, agreeOn: ['case'] },
    ] }), BIG)
    expect(r.hits).toHaveLength(0)
  })

  it('excludes matches with a forbidden word in between', () => {
    const NOM = { features: { pos: ['noun'], case: ['nominative'] } }
    const plain = searchConstruct(q({ within: 6, ordered: true, terms: [NOM, NOM] }), BIG)
    const noConj = searchConstruct(q({ within: 6, ordered: true, terms: [
      NOM, NOM, { features: { pos: ['conjunction'] }, negate: true },
    ] }), BIG)
    // καί between two nominatives is very common, so this must bite hard, and only ever narrow.
    expect(noConj.hits.length).toBeLessThan(plain.hits.length)
    const plainIds = new Set(plain.hits.map(h => h.verseId))
    expect(noConj.hits.every(h => plainIds.has(h.verseId))).toBe(true)
  })

  it('does not treat a negated term as one of the two required words', () => {
    const r = searchConstruct(q({ terms: [
      { features: { pos: ['article'] } },
      { features: { pos: ['noun'] }, negate: true },
    ] }), BIG)
    expect(r.hits).toHaveLength(0)
  })

  it('round-trips agreement and negation through the URL', () => {
    const original = q({ terms: [
      { features: { pos: ['article'] } },
      { features: { pos: ['adjective'] }, agreeWith: 0, agreeOn: ['case', 'gender'] },
      { features: { pos: ['article'] }, negate: true },
    ] })
    expect(decodeConstruct(Object.fromEntries(encodeConstruct(original).entries()))).toEqual(original)
  })

  it('honours a book scope and caps results', () => {
    const scoped = searchConstruct(q({ within: 4, terms: [AOR_PTCP, DAT_NOUN], books: ['Phlm', 'Jude'] }), BIG)
    expect(scoped.hits.every(h => h.bookId === 'Phlm' || h.bookId === 'Jude')).toBe(true)
    // The cap limits what comes back, never the count: "300+" used to be all a caller could know,
    // and it contradicted the true per-corpus totals in the cross-corpus view.
    const capped = searchConstruct(q({ within: 4, terms: [AOR_PTCP, DAT_NOUN] }), 10)
    const uncapped = searchConstruct(q({ within: 4, terms: [AOR_PTCP, DAT_NOUN] }), BIG)
    expect(capped.hits).toHaveLength(10)
    expect(capped.truncated).toBe(true)
    expect(capped.total).toBe(uncapped.total)
    expect(uncapped.truncated).toBe(false)
    expect(uncapped.hits).toHaveLength(uncapped.total)
  })
})
