/**
 * The worked constructions offered on the Construct search page.
 *
 * These are teaching material, so a preset that quietly stops matching what it claims is worse than
 * one that errors. Each is run against the New Testament and checked against the count it advertises.
 */
import { CONSTRUCT_PRESETS } from '@/lib/construct-presets'
import { searchConstruct } from '@/lib/construct-search'
import { queryIsRunnable } from '@/lib/construct-query'

const all = CONSTRUCT_PRESETS.flatMap(g => g.presets.map(p => [g.heading, p] as const))

describe('construct presets', () => {
  it('covers the constructions the page promises', () => {
    expect(CONSTRUCT_PRESETS.map(g => g.heading)).toEqual([
      'Uses of the subjunctive',
      'Uses of the adjective',
      'Uses of the participle',
      'The articular infinitive',
      'Prepositions and their cases',
      'Double accusatives',
      'Other constructions',
    ])
    expect(all.length).toBeGreaterThanOrEqual(30)
  })

  it.each(all)('%s › %s finds what it claims', (_heading, preset) => {
    expect(queryIsRunnable({ ...preset.query, corpus: 'GNT' })).toBe(true)
    const r = searchConstruct({ ...preset.query, corpus: 'GNT' }, 1)
    // Within 2% of the advertised count, or 3 passages for the small ones.
    expect(Math.abs(r.total - preset.approx)).toBeLessThanOrEqual(Math.max(3, preset.approx * 0.02))
    expect(r.total).toBeGreaterThan(0)
  })

  it('gets the case distinctions the right way round', () => {
    // The point of the preposition group: the same word, a different question, and the counts should
    // reflect New Testament usage rather than an encoding slip.
    const count = (label: string) => {
      const p = all.find(([, x]) => x.label.startsWith(label))![1]
      return searchConstruct({ ...p.query, corpus: 'GNT' }, 1).total
    }
    expect(count('διά + genitive')).toBeGreaterThan(count('διά + accusative'))     // through > because of
    expect(count('κατά + accusative')).toBeGreaterThan(count('κατά + genitive'))   // according to > against
    expect(count('μετά + genitive')).toBeGreaterThan(count('μετά + accusative'))   // with > after
  })

  it('anchors double accusatives on a verb that governs two objects', () => {
    // The point of the group: two accusatives near each other prove nothing. Without a verb anchor
    // the same shape matches 1,000+ verses, most of them an article with its noun.
    const unanchored = searchConstruct({
      corpus: 'GNT', ordered: true, sameVerse: false, within: 4,
      terms: [
        { features: { pos: ['noun'], case: ['accusative'] } },
        { features: { pos: ['noun'], case: ['accusative'] } },
      ],
    }, 1).total
    expect(unanchored).toBeGreaterThan(1000)
    for (const [, p] of all.filter(([h]) => h === 'Double accusatives')) {
      const anchored = searchConstruct({ ...p.query, corpus: 'GNT' }, 1).total
      expect(anchored).toBeLessThan(unanchored / 10)
      expect(p.query.terms.some(t => !!t.lemma)).toBe(true)     // the verb anchor
    }
  })

  it('includes a single-word construction, which the engine must accept', () => {
    const hortatory = all.find(([, p]) => p.label.startsWith('Hortatory'))![1]
    expect(hortatory.query.terms.filter(t => Object.keys(t.features).length > 0)).toHaveLength(1)
    expect(searchConstruct({ ...hortatory.query, corpus: 'GNT' }, 1).total).toBeGreaterThan(50)
  })
})
