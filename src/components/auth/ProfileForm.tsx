'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronDown, Building2, UserCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useT } from '@/lib/i18n/LocaleProvider'

const PRIVATE_USER = '__private__'

interface Props {
  initialFirstName: string
  initialSurname: string
  initialInstitution: string | null
  institutions: string[]
}

export function ProfileForm({ initialFirstName, initialSurname, initialInstitution, institutions }: Props) {
  const router = useRouter()
  const t = useT()
  const [firstName, setFirstName] = useState(initialFirstName)
  const [surname,   setSurname]   = useState(initialSurname)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  // If the student's saved institution is no longer in the list, default to none
  const initialSelect = initialInstitution && institutions.includes(initialInstitution)
    ? initialInstitution
    : PRIVATE_USER
  const [selectValue, setSelectValue] = useState(initialSelect)

  function resolvedInstitution(): string | null {
    return selectValue === PRIVATE_USER ? null : selectValue
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!firstName.trim() || !surname.trim()) {
      setError(t('auth.err.namesRequired'))
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
      if (!res.ok) throw new Error(data.error ?? t('auth.err.profileFailed'))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.err.profileFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('auth.firstName')}
          required
          value={firstName}
          onChange={e => { setFirstName(e.target.value); setError('') }}
          placeholder={t('auth.firstNameExample')}
        />
        <Input
          label={t('auth.surname')}
          required
          value={surname}
          onChange={e => { setSurname(e.target.value); setError('') }}
          placeholder={t('auth.surnameExample')}
        />
      </div>

      {/* Institution — restricted to instructor-created list */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.institution')}</label>
        <div className="relative">
          <select
            value={selectValue}
            onChange={e => { setSelectValue(e.target.value); setError('') }}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-input px-3 py-2 pr-9 text-sm
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value={PRIVATE_USER}>{t('auth.noInstitution')}</option>
            {institutions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
          {selectValue === PRIVATE_USER
            ? <><UserCircle size={13} /> {t('auth.notAssociated')}</>
            : <><Building2 size={13} /> {selectValue}</>
          }
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
          <CheckCircle2 size={16} />
          {t('auth.profileUpdated')}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {t('auth.saveChanges')}
      </Button>
      <button
        type="button"
        onClick={() => router.back()}
        className="w-full text-sm text-gray-500 hover:text-gray-700 hover:underline mt-2"
      >
        {t('auth.cancel')}
      </button>
    </form>
  )
}
