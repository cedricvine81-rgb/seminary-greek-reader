'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CoInstructor {
  id: string
  user: { id: string; firstName: string; surname: string; email: string }
}

export function CoInstructorManager({
  courseId,
  initialCoInstructors,
  isPrimaryInstructor,
}: {
  courseId: string
  initialCoInstructors: CoInstructor[]
  isPrimaryInstructor: boolean
}) {
  const router = useRouter()
  const [coInstructors, setCoInstructors] = useState(initialCoInstructors)
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!email.trim()) return
    setError('')
    setAdding(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/co-instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add co-instructor')
      setCoInstructors(prev => [...prev, data.coInstructor])
      setEmail('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add co-instructor')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(userId: string) {
    setRemoving(userId)
    try {
      await fetch(`/api/courses/${courseId}/co-instructors`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      setCoInstructors(prev => prev.filter(ci => ci.user.id !== userId))
      router.refresh()
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="space-y-4 mt-4">
      {coInstructors.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No co-instructors added yet.</p>
      ) : (
        <ul className="space-y-2">
          {coInstructors.map(ci => (
            <li key={ci.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {ci.user.firstName} {ci.user.surname}
                </p>
                <p className="text-xs text-gray-500">{ci.user.email}</p>
              </div>
              {isPrimaryInstructor && (
                <button
                  onClick={() => handleRemove(ci.user.id)}
                  disabled={removing === ci.user.id}
                  className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Remove co-instructor"
                >
                  <X size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isPrimaryInstructor && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="instructor@seminary.edu"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1"
            />
            <Button size="sm" loading={adding} onClick={handleAdd} disabled={!email.trim()}>
              <UserPlus size={14} />
              Add
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-gray-400">
            The co-instructor must already have an instructor account.
          </p>
        </div>
      )}
    </div>
  )
}
