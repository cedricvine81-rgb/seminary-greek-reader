/**
 * POST /api/quizzes with practice: true.
 *
 * A student who has used their attempts still wants to test themselves on the material — that is
 * what the quiz is for once the marks are settled. A practice run is graded by the SAME server
 * code as a real attempt, so the morphology partial credit, the allowance for ambiguous forms and
 * the vocabulary matching all behave identically; grading it in the browser instead would be a
 * second implementation, and it would drift silently.
 *
 * What these tests guard is the other half: that practising costs nothing. No attempt row, no
 * response rows, no effect on the best score, and no refusal when the retake ceiling is reached —
 * which is precisely when practice matters.
 */
const assignmentFindUnique = jest.fn()
const attemptFindMany = jest.fn()
const attemptCreate = jest.fn()
const responseCreateManyAndReturn = jest.fn()
const responseDeleteMany = jest.fn()
const transaction = jest.fn()
const getPayload = jest.fn()
const enrollmentFindFirst = jest.fn()

jest.mock('@/lib/db', () => ({
  prisma: {
    assignment: { findUnique: (...a: unknown[]) => assignmentFindUnique(...a) },
    enrollment: { findFirst: (...a: unknown[]) => enrollmentFindFirst(...a) },
    quizAttempt: {
      findMany: (...a: unknown[]) => attemptFindMany(...a),
      create: (...a: unknown[]) => attemptCreate(...a),
    },
    response: {
      createManyAndReturn: (...a: unknown[]) => responseCreateManyAndReturn(...a),
      deleteMany: (...a: unknown[]) => responseDeleteMany(...a),
      findMany: async () => [],
    },
    $transaction: (...a: unknown[]) => transaction(...a),
  },
}))
jest.mock('@/lib/auth', () => ({ getPayload: () => getPayload() }))
jest.mock('@/lib/subscription', () => ({ requireStudentAccess: async () => null, studentHasAccess: async () => true }))
jest.mock('@/lib/rate-limit', () => ({ rateLimit: () => ({ ok: true }) }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/lib/logger', () => ({ logError: jest.fn() }))
jest.mock('@/lib/scores', () => ({ getAssignmentScore: async () => ({ earned: 1 }) }))

import { POST } from '@/app/api/quizzes/route'

const req = (body: unknown) => ({ json: async () => body }) as unknown as import('next/server').NextRequest

const QUESTION = {
  id: 'q1', prompt: 'ἀγάπη', points: 1, type: 'MULTIPLE_CHOICE',
  correctAnswer: 'love', assignmentId: 'a1',
}

function setup({ attempts = 0, maxRetakes = 0 as number | null } = {}) {
  jest.clearAllMocks()
  getPayload.mockReturnValue({ sub: 'student1', role: 'STUDENT' })
  enrollmentFindFirst.mockResolvedValue({ id: 'e1' })
  assignmentFindUnique.mockResolvedValue({
    id: 'a1', courseId: 'c1', isPublished: true, maxRetakes, maxAppeals: 0,
    provideDefinition: false, questions: [QUESTION], course: { language: 'en' },
  })
  responseCreateManyAndReturn.mockResolvedValue([{ id: 'r1', questionId: 'q1' }])
  responseDeleteMany.mockResolvedValue({ count: 0 })
  attemptCreate.mockResolvedValue({ id: 'at-new' })
  attemptFindMany.mockResolvedValue(
    Array.from({ length: attempts }, (_, i) => ({ id: `at${i}`, attemptNumber: i + 1, isBest: i === 0, percentage: 50 })))
  transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      response: { deleteMany: responseDeleteMany, createManyAndReturn: responseCreateManyAndReturn, findMany: async () => [] },
      quizAttempt: { create: attemptCreate, updateMany: jest.fn() },
    }))
}

describe('practice runs are graded but never recorded', () => {
  it('writes nothing at all', async () => {
    setup()
    const res = await POST(req({ assignmentId: 'a1', practice: true, responses: [{ questionId: 'q1', answer: 'love' }] }))
    expect(res.status).toBe(200)
    expect(transaction).not.toHaveBeenCalled()
    expect(attemptCreate).not.toHaveBeenCalled()
    expect(responseCreateManyAndReturn).not.toHaveBeenCalled()
  })

  it('still grades, and says it was practice', async () => {
    setup()
    const body = await (await POST(req({ assignmentId: 'a1', practice: true, responses: [{ questionId: 'q1', answer: 'love' }] }))).json()
    expect(body.result.practice).toBe(true)
    expect(body.result.percentage).toBe(100)
    expect(body.result.correctAnswers).toBe(1)
  })

  it('marks a wrong practice answer wrong, like any other', async () => {
    setup()
    const body = await (await POST(req({ assignmentId: 'a1', practice: true, responses: [{ questionId: 'q1', answer: 'hatred' }] }))).json()
    expect(body.result.percentage).toBe(0)
  })

  it('never claims a new best score', async () => {
    setup({ attempts: 1 })
    const body = await (await POST(req({ assignmentId: 'a1', practice: true, responses: [{ questionId: 'q1', answer: 'love' }] }))).json()
    expect(body.result.isNewBest).toBe(false)
  })

  it('is allowed once the graded attempts are exhausted — the case it exists for', async () => {
    setup({ attempts: 1, maxRetakes: 0 })   // one attempt allowed, one already taken
    const res = await POST(req({ assignmentId: 'a1', practice: true, responses: [{ questionId: 'q1', answer: 'love' }] }))
    expect(res.status).toBe(200)
  })

  it('still refuses a GRADED attempt once they are exhausted', async () => {
    setup({ attempts: 1, maxRetakes: 0 })
    const res = await POST(req({ assignmentId: 'a1', responses: [{ questionId: 'q1', answer: 'love' }] }))
    expect(res.status).toBe(403)
    expect(attemptCreate).not.toHaveBeenCalled()
  })

  it('records a real attempt when practice is not asked for', async () => {
    setup()
    const res = await POST(req({ assignmentId: 'a1', responses: [{ questionId: 'q1', answer: 'love' }] }))
    expect(res.status).toBe(200)
    expect(transaction).toHaveBeenCalled()
    expect(attemptCreate).toHaveBeenCalled()
  })
})
