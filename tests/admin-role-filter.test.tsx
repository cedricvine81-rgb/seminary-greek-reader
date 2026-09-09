/**
 * @jest-environment jsdom
 */
/**
 * The admin user list is one alphabetical run of every account, so finding an instructor meant
 * reading past a hundred and thirty-five students. The role chips answer "which kind?" first.
 */
import '@testing-library/jest-dom'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'

const mk = (id: string, firstName: string, role: string, email: string) => ({
  id, firstName, surname: 'Person', email, role, institution: null, approved: true,
  deletedAt: null, createdAt: new Date().toISOString(),
  _count: { instructorCourses: 0, enrollments: 0 },
})
const USERS = [
  mk('s1', 'Anna', 'STUDENT', 'anna@x.edu'),
  mk('s2', 'Ben', 'STUDENT', 'ben@x.edu'),
  mk('i1', 'Cara', 'INSTRUCTOR', 'cara@x.edu'),
  mk('a1', 'Dan', 'ADMIN', 'dan@x.edu'),
]

let user: ReturnType<typeof userEvent.setup>
beforeEach(async () => {
  user = userEvent.setup()
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ users: USERS }) })) as unknown as typeof fetch
  render(<AdminUsersTable />)
  await screen.findByText('anna@x.edu')
})

const table = () => screen.getByRole('table')

describe('filtering the admin user list by role', () => {
  it('counts each kind of account', () => {
    expect(screen.getByRole('button', { name: /Everyone 4/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Instructors 1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Students 2/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Admins 1/ })).toBeInTheDocument()
  })

  it('shows only instructors when asked for instructors', async () => {
    await user.click(screen.getByRole('button', { name: /Instructors/ }))
    await waitFor(() => expect(within(table()).getByText('cara@x.edu')).toBeInTheDocument())
    expect(within(table()).queryByText('anna@x.edu')).not.toBeInTheDocument()
    expect(within(table()).queryByText('dan@x.edu')).not.toBeInTheDocument()
    expect(screen.getByText('1 user found')).toBeInTheDocument()
  })

  it('goes back to everyone', async () => {
    await user.click(screen.getByRole('button', { name: /Instructors/ }))
    await waitFor(() => expect(within(table()).queryByText('anna@x.edu')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Everyone/ }))
    await waitFor(() => expect(within(table()).getByText('anna@x.edu')).toBeInTheDocument())
    expect(screen.getByText('4 users found')).toBeInTheDocument()
  })

  it('narrows the alphabet strips to the role being viewed', async () => {
    // A is Anna, a student: with instructors selected it must not be offered as a live letter.
    await user.click(screen.getByRole('button', { name: /Instructors/ }))
    const a = screen.getAllByRole('button', { name: 'A' })[0]
    await waitFor(() => expect(a).toBeDisabled())
  })

  it('counts within the current search rather than the whole list', async () => {
    await user.type(screen.getByPlaceholderText(/search/i), 'cara')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Instructors 1/ })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Students 0/ })).toBeInTheDocument()
    // Nothing to show for a role the search has emptied, so the chip is not a live option.
    expect(screen.getByRole('button', { name: /Students 0/ })).toBeDisabled()
  })
})
