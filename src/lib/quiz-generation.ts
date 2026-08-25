import { prisma } from './db'
import { isHebrewLevel } from './constants'
import type { CourseLevel } from '@/types/course'
import type { QuestionType } from '@/types/assignment'
import { wordsForSelection, subsectionKeysBefore, type BgvbWord } from './vocab-subsections'
import { HEBREW_DECK, GREEK_DECK, deckWordsForSelection, deckKeysBefore, strongsThroughBand, wordId, type VocabLang } from './vocab-decks'
import { pickDistractors } from './gloss-distractors'
import { lessonSubsectionKey, lessonSubsectionKeysBefore, lessonSubsectionKeysThrough } from './vocab-lesson-map'

/** Week N → Glanz band N (20 words a week, 20 ranks a band), clamped to the last band. */
export function hebrewWeekBand(weekNumber: number | null | undefined): string | null {
  const bands = HEBREW_DECK.bands ?? []
  if (bands.length === 0) return null
  const week = Math.max(1, Number(weekNumber ?? 1))
  return bands[Math.min(week, bands.length) - 1].key
}

/**
 * The Strong's numbers covered by a set of vocab-quiz selections — the union of their
 * subsection keys resolved through the same deck logic the quizzes themselves use, so
 * Glanz bands, our §-sections and manual mixes all count correctly. Null when the
 * selections carry no keys (nothing to derive a cap from).
 */
export function hebrewStrongsForSelections(selections: string[][]): Set<string> | null {
  const keys = new Set(selections.flat())
  if (keys.size === 0) return null
  const out = new Set<string>()
  for (const w of deckWordsForSelection(HEBREW_DECK, Array.from(keys), [])) {
    const strongs = wordId(w).split('|')[1]
    if (strongs) out.add(strongs)
  }
  return out.size > 0 ? out : null
}

/**
 * Resolve the Hebrew morphology vocabulary cap when it is set to 'auto' — the Hebrew
 * counterpart of the Greek series' vocabAuto.
 *
 * 'auto' follows THE COURSE'S OWN VOCAB QUIZZES: the cap is every word any vocabulary
 * quiz due on or before this quiz's date draws on. Since the weekly schedules store each
 * quiz's slice (Glanz band or §-section), the union is exactly "taught so far" — under
 * either schedule, and after any rescheduling, because regeneration re-resolves. Only a
 * course with no vocab quizzes at all falls back to the week→Glanz-band map.
 */
export async function resolveHebrewVocabCap(
  courseId: string, dueDate: Date | string, weekNumber: number | null | undefined,
  band: string | null | undefined,
): Promise<string | Set<string> | null> {
  if (band !== 'auto') return band ?? null
  const rows = await prisma.assignment.findMany({
    where: { courseId, type: 'VOCABULARY_QUIZ', dueDate: { lte: new Date(dueDate) } },
    select: { vocabSelection: true },
  })
  const fromQuizzes = hebrewStrongsForSelections(
    rows.map(r => (r.vocabSelection as { subsections?: string[] } | null)?.subsections ?? []))
  return fromQuizzes ?? hebrewWeekBand(weekNumber)
}

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
  glossOf: GlossOf = ENGLISH_GLOSS,
): GeneratedQuestion[] {
  const words = wordsForSelection(subsections, pos).filter(w => w.word && w.gloss)
  if (words.length === 0) return []

  return buildVocabQuestions(shuffle(words).slice(0, count), words, type, provideDefinitionPct, glossOf)
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
  glossOf: GlossOf = ENGLISH_GLOSS,
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
  return buildVocabQuestions(picked, [...current, ...earlier], type, provideDefinitionPct, glossOf)
}

/** Shared question shaping for the BGVB-backed generators above. */
/**
 * How a word's gloss is rendered in the generated question. Defaults to the deck's own English.
 *
 * Assessment follows the COURSE's language, not the student's: everyone in a section is marked
 * against one key. The caller (an API route that knows the course) passes a resolver built by
 * glossResolver() in vocab-gloss-server.ts, which applies the same fingerprint check the student
 * sees — so a gloss whose English was edited since translation generates in English rather than
 * from a stale translation.
 */
export type GlossOf = (w: BgvbWord) => string
const ENGLISH_GLOSS: GlossOf = w => w.gloss

/**
 * The two directions a vocabulary question can run in, per language. `toEnglish` is used
 * when the student reads the headword and supplies the gloss; `fromEnglish` the reverse.
 * The pair is what the quiz runner reads back to choose script and text direction, so a
 * Hebrew quiz must not be written with the Greek pair. See prisma/migrations-manual/
 * hebrew-question-types.sql.
 */
const DIRECTIONS = {
  greek:  { toEnglish: 'GREEK_TO_ENGLISH',  fromEnglish: 'ENGLISH_TO_GREEK'  },
  hebrew: { toEnglish: 'HEBREW_TO_ENGLISH', fromEnglish: 'ENGLISH_TO_HEBREW' },
} as const satisfies Record<VocabLang, { toEnglish: QuestionType; fromEnglish: QuestionType }>

function buildVocabQuestions(
  picked: BgvbWord[],
  pool: BgvbWord[],
  type: QuestionType,
  provideDefinitionPct: number,
  glossOf: GlossOf = ENGLISH_GLOSS,
  lang: VocabLang = 'greek',
): GeneratedQuestion[] {
  const dir = DIRECTIONS[lang]
  const allGlosses = pool.map(glossOf)
  const allLexemes = pool.map(w => w.word)
  // Last-resort distractor source. A single subsection is ~19 words, and once near-synonyms
  // and repeats are excluded it can run out — the whole deck keeps every question at four
  // options. Only reached when the selection itself cannot supply them.
  const deckWords = (lang === 'hebrew' ? HEBREW_DECK : GREEK_DECK).words
  const deckGlosses = deckWords.map(w => w.gloss)
  const deckLexemes = deckWords.map(w => w.word)
  // headword → the glosses of every OTHER deck entry spelled the same way.
  const homographGlosses = new Map<string, Set<string>>()
  for (const dw of deckWords) {
    const set = homographGlosses.get(dw.word) ?? new Set<string>()
    set.add(dw.gloss)
    homographGlosses.set(dw.word, set)
  }
  const openEndedCount = Math.round((provideDefinitionPct / 100) * picked.length)

  return picked.map((w, idx) => {
    const isOpenEnded = idx < openEndedCount
    if (type === dir.fromEnglish) {
      const options = isOpenEnded ? [] : shuffle([w.word, ...pickDistractors(w.word, allLexemes, 3, deckLexemes)])
      return {
        position: idx + 1,
        type: (isOpenEnded ? dir.fromEnglish : 'MULTIPLE_CHOICE') as QuestionType,
        prompt: glossOf(w),
        correctAnswer: w.word,
        options,
        points: 1,
      }
    }
    // A homograph is a DIFFERENT word spelled identically (Hebrew אֵת = the object marker
    // and אֵת = "with"). Its gloss is a true meaning of what is on screen, so offering it
    // as a wrong answer asks the student to read the examiner's mind.
    const twins = homographGlosses.get(w.word)
    const options = isOpenEnded ? [] : shuffle([glossOf(w),
      ...pickDistractors(glossOf(w), allGlosses, 3, deckGlosses, twins ? Array.from(twins) : [])])
    return {
      position: idx + 1,
      type: (isOpenEnded ? dir.toEnglish : 'MULTIPLE_CHOICE') as QuestionType,
      prompt: w.word,
      correctAnswer: glossOf(w),
      options,
      points: 1,
    }
  })
}

// ── Hebrew ────────────────────────────────────────────────────────────────────
// The Hebrew deck is static (src/data/hebrew-vocabulary.json, built from the MT by
// scripts/build-hebrew-vocabulary.py) — there is no Hebrew VocabularyItem table, and
// LexicalEntry is Greek. These mirror the BGVB-backed generators above, section for
// section, and differ only in the deck they draw from and the question types they stamp.

/**
 * Hebrew vocabulary questions from a section/subsection + part-of-speech selection.
 * `subsections` are keys like "1-A"; empty = the whole deck. `pos` empty = every part of
 * speech. `provideDefinitionPct` (0–100) is the share typed rather than multiple-choice.
 */
export function generateHebrewVocabQuestionsFromSelection(
  subsections: string[],
  pos: string[],
  type: QuestionType,
  count: number,
  provideDefinitionPct = 0,
  glossOf: GlossOf = ENGLISH_GLOSS,
): GeneratedQuestion[] {
  const words = deckWordsForSelection(HEBREW_DECK, subsections, pos).filter(w => w.word && w.gloss)
  if (words.length === 0) return []
  return buildVocabQuestions(
    shuffle(words).slice(0, count), words, type, provideDefinitionPct, glossOf, 'hebrew')
}

/**
 * The same, but for the ENTIRE selected pool rather than a sample of `count` — used when
 * re-sampling on retake is enabled, so each attempt draws a different subset.
 *
 * `reviewPct` (0–100) blends in words from every subsection BEFORE the selection, the same
 * cumulative-review rule the Greek generator uses.
 */
export function generateHebrewVocabPoolFromSelection(
  subsections: string[],
  pos: string[],
  type: QuestionType,
  provideDefinitionPct = 0,
  reviewPct = 0,
  glossOf: GlossOf = ENGLISH_GLOSS,
): GeneratedQuestion[] {
  const current = deckWordsForSelection(HEBREW_DECK, subsections, pos).filter(w => w.word && w.gloss)
  if (current.length === 0) return []

  const earlierKeys = deckKeysBefore(HEBREW_DECK, subsections)
  const earlier = reviewPct > 0 && earlierKeys.length > 0
    ? deckWordsForSelection(HEBREW_DECK, earlierKeys, pos).filter(w => w.word && w.gloss)
    : []

  // Same proportion rule as the Greek pool: reviewPct of the FINAL pool comes from earlier
  // subsections, capped by how many earlier words there actually are.
  const wantReview = Math.round((Math.min(100, Math.max(0, reviewPct)) / 100) * current.length)
  const review = shuffle(earlier).slice(0, Math.min(wantReview, earlier.length))
  const picked = shuffle([...current, ...review])

  return buildVocabQuestions(
    picked, [...current, ...earlier], type, provideDefinitionPct, glossOf, 'hebrew')
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
  glossOf: GlossOf = ENGLISH_GLOSS,
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
    return buildVocabQuestions(shuffle(current), current, type, provideDefinitionPct, glossOf)
  }

  // pct of the pool should be review: reviewSize / (current + reviewSize) = pct/100.
  const reviewSize = pct >= 100
    ? earlier.length
    : Math.min(earlier.length, Math.round((current.length * pct) / (100 - pct)))
  const pool = pct >= 100
    ? shuffle(earlier)
    : [...current, ...shuffle(earlier).slice(0, reviewSize)]

  return buildVocabQuestions(shuffle(pool), pool, type, provideDefinitionPct, glossOf)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Distractor choice lives in gloss-distractors.ts so the client-side self-study quizzes can
// use the very same rules (this module is server-only — the parsing pools and prisma).

export async function generateVocabQuestions(
  level: CourseLevel,
  type: QuestionType,
  count: number,
  provideDefinitionPct = 0,  // 0–100: % of questions where student types the answer
  /**
   * The COURSE's language. Glosses come from LexicalGloss for that locale where a row exists and
   * fall back to LexicalEntry.gloss where it does not, so a partly-translated lexicon yields a
   * mixed key rather than a broken one — the same rule as every other content surface.
   */
  locale = 'en',
) {
  // VocabularyItem holds the GREEK deck only (LexicalEntry has no language column, and its
  // frequency bands are NT counts). A Hebrew course must therefore get nothing rather than a
  // silent fallback to Greek INTERMEDIATE, which is what the ternary below would otherwise do.
  // The caller surfaces an empty pool as "no questions generated"; see HEBREW_VOCAB_TODO.
  if (isHebrewLevel(level)) return []
  const freqLevel = level === 'BEGINNING' ? 'BEGINNING' : 'INTERMEDIATE'
  const items = await prisma.vocabularyItem.findMany({
    where: { level: freqLevel },
    // Always joined, filtered by locale. For 'en' there are simply no rows — English lives on
    // LexicalEntry itself — so this costs a trivial join and needs no branch.
    include: { lexeme: { include: { glosses: { where: { locale } } } } },
    take: count * 4,
  })

  if (items.length === 0) return [] // vocabulary table not yet loaded

  const glossOf = (l: { gloss: string; glosses?: { gloss: string }[] }) =>
    l.glosses?.[0]?.gloss ?? l.gloss

  const picked = shuffle(items).slice(0, count)
  const allGlosses = items.map(i => glossOf(i.lexeme))
  const allLexemes = items.map(i => i.lexeme.lexeme)
  const openEndedCount = Math.round((provideDefinitionPct / 100) * count)

  return picked.map((item, idx) => {
    const isOpenEnded = idx < openEndedCount
    if (type === 'GREEK_TO_ENGLISH') {
      const options = isOpenEnded ? [] : shuffle([glossOf(item.lexeme), ...pickDistractors(glossOf(item.lexeme), allGlosses)])
      return {
        position: idx + 1,
        type: (isOpenEnded ? 'GREEK_TO_ENGLISH' : 'MULTIPLE_CHOICE') as QuestionType,
        prompt: item.lexeme.lexeme,
        correctAnswer: glossOf(item.lexeme),
        options,
        points: 1,
      }
    } else {
      const options = isOpenEnded ? [] : shuffle([item.lexeme.lexeme, ...pickDistractors(item.lexeme.lexeme, allLexemes)])
      return {
        position: idx + 1,
        type: (isOpenEnded ? 'ENGLISH_TO_GREEK' : 'MULTIPLE_CHOICE') as QuestionType,
        prompt: glossOf(item.lexeme),
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
import {
  HEBREW_VERB_POOL, HEBREW_NOUN_POOL, HEBREW_ADJECTIVE_POOL, HEBREW_PRONOUN_POOL,
  type HebrewParseEntry,
} from '@/data/hebrew-parsing-pool'
import type { HebrewMorphologySubtype, HebrewMorphParseFilter } from '@/lib/quiz-fields-hebrew'
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
  //
  // EXCEPTION — pronoun gender is a SOFT field: within the one pronoun pool some forms
  // are marked for gender and some are not (the corpus keeps none for ego/su/the
  // reflexives), and the course still parses the marked ones by it. So testing gender
  // must not silently drop the unmarked pronouns; those questions just skip the gender
  // select (both quiz players only render non-null fields). Verbs keep the hard rule —
  // there the field list deliberately selects the mood.
  const soft = (e: GreekParseEntry, f: string) => f === 'gender' && e.partOfSpeech === 'Pronoun'
  const testable = fields?.length
    ? entries.filter(e => fields.every(f =>
        f === 'partOfSpeech' || soft(e, f)
        || (e as unknown as Record<string, unknown>)[f] != null))
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
    // Points scale with how many fields this form is actually tested on (a soft field
    // that the form does not carry earns and costs nothing).
    const testedCount = fields && fields.length > 0
      ? fields.filter(f => f !== 'partOfSpeech' && answer[f] != null).length
      : Object.values(full).filter(v => v).length - 1
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
  // A clause restricts only the forms that CARRY the field — same semantics, and same
  // bug, as the Hebrew filter (see applyHebrewParseFilter). The builder's default filter
  // selects every value of every field, and no verb form carries BOTH person and case
  // (finite verbs have no case, participles no person), so under the old rule the
  // filtered pool was always empty and the over-narrow fallback silently dropped the
  // whole filter: an instructor narrowing to "Present only" still got all six tenses.
  // Measured before the fix: builder-shaped Present-only quiz drew Perfect, Present,
  // Future, Aorist, Pluperfect and Imperfect.
  const has = (list: string[] | undefined, val: string | undefined) =>
    !list?.length || val == null || list.includes(val)
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

// ── Hebrew morphology ─────────────────────────────────────────────────────────

function hebrewEntriesForSubtype(subtype: HebrewMorphologySubtype): HebrewParseEntry[] {
  switch (subtype) {
    case 'VERB_PARSING':      return HEBREW_VERB_POOL
    case 'NOUN_PARSING':      return HEBREW_NOUN_POOL
    case 'ADJECTIVE_PARSING': return HEBREW_ADJECTIVE_POOL
    case 'PRONOUN_PARSING':   return HEBREW_PRONOUN_POOL
    case 'MIXED':             return [...HEBREW_VERB_POOL, ...HEBREW_NOUN_POOL,
                                      ...HEBREW_ADJECTIVE_POOL, ...HEBREW_PRONOUN_POOL]
    default:                  return HEBREW_VERB_POOL
  }
}

function applyHebrewParseFilter(
  entries: HebrewParseEntry[], filter?: HebrewMorphParseFilter,
): HebrewParseEntry[] {
  if (!filter) return entries
  // A clause restricts only the forms that CARRY the field; a form without it passes.
  // The old rule — `val != null && list.includes(val)` — excluded every form lacking the
  // field, and since the default filter selects every pronoun type while no verb carries
  // `type`, it emptied the pool for every verb quiz. The generator's too-narrow fallback
  // then quietly dropped the whole filter, so the chips looked functional and did
  // nothing: a "Qal perfect only" quiz still drew Hiphil participles. Which forms must
  // carry a field is the FIELDS mechanism's job (see the `testable` step below), not the
  // filter's.
  const has = (list: string[] | undefined, val: string | undefined) =>
    !list?.length || val == null || list.includes(val)
  return entries.filter(e =>
    has(filter.stems,        e.stem)        &&
    has(filter.conjugations, e.conjugation) &&
    has(filter.persons,      e.person)      &&
    has(filter.genders,      e.gender)      &&
    has(filter.numbers,      e.number)      &&
    has(filter.states,       e.state)       &&
    has(filter.types,        e.type)        &&
    has(filter.rootClasses,  e.rootClass)
  )
}

/**
 * Hebrew parsing questions. Mirrors the Greek generator: the answer is a JSON map of the
 * tested fields, scored one point per field, and the question type stays
 * MORPHOLOGY_IDENTIFY — the runner reads the field map, not the language.
 *
 * Forms that do not carry every tested field are dropped first, which is what makes the
 * verb subtype conjugation-aware: ticking State yields a participle-only quiz, and ticking
 * Person excludes participles and infinitives, which have none.
 */
export function generateHebrewMorphologyQuestions(
  subtype: HebrewMorphologySubtype,
  count: number,
  fields?: string[],
  parseFilter?: HebrewMorphParseFilter,
  /** The vocabulary cap: a Glanz band key ("Glanz 1F", cumulative through that band) or a
   *  ready Set of Strong's numbers (resolveHebrewVocabCap's schedule-agnostic form). The
   *  Hebrew counterpart of the Greek vocabThruLesson. */
  vocabCap?: string | Set<string> | null,
) {
  let entries = hebrewEntriesForSubtype(subtype)

  if (parseFilter) {
    const filtered = applyHebrewParseFilter(entries, parseFilter)
    // Same rule as Greek: an over-narrow filter falls back rather than yielding nothing.
    if (filtered.length >= Math.min(count, 3)) entries = filtered
  }

  // The vocabulary cap follows the Greek rule: explicit instructor intent, NEVER silently
  // relaxed. A thin pool yields a shorter quiz the caller can see, not a quiz that
  // quietly tests words the schedule hasn't reached. (For strong-verb quizzes this cap is
  // usually left off — the strong verbs and the frequent verbs of Hebrew barely overlap,
  // so capping one by the other empties the pool; see series-presets.ts.)
  if (vocabCap) {
    const known = typeof vocabCap === 'string' ? strongsThroughBand(HEBREW_DECK, vocabCap) : vocabCap
    if (known.size > 0) entries = entries.filter(e => known.has(e.strongs))
  }

  const testable = fields?.length
    ? entries.filter(e => fields.every(f =>
        f === 'partOfSpeech' || (e as unknown as Record<string, unknown>)[f] != null))
    : entries

  return shuffle(testable).slice(0, count).map((entry, idx) => {
    const full: Record<string, string | null> = {
      partOfSpeech: entry.partOfSpeech,
      stem:        entry.stem        ?? null,
      conjugation: entry.conjugation ?? null,
      person:      entry.person      ?? null,
      gender:      entry.gender      ?? null,
      number:      entry.number      ?? null,
      state:       entry.state       ?? null,
      type:        entry.type        ?? null,
    }
    const answer: Record<string, string | null> = {}
    if (fields && fields.length > 0) {
      // partOfSpeech is always kept so the runner can say "Parse this Verb:" even when it
      // is not itself tested.
      answer.partOfSpeech = full.partOfSpeech
      for (const f of fields) answer[f] = full[f] ?? null
    } else {
      Object.assign(answer, full)
    }
    const testedCount = fields && fields.length > 0
      ? fields.length
      : Object.values(full).filter(v => v).length - 1
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
