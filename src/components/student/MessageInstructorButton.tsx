'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, CheckCircle2 } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'

interface Props {
  courseId: string
  courseName: string
  instructorName: string
  /** How many people teach this course — the label says "instructors" when there is more
      than one, and the message reaches all of them (routed server-side in /api/messages). */
  recipients?: number
}

/**
 * Per-course {t('msg.messageInstructor')} entry point shown on each enrolled course card.
 * Opens a composer scoped to this one course — mirrors the instructor's
 * {t('msg.messageClass')} button on their course page. Posts to the same /api/messages
 * endpoint, which routes a student-sent message to the course's instructor.
 */
export function MessageInstructorButton({ courseId, courseName, instructorName, recipients = 1 }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function reset() {
    setSubject(''); setBody(''); setError(''); setSent(false)
  }

  async function send() {
    if (!subject.trim() || !body.trim()) {
      setError(t('error.subjectAndMessage'))
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, subject, body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? t('error.sendFailed'))
        return
      }
      setSent(true)
    } catch {
      setError(t('error.network'))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true) }}
        className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
      >
        <Mail size={14} /> {t(recipients > 1 ? 'msg.messageInstructors' : 'msg.messageInstructor')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Message ${instructorName || 'your instructor'}`} size="lg">
        {sent ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={36} className="text-green-500 mx-auto" />
            <p className="text-sm text-gray-700">{t('msg.sentToInstructor')}</p>
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={reset}>{t('msg.sendAnother')}</Button>
              <Link href="/student/messages">
                <Button size="sm" variant="secondary">{t('msg.viewMessages')}</Button>
              </Link>
              <Button size="sm" onClick={() => setOpen(false)}>{t('msg.done')}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              {t('msg.courseLabel')} <span className="font-medium text-gray-700">{courseName}</span>. Your instructor will see
              this in their Messages, and you can read their reply under{' '}
              <Link href="/student/messages" className="text-brand-600 hover:underline">{t('msg.messages')}</Link>.
            </p>
            <Input
              label={t('msg.subject')}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Question about week 5"
              maxLength={200}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('msg.message')}</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={6}
                placeholder={t('msg.writeToInstructor')}
                className="w-full rounded-lg border border-gray-300 bg-input px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>{t('action.cancel')}</Button>
              <Button onClick={send} loading={sending}>{t('msg.sendMessage')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
