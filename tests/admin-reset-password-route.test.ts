/**
 * POST /api/admin/users/[id]/reset-password — the admin's "reset and email the credentials".
 *
 * This used to hand a `mailto:` draft to the admin's own mail client. When that client could
 * not send it, the reset had ALREADY happened and the plaintext existed nowhere else, so a
 * student was left locked out of an account whose temporary password no longer existed.
 * The message is sent from the server now, and the response says whether it went — which is
 * what lets the UI show the password instead of losing it.
 */
const userFindUnique = jest.fn()
const userUpdate = jest.fn()
const verifyToken = jest.fn()
const sendEmail = jest.fn()
const emailConfigured = jest.fn()
const recordAudit = jest.fn()
const rateLimit = jest.fn()

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => userFindUnique(...a),
      update: (...a: unknown[]) => userUpdate(...a),
    },
  },
}))
jest.mock('@/lib/auth', () => ({
  getTokenFromCookies: () => 'tok',
  verifyToken: () => verifyToken(),
  hashPassword: async (p: string) => `hashed:${p}`,
}))
jest.mock('@/lib/email', () => ({
  sendEmail: (...a: unknown[]) => sendEmail(...a),
  emailConfigured: () => emailConfigured(),
  escapeHtml: (s: string) => s,
}))
jest.mock('@/lib/audit', () => ({ recordAudit: (...a: unknown[]) => recordAudit(...a) }))
jest.mock('@/lib/rate-limit', () => ({ rateLimit: (...a: unknown[]) => rateLimit(...a) }))
jest.mock('@/lib/logger', () => ({ logError: jest.fn() }))

import { POST } from '@/app/api/admin/users/[userId]/reset-password/route'

const call = () => POST({} as never, { params: Promise.resolve({ userId: 'u1' }) })
const STUDENT = {
  id: 'u1', email: 'sam@example.edu', role: 'STUDENT', deletedAt: null,
  firstName: 'Sam', surname: 'Student',
}

beforeEach(() => {
  jest.clearAllMocks()
  verifyToken.mockReturnValue({ sub: 'admin1', email: 'admin@x.edu', role: 'ADMIN' })
  rateLimit.mockReturnValue({ ok: true, retryAfter: 0 })
  userFindUnique.mockResolvedValue(STUDENT)
  userUpdate.mockResolvedValue({})
  sendEmail.mockResolvedValue({ sent: true })
  emailConfigured.mockReturnValue(true)
})

describe('admin reset-password', () => {
  it('emails the student and says that it did', async () => {
    const body = await (await call()).json()
    expect(body.emailSent).toBe(true)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    const [opts] = sendEmail.mock.calls[0] as [{ to: string[]; text: string; html: string }]
    expect(opts.to).toEqual(['sam@example.edu'])
    // The password the student is told is the one that was actually set.
    expect(opts.text).toContain(body.tempPassword)
    expect(opts.html).toContain(body.tempPassword)
  })

  it('still returns the plaintext when the send fails, so it is not lost', async () => {
    sendEmail.mockResolvedValue({ sent: false })
    const body = await (await call()).json()
    expect(body.emailSent).toBe(false)
    expect(body.tempPassword).toEqual(expect.any(String))
    expect(body.tempPassword.length).toBeGreaterThan(8)
    // The reset happened regardless — which is exactly why the UI must show the password.
    expect(userUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ mustChangePassword: true }),
    }))
  })

  it('distinguishes "mail is off here" from "this send failed"', async () => {
    sendEmail.mockResolvedValue({ sent: false })
    emailConfigured.mockReturnValue(false)
    expect((await (await call()).json()).emailConfigured).toBe(false)
  })

  it('sends only AFTER the password has been changed', async () => {
    const order: string[] = []
    userUpdate.mockImplementation(async () => { order.push('update'); return {} })
    sendEmail.mockImplementation(async () => { order.push('send'); return { sent: true } })
    await call()
    expect(order).toEqual(['update', 'send'])
  })

  it('records whether the message went out in the audit trail', async () => {
    sendEmail.mockResolvedValue({ sent: false })
    await call()
    const [entry] = recordAudit.mock.calls[0] as [{ action: string; after: Record<string, unknown> }]
    expect(entry.action).toBe('user.passwordReset')
    expect(entry.after).toEqual({ mustChangePassword: true, emailSent: false })
  })

  it('never puts the plaintext in the audit trail', async () => {
    const body = await (await call()).json()
    expect(JSON.stringify(recordAudit.mock.calls[0])).not.toContain(body.tempPassword)
  })

  it('refuses anyone who is not an admin', async () => {
    verifyToken.mockReturnValue({ sub: 'i1', role: 'INSTRUCTOR' })
    expect((await call()).status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('will not reset another admin, and sends nothing when it refuses', async () => {
    userFindUnique.mockResolvedValue({ ...STUDENT, role: 'ADMIN', id: 'other-admin' })
    expect((await call()).status).toBe(403)
    expect(userUpdate).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('respects the daily budget', async () => {
    rateLimit.mockReturnValue({ ok: false, retryAfter: 3600 })
    expect((await call()).status).toBe(429)
    expect(userUpdate).not.toHaveBeenCalled()
  })
})

describe('the message itself', () => {
  it('speaks every language the app speaks, and quotes the credentials once', async () => {
    const body = await (await call()).json()
    const [opts] = sendEmail.mock.calls[0] as [{ text: string; html: string; subject: string }]
    for (const phrase of ['choose your own password', 'contraseña temporal', 'временного пароля', '臨時密碼']) {
      expect(opts.text).toContain(phrase)
    }
    // Nothing in the data says which language this person reads — there is no per-user locale,
    // and Course.language is the language a course is ASSESSED in — so the credentials appear
    // once, language-neutral, and only the instruction repeats.
    expect(opts.text.match(new RegExp(body.tempPassword, 'g'))).toHaveLength(1)
    expect(opts.subject).toContain('Datos de acceso')
  })

  it('always quotes an ABSOLUTE sign-in URL, even with no app URL configured', async () => {
    const saved = process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_APP_URL = ''
    const body = await (await call()).json()
    expect(body.signInUrl).toBe('https://seminarygreek.app/auth/sign-in')
    process.env.NEXT_PUBLIC_APP_URL = saved
  })

  it('hands the admin the same address it emailed', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.test'
    const body = await (await call()).json()
    const [opts] = sendEmail.mock.calls[0] as [{ text: string }]
    expect(body.signInUrl).toBe('https://example.test/auth/sign-in')
    expect(opts.text).toContain('https://example.test/auth/sign-in')
    delete process.env.NEXT_PUBLIC_APP_URL
  })
})
