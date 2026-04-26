import { formatParsing } from '@/lib/reader'

describe('formatParsing', () => {
  it('formats a verb parse', () => {
    const result = formatParsing({
      partOfSpeech: 'Verb', tense: 'Present', voice: 'Active',
      mood: 'Indicative', person: '3rd', number: 'Singular',
    })
    expect(result).toBe('Verb, Present, Active, Indicative, 3rd person, Singular')
  })

  it('formats a noun parse', () => {
    const result = formatParsing({
      partOfSpeech: 'Noun', casus: 'Nominative', number: 'Singular', gender: 'Masculine',
    })
    expect(result).toBe('Noun, Singular, Nominative, Masculine')
  })

  it('returns just POS for particles', () => {
    const result = formatParsing({ partOfSpeech: 'Particle' })
    expect(result).toBe('Particle')
  })
})
