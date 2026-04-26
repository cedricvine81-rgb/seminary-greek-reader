'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RoleSelector } from './RoleSelector'
import type { Role } from '@/types/auth'

export function SignUpForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState<Role>('STUDENT')
  const [form, setForm] = useState({
    firstName: '', surname: '', email: '', institution: '', password: '', confirmPassword: '',
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
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
      router.push(role === 'INSTRUCTOR' ? '/instructor' : '/student')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RoleSelector value={role} onChange={setRole} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="First name" required value={form.firstName} onChange={set('firstName')} placeholder="Jane" />
        <Input label="Surname" required value={form.surname} onChange={set('surname')} placeholder="Smith" />
      </div>

      <Input label="Email" type="email" required value={form.email} onChange={set('email')} placeholder="jane@seminary.edu" />
      <Input label="Institution" value={form.institution} onChange={set('institution')} placeholder="Dallas Theological Seminary" />
      <Input label="Password" type="password" required value={form.password} onChange={set('password')} placeholder="••••••••" />
      <Input label="Confirm password" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      <Button type="submit" loading={loading} className="w-full">Create Account</Button>
    </form>
  )
}
