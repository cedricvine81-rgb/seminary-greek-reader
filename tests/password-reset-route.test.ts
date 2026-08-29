/**
 * POST /api/auth — the self-service password reset.
 *
 * The invariants worth holding here are the ones a reset flow is usually got wrong on:
 *
 *   - the request step must answer identically for a real address, an unknown one and a
 *     rate-limited caller, or the form becomes an account-enumeration oracle
 *   - the plaintext token must never be what is stored
 *   - an expired or already-spent ticket must not redeem
 *   - redeeming one ticket must spend every other outstanding ticket for that user, so a
 *     forwarded older email stops working
 *   - a successful reset must clear mustChangePassword, or an admin-created account is sent
 *     straight back to the forced-change screen with a password it just chose
 */
import { createHash } from 'node:crypto'

const userFindUnique = jest.fn()
const userUpdate = jest.fn()
const tokenCreate = jest.fn()
const tokenFindUnique = jest.fn()
const tokenUpdateMany = jest.fn()
const transaction = jest.fn(async (ops: unknown[]) => ops)
const rateLimit = jest.fn().mockReturnValue({ ok: true, retryAfter: 0 })
const sendEmail = jest.fn().mockResolvedValue({ sent: true })
const emailConfigured = jest.fn().mockReturnValue(true)

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => userFindUnique(...a),
      update: (...a: unknown[]) => userUpdate(...a),
      create: jest.fn(),
    },
    passwordResetToken: {
      create: (...a: unknown[]) => tokenCreate(...a),
      findUnique: (...a: unknown[]) => tokenFindUnique(...a),
      updateMany: (...a: unknown[]) => tokenUpdateMany(...a),
    },
    $transaction: (...a: [unknown[]]) => transaction(...a),
  },
}))
jest.mock('@/lib/auth', () => ({
  hashPassword: async (p: string) => `hashed:${p}`,
  verifyPassword: jest.fn(),
  signToken: jest.fn(),
  setAuthCookie: jest.fn(),
  clearAuthCookie: jest.fn(),
  getTokenFromCookies: jest.fn(),
  verifyToken: jest.fn(),
}))
jest.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }))
jest.mock('@/lib/email', () => ({
  sendEmail: (...a: unknown[]) => sendEmail(...a),
  emailConfigured: () => emailConfigured(),
  escapeHtml: (s: string) => s,
}))
jest.mock('@/lib/app-settings', () => ({ instructorNotifyRecipients: jest.fn() }))
jest.mock('@/lib/logger', () => ({ logError: jest.fn() }))
jest.mock('next/headers', () => ({ cookies: () => ({ delete: jest.fn(), set: jest.fn(), get: jest.fn() }) }))

import { POST } from '@/app/api/auth/route'

function req(body: unknown) {
  return {
    json: async () => body,
    headers: { get: () => '203.0.113.9' },
  } as unknown as Parameters<typeof POST>[0]
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

beforeEach(() => {
  jest.clearAllMocks()
  rateLimit.mockReturnValue({ ok: true, retryAfter: 0 })
  emailConfigured.mockReturnValue(true)
  sendEmail.mockResolvedValue({ sent: true })
  transaction.mockImplementation(async (ops: unknown[]) => ops)
})

describe('request-password-reset', () => {
  it('answers the same for a known address, an unknown one, and a throttled caller', async () => {
    userFindUnique.mockResolvedValue({ id: 'u1', firstName: 'Ada', deletedAt: null })
    const known = await POST(req({ action: 'request-password-reset', email: 'ada@x.edu' }))

    userFindUnique.mockResolvedValue(null)
    const unknown = await POST(req({ action: 'request-password-reset', email: 'nobody@x.edu' }))

    rateLimit.mockReturnValue({ ok: false, retryAfter: 60 })
    const throttled = await POST(req({ action: 'request-password-reset', email: 'ada@x.edu' }))

    expect([known.status, unknown.status, throttled.status]).toEqual([200, 200, 200])
    const bodies = await Promise.all([known.json(), unknown.json(), throttled.json()])
    expect(bodies[0]).toEqual(bodies[1])
    expect(bodies[1]).toEqual(bodies[2])
  })

  it('sends nothing for an unknown address', async () => {
    userFindUnique.mockResolvedValue(null)
    await POST(req({ action: 'request-password-reset', email: 'nobody@x.edu' }))
    expect(tokenCreate).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('sends nothing to a soft-deleted account', async () => {
    userFindUnique.mockResolvedValue({ id: 'u1', firstName: 'Ada', deletedAt: new Date() })
    await POST(req({ action: 'request-password-reset', email: 'ada@x.edu' }))
    expect(tokenCreate).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('stores only the hash, and mails a link carrying the plaintext', async () => {
    userFindUnique.mockResolvedValue({ id: 'u1', firstName: 'Ada', deletedAt: null })
    await POST(req({ action: 'request-password-reset', email: 'ada@x.edu' }))

    const stored = tokenCreate.mock.calls[0][0].data.tokenHash as string
    const link = sendEmail.mock.calls[0][0].text as string
    const raw = /token=([A-Za-z0-9_-]+)/.exec(link)?.[1] ?? ''

    expect(raw.length).toBeGreaterThan(20)
    expect(stored).toBe(sha256(raw))
    expect(stored).not.toContain(raw)
    expect(link).not.toContain(stored)
  })

  it('refuses rather than pretending when email is not configured', async () => {
    emailConfigured.mockReturnValue(false)
    const res = await POST(req({ action: 'request-password-reset', email: 'ada@x.edu' }))
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'email_not_configured' })
    expect(tokenCreate).not.toHaveBeenCalled()
  })
})

describe('reset-password', () => {
  const future = () => new Date(Date.now() + 60_000)
  const past = () => new Date(Date.now() - 60_000)

  it('rejects an unknown token', async () => {
    tokenFindUnique.mockResolvedValue(null)
    const res = await POST(req({ action: 'reset-password', token: 'nope', password: 'longenough1' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid_token' })
    expect(transaction).not.toHaveBeenCalled()
  })

  it('rejects an expired token', async () => {
    tokenFindUnique.mockResolvedValue({ id: 't1', userId: 'u1', expiresAt: past(), usedAt: null })
    const res = await POST(req({ action: 'reset-password', token: 'raw', password: 'longenough1' }))
    expect(res.status).toBe(400)
    expect(transaction).not.toHaveBeenCalled()
  })

  it('rejects a token that has already been spent', async () => {
    tokenFindUnique.mockResolvedValue({ id: 't1', userId: 'u1', expiresAt: future(), usedAt: new Date() })
    const res = await POST(req({ action: 'reset-password', token: 'raw', password: 'longenough1' }))
    expect(res.status).toBe(400)
    expect(transaction).not.toHaveBeenCalled()
  })

  it('rejects a short password before touching the token', async () => {
    const res = await POST(req({ action: 'reset-password', token: 'raw', password: 'short' }))
    expect(res.status).toBe(400)
    expect(tokenFindUnique).not.toHaveBeenCalled()
  })

  it('looks the token up by its hash, never by the plaintext', async () => {
    tokenFindUnique.mockResolvedValue({ id: 't1', userId: 'u1', expiresAt: future(), usedAt: null })
    await POST(req({ action: 'reset-password', token: 'plaintext-abc', password: 'longenough1' }))
    expect(tokenFindUnique.mock.calls[0][0].where.tokenHash).toBe(sha256('plaintext-abc'))
  })

  it('sets the password, clears mustChangePassword, and spends every outstanding ticket', async () => {
    tokenFindUnique.mockResolvedValue({ id: 't1', userId: 'u1', expiresAt: future(), usedAt: null })
    const res = await POST(req({ action: 'reset-password', token: 'raw', password: 'longenough1' }))
    expect(res.status).toBe(200)

    expect(userUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'u1' },
      data: { password: 'hashed:longenough1', mustChangePassword: false },
    }))
    expect(tokenUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'u1', usedAt: null },
    }))
    // Both writes must land together: a password changed without spending the ticket would
    // leave a live reset link for an account that has already moved on.
    expect(transaction).toHaveBeenCalledTimes(1)
  })
})
