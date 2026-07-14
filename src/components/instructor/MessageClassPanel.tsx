'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Mail, CheckCircle2 } from 'lucide-react'

interface Student { id: string; name: string }

interface Props {
  courseId: string
  students: Student[]
}

export function MessageClassPanel({ courseId, students }: Props) {
  const [open, setOpen] = useState(false)
  const [recipient, setRecipient] = useState('') // '' = whole class
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sentCount, setSentCount] = useState<number | null>(null)

  function reset() {
    setRecipient(''); setSubject(''); setBody(''); setError(''); setSentCount(null)
  }

  async function send() {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message are both required.')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          recipientId: recipient || null,
          subject,
          body,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Failed to send message.')
        return
      }
      setSentCount(data.sent ?? 0)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSending(false)
    }
  }

  const disabled = students.length === 0

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => { reset(); setOpen(true) }}
        disabled={disabled}
        title={disabled ? 'No enrolled students to message yet' : undefined}
        className="flex items-center gap-1.5"
      >
        <Mail size={14} /> Message Class
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Message class" size="lg">
        {sentCount !== null ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={36} className="text-green-500 mx-auto" />
            <p className="text-sm text-gray-700">
              Message delivered to <span className="font-semibold">{sentCount}</span>{' '}
              student{sentCount === 1 ? '' : 's'}.
            </p>
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => { reset() }}>Send another</Button>
              <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              label="Recipient"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              options={[
                { value: '', label: `Whole class (${students.length} student${students.length === 1 ? '' : 's'})` },
                ...students.map(s => ({ value: s.id, label: s.name })),
              ]}
            />
            <Input
              label="Subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Week 5 reading update"
              maxLength={200}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={6}
                placeholder="Write your message to the class…"
                className="w-full rounded-lg border border-gray-300 bg-surface px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
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
