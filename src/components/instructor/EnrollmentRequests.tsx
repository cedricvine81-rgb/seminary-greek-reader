'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { format } from 'date-fns'

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
  const [messageOpen, setMessageOpen] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')

  if (pending.length === 0) return null

  async function decide(enrollmentId: string, status: 'APPROVED' | 'REJECTED') {
    setActing(enrollmentId)
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setPending(prev => prev.filter(e => e.id !== enrollmentId))
        router.refresh()
      }
    } finally {
      setActing(null)
    }
  }

  function openMessage(enrollmentId: string) {
    setMessageOpen(enrollmentId === messageOpen ? null : enrollmentId)
    setMessageText('')
  }

  function sendMessage(enrollment: PendingEnrollment) {
    const subject = encodeURIComponent(`Re: Your request to join ${enrollment.course.name}`)
    const body = encodeURIComponent(messageText || `Hi ${enrollment.user.firstName},\n\nThank you for requesting access to ${enrollment.course.name}.\n\n`)
    window.open(`mailto:${enrollment.user.email}?subject=${subject}&body=${body}`)
    setMessageOpen(null)
    setMessageText('')
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardTitle className="mb-4 text-amber-900 flex items-center gap-2">
        Requests for Approval
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
          {pending.length}
        </span>
      </CardTitle>

      <div className="space-y-3">
        {pending.map(e => (
          <div key={e.id} className="bg-white rounded-xl border border-amber-100 overflow-hidden">
            {/* Main row */}
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {e.user.firstName} {e.user.surname}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {e.user.email}
                </p>
                <p className="text-xs text-brand-700 font-medium mt-0.5">
                  {e.course.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Requested {format(new Date(e.createdAt), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  loading={acting === e.id}
                  onClick={() => decide(e.id, 'APPROVED')}
                  className="bg-green-600 hover:bg-green-700 text-white border-0 flex items-center gap-1"
                >
                  <CheckCircle2 size={13} /> Permit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={acting === e.id}
                  onClick={() => decide(e.id, 'REJECTED')}
                  className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
                >
                  <XCircle size={13} /> Deny
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openMessage(e.id)}
                  className="text-gray-600 flex items-center gap-1"
                >
                  <Mail size={13} /> Message
                </Button>
              </div>
            </div>

            {/* Message composer (inline expand) */}
            {messageOpen === e.id && (
              <div className="border-t border-amber-100 px-4 py-3 bg-gray-50 space-y-2">
                <p className="text-xs font-medium text-gray-600">
                  Message to {e.user.firstName} — will open in your email client
                </p>
                <textarea
                  value={messageText}
                  onChange={ev => setMessageText(ev.target.value)}
                  rows={3}
                  placeholder={`Hi ${e.user.firstName}, regarding your request to join ${e.course.name}…`}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => sendMessage(e)} className="flex items-center gap-1">
                    <Mail size={13} /> Send via Email Client
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setMessageOpen(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
