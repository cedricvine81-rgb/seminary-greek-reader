'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PublishButtonProps {
  assignmentId: string
  isPublished: boolean
}

export function PublishButton({ assignmentId, isPublished: initial }: PublishButtonProps) {
  const router = useRouter()
  const [published, setPublished] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !published }),
      })
      if (res.ok) {
        setPublished(v => !v)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={published ? 'secondary' : 'primary'}
      size="sm"
      loading={loading}
      onClick={toggle}
    >
      {published ? <EyeOff size={14} /> : <Eye size={14} />}
      {published ? 'Unpublish' : 'Publish'}
    </Button>
  )
}
