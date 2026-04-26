import { buildParsingLabel, gradeMorphAnswer } from '@/lib/parsing'

describe('buildParsingLabel', () => {
  it('builds a verb label', () => {
    const label = buildParsingLabel({
      partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative',
      person: '3rd', number: 'Singular',
    })
    expect(label).toContain('Verb')
    expect(label).toContain('Present')
    expect(label).toContain('Active')
    expect(label).toContain('Indicative')
  })

  it('builds a noun label', () => {
    const label = buildParsingLabel({
      partOfSpeech: 'Noun', casus: 'Nominative', number: 'Singular', gender: 'Masculine',
    })
    expect(label).toContain('Noun')
    expect(label).toContain('Nom')
  })

  it('handles partial parse', () => {
    const label = buildParsingLabel({ partOfSpeech: 'Conjunction' })
    expect(label).toBe('Conjunction')
  })
})

describe('gradeMorphAnswer', () => {
  it('grades a fully correct answer', () => {
    const result = gradeMorphAnswer(
      { partOfSpeech: 'verb', tense: 'present', voice: 'active', mood: 'indicative' },
      { partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative' }
    )
    expect(result.correct).toBe(result.total)
  })

  it('grades a partially correct answer', () => {
    const result = gradeMorphAnswer(
      { partOfSpeech: 'verb', tense: 'aorist' },
      { partOfSpeech: 'Verb', tense: 'Present' }
    )
    expect(result.correct).toBe(1)
    expect(result.total).toBe(2)
  })

  it('grades an empty answer as zero', () => {
    const result = gradeMorphAnswer(
      {},
      { partOfSpeech: 'Noun', casus: 'Genitive' }
    )
    expect(result.correct).toBe(0)
  })
})
