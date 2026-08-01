'use client'
import { useState, useRef, useEffect } from 'react'
import { useApi } from '@/lib/api-client'
import { NoteComposer } from '@/components/notes/NoteComposer'
import { sanitizeNoteHtml, toNoteHtml, isHtmlEmpty } from '@/lib/note-html'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MessageGroupButton } from '@/components/student/MessageGroupButton'
import { Users, Loader2, CheckCircle2, Clock, Lock, ShieldCheck, Send, RotateCcw } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'

interface Member {
  userId: string
  name: string
  isMe: boolean
  body: string       // raw HTML; sanitized before render
  contributed: boolean
  attested: boolean
  submitted: boolean // this member has handed in their own section
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
  // `submitted` is the whole group being in (every member has handed their section in);
  // `mySubmitted` is just this student. Editing is gated by mySubmitted, never by the group.
  submitted: boolean
  submittedAt: string | null
  mySubmitted: boolean
  mySubmittedAt: string | null
  submittedCount: number
  memberCount: number
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
  const t = useT()
  const { data, isLoading, mutate } = useApi<{ entries: Entry[] }>('/api/group-presentations')

  if (isLoading) return <p className="text-sm text-gray-400 py-10 text-center"><Loader2 size={16} className="inline animate-spin" /> {t('action.loading')}</p>
  const entries = data?.entries ?? []
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <Users size={28} className="mx-auto text-gray-300" />
        <p className="text-sm text-gray-500">{t('group.none.title')}</p>
        <p className="text-xs text-gray-400">{t('group.none.hint')}</p>
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
  const t = useT()
  const [body, setBody] = useState(entry.me.body)
  const [ai, setAi] = useState(entry.me.aiDeclaration)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [busy, setBusy] = useState<'attest' | 'submit' | 'reopen' | null>(null)
  const [error, setError] = useState('')

  const attested = entry.me.attestedAt !== null

  // Autosave bookkeeping. savedRef holds what the server currently has, so we only send
  // real changes; the live refs let the debounce and exit handlers read the latest text
  // without capturing a stale closure.
  const savedRef = useRef({ body: entry.me.body, ai: entry.me.aiDeclaration })
  const bodyRef = useRef(body); bodyRef.current = body
  const aiRef = useRef(ai); aiRef.current = ai

  async function act(payload: Record<string, unknown>): Promise<boolean> {
    setError('')
    const res = await fetch(`/api/group-presentations/${entry.groupId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      setError(b.error ?? t('error.generic'))
      return false
    }
    return true
  }

  // Save the section + statement when they differ from what the server has. Returns true
  // when there's nothing to save or the save succeeds. Both fields are sent together; the
  // API writes each only when present, so this never clobbers the other or the attestation.
  async function persist(): Promise<boolean> {
    if (entry.locked) return true
    const snap = { body: bodyRef.current, ai: aiRef.current }
    if (snap.body === savedRef.current.body && snap.ai === savedRef.current.ai) return true
    setSaveState('saving'); setError('')
    try {
      const res = await fetch(`/api/group-presentations/${entry.groupId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', body: snap.body, aiDeclaration: snap.ai }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? t('error.saveRetryEditing'))
        setSaveState('error')
        return false
      }
      savedRef.current = snap
      setSaveState('saved')
      onChanged()
      return true
    } catch {
      setError(t('error.saveOffline'))
      setSaveState('error')
      return false
    }
  }

  // Debounced autosave: persist ~1.2s after the last edit to either field.
  useEffect(() => {
    if (entry.locked) return
    if (body === savedRef.current.body && ai === savedRef.current.ai) return
    const t = setTimeout(() => { void persist() }, 1200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, ai, entry.locked])

  // Flush unsaved edits when the tab is hidden or closed, or when this card unmounts (e.g.
  // the student navigates away mid-sentence). keepalive lets the request outlive the page,
  // closing the data-loss window that a plain save-on-blur leaves open.
  useEffect(() => {
    const flush = () => {
      if (entry.locked) return
      const snap = { body: bodyRef.current, ai: aiRef.current }
      if (snap.body === savedRef.current.body && snap.ai === savedRef.current.ai) return
      fetch(`/api/group-presentations/${entry.groupId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', body: snap.body, aiDeclaration: snap.ai }),
        keepalive: true,
      }).then(res => { if (res.ok) savedRef.current = snap }).catch(() => {})
    }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.locked, entry.groupId])

  async function sign() {
    setBusy('attest')
    // Save first so the server signs off on the real, current statement.
    if (await persist() && await act({ action: 'attest' })) onChanged()
    setBusy(null)
  }

  async function submit() {
    // Submitting now locks only this student's own section, so the warning is about their
    // own readiness — a teammate who hasn't finished is no longer their problem to weigh.
    // Three whole sentences rather than one assembled from fragments: "you haven't X or Y"
    // cannot be built by joining clauses across languages — word order and agreement differ,
    // and the Russian and Chinese would come out broken.
    const noSection = isHtmlEmpty(body)
    const noSignature = !entry.me.attestedAt
    const warning = noSection && noSignature ? t('group.confirmNeither')
      : noSection ? t('group.confirmNoSection')
      : noSignature ? t('group.confirmNoSignature')
      : null
    if (warning && !window.confirm(warning)) return
    setBusy('submit')
    // Flush any pending edits before the submission locks the section for grading.
    if (await persist() && await act({ action: 'submit' })) onChanged()
    setBusy(null)
  }

  async function reopen() {
    setBusy('reopen')
    if (await act({ action: 'reopen' })) onChanged()
    setBusy(null)
  }

  const deadline = new Date(entry.deadline)

  function renderSaveStatus() {
    if (entry.locked) return null
    if (saveState === 'saving') return <span className="text-[11px] text-gray-400">{t('group.saving')}</span>
    if (saveState === 'error') return <span className="text-[11px] text-amber-600">{t('group.saveRetry')}</span>
    if (saveState === 'saved') return <span className="text-[11px] text-gray-400 inline-flex items-center gap-0.5"><CheckCircle2 size={11} /> {t('group.saved')}</span>
    return null
  }

  return (
    <Card>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900">{entry.title}</h3>
          <p className="text-xs text-gray-400">{entry.courseName} · {entry.groupName}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {/* Whole group in, then my own status, then the deadline — most specific first. */}
          {entry.submitted
            ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md"><CheckCircle2 size={13} /> {t('group.allSubmitted', { count: entry.memberCount })}</span>
            : entry.mySubmitted
              ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md"><CheckCircle2 size={13} /> {t('group.yourSectionIn')}</span>
              : entry.pastDeadline
                ? <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-md"><Clock size={13} /> {t('group.pastDeadline')}</span>
                : <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md"><Clock size={13} /> {t('group.due', { date: deadline.toLocaleDateString() })}</span>}
          {!entry.submitted && entry.submittedCount > 0 && (
            <span className="text-[11px] text-gray-400">{t('group.nOfMSubmitted', { done: entry.submittedCount, total: entry.memberCount })}</span>
          )}
          <MessageGroupButton courseId={entry.courseId}
            group={{ id: entry.groupId, name: entry.groupName, memberCount: entry.members.length }}
            onSent={onChanged} />
        </div>
      </div>

      {entry.instructions && <p className="text-sm text-gray-600 whitespace-pre-line mb-3 rounded-lg bg-gray-50 p-3">{entry.instructions}</p>}

      {/* Grade (when graded) */}
      {entry.grade !== null && (
        <div className="mb-3 rounded-lg border border-brand-200 bg-brand-50 p-3">
          <p className="text-sm font-semibold text-brand-800">{t('group.grade', { pct: entry.grade })}</p>
          {entry.gradeNote && <p className="text-xs text-brand-700 mt-1 whitespace-pre-line">{entry.gradeNote}</p>}
        </div>
      )}

      {/* My section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-700">{t('group.yourSection')}</h4>
          {entry.locked && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
              <Lock size={11} /> {entry.mySubmitted ? t('group.lockedYouSubmitted') : t('group.lockedPastDeadline')}
            </span>
          )}
          {renderSaveStatus()}
        </div>
        {entry.locked ? (
          isHtmlEmpty(sanitizeNoteHtml(toNoteHtml(body)))
            ? <p className="text-sm text-gray-400 italic">{t('group.noSection')}</p>
            : <div className="prose-notes text-sm text-gray-700 rounded-lg border border-gray-200 bg-surface p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(toNoteHtml(body)) }} />
        ) : (
          <NoteComposer initialHtml={toNoteHtml(body)} onChange={setBody} onBlur={() => void persist()} fontScale={1} minHeight={360} maxHeight={1000} />
        )}
      </div>

      {/* AI / sources attestation */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><ShieldCheck size={14} /> {t('group.aiStatement')}</h4>
          {!attested && renderSaveStatus()}
        </div>
        <p className="text-xs text-gray-500">
          {t('group.aiDeclare')}
        </p>
        {entry.locked ? (
          <p className="text-sm text-gray-700 rounded-lg border border-gray-200 bg-surface p-3 whitespace-pre-line">{ai || <span className="text-gray-400 italic">{t('group.noStatement')}</span>}</p>
        ) : (
          <textarea
            value={ai}
            onChange={e => setAi(e.target.value)}
            onBlur={() => void persist()}
            rows={3}
            disabled={attested}
            placeholder="e.g. I used a lexicon and ChatGPT to check one parsing; the analysis and writing are my own."
            className="w-full text-sm rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        )}
        {attested ? (
          <p className="text-xs text-green-700 inline-flex items-center gap-1"><CheckCircle2 size={13} /> {entry.me.attestedAt ? t('group.signedOn', { date: new Date(entry.me.attestedAt).toLocaleDateString() }) : t('group.signed')}</p>
        ) : !entry.locked && (
          <Button size="sm" variant="secondary" onClick={sign} loading={busy === 'attest'} disabled={ai.trim() === ''}>
            {t('group.signStatement')}
          </Button>
        )}
      </div>

      {/* Teammates */}
      {entry.members.filter(m => !m.isMe).length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('group.yourGroup')}</h4>
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
                    {m.submitted && <span className="text-[11px] text-green-700 inline-flex items-center gap-1"><Send size={11} /> submitted</span>}
                  </div>
                  {isHtmlEmpty(html)
                    ? <p className="text-xs text-gray-400 italic">{t('group.nothingWritten')}</p>
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
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Users size={14} /> {t('group.messages')}</h4>
          <MessageGroupButton courseId={entry.courseId}
            group={{ id: entry.groupId, name: entry.groupName, memberCount: entry.members.length }}
            onSent={onChanged} />
        </div>
        <p className="text-[11px] text-gray-400 mb-2">{t('group.messagesPrivate')}</p>
        {entry.messages.length === 0 ? (
          <p className="text-sm text-gray-400 italic">{t('group.noMessages')}</p>
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

      {/* Submit — my own section only. A teammate handing in early neither submits for me
          nor stops me, so this panel is driven by mySubmitted, not the group roll-up. */}
      {!entry.mySubmitted && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500">
            {entry.canSubmit
              ? t('group.submitHint')
              : entry.pastDeadline
                ? t('group.lateHint')
                : ''}
          </p>
          <Button onClick={submit} loading={busy === 'submit'} disabled={!entry.canSubmit} className="flex items-center gap-1.5">
            <Send size={14} /> {t('group.submitMySection')}
          </Button>
        </div>
      )}
      {entry.mySubmitted && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500">
            {entry.mySubmittedAt ? t('group.submittedOn', { date: new Date(entry.mySubmittedAt).toLocaleString() }) : t('group.sectionSubmitted')}
            {!entry.submitted && ' ' + t('group.membersWaiting', { count: entry.memberCount - entry.submittedCount })}
            {!entry.pastDeadline && ' ' + t('group.reopenHint')}
          </p>
          {/* Before the deadline a member can undo their OWN submission; after it, only the
              instructor can reopen — and that reopens the whole group. */}
          {!entry.pastDeadline && (
            <Button variant="secondary" size="sm" onClick={reopen} loading={busy === 'reopen'} className="flex items-center gap-1.5">
              <RotateCcw size={13} /> {t('group.reopenMine')}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
