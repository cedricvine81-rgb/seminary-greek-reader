import { generateMorphologyQuestionsBySubtype } from '@/lib/quiz-generation'

/**
 * A morphology quiz must never ask the same form twice.
 *
 * Greek forms are routinely identical across parses — παντί is both masculine and neuter dative
 * singular, πολλῶν is genitive plural in all three genders — and the pool stores each reading as
 * a separate entry. Before this rule, a quiz could draw both: the student saw one word twice and
 * lost the gender field on one of them however they answered, having done nothing wrong.
 * Grading is per field, so it cost part of a mark rather than a whole one, which is precisely why
 * it went unnoticed.
 *
 * Worst where the pool is thinnest — a third of the pronoun pool is ambiguous forms, a tenth of
 * the adjectives — so these run at a small vocabulary cap, which is where a real course in its
 * opening weeks sits.
 */
const SUBTYPES = ['VERB_PARSING', 'NOUN_PARSING', 'ADJECTIVE_PARSING', 'PRONOUN_PARSING', 'MIXED'] as const

describe('morphology quiz: one question per form', () => {
  it.each(SUBTYPES.flatMap(s => [3, 8, null].map(cap => [s, cap] as const)))(
    '%s at vocab cap %s asks no form twice',
    async (subtype, cap) => {
      const qs = await generateMorphologyQuestionsBySubtype(subtype as never, 20, cap)
      const prompts = qs.map(q => q.prompt)
      expect(new Set(prompts).size).toBe(prompts.length)
    })

  it('still fills a full quiz when the pool allows it', async () => {
    const qs = await generateMorphologyQuestionsBySubtype('VERB_PARSING' as never, 20, null)
    expect(qs).toHaveLength(20)
  })

  it('gives every question at least one gradable field and a parsable answer', async () => {
    const qs = await generateMorphologyQuestionsBySubtype('MIXED' as never, 25, null)
    for (const q of qs) {
      const answer = JSON.parse(q.correctAnswer) as Record<string, string | null>
      const graded = Object.entries(answer).filter(([k, v]) => k !== 'partOfSpeech' && v)
      expect(graded.length).toBeGreaterThan(0)
      expect(q.points).toBeGreaterThan(0)
    }
  })
})
