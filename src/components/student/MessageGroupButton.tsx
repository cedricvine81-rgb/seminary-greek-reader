'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Users, CheckCircle2 } from 'lucide-react'

interface Group { id: string; name: string; members: { id: string; name: string }[] }

/**
 * Per-course "Message group" entry point on a student's course card. Only renders when the
 * student has been assigned to a group; messages the group's other members via /api/messages
 * (groupId), which fans out to each of them.
 */
export function MessageGroupButton({ courseId, onSent }: { courseId: string; onSent?: () => void }) {
  const [group, setGroup] = useState<Group | null>(null)
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/courses/${courseId}/groups`)
      .then(r => r.ok ? r.json() : { groups: [] })
      .then(d => { if (alive) setGroup((d.groups ?? [])[0] ?? null) })
      .catch(() => {})
    return () => { alive = false }
  }, [courseId])

  if (!group) return null

  // The student always belongs to the group they fetched, so the recipient count is
  // everyone in the group except themselves.
  const otherCount = Math.max(0, group.members.length - 1)
  const reset = () => { setSubject(''); setBody(''); setError(''); setSent(null) }

  async function send() {
    if (!subject.trim() || !body.trim()) { setError('Subject and message are both required.'); return }
    setSending(true); setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, groupId: group!.id, subject, body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Failed to send message.'); return }
      setSent(data.sent ?? 0)
      onSent?.()
    } catch { setError('Network error — please try again.') }
    finally { setSending(false) }
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true) }}
        className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
      >
        <Users size={14} /> Message Group
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Message ${group.name}`} size="lg">
        {sent !== null ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={36} className="text-green-500 mx-auto" />
            <p className="text-sm text-gray-700">
              Sent to <span className="font-semibold">{sent}</span> group member{sent === 1 ? '' : 's'}.
            </p>
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={reset}>Send another</Button>
              <Link href="/student/messages"><Button size="sm" variant="secondary">View messages</Button></Link>
              <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              To your group <span className="font-medium text-gray-700">{group.name}</span>
              {otherCount > 0 ? ` (${otherCount} other member${otherCount === 1 ? '' : 's'})` : ''}. Replies appear under{' '}
              <Link href="/student/messages" className="text-brand-600 hover:underline">Messages</Link>.
            </p>
            <Input label="Subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Study session this week?" maxLength={200} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} placeholder="Write your message to the group…"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={send} loading={sending}>Send message</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
