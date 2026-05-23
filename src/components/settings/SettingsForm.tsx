'use client'
import { useState, FormEvent, useEffect, useRef } from 'react'
import { CheckCircle2, ChevronDown, Building2, UserCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIVATE_USER    = '__private__'
const NEW_INSTITUTION = '__new__'

// ── Profile section ───────────────────────────────────────────────────────────

interface ProfileProps {
  initialFirstName:   string
  initialSurname:     string
  initialTitle:       string | null
  initialInstitution: string | null
  institutions:       string[]
}

function ProfileSection({
  initialFirstName, initialSurname, initialTitle, initialInstitution, institutions,
}: ProfileProps) {
  const [firstName,    setFirstName]    = useState(initialFirstName)
  const [surname,      setSurname]      = useState(initialSurname)
  const [title,        setTitle]        = useState(initialTitle ?? '')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(false)

  const initialSelect = initialInstitution
    ? (institutions.includes(initialInstitution) ? initialInstitution : NEW_INSTITUTION)
    : PRIVATE_USER
  const [selectValue, setSelectValue] = useState(initialSelect)
  const [customValue,  setCustomValue]  = useState(
    initialInstitution && !institutions.includes(initialInstitution) ? initialInstitution : ''
  )
  const customRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectValue === NEW_INSTITUTION) customRef.current?.focus()
  }, [selectValue])

  function resolvedInstitution(): string | null {
    if (selectValue === PRIVATE_USER)    return null
    if (selectValue === NEW_INSTITUTION) return customValue.trim() || null
    return selectValue
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!firstName.trim() || !surname.trim()) {
      setError('First name and surname are required.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName:   firstName.trim(),
          surname:     surname.trim(),
          title:       title.trim() || null,
          institution: resolvedInstitution(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update profile')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardTitle>Profile</CardTitle>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4 max-w-lg">
        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            required
            value={firstName}
            onChange={e => { setFirstName(e.target.value); setError('') }}
            placeholder="Jane"
          />
          <Input
            label="Surname"
            required
            value={surname}
            onChange={e => { setSurname(e.target.value); setError('') }}
            placeholder="Smith"
          />
        </div>

        {/* Title */}
        <Input
          label={<span>Title <span className="text-gray-400 font-normal">(optional)</span></span> as unknown as string}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Dr., Prof., Rev., Pastor…"
        />

        {/* Institution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
          <div className="relative">
            <select
              value={selectValue}
              onChange={e => { setSelectValue(e.target.value); setError('') }}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-9 text-sm
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value={PRIVATE_USER}>Private User (no institution)</option>
              {institutions.length > 0 && (
                <optgroup label="Existing institutions">
                  {institutions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </optgroup>
              )}
              <option value={NEW_INSTITUTION}>+ Type a new institution…</option>
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
            {selectValue === PRIVATE_USER
              ? <><UserCircle size={13} /> Not associated with an institution</>
              : <><Building2 size={13} /> {selectValue === NEW_INSTITUTION ? 'Enter your institution below' : selectValue}</>
            }
          </div>
          {selectValue === NEW_INSTITUTION && (
            <input
              ref={customRef}
              type="text"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              placeholder="e.g. Andrews University"
              className="mt-2 w-full rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm
                placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
            <CheckCircle2 size={16} /> Profile updated.
          </div>
        )}

        <Button type="submit" loading={loading} size="sm">Save Profile</Button>
      </form>
    </Card>
  )
}

// ── Password section ──────────────────────────────────────────────────────────

function PasswordSection() {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update password')
      setSuccess(true)
      setPassword('')
      setConfirm('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardTitle>Change Password</CardTitle>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4 max-w-lg">
        <Input
          label="New password"
          type="password"
          required
          placeholder="At least 8 characters"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
        />
        <Input
          label="Confirm new password"
          type="password"
          required
          placeholder="Repeat new password"
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setError('') }}
        />

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
            <CheckCircle2 size={16} /> Password updated.
          </div>
        )}

        <Button type="submit" loading={loading} size="sm">Update Password</Button>
      </form>
    </Card>
  )
}

// ── Combined Settings form ────────────────────────────────────────────────────

export function SettingsForm(props: ProfileProps) {
  return (
    <div className="space-y-6 max-w-2xl">
      <ProfileSection {...props} />
      <PasswordSection />
    </div>
  )
}
