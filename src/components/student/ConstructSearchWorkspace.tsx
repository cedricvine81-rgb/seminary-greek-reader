'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ExternalLink, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/lib/api-client'
import {
  CONSTRUCT_MAX_FINDINGS, constructCorpusLabel, describeConstruct, emptyFinding,
  findingIsComplete, parseConstructLink, type ConstructConfig, type ConstructFinding,
} from '@/lib/construct-assignment'

interface Data {
  assignment: { id: string; title: string; searchHref: string | null; instructions: string | null; config: ConstructConfig }
  open: boolean
  late: boolean
  submission: {
    findings: ConstructFinding[]
    notes: string
    submittedAt: string | null
    grade: number | null
    gradeNote: string | null
  }
}

// A student's workspace for a Construct Search assignment: the search the instructor set,
// a link that opens it, and the list of examples they are building. Work is saved as a whole
// list (Save), and handing it in locks it until the instructor reopens it.
export function ConstructSearchWorkspace({ assignmentId, previewMode = false }: { assignmentId: string; previewMode?: boolean }) {
  const { data, isLoading, mutate } = useApi<Data>(`/api/assignments/${assignmentId}/construct-search`)

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        <Loader2 size={16} className="inline animate-spin" /> Loading your find-list…
      </p>
    )
  }
  if (!data) return <p className="py-8 text-sm italic text-gray-400">Could not load this assignment.</p>

  return <Workspace key={data.submission.submittedAt ?? 'draft'} data={data} assignmentId={assignmentId} previewMode={previewMode} onSaved={() => mutate()} />
}

function Workspace({ data, assignmentId, previewMode, onSaved }: {
  data: Data
  assignmentId: string
  previewMode: boolean
  onSaved: () => void
}) {
  const { config, searchHref, instructions } = data.assignment
  const submitted = !!data.submission.submittedAt
  // Read-only once handed in, once the window closes, or when an instructor is previewing.
  const locked = submitted || !data.open || previewMode

  const [findings, setFindings] = useState<ConstructFinding[]>(
    data.submission.findings.length > 0 ? data.submission.findings : Array.from({ length: config.requiredCount }, emptyFinding),
  )
  const [notes, setNotes] = useState(data.submission.notes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const search = useMemo(() => (searchHref ? parseConstructLink(searchHref) : null), [searchHref])
  const done = findings.filter(findingIsComplete).length
  const enough = done >= config.requiredCount

  // Warn before leaving with unsaved edits — a find-list is half an hour of reading.
  const dirty = notes !== data.submission.notes || JSON.stringify(findings) !== JSON.stringify(data.submission.findings)
  useEffect(() => {
    if (!dirty || locked) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, locked])

  function update(i: number, field: keyof ConstructFinding, value: string) {
    setFindings(prev => prev.map((f, j) => (j === i ? { ...f, [field]: value } : f)))
  }

  async function save(submit: boolean) {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/construct-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findings, notes, submit }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Could not save your work.')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your work.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* ── The search ── */}
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 space-y-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-900">
          <Search size={15} /> Your search
        </p>
        {search ? (
          <>
            <p className="text-sm text-brand-800">{describeConstruct(search.query)}</p>
            <p className="text-xs text-brand-600">In {constructCorpusLabel(search.query)}</p>
          </>
        ) : (
          <p className="text-sm text-brand-800">Your instructor hasn&rsquo;t attached a search to this assignment yet.</p>
        )}
        {searchHref && (
          <Link href={searchHref} target="_blank" className="btn btn-primary inline-flex w-fit items-center gap-1.5 px-4 py-2">
            Run the search <ExternalLink size={14} />
          </Link>
        )}
        {instructions && <p className="whitespace-pre-wrap border-t border-brand-200 pt-3 text-sm text-brand-800">{instructions}</p>}
      </div>

      {/* ── Grade, once the instructor has entered one ── */}
      {data.submission.grade != null && (
        <div className="space-y-1 rounded-xl border border-brand-200 bg-brand-50 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-brand-800">Your Grade</span>
            <span className="text-2xl font-bold text-brand-700">{data.submission.grade}%</span>
          </div>
          {data.submission.gradeNote && <p className="whitespace-pre-wrap text-sm text-brand-700">{data.submission.gradeNote}</p>}
        </div>
      )}

      {submitted && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <span className="font-semibold">Handed in.</span> Your find-list is locked — ask your instructor to
          reopen it if you need to change something.
        </div>
      )}

      {/* ── The find-list ── */}
      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-800">
            Examples you found
            <span className={`ml-2 text-xs font-medium ${enough ? 'text-green-700' : 'text-gray-400'}`}>
              {done} of {config.requiredCount} complete
            </span>
          </h2>
          <p className="text-xs text-gray-400">A row counts once it has both a reference and the Greek.</p>
        </div>

        <div className="space-y-3">
          {findings.map((f, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-semibold ${findingIsComplete(f) ? 'text-green-700' : 'text-gray-400'}`}>
                  {i + 1}.
                </span>
                {!locked && findings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setFindings(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-300 transition-colors hover:text-red-600"
                    title="Remove this row"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  value={f.ref}
                  onChange={e => update(i, 'ref', e.target.value)}
                  disabled={locked}
                  placeholder="Reference — e.g. Mark 1:9"
                  className="input text-sm sm:col-span-1"
                />
                <input
                  value={f.greek}
                  onChange={e => update(i, 'greek', e.target.value)}
                  disabled={locked}
                  placeholder="The Greek words"
                  className="input font-reading text-sm sm:col-span-2"
                />
              </div>
              {config.askTranslation && (
                <input
                  value={f.translation}
                  onChange={e => update(i, 'translation', e.target.value)}
                  disabled={locked}
                  placeholder="Your translation"
                  className="input mt-2 text-sm"
                />
              )}
              {config.askComment && (
                <textarea
                  value={f.comment}
                  onChange={e => update(i, 'comment', e.target.value)}
                  disabled={locked}
                  rows={2}
                  placeholder="Comment — what is the construction doing here?"
                  className="input mt-2 text-sm"
                />
              )}
            </div>
          ))}
        </div>

        {!locked && findings.length < CONSTRUCT_MAX_FINDINGS && (
          <button
            type="button"
            onClick={() => setFindings(prev => [...prev, emptyFinding()])}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-surface px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            <Plus size={13} /> Add another example
          </button>
        )}
      </div>

      {/* ── Conclusions ── */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-800">What did you notice? (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          disabled={locked}
          rows={4}
          placeholder="Patterns across your examples, anything the search turned up that surprised you, cases you weren't sure counted…"
          className="input w-full text-sm"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {previewMode && (
        <p className="text-xs italic text-gray-400">Preview — nothing you type here is saved.</p>
      )}

      {!locked && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {saved && <span className="flex items-center gap-1.5 text-sm text-green-600"><Check size={15} /> Saved</span>}
          <Button variant="secondary" onClick={() => save(false)} loading={saving}>Save draft</Button>
          <Button
            onClick={() => {
              if (!enough && !window.confirm(`You have ${done} of ${config.requiredCount} examples complete. Hand in anyway?`)) return
              if (!window.confirm('Hand in your find-list? You will not be able to edit it afterwards.')) return
              save(true)
            }}
            loading={saving}
          >
            Hand in
          </Button>
        </div>
      )}
    </div>
  )
}
