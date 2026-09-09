/**
 * The custom drill's opening state — the one thing a builder must never get wrong.
 *
 * A form is only drawn if it carries EVERY field asked of it, and the tickable field list is a
 * union across moods: a Hebrew participle has no person, a Hebrew finite verb no state, so
 * asking for both matches nothing. Opening on "no forms match" would teach a student that the
 * feature is broken. (It did, in the first live run — this test is that bug's fence.)
 */
import { defaultSpec, axesFor, fieldsFor } from '@/lib/morph-practice-custom'
import { countMorphForms, countHebrewMorphForms } from '@/lib/quiz-generation'
import type { HebrewMorphologySubtype } from '@/lib/quiz-fields-hebrew'
import type { MorphologySubtype } from '@/lib/quiz-fields'

const SUBTYPES = ['VERB_PARSING', 'NOUN_PARSING', 'ADJECTIVE_PARSING', 'PRONOUN_PARSING', 'MIXED'] as const

describe('the builder opens on something drillable', () => {
  it.each(SUBTYPES)('Greek %s has forms with no restrictions', async subtype => {
    const spec = defaultSpec('greek', subtype)
    const count = await countMorphForms(subtype as MorphologySubtype, null,
      { fields: spec.fields, parseFilter: spec.parseFilter })
    expect(`${subtype}: ${count > 15 ? 'enough' : count}`).toBe(`${subtype}: enough`)
  })

  it.each(SUBTYPES)('Hebrew %s has forms with no restrictions', subtype => {
    const spec = defaultSpec('hebrew', subtype)
    const count = countHebrewMorphForms(subtype as HebrewMorphologySubtype, spec.fields, {})
    expect(`${subtype}: ${count > 15 ? 'enough' : count}`).toBe(`${subtype}: enough`)
  })

  it('never opens with a field the part of speech cannot carry alongside the others', () => {
    // Greek verbs: case and gender belong to participles, so they are off by default.
    expect(defaultSpec('greek', 'VERB_PARSING').fields).not.toContain('casus')
    expect(defaultSpec('greek', 'VERB_PARSING').fields).not.toContain('gender')
    // Hebrew verbs: state belongs to participles, person to everything else.
    expect(defaultSpec('hebrew', 'VERB_PARSING').fields).not.toContain('state')
    expect(defaultSpec('hebrew', 'VERB_PARSING').fields).toContain('person')
    // They remain tickable — a participle drill is a choice the student can make.
    expect(fieldsFor('greek', 'VERB_PARSING')).toContain('casus')
    expect(fieldsFor('hebrew', 'VERB_PARSING')).toContain('state')
  })
})

describe('axes offered', () => {
  it('only offers axes the part of speech carries', () => {
    // A filter clause restricts only the forms that CARRY the field, so a stem chip on a noun
    // drill would be a no-op that looks like a filter.
    expect(axesFor('hebrew', 'NOUN_PARSING').map(a => a.key)).not.toContain('stems')
    expect(axesFor('greek', 'NOUN_PARSING').map(a => a.key)).not.toContain('tenses')
    expect(axesFor('greek', 'VERB_PARSING').map(a => a.key)).toContain('tenses')
  })

  it('names every axis with a filter key the generator understands', () => {
    const greek = ['tenses', 'voices', 'moods', 'persons', 'numbers', 'cases', 'genders', 'pronounTypes']
    const hebrew = ['stems', 'conjugations', 'persons', 'genders', 'numbers', 'states', 'types', 'rootClasses']
    for (const st of SUBTYPES) {
      for (const a of axesFor('greek', st)) expect(greek).toContain(a.key)
      for (const a of axesFor('hebrew', st)) expect(hebrew).toContain(a.key)
    }
  })

  it('offers no empty axis', () => {
    for (const lang of ['greek', 'hebrew'] as const) {
      for (const st of SUBTYPES) {
        for (const a of axesFor(lang, st)) {
          expect(`${lang}/${st}/${a.key}: ${a.values.length}`).not.toBe(`${lang}/${st}/${a.key}: 0`)
        }
      }
    }
  })
})
