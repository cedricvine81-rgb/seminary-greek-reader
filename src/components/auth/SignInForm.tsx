'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function SignInForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signin', email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sign-in failed')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="jane@seminary.edu"
      />
      <Input
        label="Password"
        type="password"
        required
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      <Button type="submit" loading={loading} className="w-full">Sign In</Button>

      <p className="text-center text-xs text-gray-500 border-t border-parchment-100 pt-3 mt-1">
        Demo: <code className="bg-parchment-100 text-brand-800 px-1 rounded font-medium">instructor@demo.edu</code>
        {' '}/ <code className="bg-parchment-100 text-brand-800 px-1 rounded font-medium">instructor123</code>
      </p>
    </form>
  )
}
