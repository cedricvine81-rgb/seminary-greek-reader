'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Mail, CheckCircle2 } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'

interface Student { id: string; name: string }

interface Props {
  courseId: string
  students: Student[]
}

export function MessageClassPanel({ courseId, students }: Props) {
  const t = useT()
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
      setError(t('mc.bothRequired'))
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
        setError(data.error ?? t('mc.sendFailed'))
        return
      }
      setSentCount(data.sent ?? 0)
    } catch {
      setError(t('mc.networkError'))
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
        title={disabled ? t('mc.noStudents') : undefined}
        className="flex items-center gap-1.5"
      >
        <Mail size={14} /> {t('mc.button')}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('mc.title')} size="lg">
        {sentCount !== null ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={36} className="text-green-500 mx-auto" />
            <p className="text-sm text-gray-700">{t('mc.delivered', { count: sentCount, n: sentCount })}</p>
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => { reset() }}>{t('mc.sendAnother')}</Button>
              <Button size="sm" onClick={() => setOpen(false)}>{t('mc.done')}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              label={t('mc.recipient')}
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              options={[
                { value: '', label: t('mc.wholeClass', { count: students.length, n: students.length }) },
                ...students.map(s => ({ value: s.id, label: s.name })),
              ]}
            />
            <Input
              label={t('mc.subject')}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder={t('mc.subjectExample')}
              maxLength={200}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('mc.messageLabel')}</label>
              <textarea
                maxLength={20_000}
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={6}
                placeholder={t('mc.messageExample')}
                className="w-full rounded-lg border border-gray-300 bg-input px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>{t('mc.cancel')}</Button>
              <Button onClick={send} loading={sending}>{t('mc.send')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
