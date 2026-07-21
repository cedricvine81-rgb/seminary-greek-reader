'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { X, Check, Send, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { ALL_SYNTAX_OPTIONS } from '@/data/syntax-categories'
import type { HomeworkWord } from '@/data/grammar-homework'

// Graded grammar homework (deck "Exercises A / B" as a Translation Exercise).
// Each sentence opens in a right-hand pane — the Translation Workbench layout —
// where the student enters parsing, syntax and translation per word plus a
// whole-sentence translation. Work autosaves locally on every change; Submit
// posts the attempt through the standard quiz API for instructor grading.
// No model answers are shown here — this is the graded variant.
//
// Two-round correction system (same convention as the passage exercises):
// dueDate is the Round 1 cut-off. When the instructor sets a round2Deadline,
// a correction window opens after the due date — the student revises their
// Round 1 answers (shown beneath each field) and submits corrections once.
// Corrections go to /api/grammar-homework, which stores them alongside the
// Round 1 answers so the grader sees both rounds.

interface HwQuestion {
  id: string
  prompt: string
  points: number
  words: HomeworkWord[]
  note?: string
  /** The student's Round 1 submission for this sentence, plus any Round 2 corrections. */
  prior?: {
    words: { parsing: string; syntax: string; gloss: string }[]
    translation: string
    r2?: { words: { parsing: string; syntax: string; gloss: string }[]; translation: string }
    r2At?: string
  }
}

interface WordEntry { parsing: string; syntax: string; gloss: string }
interface SentenceEntry { words: WordEntry[]; translation: string }

const SYNTAX_OPTS = Array.from(new Set(ALL_SYNTAX_OPTIONS)).map(o => ({ value: o, label: o }))
const emptyWord = (): WordEntry => ({ parsing: '', syntax: '', gloss: '' })

function storageKey(assignmentId: string) {
  return `grammar-homework-${assignmentId}`
}

export function GrammarHomework({ assignmentId, questions, attemptCount, dueDate, round2Deadline }: {
  assignmentId: string
  questions: HwQuestion[]
  attemptCount: number
  dueDate: string | null
  round2Deadline: string | null
}) {
  const router = useRouter()
  // Round phases (evaluated once per mount — a reload moves the clock on).
  const now = Date.now()
  const pastDue = !!dueDate && now > new Date(dueDate).getTime()
  const r2Done = questions.some(q => q.prior?.r2At)
  const [r2Submitted, setR2Submitted] = useState(false)
  const correctionOpen = !!round2Deadline && attemptCount > 0 && pastDue
    && now <= new Date(round2Deadline).getTime() && !r2Done && !r2Submitted
  // Seed each sentence from the student's last submission (server) where present —
  // Round 2 corrections when they exist, else Round 1 — padded to the current word
  // count; blank otherwise. Same-device localStorage edits (autosaved) override
  // this on mount.
  const [entries, setEntries] = useState<SentenceEntry[]>(() =>
    questions.map(q => {
      if (!q.prior) return { words: q.words.map(emptyWord), translation: '' }
      const base = q.prior.r2 ?? q.prior
      return { words: q.words.map((_, i) => base.words[i] ?? emptyWord()), translation: base.translation }
    }))
  const [open, setOpen] = useState<number | null>(null)
  const [wordIdx, setWordIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const hydrated = useRef(false)

  // Rounds autosave under separate keys so a stale Round 1 draft can never
  // leak into the correction window (and vice versa).
  const saveKey = storageKey(assignmentId) + (correctionOpen || r2Done || r2Submitted ? '-r2' : '')

  // Restore autosaved work (SSR-safe: after mount).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(saveKey)
      if (raw) {
        const saved = JSON.parse(raw) as SentenceEntry[]
        if (Array.isArray(saved) && saved.length === questions.length) setEntries(saved)
      }
    } catch { /* ignore */ }
    hydrated.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId])

  // Autosave on every change once hydrated.
  useEffect(() => {
    if (!hydrated.current) return
    try { localStorage.setItem(saveKey, JSON.stringify(entries)) } catch { /* ignore */ }
  }, [entries, saveKey])

  // Split view: shift the page content left while the pane is open (same
  // mechanism as the Translation Workbench / Master Search panes).
  useEffect(() => {
    if (open === null) return
    const root = document.documentElement
    root.setAttribute('data-workbench-panel', '1')
    root.style.setProperty('--workbench-panel-w', '30rem')
    return () => {
      root.removeAttribute('data-workbench-panel')
      root.style.removeProperty('--workbench-panel-w')
    }
  }, [open])

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const filledCount = (i: number) => {
    const e = entries[i]
    if (!e) return 0
    return e.words.filter(w => w.parsing.trim() || w.syntax || w.gloss.trim()).length
  }
  const sentenceDone = (i: number) =>
    entries[i] && entries[i].translation.trim() !== '' && filledCount(i) === questions[i].words.length
  const doneCount = useMemo(() => questions.map((_, i) => sentenceDone(i)).filter(Boolean).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries])

  function updateWord(si: number, wi: number, patch: Partial<WordEntry>) {
    setEntries(prev => prev.map((e, i) => i !== si ? e : {
      ...e, words: e.words.map((w, j) => j !== wi ? w : { ...w, ...patch }),
    }))
  }

  // One Round 1 submission (assignment is created with maxRetakes: 0); the
  // correction window re-opens the inputs for the one Round 2 submission.
  const locked = !correctionOpen && (attemptCount > 0 || submitted)

  async function submit() {
    if (locked) return
    const missing = questions.length - doneCount
    if (missing > 0 && !window.confirm(
      `${missing} of ${questions.length} sentences ${missing === 1 ? 'is' : 'are'} not fully answered. Submit anyway?`)) return
    setSubmitting(true); setError('')
    try {
      const res = correctionOpen
        ? await fetch('/api/grammar-homework', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assignmentId,
              corrections: questions.map((q, i) => ({
                questionId: q.id,
                words: entries[i].words,
                translation: entries[i].translation,
              })),
            }),
          })
        : await fetch('/api/quizzes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assignmentId,
              responses: questions.map((q, i) => ({
                questionId: q.id,
                answer: JSON.stringify({ words: entries[i].words, translation: entries[i].translation }),
              })),
            }),
          })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? 'Something went wrong — please try again.')
        return
      }
      if (correctionOpen) setR2Submitted(true)
      else setSubmitted(true)
      setOpen(null)
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'

  const q = open !== null ? questions[open] : null
  const entry = open !== null ? entries[open] : null
  const word = q ? q.words[wordIdx] : null
  const wordEntry = entry ? entry.words[wordIdx] : null

  // Deadline shown in banners: explicit fields (Safari-safe — no dateStyle).
  const fmt = (iso: string) => new Date(iso).toLocaleString(undefined,
    { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div className="space-y-4">
      {correctionOpen && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Round 2 — corrections open{round2Deadline && ` until ${fmt(round2Deadline)}`}.</p>
          <p className="mt-0.5 text-amber-800">
            Revise your answers below — your Round 1 submission is kept and shown to your instructor
            alongside your corrections. You get one corrections submission.
          </p>
        </div>
      )}
      {(r2Done || r2Submitted) && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="flex-none" />
          <span>Round 2 corrections submitted. Your instructor will grade both rounds together.</span>
        </div>
      )}
      {locked && !r2Done && !r2Submitted && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="flex-none" />
          <span>
            {round2Deadline && !pastDue
              ? <>Round 1 submitted. The correction round opens after the deadline and runs until {fmt(round2Deadline)} — you can revise your work then.</>
              : round2Deadline
                ? <>Submitted for grading.</>
                : <>Submitted for grading. This homework takes a single submission — no further changes can be made.</>}
          </span>
        </div>
      )}

      {/* Sentence list */}
      <div className="space-y-2">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            type="button"
            onClick={() => { setOpen(i); setWordIdx(0) }}
            className={clsx(
              'w-full rounded-xl border px-4 py-3 text-left transition-colors',
              open === i ? 'border-brand-400 bg-brand-50'
                : sentenceDone(i) ? 'border-green-200 bg-green-50/60 hover:border-brand-300'
                : 'border-gray-200 bg-surface hover:border-brand-300'
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-reading normal-case text-base text-gray-900">{i + 1}. {qq.prompt}</span>
              <span className="flex-none text-xs text-gray-400 inline-flex items-center gap-1.5">
                {sentenceDone(i)
                  ? <span className="text-green-700 inline-flex items-center gap-1"><Check size={12} /> complete</span>
                  : `${filledCount(i)}/${qq.words.length} words`}
                <ChevronRight size={14} />
              </span>
            </div>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500">
          {locked
            ? 'Your submission is shown above (read-only).'
            : correctionOpen
              ? `${doneCount}/${questions.length} sentences complete · autosaves on this device. One corrections submission — check your revisions before submitting.`
              : `${doneCount}/${questions.length} sentences complete · autosaves on this device. You get one submission — check your work before submitting.`}
        </p>
        {!locked && (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="btn btn-primary px-5 py-2 inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Send size={14} /> {submitting ? 'Submitting…' : correctionOpen ? 'Submit corrections' : 'Submit homework'}
          </button>
        )}
      </div>

      {/* Right-hand working pane */}
      {q && entry && word && wordEntry && (
        <div className="fixed inset-0 z-50 lg:inset-auto lg:top-14 lg:right-0 lg:z-30 lg:h-[calc(100vh-3.5rem)] lg:w-[30rem] flex flex-col bg-gray-50 border-l border-gray-200 shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-surface px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
                {correctionOpen ? 'Round 2 corrections' : 'Homework'} — sentence {open! + 1} of {questions.length}
              </p>
              <p className="truncate text-xs text-gray-500">
                {locked ? 'Submitted — read-only.'
                  : correctionOpen ? 'Revise each word — your Round 1 answers are shown beneath the fields.'
                  : 'Enter parsing, syntax and translation for each word, then translate the sentence.'}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(null)} title="Close"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X size={17} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {/* Interlinear chips (like the Exegesis syntax page): parsing above each Greek
                word, syntax + translation below — the analysis stays in view while working. */}
            <div className="flex flex-wrap items-end gap-1.5">
              {q.words.map((w, i) => {
                const we = entry.words[i]
                const filled = we.parsing.trim() || we.syntax || we.gloss.trim()
                return (
                  <button key={i} type="button" onClick={() => setWordIdx(i)}
                    className={clsx('flex flex-col items-center rounded-lg border px-2.5 py-1.5 transition-colors',
                      i === wordIdx ? 'border-brand-600 bg-brand-600'
                        : filled ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-surface hover:border-brand-300')}>
                    <span className={clsx('font-sans text-[10px] leading-tight whitespace-nowrap',
                      i === wordIdx ? 'text-brand-100' : 'text-gray-500')}>
                      {we.parsing || ' '}
                    </span>
                    <span className={clsx('font-reading text-lg leading-tight',
                      i === wordIdx ? 'text-white' : 'text-gray-800')}>
                      {w.w}
                    </span>
                    <span className={clsx('font-sans text-[10px] leading-tight whitespace-nowrap',
                      i === wordIdx ? 'text-brand-100' : 'text-gray-500')}>
                      {we.syntax || ' '}
                    </span>
                    <span className={clsx('font-sans text-[10px] italic leading-tight whitespace-nowrap',
                      i === wordIdx ? 'text-brand-50' : 'text-brand-700')}>
                      {we.gloss || ' '}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="rounded-xl border border-gray-200 bg-surface p-4 space-y-3">
              <p className="font-reading text-xl text-gray-900">{word.w}</p>
              {(() => {
                // During (and after) the correction round, show the Round 1
                // answer beneath each field for reference.
                const showR1 = (correctionOpen || r2Done || r2Submitted) && !!q.prior
                const r1 = showR1 ? q.prior!.words[wordIdx] : undefined
                const hint = (v?: string) => showR1 && (
                  <p className="mt-1 text-[11px] text-gray-400">Round 1: {v?.trim() ? v : '—'}</p>
                )
                return (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Parsing</label>
                      <input type="text" className={inputCls} disabled={locked}
                        placeholder="case, number, gender / tense, voice, mood… — lexical form"
                        value={wordEntry.parsing}
                        onChange={e => updateWord(open!, wordIdx, { parsing: e.target.value })} />
                      {hint(r1?.parsing)}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Syntax</label>
                      <Select value={wordEntry.syntax} disabled={locked}
                        onChange={e => updateWord(open!, wordIdx, { syntax: e.target.value })}
                        placeholder="Select syntax category…" options={SYNTAX_OPTS} />
                      {hint(r1?.syntax)}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Translation</label>
                      <input type="text" className={inputCls} disabled={locked} placeholder="Translate this word…"
                        value={wordEntry.gloss}
                        onChange={e => updateWord(open!, wordIdx, { gloss: e.target.value })} />
                      {hint(r1?.gloss)}
                    </div>
                  </>
                )
              })()}
              {wordIdx < q.words.length - 1 && (
                <button type="button" onClick={() => setWordIdx(i => i + 1)}
                  className="rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-brand-300 hover:text-brand-700">
                  Next word →
                </button>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-surface p-4 space-y-2">
              <label className="block text-xs font-medium text-gray-600">Now translate the whole sentence</label>
              <textarea rows={2} className={inputCls} disabled={locked} placeholder="Enter your translation…"
                value={entry.translation}
                onChange={e => setEntries(prev => prev.map((s, i) => i !== open ? s : { ...s, translation: e.target.value }))} />
              {(correctionOpen || r2Done || r2Submitted) && q.prior && (
                <p className="text-[11px] text-gray-400">Round 1: {q.prior.translation.trim() || '—'}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button type="button" disabled={open === 0}
                onClick={() => { setOpen(o => (o ?? 1) - 1); setWordIdx(0) }}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-40">
                ← Previous sentence
              </button>
              <button type="button" disabled={open === questions.length - 1}
                onClick={() => { setOpen(o => (o ?? 0) + 1); setWordIdx(0) }}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-40">
                Next sentence →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
