'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface DeleteAssignmentButtonProps {
  assignmentId: string
  assignmentTitle: string
  redirectOnDelete?: string
  size?: 'sm' | 'md'
}

export function DeleteAssignmentButton({
  assignmentId, assignmentTitle, redirectOnDelete, size = 'sm',
}: DeleteAssignmentButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/assignments/${assignmentId}`, { method: 'DELETE' })
    if (redirectOnDelete) {
      router.push(redirectOnDelete)
    }
    router.refresh()
    setDeleting(false)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-sm text-gray-600 hidden sm:inline">Delete "{assignmentTitle}"?</span>
        <Button size={size} variant="danger" loading={deleting} onClick={handleDelete}>
          Yes, delete
        </Button>
        <Button size={size} variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </span>
    )
  }

  return (
    <Button
      size={size}
      variant="ghost"
      onClick={() => setConfirming(true)}
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 size={14} />
    </Button>
  )
}
