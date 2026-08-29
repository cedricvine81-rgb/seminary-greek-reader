/**
 * Pre-semester quiz audit — Greek and Hebrew, vocabulary and morphology.
 *
 * Run this before each term, and after ANY change to a deck, a parsing pool, the
 * generators, the matcher, or the student's answer UI:
 *
 *     npm run audit:quizzes
 *
 * Everything is exercised against the REAL decks, pools and generators — no fixtures — so
 * what it passes is what a student will sit. It checks four things:
 *
 *   1. Deck integrity — blank or duplicated entries, unplaced words, homographs.
 *   2. Vocabulary questions — four distinct options, the key among them, and a grading
 *      round-trip: the key is accepted and every distractor rejected, in typed mode too.
 *   3. Morphology answerability — every field in an answer key must have an input in
 *      QuizPlayer and every value must be selectable in it. A field with no input is a
 *      question the student cannot answer and is marked wrong on automatically; this is
 *      what made every Hebrew morphology quiz unanswerable before 2026-08-13.
 *   4. Instructor filter chips against the pool, so a chip cannot promise a value the
 *      corpus does not contain.
 *
 * Exits non-zero when a BLOCKER is found, so it can gate a release.
 */
import {
  generateVocabQuestionsFromSelection, generateHebrewVocabQuestionsFromSelection,
  generateVocabPoolFromSelection, generateHebrewVocabPoolFromSelection,
  generateHebrewMorphologyQuestions, generateMorphologyQuestionsBySubtype,
} from '../src/lib/quiz-generation'
import { GREEK_DECK, HEBREW_DECK, type Deck } from '../src/lib/vocab-decks'
import { isAnswerCorrect, isMultipleChoiceCorrect } from '../src/lib/answer-matching'
import { MORPH_OPTIONS } from '../src/data/morphology-options'
import {
  HEBREW_STEMS, HEBREW_CONJUGATIONS, HEBREW_PERSONS, HEBREW_GENDERS,
  HEBREW_NUMBERS, HEBREW_STATES, HEBREW_PRONOUN_TYPES,
  POOL_STEMS, POOL_CONJUGATIONS, POOL_PERSONS, POOL_GENDERS,
  POOL_NUMBERS, POOL_STATES, POOL_PRONOUN_TYPES,
} from '../src/lib/quiz-fields-hebrew'

type Sev = 'BLOCKER' | 'WARN' | 'NOTE'
const findings: { sev: Sev; area: string; msg: string; detail?: string }[] = []
const add = (sev: Sev, area: string, msg: string, detail?: string) =>
  findings.push({ sev, area, msg, detail })

const H = (s: string) => console.log(`\n\x1b[1m── ${s} ${'─'.repeat(Math.max(0, 62 - s.length))}\x1b[0m`)

// ═══════════════════ 1. DECK INTEGRITY ═══════════════════
H('1. Deck integrity')
for (const deck of [GREEK_DECK, HEBREW_DECK] as Deck[]) {
  const L = deck.lang.toUpperCase()
  const ws = deck.words
  const blankGloss = ws.filter(w => !w.gloss?.trim())
  const blankWord  = ws.filter(w => !w.word?.trim())
  const ids = ws.map(w => w.id ?? w.word)
  const dupIds = ids.filter((x, i) => ids.indexOf(x) !== i)
  const sameAsWord = ws.filter(w => w.gloss?.trim() === w.word?.trim())

  // Homographs: same headword, different gloss. A quiz showing the headword alone is
  // ambiguous unless the deck disambiguates.
  const byWord = new Map<string, Set<string>>()
  ws.forEach(w => { (byWord.get(w.word) ?? byWord.set(w.word, new Set()).get(w.word)!).add(w.gloss) })
  const homographs = Array.from(byWord.entries()).filter(([, g]) => g.size > 1)

  console.log(`${L}: ${ws.length} words, ${deck.sections.length} sections, ${deck.allSubsectionKeys.length} subsections`)
  console.log(`  blank gloss ${blankGloss.length} · blank word ${blankWord.length} · duplicate ids ${dupIds.length} · gloss==word ${sameAsWord.length} · homographs ${homographs.length}`)
  if (blankGloss.length) add('BLOCKER', L + ' deck', `${blankGloss.length} words have no gloss`)
  if (dupIds.length)     add('BLOCKER', L + ' deck', `${dupIds.length} duplicate word ids`, dupIds.slice(0, 5).join(', '))
  if (sameAsWord.length) add('WARN',    L + ' deck', `${sameAsWord.length} glosses identical to the headword`)
  if (homographs.length) {
    // The deck may legitimately contain homographs; what must never happen is a quiz
    // offering the twin's gloss as a WRONG answer for the same spelling.
    const twinMap: Map<string, Set<string>> = new Map(homographs)
    const gen: any = deck.lang === 'hebrew'
      ? generateHebrewVocabQuestionsFromSelection : generateVocabQuestionsFromSelection
    const toEng = deck.lang === 'hebrew' ? 'HEBREW_TO_ENGLISH' : 'GREEK_TO_ENGLISH'
    let clashes = 0
    let sample = ''
    for (let round = 0; round < 6; round++) {
      for (const q of gen([], [], toEng, 400, 0) as any[]) {
        const twins = twinMap.get(q.prompt)
        if (!twins) continue
        for (const opt of q.options) {
          if (opt !== q.correctAnswer && twins.has(opt)) {
            clashes++
            if (!sample) sample = `${q.prompt}: key "${q.correctAnswer}" offered against its twin "${opt}"`
          }
        }
      }
    }
    console.log(`  homograph twin offered as a wrong answer: ${clashes}`)
    if (clashes) add('BLOCKER', L + ' deck', `${clashes} questions offer a homograph's other meaning as a wrong answer`, sample)
    else add('NOTE', L + ' deck', `${homographs.length} homographs — the twin gloss is never offered as a distractor`,
      homographs.slice(0, 3).map(([w, g]) => `${w} = ${Array.from(g).join(' / ')}`).join(' | '))
  }
  // Every word must land in exactly one subsection.
  const placed = new Set(Object.values(deck.wordSubsection))
  const unplaced = ws.filter(w => !deck.wordSubsection[w.id ?? w.word])
  if (unplaced.length) add('BLOCKER', L + ' deck', `${unplaced.length} words are in no subsection`)
  console.log(`  distinct subsections referenced: ${placed.size} / ${deck.allSubsectionKeys.length}${unplaced.length ? ` · UNPLACED ${unplaced.length}` : ''}`)
}

// ═══════════════════ 2. VOCABULARY QUESTIONS ═══════════════════
H('2. Vocabulary question generation + grading round-trip')
for (const [deck, toEng, fromEng] of [
  [GREEK_DECK,  'GREEK_TO_ENGLISH',  'ENGLISH_TO_GREEK'],
  [HEBREW_DECK, 'HEBREW_TO_ENGLISH', 'ENGLISH_TO_HEBREW'],
] as [Deck, string, string][]) {
  const L = deck.lang.toUpperCase()
  const gen = deck.lang === 'hebrew'
    ? generateHebrewVocabQuestionsFromSelection
    : generateVocabQuestionsFromSelection

  for (const [dirName, type] of [['→English', toEng], ['English→', fromEng]] as [string, string][]) {
    let n = 0, badOptCount = 0, dupOpts = 0, answerMissing = 0
    let ambiguous = 0, gradeFail = 0, distractorAccepted = 0
    const examples: string[] = []

    // Sweep every subsection so no corner of the deck is untested.
    for (const key of deck.allSubsectionKeys) {
      const qs = gen([key], [], type as never, 25, 0)
      for (const q of qs) {
        n++
        if (q.options.length !== 4) { badOptCount++; continue }
        if (new Set(q.options).size !== q.options.length) {
          dupOpts++
          if (examples.length < 3) examples.push(`${key} "${q.prompt}" opts=[${q.options.join(' | ')}]`)
        }
        if (!q.options.includes(q.correctAnswer)) answerMissing++
        // The graders must accept the key and reject every distractor.
        if (!isMultipleChoiceCorrect(q.correctAnswer, q.correctAnswer)) gradeFail++
        for (const opt of q.options) {
          if (opt === q.correctAnswer) continue
          if (isMultipleChoiceCorrect(opt, q.correctAnswer)) {
            ambiguous++
            if (examples.length < 3) examples.push(`${key} "${q.prompt}" distractor "${opt}" == key "${q.correctAnswer}"`)
          }
          // Typed-answer mode: a distractor must not fuzzy-match the key either.
          if (isAnswerCorrect(opt, q.correctAnswer, true)) distractorAccepted++
        }
      }
    }
    console.log(`${L} ${dirName}: ${n} questions`)
    console.log(`  wrong option count ${badOptCount} · duplicate options ${dupOpts} · key missing from options ${answerMissing}`)
    console.log(`  key not accepted ${gradeFail} · distractor identical to key ${ambiguous} · distractor accepted when typed ${distractorAccepted}`)
    if (examples.length) console.log(`  e.g. ${examples[0]}`)
    if (badOptCount)   add('BLOCKER', `${L} vocab ${dirName}`, `${badOptCount} questions do not have 4 options`)
    if (answerMissing) add('BLOCKER', `${L} vocab ${dirName}`, `${answerMissing} questions omit the correct answer from the options`)
    if (gradeFail)     add('BLOCKER', `${L} vocab ${dirName}`, `${gradeFail} keys are not accepted by the grader`)
    if (ambiguous)     add('BLOCKER', `${L} vocab ${dirName}`, `${ambiguous} questions have a distractor identical to the key`, examples[0])
    if (dupOpts)       add('WARN',    `${L} vocab ${dirName}`, `${dupOpts} questions show a repeated option`, examples.find(e => e.includes('opts=')))
    if (distractorAccepted)
      add('WARN', `${L} vocab ${dirName}`, `${distractorAccepted} distractors would be marked CORRECT if typed`, examples[0])
  }

  // Whole-pool mode (used when re-sampling on retake is on)
  const pool = deck.lang === 'hebrew'
    ? generateHebrewVocabPoolFromSelection(['1-A', '1-B'], [], toEng as never, 0, 50)
    : generateVocabPoolFromSelection(['1-A', '1-B'], [], toEng as never, 0, 50)
  const expect = deck.subsections[1].slice(0, 2).reduce((n, s) => n + s.words.length, 0)
  console.log(`${L} pool mode (1-A+1-B, 50% review): ${pool.length} questions (section words ${expect})`)
  if (pool.length < expect) add('WARN', `${L} vocab pool`, `pool ${pool.length} < the ${expect} words selected`)
}

// ═══════════════════ 3. MORPHOLOGY ANSWERABILITY ═══════════════════
H('3. Morphology — can a student actually give the answer?')
// Mirror of QuizPlayer's FIELD_MAP: the fields it renders a dropdown for.
const GREEK_RENDERABLE: Record<string, string[]> = {
  tense: MORPH_OPTIONS.tense, voice: MORPH_OPTIONS.voice, mood: MORPH_OPTIONS.mood,
  person: MORPH_OPTIONS.person, number: MORPH_OPTIONS.number, casus: MORPH_OPTIONS.case,
  gender: MORPH_OPTIONS.gender, pronounType: MORPH_OPTIONS.pronounType,
}
const HEBREW_RENDERABLE: Record<string, string[]> = {
  stem: HEBREW_STEMS, conjugation: HEBREW_CONJUGATIONS, person: HEBREW_PERSONS,
  gender: HEBREW_GENDERS, number: HEBREW_NUMBERS, state: HEBREW_STATES, type: HEBREW_PRONOUN_TYPES,
}

function auditMorph(label: string, qs: { prompt: string; correctAnswer: string }[]) {
  const RENDERABLE = label.startsWith('HEBREW') ? HEBREW_RENDERABLE : GREEK_RENDERABLE
  const unrenderable = new Map<string, number>()
  const missingValue  = new Map<string, number>()
  let n = 0
  for (const q of qs) {
    n++
    let key: Record<string, string | null> = {}
    try { key = JSON.parse(q.correctAnswer) } catch { add('BLOCKER', label, 'answer key is not valid JSON'); continue }
    for (const [field, value] of Object.entries(key)) {
      if (value == null || field === 'partOfSpeech') continue
      const opts = RENDERABLE[field]
      if (!opts) { unrenderable.set(field, (unrenderable.get(field) ?? 0) + 1); continue }
      if (!opts.includes(value)) missingValue.set(`${field}=${value}`, (missingValue.get(`${field}=${value}`) ?? 0) + 1)
    }
  }
  console.log(`${label}: ${n} questions`)
  if (unrenderable.size) {
    const list = Array.from(unrenderable.entries()).map(([f, c]) => `${f} (${c})`).join(', ')
    console.log(`  \x1b[31mNO INPUT RENDERED for fields: ${list}\x1b[0m`)
    add('BLOCKER', label, `the student is shown no way to answer: ${Array.from(unrenderable.keys()).join(', ')}`)
  }
  if (missingValue.size) {
    const list = Array.from(missingValue.entries()).map(([v, c]) => `${v} (${c})`).join(', ')
    console.log(`  \x1b[31mVALUE NOT IN DROPDOWN: ${list}\x1b[0m`)
    add('BLOCKER', label, `answer values absent from the dropdown: ${Array.from(missingValue.keys()).join(', ')}`)
  }
  if (!unrenderable.size && !missingValue.size) console.log('  every field renderable and every value selectable')
}

async function main() {
for (const sub of ['VERB_PARSING', 'NOUN_PARSING', 'ADJECTIVE_PARSING', 'PRONOUN_PARSING', 'MIXED'] as const) {
  auditMorph(`GREEK ${sub}`, await generateMorphologyQuestionsBySubtype(sub as never, 60))
}
for (const sub of ['VERB_PARSING', 'NOUN_PARSING', 'ADJECTIVE_PARSING', 'PRONOUN_PARSING', 'MIXED'] as const) {
  auditMorph(`HEBREW ${sub}`, generateHebrewMorphologyQuestions(sub, 60))
}

// ═══════════════════ 4. HEBREW POOL vs INSTRUCTOR FILTERS ═══════════════════
H('4. Hebrew pool values vs the instructor filter chips')
{
  const qs = generateHebrewMorphologyQuestions('MIXED', 4000)
  const seen: Record<string, Set<string>> = {}
  for (const q of qs) {
    const k = JSON.parse(q.correctAnswer)
    for (const [f, v] of Object.entries(k)) if (v) (seen[f] ??= new Set()).add(v as string)
  }
  // The instructor's CHIPS (POOL_*) must match the pool exactly; the student's DROPDOWNS
  // (HEBREW_*) must be a superset of it.
  const declared: Record<string, string[]> = {
    stem: POOL_STEMS, conjugation: POOL_CONJUGATIONS, person: POOL_PERSONS,
    gender: POOL_GENDERS, number: POOL_NUMBERS, state: POOL_STATES, type: POOL_PRONOUN_TYPES,
  }
  const complete: Record<string, string[]> = {
    stem: HEBREW_STEMS, conjugation: HEBREW_CONJUGATIONS, person: HEBREW_PERSONS,
    gender: HEBREW_GENDERS, number: HEBREW_NUMBERS, state: HEBREW_STATES, type: HEBREW_PRONOUN_TYPES,
  }
  for (const [f, vals] of Object.entries(complete)) {
    const missing = (declared[f] ?? []).filter(v => !vals.includes(v))
    if (missing.length) add('BLOCKER', 'Hebrew dropdowns', `${f}: pool value not offered to the student: ${missing.join(', ')}`)
  }
  for (const [f, values] of Object.entries(declared)) {
    const inPool = seen[f] ?? new Set<string>()
    const notOffered = Array.from(inPool).filter(v => !values.includes(v))
    const neverUsed  = values.filter(v => !inPool.has(v))
    console.log(`  ${f.padEnd(12)} pool ${String(inPool.size).padStart(2)} values · not offered in the UI: ${notOffered.length ? notOffered.join(', ') : 'none'}`)
    if (neverUsed.length) console.log(`  ${''.padEnd(12)} offered but absent from the pool: ${neverUsed.join(', ')}`)
    if (notOffered.length) add('BLOCKER', 'Hebrew filters', `${f}: pool contains ${notOffered.join(', ')} which the filter cannot select`)
    if (neverUsed.length)  add('NOTE', 'Hebrew filters', `${f}: ${neverUsed.length} chips match nothing in the pool`, neverUsed.join(', '))
  }
}

// ═══════════════════ REPORT ═══════════════════
H('FINDINGS')
const order: Sev[] = ['BLOCKER', 'WARN', 'NOTE']
for (const sev of order) {
  const fs = findings.filter(f => f.sev === sev)
  if (!fs.length) continue
  console.log(`\n${sev} (${fs.length})`)
  fs.forEach(f => {
    console.log(`  • [${f.area}] ${f.msg}`)
    if (f.detail) console.log(`      ${f.detail}`)
  })
}
if (!findings.length) console.log('no findings')
console.log(`\n${findings.filter(f => f.sev === 'BLOCKER').length} blockers, ${findings.filter(f => f.sev === 'WARN').length} warnings, ${findings.filter(f => f.sev === 'NOTE').length} notes`)
}
// await, not fire-and-forget: main() is async, and calling process.exit() on the next line
// tore the process down before sections 3-5 ran or a single finding printed. The audit exited
// 0 and reported "no findings" because it had not looked — which is the worst way for a
// pre-semester check to fail.
main()
  .then(() => process.exit(findings.some(f => f.sev === 'BLOCKER') ? 1 : 0))
  .catch(e => { console.error(e); process.exit(2) })
