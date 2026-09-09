import { gradeResponse } from '@/lib/grading'
import { alternativeParses, formKeyFromPrompt } from '@/lib/morph-ambiguity'

/**
 * A parsing question shows a Greek form on its own, and the form often does not determine its own
 * parse. παντί is masculine AND neuter dative singular; πολλῶν is genitive plural in all three
 * genders. The pool stores each reading separately, so one became "the" answer and a student who
 * gave another lost the field for saying something entirely correct.
 *
 * The lookup is by EXACT spelling, accents included. Folding them would merge τίς "who?" with
 * τὶς "someone" — genuinely different words — and start accepting one as the other.
 *
 * Grading now accepts any reading the form actually has. Unambiguous forms are untouched: a wrong
 * answer must still be wrong, which is what the last case here guards.
 */
const q = (prompt: string, answer: Record<string, string | null>) => ({
  id: 'q1', prompt, points: 3, type: 'MORPHOLOGY_IDENTIFY' as const,
  correctAnswer: JSON.stringify(answer), assignmentId: 'a1',
  assignment: { course: { language: 'en' } },
})
const answer = (o: Record<string, string>) => JSON.stringify(o)

describe('morphology grading accepts every valid reading', () => {
  it('knows παντὶ is both masculine and neuter dative singular', () => {
    expect(alternativeParses('παντὶ  (πᾶς — all)').length).toBeGreaterThan(1)
  })

  it('marks the OTHER gender of an ambiguous form fully correct', async () => {
    // The stored answer says masculine; the student says neuter. Both are παντί.
    const question = q('παντὶ  (πᾶς — all)',
      { partOfSpeech: 'Adjective', number: 'Singular', casus: 'Dative', gender: 'Masculine' })
    const r = await gradeResponse('q1',
      answer({ partOfSpeech: 'Adjective', number: 'Singular', casus: 'Dative', gender: 'Neuter' }),
      false, question as never)
    expect(r.isCorrect).toBe(true)
    expect(r.score).toBe(3)
  })

  it('marks a neuter parsed nominative correct when the key says accusative', async () => {
    // Reported from a real practice run: πνεῦμα in 1 Cor 12:8. The table cannot help here —
    // the corpus attests this form in one case only — so the grader applies the rule that a
    // neuter is spelled alike in the nominative, accusative and vocative.
    const question = q('πνεῦμα  (πνεῦμα — Spirit)',
      { partOfSpeech: 'Noun', number: 'Singular', casus: 'Accusative', gender: 'Neuter' })
    const r = await gradeResponse('q1',
      answer({ partOfSpeech: 'Noun', number: 'Singular', casus: 'Nominative', gender: 'Neuter' }),
      false, question as never)
    expect(r.isCorrect).toBe(true)
    expect(r.score).toBe(3)
  })

  it('marks a plural nominative parsed vocative correct', async () => {
    const question = q('ἀδελφοὶ  (ἀδελφός — brother)',
      { partOfSpeech: 'Noun', number: 'Plural', casus: 'Nominative', gender: 'Masculine' })
    const r = await gradeResponse('q1',
      answer({ partOfSpeech: 'Noun', number: 'Plural', casus: 'Vocative', gender: 'Masculine' }),
      false, question as never)
    expect(r.isCorrect).toBe(true)
  })

  it('still marks a SINGULAR vocative apart from the nominative', async () => {
    // υἱὲ is not υἱός. Accepting one for the other would credit the very mistake the
    // vocative chapter exists to correct.
    const question = q('υἱὲ  (υἱός — son)',
      { partOfSpeech: 'Noun', number: 'Singular', casus: 'Vocative', gender: 'Masculine' })
    const r = await gradeResponse('q1',
      answer({ partOfSpeech: 'Noun', number: 'Singular', casus: 'Nominative', gender: 'Masculine' }),
      false, question as never)
    expect(r.isCorrect).toBe(false)
  })

  it('still marks the stored reading correct', async () => {
    const question = q('παντὶ  (πᾶς — all)',
      { partOfSpeech: 'Adjective', number: 'Singular', casus: 'Dative', gender: 'Masculine' })
    const r = await gradeResponse('q1',
      answer({ partOfSpeech: 'Adjective', number: 'Singular', casus: 'Dative', gender: 'Masculine' }),
      false, question as never)
    expect(r.isCorrect).toBe(true)
  })

  it('does not accept a case the form never has', async () => {
    const question = q('παντὶ  (πᾶς — all)',
      { partOfSpeech: 'Adjective', number: 'Singular', casus: 'Dative', gender: 'Masculine' })
    const r = await gradeResponse('q1',
      answer({ partOfSpeech: 'Adjective', number: 'Singular', casus: 'Accusative', gender: 'Neuter' }),
      false, question as never)
    expect(r.isCorrect).toBe(false)
    expect(r.score).toBeLessThan(3)
  })

  it('leaves an unambiguous form strict', async () => {
    const question = q('λύομεν  (λύω — loose, destroy)',
      { partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' })
    const wrong = await gradeResponse('q1',
      answer({ partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' }),
      false, question as never)
    expect(wrong.isCorrect).toBe(false)
  })

  it('parses the form and lexeme back out of the stored prompt', () => {
    expect(formKeyFromPrompt('παντὶ  (πᾶς — all)')).toBe('παντὶ|πᾶς')
  })
})
