/**
 * Forms that cannot distinguish their own case must accept every reading of themselves.
 *
 * Reported from a real practice run: πνεῦμα (1 Cor 12:8) was tagged Accusative, a student
 * parsed it Nominative — the form is neuter, the two are spelled alike, and it was marked
 * wrong. The corpus-evidence table could not fix this on its own: it only holds forms the
 * corpus happens to attest twice.
 *
 * Two rules, and only two, hold for every declension:
 *   1. neuter: nominative = accusative = vocative, both numbers
 *   2. plural: vocative = nominative, every gender
 * The singular vocative outside the neuter is a REAL distinct form (λόγε, γύναι) and must stay
 * markable, or the drill would credit a genuine error.
 */
import { acceptableParses, bestReading } from '@/lib/morph-ambiguity'

const cases = (parses: ReturnType<typeof acceptableParses>) =>
  parses.map(p => p.casus).sort()

const NEUTER_SG = { partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Neuter', number: 'Singular' }
const MASC_PL   = { partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Masculine', number: 'Plural' }
const MASC_SG   = { partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Masculine', number: 'Singular' }
const prompt = 'πνεῦμα  (πνεῦμα — Spirit)'

describe('case syncretism', () => {
  it('accepts nominative, accusative or vocative for a neuter', () => {
    expect(cases(acceptableParses(prompt, NEUTER_SG)))
      .toEqual(['Accusative', 'Nominative', 'Vocative'])
  })

  it('accepts the vocative for any plural nominative', () => {
    expect(cases(acceptableParses('ἄνθρωποι  (ἄνθρωπος — man)', MASC_PL)))
      .toEqual(['Nominative', 'Vocative'])
  })

  it('does NOT accept the vocative for a masculine singular', () => {
    // λόγος and λόγε are different words on the page; marking them the same would teach the
    // opposite of what the chapter teaches.
    expect(cases(acceptableParses('λόγος  (λόγος — word)', MASC_SG))).toEqual(['Nominative'])
  })

  it('leaves a form with no case alone', () => {
    const verb = { partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' }
    expect(acceptableParses('ἔλυσεν  (λύω — loose)', verb)).toEqual([verb])
  })

  it('applies to participles, which decline like adjectives', () => {
    const ptc = { partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Participle', casus: 'Nominative', gender: 'Neuter', number: 'Plural' }
    expect(cases(acceptableParses('λύοντα  (λύω — loose)', ptc)))
      .toEqual(['Accusative', 'Nominative', 'Vocative'])
  })
})

describe('bestReading', () => {
  const fields = ['casus', 'gender', 'number']

  it('credits the student’s reading when the form allows it', () => {
    const student = { casus: 'Nominative', gender: 'Neuter', number: 'Singular' }
    const { reading, matches } = bestReading(acceptableParses(prompt, NEUTER_SG), student, fields)
    expect(matches).toBe(3)
    expect(reading.casus).toBe('Nominative')
  })

  it('quotes the answer key when the case is simply wrong', () => {
    // All three readings tie at zero on the case, and the one shown back to the student
    // should be the corpus's own — not an equally-true alternative they never saw.
    const student = { casus: 'Genitive', gender: 'Neuter', number: 'Singular' }
    expect(bestReading(acceptableParses(prompt, NEUTER_SG), student, fields).reading.casus)
      .toBe('Accusative')
  })

  it('still marks a genuinely wrong case wrong', () => {
    const student = { casus: 'Genitive', gender: 'Neuter', number: 'Singular' }
    expect(bestReading(acceptableParses(prompt, NEUTER_SG), student, fields).matches).toBe(2)
  })

  it('never mixes fields between readings', () => {
    // Feminine nominative singular is not a reading of πνεῦμα in any case; taking the case from
    // one reading and the gender from another would credit a parse no form has.
    const student = { casus: 'Vocative', gender: 'Feminine', number: 'Singular' }
    const { matches } = bestReading(acceptableParses(prompt, NEUTER_SG), student, fields)
    expect(matches).toBe(2)
  })

  it('keeps the corpus-attested alternatives working alongside the rules', () => {
    // παντὶ is masculine AND neuter dative singular — evidence from the table, not a rule.
    // (Keyed by the form as the corpus accents it, which is where the prompt comes from.)
    const p = 'παντὶ  (πᾶς — all)'
    const correct = { partOfSpeech: 'Adjective', casus: 'Dative', gender: 'Neuter', number: 'Singular' }
    const student = { casus: 'Dative', gender: 'Masculine', number: 'Singular' }
    expect(bestReading(acceptableParses(p, correct), student, fields).matches).toBe(3)
  })
})
