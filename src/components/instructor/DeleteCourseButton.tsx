'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

export function DeleteCourseButton({
  courseId,
  courseName,
}: {
  courseId: string
  courseName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  function handleOpen() {
    setPassword('')
    setError('')
    setOpen(true)
  }

  function handleClose() {
    if (deleting) return
    setOpen(false)
    setPassword('')
    setError('')
  }

  async function handleDelete() {
    if (!password) { setError('Please enter your password'); return }
    setError('')
    setDeleting(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete course')
      router.push('/instructor/courses')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course')
      setDeleting(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleOpen}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 size={14} />
        Delete Course
      </Button>

      <Modal open={open} onClose={handleClose} title="Delete Course" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are about to permanently delete <span className="font-semibold text-gray-900">{courseName}</span>.
            This will remove all assignments, questions, and student responses associated with this course.
            This action cannot be undone.
          </p>
          <Input
            label="Confirm with your password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleDelete()}
            autoFocus
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
              Delete Course
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
