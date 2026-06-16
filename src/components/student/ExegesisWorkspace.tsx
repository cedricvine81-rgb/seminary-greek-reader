'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BiblicalBook, VerseWord } from '@/types/biblical-text'
import { buildParsingLabel } from '@/lib/parsing'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WordAnnotation {
  parsing: string
  syntax: string
  translation: string
}

type AnnotationMap = Record<string, WordAnnotation> // key = "verse-wordId"

interface LoadedVerse {
  id: string
  verse: number
  reference: string
  text: string
  words: VerseWord[]
}

interface SavedSession {
  id: string
  title: string
  bookOsisId: string
  bookName: string
  chapter: number
  verseStart: number
  verseEnd: number
  assignmentId?: string | null
  submittedAt?: string | null
  updatedAt: string
}

interface AssignmentInfo {
  id: string
  title: string
  reference: string | null
  instructions: string | null
  timeLimitSeconds: number | null         // stage 1: annotation phase
  reviewTimeLimitSeconds: number | null   // stage 2: review/correction phase; null = unlimited
  submissionDeadline: Date | null         // null = no deadline
  round1Deadline: Date | null             // absolute cut-off for Round 1 annotations
  round2Deadline: Date | null             // absolute cut-off for Round 2 corrections
  allowReaderInRound2: boolean            // expose Reader info during Round 2
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wordKey(verse: number, wordId: string) {
  return `${verse}-${wordId}`
}

/** Inline Round 2 popover anchored to a clicked word. Shows the student's locked Round 1
 *  answers, optional Reader info (parsing/gloss/lexeme), and editable Round 2 correction inputs. */
function Round2WordPopover({
  word, verseNum, original, correction, locked, showReader, onCorrection, onClose,
}: {
  word: VerseWord
  verseNum: number
  original: WordAnnotation
  correction: WordAnnotation
  locked: boolean
  showReader: boolean
  onCorrection: (key: string, field: keyof WordAnnotation, value: string) => void
  onClose: () => void
}) {
  const key = wordKey(verseNum, word.id)
  const parse = word.parses?.[0]
  const parsingLabel = parse ? buildParsingLabel(parse) : ''
  const lexeme = word.lexeme?.lexeme ?? ''
  const gloss = word.lexeme?.gloss ?? ''
  const extendedGloss = word.lexeme?.extendedGloss ?? ''

  const FIELDS: { field: keyof WordAnnotation; label: string }[] = [
    { field: 'parsing', label: 'Parsing' },
    { field: 'syntax', label: 'Syntax / Function' },
    { field: 'translation', label: 'Translation' },
  ]

  return (
    <div className="mt-2 mb-3 w-full max-w-xl rounded-xl border border-brand-300 bg-white shadow-lg overflow-hidden print:hidden">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-3 bg-brand-50 px-3 py-2 border-b border-brand-200">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-greek text-2xl text-brand-800">{word.surface}</span>
          {lexeme && (
            <span className="text-xs text-gray-500 truncate">
              <span className="font-greek text-sm text-gray-700">{lexeme}</span>
              {parse?.partOfSpeech && <span className="ml-1">· {parse.partOfSpeech}</span>}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1"
        >
          ×
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Reader info — only when the assignment allows it */}
        {showReader && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Reader reference</p>
            {parsingLabel && (
              <p className="text-xs"><span className="text-gray-500">Parsing:</span> <span className="text-gray-800 font-medium">{parsingLabel}</span></p>
            )}
            {gloss && (
              <p className="text-xs"><span className="text-gray-500">Gloss:</span> <span className="text-gray-800">{gloss}</span></p>
            )}
            {extendedGloss && extendedGloss !== gloss && (
              <p className="text-xs text-gray-600 italic">{extendedGloss}</p>
            )}
          </div>
        )}

        {/* Round 1 answers (locked) + Round 2 correction inputs, per field */}
        {FIELDS.map(({ field, label }) => (
          <div key={field}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
              <span className="text-[10px] text-gray-400">Round 1</span>
            </div>
            <div className={`mb-1.5 text-xs px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-200 ${original[field] ? 'text-gray-600' : 'text-gray-300 italic'}`}>
              {original[field] || '—'}
            </div>
            <input
              type="text"
              value={correction[field]}
              disabled={locked}
              onChange={e => onCorrection(key, field, e.target.value)}
              placeholder={locked ? '' : 'Round 2 correction…'}
              className={`w-full rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                locked
                  ? 'border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                  : 'border-2 border-red-300 bg-red-50 text-red-700 placeholder-red-300 focus:ring-red-400'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Format an absolute deadline in the student's local time, e.g. "Mon, Jun 15, 2026 · 11:59 PM" */
function formatDeadline(d: Date): string {
  const date = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}

/** A single deadline line: shows the date/time, and a "Closed" state once passed. */
function DeadlineLine({ label, date, passed }: { label: string; date: Date; passed: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${passed ? 'text-gray-400' : 'text-brand-700'}`}>
      <span className="font-medium">{label}:</span>
      <span className={passed ? 'line-through' : ''}>{formatDeadline(date)}</span>
      {passed && <span className="font-semibold text-amber-700">· Closed</span>}
    </span>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Normal annotation panel used during the timed phase */
function AnnotationPanel({
  word, verseNum, annotations, onChange, locked,
}: {
  word: VerseWord; verseNum: number; annotations: AnnotationMap
  onChange: (key: string, field: keyof WordAnnotation, value: string) => void
  locked?: boolean
}) {
  const key = wordKey(verseNum, word.id)
  const ann = annotations[key] ?? { parsing: '', syntax: '', translation: '' }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-greek text-brand-700">{word.surface}</span>
      </div>

      {(['parsing', 'syntax', 'translation'] as const).map(field => (
        <div key={field}>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            {field === 'parsing' ? 'Parsing' : field === 'syntax' ? 'Syntax / Function' : 'Observations'}
          </label>
          <input
            type="text"
            value={ann[field]}
            disabled={locked}
            onChange={e => onChange(key, field, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          />
        </div>
      ))}
    </div>
  )
}

/** Review-mode annotation panel — shown after Round 1 ends.
 *  Round 1 answers are grouped (read-only) at the top; Round 2 correction
 *  inputs for all three fields are grouped together below. */
function ReviewAnnotationPanel({
  word, verseNum, annotations, corrections, onCorrection, locked,
}: {
  word: VerseWord; verseNum: number
  annotations: AnnotationMap; corrections: AnnotationMap
  onCorrection: (key: string, field: keyof WordAnnotation, value: string) => void
  locked?: boolean
}) {
  const key = wordKey(verseNum, word.id)
  const original = annotations[key] ?? { parsing: '', syntax: '', translation: '' }
  const corr = corrections[key] ?? { parsing: '', syntax: '', translation: '' }

  const FIELDS: { field: keyof WordAnnotation; label: string }[] = [
    { field: 'parsing', label: 'Parsing' },
    { field: 'syntax', label: 'Syntax / Function' },
    { field: 'translation', label: 'Observations' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Word header */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-greek text-brand-700">{word.surface}</span>
      </div>

      {/* ── Round 1 — your answers (read-only) ── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Round 1 — your answers</p>
        {FIELDS.map(({ field, label }) => (
          <div key={field}>
            <span className="block text-[11px] font-medium text-gray-500 mb-0.5">{label}</span>
            <div className={`text-sm px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 min-h-[2rem] ${original[field] ? 'text-gray-600' : 'text-gray-300 italic'}`}>
              {original[field] || '—'}
            </div>
          </div>
        ))}
      </div>

      {/* ── Round 2 — corrections (below Round 1) ── */}
      <div className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-wide ${locked ? 'text-gray-400' : 'text-red-500'}`}>
          Round 2 — corrections{locked ? ' (locked)' : ''}
        </p>
        {FIELDS.map(({ field, label }) => (
          <div key={field}>
            <span className="block text-[11px] font-medium text-gray-500 mb-0.5">{label}</span>
            <input
              type="text"
              value={corr[field]}
              disabled={locked}
              onChange={e => onCorrection(key, field, e.target.value)}
              placeholder={locked ? '' : 'Add a correction…'}
              className={`w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                locked
                  ? 'border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                  : 'border-2 border-red-300 text-red-700 placeholder-red-200 focus:ring-red-400 bg-red-50'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Right-side passage reader shown during review mode. */
function ReviewPassagePanel({
  verses, selectedWordKey, onWordClick,
}: {
  verses: LoadedVerse[]
  selectedWordKey: string | null
  onWordClick: (word: VerseWord, verse: number) => void
}) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full overflow-hidden border-l border-gray-200">
      {/* Header */}
      <div className="shrink-0 px-4 py-2 bg-brand-50 border-b border-brand-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Passage Reader</p>
        <p className="text-xs text-brand-500 ml-1">Click any word to annotate</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {verses.map(v => (
          <div key={v.id}>
            <p className="text-xs text-gray-400 font-medium mb-1">{v.reference}</p>
            <div className="flex flex-wrap gap-1 leading-loose">
              {v.words.map(w => {
                const key = wordKey(v.verse, w.id)
                const isActive = selectedWordKey === key
                return (
                  <button
                    key={w.id}
                    onClick={() => onWordClick(w, v.verse)}
                    onMouseEnter={() => setHoveredKey(key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    className={[
                      'px-1.5 py-0.5 rounded text-xl font-greek transition-colors',
                      isActive ? 'bg-brand-100 text-brand-800'
                        : hoveredKey === key ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-800 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    {w.surface}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Reference parser (for assignment auto-load) ──────────────────────────────
// Parses strings like "John 1:1-5", "Rom 3:23", "1 Cor 13:4–7"
function parsePassageRef(ref: string, books: BiblicalBook[]): {
  book: BiblicalBook; chapter: number; verseStart: number; verseEnd: number
} | null {
  const q = ref.trim().replace(/–|—/g, '-')
  // Match: bookPart + chapter : verseStart [-verseEnd]
  const m = q.match(/^((?:\d\s*)?\w[\w\s]*?)\s+(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!m) return null
  const bookPart = m[1].trim().toLowerCase().replace(/\s+/g, '')
  const ch = parseInt(m[2])
  const vs = m[3] ? parseInt(m[3]) : 1
  const ve = m[4] ? parseInt(m[4]) : vs

  const book = books.find(b => {
    const c = [b.osisId, b.name, b.abbrev].map(s => s.toLowerCase().replace(/\s+/g, ''))
    return c.some(s => s === bookPart || s.startsWith(bookPart) || bookPart.startsWith(s.slice(0, Math.max(3, bookPart.length))))
  })
  if (!book) return null
  // Single-chapter books (Jude, Philemon, etc.): if only one number is given, treat it as verse not chapter
  if (book.totalChapters === 1 && !m[3]) {
    return { book, chapter: 1, verseStart: ch, verseEnd: ch }
  }
  return { book, chapter: ch, verseStart: vs, verseEnd: ve }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExegesisWorkspace({ assignmentId: propAssignmentId, isAuthenticated = true }: { assignmentId?: string; isAuthenticated?: boolean }) {
  const router = useRouter()

  // ── Passage state ──
  const [books, setBooks] = useState<BiblicalBook[]>([])
  const [selectedBook, setSelectedBook] = useState<BiblicalBook | null>(null)
  const [chapter, setChapter] = useState(1)
  const [verseStart, setVerseStart] = useState(1)
  const [verseEnd, setVerseEnd] = useState(1)
  // Standalone passage box: type a reference like "Matthew 3:1-3" to load it.
  const [passageInput, setPassageInput] = useState('')
  const [passageError, setPassageError] = useState(false)
  const [loadedVerses, setLoadedVerses] = useState<LoadedVerse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // ── Annotation state ──
  const [annotations, setAnnotations] = useState<AnnotationMap>({})
  const [corrections, setCorrections] = useState<AnnotationMap>({})
  // Round 1 whole-verse translations, keyed by verse number (as string)
  const [verseTranslations, setVerseTranslations] = useState<Record<string, string>>({})
  // Round 2 whole-verse notes/corrections, keyed by verse number (as string)
  const [verseCorrections, setVerseCorrections] = useState<Record<string, string>>({})
  // Free-form "Notes & Questions" scratchpad — live across Round 1 & 2, locked at submit
  const [notes, setNotes] = useState('')
  const [notesOpen, setNotesOpen] = useState(true)
  const [selectedWordKey, setSelectedWordKey] = useState<string | null>(null)
  const [selectedWord, setSelectedWord] = useState<{ word: VerseWord; verse: number } | null>(null)
  const wordPanelRef = useRef<HTMLDivElement | null>(null)

  // ── Session persistence ──
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle')
  const [showSessionList, setShowSessionList] = useState(false)
  const sessionListRef = useRef<HTMLDivElement | null>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Assignment mode ──
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [deadlinePassed, setDeadlinePassed] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // ── Stage 1 Timer (annotation phase) ──
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)  // null = untimed
  const [timerExpired, setTimerExpired] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<Date | null>(null)

  // ── Stage 2 Timer (review/correction phase) ──
  const [reviewSecondsLeft, setReviewSecondsLeft] = useState<number | null>(null)
  const [reviewTimerExpired, setReviewTimerExpired] = useState(false)
  const reviewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Live clock for absolute round deadlines (re-evaluated every 20s) ──
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 20_000)
    return () => clearInterval(id)
  }, [])
  const round1Passed = !!assignment?.round1Deadline && now > assignment.round1Deadline.getTime()
  const round2Passed = !!assignment?.round2Deadline && now > assignment.round2Deadline.getTime()

  // ── Load books list ──
  useEffect(() => {
    fetch('/api/reader?corpus=GNT')
      .then(r => r.json())
      .then(d => {
        setBooks(d.books ?? [])
        if (d.books?.length && !propAssignmentId) setSelectedBook(d.books[0])
      })
      .catch(() => {})
  }, [propAssignmentId])

  // ── Standalone: restore the most recent open session on load ──
  // So navigating away (e.g. to change a password) and back doesn't appear to lose
  // work — the last unsubmitted, non-assignment session reopens automatically.
  const didRestoreRef = useRef(false)
  useEffect(() => {
    if (propAssignmentId || !isAuthenticated || books.length === 0 || didRestoreRef.current) return
    didRestoreRef.current = true
    ;(async () => {
      try {
        const r = await fetch('/api/exegesis')
        const d = await r.json()
        const open = (d.sessions ?? []).find(
          (s: SavedSession) => !s.assignmentId && !s.submittedAt
        )
        if (open) await loadSavedSession(open)
      } catch {
        // ignore — fall back to the default blank passage
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propAssignmentId, isAuthenticated, books])

  // ── Assignment mode: load assignment + any existing session ──
  useEffect(() => {
    if (!propAssignmentId || books.length === 0) return
    // Fetch assignment info
    fetch(`/api/assignments/${propAssignmentId}`)
      .then(r => r.json())
      .then(async (d) => {
        const a = d.assignment
        if (!a) return
        const timeLimitSeconds = a.timePerQuestion ?? null
        const reviewTimeLimitSeconds = a.reviewTimeSeconds ?? null
        const assignmentInfo: AssignmentInfo = {
          id: a.id, title: a.title, reference: a.reference ?? null,
          instructions: a.instructions ?? null, timeLimitSeconds, reviewTimeLimitSeconds,
          submissionDeadline: a.submissionDeadline ? new Date(a.submissionDeadline) : null,
          round1Deadline: a.round1Deadline ? new Date(a.round1Deadline) : null,
          round2Deadline: a.round2Deadline ? new Date(a.round2Deadline) : null,
          allowReaderInRound2: !!a.allowReaderInRound2,
        }
        if (assignmentInfo.submissionDeadline && new Date() > assignmentInfo.submissionDeadline) {
          setDeadlinePassed(true)
        }
        setAssignment(assignmentInfo)

        // Look for an existing session for this assignment
        const sr = await fetch(`/api/exegesis?assignmentId=${propAssignmentId}`)
        const sd = await sr.json()

        if (sd.session) {
          // Resume existing session
          const sess = sd.session
          const book = books.find((b: BiblicalBook) => b.osisId === sess.bookOsisId) ?? null
          setSelectedBook(book)
          setChapter(sess.chapter)
          setVerseStart(sess.verseStart)
          setVerseEnd(sess.verseEnd)
          setAnnotations(sess.annotations ?? {})
          setCorrections(sess.corrections ?? {})
          setVerseTranslations(sess.verseTranslations ?? {})
          setVerseCorrections(sess.verseCorrections ?? {})
          setNotes(sess.notes ?? '')
          setSessionId(sess.id)
          setSessionTitle(sess.title)
          const alreadySubmitted = !!sess.submittedAt
          if (alreadySubmitted) setSubmitted(true)
          // Initialise timer from stored startedAt
          if (timeLimitSeconds && sess.startedAt && !alreadySubmitted) {
            const startedAtMs = new Date(sess.startedAt).getTime()
            const elapsed = Math.floor((Date.now() - startedAtMs) / 1000)
            const remaining = timeLimitSeconds - elapsed
            startedAtRef.current = new Date(sess.startedAt)
            if (remaining <= 0) {
              // Stage 1 already expired — enter review mode and restore stage 2 timer
              setTimerExpired(true)
              setSecondsLeft(0)
              if (reviewTimeLimitSeconds) {
                const reviewStartedAtMs = startedAtMs + timeLimitSeconds * 1000
                const reviewElapsed = Math.floor((Date.now() - reviewStartedAtMs) / 1000)
                const reviewRemaining = reviewTimeLimitSeconds - reviewElapsed
                if (reviewRemaining <= 0) {
                  setReviewTimerExpired(true)
                  setReviewSecondsLeft(0)
                } else {
                  setReviewSecondsLeft(reviewRemaining)
                }
              }
            } else {
              setSecondsLeft(remaining)
            }
          }
          // Load passage
          if (book) {
            setIsLoading(true)
            fetch(`/api/reader?book=${book.osisId}&chapter=${sess.chapter}`)
              .then(pr => pr.json())
              .then(pd => {
                const filtered: LoadedVerse[] = (pd.verses ?? []).filter(
                  (v: LoadedVerse) => v.verse >= sess.verseStart && v.verse <= sess.verseEnd
                )
                setLoadedVerses(filtered)
              })
              .finally(() => setIsLoading(false))
          }
        } else if (a.reference) {
          // No session linked to this assignment yet.
          // Before starting fresh, check if the student has an ORPHANED session for the
          // same passage (created before the assignmentId routing was added). If so, adopt it.
          const parsed = parsePassageRef(a.reference, books)
          if (parsed) {
            // Fetch all student sessions to look for an orphan
            let orphanAdopted = false
            try {
              const allRes = await fetch('/api/exegesis')
              if (allRes.ok) {
                const allData = await allRes.json()
                const orphan = (allData.sessions ?? []).find((s: SavedSession) =>
                  !s.assignmentId &&
                  s.bookOsisId === parsed.book.osisId &&
                  s.chapter === parsed.chapter &&
                  s.verseStart === parsed.verseStart &&
                  s.verseEnd === parsed.verseEnd
                )
                if (orphan) {
                  // Patch assignmentId onto the orphaned session
                  await fetch(`/api/exegesis/${orphan.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assignmentId: propAssignmentId }),
                  })
                  // Load the full session (annotations, corrections, etc.)
                  const fullRes = await fetch(`/api/exegesis/${orphan.id}`)
                  if (fullRes.ok) {
                    const fullData = await fullRes.json()
                    const sess = fullData.session
                    if (sess) {
                      const book = books.find((b: BiblicalBook) => b.osisId === sess.bookOsisId) ?? null
                      setSelectedBook(book)
                      setChapter(sess.chapter)
                      setVerseStart(sess.verseStart)
                      setVerseEnd(sess.verseEnd)
                      setAnnotations(sess.annotations ?? {})
                      setCorrections(sess.corrections ?? {})
                      setVerseTranslations(sess.verseTranslations ?? {})
                      setVerseCorrections(sess.verseCorrections ?? {})
                      setNotes(sess.notes ?? '')
                      setSessionId(sess.id)
                      setSessionTitle(sess.title || a.title)
                      if (sess.submittedAt) setSubmitted(true)
                      if (book) {
                        setIsLoading(true)
                        fetch(`/api/reader?book=${book.osisId}&chapter=${sess.chapter}`)
                          .then(pr => pr.json())
                          .then(pd => {
                            const filtered: LoadedVerse[] = (pd.verses ?? []).filter(
                              (v: LoadedVerse) => v.verse >= sess.verseStart && v.verse <= sess.verseEnd
                            )
                            setLoadedVerses(filtered)
                          })
                          .finally(() => setIsLoading(false))
                      }
                      orphanAdopted = true
                    }
                  }
                }
              }
            } catch { /* fall through to fresh start */ }

            if (!orphanAdopted) {
              // No orphan found — start fresh.
              // Create the session row immediately so that startedAt is persisted to the DB
              // before the timer ticks. Without this, a page refresh before the first manual
              // save would reset the timer to zero.
              const startedAt = new Date()
              startedAtRef.current = startedAt
              const resolvedTitle = a.title || `${parsed.book.name} ${parsed.chapter}:${parsed.verseStart}${parsed.verseEnd !== parsed.verseStart ? `–${parsed.verseEnd}` : ''}`

              try {
                const cr = await fetch('/api/exegesis', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: resolvedTitle,
                    bookOsisId: parsed.book.osisId,
                    bookName: parsed.book.name,
                    chapter: parsed.chapter,
                    verseStart: parsed.verseStart,
                    verseEnd: parsed.verseEnd,
                    annotations: {},
                    assignmentId: propAssignmentId,
                    startedAt: startedAt.toISOString(),
                  }),
                })
                const cd = await cr.json()
                if (cd.session?.id) {
                  setSessionId(cd.session.id)
                } else if (cr.status === 409 && cd.sessionId) {
                  // A session already exists for this assignment — load it instead of creating a duplicate
                  setSessionId(cd.sessionId)
                }
              } catch { /* session create failed — timer still starts, will be saved on first manual save */ }

              setSelectedBook(parsed.book)
              setChapter(parsed.chapter)
              setVerseStart(parsed.verseStart)
              setVerseEnd(parsed.verseEnd)
              setSessionTitle(resolvedTitle)
              if (timeLimitSeconds) {
                setSecondsLeft(timeLimitSeconds)
              }
              // Load the passage
              setIsLoading(true)
              fetch(`/api/reader?book=${parsed.book.osisId}&chapter=${parsed.chapter}`)
                .then(pr => pr.json())
                .then(pd => {
                  const filtered: LoadedVerse[] = (pd.verses ?? []).filter(
                    (v: LoadedVerse) => v.verse >= parsed.verseStart && v.verse <= parsed.verseEnd
                  )
                  setLoadedVerses(filtered)
                })
                .finally(() => setIsLoading(false))
            }
          }
        }
      })
      .catch(() => {})
  }, [propAssignmentId, books])

  // ── Load saved sessions list ──
  const loadSessionList = useCallback(() => {
    fetch('/api/exegesis')
      .then(r => r.json())
      .then(d => setSavedSessions(d.sessions ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => { loadSessionList() }, [loadSessionList])

  // Close the word parsing/syntax panel when clicking outside it (clicks on another
  // Greek word are ignored so the selection simply switches).
  useEffect(() => {
    if (!selectedWord) return
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (wordPanelRef.current?.contains(t)) return
      if (t.closest('[data-greek-word]')) return
      setSelectedWord(null)
      setSelectedWordKey(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedWord])

  // Close the "My Sessions" dropdown when clicking outside it.
  useEffect(() => {
    if (!showSessionList) return
    function handleClickOutside(e: MouseEvent) {
      if (sessionListRef.current && !sessionListRef.current.contains(e.target as Node)) {
        setShowSessionList(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSessionList])

  // ── Countdown timer ──
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0 || submitted) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!)
          setTimerExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [secondsLeft !== null && secondsLeft > 0, submitted]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start the stage 2 review timer when Round 1 ends — via the stage-1 timer
  // expiring OR the absolute Round 1 deadline passing (so a deadline chains into a
  // Round 2 timer). Only starts if not already restored from a saved session.
  useEffect(() => {
    if (submitted || reviewSecondsLeft !== null || !assignment?.reviewTimeLimitSeconds) return
    if (timerExpired) {
      // Stage-1 timer path: full review time begins now.
      setReviewSecondsLeft(assignment.reviewTimeLimitSeconds)
    } else if (round1Passed && assignment.round1Deadline) {
      // Deadline path: review time counts from the Round 1 deadline moment, so a
      // page reload can't reset the Round 2 clock.
      const elapsed = Math.floor((Date.now() - assignment.round1Deadline.getTime()) / 1000)
      const remaining = assignment.reviewTimeLimitSeconds - elapsed
      if (remaining <= 0) {
        setReviewSecondsLeft(0)
        setReviewTimerExpired(true)
      } else {
        setReviewSecondsLeft(remaining)
      }
    }
  }, [timerExpired, round1Passed]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stage 2 countdown ──
  useEffect(() => {
    if (reviewSecondsLeft === null || reviewSecondsLeft <= 0 || submitted) return
    if (reviewTimerRef.current) clearInterval(reviewTimerRef.current)
    reviewTimerRef.current = setInterval(() => {
      setReviewSecondsLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(reviewTimerRef.current!)
          setReviewTimerExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (reviewTimerRef.current) clearInterval(reviewTimerRef.current) }
  }, [reviewSecondsLeft !== null && reviewSecondsLeft > 0, submitted]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-submit when stage 2 timer expires ──
  useEffect(() => {
    if (reviewTimerExpired && !submitted && propAssignmentId) {
      submitAssignment()
    }
  }, [reviewTimerExpired]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load passage (auto-loads on selector change) ──
  // `resetSession` clears the current session — used when the book/chapter changes
  // (a genuinely different passage). Verse-range tweaks pass false so annotations
  // on the already-loaded passage survive.
  async function loadPassage(
    book: BiblicalBook | null = selectedBook,
    chap: number = chapter,
    vs: number = verseStart,
    ve: number = verseEnd,
    resetSession = true,
  ) {
    if (!book) return
    setIsLoading(true)
    setLoadedVerses([])
    setSelectedWordKey(null)
    setSelectedWord(null)
    // Standalone tool: loading a fresh passage starts a new session, so clear any
    // prior session + entries (a new session is created lazily on the first edit).
    if (resetSession && !propAssignmentId) {
      setSessionId(null)
      setAnnotations({})
      setCorrections({})
      setVerseTranslations({})
      setVerseCorrections({})
      setSaveStatus('idle')
    }
    try {
      const r = await fetch(`/api/reader?book=${book.osisId}&chapter=${chap}`)
      const d = await r.json()
      if (!d.verses) return
      const filtered: LoadedVerse[] = d.verses.filter(
        (v: LoadedVerse) => v.verse >= vs && v.verse <= ve
      )
      setLoadedVerses(filtered)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  // ── Passage box: parse a typed reference ("Matthew 3:1-3") and load it ──
  function handlePassageSubmit() {
    const raw = passageInput.trim()
    if (!raw) { setPassageError(false); return }
    const parsed = parsePassageRef(raw, books)
    if (!parsed) { setPassageError(true); return }
    setPassageError(false)
    // No-op if the passage is unchanged (e.g. focusing the box and clicking away, or
    // re-typing the same reference). Reloading here would reset the current session and
    // clear its annotations, so only reload when the passage actually changes.
    const unchanged =
      selectedBook?.osisId === parsed.book.osisId &&
      chapter === parsed.chapter &&
      verseStart === parsed.verseStart &&
      verseEnd === parsed.verseEnd &&
      loadedVerses.length > 0
    if (unchanged) return
    setSelectedBook(parsed.book)
    setChapter(parsed.chapter)
    setVerseStart(parsed.verseStart)
    setVerseEnd(parsed.verseEnd)
    loadPassage(parsed.book, parsed.chapter, parsed.verseStart, parsed.verseEnd, true)
  }

  // ── Annotation change ──
  function handleAnnotationChange(key: string, field: keyof WordAnnotation, value: string) {
    if (isLocked) return
    setAnnotations(prev => {
      const next = {
        ...prev,
        [key]: { ...(prev[key] ?? { parsing: '', syntax: '', translation: '' }), [field]: value },
      }
      scheduleAutoSave(next, corrections)
      return next
    })
  }

  // ── Whole-verse translation change (Round 1) ──
  function handleVerseTranslationChange(verseNum: number, value: string) {
    if (isLocked) return
    setVerseTranslations(prev => {
      const next = { ...prev, [String(verseNum)]: value }
      scheduleAutoSave(annotations, corrections, next)
      return next
    })
  }

  // ── Round 2 whole-verse note change ──
  function handleVerseCorrectionChange(verseNum: number, value: string) {
    if (reviewTimerExpired || submitted || round2Passed) return
    setVerseCorrections(prev => {
      const next = { ...prev, [String(verseNum)]: value }
      scheduleAutoSave(annotations, corrections, verseTranslations, next)
      return next
    })
  }

  // ── Correction change (review mode) ──
  function handleCorrectionChange(key: string, field: keyof WordAnnotation, value: string) {
    if (reviewTimerExpired || submitted) return   // corrections locked
    setCorrections(prev => {
      const next = {
        ...prev,
        [key]: { ...(prev[key] ?? { parsing: '', syntax: '', translation: '' }), [field]: value },
      }
      scheduleAutoSave(annotations, next)
      return next
    })
  }

  // ── Word click ──
  function handleWordClick(word: VerseWord, verseNum: number) {
    const key = wordKey(verseNum, word.id)
    setSelectedWordKey(key)
    setSelectedWord({ word, verse: verseNum })
  }

  // ── Save session (returns sessionId) ──
  async function saveSession(): Promise<string | null> {
    if (!isAuthenticated) return null   // signed-out: nothing to save to
    if (!selectedBook || loadedVerses.length === 0) return null
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      // Standalone tool always names the session after the passage; assignment mode
      // keeps the assignment's own title.
      const passageName = `${selectedBook.name} ${chapter}:${verseStart}${verseEnd !== verseStart ? `–${verseEnd}` : ''}`
      const resolvedTitle = propAssignmentId ? (sessionTitle || passageName) : passageName
      const payload = {
        title: resolvedTitle,
        bookOsisId: selectedBook.osisId,
        bookName: selectedBook.name,
        chapter,
        verseStart,
        verseEnd,
        annotations,
        verseTranslations,
        ...(propAssignmentId ? { assignmentId: propAssignmentId } : {}),
      }
      let sid = sessionId
      if (sid) {
        await fetch(`/api/exegesis/${sid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            annotations,
            corrections,
            verseTranslations,
            verseCorrections,
            notes,
            title: resolvedTitle,
            // Persist startedAt if not yet stored (first save of a timed session)
            ...(startedAtRef.current ? { startedAt: startedAtRef.current.toISOString() } : {}),
          }),
        })
      } else {
        const r = await fetch('/api/exegesis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            // Persist the actual timer-start time so server stores the correct value
            ...(startedAtRef.current ? { startedAt: startedAtRef.current.toISOString() } : {}),
          }),
        })
        const d = await r.json()
        sid = d.session?.id ?? null
        setSessionId(sid)
      }
      setSaveStatus('saved')
      loadSessionList()
      setTimeout(() => setSaveStatus('idle'), 2500)
      return sid
    } catch {
      setSaveStatus('error')
      return null
    } finally {
      setIsSaving(false)
    }
  }

  // ── Submit assignment ──
  async function submitAssignment() {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      // Cancel any pending debounced autosave and flush ALL fields (annotations,
      // corrections, verse fields, and notes) synchronously before submitting — so
      // anything typed in the last couple of seconds isn't lost, and no late autosave
      // fires after submittedAt is set (which the server would reject).
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      let sid = await saveSession()
      if (!sid) sid = sessionId
      if (!sid) { setSubmitError('Could not save your work. Please try again.'); return }

      // If the session exists but was created without an assignmentId (e.g. via old /student/exegesis
      // path), patch it in now so the submit API can find it.
      if (propAssignmentId) {
        await fetch(`/api/exegesis/${sid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignmentId: propAssignmentId }),
        }).catch(() => {})
      }

      const r = await fetch(`/api/exegesis/${sid}/submit`, { method: 'POST' })
      if (r.ok) {
        setSubmitted(true)
      } else {
        const d = await r.json().catch(() => ({}))
        setSubmitError(d.error ?? 'Submission failed. Please try again.')
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /** Schedule a single debounced save that sends the latest annotations, corrections,
   *  and whole-verse fields together. */
  function scheduleAutoSave(
    latestAnnotations: AnnotationMap,
    latestCorrections: AnnotationMap,
    latestVerseTranslations: Record<string, string> = verseTranslations,
    latestVerseCorrections: Record<string, string> = verseCorrections,
    latestNotes: string = notes,
  ) {
    if (!isAuthenticated) return   // signed-out: don't attempt to save (no account)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setSaveStatus('pending')   // unsaved edits, autosave queued
    autoSaveTimer.current = setTimeout(() => {
      setSaveStatus('saving')
      // No session yet: in the standalone tool the first edit creates the session
      // (capturing current work). In assignment mode the session is created on entry,
      // so just skip until it exists.
      if (!sessionId) {
        if (!propAssignmentId) {
          saveSession().then(sid => setSaveStatus(sid ? 'saved' : 'error')).catch(() => setSaveStatus('error'))
        }
        return
      }
      fetch(`/api/exegesis/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotations: latestAnnotations,
          corrections: latestCorrections,
          verseTranslations: latestVerseTranslations,
          verseCorrections: latestVerseCorrections,
          notes: latestNotes,
        }),
      })
        .then(r => setSaveStatus(r.ok ? 'saved' : 'error'))
        .catch(() => setSaveStatus('error'))
    }, 2500)
  }

  // ── Load saved session ──
  async function loadSavedSession(s: SavedSession) {
    const r = await fetch(`/api/exegesis/${s.id}`)
    const d = await r.json()
    if (!d.session) return
    const sess = d.session
    // Find book
    const book = books.find(b => b.osisId === sess.bookOsisId) ?? null
    setSelectedBook(book)
    setChapter(sess.chapter)
    setVerseStart(sess.verseStart)
    setVerseEnd(sess.verseEnd)
    setPassageInput(
      `${book?.name ?? sess.bookName} ${sess.chapter}:${sess.verseStart}${sess.verseEnd !== sess.verseStart ? `-${sess.verseEnd}` : ''}`
    )
    setPassageError(false)
    setAnnotations((sess.annotations as AnnotationMap) ?? {})
    setCorrections((sess.corrections as AnnotationMap) ?? {})
    setVerseTranslations((sess.verseTranslations as Record<string, string>) ?? {})
    setVerseCorrections((sess.verseCorrections as Record<string, string>) ?? {})
    setNotes((sess.notes as string) ?? '')
    setSessionId(sess.id)
    setSessionTitle(sess.title)
    setShowSessionList(false)
    // Load passage
    if (book) {
      setIsLoading(true)
      try {
        const pr = await fetch(`/api/reader?book=${book.osisId}&chapter=${sess.chapter}`)
        const pd = await pr.json()
        const filtered: LoadedVerse[] = (pd.verses ?? []).filter(
          (v: LoadedVerse) => v.verse >= sess.verseStart && v.verse <= sess.verseEnd
        )
        setLoadedVerses(filtered)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // ── Delete session ──
  async function deleteSession(id: string) {
    await fetch(`/api/exegesis/${id}`, { method: 'DELETE' })
    if (sessionId === id) {
      setSessionId(null)
      setAnnotations({})
      setCorrections({})
      setVerseTranslations({})
      setVerseCorrections({})
      setLoadedVerses([])
    }
    loadSessionList()
  }

  // ── PDF export ──
  function exportPDF() {
    window.print()
  }

  // ── Build summary rows for print ──

  // ── Lock / mode flags ──
  // deadlinePassed locks stage-1 (black annotations) and opens review mode, but leaves stage-2 (red corrections) editable.
  // round1Passed / round2Passed are absolute, instructor-set cut-offs that lock the respective phase regardless of timers.
  const isLocked = timerExpired || submitted || deadlinePassed || round1Passed   // stage 1 annotations locked
  const correctionLocked = reviewTimerExpired || submitted || round2Passed        // stage 2 corrections locked
  const reviewMode = timerExpired || deadlinePassed || round1Passed               // show 3-column reader layout

  // Show submit button when:
  // - in assignment mode and passage is loaded
  // - AND not yet submitted
  // - AND (there is no stage 1 timer, OR stage 1 has expired)
  const showSubmitButton = !!(propAssignmentId && loadedVerses.length > 0 && !submitted &&
    (!assignment?.timeLimitSeconds || timerExpired || deadlinePassed || round1Passed))

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  const timerColor = secondsLeft !== null
    ? secondsLeft <= 60 ? 'text-red-600' : secondsLeft <= 180 ? 'text-amber-600' : 'text-brand-700'
    : ''

  const passageTitle = selectedBook && loadedVerses.length > 0
    ? `${selectedBook.name} ${chapter}:${verseStart}${verseEnd !== verseStart ? `–${verseEnd}` : ''}`
    : ''

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-0 print:block">

      {/* ── Print header (hidden on screen) ── */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-center">{sessionTitle || passageTitle}</h1>
        <p className="text-center text-sm text-gray-500">Exegesis Worksheet</p>
      </div>

      {/* ── Assignment banner ── */}
      {assignment && (
        <div className="print:hidden bg-brand-50 border-b border-brand-200 px-4 py-3 flex items-start gap-3">
          <span className="text-2xl mt-0.5">📜</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-900">{assignment.title}</p>
            {assignment.reference && (
              <p className="text-xs text-brand-700 mt-0.5">Passage: {assignment.reference}</p>
            )}
            {assignment.instructions && (
              <p className="text-xs text-gray-600 mt-0.5">{assignment.instructions}</p>
            )}
            {(assignment.round1Deadline || assignment.round2Deadline) && (
              <div className="mt-1.5 flex flex-col gap-0.5">
                {assignment.round1Deadline && (
                  <DeadlineLine label="Round 1 (annotations) closes" date={assignment.round1Deadline} passed={round1Passed} />
                )}
                {assignment.round2Deadline && (
                  <DeadlineLine label="Round 2 (corrections) closes" date={assignment.round2Deadline} passed={round2Passed} />
                )}
              </div>
            )}
          </div>
          {submitted && (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
              ✓ Submitted
            </span>
          )}
          {!submitted && deadlinePassed && (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
              Deadline passed — editing only
            </span>
          )}
        </div>
      )}

      {/* ── Notes & Questions — live scratchpad across Round 1 & 2, locked at submit ── */}
      {assignment && loadedVerses.length > 0 && (
        <div className="print:hidden border-b border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => setNotesOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-2 text-left"
          >
            <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              📝 Notes &amp; Questions
              {notes.trim() && <span className="text-xs font-normal text-gray-500">· {notes.trim().length} chars</span>}
            </span>
            <span className="text-xs text-brand-600">{notesOpen ? 'Hide' : 'Show'}</span>
          </button>
          {notesOpen && (
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-500 mb-1.5">
                Jot down your thoughts and any questions for your instructor as you work through Round 1 and Round 2.
                Saved automatically{submitted ? '' : ' and editable until you submit'}.
                {submitted && ' This is now locked because you have submitted.'}
              </p>
              <textarea
                value={notes}
                onChange={e => {
                  const next = e.target.value
                  setNotes(next)
                  scheduleAutoSave(annotations, corrections, verseTranslations, verseCorrections, next)
                }}
                disabled={submitted}
                rows={4}
                placeholder="e.g. Unsure whether this participle is causal or temporal — want to ask in class…"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="print:hidden bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-end gap-3">

        {/* Passage box — hidden in assignment mode (passage is fixed) */}
        {!propAssignmentId && (
          <>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-500 font-medium">Passage</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={passageInput}
                  onChange={e => { setPassageInput(e.target.value); if (passageError) setPassageError(false) }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
                  onBlur={handlePassageSubmit}
                  placeholder="e.g. Matthew 3:1-3"
                  className={`border rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 ${passageError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-brand-400'}`}
                />
                {isLoading && <span className="text-sm text-gray-400">Loading…</span>}
                {selectedBook && loadedVerses.length > 0 && (
                  <a
                    href={`/reader?ref=${encodeURIComponent(`${selectedBook.name} ${chapter}:${verseStart}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open this passage in the Reader (new tab)"
                    className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 hover:underline whitespace-nowrap"
                  >
                    Open in Reader
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
              {passageError && (
                <span className="text-xs text-red-500">Couldn&rsquo;t find that reference — try e.g. &ldquo;John 1:1-5&rdquo;</span>
              )}
            </div>
          </>
        )}

        {/* In assignment mode: show passage label */}
        {propAssignmentId && passageTitle && (
          <span className="self-end text-sm font-medium text-gray-700">{passageTitle}</span>
        )}

        <div className="flex-1" />

        {/* ── Stage 1 Countdown timer ── */}
        {secondsLeft !== null && !submitted && !timerExpired && (
          <div className={`self-end flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-semibold
            ${secondsLeft <= 60
              ? 'bg-red-50 border-red-200 animate-pulse text-red-600'
              : secondsLeft <= 180
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-brand-50 border-brand-200 text-brand-700'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-normal mr-0.5 opacity-70">Stage 1</span>
            {formatTime(secondsLeft)}
          </div>
        )}

        {/* ── Stage 2 Review timer ── */}
        {reviewMode && !submitted && (
          <div className={`self-end flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-semibold
            ${reviewTimerExpired
              ? 'bg-red-100 border-red-300 text-red-700'
              : reviewSecondsLeft !== null && reviewSecondsLeft <= 60
                ? 'bg-red-50 border-red-200 animate-pulse text-red-600'
                : reviewSecondsLeft !== null && reviewSecondsLeft <= 180
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-xs font-normal mr-0.5 opacity-70">Review</span>
            {reviewTimerExpired
              ? 'Locked'
              : reviewSecondsLeft !== null
                ? formatTime(reviewSecondsLeft)
                : 'Open'}
          </div>
        )}


        {/* Both the translation exercise and the standalone Reader→Exegesis tool
            autosave continuously, so show a passive status instead of a Save button.
            Signed-out visitors can annotate but can't save — prompt them to sign in. */}
        {loadedVerses.length > 0 && !isAuthenticated && (
          <Link
            href={`/auth/sign-in?redirect=${encodeURIComponent('/exegesis')}`}
            className="self-end inline-flex items-center gap-1.5 px-2 py-1.5 text-sm text-brand-600 hover:text-brand-800 hover:underline"
          >
            🔒 Sign in to save your work
          </Link>
        )}
        {loadedVerses.length > 0 && isAuthenticated && (
          <span className="self-end inline-flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-500">
            {saveStatus === 'saving' || isSaving ? (
              <><svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Saving…</>
            ) : saveStatus === 'pending' ? (
              <span className="text-gray-400">Unsaved changes…</span>
            ) : saveStatus === 'error' ? (
              <span className="text-red-600">Couldn&rsquo;t save — check your connection</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600">✓ All changes saved</span>
            )}
          </span>
        )}

        {loadedVerses.length > 0 && (
          <button
            onClick={exportPDF}
            className="self-end flex items-center gap-1.5 px-4 py-1.5 bg-gray-700 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download as PDF
          </button>
        )}

        {/* Submit assignment button — visible in review phase or when untimed */}
        {showSubmitButton && (
          <div className="self-end flex flex-col items-end gap-1">
            <button
              onClick={submitAssignment}
              disabled={isSubmitting || isSaving || correctionLocked}
              className="flex items-center gap-1.5 px-5 py-1.5 bg-brand-600 text-white rounded-md text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isSubmitting ? 'Submitting…' : 'Submit for Grading'}
            </button>
            {submitError && (
              <p className="text-xs text-red-600 max-w-xs text-right">{submitError}</p>
            )}
          </div>
        )}
        {propAssignmentId && submitted && (
          <button
            onClick={() => router.push('/student/assignments')}
            className="self-end px-4 py-1.5 border border-brand-300 text-brand-700 rounded-md text-sm font-medium hover:bg-brand-50 transition"
          >
            ← Back to Assignments
          </button>
        )}

        {/* Saved sessions — pinned to the far right so it stays put whether or not a
            passage is loaded. Hidden in assignment mode. */}
        {!propAssignmentId && (
          <div className="relative" ref={sessionListRef}>
            <button
              onClick={() => { loadSessionList(); setShowSessionList(v => !v) }}
              className="self-end px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 transition"
            >
              📂 My Sessions
            </button>
            {showSessionList && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-80 max-h-80 overflow-y-auto">
                {savedSessions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">No saved sessions yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {savedSessions.map(s => (
                      <li key={s.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                        <button
                          onClick={() => loadSavedSession(s)}
                          className="text-left flex-1 min-w-0"
                        >
                          <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                          <p className="text-xs text-gray-400">{new Date(s.updatedAt).toLocaleDateString()}</p>
                        </button>
                        <button
                          onClick={() => deleteSession(s.id)}
                          className="ml-2 text-red-400 hover:text-red-600 text-xs p-1"
                          title="Delete session"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Main workspace ── */}
      {loadedVerses.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 print:hidden">
          <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {propAssignmentId ? (
            <>
              <p className="text-lg font-medium">Loading your passage…</p>
              <p className="text-sm mt-1">If the passage doesn&apos;t appear, try refreshing the page.</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">Select a book, chapter, and verses above</p>
              <p className="text-sm mt-1">The passage loads automatically — then click any Greek word to begin annotating</p>
            </>
          )}
        </div>
      )}

      {loadedVerses.length > 0 && (
        <div className="flex gap-0 print:block min-h-0 flex-col lg:flex-row">

          {/* ── Greek text pane ── */}
          <div className="overflow-y-auto p-4 lg:p-6 print:overflow-visible flex-1">

            {/* Print: passage header */}
            <div className="hidden print:block mb-4">
              <h2 className="text-xl font-semibold">{passageTitle}</h2>
            </div>

            {/* Review mode banner */}
            {reviewMode && !correctionLocked && (
              <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 font-medium">
                ✏️ Review phase — click any word to compare your analysis and add corrections in red.
              </div>
            )}
            {correctionLocked && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800 font-medium">
                🔒 Review phase ended — all annotations are locked. Download your PDF or submit for grading.
              </div>
            )}

            {loadedVerses.map(v => (
              <div key={v.id} className="mb-6 print:mb-4 lg:grid lg:grid-cols-[1fr_24rem] lg:gap-6 lg:items-start print:block">
                {/* Left column: the Greek text + whole-verse boxes */}
                <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium mb-2 print:mb-1">{v.reference}</p>
                <div className="flex flex-wrap gap-1.5 leading-loose">
                  {v.words.map(w => {
                    const key = wordKey(v.verse, w.id)
                    const hasAnn = annotations[key] &&
                      (annotations[key].parsing || annotations[key].syntax || annotations[key].translation)
                    const hasCorr = corrections[key] &&
                      (corrections[key].parsing || corrections[key].syntax || corrections[key].translation)
                    const isSelected = selectedWordKey === key
                    return (
                      <button
                        key={w.id}
                        data-greek-word
                        onClick={() => handleWordClick(w, v.verse)}
                        className={[
                          'px-1.5 py-0.5 rounded font-greek transition print:cursor-default print:border-b print:border-dotted print:border-gray-400',
                          reviewMode ? 'text-lg' : 'text-xl',
                          isSelected
                            ? 'bg-brand-100 text-brand-800 ring-2 ring-brand-400 print:bg-transparent print:ring-0'
                            : hasCorr
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 print:bg-transparent'
                              : hasAnn
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 print:bg-transparent'
                                : 'text-gray-800 hover:bg-gray-100 print:text-black',
                        ].join(' ')}
                      >
                        {w.surface}
                      </button>
                    )
                  })}
                </div>

                {/* Whole-verse translation (Round 1) */}
                <div className="mt-2">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Verse Translation
                  </label>
                  <textarea
                    value={verseTranslations[String(v.verse)] ?? ''}
                    onChange={e => handleVerseTranslationChange(v.verse, e.target.value)}
                    disabled={isLocked}
                    rows={2}
                    placeholder={isLocked ? '' : 'Write your translation of this whole verse…'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed print:border-gray-300"
                  />
                </div>

                {/* Round 2 Notes — only shown after Round 1 ends */}
                {reviewMode && (
                  <div className="mt-2">
                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1 ${correctionLocked ? 'text-gray-400' : 'text-red-500'}`}>
                      Round 2 Notes{correctionLocked ? ' (locked)' : ''}
                    </label>
                    <textarea
                      value={verseCorrections[String(v.verse)] ?? ''}
                      onChange={e => handleVerseCorrectionChange(v.verse, e.target.value)}
                      disabled={correctionLocked}
                      rows={2}
                      placeholder={correctionLocked ? '' : 'Add notes or a revised translation for this verse…'}
                      className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        correctionLocked
                          ? 'border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                          : 'border-2 border-red-300 bg-red-50 text-red-700 placeholder-red-300 focus:ring-red-400'
                      } print:border-gray-300`}
                    />
                  </div>
                )}

                {/* Print only: this verse's word analysis, listed directly under the
                    verse (parsing / syntax / translation, with Round 2 corrections in red). */}
                {(() => {
                  const wordHas = (w: VerseWord) => {
                    const key = wordKey(v.verse, w.id)
                    const ann = annotations[key]
                    const corr = corrections[key]
                    return Boolean(ann?.parsing || ann?.syntax || ann?.translation || corr?.parsing || corr?.syntax || corr?.translation)
                  }
                  const rows = v.words.filter(wordHas)
                  if (rows.length === 0) return null
                  return (
                    <table className="hidden print:table w-full border-collapse text-sm mt-2">
                      <thead>
                        <tr className="border-b border-gray-400">
                          <th className="text-left py-0.5 pr-2 font-semibold font-greek">Word</th>
                          <th className="text-left py-0.5 pr-2 font-semibold">Parsing</th>
                          <th className="text-left py-0.5 pr-2 font-semibold">Syntax</th>
                          <th className="text-left py-0.5 font-semibold">Observations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(w => {
                          const key = wordKey(v.verse, w.id)
                          const ann = annotations[key] ?? { parsing: '', syntax: '', translation: '' }
                          const corr = corrections[key]
                          return (
                            <tr key={w.id} className="align-top">
                              <td className="py-0.5 pr-2 font-greek">{w.surface}</td>
                              <td className="py-0.5 pr-2 text-xs">{ann.parsing}{corr?.parsing && <span className="text-red-600 font-medium"> → {corr.parsing}</span>}</td>
                              <td className="py-0.5 pr-2 text-xs">{ann.syntax}{corr?.syntax && <span className="text-red-600 font-medium"> → {corr.syntax}</span>}</td>
                              <td className="py-0.5 text-xs">{ann.translation}{corr?.translation && <span className="text-red-600 font-medium"> → {corr.translation}</span>}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )
                })()}
                </div>{/* end left column */}

                {/* Right column: the parsing / syntax / translation boxes for the
                    selected word, opening level with this verse's row. On mobile
                    (no grid) it stacks directly beneath the verse. */}
                <div className="min-w-0 print:hidden">
                  {selectedWord && selectedWord.verse === v.verse && (
                    <div ref={wordPanelRef}>
                    {reviewMode ? (
                      <Round2WordPopover
                        word={selectedWord.word}
                        verseNum={selectedWord.verse}
                        original={(annotations[wordKey(selectedWord.verse, selectedWord.word.id)] ?? { parsing: '', syntax: '', translation: '' }) as WordAnnotation}
                        correction={(corrections[wordKey(selectedWord.verse, selectedWord.word.id)] ?? { parsing: '', syntax: '', translation: '' }) as WordAnnotation}
                        locked={correctionLocked}
                        showReader={!!assignment?.allowReaderInRound2}
                        onCorrection={handleCorrectionChange}
                        onClose={() => { setSelectedWord(null); setSelectedWordKey(null) }}
                      />
                    ) : (
                      <div className="mt-2 lg:mt-0 rounded-lg border border-brand-200 bg-brand-50/60 p-3 lg:sticky lg:top-2">
                        <AnnotationPanel
                          word={selectedWord.word}
                          verseNum={selectedWord.verse}
                          annotations={annotations}
                          onChange={handleAnnotationChange}
                          locked={isLocked}
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => { setSelectedWord(null); setSelectedWordKey(null) }}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* The Round 1 annotation panel now lives in each verse's right column
              (aligned with the verse). Save-as-PDF and Submit are in the toolbar above. */}
          {/* Round 2 NOTE: the secondary review passage panel was removed —
              students now see one passage with an inline per-word popover. */}

          {/* Per-verse analysis is printed under each verse above (no end-of-passage table). */}

        </div>
      )}
    </div>
  )
}
