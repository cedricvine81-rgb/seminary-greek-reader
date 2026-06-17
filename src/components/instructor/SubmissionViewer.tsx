'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save } from 'lucide-react'

interface WordAnnotation {
  parsing?: string
  syntax?: string
  translation?: string
}
type Annotations = Record<string, WordAnnotation>

interface Session {
  id: string
  title: string
  bookOsisId: string
  bookName: string
  chapter: number
  verseStart: number
  verseEnd: number
  annotations: Annotations
  corrections: Annotations
  // Whole-verse fields, keyed by verse number (as string)
  verseTranslations: Record<string, string> | null
  verseCorrections: Record<string, string> | null
  notes: string | null
  submittedAnnotations: Annotations | null
  submittedAt: string | null
  grade: number | null
  gradeNote: string | null
}

interface VerseWord {
  id: string
  surface: string
  position: number
}

interface Verse {
  verse: number
  words: VerseWord[]
}

/** Single annotation field — shows value, or em-dash if empty */
function Field({ value }: { value?: string }) {
  if (!value) return <span className="text-gray-300">—</span>
  return <span>{value}</span>
}

/** Three sub-rows (Parsing / Syntax / Translation) for one column */
const ANN_FIELDS = ['parsing', 'syntax', 'translation'] as const
type AnnField = typeof ANN_FIELDS[number]
const ANN_LABELS: Record<AnnField, string> = { parsing: 'Parse', syntax: 'Syntax', translation: 'Trans.' }

// `fields` pins which rows to render so the Round 1 and Round 2 columns stay
// vertically aligned field-by-field (e.g. a lone Round 2 Syntax note lines up with
// the Round 1 Syntax row instead of jumping to the top).
function AnnotationBlock({ ann, fields }: { ann: WordAnnotation; fields?: readonly AnnField[] }) {
  const show = fields ?? ANN_FIELDS.filter(f => ann[f])
  if (show.length === 0) return <span className="text-gray-300 italic text-xs">—</span>
  return (
    <div className="space-y-1 text-xs">
      {show.map(f => (
        <p key={f}>
          {ann[f]
            ? <><span className="text-gray-400 uppercase tracking-wide text-[10px] mr-1">{ANN_LABELS[f]}</span>{ann[f]}</>
            : <span className="opacity-0 select-none">—</span>}
        </p>
      ))}
    </div>
  )
}

interface Props {
  assignmentId: string
  sessionId: string
  onBack: string
}

export function SubmissionViewer({ assignmentId, sessionId, onBack }: Props) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [verses, setVerses] = useState<Verse[]>([])
  const [studentName, setStudentName] = useState('')
  const [grade, setGrade] = useState<string>('')
  const [gradeNote, setGradeNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/exegesis/${sessionId}`)
      if (!res.ok) { setError('Submission not found.'); return }
      const data = await res.json()
      const s: Session = data.session
      setSession(s)
      setGrade(s.grade !== null ? String(s.grade) : '')
      setGradeNote(s.gradeNote ?? '')

      const rRes = await fetch(`/api/assignments/${assignmentId}/results`)
      if (rRes.ok) {
        const rData = await rRes.json()
        const row = rData.rows?.find((r: { sessionId: string; name: string }) => r.sessionId === sessionId)
        if (row) setStudentName(row.name)
      }

      if (s.bookOsisId) {
        const vRes = await fetch(`/api/reader?book=${s.bookOsisId}&chapter=${s.chapter}`)
        if (vRes.ok) {
          const vData = await vRes.json()
          const allVerses: Verse[] = vData.verses ?? []
          setVerses(allVerses.filter(v => v.verse >= s.verseStart && v.verse <= s.verseEnd))
        }
      }
    }
    load()
  }, [sessionId, assignmentId])

  const saveGrade = useCallback(async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/exegesis/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: grade === '' ? null : Number(grade),
          gradeNote: gradeNote || null,
          // Pass the assignment so the server can adopt legacy "orphan" sessions at grade time
          assignmentId,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      // Refresh server components (course gradebook) so the saved grade is reflected on navigation
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save grade.')
    } finally {
      setSaving(false)
    }
  }, [sessionId, grade, gradeNote])

  if (error) return <p className="text-red-600">{error}</p>
  if (!session) return <p className="text-gray-400 animate-pulse">Loading submission…</p>

  const annotations = (session.annotations ?? {}) as Annotations
  const corrections = (session.corrections ?? {}) as Annotations
  const submittedAnnotations = (session.submittedAnnotations ?? null) as Annotations | null

  // Post-deadline diff
  const diffKeys: string[] = []
  if (submittedAnnotations) {
    const allKeys = Array.from(new Set(Object.keys(submittedAnnotations).concat(Object.keys(annotations))))
    for (const k of allKeys) {
      const orig = submittedAnnotations[k] ?? {}
      const curr = annotations[k] ?? {}
      if (orig.parsing !== curr.parsing || orig.syntax !== curr.syntax || orig.translation !== curr.translation) {
        diffKeys.push(k)
      }
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Back + meta */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={14} /> Back to assignment
        </Link>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>Passage: <strong className="text-gray-800">{session.bookName} {session.chapter}:{session.verseStart}–{session.verseEnd}</strong></span>
          <span>Submitted: <strong className="text-gray-800">{session.submittedAt ? new Date(session.submittedAt).toLocaleString() : 'Not yet submitted'}</strong></span>
        </div>
      </div>

      {/* Student's Notes & Questions (live scratchpad they kept during Round 1 & 2) */}
      {session.notes?.trim() && (
        <Card>
          <CardTitle>📝 Notes &amp; Questions from {studentName || 'the student'}</CardTitle>
          <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {session.notes}
          </p>
        </Card>
      )}

      {/* Grade entry */}
      <Card>
        <CardTitle>Grade — {studentName || 'Student'}</CardTitle>
        <div className="mt-3 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Score (0–100)</label>
            <input
              type="number" min={0} max={100}
              value={grade} onChange={e => setGrade(e.target.value)}
              placeholder="—"
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Feedback / note</label>
            <input
              type="text" value={gradeNote} onChange={e => setGradeNote(e.target.value)}
              placeholder="Optional instructor note…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <Button onClick={saveGrade} loading={saving} size="sm">
            <Save size={14} /> {saved ? 'Saved!' : 'Save grade'}
          </Button>
        </div>
      </Card>

      {/* Post-deadline diff */}
      {submittedAnnotations && diffKeys.length > 0 && (
        <Card>
          <CardTitle className="text-amber-700 mb-3">
            Post-deadline edits — {diffKeys.length} word{diffKeys.length === 1 ? '' : 's'} changed
          </CardTitle>
          <p className="text-xs text-gray-500 mb-4">
            Round 1 annotations were edited after the submission deadline. Changes shown below.
          </p>
          <div className="overflow-x-auto rounded-lg border border-amber-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-200">
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">Word</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Original submission</th>
                  <th className="px-3 py-2 text-left font-semibold text-amber-700">Edited after deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {diffKeys.map(key => {
                  const [verseNumStr, wordId] = key.split('-')
                  const verse = verses.find(v => v.verse === Number(verseNumStr))
                  const word = verse?.words.find(w => w.id === wordId)
                  const orig = (submittedAnnotations[key] ?? {}) as WordAnnotation
                  const curr = (annotations[key] ?? {}) as WordAnnotation
                  return (
                    <tr key={key} className="hover:bg-amber-50/50">
                      <td className="px-3 py-2.5">
                        <p className="font-greek text-base text-gray-900">{word?.surface ?? key}</p>
                        <p className="text-gray-400 text-[10px]">{session.bookName} {session.chapter}:{verseNumStr}</p>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600"><AnnotationBlock ann={orig} /></td>
                      <td className="px-3 py-2.5 text-amber-800 font-medium"><AnnotationBlock ann={curr} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {submittedAnnotations && diffKeys.length === 0 && (
        <p className="text-xs text-gray-400 italic">No edits made after the submission deadline.</p>
      )}

      {/* Verse-by-verse 3-column table */}
      {verses.length === 0 && (
        <p className="text-sm text-gray-400 italic">No verse text available.</p>
      )}

      {verses.map(verse => {
        const verseKey = String(verse.verse)
        const round1Trans = session.verseTranslations?.[verseKey]?.trim() ?? ''
        const round2Notes = session.verseCorrections?.[verseKey]?.trim() ?? ''
        return (
        <Card key={verse.verse}>
          {/* Full Greek verse at the top */}
          <div className="mb-4 pb-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 mb-1">{session.bookName} {session.chapter}:{verse.verse}</p>
            <p className="font-greek text-lg leading-relaxed text-gray-900">
              {verse.words.map(w => w.surface).join(' ')}
            </p>
          </div>

          {/* Whole-verse translation (Round 1) and Round 2 Notes */}
          {(round1Trans || round2Notes) && (
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Round 1 — Verse translation
                </p>
                <div className={`text-sm whitespace-pre-wrap rounded-lg px-3 py-2 border ${round1Trans ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-50 border-gray-200 text-gray-300 italic'}`}>
                  {round1Trans || '— not provided —'}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500 mb-1">
                  Round 2 Notes
                </p>
                <div className={`text-sm whitespace-pre-wrap rounded-lg px-3 py-2 border ${round2Notes ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-300 italic'}`}>
                  {round2Notes || '— not provided —'}
                </div>
              </div>
            </div>
          )}

          {/* 3-column table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 pr-4 text-left font-semibold text-gray-500 w-36">Greek word</th>
                  <th className="pb-2 pr-4 text-left font-semibold text-gray-700 w-64">Round 1 — annotations</th>
                  <th className="pb-2 text-left font-semibold text-red-600">Round 2 — corrections</th>
                </tr>
              </thead>
              <tbody>
                {verse.words.flatMap(word => {
                  const key = `${verse.verse}-${word.id}`
                  // Round 1: use the snapshot taken at submit time when available; fall back to current annotations
                  const round1 = (submittedAnnotations ? (submittedAnnotations[key] ?? {}) : (annotations[key] ?? {})) as WordAnnotation
                  const corAnn = (corrections[key] ?? {}) as WordAnnotation
                  const fields = ANN_FIELDS.filter(f => round1[f] || corAnn[f])
                  if (fields.length === 0) return []
                  // One table row per field so Round 1 and Round 2 of the same field
                  // share a row height and stay aligned even when a value wraps.
                  return fields.map((f, i) => (
                    <tr key={`${word.id}-${f}`} className={i === 0 ? 'border-t border-gray-100' : ''}>
                      {i === 0 && (
                        <td rowSpan={fields.length} className="py-2.5 pr-4 align-top">
                          <p className="font-greek text-base text-gray-900">{word.surface}</p>
                        </td>
                      )}
                      <td className="py-1 pr-4 align-top text-gray-700">
                        {round1[f] && <p><span className="text-gray-400 uppercase tracking-wide text-[10px] mr-1">{ANN_LABELS[f]}</span>{round1[f]}</p>}
                      </td>
                      <td className="py-1 align-top text-red-700">
                        {corAnn[f] && <p><span className="text-gray-400 uppercase tracking-wide text-[10px] mr-1">{ANN_LABELS[f]}</span>{corAnn[f]}</p>}
                      </td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        </Card>
        )
      })}
    </div>
  )
}
