/**
 * Scoring regression tests for POST /api/quizzes.
 *
 * Locks in the rule introduced with re-sampling quizzes: a quiz is scored out of
 * the questions ACTUALLY SHOWN this attempt (the submitted set), not out of every
 * question stored on the assignment (which, for a re-sampling pool, can be the
 * whole frequency section). For ordinary fixed quizzes the student answers every
 * stored question, so this is identical to the old behaviour.
 */

// ── Mocks (must be defined before importing the route) ──
const getPayload = jest.fn()
const rateLimit = jest.fn().mockReturnValue({ ok: true })
const gradeResponse = jest.fn()
const getAssignmentScore = jest.fn()

const assignmentFindUnique = jest.fn()
const enrollmentFindFirst = jest.fn()
const quizAttemptFindMany = jest.fn()
const txResponseCreate = jest.fn()

jest.mock('@/lib/auth', () => ({ getPayload: () => getPayload() }))
// The subscription paywall gate is covered by its own suite; no-op it here.
jest.mock('@/lib/subscription', () => ({ requireStudentAccess: async () => null, studentHasAccess: async () => true }))
jest.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/lib/logger', () => ({ logError: jest.fn() }))
jest.mock('@/lib/grading', () => ({
  gradeResponse: (...a: unknown[]) => gradeResponse(...a),
  getAssignmentScore: (...a: unknown[]) => getAssignmentScore(...a),
}))
jest.mock('@/lib/db', () => ({
  prisma: {
    assignment: { findUnique: (...a: unknown[]) => assignmentFindUnique(...a) },
    enrollment: { findFirst: (...a: unknown[]) => enrollmentFindFirst(...a) },
    quizAttempt: { findMany: (...a: unknown[]) => quizAttemptFindMany(...a) },
    // $transaction runs the callback with a stub tx that records nothing we assert on.
    $transaction: async (fn: (tx: unknown) => unknown) => fn({
      response: {
        deleteMany: async () => ({}),
        create: (...a: unknown[]) => txResponseCreate(...a),
        findMany: async () => [],
      },
      quizAttempt: { create: async () => ({}), updateMany: async () => ({}) },
    }),
  },
}))

import { POST } from '@/app/api/quizzes/route'

function makeReq(body: unknown): import('next/server').NextRequest {
  return { json: async () => body } as unknown as import('next/server').NextRequest
}

/** Build an assignment whose stored pool has `poolSize` one-point questions q1…qN. */
function mockAssignment(poolSize: number) {
  const questions = Array.from({ length: poolSize }, (_, i) => ({ id: `q${i + 1}`, prompt: `p${i + 1}`, points: 1 }))
  assignmentFindUnique.mockResolvedValueOnce({
    courseId: 'c1', maxRetakes: null, isPublished: true, provideDefinition: false, questions,
  })
}

beforeEach(() => {
  getPayload.mockReset().mockReturnValue({ sub: 'student1', role: 'STUDENT', email: 's@x.test' })
  rateLimit.mockReset().mockReturnValue({ ok: true })
  enrollmentFindFirst.mockReset().mockResolvedValue({ id: 'enr1' })   // enrolled
  quizAttemptFindMany.mockReset().mockResolvedValue([])               // first attempt
  txResponseCreate.mockReset().mockResolvedValue({ id: 'resp1' })
  assignmentFindUnique.mockReset()
  getAssignmentScore.mockReset().mockResolvedValue({ earned: 0, total: 0, percentage: 0 })
  // Grade by convention: answer 'right' is correct (1 pt), anything else wrong (0).
  gradeResponse.mockReset().mockImplementation(async (_id: string, answer: string) =>
    answer === 'right'
      ? { isCorrect: true, score: 1, correctAnswer: 'x' }
      : { isCorrect: false, score: 0, correctAnswer: 'x' },
  )
})

describe('POST /api/quizzes — scoring is out of questions shown this attempt', () => {
  it('scores a re-sampling subset out of the SHOWN count, not the whole pool', async () => {
    mockAssignment(158) // pool of 158 (e.g. a whole frequency section)
    // Student was shown 3 of the pool and got 2 right.
    const res = await POST(makeReq({
      assignmentId: 'a1',
      responses: [
        { questionId: 'q1', answer: 'right' },
        { questionId: 'q2', answer: 'right' },
        { questionId: 'q3', answer: 'wrong' },
      ],
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.result.totalQuestions).toBe(3)        // not 158
    expect(body.result.correctAnswers).toBe(2)
    expect(body.result.percentage).toBe(67)           // 2/3, NOT 2/158 (~1%)
  })

  it('a fixed quiz (all stored questions shown) scores exactly as before', async () => {
    mockAssignment(4)
    const res = await POST(makeReq({
      assignmentId: 'a1',
      responses: [
        { questionId: 'q1', answer: 'right' },
        { questionId: 'q2', answer: 'right' },
        { questionId: 'q3', answer: 'right' },
        { questionId: 'q4', answer: 'wrong' },
      ],
    }))
    const body = await res.json()
    expect(body.result.totalQuestions).toBe(4)
    expect(body.result.percentage).toBe(75)           // 3/4
  })

  it('awards 100% when every shown question is correct (subset of a pool)', async () => {
    mockAssignment(50)
    const res = await POST(makeReq({
      assignmentId: 'a1',
      responses: [
        { questionId: 'q1', answer: 'right' },
        { questionId: 'q2', answer: 'right' },
      ],
    }))
    const body = await res.json()
    expect(body.result.percentage).toBe(100)
    expect(body.result.totalQuestions).toBe(2)
  })

  it('ignores a submitted question that is not part of the assignment pool', async () => {
    mockAssignment(2) // pool has q1, q2 only
    const res = await POST(makeReq({
      assignmentId: 'a1',
      responses: [
        { questionId: 'q1', answer: 'right' },
        { questionId: 'qX', answer: 'right' }, // not in the pool → skipped
      ],
    }))
    const body = await res.json()
    expect(body.result.totalQuestions).toBe(1)        // qX dropped
    expect(body.result.percentage).toBe(100)          // 1/1, qX excluded from total
  })
})

describe('POST /api/quizzes — guards', () => {
  it('401 when unauthenticated', async () => {
    getPayload.mockReturnValueOnce(null)
    const res = await POST(makeReq({ assignmentId: 'a1', responses: [{ questionId: 'q1', answer: 'right' }] }))
    expect(res.status).toBe(401)
  })

  it('403 when the student is not enrolled', async () => {
    mockAssignment(3)
    enrollmentFindFirst.mockResolvedValueOnce(null)
    const res = await POST(makeReq({ assignmentId: 'a1', responses: [{ questionId: 'q1', answer: 'right' }] }))
    expect(res.status).toBe(403)
  })

  it('400 when no responses are submitted', async () => {
    const res = await POST(makeReq({ assignmentId: 'a1', responses: [] }))
    expect(res.status).toBe(400)
  })
})
