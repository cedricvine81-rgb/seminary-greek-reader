/**
 * Construct Search assignments: the instructor pastes a link and that link IS the assignment,
 * so what the parser accepts is what the whole class ends up running.
 */
import {
  DEFAULT_CONSTRUCT_CONFIG, CONSTRUCT_MAX_FINDINGS, describeConstruct, findingIsComplete,
  normalizeConstructConfig, normalizeFindings, parseConstructLink,
} from '@/lib/construct-assignment'

const FULL = 'https://seminarygreek.app/search/construct?c=pos.verb:tense.aorist:mood.participle~pos.noun:case.genitive&w=4&ord=1&sv=1'

describe('parseConstructLink', () => {
  it('accepts the URL the search page copies, and keeps the criteria intact', () => {
    const p = parseConstructLink(FULL)
    expect(p).not.toBeNull()
    expect(p!.query.terms[0].features).toEqual({ pos: ['verb'], tense: ['aorist'], mood: ['participle'] })
    expect(p!.query.terms[1].features).toEqual({ pos: ['noun'], case: ['genitive'] })
    expect(p!.query.within).toBe(4)
    expect(p!.query.ordered).toBe(true)
    expect(p!.query.sameVerse).toBe(true)
  })

  it('stores a same-origin path, whatever host was pasted', () => {
    // A link copied from localhost or a preview deploy must still point at this app.
    for (const input of [FULL, 'http://localhost:3000/search/construct?c=pos.verb&w=2']) {
      expect(parseConstructLink(input)!.href.startsWith('/search/construct?')).toBe(true)
    }
  })

  it('round-trips: the stored href re-parses to the same search', () => {
    const first = parseConstructLink(FULL)!
    const again = parseConstructLink(first.href)!
    expect(again.href).toBe(first.href)
    expect(describeConstruct(again.query)).toBe(describeConstruct(first.query))
  })

  it('accepts a bare path or a bare query string', () => {
    expect(parseConstructLink('/search/construct?c=pos.article~pos.noun&w=3')).not.toBeNull()
    expect(parseConstructLink('c=pos.verb:mood.subjunctive&w=2&in=LXX')!.query.corpus).toBe('LXX')
  })

  it('rejects anything that is not a runnable construct', () => {
    expect(parseConstructLink('')).toBeNull()
    expect(parseConstructLink('https://seminarygreek.app/search?q=logos')).toBeNull()  // wrong route
    expect(parseConstructLink('/search/construct')).toBeNull()                          // no criteria
    expect(parseConstructLink('c=&w=4')).toBeNull()                                     // empty criteria
    expect(parseConstructLink('c=~&w=4')).toBeNull()                                    // two empty terms
    expect(parseConstructLink('not a url at all')).toBeNull()
  })

  it('describes the search in words, for an assignment that shows it without running it', () => {
    expect(describeConstruct(parseConstructLink(FULL)!.query))
      .toBe('Verb Aorist Participle then Noun Genitive · within 4 words, in order, same verse')
  })
})

describe('normalizeConstructConfig', () => {
  it('fills in a whole config from nothing', () => {
    expect(normalizeConstructConfig(null)).toEqual(DEFAULT_CONSTRUCT_CONFIG)
    expect(normalizeConstructConfig('nonsense')).toEqual(DEFAULT_CONSTRUCT_CONFIG)
  })

  it('clamps the required count and keeps explicit falses', () => {
    expect(normalizeConstructConfig({ requiredCount: 999 }).requiredCount).toBe(CONSTRUCT_MAX_FINDINGS)
    expect(normalizeConstructConfig({ requiredCount: 0 }).requiredCount).toBe(1)
    expect(normalizeConstructConfig({ askComment: false }).askComment).toBe(false)
  })
})

describe('normalizeFindings', () => {
  it('trims, drops junk, and caps the list', () => {
    const out = normalizeFindings([{ ref: ' Mark 1:9 ', greek: 'ἐν ἐκείναις ταῖς ἡμέραις' }, 'nope', null, 42])
    expect(out).toEqual([{ ref: 'Mark 1:9', greek: 'ἐν ἐκείναις ταῖς ἡμέραις', translation: '', comment: '' }])
    expect(normalizeFindings(Array(200).fill({ ref: 'x', greek: 'y' }))).toHaveLength(CONSTRUCT_MAX_FINDINGS)
    expect(normalizeFindings('not a list')).toEqual([])
  })

  it('counts a row towards the target only once it says where AND what', () => {
    expect(findingIsComplete({ ref: 'Mark 1:9', greek: 'ἐν ἐκείναις', translation: '', comment: '' })).toBe(true)
    expect(findingIsComplete({ ref: 'Mark 1:9', greek: '   ', translation: 'in those days', comment: '' })).toBe(false)
    expect(findingIsComplete({ ref: '', greek: 'ἐν ἐκείναις', translation: '', comment: '' })).toBe(false)
  })
})
