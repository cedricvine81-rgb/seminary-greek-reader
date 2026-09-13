/**
 * PATCH /api/admin/users/[id] — telling BOTH addresses when a sign-in email is changed.
 *
 * Changing someone's sign-in email used to notify nobody: the address changed, the audit log
 * recorded it, and the person concerned found out when they could not sign in. The new address
 * needs to know what to use; the old one needs to know the login has moved away from it, which
 * is the only warning available if the change was not asked for.
 */
const userFindUnique = jest.fn()
const userUpdate = jest.fn()
const verifyToken = jest.fn()
const sendEmail = jest.fn()
const recordAudit = jest.fn()

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
jest.mock('@/lib/email', () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a) }))
jest.mock('@/lib/audit', () => ({ recordAudit: (...a: unknown[]) => recordAudit(...a) }))
jest.mock('@/lib/logger', () => ({ logError: jest.fn() }))

import { PATCH } from '@/app/api/admin/users/[userId]/route'

const req = (body: unknown) => ({ json: async () => body }) as unknown as import('next/server').NextRequest
const call = (body: unknown) => PATCH(req(body), { params: Promise.resolve({ userId: 'u1' }) })

const BEFORE = {
  id: 'u1', email: 'old@example.edu', role: 'STUDENT', approved: true,
  firstName: 'Sam', surname: 'Student', institution: null, deletedAt: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  verifyToken.mockReturnValue({ sub: 'admin1', email: 'admin@x.edu', role: 'ADMIN' })
  userFindUnique.mockResolvedValue(BEFORE)
  userUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
    ({ ...BEFORE, ...data }))
  sendEmail.mockResolvedValue({ sent: true })
})

const sentTo = (address: string) =>
  sendEmail.mock.calls.find(([o]) => (o as { to: string[] }).to[0] === address)?.[0] as
    { subject: string; text: string; html: string } | undefined

describe('changing a sign-in email', () => {
  it('writes to the new address and to the old one', async () => {
    const body = await (await call({ email: 'new@example.edu' })).json()
    expect(sendEmail).toHaveBeenCalledTimes(2)
    expect(sentTo('new@example.edu')).toBeDefined()
    expect(sentTo('old@example.edu')).toBeDefined()
    expect(body.notified).toEqual({ newAddress: true, oldAddress: true })
  })

  it('tells each address the thing only it needs', async () => {
    await call({ email: 'new@example.edu' })
    // The new address: what to sign in with now.
    expect(sentTo('new@example.edu')!.text).toContain('changed to new@example.edu')
    // The old address: the login has moved AWAY, and what to do if that is wrong.
    expect(sentTo('old@example.edu')!.text).toContain('can no longer be used to sign in')
    expect(sentTo('old@example.edu')!.text).toContain('If you did not ask for this')
  })

  it('says it in every language the app speaks', async () => {
    await call({ email: 'new@example.edu' })
    for (const message of [sentTo('new@example.edu')!, sentTo('old@example.edu')!]) {
      expect(message.text).toMatch(/Seminary Greek/)
      expect(message.text).toMatch(/[а-яА-Я]/)      // Russian
      expect(message.text).toMatch(/[一-鿿]/) // Chinese
      expect(message.text).toMatch(/tu|Tu|correo/)   // Spanish
    }
  })

  it('says nothing when the email did not change', async () => {
    const body = await (await call({ firstName: 'Samuel' })).json()
    expect(sendEmail).not.toHaveBeenCalled()
    expect(body.notified).toBeNull()
  })

  it('treats a case-only or whitespace edit as no change', async () => {
    await call({ email: '  OLD@example.edu ' })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('trims what it stores, since sign-in matches the address exactly as saved', async () => {
    await call({ email: '  new@example.edu  ' })
    expect(userUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ email: 'new@example.edu' }),
    }))
  })

  it('reports a failed notice rather than hiding it', async () => {
    sendEmail.mockImplementation(async ({ to }: { to: string[] }) =>
      ({ sent: to[0] !== 'old@example.edu' }))
    const body = await (await call({ email: 'new@example.edu' })).json()
    expect(body.notified).toEqual({ newAddress: true, oldAddress: false })
  })

  it('changes the address first and announces it after', async () => {
    const order: string[] = []
    userUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      order.push('update'); return { ...BEFORE, ...data }
    })
    sendEmail.mockImplementation(async () => { order.push('send'); return { sent: true } })
    await call({ email: 'new@example.edu' })
    expect(order[0]).toBe('update')
    expect(order).toHaveLength(3)
  })

  it('records in the audit trail whether each notice went out', async () => {
    sendEmail.mockResolvedValue({ sent: false })
    await call({ email: 'new@example.edu' })
    const [entry] = recordAudit.mock.calls[0] as [{ after: Record<string, unknown> }]
    expect(entry.after.notified).toEqual({ newAddress: false, oldAddress: false })
  })

  it('still refuses anyone who is not an admin', async () => {
    verifyToken.mockReturnValue({ sub: 'i1', role: 'INSTRUCTOR' })
    expect((await call({ email: 'new@example.edu' })).status).toBe(401)
    expect(userUpdate).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
