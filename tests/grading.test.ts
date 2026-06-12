// Mock the Prisma client BEFORE importing the module under test.
const findUnique = jest.fn()
const lexFindFirst = jest.fn().mockResolvedValue(null)
const lexFindMany = jest.fn().mockResolvedValue([])
jest.mock('@/lib/db', () => ({
  prisma: {
    question: { findUnique: (...args: unknown[]) => findUnique(...args) },
    lexicalEntry: {
      findFirst: (...args: unknown[]) => lexFindFirst(...args),
      findMany: (...args: unknown[]) => lexFindMany(...args),
    },
  },
}))

import { gradeResponse } from '@/lib/grading'

type QuestionShape = {
  id: string
  type: string
  prompt: string
  correctAnswer: string
  points: number
  assignmentId: string
}

function mockQuestion(q: Partial<QuestionShape>) {
  findUnique.mockResolvedValueOnce({
    id: 'q1',
    type: 'GREEK_TO_ENGLISH',
    prompt: 'λόγος',
    correctAnswer: 'word',
    points: 1,
    assignmentId: 'a1',
    ...q,
  })
}

beforeEach(() => {
  findUnique.mockReset()
  lexFindFirst.mockReset().mockResolvedValue(null)
  lexFindMany.mockReset().mockResolvedValue([])
})

describe('gradeResponse — vocab (exact)', () => {
  it('awards full points for a correct answer', async () => {
    mockQuestion({ correctAnswer: 'word', points: 2 })
    const r = await gradeResponse('q1', 'Word.', false)
    expect(r.isCorrect).toBe(true)
    expect(r.score).toBe(2)
  })

  it('awards zero for a wrong answer', async () => {
    mockQuestion({ correctAnswer: 'word', points: 2 })
    const r = await gradeResponse('q1', 'house', false)
    expect(r.isCorrect).toBe(false)
    expect(r.score).toBe(0)
  })

  it('rejects a typo in exact mode but accepts it in fuzzy mode', async () => {
    mockQuestion({ correctAnswer: 'message', points: 1 })
    const exact = await gradeResponse('q1', 'mesage', false)
    expect(exact.isCorrect).toBe(false)

    mockQuestion({ correctAnswer: 'message', points: 1 })
    const fuzzy = await gradeResponse('q1', 'mesage', true)
    expect(fuzzy.isCorrect).toBe(true)
  })
})

describe('gradeResponse — manual-grade types', () => {
  it('returns 0 / pending for TRANSLATION questions', async () => {
    mockQuestion({ type: 'TRANSLATION', correctAnswer: 'anything', points: 5 })
    const r = await gradeResponse('q1', 'my translation', false)
    expect(r.isCorrect).toBe(false)
    expect(r.score).toBe(0)
  })
})

describe('gradeResponse — morphology', () => {
  it('awards partial credit proportional to matched fields', async () => {
    mockQuestion({
      type: 'MORPHOLOGY_IDENTIFY',
      correctAnswer: JSON.stringify({ tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd' }),
      points: 4,
    })
    const studentAnswer = JSON.stringify({ tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '3rd' })
    const r = await gradeResponse('q1', studentAnswer, false)
    // 3 of 4 fields correct → 3 points, not fully correct
    expect(r.score).toBe(3)
    expect(r.isCorrect).toBe(false)
  })

  it('marks fully correct when every field matches (case-insensitive)', async () => {
    mockQuestion({
      type: 'MORPHOLOGY_IDENTIFY',
      correctAnswer: JSON.stringify({ tense: 'Present', voice: 'Active' }),
      points: 2,
    })
    const r = await gradeResponse('q1', JSON.stringify({ tense: 'present', voice: 'active' }), false)
    expect(r.score).toBe(2)
    expect(r.isCorrect).toBe(true)
  })

  it('does NOT produce NaN when the question has no gradable fields (regression)', async () => {
    mockQuestion({
      type: 'MORPHOLOGY_IDENTIFY',
      correctAnswer: JSON.stringify({}), // no fields → would be 0/0 = NaN without the guard
      points: 3,
    })
    const r = await gradeResponse('q1', JSON.stringify({}), false)
    expect(Number.isNaN(r.score)).toBe(false)
    expect(r.score).toBe(0)
    expect(r.isCorrect).toBe(false)
  })

  it('returns 0 for malformed JSON answers', async () => {
    mockQuestion({
      type: 'MORPHOLOGY_IDENTIFY',
      correctAnswer: JSON.stringify({ tense: 'Present' }),
      points: 1,
    })
    const r = await gradeResponse('q1', 'not-json', false)
    expect(r.score).toBe(0)
    expect(r.isCorrect).toBe(false)
  })
})

describe('gradeResponse — provideDefinition override', () => {
  it('uses the supplied override instead of querying the assignment', async () => {
    mockQuestion({ correctAnswer: 'grace', points: 1 })
    const r = await gradeResponse('q1', 'grce', true) // 1 typo, fuzzy on
    expect(r.isCorrect).toBe(true)
    // Only the question was fetched — no second lookup for the assignment
    expect(findUnique).toHaveBeenCalledTimes(1)
  })
})

describe('gradeResponse — lemma synonyms (acceptedAnswers)', () => {
  it('accepts a curated synonym for a Greek→English typed answer', async () => {
    mockQuestion({ type: 'GREEK_TO_ENGLISH', prompt: 'κηρύσσω', correctAnswer: 'proclaim', points: 1 })
    lexFindFirst.mockResolvedValueOnce({ acceptedAnswers: 'preach, herald, announce' })
    const r = await gradeResponse('q1', 'preach', false)
    expect(r.isCorrect).toBe(true)
    expect(r.score).toBe(1)
    // correctAnswer in the response is unchanged (the original gloss)
    expect(r.correctAnswer).toBe('proclaim')
  })

  it('still rejects an answer not in the synonym list', async () => {
    mockQuestion({ type: 'GREEK_TO_ENGLISH', prompt: 'κηρύσσω', correctAnswer: 'proclaim', points: 1 })
    lexFindFirst.mockResolvedValueOnce({ acceptedAnswers: 'preach, herald' })
    const r = await gradeResponse('q1', 'announce', false)
    expect(r.isCorrect).toBe(false)
  })

  it('falls back to plain matching when the lemma has no curated synonyms', async () => {
    mockQuestion({ type: 'GREEK_TO_ENGLISH', prompt: 'unknown', correctAnswer: 'word', points: 1 })
    // findFirst returns null AND findMany returns nothing — exercises both fallbacks
    const r = await gradeResponse('q1', 'word', false)
    expect(r.isCorrect).toBe(true)
  })

  it('does NOT apply synonyms to multiple-choice questions', async () => {
    mockQuestion({ type: 'MULTIPLE_CHOICE', prompt: 'κηρύσσω', correctAnswer: 'proclaim', points: 1 })
    // Even if the lexicon had synonyms, MC matches the option text whole-string
    lexFindFirst.mockResolvedValueOnce({ acceptedAnswers: 'preach, herald' })
    const r = await gradeResponse('q1', 'preach', false)
    expect(r.isCorrect).toBe(false)
  })
})
