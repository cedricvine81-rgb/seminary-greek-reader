import { MORPH_OPTIONS } from '@/data/morphology-options'
import { acceptableParses, bestReading, gradableFields } from '@/lib/morph-ambiguity'
import { hasHebrew } from '@/lib/script-detect'
import {
  HEBREW_STEMS, HEBREW_CONJUGATIONS, HEBREW_PERSONS, HEBREW_GENDERS,
  HEBREW_NUMBERS, HEBREW_STATES, HEBREW_PRONOUN_TYPES,
} from '@/lib/quiz-fields-hebrew'

type FieldLabels = Record<string, { label: string; opts: string[] }>

/**
 * Which fields get a dropdown, what may be chosen in each, and what the slot is called.
 *
 * Hoisted out of the answering panel because the FEEDBACK and the RESULTS breakdown now name
 * the slots too ("Case ✗"). Hebrew parses on stem/conjugation/state rather than tense/voice/mood,
 * and its gender/number carry values Greek does not have (Common, Both, Dual) — hence a separate
 * map rather than a shared one.
 *
 * This MUST cover every field the generators can put in an answer key: a field with no entry
 * renders no input at all, so the student cannot answer it and is marked wrong automatically.
 */
export function morphFieldMap(t: (k: string) => string, isHeb: boolean): FieldLabels {
  return isHeb
    ? {
        stem:        { label: t('morph.stem'),        opts: HEBREW_STEMS },
        conjugation: { label: t('morph.conjugation'), opts: HEBREW_CONJUGATIONS },
        person:      { label: t('morph.person'),      opts: HEBREW_PERSONS },
        gender:      { label: t('morph.gender'),      opts: HEBREW_GENDERS },
        number:      { label: t('morph.number'),      opts: HEBREW_NUMBERS },
        state:       { label: t('morph.state'),       opts: HEBREW_STATES },
        type:        { label: t('quiz.pronounType'),  opts: HEBREW_PRONOUN_TYPES },
      }
    : {
        tense:  { label: t('morph.tense'),  opts: MORPH_OPTIONS.tense  },
        voice:  { label: t('morph.voice'),  opts: MORPH_OPTIONS.voice  },
        mood:   { label: t('morph.mood'),   opts: MORPH_OPTIONS.mood   },
        person: { label: t('morph.person'), opts: MORPH_OPTIONS.person },
        number: { label: t('morph.number'), opts: MORPH_OPTIONS.number },
        casus:  { label: t('morph.case'),   opts: MORPH_OPTIONS.case   },
        gender: { label: t('morph.gender'), opts: MORPH_OPTIONS.gender },
        pronounType: { label: t('quiz.pronounType'), opts: MORPH_OPTIONS.pronounType },
      }
}

export interface ParseDetail {
  fields: { key: string; label: string; given: string; expected: string; ok: boolean }[]
  matches: number
  total: number
}

/**
 * Field-by-field verdict for one parse, against the reading that fits the student best.
 *
 * The server already awards partial credit — score = matches / fields — but every surface
 * reduced it to a boolean, so a student who got two slots of three right saw a red cross and
 * a struck-through answer and reasonably concluded they had scored nothing. This recomputes
 * the SAME verdict from the SAME module the server grades with, so the marks shown and the
 * marks awarded cannot drift.
 *
 * Returns null for anything that is not a gradable parse, so callers fall back to the plain
 * right/wrong rendering.
 */
export function parseDetail(
  prompt: string, correctJson: string, studentJson: string, t: (k: string) => string,
): ParseDetail | null {
  try {
    const correct = JSON.parse(correctJson || '{}')
    const student = JSON.parse(studentJson || '{}')
    if (!correct || typeof correct !== 'object' || !student || typeof student !== 'object') return null
    const keys = gradableFields(correct)
    if (keys.length === 0) return null
    const { reading } = bestReading(acceptableParses(prompt, correct), student, keys)
    const map = morphFieldMap(t, hasHebrew(prompt))
    const fields = keys.map(key => {
      const given = String(student[key] ?? '')
      const expected = String(reading[key] ?? '')
      return {
        key,
        label: map[key]?.label ?? key,
        given,
        expected,
        ok: given.toLowerCase() === expected.toLowerCase(),
      }
    })
    return { fields, matches: fields.filter(f => f.ok).length, total: fields.length }
  } catch { return null }
}

