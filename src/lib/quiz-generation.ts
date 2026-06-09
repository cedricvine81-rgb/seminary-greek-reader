import { prisma } from './db'
import type { CourseLevel } from '@/types/course'
import type { QuestionType } from '@/types/assignment'

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function pickDistractors(correct: string, pool: string[], count = 3): string[] {
  return shuffle(pool.filter(s => s !== correct)).slice(0, count)
}

export async function generateVocabQuestions(
  level: CourseLevel,
  type: QuestionType,
  count: number,
  provideDefinitionPct = 0   // 0–100: % of questions where student types the answer
) {
  const freqLevel = level === 'BEGINNING' ? 'BEGINNING' : 'INTERMEDIATE'
  const items = await prisma.vocabularyItem.findMany({
    where: { level: freqLevel },
    include: { lexeme: true },
    take: count * 4,
  })

  if (items.length === 0) return [] // vocabulary table not yet loaded

  const picked = shuffle(items).slice(0, count)
  const allGlosses = items.map(i => i.lexeme.gloss)
  const allLexemes = items.map(i => i.lexeme.lexeme)
  const openEndedCount = Math.round((provideDefinitionPct / 100) * count)

  return picked.map((item, idx) => {
    const isOpenEnded = idx < openEndedCount
    if (type === 'GREEK_TO_ENGLISH') {
      const options = isOpenEnded ? [] : shuffle([item.lexeme.gloss, ...pickDistractors(item.lexeme.gloss, allGlosses)])
      return {
        position: idx + 1,
        type: (isOpenEnded ? 'GREEK_TO_ENGLISH' : 'MULTIPLE_CHOICE') as QuestionType,
        prompt: item.lexeme.lexeme,
        correctAnswer: item.lexeme.gloss,
        options,
        points: 1,
      }
    } else {
      const options = isOpenEnded ? [] : shuffle([item.lexeme.lexeme, ...pickDistractors(item.lexeme.lexeme, allLexemes)])
      return {
        position: idx + 1,
        type: (isOpenEnded ? 'ENGLISH_TO_GREEK' : 'MULTIPLE_CHOICE') as QuestionType,
        prompt: item.lexeme.gloss,
        correctAnswer: item.lexeme.lexeme,
        options,
        points: 1,
      }
    }
  })
}

/**
 * Generate vocabulary questions from a specific rank range (sortOrder min/max inclusive).
 * Falls back to a broader BEGINNING pool if there aren't enough words in range.
 */
export async function generateVocabQuestionsInRange(
  rankMin: number,
  rankMax: number,
  type: QuestionType,
  count: number,
  provideDefinitionPct = 0
) {
  const rangeItems = await prisma.vocabularyItem.findMany({
    where: { level: 'BEGINNING', sortOrder: { gte: rankMin, lte: rankMax } },
    include: { lexeme: true },
  })

  const pool = await prisma.vocabularyItem.findMany({
    where: { level: 'BEGINNING' },
    include: { lexeme: true },
    take: 200,
  })

  if (pool.length === 0) return [] // vocabulary table not yet loaded

  const picked = shuffle(rangeItems.length >= count ? rangeItems : pool).slice(0, count)
  const allGlosses = pool.map(i => i.lexeme.gloss)
  const allLexemes = pool.map(i => i.lexeme.lexeme)
  const openEndedCount = Math.round((provideDefinitionPct / 100) * count)

  return picked.map((item, idx) => {
    const isOpenEnded = idx < openEndedCount
    if (type === 'GREEK_TO_ENGLISH') {
      const options = isOpenEnded ? [] : shuffle([item.lexeme.gloss, ...pickDistractors(item.lexeme.gloss, allGlosses)])
      return {
        position: idx + 1,
        type: (isOpenEnded ? 'GREEK_TO_ENGLISH' : 'MULTIPLE_CHOICE') as QuestionType,
        prompt: item.lexeme.lexeme,
        correctAnswer: item.lexeme.gloss,
        options,
        points: 1,
      }
    } else {
      const options = isOpenEnded ? [] : shuffle([item.lexeme.lexeme, ...pickDistractors(item.lexeme.lexeme, allLexemes)])
      return {
        position: idx + 1,
        type: (isOpenEnded ? 'ENGLISH_TO_GREEK' : 'MULTIPLE_CHOICE') as QuestionType,
        prompt: item.lexeme.gloss,
        correctAnswer: item.lexeme.lexeme,
        options,
        points: 1,
      }
    }
  })
}

export async function generateMorphologyQuestions(count: number) {
  const parses = await prisma.morphParse.findMany({
    include: { word: true, lexeme: true },
    take: count * 4,
  })

  return shuffle(parses).slice(0, count).map((parse, idx) => ({
    position: idx + 1,
    type: 'MORPHOLOGY_IDENTIFY' as QuestionType,
    prompt: parse.surface,
    correctAnswer: JSON.stringify({
      partOfSpeech: parse.partOfSpeech,
      tense: parse.tense,
      voice: parse.voice,
      mood: parse.mood,
      person: parse.person,
      number: parse.number,
      casus: parse.casus,
      gender: parse.gender,
    }),
    options: [],
    points: 5,
  }))
}

// ─── Subtype generators (use static paradigm data) ────────────────────────────

import { VERB_PARSES, NOUN_PARSES, ADJECTIVE_PARSES, PRONOUN_PARSES, type GreekParseEntry } from '@/data/greek-parsing-data'
import { CONDITIONAL_EXAMPLES, CONDITIONAL_TYPES } from '@/data/conditional-examples'
import { SUBJUNCTIVE_EXAMPLES, SUBJUNCTIVE_TYPES } from '@/data/subjunctive-examples'
import { VOCAB_LESSONS } from '@/lib/vocab-lesson-map'

export type MorphologySubtype =
  | 'VERB_PARSING'
  | 'NOUN_PARSING'
  | 'ADJECTIVE_PARSING'
  | 'PRONOUN_PARSING'
  | 'CONDITIONALS'
  | 'SUBJUNCTIVES'
  | 'MIXED'

export interface MorphFieldOption {
  key: string
  label: string
}

/** Which parse fields are available for each subtype. */
export const SUBTYPE_FIELD_OPTIONS: Record<MorphologySubtype, MorphFieldOption[]> = {
  VERB_PARSING: [
    { key: 'tense',  label: 'Tense'  },
    { key: 'voice',  label: 'Voice'  },
    { key: 'mood',   label: 'Mood'   },
    { key: 'person', label: 'Person' },
    { key: 'number', label: 'Number' },
  ],
  NOUN_PARSING: [
    { key: 'casus',  label: 'Case'   },
    { key: 'gender', label: 'Gender' },
    { key: 'number', label: 'Number' },
  ],
  ADJECTIVE_PARSING: [
    { key: 'casus',  label: 'Case'   },
    { key: 'gender', label: 'Gender' },
    { key: 'number', label: 'Number' },
  ],
  PRONOUN_PARSING: [
    { key: 'casus',  label: 'Case'   },
    { key: 'gender', label: 'Gender' },
    { key: 'number', label: 'Number' },
  ],
  MIXED: [
    { key: 'partOfSpeech', label: 'Part of Speech' },
    { key: 'tense',        label: 'Tense'          },
    { key: 'voice',        label: 'Voice'          },
    { key: 'mood',         label: 'Mood'           },
    { key: 'person',       label: 'Person'         },
    { key: 'number',       label: 'Number'         },
    { key: 'casus',        label: 'Case'           },
    { key: 'gender',       label: 'Gender'         },
  ],
  CONDITIONALS:  [],
  SUBJUNCTIVES:  [],
}

/**
 * Restrict which inflected forms appear in the question pool.
 * Each array is a whitelist; omit (or empty) means "all values allowed".
 */
export interface MorphParseFilter {
  // Verb
  tenses?:  string[]   // e.g. ['Present', 'Aorist']
  voices?:  string[]   // e.g. ['Active', 'Passive']
  moods?:   string[]   // e.g. ['Indicative', 'Subjunctive']
  persons?: string[]   // e.g. ['1st', '3rd']  — non-participle/infinitive moods
  numbers?: string[]   // e.g. ['Singular']
  // Participle / Noun / Adjective / Pronoun
  cases?:   string[]   // e.g. ['Nominative', 'Genitive']
  genders?: string[]   // e.g. ['Masculine']
}

/** One test in a morphology series. */
export interface MorphTestConfig {
  subtype: MorphologySubtype
  numQuestions: number
  vocabThruLesson: number | null  // null = no vocabulary filter
  fields: string[]                // which parse fields students must identify
  parseFilter?: MorphParseFilter  // restrict question pool to specific forms
}

function parseEntriesToQuestions(entries: GreekParseEntry[], count: number, fields?: string[]) {
  return shuffle(entries).slice(0, count).map((entry, idx) => {
    const full: Record<string, string | null> = {
      partOfSpeech: entry.partOfSpeech,
      tense:  entry.tense  ?? null,
      voice:  entry.voice  ?? null,
      mood:   entry.mood   ?? null,
      person: entry.person ?? null,
      number: entry.number ?? null,
      casus:  entry.casus  ?? null,
      gender: entry.gender ?? null,
    }
    // Filter to only the instructor-selected fields; always keep partOfSpeech
    // so the QuizPlayer can show "Parse this Verb:" even when it's not tested.
    const answer: Record<string, string | null> = {}
    if (fields && fields.length > 0) {
      answer.partOfSpeech = full.partOfSpeech
      for (const f of fields) answer[f] = full[f] ?? null
    } else {
      Object.assign(answer, full)
    }
    // Points scale with how many fields are being tested
    const testedCount = fields && fields.length > 0 ? fields.length : Object.values(full).filter(v => v).length - 1
    return {
      position: idx + 1,
      type: 'MORPHOLOGY_IDENTIFY' as QuestionType,
      prompt: `${entry.surface}  (${entry.lexeme} — ${entry.gloss})`,
      correctAnswer: JSON.stringify(answer),
      options: [],
      points: Math.max(1, testedCount),
      reference: entry.reference ?? null,
    }
  })
}

function applyParseFilter(entries: GreekParseEntry[], filter?: MorphParseFilter): GreekParseEntry[] {
  if (!filter) return entries
  const has = (list: string[] | undefined, val: string | undefined) =>
    !list?.length || (val != null && list.includes(val))
  return entries.filter(e =>
    has(filter.tenses,  e.tense)  &&
    has(filter.voices,  e.voice)  &&
    has(filter.moods,   e.mood)   &&
    has(filter.persons, e.person) &&
    has(filter.numbers, e.number) &&
    has(filter.cases,   e.casus)  &&
    has(filter.genders, e.gender)
  )
}

function getEntriesForSubtype(subtype: MorphologySubtype): GreekParseEntry[] {
  switch (subtype) {
    case 'VERB_PARSING':      return VERB_PARSES
    case 'NOUN_PARSING':      return NOUN_PARSES
    case 'ADJECTIVE_PARSING': return ADJECTIVE_PARSES
    case 'PRONOUN_PARSING':   return PRONOUN_PARSES
    case 'MIXED':             return [...VERB_PARSES, ...NOUN_PARSES, ...ADJECTIVE_PARSES, ...PRONOUN_PARSES]
    default:                  return VERB_PARSES
  }
}

export async function generateMorphologyQuestionsBySubtype(
  subtype: MorphologySubtype,
  count: number,
  vocabThruLesson?: number | null,
  fields?: string[],
  parseFilter?: MorphParseFilter,
) {
  // Conditional/subjunctive questions use full example sentences — filters don't apply
  if (subtype === 'CONDITIONALS') return generateConditionalQuestions(count)
  if (subtype === 'SUBJUNCTIVES') return generateSubjunctiveQuestions(count)

  let entries = getEntriesForSubtype(subtype)

  // Apply parse-value filter (restrict to selected tenses/voices/moods/etc.)
  if (parseFilter) {
    const filtered = applyParseFilter(entries, parseFilter)
    if (filtered.length >= Math.min(count, 3)) entries = filtered
  }

  // Apply vocab filter (restrict to lexemes already learned)
  if (vocabThruLesson != null && vocabThruLesson > 0) {
    const lesson = VOCAB_LESSONS.find(l => l.lesson === vocabThruLesson)
    if (lesson) {
      try {
        const vocabItems = await prisma.vocabularyItem.findMany({
          where: { level: 'BEGINNING', sortOrder: { lte: lesson.rankMax } },
          include: { lexeme: true },
        })
        const knownLexemes = new Set(vocabItems.map(v => v.lexeme.lexeme))
        const filtered = entries.filter(e => knownLexemes.has(e.lexeme))
        if (filtered.length >= Math.min(count, 3)) entries = filtered
      } catch {
        // DB unavailable — fall back to current pool
      }
    }
  }

  return parseEntriesToQuestions(entries, count, fields)
}

export function generateVerbParseQuestions(count: number) {
  return parseEntriesToQuestions(VERB_PARSES, count)
}

export function generateNounParseQuestions(count: number) {
  return parseEntriesToQuestions(NOUN_PARSES, count)
}

export function generateAdjectiveParseQuestions(count: number) {
  return parseEntriesToQuestions(ADJECTIVE_PARSES, count)
}

export function generatePronounParseQuestions(count: number) {
  return parseEntriesToQuestions(PRONOUN_PARSES, count)
}

export function generateConditionalQuestions(count: number) {
  const allTypes = [...CONDITIONAL_TYPES]
  const picked = shuffle(CONDITIONAL_EXAMPLES).slice(0, count)
  return picked.map((ex, idx) => {
    const distractors = shuffle(allTypes.filter(t => t !== ex.type)).slice(0, 2)
    const options = shuffle([ex.type, ...distractors])
    return {
      position: idx + 1,
      type: 'MULTIPLE_CHOICE' as QuestionType,
      prompt: `${ex.greek}\n\n"${ex.translation}" (${ex.reference})`,
      correctAnswer: ex.type,
      options,
      points: 3,
      reference: ex.reference,
    }
  })
}

export function generateSubjunctiveQuestions(count: number) {
  const allTypes = [...SUBJUNCTIVE_TYPES]
  const picked = shuffle(SUBJUNCTIVE_EXAMPLES).slice(0, count)
  return picked.map((ex, idx) => {
    const distractors = shuffle(allTypes.filter(t => t !== ex.type)).slice(0, 3)
    const options = shuffle([ex.type, ...distractors])
    return {
      position: idx + 1,
      type: 'MULTIPLE_CHOICE' as QuestionType,
      prompt: `${ex.greek}\n\n"${ex.translation}" (${ex.reference})`,
      correctAnswer: ex.type,
      options,
      points: 3,
      reference: ex.reference,
    }
  })
}
