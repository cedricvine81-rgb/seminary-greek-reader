'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RoleSelector } from './RoleSelector'
import type { Role } from '@/types/auth'

// ── Password strength ─────────────────────────────────────────────────────────

interface Requirement {
  label: string
  met: (p: string) => boolean
}

const REQUIREMENTS: Requirement[] = [
  { label: 'At least 8 characters',          met: p => p.length >= 8 },
  { label: 'One uppercase letter',            met: p => /[A-Z]/.test(p) },
  { label: 'One number',                      met: p => /\d/.test(p) },
  { label: 'One special character (!@#$…)',   met: p => /[^A-Za-z0-9]/.test(p) },
]

function strength(password: string): 0 | 1 | 2 | 3 | 4 {
  return REQUIREMENTS.filter(r => r.met(password)).length as 0 | 1 | 2 | 3 | 4
}

const STRENGTH_LABEL  = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR  = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
const STRENGTH_TEXT   = ['', 'text-red-600', 'text-orange-500', 'text-yellow-600', 'text-green-600']

function PasswordStrengthMeter({ password }: { password: string }) {
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
          {STRENGTH_LABEL[score]} password
        </p>
      )}
      {/* Requirements */}
      <ul className="space-y-1">
        {REQUIREMENTS.map(r => {
          const met = r.met(password)
          return (
            <li key={r.label} className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
              {met
                ? <Check size={11} className="shrink-0" />
                : <X size={11} className="shrink-0" />}
              {r.label}
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
          className={`w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
            ${error ? 'border-red-400' : 'border-gray-300'}`}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
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
  password?: string
  confirmPassword?: string
  terms?: string
}

function validate(form: typeof INITIAL_FORM, role: Role, terms: boolean): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.firstName.trim())            errors.firstName = 'Required.'
  if (!form.surname.trim())              errors.surname   = 'Required.'
  if (!form.email.trim())                errors.email     = 'Required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                         errors.email     = 'Enter a valid email address.'
  if (!form.password)                    errors.password  = 'Required.'
  else if (strength(form.password) < 2) errors.password  = 'Password is too weak.'
  if (!form.confirmPassword)             errors.confirmPassword = 'Required.'
  else if (form.confirmPassword !== form.password)
                                         errors.confirmPassword = 'Passwords do not match.'
  if (!terms)                            errors.terms     = 'You must accept the terms to continue.'
  return errors
}

const INITIAL_FORM = {
  firstName: '', surname: '', email: '', institution: '', password: '', confirmPassword: '',
}

export function SignUpForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [role, setRole] = useState<Role>('STUDENT')
  const [form, setForm] = useState(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [terms, setTerms] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<keyof typeof INITIAL_FORM, boolean>>>({})

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
      setTouched({ firstName: true, surname: true, email: true, password: true, confirmPassword: true })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', role, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sign-up failed')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Sign-up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Role */}
      <RoleSelector value={role} onChange={setRole} />

      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First name"
          required
          value={form.firstName}
          onChange={set('firstName')}
          onBlur={blur('firstName')}
          placeholder="Jane"
          error={touched.firstName ? fieldErrors.firstName : undefined}
        />
        <Input
          label="Surname"
          required
          value={form.surname}
          onChange={set('surname')}
          onBlur={blur('surname')}
          placeholder="Smith"
          error={touched.surname ? fieldErrors.surname : undefined}
        />
      </div>

      {/* Email */}
      <Input
        label="Email address"
        type="email"
        required
        value={form.email}
        onChange={set('email')}
        onBlur={blur('email')}
        placeholder="jane@seminary.edu"
        error={touched.email ? fieldErrors.email : undefined}
      />

      {/* Institution (optional) */}
      <Input
        label={<span>Institution <span className="text-gray-400 font-normal">(optional)</span></span> as unknown as string}
        value={form.institution}
        onChange={set('institution')}
        placeholder="Dallas Theological Seminary"
      />

      {/* Password */}
      <PasswordField
        label="Password"
        required
        value={form.password}
        onChange={set('password')}
        placeholder="••••••••"
        error={touched.password ? fieldErrors.password : undefined}
        showStrength
      />

      {/* Confirm password */}
      <PasswordField
        label="Confirm password"
        required
        value={form.confirmPassword}
        onChange={set('confirmPassword')}
        placeholder="••••••••"
        error={touched.confirmPassword ? fieldErrors.confirmPassword : undefined}
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
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-medium">
              Privacy Policy
            </a>
          </span>
        </label>
        {fieldErrors.terms && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.terms}</p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{serverError}</p>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Create Account
      </Button>
    </form>
  )
}
