/**
 * @jest-environment jsdom
 */
/**
 * The dialog that shows a temporary password after an admin resets one.
 *
 * It matters more than a dialog usually would: by the time it opens the password has already
 * been changed, and the server stores no plaintext. If this does not render — or renders
 * without the password — a failed send leaves the student locked out of an account whose
 * temporary password exists nowhere. That was the old behaviour, via a mailto: draft.
 */
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'

const USER = {
  id: 'u1', firstName: 'Sam', surname: 'Student', email: 'sam@example.edu',
  role: 'STUDENT', institution: null, approved: true, deletedAt: null,
  createdAt: new Date().toISOString(), _count: { instructorCourses: 0, enrollments: 1 },
}

function mockFetch(reset: Record<string, unknown>) {
  return jest.fn(async (url: string, init?: RequestInit) => {
    if (String(url).includes('reset-password') && init?.method === 'POST') {
      return { ok: true, json: async () => reset } as Response
    }
    return { ok: true, json: async () => ({ users: [USER], total: 1 }) } as Response
  })
}

// user-event installs its own clipboard stub; asking for it here keeps the copy assertions
// pointed at that one rather than a second stub fighting it.
let user: ReturnType<typeof userEvent.setup>
beforeEach(() => {
  jest.spyOn(window, 'confirm').mockReturnValue(true)
  user = userEvent.setup()
})
afterEach(() => jest.restoreAllMocks())

async function resetFor(response: Record<string, unknown>) {
  global.fetch = mockFetch(response) as unknown as typeof fetch
  render(<AdminUsersTable />)
  await screen.findByText('sam@example.edu')
  await user.click(screen.getByTitle(/reset password/i))
}

describe('temporary password dialog', () => {
  it('shows the password and says the email went', async () => {
    await resetFor({ ok: true, tempPassword: 'Kp7mRt4xVw2n', emailSent: true, emailConfigured: true })
    await waitFor(() => expect(screen.getByText('Kp7mRt4xVw2n')).toBeInTheDocument())
    expect(screen.getByText(/Emailed to/)).toBeInTheDocument()
  })

  it('shows the password and warns when the email did NOT go', async () => {
    await resetFor({ ok: true, tempPassword: 'Kp7mRt4xVw2n', emailSent: false, emailConfigured: true })
    await waitFor(() => expect(screen.getByText('Kp7mRt4xVw2n')).toBeInTheDocument())
    expect(screen.getByText(/Not emailed/)).toBeInTheDocument()
    expect(screen.getByText(/could not be sent just now/)).toBeInTheDocument()
  })

  it('says so plainly when mail is not configured at all', async () => {
    await resetFor({ ok: true, tempPassword: 'Kp7mRt4xVw2n', emailSent: false, emailConfigured: false })
    await waitFor(() => expect(screen.getByText(/not configured/)).toBeInTheDocument())
    expect(screen.getByText('Kp7mRt4xVw2n')).toBeInTheDocument()
  })

  it('copies the password on demand', async () => {
    await resetFor({ ok: true, tempPassword: 'Kp7mRt4xVw2n', emailSent: false, emailConfigured: true })
    await waitFor(() => expect(screen.getByText('Kp7mRt4xVw2n')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /copy password/i }))
    expect(await window.navigator.clipboard.readText()).toBe('Kp7mRt4xVw2n')
  })

  it('offers the whole message, with the password in it, for sending by hand', async () => {
    await resetFor({
      ok: true, tempPassword: 'Kp7mRt4xVw2n', emailSent: false, emailConfigured: true,
      signInUrl: 'https://example.test/auth/sign-in',
    })
    await waitFor(() => expect(screen.getByText('Kp7mRt4xVw2n')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /copy whole message/i }))
    const text = await window.navigator.clipboard.readText()
    expect(text).toContain('Kp7mRt4xVw2n')
    expect(text).toContain('sam@example.edu')
    // The address the SERVER used, not one the client invented: they used to disagree.
    expect(text).toContain('https://example.test/auth/sign-in')
    // Every language the app speaks, because nothing tells us which one this person reads.
    expect(text).toContain('choose your own password')      // English
    expect(text).toContain('contraseña temporal')            // Spanish
    expect(text).toContain('временного пароля')              // Russian
    expect(text).toContain('臨時密碼')                        // Chinese
  })

  it('cannot be dismissed by Escape when the email did not go', async () => {
    // The dialog holds the only copy: a stray keypress must not take it away.
    await resetFor({ ok: true, tempPassword: 'Kp7mRt4xVw2n', emailSent: false, emailConfigured: true })
    await waitFor(() => expect(screen.getByText('Kp7mRt4xVw2n')).toBeInTheDocument())
    await user.keyboard('{Escape}')
    expect(screen.getByText('Kp7mRt4xVw2n')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^close$/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /saved the password/i }))
    await waitFor(() => expect(screen.queryByText('Kp7mRt4xVw2n')).not.toBeInTheDocument())
  })

  it('closes normally once the email HAS gone', async () => {
    await resetFor({ ok: true, tempPassword: 'Kp7mRt4xVw2n', emailSent: true, emailConfigured: true })
    await waitFor(() => expect(screen.getByText('Kp7mRt4xVw2n')).toBeInTheDocument())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText('Kp7mRt4xVw2n')).not.toBeInTheDocument())
  })
})
