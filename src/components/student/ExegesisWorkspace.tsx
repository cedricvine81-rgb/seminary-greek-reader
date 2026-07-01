'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BiblicalBook, VerseWord } from '@/types/biblical-text'
import { buildParsingLabel } from '@/lib/parsing'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { saveLocalDraft, markLocalDraftSynced, readLocalDraft, clearLocalDraft } from '@/lib/exam-draft'
import { MIN_LOCKDOWN_AUTOSUBMIT } from '@/lib/constants'

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

export interface SavedSession {
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
  glossFrequency: number | null           // show a glossary of words less frequent than this; null = off
  isExam: boolean                         // TRANSLATION_EXAM: multiple passages, single round, hard cut-off
  examPassages: { book: BiblicalBook; chapter: number; verseStart: number; verseEnd: number }[]
  lockdown: boolean                       // exam integrity mode: fullscreen + tab-switch detection + paste block
  lockdownMaxViolations: number | null    // auto-submit after this many violations; null = warn only
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
    <span className={`inline-flex items-center gap-1.5 text-sm ${passed ? 'text-gray-400' : 'text-gray-700'}`}>
      <span className="font-medium">{label}:</span>
      <span className={passed ? 'line-through' : ''}>{formatDeadline(date)}</span>
      {passed && <span className="font-semibold text-gray-500">· Closed</span>}
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
            {field === 'parsing' ? 'Parsing' : field === 'syntax' ? 'Syntax / Function' : 'Translation'}
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
    { field: 'translation', label: 'Translation' },
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

// PDF/print: field order + labels for the Round 1 / Round 2 word table.
const PRINT_ANN_FIELDS = ['parsing', 'syntax', 'translation'] as const
type PrintAnnField = typeof PRINT_ANN_FIELDS[number]
const PRINT_ANN_LABELS: Record<PrintAnnField, string> = { parsing: 'Parse', syntax: 'Syntax', translation: 'Trans.' }

// ── Fullscreen helpers (with WebKit fallback for older Safari) ──────────────────
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
type FsDocument = Document & { webkitFullscreenElement?: Element | null }
/** True when the browser can put a page element into fullscreen (false on iPhone Safari). */
function fullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false
  const el = document.documentElement as FsElement
  return !!(el.requestFullscreen || el.webkitRequestFullscreen)
}
function requestFullscreenCompat(el: HTMLElement): Promise<void> {
  const e = el as FsElement
  if (e.requestFullscreen) return e.requestFullscreen()
  if (e.webkitRequestFullscreen) return Promise.resolve(e.webkitRequestFullscreen())
  return Promise.reject(new Error('no fullscreen'))
}
/** The current fullscreen element across standard + WebKit-prefixed APIs. */
function fullscreenElementCompat(): Element | null {
  const d = document as FsDocument
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null
}
/** Leave fullscreen if currently in it (standard + WebKit), swallowing any error. */
function exitFullscreenCompat(): void {
  try {
    const d = document as Document & { webkitExitFullscreen?: () => void }
    if (fullscreenElementCompat()) {
      if (d.exitFullscreen) void d.exitFullscreen()
      else if (d.webkitExitFullscreen) d.webkitExitFullscreen()
    }
  } catch { /* ignore */ }
}

// Student-facing wording for each integrity event type (shown in the live warning).
const VIOLATION_MESSAGES: Record<string, string> = {
  'tab-hidden': 'You switched away from the exam tab',
  'window-blur': 'You left the exam window',
  'fullscreen-exit': 'You exited fullscreen',
  'copy': 'Copying is disabled in this exam',
  'paste': 'Pasting is disabled in this exam',
  'contextmenu': 'The right-click menu is disabled in this exam',
}

// ─── Main Component ───────────────────────────────────────────────────────────

// Imperative actions exposed to a parent that has hoisted the "My Sessions" /
// "Download as PDF" UI elsewhere (see ExegesisTabs' three-dot tools menu).
export interface ExegesisWorkspaceHandle {
  loadSavedSession: (s: SavedSession) => void
  deleteSession: (id: string) => void
  exportPDF: () => void
}

export const ExegesisWorkspace = forwardRef<ExegesisWorkspaceHandle, {
  assignmentId?: string
  isAuthenticated?: boolean
  previewMode?: boolean
  controlledPassage?: string
  glossPref?: number | null
  onGlossPref?: (v: number | null) => void
  savedSessions?: SavedSession[]
  onSavedSessions?: (s: SavedSession[]) => void
}>(function ExegesisWorkspace({
  assignmentId: propAssignmentId, isAuthenticated = true, previewMode = false, controlledPassage,
  glossPref: controlledGloss, onGlossPref, savedSessions: controlledSessions, onSavedSessions,
}, ref) {
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
  // Per-verse personal notes (free-study only — kept out of graded assignments/exams).
  const [notedVerses, setNotedVerses] = useState<Set<number>>(new Set())
  const notesEnabled = isAuthenticated && !propAssignmentId
  const refreshNotes = useCallback(async () => {
    if (!notesEnabled || !selectedBook || loadedVerses.length === 0) { setNotedVerses(new Set()); return }
    try {
      const r = await fetch(`/api/notes?book=${selectedBook.osisId}&chapter=${chapter}&verseStart=${verseStart}&verseEnd=${verseEnd}`)
      const d = await r.json()
      setNotedVerses(new Set((d.notes ?? []).map((n: { verse: number }) => n.verse)))
    } catch { /* ignore */ }
  }, [notesEnabled, selectedBook, chapter, verseStart, verseEnd, loadedVerses.length])
  useEffect(() => { refreshNotes() }, [refreshNotes])

  // ── Annotation state ──
  const [annotations, setAnnotations] = useState<AnnotationMap>({})
  const [corrections, setCorrections] = useState<AnnotationMap>({})
  // Round 1 whole-verse translations, keyed by verse number (as string)
  const [verseTranslations, setVerseTranslations] = useState<Record<string, string>>({})
  // Round 2 whole-verse notes/corrections, keyed by verse number (as string)
  const [verseCorrections, setVerseCorrections] = useState<Record<string, string>>({})
  // Free-form "Notes & Questions" scratchpad — live across Round 1 & 2, locked at submit
  const [notes, setNotes] = useState('')
  // Student-chosen glossary threshold (standalone study): show definitions for words
  // less frequent than N× in the NT. null = off. An instructor-set glossFrequency wins.
  // On the coordinated exegesis page the control lives in the shared header, so the
  // value can be driven from the parent (onGlossPref present = controlled).
  const isGlossControlled = onGlossPref !== undefined
  const [internalGloss, setInternalGloss] = useState<number | null>(null)
  const glossPref = isGlossControlled ? (controlledGloss ?? null) : internalGloss
  const setGlossPref = onGlossPref ?? setInternalGloss
  const [selectedWordKey, setSelectedWordKey] = useState<string | null>(null)
  const [selectedWord, setSelectedWord] = useState<{ word: VerseWord; verse: number } | null>(null)
  const wordPanelRef = useRef<HTMLDivElement | null>(null)

  // ── Session persistence ──
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  // "My Sessions" data is controlled the same way as glossPref when a parent (the
  // coordinated exegesis page) has hoisted the list into its own tools menu.
  const isSessionsControlled = onSavedSessions !== undefined
  const [internalSessions, setInternalSessions] = useState<SavedSession[]>([])
  const savedSessions = isSessionsControlled ? (controlledSessions ?? []) : internalSessions
  const setSavedSessions = onSavedSessions ?? setInternalSessions
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle')
  const [showSessionList, setShowSessionList] = useState(false)
  const sessionListRef = useRef<HTMLDivElement | null>(null)
  const sessionPanelRef = useRef<HTMLDivElement | null>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Mirrors the latest annotation/translation/notes state so a page-unload handler
  // (registered once, with an empty dependency array) can read current values instead
  // of a stale closure. Updated by an effect below, right after each of those states.
  const latestFieldsRef = useRef({ annotations: {} as AnnotationMap, corrections: {} as AnnotationMap, verseTranslations: {} as Record<string, string>, verseCorrections: {} as Record<string, string>, notes: '', sessionId: null as string | null })
  // Set when an edit arrives before the session row exists yet (assignment mode creates
  // it async on entry) — scheduleAutoSave bails in that case since there's nothing to
  // PATCH. Once the session shows up, flush whatever was pending instead of losing it.
  const hasUnflushedEditRef = useRef(false)
  useEffect(() => {
    latestFieldsRef.current = { annotations, corrections, verseTranslations, verseCorrections, notes, sessionId }
  }, [annotations, corrections, verseTranslations, verseCorrections, notes, sessionId])

  // ── Answer-timing telemetry (exam integrity signal) ──
  // Per-answer typing record keyed by "verseNum-wordId:field" (or "vt:key" for whole-verse
  // translations): t0 = ms from exam start to the first keystroke in that field,
  // tLast = ms to the last keystroke, edits = number of keystroke events. Lets the
  // instructor spot answers that appeared near-instantly or in a single action (a possible
  // sign of pasted/auto-filled AI output). Hydrated from the server on load, persisted
  // alongside annotations on every save. A ref so it never triggers a re-render.
  const timingsRef = useRef<Record<string, { t0: number; tLast: number; edits: number }>>({})
  const firstEditMsRef = useRef<number | null>(null)
  // Offline restore guard — only adopt a recovered local draft once per session.
  const didRestoreLocalRef = useRef(false)

  // ── Assignment mode ──
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [deadlinePassed, setDeadlinePassed] = useState(false)
  const [submitError, setSubmitError] = useState('')
  // Set when the instructor has reopened this submission. While true and not yet
  // resubmitted, the passed exam deadline no longer locks or auto-submits the work,
  // so the student can edit and resubmit.
  const [reopenedAt, setReopenedAt] = useState<string | null>(null)
  // Re-entrancy guard: the deadline-cutoff and round1-passed effects can both fire on the
  // same tick, and a double-click can too — this ensures only one submit runs at a time.
  const submittingRef = useRef(false)
  // Set right before we programmatically leave fullscreen on submit, so the
  // fullscreenchange handler doesn't log that as a violation or flash the re-entry overlay.
  const suppressFsExitRef = useRef(false)

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
  // Instructor reopened this submission: until the student resubmits, a passed deadline
  // must not lock or auto-submit their work.
  const reopened = !!reopenedAt && !submitted

  // ── Lockdown (exam integrity) state ──
  const [lockdownStarted, setLockdownStarted] = useState(false)  // student has entered fullscreen / begun
  const [fullscreenLost, setFullscreenLost] = useState(false)    // exited fullscreen mid-exam → re-entry overlay
  const [violations, setViolations] = useState(0)
  const [lastViolation, setLastViolation] = useState<string | null>(null)
  const violationsRef = useRef(0)        // mirror for event handlers (avoid stale closures)
  const lastViolationAtRef = useRef(0)   // coalesce co-firing events (e.g. blur + visibilitychange)
  const submitRef = useRef<() => void>(() => {})
  // Transient on-screen warning shown to the student each time a violation is recorded.
  const [violationWarning, setViolationWarning] = useState<string | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Pre-exam rules acknowledgment: the student must tick the box before entering, and the
  // acknowledgment is logged (append-only) so there's a permanent record they agreed.
  const [rulesAck, setRulesAck] = useState(false)
  const ackAtRef = useRef<string | null>(null)
  const ackSentRef = useRef(false)
  // Viewport width (for blocking phone-sized screens from a lockdown exam).
  const [viewportW, setViewportW] = useState(1200)
  useEffect(() => {
    const f = () => setViewportW(window.innerWidth)
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

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
    // In coordinated mode the shared passage box drives loading, so don't auto-restore.
    if (propAssignmentId || controlledPassage !== undefined || !isAuthenticated || books.length === 0 || didRestoreRef.current) return
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
        const isExam = a.type === 'TRANSLATION_EXAM'
        // Exams store several references (one per line); parse them all to passages.
        const examPassages = isExam && a.reference
          ? (a.reference as string).split('\n').map((line: string) => line.trim()).filter(Boolean)
              .map((line: string) => parsePassageRef(line, books)).filter((p): p is NonNullable<typeof p> => !!p)
          : []
        const assignmentInfo: AssignmentInfo = {
          id: a.id, title: a.title, reference: a.reference ?? null,
          instructions: a.instructions ?? null, timeLimitSeconds, reviewTimeLimitSeconds,
          submissionDeadline: a.submissionDeadline ? new Date(a.submissionDeadline) : null,
          round1Deadline: a.round1Deadline ? new Date(a.round1Deadline) : null,
          round2Deadline: a.round2Deadline ? new Date(a.round2Deadline) : null,
          allowReaderInRound2: !!a.allowReaderInRound2,
          glossFrequency: a.glossFrequency ?? null,
          isExam,
          examPassages,
          lockdown: !!a.lockdown,
          lockdownMaxViolations: a.lockdownMaxViolations ?? null,
        }
        if (assignmentInfo.submissionDeadline && new Date() > assignmentInfo.submissionDeadline) {
          setDeadlinePassed(true)
        }
        setAssignment(assignmentInfo)

        // ── Exam mode: load all passages into one session, single round ──
        if (isExam) {
          // Nominal session coords = the first passage, so saveSession (which requires a
          // selected book) works; annotations/translations span all passages by word/verse id.
          if (examPassages[0]) {
            setSelectedBook(examPassages[0].book)
            setChapter(examPassages[0].chapter)
            setVerseStart(examPassages[0].verseStart)
            setVerseEnd(examPassages[0].verseEnd)
          }
          // Load the verses for every passage and concatenate them (word ids are
          // globally unique, so one annotations map covers all passages).
          setIsLoading(true)
          try {
            const all: LoadedVerse[] = []
            for (const p of examPassages) {
              const pr = await fetch(`/api/reader?book=${p.book.osisId}&chapter=${p.chapter}`)
              const pd = await pr.json()
              for (const v of (pd.verses ?? []) as LoadedVerse[]) {
                if (v.verse >= p.verseStart && v.verse <= p.verseEnd) all.push(v)
              }
            }
            setLoadedVerses(all)
          } finally { setIsLoading(false) }

          // Resume the single exam session, or create it now if none exists. Creating
          // on entry (like translation exercises do) is what makes autosave work and lets
          // the session resume if the student navigates away and back — otherwise nothing
          // is persisted until submit, so a reload looks like the exam "restarted".
          const sr = await fetch(`/api/exegesis?assignmentId=${propAssignmentId}`)
          const sd = await sr.json()
          if (sd.session) {
            const sess = sd.session
            setAnnotations(sess.annotations ?? {})
            setVerseTranslations(sess.verseTranslations ?? {})
            setNotes(sess.notes ?? '')
            timingsRef.current = sess.answerTimings ?? {}
            setReopenedAt(sess.reopenedAt ?? null)
            // Anchor timing telemetry to the original exam start, so first-keystroke
            // latency stays consistent if the student reloads mid-exam.
            if (sess.startedAt) startedAtRef.current = new Date(sess.startedAt)
            setSessionId(sess.id)
            setSessionTitle(sess.title)
            if (sess.submittedAt) { setSubmitted(true); clearLocalDraft(sess.id) }
          } else if (examPassages[0]) {
            const first = examPassages[0]
            const startedAt = new Date()
            startedAtRef.current = startedAt
            try {
              const cr = await fetch('/api/exegesis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: a.title,
                  bookOsisId: first.book.osisId, bookName: first.book.name,
                  chapter: first.chapter, verseStart: first.verseStart, verseEnd: first.verseEnd,
                  annotations: {}, assignmentId: propAssignmentId, startedAt: startedAt.toISOString(),
                }),
              })
              const cd = await cr.json()
              if (cd.session?.id) setSessionId(cd.session.id)
              else if (cr.status === 409 && cd.sessionId) setSessionId(cd.sessionId)
            } catch { /* will retry on first autosave */ }
            setSessionTitle(a.title)
          }
          return
        }

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
          timingsRef.current = sess.answerTimings ?? {}
          setReopenedAt(sess.reopenedAt ?? null)
          setSessionId(sess.id)
          setSessionTitle(sess.title)
          const alreadySubmitted = !!sess.submittedAt
          if (alreadySubmitted) { setSubmitted(true); clearLocalDraft(sess.id) }
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
            fetch(`/api/reader?book=${book.osisId}&chapter=${sess.chapter}${propAssignmentId ? '' : '&corpus=NA1904'}`)
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
                        fetch(`/api/reader?book=${book.osisId}&chapter=${sess.chapter}${propAssignmentId ? '' : '&corpus=NA1904'}`)
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
              fetch(`/api/reader?book=${parsed.book.osisId}&chapter=${parsed.chapter}${propAssignmentId ? '' : '&corpus=NA1904'}`)
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

  // Keep the "My Sessions" dropdown on-screen. It's right-anchored to its button, but
  // when the button wraps to the left on narrow screens the panel would extend off the
  // left edge (and get clipped by the page's overflow-hidden). Measure after open and
  // nudge it back inside the viewport.
  useLayoutEffect(() => {
    if (!showSessionList) return
    const clamp = () => {
      const panel = sessionPanelRef.current
      if (!panel) return
      panel.style.transform = 'none'
      const r = panel.getBoundingClientRect()
      const margin = 8
      let shift = 0
      if (r.left < margin) shift = margin - r.left
      else if (r.right > window.innerWidth - margin) shift = (window.innerWidth - margin) - r.right
      if (shift) panel.style.transform = `translateX(${Math.round(shift)}px)`
    }
    clamp()
    window.addEventListener('resize', clamp)
    return () => window.removeEventListener('resize', clamp)
  }, [showSessionList])

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

  // ── Exam: auto-submit when the single cut-off passes ──
  useEffect(() => {
    if (!assignment?.isExam || submitted || !sessionId || reopened) return
    const cutoff = assignment.round1Deadline
    if (cutoff && Date.now() > cutoff.getTime()) {
      submitAssignment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment, submitted, sessionId, now, reopened])

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
      submitAssignment({ auto: true })
    }
  }, [reviewTimerExpired]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Exam: lock + auto-submit when the single cut-off passes ──
  useEffect(() => {
    if (assignment?.isExam && round1Passed && !submitted && propAssignmentId && sessionId && !reopened) {
      submitAssignment()
    }
  }, [round1Passed, submitted, sessionId, assignment]) // eslint-disable-line react-hooks/exhaustive-deps

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
      const r = await fetch(`/api/reader?book=${book.osisId}&chapter=${chap}${propAssignmentId ? '' : '&corpus=NA1904'}`)
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

  // Coordinated mode: a shared passage box (in ExegesisTabs) drives the workspace.
  // When the controlled passage changes, load it (standalone study page only).
  useEffect(() => {
    if (controlledPassage === undefined || propAssignmentId || books.length === 0) return
    const raw = controlledPassage.trim()
    if (!raw) return
    const parsed = parsePassageRef(raw, books)
    if (!parsed) return
    const unchanged =
      selectedBook?.osisId === parsed.book.osisId && chapter === parsed.chapter &&
      verseStart === parsed.verseStart && verseEnd === parsed.verseEnd && loadedVerses.length > 0
    if (unchanged) return
    setPassageInput(raw)
    setSelectedBook(parsed.book); setChapter(parsed.chapter)
    setVerseStart(parsed.verseStart); setVerseEnd(parsed.verseEnd)
    loadPassage(parsed.book, parsed.chapter, parsed.verseStart, parsed.verseEnd, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledPassage, books])

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

  // ── Answer-timing telemetry ──
  // Record a keystroke against an answer field, measured from the exam's start. Only in
  // graded assignment/exam mode; standalone study isn't timed.
  function recordTiming(timingKey: string) {
    if (!propAssignmentId) return
    let base = startedAtRef.current?.getTime()
    if (base == null) {
      if (firstEditMsRef.current == null) firstEditMsRef.current = Date.now()
      base = firstEditMsRef.current
    }
    const rel = Math.max(0, Date.now() - base)
    const cur = timingsRef.current[timingKey]
    if (!cur) timingsRef.current[timingKey] = { t0: rel, tLast: rel, edits: 1 }
    else { cur.tLast = rel; cur.edits += 1 }
  }

  // ── Annotation change ──
  function handleAnnotationChange(key: string, field: keyof WordAnnotation, value: string) {
    if (isLocked) return
    recordTiming(`${key}:${field}`)
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
  function handleVerseTranslationChange(key: string, value: string) {
    if (isLocked) return
    recordTiming(`vt:${key}`)
    setVerseTranslations(prev => {
      const next = { ...prev, [key]: value }
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
            answerTimings: timingsRef.current,
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
            answerTimings: timingsRef.current,
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
  async function submitAssignment(opts?: { auto?: boolean }) {
    // Translation exercises require a written "Areas for Improvement" reflection before
    // grading — but only on a manual submit. Automatic deadline/timer submission must
    // never be blocked, or the student would lose their work at the cut-off.
    if (!opts?.auto && !isExam && !notes.trim()) {
      setSubmitError('Please complete “Areas for Improvement” before submitting for grading.')
      return
    }
    if (submittingRef.current || submitted) return   // already submitting/submitted — don't double-fire
    submittingRef.current = true
    setIsSubmitting(true)
    setSubmitError('')
    try {
      // Cancel any pending debounced autosave and flush ALL fields (annotations,
      // corrections, verse fields, and notes) synchronously before submitting — so
      // anything typed in the last couple of seconds isn't lost, and no late autosave
      // fires after submittedAt is set (which the server would reject).
      if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null }
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
        clearLocalDraft(sid)   // work is committed server-side — drop the offline draft
        // Close the exam once it's submitted (manual, timer, deadline, or violation):
        // leave the locked fullscreen view and return the student to their assignments.
        if (isExam) {
          suppressFsExitRef.current = true   // our own exit — don't flag it as a violation
          exitFullscreenCompat()
          router.push('/student/assignments')
        }
      } else {
        const d = await r.json().catch(() => ({}))
        setSubmitError(d.error ?? 'Submission failed. Please try again.')
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
      submittingRef.current = false
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
    // Offline safety net: mirror this edit to localStorage *synchronously*, before the
    // 2.5s debounce, so a crash/reload/disconnect can't lose it. The debounced server
    // save below confirms it (markLocalDraftSynced) once it lands. Scoped to graded
    // assignment/exam mode (propAssignmentId): those sessions are cleared on submit, so
    // drafts can't accumulate in localStorage the way unbounded free-study ones would.
    let draftVersion = 0
    if (sessionId && propAssignmentId) {
      draftVersion = saveLocalDraft(sessionId, {
        annotations: latestAnnotations, corrections: latestCorrections,
        verseTranslations: latestVerseTranslations, verseCorrections: latestVerseCorrections,
        notes: latestNotes, answerTimings: timingsRef.current,
      })
    }
    autoSaveTimer.current = setTimeout(() => {
      setSaveStatus('saving')
      // No session yet: in the standalone tool the first edit creates the session
      // (capturing current work). In assignment mode the session is created on entry,
      // so just skip until it exists — but remember the edit so the effect below can
      // flush it the moment the session shows up, instead of silently dropping it.
      if (!sessionId) {
        if (!propAssignmentId) {
          saveSession().then(sid => setSaveStatus(sid ? 'saved' : 'error')).catch(() => setSaveStatus('error'))
        } else {
          hasUnflushedEditRef.current = true
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
          answerTimings: timingsRef.current,
        }),
      })
        .then(r => {
          if (r.ok && sessionId) markLocalDraftSynced(sessionId, draftVersion)
          setSaveStatus(r.ok ? 'saved' : 'error')
        })
        .catch(() => setSaveStatus('error'))
    }, 2500)
  }

  // If an edit arrived before the assignment-mode session existed (scheduleAutoSave
  // bailed and set hasUnflushedEditRef), flush it the moment the session shows up —
  // otherwise that edit is silently lost forever (no later edit would ever retry it).
  useEffect(() => {
    if (!sessionId || !hasUnflushedEditRef.current) return
    hasUnflushedEditRef.current = false
    const { annotations, corrections, verseTranslations, verseCorrections, notes } = latestFieldsRef.current
    fetch(`/api/exegesis/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annotations, corrections, verseTranslations, verseCorrections, notes, answerTimings: timingsRef.current }),
    })
      .then(r => setSaveStatus(r.ok ? 'saved' : 'error'))
      .catch(() => setSaveStatus('error'))
  }, [sessionId])

  // Flush a pending debounced autosave before the page unloads/backgrounds, instead of
  // losing the last few seconds of edits to the 2.5s debounce window. fetch(...,
  // {keepalive:true}) lets the request outlive navigation; sendBeacon can't do PATCH.
  // beforeunload also warns the student so they get a chance to cancel and wait.
  useEffect(() => {
    function flush() {
      const { annotations, corrections, verseTranslations, verseCorrections, notes, sessionId: sid } = latestFieldsRef.current
      if (!sid) return
      fetch(`/api/exegesis/${sid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations, corrections, verseTranslations, verseCorrections, notes, answerTimings: timingsRef.current }),
        keepalive: true,
      }).catch(() => {})
    }
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!autoSaveTimer.current) return   // nothing debounced/unsaved right now
      flush()
      e.preventDefault()
      e.returnValue = ''
    }
    function onPageHide() {
      if (autoSaveTimer.current) flush()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [])

  // ── Offline safety net: restore a recovered local draft ──
  // If the connection dropped before the last autosave landed and the page then reloaded,
  // the server copy is stale but localStorage still holds the newer edits. Adopt them over
  // the freshly-loaded server data and re-flush so the server catches up. Runs once per
  // session, only when the local draft is genuinely ahead of the server.
  useEffect(() => {
    if (!sessionId || !propAssignmentId || didRestoreLocalRef.current || submitted) return
    didRestoreLocalRef.current = true
    const rec = readLocalDraft(sessionId)
    if (!rec || rec.version <= rec.syncedVersion) return   // nothing unsynced to recover
    const d = rec.data
    setAnnotations((d.annotations as AnnotationMap) ?? {})
    setCorrections((d.corrections as AnnotationMap) ?? {})
    setVerseTranslations(d.verseTranslations ?? {})
    setVerseCorrections(d.verseCorrections ?? {})
    setNotes(d.notes ?? '')
    if (d.answerTimings) timingsRef.current = d.answerTimings
    const v = rec.version
    setSaveStatus('saving')
    fetch(`/api/exegesis/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    })
      .then(r => { if (r.ok) markLocalDraftSynced(sessionId, v); setSaveStatus(r.ok ? 'saved' : 'error') })
      .catch(() => setSaveStatus('error'))
  }, [sessionId, submitted])

  // ── Offline safety net: retry failed saves until they land ──
  // A debounced save that fails (offline) was previously stranded in memory. Here we keep
  // re-flushing the local draft on an interval and whenever the browser reports it's back
  // online, until the server confirms it — so a transient drop self-heals.
  useEffect(() => {
    if (!sessionId || !isAuthenticated || !propAssignmentId) return
    const flush = () => {
      const rec = readLocalDraft(sessionId)
      if (!rec || rec.version <= rec.syncedVersion) return   // nothing unsaved
      const v = rec.version
      fetch(`/api/exegesis/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rec.data),
      })
        .then(r => { if (r.ok) { markLocalDraftSynced(sessionId, v); setSaveStatus('saved') } else setSaveStatus('error') })
        .catch(() => { /* still offline — try again on the next tick */ })
    }
    const id = setInterval(flush, 15000)
    window.addEventListener('online', flush)
    return () => { clearInterval(id); window.removeEventListener('online', flush) }
  }, [sessionId, isAuthenticated])

  // ── Load saved session ──
  const loadSavedSession = useCallback(async (s: SavedSession) => {
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
        const pr = await fetch(`/api/reader?book=${book.osisId}&chapter=${sess.chapter}${propAssignmentId ? '' : '&corpus=NA1904'}`)
        const pd = await pr.json()
        const filtered: LoadedVerse[] = (pd.verses ?? []).filter(
          (v: LoadedVerse) => v.verse >= sess.verseStart && v.verse <= sess.verseEnd
        )
        setLoadedVerses(filtered)
      } finally {
        setIsLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, propAssignmentId])

  // ── Delete session ──
  const deleteSession = useCallback(async (id: string) => {
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
  }, [sessionId, loadSessionList])

  // ── PDF export ──
  const exportPDF = useCallback(() => {
    window.print()
  }, [])

  // Expose actions to a parent that renders the "My Sessions" / "Download as PDF"
  // controls elsewhere (the coordinated exegesis page's tools menu).
  useImperativeHandle(ref, () => ({ loadSavedSession, deleteSession, exportPDF }), [loadSavedSession, deleteSession, exportPDF])

  // ── Build summary rows for print ──

  // ── Lock / mode flags ──
  // deadlinePassed locks stage-1 (black annotations) and opens review mode, but leaves stage-2 (red corrections) editable.
  // round1Passed / round2Passed are absolute, instructor-set cut-offs that lock the respective phase regardless of timers.
  const isExam = !!assignment?.isExam
  // A reopened submission bypasses deadline-based locks (but not submit/timer locks).
  const isLocked = timerExpired || submitted || (!reopened && (deadlinePassed || round1Passed))   // stage 1 annotations locked
  const correctionLocked = reviewTimerExpired || submitted || (!reopened && round2Passed)          // stage 2 corrections locked
  // Exams are single-round: never enter the Round 2 (corrections) review layout.
  const reviewMode = !isExam && (timerExpired || deadlinePassed || round1Passed)  // show 3-column reader layout
  // Whole-verse translations are keyed by verse number for single-passage exercises,
  // but by the globally-unique verse id for multi-passage exams (avoids collisions).
  const vtKey = (v: LoadedVerse) => (isExam ? v.id : String(v.verse))

  // Show submit button when:
  // - in assignment mode and passage is loaded
  // - AND not yet submitted
  // - AND (there is no stage 1 timer, OR stage 1 has expired)
  const showSubmitButton = !!(propAssignmentId && loadedVerses.length > 0 && !submitted &&
    (!assignment?.timeLimitSeconds || timerExpired || deadlinePassed || round1Passed))

  // ── Lockdown (exam integrity) ──
  // Active only for a real student attempt on a lockdown exam, before submission.
  // Instructors previewing (previewMode) are exempt so they can inspect freely.
  const lockdownOn = isExam && !!assignment?.lockdown && !!propAssignmentId && !previewMode && !submitted
  // Safety floor: clamp the auto-submit threshold up to MIN_LOCKDOWN_AUTOSUBMIT at runtime,
  // so a single stray violation can never end an exam — even on an exam whose stored
  // threshold predates this guard (e.g. a value of 1). Blank stays blank (warn only).
  const rawMaxViolations = assignment?.lockdownMaxViolations ?? null
  const maxViolations = rawMaxViolations != null ? Math.max(rawMaxViolations, MIN_LOCKDOWN_AUTOSUBMIT) : null
  // A lockdown exam needs fullscreen + a large enough screen. iPhone Safari has no
  // element fullscreen, so phones can't be locked down — require a desktop/laptop/tablet.
  const canLockdown = fullscreenSupported() && viewportW >= 768

  // Keep submitRef pointed at the latest submit so event handlers can auto-submit
  // without re-binding listeners on every render.
  useEffect(() => { submitRef.current = () => submitAssignment({ auto: true }) })

  /** Record one integrity violation: bump the count, log it to the server (append-only),
   *  flash a warning, and auto-submit once the configured threshold is reached. */
  const recordViolation = useCallback((type: string) => {
    if (!lockdownOn) return
    // Coalesce events that co-fire for a single action (e.g. a tab switch raises both
    // `blur` and `visibilitychange`) so one action counts as one violation.
    const nowMs = Date.now()
    if (nowMs - lastViolationAtRef.current < 1200) return
    lastViolationAtRef.current = nowMs
    violationsRef.current += 1
    const count = violationsRef.current
    setViolations(count)
    setLastViolation(type)
    if (sessionId) {
      // Fire-and-forget; append-only on the server so it can't be wiped client-side.
      fetch(`/api/exegesis/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appendIntegrityEvents: [{ type, at: new Date().toISOString() }] }),
        keepalive: true,
      }).catch(() => {})
    }
    const willAutoSubmit = maxViolations != null && count >= maxViolations
    // Flash a clear, unmissable warning so the student knows what was recorded and what
    // happens next. Stays until the next one replaces it or ~7s passes.
    const action = VIOLATION_MESSAGES[type] ?? 'An action was flagged'
    const consequence = maxViolations != null
      ? (willAutoSubmit
          ? 'You have reached the limit — your exam is being submitted.'
          : `This was recorded (${count} of ${maxViolations}). At ${maxViolations} your exam will be submitted automatically.`)
      : 'This was recorded for your instructor. Stay in the exam window.'
    setViolationWarning(`${action}. ${consequence}`)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    warningTimerRef.current = setTimeout(() => setViolationWarning(null), 7000)
    if (willAutoSubmit) {
      submitRef.current()
    }
  }, [lockdownOn, sessionId, maxViolations])

  // Detect tab/window switching, fullscreen exit, and copy/paste while a lockdown exam
  // is in progress. Each is logged as a violation; fullscreen exit also raises the
  // re-entry overlay.
  useEffect(() => {
    if (!lockdownOn || !lockdownStarted) return
    const onVisibility = () => { if (document.hidden) recordViolation('tab-hidden') }
    const onBlur = () => recordViolation('window-blur')
    const onFullscreenChange = () => {
      // Our own exit-on-submit isn't a violation — consume the flag and ignore it.
      if (suppressFsExitRef.current) { suppressFsExitRef.current = false; return }
      // Only count a fullscreen exit on browsers that actually support fullscreen — on
      // iPhone Safari there's no fullscreen, so this must not fire spurious violations.
      if (fullscreenSupported() && !fullscreenElementCompat()) { setFullscreenLost(true); recordViolation('fullscreen-exit') }
    }
    const block = (type: string) => (e: Event) => { e.preventDefault(); recordViolation(type) }
    const onCopy = block('copy')
    const onPaste = block('paste')
    const onContextMenu = block('contextmenu')
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    document.addEventListener('copy', onCopy)
    document.addEventListener('paste', onPaste)
    document.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [lockdownOn, lockdownStarted, recordViolation])

  // While a lockdown exam is in progress, hide the app chrome (top bar, sidebar, mobile
  // nav) so the student can't navigate away mid-exam. globals.css hides them under this class.
  useEffect(() => {
    const active = lockdownOn && lockdownStarted
    document.body.classList.toggle('exam-lockdown', active)
    return () => document.body.classList.remove('exam-lockdown')
  }, [lockdownOn, lockdownStarted])

  /** Enter fullscreen and begin the locked exam (must be triggered by a user click).
   *  Stamps the rules-acknowledgment time on first entry; the effect below logs it. */
  const enterLockdown = useCallback(async () => {
    if (!ackAtRef.current) ackAtRef.current = new Date().toISOString()
    try { await requestFullscreenCompat(document.documentElement) } catch { /* some browsers/permissions block it */ }
    setFullscreenLost(false)
    setLockdownStarted(true)
  }, [])

  // Record the rules acknowledgment to the append-only integrity log, so there's a
  // permanent, server-side record (with timestamp) that the student agreed before
  // starting. Runs once the exam session exists; retries if the session wasn't ready yet.
  useEffect(() => {
    if (ackSentRef.current || !ackAtRef.current || !sessionId || !lockdownStarted) return
    ackSentRef.current = true
    fetch(`/api/exegesis/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appendIntegrityEvents: [{ type: 'acknowledged-rules', at: ackAtRef.current }] }),
      keepalive: true,
    }).catch(() => { ackSentRef.current = false })  // allow a later retry on failure
  }, [sessionId, lockdownStarted])

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  const timerColor = secondsLeft !== null
    ? secondsLeft <= 60 ? 'text-red-600' : secondsLeft <= 180 ? 'text-gray-600' : 'text-brand-700'
    : ''

  const passageTitle = selectedBook && loadedVerses.length > 0
    ? `${selectedBook.name} ${chapter}:${verseStart}${verseEnd !== verseStart ? `–${verseEnd}` : ''}`
    : ''

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col gap-0 flex-1 min-h-0 print:block print:flex-none ${lockdownOn && lockdownStarted ? 'select-none' : ''}`}>

      {/* ── Lockdown: start gate (must click to enter fullscreen and begin) ── */}
      {lockdownOn && !lockdownStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 px-6 print:hidden">
          {canLockdown ? (
            <div className="max-w-lg w-full rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="text-center">
                <div className="text-4xl mb-2">🔒</div>
                <h2 className="text-xl font-bold text-gray-900">Locked exam — please read before you begin</h2>
                <p className="mt-1 text-sm text-gray-600">This exam opens in fullscreen. While it is open, the following are recorded with a timestamp and shown to your instructor:</p>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-red-500">•</span> Leaving fullscreen</li>
                <li className="flex gap-2"><span className="text-red-500">•</span> Switching to another tab, window, or application (clicking outside this window)</li>
                <li className="flex gap-2"><span className="text-red-500">•</span> Copying, pasting, or opening the right-click menu</li>
              </ul>

              {maxViolations != null ? (
                <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                  After <strong>{maxViolations}</strong> such actions, your exam will be <strong>submitted automatically</strong>. Stay in this window and in fullscreen until you finish.
                </p>
              ) : (
                <p className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                  These actions are logged for your instructor to review. Stay in this window and in fullscreen until you finish.
                </p>
              )}

              <p className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
                If your internet drops, don&rsquo;t worry — your answers are saved on this device and sync automatically when you reconnect. Keep working.
              </p>

              <label className="mt-5 flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rulesAck}
                  onChange={e => setRulesAck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-400"
                />
                <span className="text-sm text-gray-800">I have read and understand these rules and agree to abide by them.</span>
              </label>

              <button
                onClick={enterLockdown}
                disabled={!rulesAck}
                className="mt-5 w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Enter fullscreen &amp; begin
              </button>
              {!rulesAck && (
                <p className="mt-2 text-center text-xs text-gray-400">Tick the box above to start the exam.</p>
              )}
            </div>
          ) : (
            <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
              <div className="text-4xl mb-3">🖥️</div>
              <h2 className="text-xl font-bold text-gray-900">Use a computer for this exam</h2>
              <p className="mt-2 text-sm text-gray-600">
                This is a locked exam that must run in fullscreen, which phones don&rsquo;t support.
                Please open it on a desktop or laptop (or a tablet) in an up-to-date browser to begin.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Lockdown: re-entry overlay (exited fullscreen mid-exam) ── */}
      {lockdownOn && lockdownStarted && fullscreenLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/90 px-6 print:hidden">
          <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-xl font-bold text-red-700">You left fullscreen</h2>
            <p className="mt-2 text-sm text-gray-600">
              This was recorded ({violations} violation{violations === 1 ? '' : 's'} so far). Return to fullscreen to continue your exam.
            </p>
            <button
              onClick={enterLockdown}
              className="mt-5 w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
            >
              Return to exam
            </button>
          </div>
        </div>
      )}

      {/* ── Lockdown: persistent integrity status ── */}
      {lockdownOn && lockdownStarted && (
        <div className={`print:hidden flex items-center justify-between gap-3 px-4 py-1.5 text-xs font-medium ${violations > 0 ? 'bg-red-50 text-red-700 border-b border-red-200' : 'bg-gray-100 text-gray-600 border-b border-gray-200'}`}>
          <span className="inline-flex items-center gap-1.5">🔒 Lockdown exam — stay in fullscreen; do not switch tabs or copy/paste.</span>
          <span>{violations > 0 ? `${violations} violation${violations === 1 ? '' : 's'} recorded${lastViolation ? ` · last: ${lastViolation}` : ''}` : 'No violations'}{maxViolations != null ? ` (auto-submit at ${maxViolations})` : ''}</span>
        </div>
      )}

      {/* ── Lockdown: transient warning shown each time a violation is recorded ── */}
      {lockdownOn && lockdownStarted && violationWarning && !fullscreenLost && (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 print:hidden pointer-events-none">
          <div role="alert" className="pointer-events-auto max-w-md rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-2xl flex items-start gap-2.5">
            <span className="text-lg leading-none">⚠️</span>
            <span>{violationWarning}</span>
          </div>
        </div>
      )}

      {/* ── Print header (hidden on screen) ── */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-center">{sessionTitle || passageTitle}</h1>
        <p className="text-center text-sm text-gray-500">Exegesis Worksheet</p>
      </div>

      {/* ── Assignment banner ── */}
      {assignment && (
        <div className="print:hidden bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* The passage is already the page title above, so only show a reference
                here when the instructor named the exercise something different (then
                it adds info) — otherwise we'd echo the same passage three times. */}
            {!assignment.isExam && assignment.reference && assignment.reference !== assignment.title && (
              <p className="text-lg font-semibold text-gray-900">Passage: {assignment.reference}</p>
            )}
            {assignment.isExam && (
              <p className="text-base text-gray-700 mt-0.5">{assignment.examPassages.length} passages · annotate all in one sitting</p>
            )}
            {assignment.instructions && (
              <p className="text-base text-gray-700 mt-1">{assignment.instructions}</p>
            )}
            {(assignment.round1Deadline || assignment.round2Deadline) && (
              <div className="mt-2 flex flex-col gap-1">
                {assignment.round1Deadline && (
                  <DeadlineLine label={assignment.isExam ? 'Exam closes' : 'Round 1 (annotations) closes'} date={assignment.round1Deadline} passed={round1Passed} />
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
          {!submitted && reopened && (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
              Reopened by instructor — edit &amp; resubmit
            </span>
          )}
          {!submitted && !reopened && deadlinePassed && (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
              Deadline passed — editing only
            </span>
          )}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="print:hidden bg-white border-b border-gray-200 py-3 flex flex-wrap items-end gap-3">

        {/* Passage box — hidden in assignment mode (fixed passage) and in coordinated
            mode (a shared passage box in ExegesisTabs drives all the tabs). */}
        {!propAssignmentId && controlledPassage === undefined && (
          <>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <span className="px-3 py-1.5 rounded-l-lg bg-brand-600 text-white text-sm font-medium">Passage</span>
                  <input
                    type="text"
                    value={passageInput}
                    onChange={e => { setPassageInput(e.target.value); if (passageError) setPassageError(false) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
                    onBlur={handlePassageSubmit}
                    placeholder="e.g. Matthew 3:1-3"
                    className={`border rounded-l-none rounded-r-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 ${passageError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-brand-400'}`}
                  />
                </div>
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

        {/* Vocabulary glossary control — adds definitions for rarer words beneath each
            verse, like translation exercises. Hidden when an instructor has set it, or
            when the control is hoisted into the shared exegesis header (controlled). */}
        {!isGlossControlled && loadedVerses.length > 0 && assignment?.glossFrequency == null && (
          <div className="self-end flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-500">Vocabulary</label>
            <select
              value={glossPref ?? ''}
              onChange={e => setGlossPref(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">Off</option>
              <option value="50">Words less frequent than 50×</option>
              <option value="30">Words less frequent than 30×</option>
            </select>
          </div>
        )}

        <div className="flex-1" />

        {/* ── Stage 1 Countdown timer ── */}
        {secondsLeft !== null && !submitted && !timerExpired && (
          <div className={`self-end flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-semibold
            ${secondsLeft <= 60
              ? 'bg-red-50 border-red-200 animate-pulse text-red-600'
              : secondsLeft <= 180
                ? 'bg-gray-100 border-gray-300 text-gray-600'
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
                  ? 'bg-gray-100 border-gray-300 text-gray-600'
                  : 'bg-gray-100 border-gray-300 text-gray-700'
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
        {/* Save status is hidden on the public exegesis study page (work auto-saves);
            assignments and exams keep it so students can confirm graded work saved. */}
        {loadedVerses.length > 0 && isAuthenticated && propAssignmentId && (
          <span className="self-end inline-flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-500">
            {saveStatus === 'saving' || isSaving ? (
              <><svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Saving…</>
            ) : saveStatus === 'pending' ? (
              <span className="text-gray-400">Unsaved changes…</span>
            ) : saveStatus === 'error' ? (
              <span className="text-amber-600">Offline — your work is saved on this device and will sync when you reconnect</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600">All changes saved</span>
            )}
          </span>
        )}

        {/* Hidden when hoisted into the coordinated exegesis page's tools menu. */}
        {!isSessionsControlled && loadedVerses.length > 0 && !isExam && (
          <button
            onClick={exportPDF}
            className="self-end flex items-center gap-1.5 px-4 py-1.5 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300 transition"
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
              onClick={() => submitAssignment()}
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
            passage is loaded. Hidden in assignment mode, and when hoisted into the
            coordinated exegesis page's tools menu. */}
        {!propAssignmentId && !isSessionsControlled && (
          <div className="relative" ref={sessionListRef}>
            <button
              onClick={() => { loadSessionList(); setShowSessionList(v => !v) }}
              className="self-end px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 transition"
            >
              My Sessions
            </button>
            {showSessionList && (
              <div ref={sessionPanelRef} className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-80 max-w-[calc(100vw-1rem)] max-h-80 overflow-y-auto">
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
        <div className="flex flex-1 gap-0 print:block min-h-0 flex-col lg:flex-row">

          {/* ── Greek text pane ── */}
          <div className="overflow-y-auto py-4 lg:py-6 print:overflow-visible flex-1">

            {/* Print: passage header */}
            <div className="hidden print:block mb-4">
              <h2 className="text-xl font-semibold">{passageTitle}</h2>
            </div>

            {/* Review mode banner */}
            {reviewMode && !correctionLocked && (
              <div className="mb-3 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-xs text-gray-700 font-medium">
                ✏️ Review phase — click any word to compare your analysis and add corrections in red.
              </div>
            )}
            {correctionLocked && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800 font-medium">
                {isExam
                  ? (submitted
                      ? '🔒 Exam submitted — your answers are locked.'
                      : '🔒 Exam closed — your answers are locked.')
                  : '🔒 Review phase ended — all annotations are locked. Download your PDF or submit for grading.'}
              </div>
            )}

            {loadedVerses.map(v => (
              <div key={v.id} className="mb-6 print:mb-4 lg:grid lg:grid-cols-[1fr_24rem] lg:gap-6 lg:items-start print:block">
                {/* Left column: the Greek text + whole-verse boxes */}
                <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium mb-2 print:mb-1 flex items-center gap-1.5">
                  {v.reference}
                  {notesEnabled && selectedBook && (
                    <span className="print:hidden">
                      <VerseNoteButton book={selectedBook.osisId} chapter={chapter} verse={v.verse} noted={notedVerses.has(v.verse)} onChanged={refreshNotes} />
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1 print:gap-1.5 print:leading-loose">
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
                          'flex flex-col items-center px-1.5 py-0.5 rounded font-greek transition print:cursor-default print:px-0',
                          isSelected
                            ? 'bg-brand-100 text-brand-800 ring-2 ring-brand-400 print:bg-transparent print:ring-0'
                            : hasCorr
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 print:bg-transparent'
                              : hasAnn
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 print:bg-transparent'
                                : 'text-gray-800 hover:bg-gray-100 print:text-black',
                        ].join(' ')}
                      >
                        {/* Round 1 parsing above + syntax below the (enlarged) Greek word,
                            so students can translate with their analysis in view. In Round 2
                            (review mode) the parsing/syntax corrections show in red in the same
                            above/below positions. Screen only (print:hidden) — the PDF table and
                            instructor grading columns keep their separate-column layout. */}
                        <span className="font-sans text-[11px] leading-tight text-gray-500 whitespace-nowrap print:hidden">{annotations[key]?.parsing || ' '}</span>
                        {reviewMode && corrections[key]?.parsing && (
                          <span className="font-sans text-[11px] leading-tight text-red-600 whitespace-nowrap print:hidden">{corrections[key].parsing}</span>
                        )}
                        <span className={reviewMode ? 'text-xl' : 'text-2xl'}>{w.surface}</span>
                        <span className="font-sans text-[11px] leading-tight text-gray-500 whitespace-nowrap print:hidden">{annotations[key]?.syntax || ' '}</span>
                        {reviewMode && corrections[key]?.syntax && (
                          <span className="font-sans text-[11px] leading-tight text-red-600 whitespace-nowrap print:hidden">{corrections[key].syntax}</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Whole-verse translation (Round 1) */}
                <div className="mt-2 print:hidden">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Verse Translation
                  </label>
                  <textarea
                    value={verseTranslations[vtKey(v)] ?? ''}
                    onChange={e => handleVerseTranslationChange(vtKey(v), e.target.value)}
                    disabled={isLocked}
                    rows={2}
                    placeholder={isLocked ? '' : 'Write your translation of this whole verse…'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Glossary — words in this verse less frequent than the threshold (the
                    instructor's setting, or the student's Vocabulary choice when none). */}
                {(assignment?.glossFrequency ?? glossPref) != null && (() => {
                  const threshold = (assignment?.glossFrequency ?? glossPref)!
                  const seen = new Set<string>()
                  const rare = v.words.filter(w => {
                    const lex = w.lexeme
                    if (!lex || !lex.gloss || !lex.lexeme) return false
                    if ((lex.frequency ?? 0) >= threshold) return false
                    if (seen.has(lex.lexeme)) return false
                    seen.add(lex.lexeme)
                    return true
                  })
                  if (rare.length === 0) return null
                  return (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 print:bg-transparent print:border-gray-300 print:break-inside-avoid">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Glossary · words less frequent than {threshold}×
                      </p>
                      <ul className="space-y-0.5">
                        {rare.map(w => (
                          <li key={w.id} className="text-sm leading-snug">
                            <span className="font-greek text-gray-800">{w.lexeme!.lexeme}</span>
                            <span className="text-gray-500"> — {w.lexeme!.gloss}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })()}

                {/* Round 2 Notes — only shown after Round 1 ends */}
                {reviewMode && (
                  <div className="mt-2 print:hidden">
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
                      }`}
                    />
                  </div>
                )}

                {/* Print only: Round 1 translation + Round 2 notes, side by side */}
                {(() => {
                  const r1 = (verseTranslations[vtKey(v)] ?? '').trim()
                  const r2 = (verseCorrections[String(v.verse)] ?? '').trim()
                  if (!r1 && !r2) return null
                  return (
                    <div className={`hidden print:grid gap-4 mt-2 ${reviewMode ? 'print:grid-cols-2' : 'print:grid-cols-1'}`}>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Round 1 — Verse translation</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{r1 || '—'}</p>
                      </div>
                      {reviewMode && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 mb-1">Round 2 Notes</p>
                          <p className="text-sm text-red-700 whitespace-pre-wrap">{r2 || '—'}</p>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Print only: per-word Round 1 annotations vs Round 2 corrections,
                    matching the on-screen review layout. Fields are aligned row-by-row
                    so Round 1 and Round 2 line up (Parse↔Parse, Syntax↔Syntax). */}
                {(() => {
                  const rows = v.words.filter(w => {
                    const key = wordKey(v.verse, w.id)
                    const ann = annotations[key]
                    const corr = corrections[key]
                    return Boolean(ann?.parsing || ann?.syntax || ann?.translation || corr?.parsing || corr?.syntax || corr?.translation)
                  })
                  if (rows.length === 0) return null
                  return (
                    <table className="hidden print:table w-full border-collapse text-xs mt-3">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-1 pr-3 font-semibold w-28">Greek word</th>
                          <th className="text-left py-1 pr-3 font-semibold">Round 1 — annotations</th>
                          <th className="text-left py-1 font-semibold text-red-600">Round 2 — corrections</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.flatMap(w => {
                          const key = wordKey(v.verse, w.id)
                          const ann = (annotations[key] ?? { parsing: '', syntax: '', translation: '' }) as WordAnnotation
                          const corr = (corrections[key] ?? { parsing: '', syntax: '', translation: '' }) as WordAnnotation
                          const fields = PRINT_ANN_FIELDS.filter(f => ann[f] || corr[f])
                          // One row per field so Round 1 / Round 2 stay aligned even when a value wraps.
                          return fields.map((f, i) => (
                            <tr key={`${w.id}-${f}`} className={`align-top ${i === 0 ? 'border-t border-gray-200' : ''}`}>
                              {i === 0 && (
                                <td rowSpan={fields.length} className="py-1.5 pr-3 align-top font-greek text-sm">{w.surface}</td>
                              )}
                              <td className="py-0.5 pr-3 text-gray-800">
                                {ann[f] && <><span className="uppercase tracking-wide text-[9px] text-gray-400 mr-1">{PRINT_ANN_LABELS[f]}</span>{ann[f]}</>}
                              </td>
                              <td className="py-0.5 text-red-700">
                                {corr[f] && <><span className="uppercase tracking-wide text-[9px] text-gray-400 mr-1">{PRINT_ANN_LABELS[f]}</span>{corr[f]}</>}
                              </td>
                            </tr>
                          ))
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
                  {/* Match by the verse's unique id, not its number — in a multi-passage
                      exam two passages can share a verse number, which would otherwise
                      render the panel under both verses and break it. */}
                  {selectedWord && selectedWord.word.verseId === v.id && (
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

            {/* ── Areas for Improvement — a written reflection required before submitting.
                  Shown for any assignment exercise (not exams) and available throughout, so
                  one-round exercises (no Round-1 cut-off, where reviewMode never triggers)
                  still expose it. ── */}
            {!!propAssignmentId && !isExam && (
              <div className="mt-6 print:hidden">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Areas for Improvement <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-1.5">
                  Reflect on what you found difficult and what you&rsquo;d work on next. This is required before you can submit for grading.
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
                  placeholder={submitted ? '' : 'e.g. I struggled with participle aspect and need to review the genitive absolute…'}
                  className={`w-full rounded-lg px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 ${
                    !submitted && !notes.trim()
                      ? 'border-2 border-amber-300 bg-amber-50 focus:ring-amber-400'
                      : 'border border-gray-300 bg-white focus:ring-brand-500 focus:border-transparent'
                  }`}
                />
                {!submitted && !notes.trim() && (
                  <p className="text-xs text-amber-600 mt-1">Write a short reflection here before submitting.</p>
                )}
              </div>
            )}

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
})
