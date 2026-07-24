import { prisma } from './db'
import type { CourseLevel } from '@/types/course'
import type { QuestionType } from '@/types/assignment'
import { wordsForSelection, subsectionKeysBefore, type BgvbWord } from './vocab-subsections'
import { lessonSubsectionKey, lessonSubsectionKeysBefore, lessonSubsectionKeysThrough } from './vocab-lesson-map'

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

  return buildVocabQuestions(shuffle(words).slice(0, count), words, type, provideDefinitionPct)
}

/**
 * Vocabulary questions for BGVB lesson `lesson` (= week N of a Beginning semester).
 *
 * Words come from the static BGVB list — the same 20-word subsection the student studies
 * on /vocab — rather than the VocabularyItem table, which only holds a partial seed.
 *
 * `reviewPct` (0–100) is cumulative review: that share of the questions is drawn from
 * EVERY earlier lesson, the rest from this lesson. The two sets are shuffled together so
 * review words aren't clumped. Lesson 1 has nothing earlier and silently uses its own list.
 */
export function generateVocabQuestionsForLesson(
  lesson: number,
  type: QuestionType,
  count: number,
  provideDefinitionPct = 0,
  reviewPct = 0,
): GeneratedQuestion[] {
  const key = lessonSubsectionKey(lesson)
  if (!key) return []
  const current = wordsForSelection([key], []).filter(w => w.word && w.gloss)
  if (current.length === 0) return []

  const wantReview = Math.round((Math.min(100, Math.max(0, reviewPct)) / 100) * count)
  const earlierKeys = lessonSubsectionKeysBefore(lesson)
  const earlier = wantReview > 0 && earlierKeys.length > 0
    ? wordsForSelection(earlierKeys, []).filter(w => w.word && w.gloss)
    : []

  const reviewCount = Math.min(wantReview, earlier.length)
  const currentCount = Math.max(0, count - reviewCount)
  const picked = shuffle([
    ...shuffle(current).slice(0, currentCount),
    ...shuffle(earlier).slice(0, reviewCount),
  ]).slice(0, count)

  // Distractors come from the whole studied-so-far pool, so wrong answers stay plausible.
  return buildVocabQuestions(picked, [...current, ...earlier], type, provideDefinitionPct)
}

/** Shared question shaping for the BGVB-backed generators above. */
function buildVocabQuestions(
  picked: BgvbWord[],
  pool: BgvbWord[],
  type: QuestionType,
  provideDefinitionPct: number,
): GeneratedQuestion[] {
  const allGlosses = pool.map(w => w.gloss)
  const allLexemes = pool.map(w => w.word)
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
  reviewPct = 0,
): GeneratedQuestion[] {
  const current = wordsForSelection(subsections, pos).filter(w => w.word && w.gloss)
  if (current.length === 0) return []

  // Cumulative review: blend in words from every subsection BEFORE the selection.
  // The stored pool is what the player re-samples from each attempt, so review is
  // applied by composition — earlier words make up `reviewPct` of the pool.
  const pct = Math.min(100, Math.max(0, reviewPct))
  const earlierKeys = pct > 0 ? subsectionKeysBefore(subsections) : []
  const earlier = earlierKeys.length > 0
    ? wordsForSelection(earlierKeys, pos).filter(w => w.word && w.gloss)
    : []

  if (earlier.length === 0) {
    return buildVocabQuestions(shuffle(current), current, type, provideDefinitionPct)
  }

  // pct of the pool should be review: reviewSize / (current + reviewSize) = pct/100.
  const reviewSize = pct >= 100
    ? earlier.length
    : Math.min(earlier.length, Math.round((current.length * pct) / (100 - pct)))
  const pool = pct >= 100
    ? shuffle(earlier)
    : [...current, ...shuffle(earlier).slice(0, reviewSize)]

  return buildVocabQuestions(shuffle(pool), pool, type, provideDefinitionPct)
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
      pronounType: entry.pronounType ?? null,
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

  // Apply vocab filter: keep only lexemes taught in lessons 1..vocabThruLesson, so a
  // morphology quiz never asks about a word the vocabulary schedule hasn't reached.
  // Word lists come from the static BGVB data — the same source as the vocab quizzes.
  if (vocabThruLesson != null && vocabThruLesson > 0) {
    const keys = lessonSubsectionKeysThrough(vocabThruLesson)
    if (keys.length > 0) {
      const knownLexemes = new Set(wordsForSelection(keys, []).map(w => w.word))
      // The cap is explicit instructor intent, so it is NEVER silently relaxed: a thin
      // early-lesson pool yields a shorter quiz (the caller sees the count), not a quiz
      // that quietly tests words the schedule hasn't reached.
      entries = entries.filter(e => knownLexemes.has(e.lexeme))
    }
  }

  return parseEntriesToQuestions(entries, count, fields)
}

/** A morphology quiz's stored generation recipe (Assignment.morphConfig). */
export interface MorphGenConfig {
  fields?: string[]
  parseFilter?: MorphParseFilter
  declensions?: (1 | 2 | 3)[]
}

/** Declension from lemma ending + gender, on the ACCENT-STRIPPED lemma (θεός ends in an
 * accented ό, which a literal /ος$/ misses). The -ος neuters (ἔθνος) and -μα neuters
 * (πνεῦμα) are 3rd; γυνή (γυναικός) is the lexical exception. */
const THIRD_DECLENSION = new Set(['γυνή'])
export function nounDeclension(lemma: string, gender: string | null): 1 | 2 | 3 {
  if (THIRD_DECLENSION.has(lemma.normalize('NFC'))) return 3
  const b = lemma.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (/ος$/.test(b)) return gender === 'Neuter' ? 3 : 2
  if (/(ον|ους)$/.test(b)) return 2                       // incl. contracts (Ἰησοῦς, νοῦς)
  if (gender === 'Neuter' && /α$/.test(b)) return 3       // -μα / -α neuters
  if (/[ηα]$/.test(b)) return 1
  if (/(ης|ας)$/.test(b) && gender === 'Masculine') return 1
  return 3
}

const morphLemmaOf = (p: string) => p.match(/\(([^\s—)]+)\s*—/)?.[1] ?? ''

/**
 * Generate a morphology quiz from its stored recipe. Wraps
 * generateMorphologyQuestionsBySubtype and adds the declension restriction the noun
 * quizzes use (the parse pool has no declension field, so over-generate and classify).
 */
export async function generateMorphQuestionsFromConfig(
  subtype: MorphologySubtype,
  count: number,
  vocabThruLesson: number | null,
  config: MorphGenConfig | null,
) {
  const fields = config?.fields?.length ? config.fields : undefined
  const filter = config?.parseFilter ?? undefined
  if (!config?.declensions?.length) {
    return generateMorphologyQuestionsBySubtype(subtype, count, vocabThruLesson, fields, filter)
  }
  const raw = await generateMorphologyQuestionsBySubtype(subtype, 200, vocabThruLesson, fields, filter)
  const want = new Set<number>(config.declensions)
  const seen = new Set<string>()
  const out: Array<(typeof raw)[number]> = []
  for (const q of raw) {
    const ans = JSON.parse(q.correctAnswer) as { gender: string | null }
    const lem = morphLemmaOf(q.prompt)
    if (!lem || seen.has(q.prompt) || !want.has(nounDeclension(lem, ans.gender))) continue
    seen.add(q.prompt)
    out.push(q)
    if (out.length === count) break
  }
  return out.map((q, i) => ({ ...q, position: i + 1 }))
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
