'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'

interface PendingEnrollment {
  id: string
  user: { firstName: string; surname: string; email: string }
  course: { id: string; name: string }
  createdAt: string
}

interface Props {
  pending: PendingEnrollment[]
}

export function EnrollmentRequests({ pending: initial }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(initial)
  const [acting, setActing] = useState<string | null>(null)

  if (pending.length === 0) return null

  async function decide(enrollmentId: string, status: 'APPROVED' | 'REJECTED') {
    setActing(enrollmentId)
    try {
      await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setPending(prev => prev.filter(e => e.id !== enrollmentId))
      router.refresh()
    } finally {
      setActing(null)
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardTitle className="mb-3 text-amber-900">
        Enrollment Requests{' '}
        <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
          {pending.length}
        </span>
      </CardTitle>
      <div className="space-y-2">
        {pending.map(e => (
          <div key={e.id} className="flex items-center justify-between gap-4 bg-white rounded-lg px-4 py-3 border border-amber-100">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {e.user.firstName} {e.user.surname}
              </p>
              <p className="text-xs text-gray-500">{e.user.email} · {e.course.name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="secondary"
                loading={acting === e.id}
                onClick={() => decide(e.id, 'APPROVED')}
                className="text-green-700 border-green-200 hover:bg-green-50"
              >
                <CheckCircle size={14} /> Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={acting === e.id}
                onClick={() => decide(e.id, 'REJECTED')}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle size={14} /> Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
