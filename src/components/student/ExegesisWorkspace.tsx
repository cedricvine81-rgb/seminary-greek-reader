'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { BiblicalBook, VerseWord } from '@/types/biblical-text'

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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wordKey(verse: number, wordId: string) {
  return `${verse}-${wordId}`
}

function formatParse(word: VerseWord): string {
  const p = word.parses?.[0]
  if (!p) return ''
  const parts: string[] = []
  if (p.partOfSpeech) parts.push(p.partOfSpeech)
  if (p.tense) parts.push(p.tense)
  if (p.voice) parts.push(p.voice)
  if (p.mood) parts.push(p.mood)
  if (p.person) parts.push(p.person)
  if (p.number) parts.push(p.number)
  if (p.casus) parts.push(p.casus)
  if (p.gender) parts.push(p.gender)
  return parts.join(' ')
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
  const autoparse = formatParse(word)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-greek text-brand-700">{word.surface}</span>
        <span className="text-sm text-gray-500 italic">{word.lexeme?.lexeme}</span>
        {word.lexeme?.gloss && (
          <span className="text-sm text-gray-400">&ldquo;{word.lexeme.gloss}&rdquo;</span>
        )}
      </div>

      {(['parsing', 'syntax', 'translation'] as const).map(field => (
        <div key={field}>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            {field === 'parsing' ? 'Parsing' : field === 'syntax' ? 'Syntax / Function' : 'Translation Contribution'}
          </label>
          <input
            type="text"
            value={ann[field]}
            placeholder={
              field === 'parsing' ? (autoparse || 'e.g. Verb, Present Active Indicative 3sg')
              : field === 'syntax' ? 'e.g. Subject, Direct object, Temporal ptc.'
              : 'e.g. he believed / the love of God'
            }
            disabled={locked}
            onChange={e => onChange(key, field, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          />
          {field === 'parsing' && autoparse && !locked && (
            <button type="button" onClick={() => onChange(key, 'parsing', autoparse)}
              className="mt-1 text-xs text-brand-500 hover:text-brand-700 underline">
              Use auto-parsed: {autoparse}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

/** Review-mode annotation panel — shown after timer expires.
 *  Displays the original (read-only), the correct parse, and a red correction input. */
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
  const autoparse = formatParse(word)

  const parse = word.parses?.[0]
  const parseDetails = parse ? [
    parse.partOfSpeech,
    parse.tense, parse.voice, parse.mood,
    parse.person, parse.number, parse.casus, parse.gender,
  ].filter(Boolean) : []

  return (
    <div className="flex flex-col gap-4">
      {/* Word header */}
      <div>
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-3xl font-greek text-brand-700">{word.surface}</span>
          <span className="text-sm text-gray-500 italic">{word.lexeme?.lexeme}</span>
        </div>
        {word.lexeme?.gloss && (
          <p className="text-sm text-gray-500">&ldquo;{word.lexeme.gloss}&rdquo;</p>
        )}
        {/* Parse chips */}
        {parseDetails.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {parseDetails.map((d, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-xs bg-brand-50 text-brand-700 border border-brand-200 font-medium">
                {d}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Parsing */}
      <ReviewField
        label="Parsing"
        correct={autoparse}
        original={original.parsing}
        correction={corr.parsing}
        placeholder="e.g. Verb, Present Active Indicative 3sg"
        onUseCorrect={() => onCorrection(key, 'parsing', autoparse)}
        onChange={v => onCorrection(key, 'parsing', v)}
        locked={locked}
      />

      {/* Syntax */}
      <ReviewField
        label="Syntax / Function"
        correct={null}
        original={original.syntax}
        correction={corr.syntax}
        placeholder="e.g. Subject, Direct object, Temporal ptc."
        onChange={v => onCorrection(key, 'syntax', v)}
        locked={locked}
      />

      {/* Translation */}
      <ReviewField
        label="Translation Contribution"
        correct={null}
        original={original.translation}
        correction={corr.translation}
        placeholder="e.g. he believed / the love of God"
        onChange={v => onCorrection(key, 'translation', v)}
        locked={locked}
      />
    </div>
  )
}

function ReviewField({
  label, correct, original, correction, placeholder, onChange, onUseCorrect, locked,
}: {
  label: string; correct: string | null; original: string; correction: string
  placeholder: string; onChange: (v: string) => void; onUseCorrect?: () => void; locked?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>

      {/* Original answer */}
      <div className="flex items-start gap-2">
        <span className="text-xs text-gray-400 w-14 shrink-0 pt-1">Original</span>
        <span className={`text-sm flex-1 px-2 py-1 rounded bg-gray-50 border border-gray-200 min-h-[2rem] ${original ? 'text-gray-600' : 'text-gray-300 italic'}`}>
          {original || '—'}
        </span>
      </div>

      {/* Correct answer (only for parsing, where we have auto-morph) */}
      {correct !== null && (
        <div className="flex items-start gap-2">
          <span className="text-xs text-emerald-600 w-14 shrink-0 pt-1 font-medium">Correct</span>
          <div className="flex-1 flex items-start gap-1.5">
            <span className={`text-sm flex-1 px-2 py-1 rounded border min-h-[2rem]
              ${correct ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-300 italic'}`}>
              {correct || '—'}
            </span>
            {correct && onUseCorrect && (
              <button onClick={onUseCorrect}
                className="shrink-0 text-xs px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition whitespace-nowrap">
                Use ↑
              </button>
            )}
          </div>
        </div>
      )}

      {/* Correction input */}
      <div className="flex items-start gap-2">
        <span className={`text-xs w-14 shrink-0 pt-2 font-medium ${locked ? 'text-gray-400' : 'text-red-500'}`}>
          {locked ? 'Locked' : 'Edit'}
        </span>
        <input
          type="text"
          value={correction}
          placeholder={locked ? '' : placeholder}
          disabled={locked}
          onChange={e => onChange(e.target.value)}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
            locked
              ? 'border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
              : 'border-2 border-red-300 text-red-700 placeholder-red-200 focus:ring-red-400 bg-red-50'
          }`}
        />
      </div>
    </div>
  )
}

/** Right-side passage reader shown during review mode.
 *  Renders the passage with morphological details visible on word click. */
function ReviewPassagePanel({
  verses, selectedWordKey, onWordClick,
}: {
  verses: LoadedVerse[]
  selectedWordKey: string | null
  onWordClick: (word: VerseWord, verse: number) => void
}) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [popupWord, setPopupWord] = useState<{ word: VerseWord; verse: number } | null>(null)

  function handleClick(word: VerseWord, verse: number) {
    const key = wordKey(verse, word.id)
    setPopupWord(prev => prev && wordKey(prev.verse, prev.word.id) === key ? null : { word, verse })
    onWordClick(word, verse)
  }

  const pw = popupWord?.word
  const parse = pw?.parses?.[0]

  return (
    <div className="flex flex-col h-full overflow-hidden border-l border-gray-200">
      {/* Header */}
      <div className="shrink-0 px-4 py-2 bg-brand-50 border-b border-brand-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Passage Reader</p>
        <p className="text-xs text-brand-500 ml-1">Click any word for morphology</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {verses.map(v => (
          <div key={v.id}>
            <p className="text-xs text-gray-400 font-medium mb-1">{v.reference}</p>
            <div className="flex flex-wrap gap-1 leading-loose">
              {v.words.map(w => {
                const key = wordKey(v.verse, w.id)
                const isActive = selectedWordKey === key
                const isPopup = popupWord && wordKey(popupWord.verse, popupWord.word.id) === key
                return (
                  <button
                    key={w.id}
                    onClick={() => handleClick(w, v.verse)}
                    onMouseEnter={() => setHoveredKey(key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    className={[
                      'px-1.5 py-0.5 rounded text-xl font-greek transition-colors',
                      isPopup ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400'
                        : isActive ? 'bg-brand-100 text-brand-800'
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

      {/* Word detail popup */}
      {popupWord && (
        <div className="shrink-0 border-t border-gray-200 bg-white p-4 space-y-3 max-h-64 overflow-y-auto">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-greek text-brand-700">{pw!.surface}</span>
              <span className="text-sm text-gray-500 italic">{pw!.lexeme?.lexeme}</span>
            </div>
            <button onClick={() => setPopupWord(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>

          {pw!.lexeme?.gloss && (
            <p className="text-sm text-gray-700 font-medium">&ldquo;{pw!.lexeme.gloss}&rdquo;</p>
          )}

          {parse && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {[
                ['Part of speech', parse.partOfSpeech],
                ['Tense', parse.tense],
                ['Voice', parse.voice],
                ['Mood', parse.mood],
                ['Person', parse.person],
                ['Number', parse.number],
                ['Case', parse.casus],
                ['Gender', parse.gender],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex gap-1">
                  <span className="text-gray-400 w-24 shrink-0">{label}</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          )}

          {pw!.lexeme?.strongs && (
            <p className="text-xs text-gray-400">Strong&apos;s {pw!.lexeme.strongs}</p>
          )}
        </div>
      )}
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
  return { book, chapter: ch, verseStart: vs, verseEnd: ve }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExegesisWorkspace({ assignmentId: propAssignmentId }: { assignmentId?: string }) {
  const router = useRouter()

  // ── Passage state ──
  const [books, setBooks] = useState<BiblicalBook[]>([])
  const [selectedBook, setSelectedBook] = useState<BiblicalBook | null>(null)
  const [chapter, setChapter] = useState(1)
  const [verseStart, setVerseStart] = useState(1)
  const [verseEnd, setVerseEnd] = useState(1)
  const [maxVerse, setMaxVerse] = useState(1)
  const [loadedVerses, setLoadedVerses] = useState<LoadedVerse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // ── Annotation state ──
  const [annotations, setAnnotations] = useState<AnnotationMap>({})
  const [corrections, setCorrections] = useState<AnnotationMap>({})
  const [selectedWordKey, setSelectedWordKey] = useState<string | null>(null)
  const [selectedWord, setSelectedWord] = useState<{ word: VerseWord; verse: number } | null>(null)

  // ── Session persistence ──
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [showSessionList, setShowSessionList] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Assignment mode ──
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // ── Stage 1 Timer (annotation phase) ──
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)  // null = untimed
  const [timerExpired, setTimerExpired] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<Date | null>(null)

  // ── Stage 2 Timer (review/correction phase) ──
  const [reviewSecondsLeft, setReviewSecondsLeft] = useState<number | null>(null)
  const [reviewTimerExpired, setReviewTimerExpired] = useState(false)
  const reviewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
          setSessionId(sess.id)
          setSessionTitle(sess.title)
          const alreadySubmitted = !!sess.submittedAt
          if (alreadySubmitted) setSubmitted(true)
          // Initialise timer from stored startedAt
          if (timeLimitSeconds && sess.startedAt && !alreadySubmitted) {
            const elapsed = Math.floor((Date.now() - new Date(sess.startedAt).getTime()) / 1000)
            const remaining = timeLimitSeconds - elapsed
            startedAtRef.current = new Date(sess.startedAt)
            if (remaining <= 0) {
              setTimerExpired(true)
              setSecondsLeft(0)
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
          // Auto-load passage from assignment reference
          const parsed = parsePassageRef(a.reference, books)
          if (parsed) {
            setSelectedBook(parsed.book)
            setChapter(parsed.chapter)
            setVerseStart(parsed.verseStart)
            setVerseEnd(parsed.verseEnd)
            setSessionTitle(a.title)
            // Start timer immediately for new timed sessions
            if (timeLimitSeconds) {
              startedAtRef.current = new Date()
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
                const vMax = pd.verses?.[pd.verses.length - 1]?.verse ?? 1
                setMaxVerse(vMax)
              })
              .finally(() => setIsLoading(false))
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

  // ── When stage 1 timer expires: start stage 2 review timer (if set) ──
  useEffect(() => {
    if (timerExpired && !submitted && assignment?.reviewTimeLimitSeconds) {
      setReviewSecondsLeft(assignment.reviewTimeLimitSeconds)
    }
  }, [timerExpired]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Load passage ──
  async function loadPassage() {
    if (!selectedBook) return
    setIsLoading(true)
    setLoadedVerses([])
    setSelectedWordKey(null)
    setSelectedWord(null)
    try {
      const r = await fetch(`/api/reader?book=${selectedBook.osisId}&chapter=${chapter}`)
      const d = await r.json()
      if (!d.verses) return
      const filtered: LoadedVerse[] = d.verses.filter(
        (v: LoadedVerse) => v.verse >= verseStart && v.verse <= verseEnd
      )
      setLoadedVerses(filtered)
      const vMax = d.verses[d.verses.length - 1]?.verse ?? 1
      setMaxVerse(vMax)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  // ── Update chapter max verse hint ──
  useEffect(() => {
    if (!selectedBook) return
    fetch(`/api/reader?book=${selectedBook.osisId}&chapter=${chapter}`)
      .then(r => r.json())
      .then(d => {
        const last = d.verses?.[d.verses.length - 1]?.verse
        if (last) setMaxVerse(last)
      })
      .catch(() => {})
  }, [selectedBook, chapter])

  // ── Annotation change ──
  function handleAnnotationChange(key: string, field: keyof WordAnnotation, value: string) {
    if (isLocked) return
    setAnnotations(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? { parsing: '', syntax: '', translation: '' }), [field]: value },
    }))
    // Debounced auto-save
    if (sessionId) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => autoSave(), 3000)
    }
  }

  // ── Correction change (review mode) ──
  function handleCorrectionChange(key: string, field: keyof WordAnnotation, value: string) {
    if (reviewTimerExpired || submitted) return   // corrections locked
    setCorrections(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? { parsing: '', syntax: '', translation: '' }), [field]: value },
    }))
    // Auto-save corrections
    if (sessionId) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => autoSaveCorrections(), 2000)
    }
  }

  // ── Word click ──
  function handleWordClick(word: VerseWord, verseNum: number) {
    const key = wordKey(verseNum, word.id)
    setSelectedWordKey(key)
    setSelectedWord({ word, verse: verseNum })
  }

  // ── Save session (returns sessionId) ──
  async function saveSession(): Promise<string | null> {
    if (!selectedBook || loadedVerses.length === 0) return null
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      const resolvedTitle = sessionTitle || `${selectedBook.name} ${chapter}:${verseStart}${verseEnd !== verseStart ? `–${verseEnd}` : ''}`
      const payload = {
        title: resolvedTitle,
        bookOsisId: selectedBook.osisId,
        bookName: selectedBook.name,
        chapter,
        verseStart,
        verseEnd,
        annotations,
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
            title: resolvedTitle,
            // Persist startedAt if not yet stored (first save of a timed session)
            ...(startedAtRef.current ? { startedAt: startedAtRef.current.toISOString() } : {}),
          }),
        })
      } else {
        const r = await fetch('/api/exegesis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
    try {
      // Ensure session is saved first
      let sid = sessionId
      if (!sid) sid = await saveSession()
      if (!sid) return
      const r = await fetch(`/api/exegesis/${sid}/submit`, { method: 'POST' })
      if (r.ok) {
        setSubmitted(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function autoSave() {
    if (!sessionId) return
    await fetch(`/api/exegesis/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annotations }),
    }).catch(() => {})
  }

  async function autoSaveCorrections() {
    if (!sessionId) return
    await fetch(`/api/exegesis/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corrections }),
    }).catch(() => {})
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
    setAnnotations((sess.annotations as AnnotationMap) ?? {})
    setCorrections((sess.corrections as AnnotationMap) ?? {})
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
      setLoadedVerses([])
    }
    loadSessionList()
  }

  // ── PDF export ──
  function exportPDF() {
    window.print()
  }

  // ── Build summary rows for print ──
  const summaryRows: Array<{
    ref: string
    surface: string
    lemma: string
    parsing: string
    syntax: string
    translation: string
    corrParsing: string
    corrSyntax: string
    corrTranslation: string
  }> = []
  for (const v of loadedVerses) {
    for (const w of v.words) {
      const key = wordKey(v.verse, w.id)
      const ann = annotations[key] ?? { parsing: '', syntax: '', translation: '' }
      const corr = corrections[key]
      summaryRows.push({
        ref: v.reference,
        surface: w.surface,
        lemma: w.lexeme?.lexeme ?? '',
        parsing: ann.parsing,
        syntax: ann.syntax,
        translation: ann.translation,
        corrParsing: corr?.parsing ?? '',
        corrSyntax: corr?.syntax ?? '',
        corrTranslation: corr?.translation ?? '',
      })
    }
  }

  // ── Lock / mode flags ──
  const isLocked = timerExpired || submitted              // stage 1 annotations locked
  const correctionLocked = reviewTimerExpired || submitted // stage 2 corrections locked
  const reviewMode = timerExpired                         // show 3-column reader layout

  // Show submit button when:
  // - in assignment mode and passage is loaded
  // - AND not yet submitted
  // - AND (there is no stage 1 timer, OR stage 1 has expired)
  const showSubmitButton = !!(propAssignmentId && loadedVerses.length > 0 && !submitted &&
    (!assignment?.timeLimitSeconds || timerExpired))

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
          </div>
          {submitted && (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
              ✓ Submitted
            </span>
          )}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="print:hidden bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-end gap-3">

        {/* Passage selectors — hidden in assignment mode (passage is fixed) */}
        {!propAssignmentId && (
          <>
            {/* Book */}
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-500 font-medium">Book</label>
              <select
                value={selectedBook?.osisId ?? ''}
                onChange={e => {
                  const b = books.find(bk => bk.osisId === e.target.value) ?? null
                  setSelectedBook(b)
                  setChapter(1)
                  setVerseStart(1)
                  setVerseEnd(1)
                }}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {books.map(b => (
                  <option key={b.osisId} value={b.osisId}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-500 font-medium">Chapter</label>
              <input
                type="number"
                min={1}
                max={selectedBook?.totalChapters ?? 1}
                value={chapter}
                onChange={e => { setChapter(Number(e.target.value)); setVerseStart(1); setVerseEnd(1) }}
                className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            {/* Verse range */}
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-500 font-medium">Verses</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={maxVerse}
                  value={verseStart}
                  onChange={e => setVerseStart(Number(e.target.value))}
                  className="w-14 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <span className="text-gray-400 text-sm">–</span>
                <input
                  type="number"
                  min={verseStart}
                  max={maxVerse}
                  value={verseEnd}
                  onChange={e => setVerseEnd(Number(e.target.value))}
                  className="w-14 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>

            <button
              onClick={loadPassage}
              disabled={isLoading || !selectedBook}
              className="self-end px-4 py-1.5 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {isLoading ? 'Loading…' : 'Load Passage'}
            </button>
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

        {/* Session title — hide in assignment mode (title comes from assignment) */}
        {!propAssignmentId && loadedVerses.length > 0 && (
          <input
            type="text"
            value={sessionTitle}
            onChange={e => setSessionTitle(e.target.value)}
            placeholder={passageTitle || 'Session title…'}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        )}

        {/* Saved sessions — hide in assignment mode */}
        {!propAssignmentId && (
          <div className="relative">
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

        {loadedVerses.length > 0 && (
          <button
            onClick={() => saveSession()}
            disabled={isSaving}
            className="self-end px-4 py-1.5 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {isSaving ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : '💾 Save'}
          </button>
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
          <button
            onClick={submitAssignment}
            disabled={isSubmitting || isSaving || correctionLocked}
            className="self-end flex items-center gap-1.5 px-5 py-1.5 bg-brand-600 text-white rounded-md text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isSubmitting ? 'Submitting…' : 'Submit for Grading'}
          </button>
        )}
        {propAssignmentId && submitted && (
          <button
            onClick={() => router.push('/student/assignments')}
            className="self-end px-4 py-1.5 border border-brand-300 text-brand-700 rounded-md text-sm font-medium hover:bg-brand-50 transition"
          >
            ← Back to Assignments
          </button>
        )}
      </div>

      {/* ── Main workspace ── */}
      {loadedVerses.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 print:hidden">
          <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-lg font-medium">Select a passage and click &ldquo;Load Passage&rdquo;</p>
          <p className="text-sm mt-1">Then click any Greek word to begin annotating</p>
        </div>
      )}

      {loadedVerses.length > 0 && (
        <div className={`flex gap-0 print:block min-h-0 ${reviewMode ? 'flex-row' : 'flex-col lg:flex-row'}`}>

          {/* ── Greek text pane ── */}
          <div className={`overflow-y-auto p-4 lg:p-6 print:overflow-visible ${reviewMode ? 'w-72 shrink-0 border-r border-gray-200' : 'flex-1'}`}>

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
              <div key={v.id} className="mb-6 print:mb-4">
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
              </div>
            ))}
          </div>

          {/* ── Annotation / Review panel (screen only) ── */}
          <div className={`print:hidden border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto flex flex-col gap-3 ${reviewMode ? 'flex-1' : 'lg:w-96'}`}>
            {!reviewMode && timerExpired && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 font-medium text-center">
                ⏰ Time is up — annotations are locked
              </div>
            )}
            {selectedWord ? (
              reviewMode ? (
                <ReviewAnnotationPanel
                  word={selectedWord.word}
                  verseNum={selectedWord.verse}
                  annotations={annotations}
                  corrections={corrections}
                  onCorrection={handleCorrectionChange}
                  locked={correctionLocked}
                />
              ) : (
                <AnnotationPanel
                  word={selectedWord.word}
                  verseNum={selectedWord.verse}
                  annotations={annotations}
                  onChange={handleAnnotationChange}
                  locked={isLocked}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-12">
                <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
                <p className="text-sm text-center">
                  {reviewMode ? 'Click a word to review and correct your analysis' : 'Click a word in the text\nto annotate it'}
                </p>
              </div>
            )}
          </div>

          {/* ── Passage Reader (review mode only, screen only) ── */}
          {reviewMode && (
            <div className="print:hidden w-80 shrink-0">
              <ReviewPassagePanel
                verses={loadedVerses}
                selectedWordKey={selectedWordKey}
                onWordClick={handleWordClick}
              />
            </div>
          )}

          {/* ── Print table ── */}
          <div className="hidden print:block w-full mt-6">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-1 pr-2 font-semibold w-24">Ref</th>
                  <th className="text-left py-1 pr-2 font-semibold w-28 font-greek">Word</th>
                  <th className="text-left py-1 pr-2 font-semibold w-28 font-greek">Lemma</th>
                  <th className="text-left py-1 pr-2 font-semibold">Parsing</th>
                  <th className="text-left py-1 pr-2 font-semibold">Syntax</th>
                  <th className="text-left py-1 font-semibold">Translation</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-1 pr-2 text-gray-500 text-xs align-top">{row.ref}</td>
                    <td className="py-1 pr-2 font-greek text-base align-top">{row.surface}</td>
                    <td className="py-1 pr-2 font-greek text-xs text-gray-600 align-top">{row.lemma}</td>
                    <td className="py-1 pr-2 text-xs align-top">
                      {row.parsing}
                      {row.corrParsing && <div className="text-red-600 font-medium">→ {row.corrParsing}</div>}
                    </td>
                    <td className="py-1 pr-2 text-xs align-top">
                      {row.syntax}
                      {row.corrSyntax && <div className="text-red-600 font-medium">→ {row.corrSyntax}</div>}
                    </td>
                    <td className="py-1 text-xs align-top">
                      {row.translation}
                      {row.corrTranslation && <div className="text-red-600 font-medium">→ {row.corrTranslation}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  )
}
