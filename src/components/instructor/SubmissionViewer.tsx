'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save, RotateCcw } from 'lucide-react'
import { GRADE_COMPONENTS, DEFAULT_WEIGHTS, normalizeWeights, passageGrade, examTotal, type GradeWeights, type PassageSubScores } from '@/lib/exam-grading'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { MT_OSIS } from '@/lib/mt-books'
import { scriptProps } from '@/lib/script-detect'
import { formatDateTime } from '@/lib/i18n/format'

type T = (key: string, vars?: Record<string, string | number>) => string

// Per-passage sub-scores as input strings (parsing/syntax/translation).
type SubScoreInputs = { parsing: string; syntax: string; translation: string }
const EMPTY_SUBSCORES: SubScoreInputs = { parsing: '', syntax: '', translation: '' }
/** Friendly name for a lockdown integrity event type; an unlogged type shows as itself. */
const integrityLabel = (type: string, t: T) => {
  const out = t(`integrity.${type}`)
  return out === `integrity.${type}` ? type : out
}

// ── Answer-timing telemetry helpers (lockdown exams) ──
/** A readable pointer to the answer a timing key refers to, e.g. "v5 · Parsing". */
function timingLabel(key: string, t: T): string {
  if (key.startsWith('vt:')) return t('sub.verseTranslationTiming', { ref: key.slice(3) })
  const idx = key.lastIndexOf(':')
  if (idx < 0) return key
  const annKey = key.slice(0, idx)
  const field = key.slice(idx + 1)
  const verse = annKey.split('-')[0]
  const name = t(`grade.component.${field}`)
  return `v${verse} · ${name === `grade.component.${field}` ? field : name}`
}
/** Format a millisecond duration as "12s" or "1m 05s". */
function fmtMs(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2, '0')}s`
}

/** Convert input strings to a numeric sub-score object (omitting blanks). */
function toNumericSubScores(v: SubScoreInputs): PassageSubScores {
  const out: PassageSubScores = {}
  for (const c of GRADE_COMPONENTS) {
    if (v[c] !== '') out[c] = Number(v[c])
  }
  return out
}

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
  passageGrades: Record<string, PassageSubScores | number> | null  // exams: per-passage sub-scores keyed by reference
  integrityEvents: { type: string; at: string }[] | null  // lockdown exams: logged violations
  answerTimings: Record<string, { t0: number; tLast: number; edits: number }> | null  // lockdown exams: per-answer typing telemetry
}

interface VerseWord {
  id: string
  surface: string
  position: number
}

interface Verse {
  id?: string
  reference?: string
  verse: number
  words: VerseWord[]
}

type RefBook = { osisId: string; name: string; abbrev: string; totalChapters: number; corpus?: string }
/** Parse a reference like "John 15:1-4" against a book list (client mirror of the server parser). */
function parseRef(ref: string, books: RefBook[]): { osisId: string; chapter: number; verseStart: number; verseEnd: number } | null {
  const q = ref.trim().replace(/[–—]/g, '-')
  // Letter class includes accented characters — "Génesis 1:1" is a valid reference on a
  // Spanish-locale course, and ASCII \w silently rejects it.
  const m = q.match(/^((?:\d\s*)?[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?)\s+(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?(?:\s*-\s*(\d+))?$/)
  if (!m) return null
  const bookPart = m[1].trim().toLowerCase().replace(/\s+/g, '')
  const chapter = parseInt(m[2]); const vs = m[3] ? parseInt(m[3]) : 1; const ve = m[4] ? parseInt(m[4]) : vs
  const dashEnd = m[5] ? parseInt(m[5]) : undefined   // bare "N-M" verse range (single-chapter books)
  const book = books.find(b => [b.osisId, b.name, b.abbrev].some(s => {
    const c = s.toLowerCase().replace(/\s+/g, ''); return c === bookPart || c.startsWith(bookPart) || bookPart.startsWith(c.slice(0, Math.max(3, bookPart.length)))
  }))
  if (!book) return null
  // Single-chapter books (Jude, Obadiah, …): bare numbers are verses of ch.1, "14-15" a range.
  if (book.totalChapters === 1 && !m[3]) return { osisId: book.osisId, chapter: 1, verseStart: chapter, verseEnd: dashEnd ?? chapter }
  return { osisId: book.osisId, chapter, verseStart: vs, verseEnd: ve }
}

/** Single annotation field — shows value, or em-dash if empty */
function Field({ value }: { value?: string }) {
  if (!value) return <span className="text-gray-300">—</span>
  return <span>{value}</span>
}

/** Three sub-rows (Parsing / Syntax / Translation) for one column */
const ANN_FIELDS = ['parsing', 'syntax', 'translation'] as const
type AnnField = typeof ANN_FIELDS[number]
const annLabel = (f: AnnField, t: T) => t(`grade.componentShort.${f}`)

// `fields` pins which rows to render so the Round 1 and Round 2 columns stay
// vertically aligned field-by-field (e.g. a lone Round 2 Syntax note lines up with
// the Round 1 Syntax row instead of jumping to the top).
function AnnotationBlock({ ann, fields }: { ann: WordAnnotation; fields?: readonly AnnField[] }) {
  const t = useT()
  const show = fields ?? ANN_FIELDS.filter(f => ann[f])
  if (show.length === 0) return <span className="text-gray-300 italic text-xs">—</span>
  return (
    <div className="space-y-1 text-xs">
      {show.map(f => (
        <p key={f}>
          {ann[f]
            ? <><span className="text-gray-400 uppercase tracking-wide text-[10px] mr-1">{annLabel(f, t)}</span>{ann[f]}</>
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
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [verses, setVerses] = useState<Verse[]>([])
  const [studentName, setStudentName] = useState('')
  const [grade, setGrade] = useState<string>('')
  const [gradeNote, setGradeNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isExam, setIsExam] = useState(false)
  const [reopening, setReopening] = useState(false)
  // Exam passages, in display order: each holds its reference line (used as the grade key) and its verses.
  const [examGroups, setExamGroups] = useState<{ key: string; label: string; verses: Verse[] }[]>([])
  // Per-passage sub-scores (as input strings), keyed by reference line.
  const [passageGrades, setPassageGrades] = useState<Record<string, SubScoreInputs>>({})
  // Exam-wide sub-score weights.
  const [weights, setWeights] = useState<GradeWeights>(DEFAULT_WEIGHTS)
  // Auto-save bookkeeping: baseline of the last persisted grade so we only save on change.
  const loadedRef = useRef(false)
  const lastSavedRef = useRef('')

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/exegesis/${sessionId}`)
      if (!res.ok) { setError(t('sub.notFound')); return }
      const data = await res.json()
      const s: Session = data.session
      setSession(s)
      setGrade(s.grade !== null ? String(s.grade) : '')
      setGradeNote(s.gradeNote ?? '')
      // Hydrate the per-passage inputs. New format is { parsing, syntax, translation };
      // a legacy number (Phase 2b single score) is dropped into the translation field.
      const savedPg = (s.passageGrades ?? {}) as Record<string, PassageSubScores | number>
      const pgInputs = Object.fromEntries(Object.entries(savedPg).map(([k, v]) => {
        if (typeof v === 'number') return [k, { ...EMPTY_SUBSCORES, translation: String(v) }]
        return [k, {
          parsing: v.parsing != null ? String(v.parsing) : '',
          syntax: v.syntax != null ? String(v.syntax) : '',
          translation: v.translation != null ? String(v.translation) : '',
        }]
      })) as Record<string, SubScoreInputs>
      setPassageGrades(pgInputs)
      // Remember the just-loaded grade as the baseline so auto-save only fires on edits.
      lastSavedRef.current = JSON.stringify({ grade: s.grade !== null ? String(s.grade) : '', gradeNote: s.gradeNote ?? '', passageGrades: pgInputs })
      loadedRef.current = true

      const rRes = await fetch(`/api/assignments/${assignmentId}/results`)
      if (rRes.ok) {
        const rData = await rRes.json()
        const row = rData.rows?.find((r: { sessionId: string; name: string }) => r.sessionId === sessionId)
        if (row) setStudentName(row.name)
      }

      // Determine the assignment type — exams span several passages stored on the assignment.
      const aRes = await fetch(`/api/assignments/${assignmentId}`)
      const assignment = aRes.ok ? (await aRes.json()).assignment : null
      if (assignment?.type === 'TRANSLATION_EXAM' && assignment.reference) {
        setIsExam(true)
        setWeights(normalizeWeights(assignment.gradeWeights))
        // GNT + MT merged: a Hebrew course's exam references OT books, and a book list
        // that only knows the NT silently drops every passage of such an exam.
        const [gRes, mRes] = await Promise.all([fetch('/api/reader?corpus=GNT'), fetch('/api/reader?corpus=MT')])
        const books: RefBook[] = [
          ...(gRes.ok ? ((await gRes.json()).books ?? []) : []),
          ...(mRes.ok ? ((await mRes.json()).books ?? []).map((b: RefBook) => ({ ...b, corpus: 'MT' })) : []),
        ]
        const refs = (assignment.reference as string).split('\n').map(l => l.trim()).filter(Boolean)
        const all: Verse[] = []
        const groups: { key: string; label: string; verses: Verse[] }[] = []
        for (const line of refs) {
          const p = parseRef(line, books)
          if (!p) continue
          const gv: Verse[] = []
          const vRes = await fetch(`/api/reader?book=${p.osisId}&chapter=${p.chapter}${MT_OSIS.has(p.osisId) ? '&corpus=MT' : ''}`)
          if (vRes.ok) {
            const vData = await vRes.json()
            for (const v of (vData.verses ?? []) as Verse[]) {
              if (v.verse >= p.verseStart && v.verse <= p.verseEnd) { gv.push(v); all.push(v) }
            }
          }
          groups.push({ key: line, label: line, verses: gv })
        }
        setVerses(all)
        setExamGroups(groups)
      } else if (s.bookOsisId) {
        const vRes = await fetch(`/api/reader?book=${s.bookOsisId}&chapter=${s.chapter}${MT_OSIS.has(s.bookOsisId) ? '&corpus=MT' : ''}`)
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
          // Exams are graded per passage with three sub-scores; the server derives the
          // overall grade from these + the exam weights. Exercises send a single grade.
          ...(isExam
            ? { passageGrades: Object.fromEntries(Object.entries(passageGrades).map(([k, v]) => [k, toNumericSubScores(v)])) }
            : { grade: grade === '' ? null : Number(grade) }),
          gradeNote: gradeNote || null,
          // Pass the assignment so the server can adopt legacy "orphan" sessions at grade time
          assignmentId,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      lastSavedRef.current = JSON.stringify({ grade, gradeNote, passageGrades })
      setSaved(true)
      // Refresh server components (course gradebook) so the saved grade is reflected on navigation
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError(t('sub.saveFailed'))
    } finally {
      setSaving(false)
    }
  }, [sessionId, grade, gradeNote, isExam, passageGrades, assignmentId, router])

  // Auto-save: 800ms after the instructor stops editing, persist any change. The
  // baseline (lastSavedRef) prevents saving the just-loaded values or re-saving
  // immediately after a manual save.
  useEffect(() => {
    if (!loadedRef.current) return
    if (JSON.stringify({ grade, gradeNote, passageGrades }) === lastSavedRef.current) return
    const t = setTimeout(() => { saveGrade() }, 800)
    return () => clearTimeout(t)
  }, [grade, gradeNote, passageGrades, saveGrade])

  // Reopen this student's submission so they can edit and resubmit. Clears the
  // submitted state and grade; their work is preserved (shares the results un-submit API).
  async function reopen() {
    if (!confirm(t('sub.reopenConfirm', { name: studentName || t('sub.theStudent') }))) return
    setReopening(true)
    setError('')
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/results?sessionId=${encodeURIComponent(sessionId)}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || t('sub.reopenFailed'))
        return
      }
      router.push(onBack)
      router.refresh()
    } catch {
      setError(t('sub.reopenFailed'))
    } finally {
      setReopening(false)
    }
  }

  // Numeric per-passage sub-scores (for live grade math).
  const numericPassageGrades = Object.fromEntries(
    Object.entries(passageGrades).map(([k, v]) => [k, toNumericSubScores(v)]),
  ) as Record<string, PassageSubScores>

  if (error) return <p className="text-red-600">{error}</p>
  if (!session) return <p className="text-gray-400 animate-pulse">{t('sub.loading')}</p>

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

  // Exam overall = rounded average of the per-passage grades (mirrors the server).
  const examOverall = examTotal(numericPassageGrades, weights)

  const renderVerseCard = (verse: Verse) => {
    // Verse translations are keyed by verse number for single-passage exercises,
    // but by the unique verse id for multi-passage exams (avoids cross-passage collisions).
    const verseKey = isExam ? (verse.id ?? String(verse.verse)) : String(verse.verse)
    const round1Trans = session.verseTranslations?.[verseKey]?.trim() ?? ''
    const round2Notes = session.verseCorrections?.[verseKey]?.trim() ?? ''
    const verseLabel = verse.reference ?? `${session.bookName} ${session.chapter}:${verse.verse}`
    return (
      <Card key={verse.id ?? verse.verse}>
        {/* Full Greek verse at the top */}
        <div className="mb-4 pb-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1">{verseLabel}</p>
          {(() => { const text = verse.words.map(w => w.surface).join(' '); const sp = scriptProps(text); return (
            <p dir={sp.dir} className={`${sp.className} text-lg leading-relaxed text-gray-900`}>{text}</p>
          ) })()}
        </div>

        {/* Whole-verse translation (Round 1) and Round 2 Notes */}
        {(round1Trans || round2Notes) && (
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                {t(isExam ? 'sub.verseTranslation' : 'sub.round1VerseTranslation')}
              </p>
              <div className={`text-sm whitespace-pre-wrap rounded-lg px-3 py-2 border ${round1Trans ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-50 border-gray-200 text-gray-300 italic'}`}>
                {round1Trans || t('sub.notProvided')}
              </div>
            </div>
            {!isExam && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500 mb-1">
                  {t('sub.round2Notes')}
                </p>
                <div className={`text-sm whitespace-pre-wrap rounded-lg px-3 py-2 border ${round2Notes ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-300 italic'}`}>
                  {round2Notes || t('sub.notProvided')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3-column table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-2 pr-4 text-left font-semibold text-gray-500 w-36">{t('sub.colGreekWord')}</th>
                <th className="pb-2 pr-4 text-left font-semibold text-gray-700 w-64">{t(isExam ? 'sub.colAnnotations' : 'sub.colRound1')}</th>
                {!isExam && <th className="pb-2 text-left font-semibold text-red-600">{t('sub.colRound2')}</th>}
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
                        <p dir={scriptProps(word.surface).dir} className={`${scriptProps(word.surface).className} text-base text-gray-900`}>{word.surface}</p>
                      </td>
                    )}
                    <td className="py-1 pr-4 align-top text-gray-700">
                      {round1[f] && <p><span className="text-gray-400 uppercase tracking-wide text-[10px] mr-1">{annLabel(f, t)}</span>{round1[f]}</p>}
                    </td>
                    {!isExam && (
                      <td className="py-1 align-top text-red-700">
                        {corAnn[f] && <p><span className="text-gray-400 uppercase tracking-wide text-[10px] mr-1">{annLabel(f, t)}</span>{corAnn[f]}</p>}
                      </td>
                    )}
                  </tr>
                ))
              })}
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Back + meta */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={14} /> {t('sub.back')}
        </Link>
        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
          <span>{t(isExam ? 'sub.exam' : 'sub.passage')}: <strong className="text-gray-800">{isExam ? t('sub.verseCount', { count: verses.length, n: verses.length }) : `${session.bookName} ${session.chapter}:${session.verseStart}–${session.verseEnd}`}</strong></span>
          <span>{t('sub.submitted')}: <strong className="text-gray-800">{session.submittedAt ? formatDateTime(session.submittedAt, locale) : t('sub.notSubmitted')}</strong></span>
          {session.submittedAt && (
            <Button size="sm" variant="secondary" onClick={reopen} loading={reopening} className="text-amber-700 hover:bg-amber-50" title={t('sub.reopenTitle')}>
              <RotateCcw size={13} /> {t('sub.reopen')}
            </Button>
          )}
        </div>
      </div>

      {/* Student's Notes & Questions (live scratchpad they kept during Round 1 & 2) */}
      {session.notes?.trim() && (
        <Card>
          <CardTitle>{t('sub.areasForImprovement', { name: studentName || t('sub.aStudent') })}</CardTitle>
          <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {session.notes}
          </p>
        </Card>
      )}

      {/* Lockdown integrity report (exams in lockdown mode) */}
      {session.integrityEvents && session.integrityEvents.length > 0 && (() => {
        const all = session.integrityEvents
        // Some entries in the append-only log aren't violations (the student's rules
        // acknowledgment, and any instructor reopen) — pull them out and show them
        // separately rather than counting them as flags.
        const ackEvent = all.find(e => e.type === 'acknowledged-rules') ?? null
        const reopenEvents = all.filter(e => e.type === 'reopened-by-instructor')
        const events = all.filter(e => e.type !== 'acknowledged-rules' && e.type !== 'reopened-by-instructor')
        // Summary: count by type, most frequent first.
        const counts = new Map<string, number>()
        for (const e of events) counts.set(e.type, (counts.get(e.type) ?? 0) + 1)
        const summary = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
        const times = events.map(e => e.at ? new Date(e.at).getTime() : NaN).filter(t => !isNaN(t))
        const first = times.length ? new Date(Math.min(...times)) : null
        const last = times.length ? new Date(Math.max(...times)) : null
        return (
          <Card>
            <CardTitle className="text-red-700">🔒 {t('sub.integrityTitle', { count: events.length, n: events.length })}</CardTitle>
            <p className="text-xs text-gray-500 mt-1 mb-3">
              {t('sub.integrityIntro', { name: studentName || t('sub.aStudent') })}
            </p>

            {ackEvent && (
              <p className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
                ✓ {t('sub.acknowledged')}{ackEvent.at ? ` — ${formatDateTime(ackEvent.at, locale)}` : ''}.
              </p>
            )}
            {reopenEvents.map((e, i) => (
              <p key={`reopen-${i}`} className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                ↺ {t('sub.reopenedByInstructor')}{e.at ? ` — ${formatDateTime(e.at, locale)}` : ''}. {t('sub.reopenedNote')}
              </p>
            ))}

            {events.length === 0 ? (
              <p className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600">
                {t('sub.noViolations')}
              </p>
            ) : (
              <>
                {/* At-a-glance summary by type */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {summary.map(([type, n]) => (
                    <span key={type} className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-xs text-red-700">
                      <span className="font-semibold">{n}×</span> {integrityLabel(type, t)}
                    </span>
                  ))}
                </div>
                {first && last && (
                  <p className="text-xs text-gray-500 mb-3">
                    {t('sub.firstLastEvent', { first: formatDateTime(first, locale), last: formatDateTime(last, locale) })}
                    {session.submittedAt && t('sub.alsoSubmitted', { when: formatDateTime(session.submittedAt, locale) })}
                  </p>
                )}

                {/* Full chronological log */}
                <ol className="text-xs divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                  {events.map((e, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-3 py-1.5 odd:bg-gray-50">
                      <span className="text-gray-400 w-6 shrink-0 tabular-nums">{i + 1}.</span>
                      <span className="font-medium text-gray-700 flex-1">{integrityLabel(e.type, t)}</span>
                      <span className="text-gray-400 shrink-0">{e.at ? formatDateTime(e.at, locale) : ''}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
            <p className="text-[11px] text-gray-400 mt-2">{t('sub.printTip')}</p>
          </Card>
        )
      })()}

      {/* Answer-timing telemetry (lockdown exams) */}
      {session.answerTimings && Object.keys(session.answerTimings).length > 0 && (() => {
        const timings = session.answerTimings!
        const anns = (session.annotations ?? {}) as Annotations
        const vts = session.verseTranslations ?? {}
        // The final text the student left in the field a timing key refers to.
        const valueFor = (key: string): string => {
          if (key.startsWith('vt:')) return (vts[key.slice(3)] ?? '').trim()
          const idx = key.lastIndexOf(':')
          if (idx < 0) return ''
          const ann = anns[key.slice(0, idx)]
          const field = key.slice(idx + 1) as keyof WordAnnotation
          return (ann?.[field] ?? '').trim()
        }
        const entries = Object.entries(timings)
        const firstKeystroke = Math.min(...entries.map(([, t]) => t.t0))
        // Flag answers whose final text is "too complete for the typing it took": filled in
        // a single action, or with far fewer keystrokes than characters (suggests a paste /
        // autofill rather than hand-typing). Paste is blocked in lockdown, so this is a
        // signal that something bypassed it — review the camera recording for these.
        const flagged = entries
          .map(([key, t]) => ({ key, t, val: valueFor(key) }))
          .filter(({ t, val }) => val.length >= 4 && (t.edits <= 1 || (val.length >= 6 && t.edits < val.length * 0.5)))
          .sort((a, b) => a.t.t0 - b.t.t0)
        return (
          <Card>
            <CardTitle className="text-amber-700">⌨️ {t('sub.timingTitle', { count: entries.length, n: entries.length })}</CardTitle>
            <p className="text-xs text-gray-500 mt-1 mb-3">{t('sub.timingIntro')}</p>
            <div className="flex flex-wrap gap-2 mb-3 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 text-gray-700">
                {t('sub.firstKeystroke', { t: fmtMs(firstKeystroke) })}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${flagged.length ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                {t('sub.enteredFast', { count: flagged.length, n: flagged.length })}
              </span>
            </div>
            {flagged.length > 0 && (
              <ol className="text-xs divide-y divide-gray-100 border border-amber-200 rounded-lg overflow-hidden">
                {flagged.map(({ key, t: timing, val }) => (
                  <li key={key} className="flex items-center justify-between gap-3 px-3 py-1.5 odd:bg-amber-50/40">
                    <span className="font-medium text-gray-700 shrink-0 w-28">{timingLabel(key, t)}</span>
                    <span className="text-gray-500 flex-1 truncate">{timing.edits <= 1 ? t('sub.filledSingleAction') : t('sub.charsInKeystrokes', { chars: val.length, edits: timing.edits })}</span>
                    <span className="text-gray-400 shrink-0">{t('sub.atOffset', { t: fmtMs(timing.t0) })}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        )
      })()}

      {/* Grade entry */}
      <Card>
        <CardTitle>{t('sub.gradeFor', { name: studentName || t('sub.student') })}</CardTitle>
        {isExam ? (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-gray-500">
              {t('sub.examGradeHelp', {
                weights: GRADE_COMPONENTS.map(c => `${t(`grade.component.${c}`)} ${weights[c]}%`).join(' · '),
              })}
            </p>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-sm font-semibold text-gray-700">{t('sub.examTotal')}</span>
              <span className="text-sm font-semibold text-gray-900">{examOverall !== null ? `${examOverall} ${t('sub.outOf100')}` : '—'}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('sub.feedbackNote')}</label>
              <input
                type="text" value={gradeNote} onChange={e => setGradeNote(e.target.value)}
                placeholder={t('sub.feedbackExample')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveGrade} loading={saving} size="sm">
                <Save size={14} /> {saved ? t('sub.savedBang') : t('sub.saveGrade')}
              </Button>
              <span className="text-xs text-gray-400">{saving ? t('sub.saving') : saved ? t('sub.saved') : t('sub.autoSaves')}</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('sub.score')}</label>
              <input
                type="number" min={0} max={100}
                value={grade} onChange={e => setGrade(e.target.value)}
                placeholder="—"
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('sub.feedbackNote')}</label>
              <input
                type="text" value={gradeNote} onChange={e => setGradeNote(e.target.value)}
                placeholder={t('sub.feedbackExample')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveGrade} loading={saving} size="sm">
                <Save size={14} /> {saved ? t('sub.savedBang') : t('sub.saveGrade')}
              </Button>
              <span className="text-xs text-gray-400">{saving ? t('sub.saving') : saved ? t('sub.saved') : t('sub.autoSaves')}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Post-deadline diff */}
      {submittedAnnotations && diffKeys.length > 0 && (
        <Card>
          <CardTitle className="text-amber-700 mb-3">
            {t('sub.postDeadline', { count: diffKeys.length, n: diffKeys.length })}
          </CardTitle>
          <p className="text-xs text-gray-500 mb-4">{t('sub.postDeadlineIntro')}</p>
          <div className="overflow-x-auto rounded-lg border border-amber-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-200">
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">{t('sub.colWord')}</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">{t('sub.colOriginal')}</th>
                  <th className="px-3 py-2 text-left font-semibold text-amber-700">{t('sub.colEdited')}</th>
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
                        <p dir={scriptProps(word?.surface).dir} className={`${scriptProps(word?.surface).className} text-base text-gray-900`}>{word?.surface ?? key}</p>
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
        <p className="text-xs text-gray-400 italic">{t('sub.noPostDeadline')}</p>
      )}

      {/* Verse-by-verse 3-column table */}
      {verses.length === 0 && (
        <p className="text-sm text-gray-400 italic">{t('sub.noVerseText')}</p>
      )}

      {/* Exams: group verses under each passage with its own score header.
          Exercises: flat verse-by-verse list. */}
      {isExam
        ? examGroups.map(g => {
            const scores = passageGrades[g.key] ?? EMPTY_SUBSCORES
            const pg = passageGrade(toNumericSubScores(scores), weights)
            return (
              <div key={g.key} className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h3 className="text-sm font-semibold text-gray-800">{g.label}</h3>
                  <span className="text-xs text-gray-500">{t('sub.passageGrade')}: <strong className="text-gray-800">{pg !== null ? `${Math.round(pg)} ${t('sub.outOf100')}` : '—'}</strong></span>
                </div>
                {g.verses.map(renderVerseCard)}
                {/* Grade this passage right after its text, so you can grade as you read. */}
                <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{t('sub.gradePassage', { label: g.label })}</span>
                    <span className="text-xs text-gray-500">{t('sub.passageGrade')}: <strong className="text-gray-800">{pg !== null ? `${Math.round(pg)} ${t('sub.outOf100')}` : '—'}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {GRADE_COMPONENTS.map(c => (
                      <div key={c} className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 w-20">{t(`grade.component.${c}`)}</span>
                        <input
                          type="number" min={0} max={100}
                          value={scores[c]}
                          onChange={e => setPassageGrades(prev => ({ ...prev, [g.key]: { ...(prev[g.key] ?? EMPTY_SUBSCORES), [c]: e.target.value } }))}
                          placeholder={t('sub.scoreRange')}
                          className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-xs text-gray-400 select-none">{t('sub.outOf100')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })
        : verses.map(renderVerseCard)}
    </div>
  )
}
