'use client'
import { useState, FormEvent, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronDown, Building2, UserCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const PRIVATE_USER = '__private__'
const NEW_INSTITUTION = '__new__'

interface Props {
  initialFirstName: string
  initialSurname: string
  initialInstitution: string | null
  institutions: string[]
}

export function ProfileForm({ initialFirstName, initialSurname, initialInstitution, institutions }: Props) {
  const router = useRouter()
  const [firstName, setFirstName]   = useState(initialFirstName)
  const [surname,   setSurname]     = useState(initialSurname)
  const [loading,   setLoading]     = useState(false)
  const [error,     setError]       = useState('')
  const [success,   setSuccess]     = useState(false)

  // Institution selection state
  // selectValue: one of PRIVATE_USER | NEW_INSTITUTION | an existing name | ''
  const initialSelect = initialInstitution
    ? (institutions.includes(initialInstitution) ? initialInstitution : NEW_INSTITUTION)
    : PRIVATE_USER
  const [selectValue, setSelectValue] = useState(initialSelect)
  const [customValue,  setCustomValue]  = useState(
    initialInstitution && !institutions.includes(initialInstitution) ? initialInstitution : ''
  )
  const customRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectValue === NEW_INSTITUTION) {
      customRef.current?.focus()
    }
  }, [selectValue])

  function resolvedInstitution(): string | null {
    if (selectValue === PRIVATE_USER)     return null
    if (selectValue === NEW_INSTITUTION)  return customValue.trim() || null
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
          firstName: firstName.trim(),
          surname:   surname.trim(),
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
    <form onSubmit={handleSubmit} className="space-y-5">
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

      {/* Institution */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>

        {/* Select */}
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

        {/* Icon hint */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
          {selectValue === PRIVATE_USER
            ? <><UserCircle size={13} /> Not associated with an institution</>
            : <><Building2 size={13} /> {selectValue === NEW_INSTITUTION ? 'Enter your institution below' : selectValue}</>
          }
        </div>

        {/* Free-text entry for new institution */}
        {selectValue === NEW_INSTITUTION && (
          <div className="mt-2">
            <input
              ref={customRef}
              type="text"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              placeholder="e.g. Andrews University"
              className="w-full rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm
                placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
          <CheckCircle2 size={16} />
          Profile updated successfully.
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Save Changes
      </Button>
      <button
        type="button"
        onClick={() => router.back()}
        className="w-full text-sm text-gray-500 hover:text-gray-700 hover:underline mt-2"
      >
        Cancel
      </button>
    </form>
  )
}
