'use client'
import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Pencil, Trash2, X, Check, Mail, RotateCcw } from 'lucide-react'
import { StudentImportPanel } from './StudentImportPanel'

interface User {
  id: string
  firstName: string
  surname: string
  email: string
  role: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN'
  institution: string | null
  approved: boolean
  deletedAt: string | null
  createdAt: string
  _count: { instructorCourses: number; enrollments: number }
}

const roleVariant: Record<string, 'blue' | 'green' | 'gray'> = {
  ADMIN: 'blue', INSTRUCTOR: 'green', STUDENT: 'gray',
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const PER_PAGE = 20
/** Uppercase first letter of a name, or '' when empty/non-alphabetic. */
const initial = (s: string) => (s?.trim()?.[0] ?? '').toUpperCase()

/** An "All · A–Z" filter strip (matches the participant-picker design). */
function LetterStrip({ label, value, onChange, available }: {
  label: string; value: string; onChange: (v: string) => void; available: Set<string>
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="w-20 shrink-0 text-sm font-medium text-gray-700">{label}</span>
      <div className="flex flex-wrap gap-1">
        {['All', ...ALPHABET].map(L => {
          const active = value === L
          const disabled = L !== 'All' && !available.has(L)
          return (
            <button
              key={L}
              type="button"
              disabled={disabled}
              onClick={() => onChange(L)}
              className={[
                'min-w-[2rem] rounded border px-2 py-1 text-center text-sm transition-colors',
                active
                  ? 'border-brand-800 bg-brand-800 font-semibold text-white'
                  : disabled
                    ? 'cursor-not-allowed border-gray-200 text-gray-300'
                    : 'border-gray-200 text-brand-800 hover:bg-gray-50',
              ].join(' ')}
            >
              {L}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<User & { password: string }>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  // First/last-name alphabet filters ('All' or a single A–Z letter) + pagination.
  const [firstLetter, setFirstLetter] = useState('All')
  const [lastLetter, setLastLetter] = useState('All')
  const [page, setPage] = useState(1)
  // When true, the table also lists soft-deleted (in-trash) users. Default off.
  const [showDeleted, setShowDeleted] = useState(false)

  // Reset to page 1 whenever the filters change so we don't land on an empty page.
  useEffect(() => { setPage(1) }, [search, firstLetter, lastLetter, showDeleted])

  async function load() {
    try {
      const url = showDeleted ? '/api/admin/users?includeDeleted=true' : '/api/admin/users'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [showDeleted]) // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(u: User) {
    setEditId(u.id)
    setEditData({ firstName: u.firstName, surname: u.surname, email: u.email, role: u.role, institution: u.institution ?? '', password: '' })
    setError('')
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Save failed')
      setSaving(false)
      return
    }
    setSaving(false)
    setEditId(null)
    load()
  }

  async function approveUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: true }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? 'Approve failed')
      return
    }
    load()
  }

  async function sendCredentials(u: User) {
    const ok = confirm(
      `Reset password for ${u.firstName} ${u.surname} and open an email with the new temporary password?\n\n` +
      `Their current password will be replaced and they will be forced to set a new one when they sign in.`
    )
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/users/${u.id}/reset-password`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error ?? 'Failed to reset password.')
        return
      }
      // Build a mailto: link with the temporary credentials pre-filled.
      const subject = 'Your Seminary Greek account — sign-in details'
      const body =
`Hello ${u.firstName},

Your Seminary Greek account is ready. Please sign in with the temporary password below — you will be asked to choose your own password on first sign-in.

  Sign-in page:  https://seminarygreek.app/auth/sign-in
  Email:         ${u.email}
  Temp password: ${data.tempPassword}

This temporary password is for one use only; please change it as soon as you sign in.

If you have any questions, just reply to this email.

Best wishes,`
      const url = `mailto:${encodeURIComponent(u.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      // Open the user's default email client with the message pre-filled
      window.location.href = url
      // Refresh so the "must change password" badge reflects the new state
      load()
    } catch {
      alert('Network error. Please try again.')
    }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Move "${name}" to trash?\n\nThe account will be disabled (cannot sign in) but the row is kept and can be restored from the "Show deleted" view.`)) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error ?? 'Delete failed')
      return
    }
    load()
  }

  async function restoreUser(id: string, name: string) {
    if (!confirm(`Restore "${name}"? They will be able to sign in again with their existing password.`)) return
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? 'Restore failed')
      return
    }
    load()
  }

  // Free-text search (name / email / role / institution).
  const matchSearch = (u: User) => {
    const q = search.toLowerCase()
    return !q || `${u.firstName} ${u.surname} ${u.email} ${u.role} ${u.institution ?? ''}`.toLowerCase().includes(q)
  }
  const searched = users.filter(matchSearch)

  // Which first/last initials actually have users (so empty letters can be dimmed).
  // Cross-aware: the First-name strip reflects the chosen Last-name letter and vice versa.
  const availableFirst = new Set(
    searched.filter(u => lastLetter === 'All' || initial(u.surname) === lastLetter).map(u => initial(u.firstName)).filter(Boolean),
  )
  const availableLast = new Set(
    searched.filter(u => firstLetter === 'All' || initial(u.firstName) === firstLetter).map(u => initial(u.surname)).filter(Boolean),
  )

  // Apply the letter filters, then sort alphabetically (by first name, then surname —
  // matching how names are displayed first-name-first).
  const matched = searched
    .filter(u => firstLetter === 'All' || initial(u.firstName) === firstLetter)
    .filter(u => lastLetter === 'All' || initial(u.surname) === lastLetter)
    .sort((a, b) => a.firstName.localeCompare(b.firstName) || a.surname.localeCompare(b.surname))

  const pageCount = Math.max(1, Math.ceil(matched.length / PER_PAGE))
  const safePage = Math.min(page, pageCount)
  const paged = matched.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  if (loading) return <p className="text-gray-400 animate-pulse">Loading users…</p>

  const pendingInstructors = users.filter(u => u.role === 'INSTRUCTOR' && !u.approved)

  return (
    <Card>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <CardTitle>All Users ({users.length}{showDeleted ? ' incl. deleted' : ''})</CardTitle>
        <div className="flex items-center gap-3 flex-wrap">
          <StudentImportPanel onCreated={load} />
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={e => setShowDeleted(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Show deleted
          </label>
          <Input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-52"
          />
        </div>
      </div>
      {pendingInstructors.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <span className="font-semibold">{pendingInstructors.length}</span> instructor
          {pendingInstructors.length === 1 ? '' : 's'} awaiting approval — review and approve below.
        </div>
      )}
      {error && <p className="text-sm text-red-600 mb-3 bg-red-50 rounded px-3 py-1">{error}</p>}

      {/* Alphabetical picker — jump to users by first- or last-name initial. */}
      <div className="mb-4 space-y-2">
        <p className="text-sm text-gray-600">{matched.length} user{matched.length === 1 ? '' : 's'} found</p>
        <LetterStrip label="First name" value={firstLetter} onChange={setFirstLetter} available={availableFirst} />
        <LetterStrip label="Last name" value={lastLetter} onChange={setLastLetter} available={availableLast} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Role</th>
              <th className="pb-2 pr-4">Institution</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Courses/Enrolments</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 ${u.deletedAt ? 'opacity-60 bg-gray-50/60' : ''}`}>
                {editId === u.id ? (
                  <>
                    <td className="py-2 pr-4">
                      <div className="flex gap-1">
                        <input className="input w-24" value={editData.firstName ?? ''} onChange={e => setEditData(d => ({ ...d, firstName: e.target.value }))} placeholder="First" />
                        <input className="input w-24" value={editData.surname ?? ''} onChange={e => setEditData(d => ({ ...d, surname: e.target.value }))} placeholder="Last" />
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <input className="input w-44" value={editData.email ?? ''} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} />
                    </td>
                    <td className="py-2 pr-4">
                      <select className="input w-32" value={editData.role ?? u.role} onChange={e => setEditData(d => ({ ...d, role: e.target.value as User['role'] }))}>
                        <option value="STUDENT">Student</option>
                        <option value="INSTRUCTOR">Instructor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <input className="input w-36" value={editData.institution ?? ''} onChange={e => setEditData(d => ({ ...d, institution: e.target.value }))} placeholder="Institution" />
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={u.approved ? 'green' : 'gray'}>{u.approved ? 'Approved' : 'Pending'}</Badge>
                    </td>
                    <td className="py-2 pr-4">
                      <input className="input w-32" type="password" value={editData.password ?? ''} onChange={e => setEditData(d => ({ ...d, password: e.target.value }))} placeholder="New password" />
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => saveEdit(u.id)} loading={saving}><Check size={13} /></Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditId(null)}><X size={13} /></Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 pr-4 font-medium text-gray-800">{u.firstName} {u.surname}</td>
                    <td className="py-2 pr-4 text-gray-500">{u.email}</td>
                    <td className="py-2 pr-4"><Badge variant={roleVariant[u.role] ?? 'gray'}>{u.role}</Badge></td>
                    <td className="py-2 pr-4 text-gray-500 max-w-[160px] truncate">{u.institution ?? '—'}</td>
                    <td className="py-2 pr-4">
                      {u.approved ? (
                        <Badge variant="green">Approved</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="gray">Pending</Badge>
                          <Button size="sm" onClick={() => approveUser(u.id)}>
                            <Check size={13} /> Approve
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-400 text-xs">{u._count.instructorCourses}c / {u._count.enrollments}e</td>
                    <td className="py-2">
                      {u.deletedAt ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="gray">Deleted</Badge>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => restoreUser(u.id, `${u.firstName} ${u.surname}`)}
                            title="Restore this account"
                            className="text-emerald-700 hover:bg-emerald-50"
                          >
                            <RotateCcw size={13} /> Restore
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => sendCredentials(u)}
                            title="Reset password & open an email with the new temp credentials"
                            className="text-brand-700 hover:bg-brand-50"
                          >
                            <Mail size={13} />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => startEdit(u)}><Pencil size={13} /></Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => deleteUser(u.id, `${u.firstName} ${u.surname}`)}
                            title="Move to trash (reversible)"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {matched.length === 0 && <p className="text-sm text-gray-400 italic py-4 text-center">No users found.</p>}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={[
                'min-w-[2.25rem] rounded border px-2.5 py-1.5 text-sm transition-colors',
                p === safePage
                  ? 'border-brand-800 bg-brand-800 font-semibold text-white'
                  : 'border-gray-200 text-brand-800 hover:bg-gray-50',
              ].join(' ')}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage >= pageCount}
            onClick={() => setPage(p => Math.min(pageCount, p + 1))}
            className="min-w-[2.25rem] rounded border border-gray-200 px-2.5 py-1.5 text-sm text-brand-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            aria-label="Next page"
          >
            »
          </button>
        </div>
      )}
    </Card>
  )
}
