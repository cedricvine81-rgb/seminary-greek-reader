'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function ChangePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

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
      setTimeout(() => router.back(), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 size={40} className="text-green-500" />
        <p className="font-semibold text-gray-900">Password updated</p>
        <p className="text-sm text-gray-500">Redirecting you back…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="New password"
        type="password"
        required
        autoFocus
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
      <Button type="submit" loading={loading} className="w-full">
        Update Password
      </Button>
      <button
        type="button"
        onClick={() => router.back()}
        className="w-full text-sm text-gray-500 hover:text-gray-700 hover:underline"
      >
        Cancel
      </button>
    </form>
  )
}
