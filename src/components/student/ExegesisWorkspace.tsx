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

function AnnotationPanel({
  word,
  verseNum,
  annotations,
  onChange,
}: {
  word: VerseWord
  verseNum: number
  annotations: AnnotationMap
  onChange: (key: string, field: keyof WordAnnotation, value: string) => void
}) {
  const key = wordKey(verseNum, word.id)
  const ann = annotations[key] ?? { parsing: '', syntax: '', translation: '' }
  const autoparse = formatParse(word)

  return (
    <div className="flex flex-col gap-3">
      {/* Word header */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-greek text-indigo-700">{word.surface}</span>
        <span className="text-sm text-gray-500 italic">{word.lexeme?.lexeme}</span>
        {word.lexeme?.gloss && (
          <span className="text-sm text-gray-400">&ldquo;{word.lexeme.gloss}&rdquo;</span>
        )}
      </div>

      {/* Parsing */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Parsing
        </label>
        <input
          type="text"
          value={ann.parsing}
          placeholder={autoparse || 'e.g. Verb, Present Active Indicative 3sg'}
          onChange={e => onChange(key, 'parsing', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {autoparse && (
          <button
            type="button"
            onClick={() => onChange(key, 'parsing', autoparse)}
            className="mt-1 text-xs text-indigo-500 hover:text-indigo-700 underline"
          >
            Use auto-parsed: {autoparse}
          </button>
        )}
      </div>

      {/* Syntax */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Syntax / Function
        </label>
        <input
          type="text"
          value={ann.syntax}
          placeholder="e.g. Subject, Direct object, Temporal ptc."
          onChange={e => onChange(key, 'syntax', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Translation */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Translation Contribution
        </label>
        <input
          type="text"
          value={ann.translation}
          placeholder="e.g. he believed / the love of God"
          onChange={e => onChange(key, 'translation', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
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
        setAssignment({ id: a.id, title: a.title, reference: a.reference ?? null, instructions: a.instructions ?? null })

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
          setSessionId(sess.id)
          setSessionTitle(sess.title)
          if (sess.submittedAt) setSubmitted(true)
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
          body: JSON.stringify({ annotations, title: resolvedTitle }),
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
    const payload = { annotations }
    await fetch(`/api/exegesis/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
  }> = []
  for (const v of loadedVerses) {
    for (const w of v.words) {
      const key = wordKey(v.verse, w.id)
      const ann = annotations[key] ?? { parsing: '', syntax: '', translation: '' }
      summaryRows.push({
        ref: v.reference,
        surface: w.surface,
        lemma: w.lexeme?.lexeme ?? '',
        parsing: ann.parsing,
        syntax: ann.syntax,
        translation: ann.translation,
      })
    }
  }

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
        <div className="print:hidden bg-indigo-50 border-b border-indigo-200 px-4 py-3 flex items-start gap-3">
          <span className="text-2xl mt-0.5">📜</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-900">{assignment.title}</p>
            {assignment.reference && (
              <p className="text-xs text-indigo-700 mt-0.5">Passage: {assignment.reference}</p>
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
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                  className="w-14 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="text-gray-400 text-sm">–</span>
                <input
                  type="number"
                  min={verseStart}
                  max={maxVerse}
                  value={verseEnd}
                  onChange={e => setVerseEnd(Number(e.target.value))}
                  className="w-14 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <button
              onClick={loadPassage}
              disabled={isLoading || !selectedBook}
              className="self-end px-4 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
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

        {/* Session title — hide in assignment mode (title comes from assignment) */}
        {!propAssignmentId && loadedVerses.length > 0 && (
          <input
            type="text"
            value={sessionTitle}
            onChange={e => setSessionTitle(e.target.value)}
            placeholder={passageTitle || 'Session title…'}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
            className="self-end px-4 py-1.5 bg-gray-700 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition"
          >
            🖨 Export PDF
          </button>
        )}

        {/* Submit assignment button */}
        {propAssignmentId && loadedVerses.length > 0 && !submitted && (
          <button
            onClick={submitAssignment}
            disabled={isSubmitting || isSaving}
            className="self-end px-5 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Submitting…' : '✓ Submit Assignment'}
          </button>
        )}
        {propAssignmentId && submitted && (
          <button
            onClick={() => router.push('/student/assignments')}
            className="self-end px-4 py-1.5 border border-indigo-300 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-50 transition"
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
        <div className="flex flex-col lg:flex-row gap-0 print:block min-h-0">

          {/* ── Greek text pane ── */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 print:overflow-visible">

            {/* Print: passage header */}
            <div className="hidden print:block mb-4">
              <h2 className="text-xl font-semibold">{passageTitle}</h2>
            </div>

            {loadedVerses.map(v => (
              <div key={v.id} className="mb-6 print:mb-4">
                {/* Verse reference */}
                <p className="text-xs text-gray-400 font-medium mb-2 print:mb-1">{v.reference}</p>
                {/* Words */}
                <div className="flex flex-wrap gap-1.5 leading-loose">
                  {v.words.map(w => {
                    const key = wordKey(v.verse, w.id)
                    const hasAnn = annotations[key] &&
                      (annotations[key].parsing || annotations[key].syntax || annotations[key].translation)
                    const isSelected = selectedWordKey === key
                    return (
                      <button
                        key={w.id}
                        onClick={() => handleWordClick(w, v.verse)}
                        className={[
                          'px-1.5 py-0.5 rounded text-xl font-greek transition print:cursor-default print:border-b print:border-dotted print:border-gray-400',
                          isSelected
                            ? 'bg-indigo-100 text-indigo-800 ring-2 ring-indigo-400 print:bg-transparent print:ring-0'
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

          {/* ── Annotation panel (screen only) ── */}
          <div className="print:hidden lg:w-96 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            {selectedWord ? (
              <AnnotationPanel
                word={selectedWord.word}
                verseNum={selectedWord.verse}
                annotations={annotations}
                onChange={handleAnnotationChange}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
                <p className="text-sm text-center">Click a word in the text<br />to annotate it</p>
              </div>
            )}
          </div>

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
                    <td className="py-1 pr-2 text-xs align-top">{row.parsing}</td>
                    <td className="py-1 pr-2 text-xs align-top">{row.syntax}</td>
                    <td className="py-1 text-xs align-top">{row.translation}</td>
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
