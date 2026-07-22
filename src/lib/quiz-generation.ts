import { prisma } from './db'
import type { CourseLevel } from '@/types/course'
import type { QuestionType } from '@/types/assignment'
import { wordsForSelection } from './vocab-subsections'

export interface GeneratedQuestion {
  position: number
  type: QuestionType
  prompt: string
  correctAnswer: string
  options: string[]
  points: number
}

/**
 * Build vocab questions from a frequency-section + part-of-speech selection over
 * the static BGVB word list (the same 1,036-word source as the Vocab Builder /
 * flashcards). `subsections` are keys like "1-A"; empty = all sections. `pos`
 * empty = all parts of speech. `provideDefinitionPct` (0–100) sets the share of
 * open-ended (typed) questions; the rest are multiple-choice.
 */
export function generateVocabQuestionsFromSelection(
  subsections: string[],
  pos: string[],
  type: QuestionType,
  count: number,
  provideDefinitionPct = 0,
): GeneratedQuestion[] {
  const words = wordsForSelection(subsections, pos).filter(w => w.word && w.gloss)
  if (words.length === 0) return []

  const picked = shuffle(words).slice(0, count)
  const allGlosses = words.map(w => w.gloss)
  const allLexemes = words.map(w => w.word)
  const openEndedCount = Math.round((provideDefinitionPct / 100) * picked.length)

  return picked.map((w, idx) => {
    const isOpenEnded = idx < openEndedCount
    if (type === 'ENGLISH_TO_GREEK') {
      const options = isOpenEnded ? [] : shuffle([w.word, ...pickDistractors(w.word, allLexemes)])
      return {
        position: idx + 1,
        type: (isOpenEnded ? 'ENGLISH_TO_GREEK' : 'MULTIPLE_CHOICE') as QuestionType,
        prompt: w.gloss,
        correctAnswer: w.word,
        options,
        points: 1,
      }
    }
    const options = isOpenEnded ? [] : shuffle([w.gloss, ...pickDistractors(w.gloss, allGlosses)])
    return {
      position: idx + 1,
      type: (isOpenEnded ? 'GREEK_TO_ENGLISH' : 'MULTIPLE_CHOICE') as QuestionType,
      prompt: w.word,
      correctAnswer: w.gloss,
      options,
      points: 1,
    }
  })
}

/**
 * Generate questions for the ENTIRE selected pool (every word in the chosen
 * sections / parts of speech), used when re-sampling on retake is enabled: the
 * student is shown a random subset each attempt. Not capped at 50 — the pool can
 * be a whole frequency section.
 */
export function generateVocabPoolFromSelection(
  subsections: string[],
  pos: string[],
  type: QuestionType,
  provideDefinitionPct = 0,
): GeneratedQuestion[] {
  const poolSize = wordsForSelection(subsections, pos).filter(w => w.word && w.gloss).length
  return generateVocabQuestionsFromSelection(subsections, pos, type, poolSize, provideDefinitionPct)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
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

import { VERB_POOL, NOUN_POOL, ADJECTIVE_POOL, PRONOUN_POOL } from '@/data/greek-parsing-pool'
import type { GreekParseEntry } from '@/data/greek-parsing-data'
import { CONDITIONAL_EXAMPLES, CONDITIONAL_TYPES } from '@/data/conditional-examples'
import { SUBJUNCTIVE_EXAMPLES, SUBJUNCTIVE_TYPES } from '@/data/subjunctive-examples'
import { VOCAB_LESSONS } from '@/lib/vocab-lesson-map'

// Field/filter vocabulary lives in '@/lib/quiz-fields' (no data import, so the instructor
// client bundle stays free of the ~840KB question pool). Re-exported here for server callers.
export {
  SUBTYPE_FIELD_OPTIONS, VERB_TENSES, VERB_VOICES, VERB_MOODS, PERSONS, NUMBERS,
  NOUN_CASES, GENDERS, PRONOUN_TYPES,
} from '@/lib/quiz-fields'
export type {
  MorphologySubtype, MorphFieldOption, MorphParseFilter, MorphTestConfig,
} from '@/lib/quiz-fields'
import type { MorphologySubtype, MorphParseFilter } from '@/lib/quiz-fields'

function parseEntriesToQuestions(entries: GreekParseEntry[], count: number, fields?: string[]) {
  // Keep only forms that actually carry every tested field, so a student is never asked for
  // a value the form doesn't have. This is what makes the verb subtype mood-aware:
  // ticking Case+Gender yields a participle-only quiz; ticking Person excludes participles
  // (they have none) and infinitives.
  const testable = fields?.length
    ? entries.filter(e => fields.every(f =>
        f === 'partOfSpeech' || (e as unknown as Record<string, unknown>)[f] != null))
    : entries
  return shuffle(testable).slice(0, count).map((entry, idx) => {
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
    has(filter.genders, e.gender) &&
    has(filter.pronounTypes, e.pronounType)
  )
}

function getEntriesForSubtype(subtype: MorphologySubtype): GreekParseEntry[] {
  switch (subtype) {
    case 'VERB_PARSING':      return VERB_POOL
    case 'NOUN_PARSING':      return NOUN_POOL
    case 'ADJECTIVE_PARSING': return ADJECTIVE_POOL
    case 'PRONOUN_PARSING':   return PRONOUN_POOL
    case 'MIXED':             return [...VERB_POOL, ...NOUN_POOL, ...ADJECTIVE_POOL, ...PRONOUN_POOL]
    default:                  return VERB_POOL
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
  return parseEntriesToQuestions(VERB_POOL, count)
}

export function generateNounParseQuestions(count: number) {
  return parseEntriesToQuestions(NOUN_POOL, count)
}

export function generateAdjectiveParseQuestions(count: number) {
  return parseEntriesToQuestions(ADJECTIVE_POOL, count)
}

export function generatePronounParseQuestions(count: number) {
  return parseEntriesToQuestions(PRONOUN_POOL, count)
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
