/**
 * Create the "Beginning Greek Morphology" quiz series for a course.
 *
 * One quiz every THURSDAY (the vocabulary quizzes run Monday/Wednesday), each tracking the
 * morphology taught by that point in the course. The sequence follows the class PowerPoints
 * in Dropbox/Classes/2. Beginning Greek/Lessons (on campus):
 *
 *   L1 Alphabet · L2 Grammar review · L3 1st/2nd declension + adjectives · L4 3rd declension
 *   L5 Basic verb forms · L6 Tense identifiers, 2nd aorists & liquids · L7 Participles
 *   L8 Subjunctive, imperative & infinitive · L9 μι-verbs · L10 Basic syntax
 *
 * Weeks 1-2 (alphabet, grammar review) have nothing parseable, so quizzes run weeks 3-14 —
 * twelve in all, the later weeks reviewing cumulatively. Each quiz's vocabulary is capped at
 * the words taught by its week (vocabThruLesson), so students never parse unseen words.
 *
 * Usage:  npx tsx scripts/build-morphology-series.ts --course="Beginning Greek FA26" [--apply]
 */
import { PrismaClient } from '@prisma/client'
import { generateMorphologyQuestionsBySubtype, type MorphologySubtype } from '../src/lib/quiz-generation'
import type { MorphParseFilter } from '../src/lib/quiz-fields'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')
const arg = (n: string) => process.argv.find(a => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=')
const COURSE = arg('course') ?? 'Beginning Greek FA26'

const SERIES = 'Beginning Greek Morphology'

interface Spec {
  week: number
  topic: string                    // goes into the title: "Week N — Beginning Greek Morphology (Topic)"
  subtype: MorphologySubtype
  fields: string[]
  filter?: MorphParseFilter
  declensions?: (1 | 2 | 3)[]      // noun quizzes: restrict by declension (classified below)
  dueOffset?: number               // days relative to the week's Thursday (wk14 avoids Thanksgiving)
}

// The sequence. Subtypes and filters use the corpus-generated parsing pool; the pool cannot
// filter nouns by declension, so the noun quizzes are titled by what is actually tested.
const SPECS: Spec[] = [
  { week: 3,  topic: 'Nouns I: 1st & 2nd Declension',           subtype: 'NOUN_PARSING',
    fields: ['casus', 'gender', 'number'], declensions: [1, 2] },
  { week: 4,  topic: 'Nouns II: 3rd Declension',                subtype: 'NOUN_PARSING',
    fields: ['casus', 'gender', 'number'], declensions: [3] },
  { week: 5,  topic: 'Verbs I: Present & Imperfect Indicative', subtype: 'VERB_PARSING',
    fields: ['tense', 'voice', 'mood', 'person', 'number'],
    filter: { tenses: ['Present', 'Imperfect'], moods: ['Indicative'] } },
  { week: 6,  topic: 'Verbs II: All Indicative Tenses',         subtype: 'VERB_PARSING',
    fields: ['tense', 'voice', 'mood', 'person', 'number'],
    filter: { moods: ['Indicative'] } },
  // Perfect participles are excluded until formally taught.
  { week: 7,  topic: 'Participles',                             subtype: 'VERB_PARSING',
    fields: ['tense', 'voice', 'mood', 'casus', 'gender', 'number'],
    filter: { moods: ['Participle'], tenses: ['Present', 'Aorist'] } },
  { week: 8,  topic: 'Subjunctive, Imperative & Infinitive',    subtype: 'VERB_PARSING',
    fields: ['tense', 'voice', 'mood'],
    filter: { moods: ['Subjunctive', 'Imperative', 'Infinitive'] } },
  { week: 9,  topic: 'Verbs III: All Moods',                    subtype: 'VERB_PARSING',
    fields: ['tense', 'voice', 'mood'] },
  { week: 10, topic: 'Pronouns',                                subtype: 'PRONOUN_PARSING',
    fields: ['pronounType', 'casus', 'number'] },
  // Adjectives (taught with L3) are reviewed here, freeing weeks 3-4 for the two noun quizzes.
  { week: 11, topic: 'Adjectives',                              subtype: 'ADJECTIVE_PARSING',
    fields: ['casus', 'gender', 'number'] },
  { week: 12, topic: 'Conditional Sentences',                   subtype: 'CONDITIONALS', fields: [] },
  { week: 13, topic: 'Mixed Parsing',                           subtype: 'MIXED',
    fields: ['partOfSpeech'] },
  // Due the TUESDAY of its week: the Thursday is Thanksgiving.
  { week: 14, topic: 'Final Review: Mixed Parsing', dueOffset: -2, subtype: 'MIXED',
    fields: ['partOfSpeech'] },
]

const QUESTIONS = 20

/** Declension from lemma ending + gender, on the ACCENT-STRIPPED lemma (θεός ends in an
 * accented ό, which a literal /ος$/ misses). The -ος neuters (ἔθνος) and -μα neuters
 * (πνεῦμα) are 3rd; γυνή (γυναικός) is the lexical exception. */
const THIRD = new Set(['γυνή'])
function declension(lemma: string, gender: string | null): 1 | 2 | 3 {
  if (THIRD.has(lemma.normalize('NFC'))) return 3
  const b = lemma.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (/ος$/.test(b)) return gender === 'Neuter' ? 3 : 2
  if (/(ον|ους)$/.test(b)) return 2                       // incl. contracts (Ἰησοῦς, νοῦς)
  if (gender === 'Neuter' && /α$/.test(b)) return 3       // -μα / -α neuters
  if (/[ηα]$/.test(b)) return 1
  if (/(ης|ας)$/.test(b) && gender === 'Masculine') return 1
  return 3
}
const lemmaOf = (p: string) => p.match(/\(([^\s—)]+)\s*—/)?.[1] ?? ''

async function generate(spec: Spec) {
  if (!spec.declensions) {
    return generateMorphologyQuestionsBySubtype(
      spec.subtype, QUESTIONS, spec.week, spec.fields.length ? spec.fields : undefined, spec.filter)
  }
  // The parse pool has no declension field, so over-generate and classify by lemma.
  const raw = await generateMorphologyQuestionsBySubtype(
    spec.subtype, 200, spec.week, spec.fields.length ? spec.fields : undefined, spec.filter)
  const want = new Set<number>(spec.declensions)
  const seen = new Set<string>()
  const out: Array<(typeof raw)[number]> = []
  for (const q of raw) {
    const ans = JSON.parse(q.correctAnswer) as { gender: string | null }
    const lem = lemmaOf(q.prompt)
    if (!lem || seen.has(q.prompt) || !want.has(declension(lem, ans.gender))) continue
    seen.add(q.prompt)
    out.push(q)
    if (out.length === QUESTIONS) break
  }
  return out.map((q, i) => ({ ...q, position: i + 1 }))
}

/** The Thursday of course-week N (week 1 starts at the course's startDate). */
function thursdayOfWeek(courseStart: Date, week: number): Date {
  const start = new Date(courseStart)
  const day = start.getDay()                    // 0=Sun
  const thursdayOffset = (4 - day + 7) % 7      // days from start to its week's Thursday
  const d = new Date(start)
  d.setDate(start.getDate() + thursdayOffset + (week - 1) * 7)
  d.setHours(23, 59, 59, 0)                     // due end of day
  return d
}

async function main() {
  const course = await prisma.course.findFirst({ where: { name: { contains: COURSE } } })
  if (!course) { console.error(`No course matching "${COURSE}"`); process.exit(1) }
  console.log(`${course.name}: ${course.startDate.toDateString()} – ${course.endDate.toDateString()}\n`)

  const existing = await prisma.assignment.findMany({
    where: { courseId: course.id, title: { contains: SERIES } }, select: { id: true, title: true },
  })
  if (existing.length > 0) {
    console.error(`REFUSING: ${existing.length} "${SERIES}" assignments already exist (e.g. "${existing[0].title}"). Delete them first to rebuild.`)
    process.exit(1)
  }

  let created = 0
  for (const spec of SPECS) {
    const due = thursdayOfWeek(course.startDate, spec.week)
    if (spec.dueOffset) due.setDate(due.getDate() + spec.dueOffset)
    const title = `Week ${spec.week} — ${SERIES} (${spec.topic})`
    const qs = await generate(spec)
    const flag = qs.length < QUESTIONS ? `   (pool gave ${qs.length})` : ''
    console.log(`wk ${String(spec.week).padStart(2)}  ${due.toDateString()}  ${title.slice(0, 66).padEnd(66)} ${qs.length}q${flag}`)
    if (!APPLY) continue
    const a = await prisma.assignment.create({
      data: {
        courseId: course.id,
        createdById: course.instructorId,
        title,
        type: 'MORPHOLOGY_QUIZ',
        weekNumber: spec.week,
        dueDate: due,
        level: course.level,
        morphSubtype: spec.subtype,
        timePerQuestion: null,        // untimed — parsing takes thought
        maxRetakes: null,             // unlimited, per the instructor's morphology settings
        allowLate: true,
        lateDaysLimit: 5,
        maxAppeals: 0,
        isPublished: true,
      },
    })
    await prisma.question.createMany({ data: qs.map(q => ({ ...q, assignmentId: a.id })) })
    created++
  }
  console.log(APPLY ? `\ncreated ${created} quizzes` : '\ndry run — nothing written. Re-run with --apply.')
  await prisma.$disconnect()
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })
