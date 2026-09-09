import { summarisePractice, drillFilter, type PracticeAnswer } from '@/lib/morph-practice-report'

const q = (correct: Record<string, string | null>, given: Record<string, string | undefined>): PracticeAnswer =>
  ({ prompt: 'x', correct, given })

describe('summarisePractice', () => {
  it('scores per field, not per form', () => {
    // Four of five fields right is 4/5, not zero.
    const r = summarisePractice([
      q({ tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
        { tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' }),
    ])
    expect(r.right).toBe(4)
    expect(r.asked).toBe(5)
  })

  it('never asks about a field the form does not carry', () => {
    // A participle has no person: correct.person is null, so it is not counted either way.
    const r = summarisePractice([
      q({ tense: 'Present', mood: 'Participle', person: null, gender: 'Feminine' },
        { tense: 'Present', mood: 'Participle', gender: 'Feminine' }),
    ])
    expect(r.asked).toBe(3)
    expect(r.fields.find(f => f.field === 'person')).toBeUndefined()
  })

  it('ranks misses by value, worst first', () => {
    const answers = [
      q({ tense: 'Aorist', voice: 'Passive' }, { tense: 'Present', voice: 'Active' }),
      q({ tense: 'Aorist', voice: 'Passive' }, { tense: 'Present', voice: 'Passive' }),
      q({ tense: 'Aorist', voice: 'Active' },  { tense: 'Aorist',  voice: 'Active' }),
      q({ tense: 'Perfect', voice: 'Active' }, { tense: 'Perfect', voice: 'Active' }),
    ]
    const r = summarisePractice(answers)
    expect(r.misses[0]).toEqual({ field: 'tense', value: 'Aorist', missed: 2, asked: 3 })
    // Aorist missed twice outranks Passive missed once.
    expect(r.misses.map(m => m.value)).toEqual(['Aorist', 'Passive'])
    // Values never missed are absent entirely — the report lists problems, not everything.
    expect(r.misses.some(m => m.value === 'Perfect')).toBe(false)
  })

  it('reports an empty session without dividing by zero', () => {
    const r = summarisePractice([])
    expect(r).toEqual({ fields: [], misses: [], right: 0, asked: 0 })
  })
})

describe('drillFilter', () => {
  it('turns the worst misses into a filter the generator accepts', () => {
    const r = summarisePractice([
      q({ tense: 'Aorist', voice: 'Passive' }, { tense: 'Present', voice: 'Active' }),
      q({ tense: 'Aorist', voice: 'Passive' }, { tense: 'Present', voice: 'Active' }),
    ])
    expect(drillFilter(r.misses, 2)).toEqual({ tenses: ['Aorist'], voices: ['Passive'] })
  })

  it('narrows as depth rises and widens as it falls', () => {
    const misses = [
      { field: 'tense', value: 'Aorist', missed: 3, asked: 4 },
      { field: 'voice', value: 'Passive', missed: 2, asked: 4 },
      { field: 'mood', value: 'Participle', missed: 1, asked: 4 },
    ]
    // Depth 1 is the widest useful drill; each extra level ANDs another axis on.
    expect(drillFilter(misses, 1)).toEqual({ tenses: ['Aorist'] })
    expect(drillFilter(misses, 3)).toEqual({ tenses: ['Aorist'], voices: ['Passive'], moods: ['Participle'] })
    // Depth 0 must still produce something usable rather than an empty (= unrestricted) filter.
    expect(drillFilter(misses, 0)).toEqual({ tenses: ['Aorist'] })
  })

  it('ORs several misses in the same field rather than contradicting itself', () => {
    const misses = [
      { field: 'tense', value: 'Aorist', missed: 3, asked: 4 },
      { field: 'tense', value: 'Perfect', missed: 2, asked: 4 },
    ]
    expect(drillFilter(misses, 2)).toEqual({ tenses: ['Aorist', 'Perfect'] })
  })
})
