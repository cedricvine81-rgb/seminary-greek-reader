'use client'
import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Check, X, ChevronDown } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RoleSelector } from './RoleSelector'
import type { Role } from '@/types/auth'

// ── Password strength ─────────────────────────────────────────────────────────

interface Requirement {
  labelKey: string
  met: (p: string) => boolean
}

const REQUIREMENTS: Requirement[] = [
  { labelKey: 'auth.rule.length',    met: p => p.length >= 8 },
  { labelKey: 'auth.rule.uppercase', met: p => /[A-Z]/.test(p) },
  { labelKey: 'auth.rule.number',    met: p => /\d/.test(p) },
  { labelKey: 'auth.rule.special',   met: p => /[^A-Za-z0-9]/.test(p) },
]

function strength(password: string): 0 | 1 | 2 | 3 | 4 {
  return REQUIREMENTS.filter(r => r.met(password)).length as 0 | 1 | 2 | 3 | 4
}

const STRENGTH_COLOR  = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
const STRENGTH_TEXT   = ['', 'text-red-600', 'text-orange-500', 'text-yellow-600', 'text-green-600']

function PasswordStrengthMeter({ password }: { password: string }) {
  const t = useT()
  if (!password) return null
  const score = strength(password)
  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              i <= score ? STRENGTH_COLOR[score] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {/* Label */}
      {score > 0 && (
        <p className={`text-xs font-medium ${STRENGTH_TEXT[score]}`}>
          {t(`auth.strength.${score}`)}
        </p>
      )}
      {/* Requirements */}
      <ul className="space-y-1">
        {REQUIREMENTS.map(r => {
          const met = r.met(password)
          return (
            <li key={r.labelKey} className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
              {met
                ? <Check size={11} className="shrink-0" />
                : <X size={11} className="shrink-0" />}
              {t(r.labelKey)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Show/hide password field ──────────────────────────────────────────────────

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: string
  required?: boolean
  showStrength?: boolean
}

function PasswordField({ label, value, onChange, placeholder, error, required, showStrength }: PasswordFieldProps) {
  const t = useT()
  const [show, setShow] = useState(false)
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-input px-3 py-2 pr-10 text-sm placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
            ${error ? 'border-red-400' : 'border-gray-300'}`}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
          aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {showStrength && <PasswordStrengthMeter password={value} />}
    </div>
  )
}

// ── Sign-up form ──────────────────────────────────────────────────────────────

interface FieldErrors {
  firstName?: string
  surname?: string
  email?: string
  personalEmail?: string
  password?: string
  confirmPassword?: string
  terms?: string
}

// Returns KEYS, not sentences: this is module-level so it has no translator, and an error
// message that has already been rendered to English cannot be un-rendered at the call site.
function validate(form: typeof INITIAL_FORM, role: Role, terms: boolean): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.firstName.trim())            errors.firstName = 'auth.err.required'
  if (!form.surname.trim())              errors.surname   = 'auth.err.required'
  if (!form.email.trim())                errors.email     = 'auth.err.required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                         errors.email     = 'auth.err.invalidEmail'
  // Students need a personal email so we can stay in touch after they graduate —
  // instructor accounts don't have this requirement.
  if (role === 'STUDENT') {
    if (!form.personalEmail.trim())      errors.personalEmail = 'auth.err.required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.personalEmail))
                                         errors.personalEmail = 'auth.err.invalidEmail'
    else if (form.personalEmail.trim().toLowerCase() === form.email.trim().toLowerCase())
                                         errors.personalEmail = 'auth.err.samePersonalEmail'
  }
  if (!form.password)                    errors.password  = 'auth.err.required'
  else if (strength(form.password) < 2) errors.password  = 'auth.err.weakPassword'
  if (!form.confirmPassword)             errors.confirmPassword = 'auth.err.required'
  else if (form.confirmPassword !== form.password)
                                         errors.confirmPassword = 'auth.err.passwordsDiffer'
  if (!terms)                            errors.terms     = 'auth.err.acceptTerms'
  return errors
}

const INITIAL_FORM = {
  firstName: '', surname: '', email: '', personalEmail: '', institution: '', password: '', confirmPassword: '',
}

// `lockedRole` fixes the account type (from a role-specific entry point like
// /auth/sign-up/instructor) and hides the Student/Instructor picker. Omitted → the
// picker is shown and the user chooses.
export function SignUpForm({ lockedRole }: { lockedRole?: Role } = {}) {
  const t = useT()
  // validate() yields keys; render them here. Undefined has to stay undefined — the Input
  // components treat any string as "show an error".
  const err = (key?: string) => (key ? t(key) : undefined)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [pendingMessage, setPendingMessage] = useState('')
  const [role, setRole] = useState<Role>(lockedRole ?? 'STUDENT')
  const [form, setForm] = useState(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [terms, setTerms] = useState(false)
  const [messagingConsent, setMessagingConsent] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<keyof typeof INITIAL_FORM, boolean>>>({})
  const [institutions, setInstitutions] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/profile/institutions')
      .then(r => r.json())
      .then(d => setInstitutions(d.institutions ?? []))
      .catch(() => {})
  }, [])

  function set(field: keyof typeof INITIAL_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      // Clear error on edit
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  function blur(field: keyof typeof INITIAL_FORM) {
    return () => setTouched(prev => ({ ...prev, [field]: true }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')

    const errors = validate(form, role, terms)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      // Mark all fields as touched so errors show
      setTouched({ firstName: true, surname: true, email: true, personalEmail: true, password: true, confirmPassword: true })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', role, ...form, terms, messagingConsent }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('auth.signUpFailed'))
      // Instructors are created in a pending state and get no session — show a message instead of redirecting.
      if (data.pending) {
        setPendingMessage(data.message ?? t('auth.awaitingApproval'))
        return
      }
      router.push(role === 'INSTRUCTOR' ? '/instructor' : '/subscribe')
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('auth.signUpFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (pendingMessage) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check size={24} className="text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{t('auth.accountCreated')}</h3>
        <p className="text-sm text-gray-600">{pendingMessage}</p>
        <Button onClick={() => router.push('/auth/sign-in')} className="w-full" size="lg">
          {t('auth.backToSignIn')}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Role — hidden when the entry point already fixes it */}
      {!lockedRole && <RoleSelector value={role} onChange={setRole} />}

      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('auth.firstName')}
          required
          value={form.firstName}
          onChange={set('firstName')}
          onBlur={blur('firstName')}
          placeholder={t('auth.firstNameExample')}
          error={touched.firstName ? err(fieldErrors.firstName) : undefined}
        />
        <Input
          label={t('auth.surname')}
          required
          value={form.surname}
          onChange={set('surname')}
          onBlur={blur('surname')}
          placeholder={t('auth.surnameExample')}
          error={touched.surname ? err(fieldErrors.surname) : undefined}
        />
      </div>

      {/* Email */}
      <Input
        label={t('auth.emailAddress')}
        type="email"
        required
        value={form.email}
        onChange={set('email')}
        onBlur={blur('email')}
        placeholder={t('auth.emailExample')}
        error={touched.email ? err(fieldErrors.email) : undefined}
      />

      {/* Personal email — students only, contact-only, never a login credential */}
      {role === 'STUDENT' && (
        <Input
          label={t('auth.personalEmail')}
          type="email"
          required
          value={form.personalEmail}
          onChange={set('personalEmail')}
          onBlur={blur('personalEmail')}
          placeholder={t('auth.personalEmailExample')}
          error={touched.personalEmail ? err(fieldErrors.personalEmail) : undefined}
        />
      )}
      {role === 'STUDENT' && !fieldErrors.personalEmail && (
        <p className="-mt-3 text-xs text-gray-400">
          {t('auth.personalEmailNote')}
        </p>
      )}

      {/* Institution — pick from instructor-created list only */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth.institution')} <span className="text-gray-400 font-normal">{t('auth.optional')}</span>
        </label>
        <div className="relative">
          <select
            value={form.institution}
            onChange={e => setForm(prev => ({ ...prev, institution: e.target.value }))}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-input px-3 py-2 pr-9 text-sm
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">{t('auth.noInstitution')}</option>
            {institutions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">{t('auth.institutionNote')}</p>
      </div>

      {/* Password */}
      <PasswordField
        label={t('auth.password')}
        required
        value={form.password}
        onChange={set('password')}
        placeholder="••••••••"
        error={touched.password ? err(fieldErrors.password) : undefined}
        showStrength
      />

      {/* Confirm password */}
      <PasswordField
        label={t('auth.confirmPassword')}
        required
        value={form.confirmPassword}
        onChange={set('confirmPassword')}
        placeholder="••••••••"
        error={touched.confirmPassword ? err(fieldErrors.confirmPassword) : undefined}
      />

      {/* Terms & Privacy */}
      <div>
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={terms}
            onChange={e => { setTerms(e.target.checked); setFieldErrors(prev => ({ ...prev, terms: undefined })) }}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 shrink-0"
          />
          <span className="text-sm text-gray-600 leading-snug">
            {t('auth.agreeToThe')}{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-medium">
              {t('auth.termsOfService')}
            </a>{' '}
            {t('auth.and')}{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-medium">
              {t('auth.privacyPolicy')}
            </a>
          </span>
        </label>
        {fieldErrors.terms && (
          <p className="mt-1 text-xs text-red-600">{err(fieldErrors.terms)}</p>
        )}
      </div>

      {/* Messaging consent — students only, opt-in, defaults off */}
      {role === 'STUDENT' && (
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={messagingConsent}
              onChange={e => setMessagingConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 shrink-0"
            />
            <span className="text-sm text-gray-600 leading-snug">
              {t('auth.messagingConsent')}
            </span>
          </label>
        </div>
      )}

      {/* Server error */}
      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{serverError}</p>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {t('auth.createAccountButton')}
      </Button>
    </form>
  )
}
