'use client'
import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/lib/api-client'
import { sanitizeNoteHtml, toNoteHtml, isHtmlEmpty } from '@/lib/note-html'
import { ChevronDown, ChevronRight, Check, Loader2, CheckCircle2, XCircle, Clock, RotateCcw } from 'lucide-react'

interface Member {
  userId: string
  name: string
  contributed: boolean
  attested: boolean
  body: string          // raw stored HTML; sanitized client-side before render
  aiDeclaration: string
  grade: number | null      // per-member override; null = inherits the group grade
  gradeNote: string | null
}
interface Group {
  groupId: string
  name: string
  submitted: boolean
  submittedAt: string | null
  pastDeadline: boolean
  lateApproved: boolean
  grade: number | null
  gradeNote: string | null
  members: Member[]
}
interface Data {
  assignment: { id: string; title: string; deadline: string }
  groups: Group[]
}

// Instructor view for a GROUP_PRESENTATION: every group, each member's section +
// attestation (so you can see who contributed and who didn't), the submission status,
// a group grade + feedback, and a late-submission approval control.
export function GroupPresentationGrader({ assignmentId }: { assignmentId: string }) {
  const { data, isLoading, mutate } = useApi<Data>(`/api/assignments/${assignmentId}/group-presentation`)
  const [open, setOpen] = useState<string | null>(null)

  if (isLoading) {
    return <Card><p className="text-sm text-gray-400 py-6 text-center"><Loader2 size={16} className="inline animate-spin" /> Loading groups…</p></Card>
  }
  if (!data) return <Card><p className="text-sm text-gray-400 italic py-6">Could not load groups.</p></Card>
  if (data.groups.length === 0) {
    return (
      <Card>
        <p className="text-sm text-gray-500 py-4">
          No groups are linked to this presentation yet. Open <span className="font-medium">Course groups</span> on the
          course page, create groups, and set each group&rsquo;s assignment to this presentation.
        </p>
      </Card>
    )
  }

  const submitted = data.groups.filter(g => g.submitted).length

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>Group Presentations — {data.assignment.title}</CardTitle>
        <span className="text-sm text-gray-500">
          Submitted: <span className="font-semibold text-gray-800">{submitted} / {data.groups.length}</span>
        </span>
      </div>
      <div className="space-y-3">
        {data.groups.map(g => (
          <GroupCard
            key={g.groupId}
            group={g}
            assignmentId={assignmentId}
            expanded={open === g.groupId}
            onToggle={() => setOpen(open === g.groupId ? null : g.groupId)}
            onChanged={() => mutate()}
          />
        ))}
      </div>
    </Card>
  )
}

function GroupCard({ group, assignmentId, expanded, onToggle, onChanged }: {
  group: Group
  assignmentId: string
  expanded: boolean
  onToggle: () => void
  onChanged: () => void
}) {
  const [grade, setGrade] = useState(group.grade !== null ? String(group.grade) : '')
  const [gradeNote, setGradeNote] = useState(group.gradeNote ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [approving, setApproving] = useState(false)
  const [reopening, setReopening] = useState(false)

  useEffect(() => {
    setGrade(group.grade !== null ? String(group.grade) : '')
    setGradeNote(group.gradeNote ?? '')
  }, [group.grade, group.gradeNote])

  const dirty = grade !== (group.grade !== null ? String(group.grade) : '') || gradeNote !== (group.gradeNote ?? '')

  async function post(body: Record<string, unknown>) {
    const res = await fetch(`/api/assignments/${assignmentId}/group-presentation`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group.groupId, ...body }),
    })
    if (!res.ok) throw new Error('request failed')
  }

  async function saveGrade() {
    setSaving(true); setSaved(false)
    try {
      await post({ grade: grade === '' ? null : Number(grade), gradeNote: gradeNote || null })
      setSaved(true); setTimeout(() => setSaved(false), 2500); onChanged()
    } catch { alert('Could not save the grade. Please try again.') }
    finally { setSaving(false) }
  }

  async function toggleLate() {
    setApproving(true)
    try { await post({ lateApproved: !group.lateApproved }); onChanged() }
    catch { alert('Could not update late approval. Please try again.') }
    finally { setApproving(false) }
  }

  async function reopen() {
    if (!window.confirm(`Reopen ${group.name}’s submission? This clears their submitted status and lets them edit and resubmit (late approval is granted).`)) return
    setReopening(true)
    try { await post({ reopen: true }); onChanged() }
    catch { alert('Could not reopen the submission. Please try again.') }
    finally { setReopening(false) }
  }

  const contributed = group.members.filter(m => m.contributed).length

  return (
    <div className="rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button onClick={onToggle} className="shrink-0 text-gray-400 hover:text-gray-700">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <button onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-gray-800 truncate">{group.name}</p>
          <p className="text-xs text-gray-400">{contributed} / {group.members.length} contributed</p>
        </button>

        <div className="shrink-0 text-center">
          {group.submitted
            ? <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md">Submitted</span>
            : group.pastDeadline
              ? <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-md">Past deadline</span>
              : <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Not submitted</span>}
          {group.submittedAt && <p className="mt-1 text-[11px] text-gray-400">{new Date(group.submittedAt).toLocaleDateString()}</p>}
          {group.submitted && (
            <button onClick={reopen} disabled={reopening} className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-brand-700 disabled:opacity-50">
              <RotateCcw size={11} /> {reopening ? 'Reopening…' : 'Reopen'}
            </button>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <input
            type="number" min={0} max={100} value={grade}
            onChange={e => setGrade(e.target.value)}
            placeholder="—"
            className="w-16 text-center text-sm rounded-lg border border-gray-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
            title="Group grade (0–100)"
          />
          <span className="text-xs text-gray-400">%</span>
          <Button size="sm" onClick={saveGrade} loading={saving} disabled={!dirty && !saved}>
            {saved ? <><Check size={13} /> Saved</> : 'Save'}
          </Button>
        </div>
      </div>

      {/* Late-approval banner: only relevant when past deadline and not yet submitted. */}
      {group.pastDeadline && !group.submitted && (
        <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
          <span className="text-xs text-amber-800 flex items-center gap-1.5">
            <Clock size={13} />
            {group.lateApproved ? 'Late submission approved — this group can still submit.' : 'Deadline passed. Approve a late submission to let this group submit.'}
          </span>
          <Button size="sm" variant={group.lateApproved ? 'secondary' : 'primary'} onClick={toggleLate} loading={approving}>
            {group.lateApproved ? 'Revoke' : 'Approve late'}
          </Button>
        </div>
      )}

      {/* Expanded: per-member sections + attestations */}
      {expanded && (
        <div className="px-3 pb-4 pt-1 bg-gray-50/60 space-y-3 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 mt-2">Feedback to group</label>
            <textarea
              value={gradeNote}
              onChange={e => setGradeNote(e.target.value)}
              rows={2}
              placeholder="Optional feedback shown to every group member with their grade."
              className="w-full text-sm rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {group.members.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-2">This group has no members.</p>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                Each member gets the group grade{group.grade !== null ? ` (${group.grade}%)` : ''} unless you set an
                individual grade below.
              </p>
              <div className="space-y-2">
                {group.members.map(m => (
                  <MemberSection
                    key={m.userId}
                    member={m}
                    groupGrade={group.grade}
                    assignmentId={assignmentId}
                    groupId={group.groupId}
                    onChanged={onChanged}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MemberSection({ member, groupGrade, assignmentId, groupId, onChanged }: {
  member: Member
  groupGrade: number | null
  assignmentId: string
  groupId: string
  onChanged: () => void
}) {
  const html = sanitizeNoteHtml(toNoteHtml(member.body))
  const empty = isHtmlEmpty(html)

  const [grade, setGrade] = useState(member.grade !== null ? String(member.grade) : '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setGrade(member.grade !== null ? String(member.grade) : '') }, [member.grade])

  const dirty = grade !== (member.grade !== null ? String(member.grade) : '')

  async function save() {
    setSaving(true); setSaved(false)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/group-presentation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, memberUserId: member.userId, grade: grade === '' ? null : Number(grade) }),
      })
      if (!res.ok) throw new Error('failed')
      setSaved(true); setTimeout(() => setSaved(false), 2000); onChanged()
    } catch { alert('Could not save this member’s grade. Please try again.') }
    finally { setSaving(false) }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-surface p-3">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="text-sm font-semibold text-gray-800">{member.name}</span>
        {member.contributed
          ? <span className="inline-flex items-center gap-1 text-[11px] text-green-700"><CheckCircle2 size={12} /> Contributed</span>
          : <span className="inline-flex items-center gap-1 text-[11px] text-gray-400"><XCircle size={12} /> No contribution</span>}
        {member.attested
          ? <span className="inline-flex items-center gap-1 text-[11px] text-brand-700"><CheckCircle2 size={12} /> Attested</span>
          : <span className="inline-flex items-center gap-1 text-[11px] text-amber-600"><Clock size={12} /> Not attested</span>}

        {/* Per-member grade override */}
        <div className="ml-auto flex items-center gap-1.5">
          <input
            type="number" min={0} max={100} value={grade}
            onChange={e => setGrade(e.target.value)}
            placeholder={groupGrade !== null ? String(groupGrade) : '—'}
            title="Individual grade (blank = inherit group grade)"
            className="w-16 text-center text-sm rounded-lg border border-gray-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
          <span className="text-xs text-gray-400">%</span>
          <Button size="sm" variant="secondary" onClick={save} loading={saving} disabled={!dirty && !saved}>
            {saved ? <><Check size={12} /> Saved</> : 'Set'}
          </Button>
        </div>
      </div>
      <p className="mb-1.5 text-[11px] text-gray-400">
        {member.grade !== null ? `Individual grade: ${member.grade}%` : `Inherits group grade${groupGrade !== null ? ` (${groupGrade}%)` : ''}`}
      </p>
      {empty
        ? <p className="text-xs text-gray-400 italic">No section written yet.</p>
        : <div className="prose-notes text-sm leading-snug text-gray-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={{ __html: html }} />}
      {member.aiDeclaration.trim() !== '' && (
        <p className="mt-2 border-t border-gray-100 pt-1.5 text-xs text-gray-500">
          <span className="font-medium text-gray-600">AI / sources statement:</span> {member.aiDeclaration}
        </p>
      )}
    </div>
  )
}
