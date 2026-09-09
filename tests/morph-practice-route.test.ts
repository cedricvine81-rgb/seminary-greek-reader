/**
 * GET /api/assignments/[assignmentId]/practice — formative practice for a set parsing quiz.
 *
 * Students asked to rehearse morphology the way they rehearse vocabulary. The answer is to
 * re-run the instructor's own recipe with fresh forms, which makes two things worth guarding:
 *
 *   - it must never touch the graded quiz. The Question rows belong to the real attempt, and a
 *     student pressing Practise must not regenerate, reorder or replace them. The prisma mock
 *     here exposes ONLY reads, so any write at all fails the suite rather than the term.
 *   - it must be the same quiz. Practice that ignores the stored parseFilter would rehearse
 *     the wrong forms, which is worse than no practice — so the recipe is asserted, not just
 *     the status code.
 *
 * Legacy assignments (set before recipes were stored) carry only a part of speech; those fall
 * back to the subtype generator and say so in the response, rather than refusing to open.
 */
const assignmentFindUnique = jest.fn()
const enrollmentFindFirst = jest.fn()
const verifyToken = jest.fn()
const fromConfig = jest.fn()
const hebrewGen = jest.fn()
const nounGen = jest.fn()

jest.mock('@/lib/db', () => ({
  prisma: {
    assignment: { findUnique: (...a: unknown[]) => assignmentFindUnique(...a) },
    enrollment: { findFirst: (...a: unknown[]) => enrollmentFindFirst(...a) },
  },
}))
jest.mock('@/lib/auth', () => ({
  getTokenFromCookies: () => 'tok',
  verifyToken: () => verifyToken(),
}))
jest.mock('@/lib/quiz-generation', () => ({
  generateMorphQuestionsFromConfig: (...a: unknown[]) => fromConfig(...a),
  generateHebrewMorphologyQuestions: (...a: unknown[]) => hebrewGen(...a),
  resolveHebrewVocabCap: async () => 'band-3',
  generateVerbParseQuestions: jest.fn(() => [{ position: 1 }]),
  generateNounParseQuestions: (...a: unknown[]) => nounGen(...a),
  generateAdjectiveParseQuestions: jest.fn(() => []),
  generatePronounParseQuestions: jest.fn(() => []),
  generateConditionalQuestions: jest.fn(() => []),
  generateSubjunctiveQuestions: jest.fn(() => []),
}))
jest.mock('@/lib/logger', () => ({ logError: jest.fn() }))

import { GET } from '@/app/api/assignments/[assignmentId]/practice/route'

const RECIPE = {
  fields: ['tense', 'voice', 'mood', 'person', 'number'],
  parseFilter: { tenses: ['Present', 'Aorist'], moods: ['Indicative', 'Subjunctive'] },
}
const GREEK = {
  id: 'a1', title: 'Week 4 — Morphology', type: 'MORPHOLOGY_QUIZ', level: 'BEGINNING',
  courseId: 'c1', weekNumber: 4, dueDate: new Date('2040-01-01'), isPublished: true,
  morphSubtype: 'VERB_PARSING', morphConfig: RECIPE, vocabThruLesson: 8,
}

const call = () => GET({} as never, { params: { assignmentId: 'a1' } })

function setup(assignment: unknown = GREEK) {
  jest.clearAllMocks()
  verifyToken.mockReturnValue({ sub: 'student1', role: 'STUDENT' })
  enrollmentFindFirst.mockResolvedValue({ id: 'e1' })
  assignmentFindUnique.mockResolvedValue(assignment)
  fromConfig.mockResolvedValue([{ position: 1, prompt: 'λύει' }])
  hebrewGen.mockReturnValue([{ position: 1, prompt: 'קָטַל' }])
  nounGen.mockReturnValue([{ position: 1, prompt: 'λόγος' }])
}

describe('GET /api/assignments/[id]/practice', () => {
  it('generates from the instructor’s stored recipe, capped at the same vocabulary', async () => {
    setup()
    const res = await call()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.lang).toBe('greek')
    expect(body.questions).toHaveLength(1)
    expect(body.vocabCapped).toBe(true)
    expect(body.approximate).toBe(false)
    // subtype, count, vocab cap, recipe — the same four the series regenerator passes.
    expect(fromConfig).toHaveBeenCalledWith('VERB_PARSING', expect.any(Number), 8, RECIPE)
    // Enough of the recipe travels back for the end-of-session "drill these".
    expect(body.subtype).toBe('VERB_PARSING')
    expect(body.fields).toEqual(RECIPE.fields)
    expect(body.vocabThruLesson).toBe(8)
  })

  it('refuses a student who is not enrolled in the course', async () => {
    setup()
    enrollmentFindFirst.mockResolvedValue(null)
    const res = await call()
    expect(res.status).toBe(404)
    expect(fromConfig).not.toHaveBeenCalled()
  })

  it('refuses a student when the assignment is unpublished', async () => {
    setup({ ...GREEK, isPublished: false })
    expect((await call()).status).toBe(404)
  })

  it('lets an instructor open it without an enrollment', async () => {
    setup()
    verifyToken.mockReturnValue({ sub: 'instructor1', role: 'INSTRUCTOR' })
    enrollmentFindFirst.mockResolvedValue(null)
    expect((await call()).status).toBe(200)
  })

  it('turns away anything that is not a parsing quiz', async () => {
    setup({ ...GREEK, type: 'VOCABULARY_QUIZ' })
    expect((await call()).status).toBe(400)
  })

  it('falls back to the part of speech when the assignment predates stored recipes', async () => {
    setup({ ...GREEK, morphSubtype: 'NOUN_PARSING', morphConfig: null, vocabThruLesson: null })
    const body = await (await call()).json()
    expect(nounGen).toHaveBeenCalled()
    expect(fromConfig).not.toHaveBeenCalled()
    // Said out loud in the response, so the UI can warn that the filter is not the quiz's.
    expect(body.approximate).toBe(true)
    expect(body.vocabCapped).toBe(false)
  })

  it('accepts the short subtype names the schema comment used to advertise', async () => {
    // Nothing writes these, but a row carrying one must not fall through the generator's
    // switch to the verb pool — which is exactly what a NOUN (not NOUN_PARSING) quiz did.
    setup({ ...GREEK, morphSubtype: 'NOUN', morphConfig: null, vocabThruLesson: null })
    const body = await (await call()).json()
    expect(nounGen).toHaveBeenCalled()
    expect(body.subtype).toBe('NOUN_PARSING')
  })

  it('uses the Hebrew generator and its own vocabulary band for a Hebrew course', async () => {
    setup({
      ...GREEK, level: 'HEBREW_BEGINNING', morphSubtype: 'VERB_PARSING',
      morphConfig: { fields: ['stem', 'conjugation'], parseFilter: { stems: ['Qal'] }, vocabThruBand: '1C' },
    })
    const body = await (await call()).json()
    expect(body.lang).toBe('hebrew')
    expect(body.vocabCapped).toBe(true)
    expect(hebrewGen).toHaveBeenCalledWith(
      'VERB_PARSING', expect.any(Number), ['stem', 'conjugation'], { stems: ['Qal'] }, 'band-3')
    expect(fromConfig).not.toHaveBeenCalled()
  })

  it('requires a signed-in caller', async () => {
    setup()
    verifyToken.mockReturnValue(null)
    expect((await call()).status).toBe(401)
  })
})
