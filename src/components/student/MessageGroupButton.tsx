'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Users, CheckCircle2 } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'

interface Group { id: string; name: string; memberCount: number }

/**
 * {t('msg.messageGroup')} entry point. On a course card it fetches the student's group for the course;
 * given a `group` (e.g. a specific presentation's group) it uses that one directly. Messages the
 * group's other members via /api/messages (groupId), which fans out to each of them.
 */
export function MessageGroupButton({ courseId, group: preset, onSent }: { courseId: string; group?: Group; onSent?: () => void }) {
  const t = useT()
  const [group, setGroup] = useState<Group | null>(preset ?? null)
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<number | null>(null)

  useEffect(() => {
    if (preset) { setGroup(preset); return }   // a specific group was supplied — no lookup needed
    let alive = true
    fetch(`/api/courses/${courseId}/groups`)
      .then(r => r.ok ? r.json() : { groups: [] })
      .then((d: { groups?: { id: string; name: string; members: unknown[] }[] }) => {
        const g = (d.groups ?? [])[0]
        if (alive) setGroup(g ? { id: g.id, name: g.name, memberCount: g.members.length } : null)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [courseId, preset])

  if (!group) return null

  // The student always belongs to the group, so the recipient count is everyone but themselves.
  const otherCount = Math.max(0, group.memberCount - 1)
  const reset = () => { setSubject(''); setBody(''); setError(''); setSent(null) }

  async function send() {
    if (!subject.trim() || !body.trim()) { setError(t('error.subjectAndMessage')); return }
    setSending(true); setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, groupId: group!.id, subject, body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? t('error.sendFailed')); return }
      setSent(data.sent ?? 0)
      onSent?.()
    } catch { setError(t('error.network')) }
    finally { setSending(false) }
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true) }}
        className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
      >
        <Users size={14} /> {t('msg.messageGroup')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Message ${group.name}`} size="lg">
        {sent !== null ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={36} className="text-green-500 mx-auto" />
            <p className="text-sm text-gray-700">
              {t('msg.sentToMembers', { count: sent })}
            </p>
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={reset}>{t('msg.sendAnother')}</Button>
              <Link href="/student/messages"><Button size="sm" variant="secondary">{t('msg.viewMessages')}</Button></Link>
              <Button size="sm" onClick={() => setOpen(false)}>{t('msg.done')}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              {t('msg.toYourGroup')} <span className="font-medium text-gray-700">{group.name}</span>
              {otherCount > 0 ? ` (${otherCount} other member${otherCount === 1 ? '' : 's'})` : ''}. Replies appear under{' '}
              <Link href="/student/messages" className="text-brand-600 hover:underline">{t('msg.messages')}</Link>.
            </p>
            <Input label={t('msg.subject')} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Study session this week?" maxLength={200} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('msg.message')}</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} placeholder={t('msg.writeToGroup')}
                className="w-full rounded-lg border border-gray-300 bg-input px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
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
