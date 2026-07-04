/**
 * Tests for POST /api/appeals — the student appeal-creation endpoint.
 *
 * The valuable invariants here are policy rules that aren't covered by Jest
 * elsewhere: in particular, the maxAppeals cap (so a student can't exceed the
 * instructor-set budget) and the gate that only wrong vocab answers are
 * appealable. Each test mocks just the dependencies it needs.
 */

// ── Mock @/lib/db, @/lib/auth, @/lib/rate-limit, and next/cache BEFORE import ──
const responseFindUnique = jest.fn()
const appealFindUnique = jest.fn()
const appealCount = jest.fn()
const appealCreate = jest.fn()
const getPayload = jest.fn()
const rateLimit = jest.fn().mockReturnValue({ ok: true })

jest.mock('@/lib/db', () => ({
  prisma: {
    response: { findUnique: (...a: unknown[]) => responseFindUnique(...a) },
    vocabAppeal: {
      findUnique: (...a: unknown[]) => appealFindUnique(...a),
      count: (...a: unknown[]) => appealCount(...a),
      create: (...a: unknown[]) => appealCreate(...a),
    },
  },
}))
jest.mock('@/lib/auth', () => ({ getPayload: () => getPayload() }))
// The subscription paywall gate is covered by its own suite; no-op it here.
jest.mock('@/lib/subscription', () => ({ requireStudentAccess: async () => null, studentHasAccess: async () => true }))
jest.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/lib/logger', () => ({ logError: jest.fn() }))

import { POST } from '@/app/api/appeals/route'

function makeReq(body: unknown): import('next/server').NextRequest {
  // Only `.json()` is used by the handler — a minimal stub suffices.
  return { json: async () => body } as unknown as import('next/server').NextRequest
}

function mockOkResponse(overrides: Record<string, unknown> = {}) {
  responseFindUnique.mockResolvedValueOnce({
    id: 'resp1',
    userId: 'student1',
    assignmentId: 'asgn1',
    questionId: 'q1',
    isCorrect: false,
    answer: 'unclean',
    assignment: { type: 'VOCABULARY_QUIZ', maxAppeals: 2, courseId: 'course1' },
    ...overrides,
  })
}

beforeEach(() => {
  responseFindUnique.mockReset()
  appealFindUnique.mockReset().mockResolvedValue(null)
  appealCount.mockReset().mockResolvedValue(0)
  appealCreate.mockReset().mockResolvedValue({ id: 'appeal1', createdAt: new Date() })
  getPayload.mockReset().mockReturnValue({ sub: 'student1', role: 'STUDENT', email: 's@x.test' })
  rateLimit.mockReset().mockReturnValue({ ok: true })
})

describe('POST /api/appeals — maxAppeals cap (regression for instructor-set budget)', () => {
  it('allows the first appeal when count < cap', async () => {
    mockOkResponse() // cap = 2
    appealCount.mockResolvedValueOnce(0)
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.appealsRemaining).toBe(1)
    expect(appealCreate).toHaveBeenCalledTimes(1)
  })

  it('allows the final appeal when count == cap - 1', async () => {
    mockOkResponse() // cap = 2
    appealCount.mockResolvedValueOnce(1)
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.appealsRemaining).toBe(0)
  })

  it('REJECTS a 3rd appeal when cap is 2 (the main regression we care about)', async () => {
    mockOkResponse() // cap = 2
    appealCount.mockResolvedValueOnce(2) // already used 2
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toMatch(/used your 2 appeals/i)
    expect(appealCreate).not.toHaveBeenCalled()
  })

  it('rejects when cap is 0 (appeals disabled for the quiz)', async () => {
    mockOkResponse({ assignment: { type: 'VOCABULARY_QUIZ', maxAppeals: 0, courseId: 'c1' } })
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/not enabled/i)
    expect(appealCreate).not.toHaveBeenCalled()
  })

  it('rejects when cap is null (unset)', async () => {
    mockOkResponse({ assignment: { type: 'VOCABULARY_QUIZ', maxAppeals: null, courseId: 'c1' } })
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(400)
  })

  it('uses singular "appeal" in the error when cap is 1', async () => {
    mockOkResponse({ assignment: { type: 'VOCABULARY_QUIZ', maxAppeals: 1, courseId: 'c1' } })
    appealCount.mockResolvedValueOnce(1)
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toMatch(/used your 1 appeal\b/i)
    expect(body.error).not.toMatch(/appeals\b/i)
  })
})

describe('POST /api/appeals — guards', () => {
  it('401 when unauthenticated', async () => {
    getPayload.mockReturnValueOnce(null)
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(401)
  })

  it('404 when the response belongs to a different student (no leak)', async () => {
    mockOkResponse({ userId: 'someone-else' })
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(404)
  })

  it('400 when the response is already marked correct', async () => {
    mockOkResponse({ isCorrect: true })
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/wrong answers/i)
  })

  it('400 when the assignment is not a vocab quiz', async () => {
    mockOkResponse({ assignment: { type: 'MORPHOLOGY_QUIZ', maxAppeals: 2, courseId: 'c1' } })
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/vocab quizzes/i)
  })

  it('409 when the student has already appealed this exact response', async () => {
    mockOkResponse()
    appealFindUnique.mockResolvedValueOnce({ id: 'existing-appeal' })
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(409)
    expect(appealCreate).not.toHaveBeenCalled()
  })

  it('429 when the rate limit fires (carpet-bomb defence)', async () => {
    rateLimit.mockReturnValueOnce({ ok: false, retryAfter: 30 })
    const res = await POST(makeReq({ responseId: 'resp1' }))
    expect(res.status).toBe(429)
  })

  it('400 when the body is missing responseId', async () => {
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })
})
