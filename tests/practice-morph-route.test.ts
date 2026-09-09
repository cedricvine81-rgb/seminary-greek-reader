/**
 * POST /api/practice/morph — the student's own drill: count, then generate.
 *
 * The property worth pinning is the CLAMP. The generators drop a filter that matches fewer
 * than min(requested, 3) forms — right for an instructor's over-tight quiz, a silent lie for a
 * student who asked for exactly those forms. Asking for min(want, count) makes the fallback
 * unreachable, so this test asserts the number handed to the generator, not just the response.
 */
const countGreek = jest.fn()
const genGreek = jest.fn()
const countHebrew = jest.fn()
const genHebrew = jest.fn()
const getPayload = jest.fn()
const requireStudentAccess = jest.fn()
const rateLimit = jest.fn()

jest.mock('@/lib/auth', () => ({ getPayload: () => getPayload() }))
jest.mock('@/lib/subscription', () => ({ requireStudentAccess: (...a: unknown[]) => requireStudentAccess(...a) }))
jest.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }))
jest.mock('@/lib/logger', () => ({ logError: jest.fn() }))
jest.mock('@/lib/quiz-generation', () => ({
  countMorphForms: (...a: unknown[]) => countGreek(...a),
  generateMorphQuestionsFromConfig: (...a: unknown[]) => genGreek(...a),
  countHebrewMorphForms: (...a: unknown[]) => countHebrew(...a),
  generateHebrewMorphologyQuestions: (...a: unknown[]) => genHebrew(...a),
}))

import { POST } from '@/app/api/practice/morph/route'

const req = (body: unknown) => ({ json: async () => body }) as unknown as import('next/server').NextRequest
const GREEK = {
  lang: 'greek', subtype: 'VERB_PARSING',
  fields: ['tense', 'voice', 'mood', 'person', 'number'],
  parseFilter: { tenses: ['Aorist'] },
}

beforeEach(() => {
  jest.clearAllMocks()
  getPayload.mockReturnValue({ sub: 'student1', role: 'STUDENT' })
  requireStudentAccess.mockResolvedValue(null)
  rateLimit.mockReturnValue({ ok: true, retryAfter: 0 })
  countGreek.mockResolvedValue(500)
  countHebrew.mockReturnValue(500)
  genGreek.mockResolvedValue([{ position: 1 }])
  genHebrew.mockReturnValue([{ position: 1 }])
})

describe('POST /api/practice/morph', () => {
  it('counts without generating when no questions are asked for', async () => {
    const body = await (await POST(req({ ...GREEK, count: 0 }))).json()
    expect(body.count).toBe(500)
    expect(body.questions).toBeUndefined()
    expect(genGreek).not.toHaveBeenCalled()
  })

  it('clamps the request to the number of forms that exist', async () => {
    countGreek.mockResolvedValue(2)
    await POST(req({ ...GREEK, count: 15 }))
    // 2, not 15 — asking for what exists is what stops the generator dropping the filter.
    expect(genGreek).toHaveBeenCalledWith('VERB_PARSING', 2, null, expect.anything())
  })

  it('asks for the full quiz when the pool is deep enough', async () => {
    await POST(req({ ...GREEK, count: 15 }))
    expect(genGreek).toHaveBeenCalledWith('VERB_PARSING', 15, null, expect.anything())
  })

  it('generates nothing at all when nothing matches', async () => {
    countGreek.mockResolvedValue(0)
    const res = await POST(req({ ...GREEK, count: 15 }))
    const body = await res.json()
    expect(body.count).toBe(0)
    expect(body.questions).toBeUndefined()
    expect(genGreek).not.toHaveBeenCalled()
  })

  it('clamps the Hebrew side the same way', async () => {
    countHebrew.mockReturnValue(3)
    await POST(req({ lang: 'hebrew', subtype: 'VERB_PARSING', fields: ['stem'], parseFilter: { stems: ['Qal'] }, count: 15 }))
    expect(genHebrew).toHaveBeenCalledWith('VERB_PARSING', 3, ['stem'], { stems: ['Qal'] }, null)
  })

  it('passes only known filter axes and known fields through', async () => {
    await POST(req({
      ...GREEK,
      fields: ['tense', 'evil'.repeat(20), 'voice'],
      parseFilter: { tenses: ['Aorist'], nonsense: ['x'], voices: 'not-an-array' },
      count: 0,
    }))
    // countMorphForms(subtype, vocabThruLesson, config)
    const [, , config] = countGreek.mock.calls[0] as [string, number | null, { fields: string[]; parseFilter: Record<string, unknown> }]
    expect(config.fields).toEqual(['tense', 'voice'])
    expect(config.parseFilter).toEqual({ tenses: ['Aorist'] })
  })

  it('caps the vocabulary lesson at the last one that exists', async () => {
    await POST(req({ ...GREEK, vocabThruLesson: 99, count: 0 }))
    expect(countGreek).toHaveBeenCalledWith('VERB_PARSING', 16, expect.anything())
  })

  it('refuses a subtype the generator does not know', async () => {
    expect((await POST(req({ ...GREEK, subtype: 'CONDITIONALS' }))).status).toBe(400)
    expect((await POST(req({ ...GREEK, subtype: 'DROP TABLE' }))).status).toBe(400)
    expect(countGreek).not.toHaveBeenCalled()
  })

  it('requires a signed-in caller', async () => {
    getPayload.mockReturnValue(null)
    expect((await POST(req(GREEK))).status).toBe(401)
  })

  it('honours the subscription gate', async () => {
    const { NextResponse } = await import('next/server')
    requireStudentAccess.mockResolvedValue(NextResponse.json({ error: 'subscription_required' }, { status: 402 }))
    expect((await POST(req(GREEK))).status).toBe(402)
    expect(countGreek).not.toHaveBeenCalled()
  })

  it('rate-limits a caller who hammers it', async () => {
    rateLimit.mockReturnValue({ ok: false, retryAfter: 30 })
    const res = await POST(req(GREEK))
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('30')
  })

  it('answers a malformed body with 400, not 500', async () => {
    // A 500 also logs to the error log, so junk requests would fill it with other people's noise.
    const bad = { json: async () => { throw new SyntaxError('unexpected token') } } as unknown as import('next/server').NextRequest
    expect((await POST(bad)).status).toBe(400)
  })

  it('writes nothing', async () => {
    // There is no prisma import in this route at all; if one appears, this mock makes the
    // suite fail loudly rather than let a practice run start recording.
    const src = await import('fs').then(fs =>
      fs.readFileSync('src/app/api/practice/morph/route.ts', 'utf8'))
    expect(src).not.toMatch(/prisma/)
  })
})
