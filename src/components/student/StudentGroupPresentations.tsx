'use client'
import { useState } from 'react'
import { useApi } from '@/lib/api-client'
import { NoteComposer } from '@/components/notes/NoteComposer'
import { sanitizeNoteHtml, toNoteHtml, isHtmlEmpty } from '@/lib/note-html'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MessageGroupButton } from '@/components/student/MessageGroupButton'
import { Users, Loader2, CheckCircle2, Clock, Lock, ShieldCheck, Send, RotateCcw } from 'lucide-react'

interface Member {
  userId: string
  name: string
  isMe: boolean
  body: string       // raw HTML; sanitized before render
  contributed: boolean
  attested: boolean
}
interface Entry {
  groupId: string
  groupName: string
  assignmentId: string
  title: string
  courseId: string
  courseName: string
  instructions: string | null
  deadline: string
  pastDeadline: boolean
  submitted: boolean
  submittedAt: string | null
  lateApproved: boolean
  canSubmit: boolean
  locked: boolean
  grade: number | null
  gradeNote: string | null
  me: { body: string; aiDeclaration: string; attestedAt: string | null }
  members: Member[]
  messages: GroupMessage[]
}
interface GroupMessage {
  id: string
  senderId: string
  senderName: string
  subject: string
  body: string
  createdAt: string
  mine: boolean
}

export function StudentGroupPresentations() {
  const { data, isLoading, mutate } = useApi<{ entries: Entry[] }>('/api/group-presentations')

  if (isLoading) return <p className="text-sm text-gray-400 py-10 text-center"><Loader2 size={16} className="inline animate-spin" /> Loading…</p>
  const entries = data?.entries ?? []
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <Users size={28} className="mx-auto text-gray-300" />
        <p className="text-sm text-gray-500">You&rsquo;re not in any group presentations yet.</p>
        <p className="text-xs text-gray-400">Your instructor assigns you to a group; it will appear here when they do.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {entries.map(e => <PresentationCard key={e.groupId} entry={e} onChanged={mutate} />)}
    </div>
  )
}

function PresentationCard({ entry, onChanged }: { entry: Entry; onChanged: () => void }) {
  const [body, setBody] = useState(entry.me.body)
  const [ai, setAi] = useState(entry.me.aiDeclaration)
  const [savingSection, setSavingSection] = useState(false)
  const [busy, setBusy] = useState<'attest' | 'submit' | 'reopen' | null>(null)
  const [error, setError] = useState('')

  const attested = entry.me.attestedAt !== null

  async function act(payload: Record<string, unknown>): Promise<boolean> {
    setError('')
    const res = await fetch(`/api/group-presentations/${entry.groupId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      setError(b.error ?? 'Something went wrong. Please try again.')
      return false
    }
    return true
  }

  async function saveSection() {
    if (entry.locked) return
    setSavingSection(true)
    try { await act({ action: 'save', body }) } finally { setSavingSection(false) }
    onChanged()
  }

  async function saveAi() {
    if (entry.locked) return
    await act({ action: 'save', aiDeclaration: ai })
    onChanged()
  }

  async function sign() {
    setBusy('attest')
    // Persist the current statement first so the server signs off on real content.
    if (await act({ action: 'save', aiDeclaration: ai }) && await act({ action: 'attest' })) onChanged()
    setBusy(null)
  }

  async function submit() {
    // Warn about teammates whose work isn't ready, since submitting locks everyone.
    const noSection = entry.members.filter(m => !m.contributed).length
    const noSign = entry.members.filter(m => !m.attested).length
    if (noSection > 0 || noSign > 0) {
      const bits: string[] = []
      if (noSection > 0) bits.push(`${noSection} ${noSection === 1 ? "hasn’t" : "haven’t"} written a section`)
      if (noSign > 0) bits.push(`${noSign} ${noSign === 1 ? "hasn’t" : "haven’t"} signed their statement`)
      if (!window.confirm(`${bits.join(' and ')} (of ${entry.members.length} members). Submitting locks everyone’s work for grading. Submit anyway?`)) return
    }
    setBusy('submit')
    if (await act({ action: 'submit' })) onChanged()
    setBusy(null)
  }

  async function reopen() {
    setBusy('reopen')
    if (await act({ action: 'reopen' })) onChanged()
    setBusy(null)
  }

  const deadline = new Date(entry.deadline)

  return (
    <Card>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900">{entry.title}</h3>
          <p className="text-xs text-gray-400">{entry.courseName} · {entry.groupName}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {entry.submitted
            ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md"><CheckCircle2 size={13} /> Submitted</span>
            : entry.pastDeadline
              ? <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-md"><Clock size={13} /> Past deadline</span>
              : <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md"><Clock size={13} /> Due {deadline.toLocaleDateString()}</span>}
          <MessageGroupButton courseId={entry.courseId}
            group={{ id: entry.groupId, name: entry.groupName, memberCount: entry.members.length }}
            onSent={onChanged} />
        </div>
      </div>

      {entry.instructions && <p className="text-sm text-gray-600 whitespace-pre-line mb-3 rounded-lg bg-gray-50 p-3">{entry.instructions}</p>}

      {/* Grade (when graded) */}
      {entry.grade !== null && (
        <div className="mb-3 rounded-lg border border-brand-200 bg-brand-50 p-3">
          <p className="text-sm font-semibold text-brand-800">Grade: {entry.grade}%</p>
          {entry.gradeNote && <p className="text-xs text-brand-700 mt-1 whitespace-pre-line">{entry.gradeNote}</p>}
        </div>
      )}

      {/* My section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-700">Your section</h4>
          {entry.locked && <span className="inline-flex items-center gap-1 text-[11px] text-gray-400"><Lock size={11} /> Locked (submitted)</span>}
          {savingSection && <span className="text-[11px] text-gray-400">Saving…</span>}
        </div>
        {entry.locked ? (
          isHtmlEmpty(sanitizeNoteHtml(toNoteHtml(body)))
            ? <p className="text-sm text-gray-400 italic">You didn&rsquo;t write a section.</p>
            : <div className="prose-notes text-sm text-gray-700 rounded-lg border border-gray-200 bg-surface p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(toNoteHtml(body)) }} />
        ) : (
          <NoteComposer initialHtml={toNoteHtml(body)} onChange={setBody} onBlur={saveSection} fontScale={1} minHeight={360} maxHeight={1000} />
        )}
      </div>

      {/* AI / sources attestation */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><ShieldCheck size={14} /> AI &amp; sources statement</h4>
        <p className="text-xs text-gray-500">
          Declare any use of AI tools, collaboration, and sources for your section, and confirm the work is your own.
        </p>
        {entry.locked ? (
          <p className="text-sm text-gray-700 rounded-lg border border-gray-200 bg-surface p-3 whitespace-pre-line">{ai || <span className="text-gray-400 italic">No statement provided.</span>}</p>
        ) : (
          <textarea
            value={ai}
            onChange={e => setAi(e.target.value)}
            onBlur={saveAi}
            rows={3}
            disabled={attested}
            placeholder="e.g. I used a lexicon and ChatGPT to check one parsing; the analysis and writing are my own."
            className="w-full text-sm rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-500"
          />
        )}
        {attested ? (
          <p className="text-xs text-green-700 inline-flex items-center gap-1"><CheckCircle2 size={13} /> Signed {entry.me.attestedAt ? `on ${new Date(entry.me.attestedAt).toLocaleDateString()}` : ''}</p>
        ) : !entry.locked && (
          <Button size="sm" variant="secondary" onClick={sign} loading={busy === 'attest'} disabled={ai.trim() === ''}>
            Sign statement
          </Button>
        )}
      </div>

      {/* Teammates */}
      {entry.members.filter(m => !m.isMe).length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Your group</h4>
          <div className="space-y-2">
            {entry.members.filter(m => !m.isMe).map(m => {
              const html = sanitizeNoteHtml(toNoteHtml(m.body))
              return (
                <div key={m.userId} className="rounded-lg border border-gray-200 bg-surface p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">{m.name}</span>
                    {m.contributed
                      ? <span className="text-[11px] text-green-700 inline-flex items-center gap-1"><CheckCircle2 size={11} /> contributed</span>
                      : <span className="text-[11px] text-gray-400">no section yet</span>}
                    {m.attested && <span className="text-[11px] text-brand-700 inline-flex items-center gap-1"><ShieldCheck size={11} /> signed</span>}
                  </div>
                  {isHtmlEmpty(html)
                    ? <p className="text-xs text-gray-400 italic">Nothing written yet.</p>
                    : <div className="prose-notes text-sm text-gray-600 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={{ __html: html }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Group messages — visible to this group's members only. */}
      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Users size={14} /> Group messages</h4>
          <MessageGroupButton courseId={entry.courseId}
            group={{ id: entry.groupId, name: entry.groupName, memberCount: entry.members.length }}
            onSent={onChanged} />
        </div>
        <p className="text-[11px] text-gray-400 mb-2">Only your group members can see these messages.</p>
        {entry.messages.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No group messages yet. Use “Message Group” to start the conversation.</p>
        ) : (
          <div className="space-y-2">
            {entry.messages.map(m => (
              <div key={m.id} className={`rounded-lg border p-3 ${m.mine ? 'border-brand-200 bg-brand-50' : 'border-gray-200 bg-surface'}`}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800">{m.mine ? 'You' : m.senderName}</span>
                  <span className="text-[11px] text-gray-400">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                {m.subject && <p className="text-sm font-semibold text-gray-700">{m.subject}</p>}
                <p className="text-sm text-gray-600 whitespace-pre-line break-words">{m.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Submit */}
      {!entry.submitted && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500">
            {entry.canSubmit
              ? 'Submitting locks every member’s section for grading. Any group member can submit.'
              : entry.pastDeadline
                ? 'The deadline has passed. Ask your instructor to approve a late submission.'
                : ''}
          </p>
          <Button onClick={submit} loading={busy === 'submit'} disabled={!entry.canSubmit} className="flex items-center gap-1.5">
            <Send size={14} /> Submit presentation
          </Button>
        </div>
      )}
      {entry.submitted && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500">
            {entry.submittedAt ? `Submitted on ${new Date(entry.submittedAt).toLocaleString()}.` : 'Submitted.'}
            {!entry.pastDeadline && ' You can reopen it to keep editing before the deadline.'}
          </p>
          {/* Before the deadline, any member can undo the submission; after it, only the instructor can reopen. */}
          {!entry.pastDeadline && (
            <Button variant="secondary" size="sm" onClick={reopen} loading={busy === 'reopen'} className="flex items-center gap-1.5">
              <RotateCcw size={13} /> Reopen
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
