'use client'
import { useEffect, useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/lib/api-client'
import { DiagramCanvas, type DiagramData } from '@/components/phrase/DiagramCanvas'
import { parseRef, treeWords, type RefBook, type Sentence } from '@/components/phrase/PhraseExplorer'

interface Data {
  assignment: { id: string; title: string; reference: string | null; instructions: string | null }
  open: boolean
  late: boolean
  submission: {
    diagrams: Record<string, DiagramData>
    notes: string
    submittedAt: string | null
    grade: number | null
    gradeNote: string | null
  }
}

/** The layout key for one sentence card — must match what the grader uses. */
export const sentenceKey = (s: Sentence) => `${s.chapter}:${s.startVerse}-${s.endVerse}`

/** Load the Macula sentence cards for a passage reference (same data as the Diagramming tab). */
export function usePhraseSentences(reference: string | null) {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; sentences: Sentence[]; hebrew: boolean }
  >({ status: 'loading' })
  useEffect(() => {
    let alive = true
    if (!reference) { setState({ status: 'error' }); return }
    ;(async () => {
      try {
        const booksData = await fetch('/data/books.json').then(r => r.json())
        const books: RefBook[] = [...(booksData.gnt ?? []), ...(booksData.mt ?? [])]
        const p = parseRef(reference, books)
        if (!p) throw new Error('bad ref')
        const data = await fetch(`/data/phrase-tree/${p.osisId}.json`).then(r => { if (!r.ok) throw new Error('no data'); return r.json() })
        const sentences = (data.sentences as Sentence[]).filter(
          s => s.chapter === p.chapter && s.startVerse <= p.verseEnd && s.endVerse >= p.verseStart,
        )
        if (!alive) return
        setState({ status: 'ready', sentences, hebrew: books.find(b => b.osisId === p.osisId)?.corpus === 'MT' })
      } catch {
        if (alive) setState({ status: 'error' })
      }
    })()
    return () => { alive = false }
  }, [reference])
  return state
}

// A student's workspace for a DIAGRAM assignment: the assigned passage's sentence cards,
// each a diagram canvas (the same one as the Diagramming tab), saved into the assignment's
// own submission — the student's personal study diagrams are untouched. Diagrams auto-save
// as they are drawn; handing in locks everything until the instructor reopens it.
export function DiagramWorkspace({ assignmentId, previewMode = false }: { assignmentId: string; previewMode?: boolean }) {
  const t = useT()
  const { data, isLoading, mutate } = useApi<Data>(`/api/assignments/${assignmentId}/diagram`)

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        <Loader2 size={16} className="inline animate-spin" /> {t('da.loading')}
      </p>
    )
  }
  if (!data) return <p className="py-8 text-sm italic text-gray-400">{t('da.couldNotLoad')}</p>

  return <Workspace key={data.submission.submittedAt ?? 'draft'} data={data} assignmentId={assignmentId} previewMode={previewMode} onSaved={() => mutate()} />
}

function Workspace({ data, assignmentId, previewMode, onSaved }: {
  data: Data
  assignmentId: string
  previewMode: boolean
  onSaved: () => void
}) {
  const t = useT()
  const submitted = !!data.submission.submittedAt
  // Read-only once handed in, once the window closes, or when an instructor is previewing.
  const locked = submitted || !data.open || previewMode

  const sentences = usePhraseSentences(data.assignment.reference)
  // The canvases persist straight into this ref (one POST per change), so the whole
  // map is always current when the student hands in.
  const diagramsRef = useRef<Record<string, DiagramData>>({ ...data.submission.diagrams })
  const [notes, setNotes] = useState(data.submission.notes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function post(submit: boolean) {
    const res = await fetch(`/api/assignments/${assignmentId}/diagram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagrams: diagramsRef.current, notes, submit }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error ?? t('da.saveFailed'))
  }

  // Canvas auto-save: update the map and post a draft. Errors surface in the banner —
  // the canvas's own "Saved" only flashes when the promise resolves.
  async function saveCanvas(key: string, d: DiagramData | null) {
    if (locked) return
    if (d) diagramsRef.current[key] = d
    else delete diagramsRef.current[key]
    setError('')
    try { await post(false) } catch (err) {
      setError(err instanceof Error ? err.message : t('da.saveFailed'))
      throw err
    }
  }

  async function save(submit: boolean) {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await post(submit)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('da.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Grade, once the instructor has entered one ── */}
      {data.submission.grade != null && (
        <div className="space-y-1 rounded-xl border border-brand-200 bg-brand-50 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-brand-800">{t('cs.yourGrade')}</span>
            <span className="text-2xl font-bold text-brand-700">{data.submission.grade}%</span>
          </div>
          {data.submission.gradeNote && <p className="whitespace-pre-wrap text-sm text-brand-700">{data.submission.gradeNote}</p>}
        </div>
      )}

      {submitted && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <span className="font-semibold">{t('cs.handedIn')}</span> {t('da.lockedNote')}
        </div>
      )}

      {/* ── The sentence canvases ── */}
      {sentences.status === 'loading' && (
        <p className="py-8 text-center text-sm text-gray-400">
          <Loader2 size={16} className="inline animate-spin" /> {t('reader.loading')}
        </p>
      )}
      {sentences.status === 'error' && (
        <p className="py-8 text-sm italic text-gray-400">{t('da.noSentences')}</p>
      )}
      {sentences.status === 'ready' && sentences.sentences.map(s => {
        const key = sentenceKey(s)
        return (
          <div key={key} className="rounded-xl border border-gray-200 p-4">
            <p className="mb-2 text-xs font-semibold text-gray-400">{s.ref}</p>
            <DiagramCanvas
              words={treeWords(s.tree)}
              rtl={sentences.hebrew}
              initialData={diagramsRef.current[key] ?? null}
              onSave={d => saveCanvas(key, d)}
              readOnly={locked}
            />
          </div>
        )
      })}

      {/* ── Comment to the instructor ── */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-800">{t('da.notesLabel')}</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          disabled={locked}
          rows={3}
          placeholder={t('da.notesPlaceholder')}
          className="input w-full text-sm"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {previewMode && (
        <p className="text-xs italic text-gray-400">{t('cs.previewNotSaved')}</p>
      )}

      {!locked && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {saved && <span className="flex items-center gap-1.5 text-sm text-green-600"><Check size={15} /> {t('cs.saved')}</span>}
          <Button variant="secondary" onClick={() => save(false)} loading={saving}>{t('cs.saveDraft')}</Button>
          <Button
            onClick={() => {
              if (!window.confirm(t('da.confirmHandIn'))) return
              save(true)
            }}
            loading={saving}
          >
            {t('cs.handIn')}
          </Button>
        </div>
      )}
    </div>
  )
}
