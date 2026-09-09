/**
 * countMorphForms / countHebrewMorphForms — the number the custom practice builder shows.
 *
 * The count exists because the GENERATORS fall back: when a filter matches less than
 * min(requested, 3) forms they drop the filter entirely, so an over-narrow student-built drill
 * would silently deal forms the student did not ask for. The builder counts first, with no
 * fallback, and the count must therefore agree with what the generator can actually produce —
 * that is what these tests pin.
 */
import {
  countMorphForms, countHebrewMorphForms,
  generateMorphQuestionsFromConfig, generateHebrewMorphologyQuestions,
} from '@/lib/quiz-generation'

const FINITE = ['tense', 'voice', 'mood', 'person', 'number']

describe('countMorphForms (Greek)', () => {
  it('counts the whole pool when nothing is restricted', async () => {
    const all = await countMorphForms('VERB_PARSING', null, null)
    expect(all).toBeGreaterThan(100)
  })

  it('narrows as the filter narrows, and a filter never widens the pool', async () => {
    const all = await countMorphForms('VERB_PARSING', null, { fields: FINITE })
    const aorist = await countMorphForms('VERB_PARSING', null,
      { fields: FINITE, parseFilter: { tenses: ['Aorist'] } })
    const aoristPassive = await countMorphForms('VERB_PARSING', null,
      { fields: FINITE, parseFilter: { tenses: ['Aorist'], voices: ['Passive'] } })
    expect(aorist).toBeLessThan(all)
    expect(aoristPassive).toBeLessThanOrEqual(aorist)
    expect(aoristPassive).toBeGreaterThan(0)
  })

  it('is zero for a combination the corpus does not contain', async () => {
    // Pluperfect middle imperatives do not exist in the NT; the builder must be able to say so
    // rather than hand back a quiz of something else.
    const none = await countMorphForms('VERB_PARSING', null,
      { fields: FINITE, parseFilter: { tenses: ['Pluperfect'], moods: ['Imperative'], voices: ['Middle'] } })
    expect(none).toBe(0)
  })

  it('honours the vocabulary cap', async () => {
    const uncapped = await countMorphForms('NOUN_PARSING', null, { fields: ['casus', 'gender', 'number'] })
    const capped = await countMorphForms('NOUN_PARSING', 3, { fields: ['casus', 'gender', 'number'] })
    expect(capped).toBeLessThan(uncapped)
    expect(capped).toBeGreaterThan(0)
  })

  it('counts only forms that carry every tested field', async () => {
    // Person excludes participles and infinitives; case+gender selects participles alone.
    const withPerson = await countMorphForms('VERB_PARSING', null, { fields: FINITE })
    const withCase = await countMorphForms('VERB_PARSING', null,
      { fields: ['tense', 'voice', 'mood', 'casus', 'gender', 'number'] })
    const anyField = await countMorphForms('VERB_PARSING', null, null)
    expect(withPerson).toBeLessThan(anyField)
    expect(withCase).toBeLessThan(anyField)
  })

  it('agrees with the generator: a narrow drill deals only what was asked for', async () => {
    const config = { fields: FINITE, parseFilter: { tenses: ['Perfect'], moods: ['Subjunctive'] } }
    const count = await countMorphForms('VERB_PARSING', null, config)
    // Ask for exactly what exists — the clamp the route applies — and the fallback cannot fire.
    const qs = await generateMorphQuestionsFromConfig('VERB_PARSING', Math.min(15, count), null, config)
    expect(qs.length).toBe(Math.min(15, count))
    for (const q of qs) {
      const a = JSON.parse(q.correctAnswer) as { tense: string; mood: string }
      expect(`${a.tense} ${a.mood}`).toBe('Perfect Subjunctive')
    }
  })

  it('never double-counts a form the generator would only ask once', async () => {
    // παντί is masculine AND neuter dative singular; the pool holds both readings, the
    // generator deals one question. The count is of questions available, not of pool rows.
    const count = await countMorphForms('ADJECTIVE_PARSING', null, { fields: ['casus', 'gender', 'number'] })
    const qs = await generateMorphQuestionsFromConfig('ADJECTIVE_PARSING', count, null,
      { fields: ['casus', 'gender', 'number'] })
    expect(qs.length).toBe(count)
    expect(new Set(qs.map(q => q.prompt)).size).toBe(qs.length)
  })
})

describe('countHebrewMorphForms', () => {
  it('narrows with the filter and stays consistent with the generator', () => {
    const fields = ['stem', 'conjugation', 'person', 'gender', 'number']
    const all = countHebrewMorphForms('VERB_PARSING', fields)
    const qal = countHebrewMorphForms('VERB_PARSING', fields, { stems: ['Qal'] })
    expect(qal).toBeGreaterThan(0)
    expect(qal).toBeLessThan(all)
    const qs = generateHebrewMorphologyQuestions('VERB_PARSING', Math.min(15, qal), fields, { stems: ['Qal'] })
    for (const q of qs) {
      expect((JSON.parse(q.correctAnswer) as { stem: string }).stem).toBe('Qal')
    }
  })

  it('is zero for a stem/conjugation pair the corpus does not contain', () => {
    const none = countHebrewMorphForms('VERB_PARSING', ['stem', 'conjugation'],
      { stems: ['Hothpaal'], conjugations: ['Jussive'] })
    expect(none).toBe(0)
  })

  it('a filter clause restricts only the forms that CARRY that field', () => {
    // Deliberate, and documented on applyHebrewParseFilter: a noun has no stem, so a stem
    // clause does not exclude it. That is why the builder must only offer a part of speech
    // the axes it actually has — otherwise ticking "Qal" on a noun drill looks like a filter
    // and is a no-op.
    const nouns = countHebrewMorphForms('NOUN_PARSING', ['gender'])
    const stillNouns = countHebrewMorphForms('NOUN_PARSING', ['gender'], { stems: ['Qal'] })
    expect(stillNouns).toBe(nouns)
  })
})
