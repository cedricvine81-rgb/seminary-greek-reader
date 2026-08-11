'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Users, Mail, Trash2, Plus, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'

interface Student { id: string; name: string }
interface Group { id: string; name: string; assignmentId: string | null; members: { id: string; name: string }[] }
interface Presentation { id: string; title: string }

interface Props {
  courseId: string
  students: Student[]
  // Published Group Presentation assignments in this course, for linking groups to.
  presentations?: Presentation[]
}

/**
 * Instructor "Course Groups" manager: create and name groups, assign students (each student
 * belongs to at most one group per course), and message any group. Sits next to "Message
 * Class" on the course page.
 */
export function CourseGroupsPanel({ courseId, students, presentations = [] }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [compose, setCompose] = useState<Group | null>(null)

  async function load() {
    setError('')
    try {
      const res = await fetch(`/api/courses/${courseId}/groups`)
      const data = await res.json().catch(() => ({}))
      if (res.ok) setGroups(data.groups ?? [])
      else setError(data.error ?? 'Failed to load groups.')
    } catch { setError(t('cg.loadFailed')) }
    finally { setLoaded(true) }
  }

  function openPanel() {
    setOpen(true); setLoaded(false); setGroups([]); setCompose(null); setError(''); setNewName('')
    void load()
  }

  async function createGroup() {
    const name = newName.trim()
    if (!name) return
    setCreating(true); setError('')
    try {
      const res = await fetch(`/api/courses/${courseId}/groups`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Failed to create group.'); return }
      setGroups(g => [...g, data.group]); setNewName('')
    } finally { setCreating(false) }
  }

  async function patch(id: string, payload: { name?: string; memberIds?: string[]; assignmentId?: string | null }) {
    const res = await fetch(`/api/courses/${courseId}/groups/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    if (!res.ok) { setError(t('cg.updateFailed')); return false }
    return true
  }

  async function rename(id: string, name: string) {
    if (!name.trim()) return
    if (await patch(id, { name: name.trim() })) setGroups(gs => gs.map(g => g.id === id ? { ...g, name: name.trim() } : g))
  }

  async function setAssignment(id: string, assignmentId: string | null) {
    if (await patch(id, { assignmentId })) setGroups(gs => gs.map(g => g.id === id ? { ...g, assignmentId } : g))
  }

  async function toggleMember(group: Group, student: Student, checked: boolean) {
    const memberIds = checked
      ? [...group.members.map(m => m.id), student.id]
      : group.members.filter(m => m.id !== student.id).map(m => m.id)
    if (!await patch(group.id, { memberIds })) return
    // Reflect one-group-per-course: adding here removes the student from any other group.
    setGroups(gs => gs.map(g => {
      if (g.id === group.id) {
        return { ...g, members: checked ? [...g.members.filter(m => m.id !== student.id), student] : g.members.filter(m => m.id !== student.id) }
      }
      return checked ? { ...g, members: g.members.filter(m => m.id !== student.id) } : g
    }))
  }

  async function remove(id: string) {
    if (!confirm(t('cg.deleteConfirm'))) return
    const res = await fetch(`/api/courses/${courseId}/groups/${id}`, { method: 'DELETE' })
    if (res.ok) setGroups(gs => gs.filter(g => g.id !== id))
    else setError(t('cg.deleteFailed'))
  }

  // studentId -> the group they're currently in (for the "already in X" hint)
  const groupOf = new Map<string, string>()
  for (const g of groups) for (const m of g.members) groupOf.set(m.id, g.name)

  const disabled = students.length === 0

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={openPanel}
        disabled={disabled}
        title={disabled ? t('cg.noStudents') : undefined}
        className="flex items-center gap-1.5"
      >
        <Users size={14} /> {t('cg.title')}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={compose ? t('cg.composeTitle', { name: compose.name }) : t('cg.modalTitle')} size="lg">
        {compose ? (
          <GroupComposer courseId={courseId} group={compose} onBack={() => setCompose(null)} onClose={() => setOpen(false)} />
        ) : !loaded ? (
          <p className="text-sm text-gray-400 py-6 text-center">{t('cg.loading')}</p>
        ) : (
          <div className="space-y-4">
            {/* Create a group */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={t('cg.newGroup')}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void createGroup() } }}
                  placeholder={t('cg.groupNameExample')}
                  maxLength={100}
                />
              </div>
              <Button size="sm" onClick={createGroup} loading={creating} className="flex items-center gap-1.5">
                <Plus size={14} /> {t('cg.create')}
              </Button>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            {groups.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 text-center">
                {t('cg.none')}
              </p>
            ) : (
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {groups.map(group => (
                  <div key={group.id} className="rounded-xl border border-gray-200 p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        defaultValue={group.name}
                        onBlur={e => { if (e.target.value.trim() && e.target.value.trim() !== group.name) void rename(group.id, e.target.value) }}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                        className="flex-1 rounded-lg border border-transparent hover:border-gray-200 focus:border-brand-400 px-2 py-1 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        aria-label={t('cg.groupName')}
                      />
                      <span className="text-xs text-gray-400">{group.members.length} member{group.members.length === 1 ? '' : 's'}</span>
                      <Button size="sm" variant="secondary" onClick={() => setCompose(group)} disabled={group.members.length === 0} title={group.members.length === 0 ? t('cg.addMembersFirst') : undefined} className="flex items-center gap-1">
                        <Mail size={13} /> {t('cg.message')}
                      </Button>
                      <button onClick={() => remove(group.id)} className="text-gray-400 hover:text-red-600 p-1" title={t('cg.deleteGroup')}><Trash2 size={15} /></button>
                    </div>
                    {/* Link this group to a Group Presentation assignment (or leave unassigned). */}
                    <label className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="shrink-0">{t('cg.assignment')}</span>
                      <select
                        value={group.assignmentId ?? ''}
                        onChange={e => setAssignment(group.id, e.target.value || null)}
                        className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">{t('cg.noAssignment')}</option>
                        {presentations.map(p => (
                          <option key={p.id} value={p.id}>{t('cg.presentationOption', { title: p.title })}</option>
                        ))}
                      </select>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {students.map(s => {
                        const inThis = group.members.some(m => m.id === s.id)
                        const elsewhere = !inThis && groupOf.has(s.id)
                        return (
                          <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700 px-1.5 py-1 rounded hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inThis}
                              onChange={e => toggleMember(group, s, e.target.checked)}
                              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="truncate">{s.name}</span>
                            {elsewhere && <span className="text-[10px] text-gray-400 shrink-0">in {groupOf.get(s.id)}</span>}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

// Compose + send a message to every member of one group. Reuses /api/messages with groupId.
function GroupComposer({ courseId, group, onBack, onClose }: { courseId: string; group: Group; onBack: () => void; onClose: () => void }) {
  const t = useT()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<number | null>(null)

  async function send() {
    if (!subject.trim() || !body.trim()) { setError(t('cg.bothRequired')); return }
    setSending(true); setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, groupId: group.id, subject, body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Failed to send message.'); return }
      setSent(data.sent ?? group.members.length)
    } catch { setError(t('cg.networkError')) }
    finally { setSending(false) }
  }

  if (sent !== null) {
    return (
      <div className="text-center py-6 space-y-3">
        <CheckCircle2 size={36} className="text-green-500 mx-auto" />
        <p className="text-sm text-gray-700">{t('cg.delivered', { count: sent, n: sent, group: group.name })}</p>
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={onBack}>{t('cg.backToGroups')}</Button>
          <Button size="sm" onClick={onClose}>{t('cg.done')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={14} /> Back to groups</button>
      <p className="text-xs text-gray-500">To all {group.members.length} member{group.members.length === 1 ? '' : 's'} of <span className="font-medium text-gray-700">{group.name}</span>.</p>
      <Input label={t('cg.subject')} value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('cg.subjectExample')} maxLength={200} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('cg.messageLabel')}</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} placeholder={`Write your message to ${group.name}…`}
          className="w-full rounded-lg border border-gray-300 bg-input px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onBack}>{t('cg.cancel')}</Button>
        <Button onClick={send} loading={sending}>{t('cg.sendMessage')}</Button>
      </div>
    </div>
  )
}
