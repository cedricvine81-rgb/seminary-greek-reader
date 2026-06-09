'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
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
  userId: string
  title: string
  bookOsisId: string
  bookName: string
  chapter: number
  verseStart: number
  verseEnd: number
  annotations: Annotations
  corrections: Annotations
  submittedAt: string | null
  grade: number | null
  gradeNote: string | null
}

interface VerseWord {
  id: string
  text: string
  verseNum: number
  position: number
}

interface Verse {
  verse: number
  words: VerseWord[]
}

function AnnotationCell({ label, value, correction }: { label: string; value?: string; correction?: string }) {
  if (!value && !correction) return null
  return (
    <div className="text-xs space-y-0.5">
      <span className="text-gray-400 uppercase tracking-wide text-[10px]">{label}</span>
      {value && <p className="text-gray-700">{value}</p>}
      {correction && correction !== value && (
        <p className="text-red-600 font-medium">{correction} <span className="text-red-400 font-normal">(corrected)</span></p>
      )}
    </div>
  )
}

export default function SubmissionViewerPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.assignmentId as string
  const sessionId = params.sessionId as string

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
      // Load session
      const res = await fetch(`/api/exegesis/${sessionId}`)
      if (!res.ok) { setError('Submission not found.'); return }
      const data = await res.json()
      const s: Session = data.session
      setSession(s)
      setGrade(s.grade !== null ? String(s.grade) : '')
      setGradeNote(s.gradeNote ?? '')

      // Load student name from enrollment roster via results API
      const rRes = await fetch(`/api/assignments/${assignmentId}/results`)
      if (rRes.ok) {
        const rData = await rRes.json()
        const row = rData.rows?.find((r: { sessionId: string; name: string }) => r.sessionId === sessionId)
        if (row) setStudentName(row.name)
      }

      // Load verse text via reader API (full chapter, then filter)
      const bookOsisId = s.bookOsisId
      if (bookOsisId) {
        const vRes = await fetch(`/api/reader?book=${bookOsisId}&chapter=${s.chapter}`)
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
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save grade.')
    } finally {
      setSaving(false)
    }
  }, [sessionId, grade, gradeNote])

  if (error) return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Submission">
      <p className="text-red-600">{error}</p>
    </DashboardShell>
  )

  if (!session) return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Loading…">
      <p className="text-gray-400 animate-pulse">Loading submission…</p>
    </DashboardShell>
  )

  const annotations = (session.annotations ?? {}) as Annotations
  const corrections = (session.corrections ?? {}) as Annotations

  return (
    <DashboardShell
      role="INSTRUCTOR"
      pageTitle={`${studentName || 'Student'} — ${session.title}`}
      actions={
        <Button variant="ghost" size="sm" onClick={() => router.push(`/instructor/assignments/${assignmentId}`)}>
          <ArrowLeft size={14} /> Back to assignment
        </Button>
      }
    >
      <div className="space-y-6 max-w-4xl">

        {/* Meta bar */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>Passage: <strong className="text-gray-800">{session.bookName} {session.chapter}:{session.verseStart}–{session.verseEnd}</strong></span>
          <span>Submitted: <strong className="text-gray-800">{session.submittedAt ? new Date(session.submittedAt).toLocaleString() : 'Not yet submitted'}</strong></span>
        </div>

        {/* Grade entry */}
        <Card>
          <CardTitle>Grade</CardTitle>
          <div className="mt-3 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Score (0–100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={grade}
                onChange={e => setGrade(e.target.value)}
                placeholder="—"
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Feedback / note</label>
              <input
                type="text"
                value={gradeNote}
                onChange={e => setGradeNote(e.target.value)}
                placeholder="Optional instructor note…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <Button onClick={saveGrade} loading={saving} size="sm">
              <Save size={14} /> {saved ? 'Saved!' : 'Save grade'}
            </Button>
          </div>
        </Card>

        {/* Verse-by-verse annotation viewer */}
        {verses.length === 0 && (
          <p className="text-sm text-gray-400 italic">No verse text available.</p>
        )}

        {verses.map(verse => (
          <Card key={verse.verse}>
            <CardTitle className="text-sm text-gray-500 font-normal mb-3">
              {session.bookName} {session.chapter}:{verse.verse}
            </CardTitle>
            <div className="space-y-3">
              {verse.words.map(word => {
                const key = `${verse.verse}-${word.id}`
                const ann = annotations[key] ?? {}
                const cor = corrections[key] ?? {}
                const hasContent = ann.parsing || ann.syntax || ann.translation || cor.parsing || cor.syntax || cor.translation
                return (
                  <div key={word.id} className="flex gap-4 items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="min-w-[120px]">
                      <p className="font-serif text-lg text-gray-900">{word.text}</p>
                      <p className="text-xs text-gray-400">word {word.position}</p>
                    </div>
                    {hasContent ? (
                      <div className="flex flex-wrap gap-4 flex-1">
                        <AnnotationCell label="Parsing" value={ann.parsing} correction={cor.parsing} />
                        <AnnotationCell label="Syntax" value={ann.syntax} correction={cor.syntax} />
                        <AnnotationCell label="Translation" value={ann.translation} correction={cor.translation} />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 italic self-center">No annotation</p>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>
    </DashboardShell>
  )
}
