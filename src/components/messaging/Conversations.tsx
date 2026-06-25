'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { useApi } from '@/lib/api-client'
import { Mail, MailOpen, PenSquare, CheckCircle2, Trash2, Megaphone } from 'lucide-react'
import { format } from 'date-fns'

interface ComposeCourse { id: string; name: string }

// Compose box for students to start a new conversation with a course's instructor
function ComposeButton({ courses, onSent }: { courses: ComposeCourse[]; onSent: () => void }) {
  const [open, setOpen] = useState(false)
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function reset() {
    setCourseId(courses[0]?.id ?? ''); setSubject(''); setBody(''); setError(''); setDone(false)
  }

  async function send() {
    if (!courseId || !subject.trim() || !body.trim()) {
      setError('Course, subject, and message are all required.')
      return
    }
    setSending(true); setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, subject, body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Failed to send message.'); return }
      setDone(true)
      onSent()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => { reset(); setOpen(true) }} className="flex items-center gap-1.5">
        <PenSquare size={14} /> New Message
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Message your instructor" size="lg">
        {done ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={36} className="text-green-500 mx-auto" />
            <p className="text-sm text-gray-700">Your message has been sent to your instructor.</p>
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={reset}>Send another</Button>
              <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              label="Course"
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              options={courses.map(c => ({ value: c.id, label: c.name }))}
            />
            <Input label="Subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Question about week 5" maxLength={200} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={6}
                placeholder="Write your message to the instructor…"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={send} loading={sending}>Send</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

interface Participant { id: string; firstName: string; surname: string; title: string | null }

interface ThreadSummary {
  rootId: string
  subject: string
  course: { id: string; name: string }
  other: Participant
  lastBody: string
  lastAt: string
  unread: number
  count: number
  isBroadcast?: boolean
  recipients?: number
}

interface ThreadMessage {
  id: string
  body: string
  createdAt: string
  senderId: string
  sender: Participant
}

function fullName(p: Participant) {
  const name = [p.firstName, p.surname].filter(Boolean).join(' ')
  return p.title ? `${p.title} ${name}` : name
}

function ThreadView({ rootId, meId, onChanged, isBroadcast }: { rootId: string; meId: string; onChanged: () => void; isBroadcast?: boolean }) {
  const { data, isLoading, mutate } = useApi<{ messages: ThreadMessage[] }>(`/api/messages/thread/${rootId}`)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (!reply.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/messages/thread/${rootId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to send reply.')
        return
      }
      setReply('')
      mutate()       // refresh this thread
      onChanged()    // refresh the thread list (ordering / unread)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSending(false)
    }
  }

  if (isLoading) return <p className="text-sm text-gray-400 animate-pulse py-3">Loading conversation…</p>

  const messages = data?.messages ?? []

  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {messages.map(m => {
          const mine = m.senderId === meId
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-brand-100' : 'text-gray-400'}`}>
                  {mine ? 'You' : fullName(m.sender)} · {format(new Date(m.createdAt), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {isBroadcast ? (
        <p className="text-xs text-gray-400 italic">Class announcement — sent to every student. Replies arrive as individual conversations.</p>
      ) : (
        <div className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            rows={2}
            placeholder="Write a reply…"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <Button onClick={send} loading={sending} size="sm">Reply</Button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Conversations({ meId, composeCourses }: { meId: string; composeCourses?: ComposeCourse[] }) {
  const { data, isLoading, mutate } = useApi<{ threads: ThreadSummary[] }>('/api/messages')
  const [openId, setOpenId] = useState<string | null>(null)

  const canCompose = !!composeCourses && composeCourses.length > 0

  if (isLoading) return <p className="text-gray-400 animate-pulse">Loading messages…</p>

  const threads = data?.threads ?? []

  async function del(rootId: string, isBroadcast?: boolean) {
    if (!confirm(isBroadcast
      ? 'Delete this class announcement from your messages? (It stays in students’ inboxes.)'
      : 'Delete this conversation from your messages?')) return
    if (openId === rootId) setOpenId(null)
    await fetch(`/api/messages/thread/${rootId}`, { method: 'DELETE' })
    mutate()
  }

  return (
    <div className="space-y-3">
      {canCompose && (
        <div className="flex justify-end">
          <ComposeButton courses={composeCourses!} onSent={() => mutate()} />
        </div>
      )}

      {threads.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-400">
            <Mail size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet.</p>
          </div>
        </Card>
      ) : (
      <div className="space-y-2">
      {threads.map(t => {
        const unread = t.unread > 0
        const isOpen = openId === t.rootId
        return (
          <Card key={t.rootId} className={unread ? 'border-brand-200 bg-brand-50/40' : ''}>
            <div className="flex items-start gap-2">
              <button
                onClick={() => setOpenId(isOpen ? null : t.rootId)}
                className="flex-1 min-w-0 flex items-start gap-3 text-left"
              >
                <span className="mt-0.5 shrink-0 text-gray-400">
                  {t.isBroadcast ? <Megaphone size={16} className="text-brand-500" /> : unread ? <Mail size={16} className="text-brand-600" /> : <MailOpen size={16} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {t.subject}
                    </span>
                    {unread && <Badge variant="blue">{t.unread} new</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.isBroadcast ? `Whole class · ${t.recipients ?? 0} student${t.recipients === 1 ? '' : 's'}` : fullName(t.other)} · {t.course.name} · {format(new Date(t.lastAt), 'MMM d, yyyy · h:mm a')}
                  </p>
                  {!isOpen && <p className="text-sm text-gray-500 mt-1 truncate">{t.lastBody}</p>}
                </div>
              </button>
              <button onClick={() => del(t.rootId, t.isBroadcast)} title="Delete" className="shrink-0 text-gray-300 hover:text-red-600 p-1">
                <Trash2 size={15} />
              </button>
            </div>
            {isOpen && <ThreadView rootId={t.rootId} meId={meId} onChanged={() => mutate()} isBroadcast={t.isBroadcast} />}
          </Card>
        )
      })}
      </div>
      )}
    </div>
  )
}
