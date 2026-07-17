'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { MORPH_OPTIONS } from '@/data/morphology-options'
import { isAnswerCorrect, isMultipleChoiceCorrect } from '@/lib/answer-matching'
import type { QuizQuestion, QuizResult } from '@/types/quiz'

interface QuizPlayerProps {
  assignmentId: string
  questions: QuizQuestion[]
  type: 'VOCABULARY_QUIZ' | 'MORPHOLOGY_QUIZ'
  timePerQuestion?: number | null
  provideDefinition?: boolean
  maxRetakes?: number | null
  /** Vocab quizzes only: number of wrong-answer appeals the student is permitted per attempt. 0 = appeals off. */
  maxAppeals?: number
  /** If set (re-sampling quizzes), each attempt draws this many random questions from
   *  the stored pool — so retakes show a different selection of words. */
  questionsPerAttempt?: number
  attemptCount?: number
  bestPct?: number | null
}

type Phase = 'answering' | 'feedback' | 'complete' | 'submitted'

/** Returns true if the string contains any Greek Unicode characters */
function hasGreek(s: string | undefined | null): boolean {
  return /[Ͱ-Ͽἀ-῿]/.test(s ?? '')
}

/** Fisher–Yates shuffle (returns a new array). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Randomise a quiz for one attempt: shuffle the question order, shuffle the options
 *  within each multiple-choice question, and — when `perAttempt` is given and smaller
 *  than the pool — draw that many at random (so retakes show different words).
 *  Grading is by question id and whole-option match, so this only changes
 *  presentation, never correctness. */
function shuffleQuiz(qs: QuizQuestion[], perAttempt?: number): QuizQuestion[] {
  const shuffled = shuffle(qs).map(q =>
    Array.isArray(q.options) && q.options.length > 0
      ? { ...q, options: shuffle(q.options) }
      : q,
  )
  return perAttempt && perAttempt > 0 && perAttempt < shuffled.length
    ? shuffled.slice(0, perAttempt)
    : shuffled
}

/** Parse a correctAnswer string — handles plain text and JSON morphology objects */
function formatCorrectAnswer(ca: string): string {
  try {
    const obj = JSON.parse(ca)
    if (obj && typeof obj === 'object') {
      return Object.values(obj).filter(Boolean).join(', ')
    }
  } catch { /* not JSON — fall through */ }
  return ca
}


export function QuizPlayer({ assignmentId, questions, type, timePerQuestion, provideDefinition = false, maxRetakes = null, maxAppeals = 0, questionsPerAttempt, attemptCount: initialAttemptCount = 0, bestPct: initialBestPct = null }: QuizPlayerProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [attemptCount, setAttemptCount] = useState(initialAttemptCount)
  const [bestPct, setBestPct] = useState(initialBestPct)

  const maxAllowed = maxRetakes === null ? null : maxRetakes + 1
  const retakesUsed = Math.max(0, attemptCount - 1)
  const retakesRemaining = maxRetakes === null ? null : Math.max(0, maxRetakes - retakesUsed)
  const canRetake = maxAllowed === null || attemptCount < maxAllowed

  // Per-attempt randomised order (and shuffled MC options). Reshuffled on each retake
  // so the quiz is different every time. Grading is unaffected (keyed by question id).
  const [orderedQuestions, setOrderedQuestions] = useState<QuizQuestion[]>(() => shuffleQuiz(questions, questionsPerAttempt))
  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState('')
  const [morphDraft, setMorphDraft] = useState<Record<string, string>>({})
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [clientCorrect, setClientCorrect] = useState<Record<string, boolean>>({})
  const [phase, setPhase] = useState<Phase>('answering')
  const [timeLeft, setTimeLeft] = useState<number | null>(timePerQuestion ?? null)
  const [timedOut, setTimedOut] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  // Per-response appeal status (after submit): which responseIds the student has appealed.
  const [appealedIds, setAppealedIds] = useState<Set<string>>(new Set())
  const [appealError, setAppealError] = useState<string | null>(null)
  // Mid-quiz "Appeal this answer" intent: the questionIds marked for appeal.
  // Actual appeals are POSTed after the quiz submits (responseIds don't exist mid-quiz).
  const [markedForAppeal, setMarkedForAppeal] = useState<Set<string>>(new Set())

  // Guard against an empty question set (e.g. quiz created but no questions
  // generated yet). The rest of the component assumes `q` is defined.
  if (questions.length === 0) {
    return (
      <div className="max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-8 text-center space-y-2">
        <p className="text-base font-semibold text-amber-900">This quiz has no questions yet.</p>
        <p className="text-sm text-amber-800">
          Open the assignment&rsquo;s builder and click <strong>Generate Questions</strong>, then return here.
        </p>
      </div>
    )
  }

  const q = orderedQuestions[idx]
  const total = orderedQuestions.length
  const correctCount = Object.values(clientCorrect).filter(Boolean).length
  const answeredSoFar = Object.keys(clientCorrect).length

  // Focus text input when question changes
  useEffect(() => {
    if (phase === 'answering' && type === 'VOCABULARY_QUIZ') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [idx, phase])

  // Auto-advance after feedback for multiple-choice questions only (per-question, so
  // MC items in a mixed quiz still auto-advance; typed items keep the Next button)
  useEffect(() => {
    if (phase !== 'feedback') return
    const isMultipleChoice = q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.options) && q.options.length > 0
    if (!isMultipleChoice) return // keep "Next" button for typed answers
    const t = setTimeout(() => handleNext(), 1200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Reset timer when entering a new question
  useEffect(() => {
    if (phase === 'answering' && timePerQuestion) {
      setTimeLeft(timePerQuestion)
    }
  }, [idx, phase])

  // Countdown
  useEffect(() => {
    if (phase !== 'answering' || timeLeft === null) return
    if (timeLeft <= 0) {
      handleCheck(true)
      return
    }
    const id = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft, phase])

  const handleCheck = useCallback((expired = false, override?: string) => {
    let morphAnswer = morphDraft
    // Auto-include partOfSpeech from correct answer for focused parse questions
    if (!expired && type === 'MORPHOLOGY_QUIZ' && q.type !== 'MULTIPLE_CHOICE') {
      try {
        const correctObj = JSON.parse(q.correctAnswer ?? '{}')
        if (correctObj.partOfSpeech && !morphDraft.partOfSpeech) {
          morphAnswer = { ...morphDraft, partOfSpeech: correctObj.partOfSpeech }
        }
      } catch {}
    }
    const answer = expired
      ? ''
      : type === 'MORPHOLOGY_QUIZ'
        ? JSON.stringify(morphAnswer)
        : (override ?? draft)

    let correct = false
    if (!expired && answer) {
      if (type === 'MORPHOLOGY_QUIZ') {
        try {
          const correctObj = JSON.parse(q.correctAnswer ?? '{}')
          const studentObj = JSON.parse(answer)
          const fields = Object.keys(correctObj).filter(k => correctObj[k])
          correct = fields.length > 0 && fields.every(
            k => studentObj[k]?.toLowerCase() === correctObj[k]?.toLowerCase()
          )
        } catch { correct = false }
      } else if (q.type === 'MULTIPLE_CHOICE') {
        // Whole-option match — never comma-split (a gloss may contain a comma)
        correct = isMultipleChoiceCorrect(answer, q.correctAnswer ?? '')
      } else {
        // Augment with curated lemma synonyms (kept in sync with the server's grader)
        const acceptable = q.acceptedAnswers && q.acceptedAnswers.length > 0
          ? [q.correctAnswer ?? '', ...q.acceptedAnswers].filter(Boolean).join(',')
          : q.correctAnswer ?? ''
        correct = isAnswerCorrect(answer, acceptable, provideDefinition)
      }
    }

    setAnswers(prev => ({ ...prev, [q.id]: answer }))
    setClientCorrect(prev => ({ ...prev, [q.id]: correct }))
    setTimedOut(expired)
    setTimeLeft(null)
    setPhase('feedback')
  }, [draft, morphDraft, q, type])

  function handleNext() {
    if (idx < total - 1) {
      setIdx(i => i + 1)
      setDraft('')
      setMorphDraft({})
      setTimedOut(false)
      setPhase('answering')
      if (timePerQuestion) setTimeLeft(timePerQuestion)
    } else {
      setPhase('complete')
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      // Submit only the questions actually shown this attempt (the sampled subset),
      // so grading scores out of what the student saw.
      const payload = orderedQuestions.map(question => ({
        questionId: question.id,
        answer: answers[question.id] ?? '',
      }))
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, responses: payload, retake: false }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.result) {
        // Keep the student's answers intact and let them retry — never silently lose work
        setSubmitError(data?.error || 'Submission failed. Your answers are saved locally — please try again.')
        return
      }
      setResult(data.result)
      setPhase('submitted')
      setAttemptCount(data.result.attemptNumber)
      if (data.result.isNewBest) setBestPct(data.result.percentage)

      // Submit any mid-quiz "marked for appeal" intents. The breakdown now has
      // responseIds, so we can POST each appeal against the actual Response row.
      if (markedForAppeal.size > 0 && Array.isArray(data.result.breakdown)) {
        const breakdownByQuestion = new Map<string, { responseId?: string; isCorrect: boolean }>(
          data.result.breakdown.map((b: { questionId: string; responseId?: string; isCorrect: boolean }) => [b.questionId, b]),
        )
        const submitted = new Set<string>(appealedIds)
        const intents: string[] = []
        markedForAppeal.forEach(qid => intents.push(qid))
        for (const qid of intents) {
          const item = breakdownByQuestion.get(qid)
          if (!item?.responseId || item.isCorrect) continue
          try {
            const r = await fetch('/api/appeals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ responseId: item.responseId }),
            })
            if (r.ok) submitted.add(item.responseId)
          } catch { /* best-effort; user can still appeal via the submitted screen */ }
        }
        setAppealedIds(submitted)
      }
    } catch {
      setSubmitError('Network error — your answers are saved locally. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetake() {
    setOrderedQuestions(shuffleQuiz(questions, questionsPerAttempt))  // fresh random draw for the new attempt
    setIdx(0)
    setDraft('')
    setMorphDraft({})
    setAnswers({})
    setClientCorrect({})
    setTimedOut(false)
    setPhase('answering')
    setTimeLeft(timePerQuestion ?? null)
    setResult(null)
    setAppealedIds(new Set())
    setAppealError(null)
    setMarkedForAppeal(new Set())
  }

  /** Submit an appeal for a single wrong response (vocab quiz only). */
  async function handleAppeal(responseId: string) {
    setAppealError(null)
    try {
      const res = await fetch('/api/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAppealError(data.error ?? 'Could not submit appeal.')
        return
      }
      setAppealedIds(prev => new Set(prev).add(responseId))
    } catch {
      setAppealError('Network error — please try again.')
    }
  }

  // ── Auto-submit when all questions are answered ──
  // Prevents work from being lost if the student closes the tab before clicking Submit.
  useEffect(() => {
    if (phase === 'complete') {
      handleSubmit()
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer bar ──────────────────────────────────────────────────────────────
  const timerPct = timePerQuestion && timeLeft !== null
    ? Math.round((timeLeft / timePerQuestion) * 100)
    : null

  const timerColour = timerPct === null ? '' : timerPct > 50 ? 'bg-brand-500' : timerPct > 20 ? 'bg-amber-500' : 'bg-red-500'

  // ── Attempts indicator ────────────────────────────────────────────────────
  function AttemptsIndicator() {
    if (attemptCount === 0 && maxRetakes === null) return null
    return (
      <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
        <span>
          {attemptCount === 0
            ? 'First attempt'
            : `Attempt ${attemptCount + 1} of ${maxAllowed ?? '∞'}`}
          {bestPct !== null && (
            <span className="ml-2 text-brand-700 font-semibold">Best: {bestPct}%</span>
          )}
        </span>
        {maxRetakes !== null && (
          <span className={retakesRemaining === 0 ? 'text-red-500 font-medium' : 'text-gray-500'}>
            {retakesRemaining === 0 ? 'No retakes remaining' : `${retakesRemaining} retake${retakesRemaining === 1 ? '' : 's'} remaining`}
          </span>
        )}
      </div>
    )
  }

  // ── Running score chip ─────────────────────────────────────────────────────
  function RunningScore() {
    if (answeredSoFar === 0) return null
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
        <span className="text-green-600 font-bold">{correctCount}</span>
        <span>/</span>
        <span>{answeredSoFar}</span>
        <span>correct so far</span>
      </div>
    )
  }

  // ── Complete screen (brief — auto-submit fires immediately) ──────────────
  // Correct answers are intentionally withheld here; they appear on the submitted
  // screen once the attempt is committed to the database.
  if (phase === 'complete') {
    const finalPct = total > 0 ? Math.round((correctCount / total) * 100) : 0
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="text-center py-8 border border-gray-100 rounded-2xl bg-gray-50">
          <p className={`text-5xl font-bold ${finalPct >= 70 ? 'text-green-600' : 'text-red-600'}`}>
            {finalPct}%
          </p>
          <p className="text-gray-600 mt-1">{correctCount} / {total} correct</p>
        </div>

        {submitError ? (
          <div className="space-y-3 text-center py-2">
            <p className="text-sm text-red-600">{submitError}</p>
            <Button onClick={handleSubmit} loading={submitting} variant="primary">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-2 text-sm text-gray-500 py-4">
            <svg className="animate-spin w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Submitting…
          </div>
        )}
      </div>
    )
  }

  // ── Submitted screen ───────────────────────────────────────────────────────
  if (phase === 'submitted' && result) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="text-center py-8 border border-gray-100 rounded-2xl bg-gray-50">
          <CheckCircle2 size={40} className="text-green-500 mx-auto mb-2" />
          <p className="text-4xl font-bold text-brand-700">{result.percentage}%</p>
          <p className="text-gray-600 mt-1">{result.correctAnswers} / {result.totalQuestions} correct — submitted for grading</p>
          {result.isNewBest ? (
            <p className="text-xs text-green-600 mt-1 font-medium">New best score!</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">Best score: {bestPct}%</p>
          )}
          {maxRetakes !== null && (
            <p className="text-xs text-gray-500 mt-2">
              Attempt {attemptCount} of {maxAllowed} ·{' '}
              {retakesRemaining === 0 ? 'No retakes remaining' : `${retakesRemaining} retake${retakesRemaining === 1 ? '' : 's'} remaining`}
            </p>
          )}
        </div>

        {/* Per-question breakdown — shown here (after commit) so correct answers
            are only visible once the attempt is recorded in the database */}
        {result.breakdown && result.breakdown.length > 0 && (
          <div className="space-y-2">
            {(() => {
              const appealsEnabled = type === 'VOCABULARY_QUIZ' && maxAppeals > 0
              const usedAppeals = appealedIds.size
              const remainingAppeals = Math.max(0, maxAppeals - usedAppeals)
              return (
                <>
                  {appealsEnabled && (
                    <p className="text-xs text-gray-500">
                      Think a wrong answer should have counted? You may appeal up to{' '}
                      <span className="font-semibold">{maxAppeals}</span> answer{maxAppeals === 1 ? '' : 's'} per attempt.
                      {usedAppeals > 0 && <> ({remainingAppeals} remaining)</>}
                    </p>
                  )}
                  {result.breakdown.map(b => {
                    const canAppealThis = appealsEnabled
                      && !b.isCorrect
                      && !!b.responseId
                      && !appealedIds.has(b.responseId)
                      && !!b.yourAnswer
                      && remainingAppeals > 0
                    const alreadyAppealed = b.responseId && appealedIds.has(b.responseId)
                    return (
                      <div key={b.questionId} className={`p-3 rounded-xl border text-sm ${b.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-start gap-2">
                          {b.isCorrect
                            ? <CheckCircle2 size={15} className="text-green-600 mt-0.5 shrink-0" />
                            : <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <span className={`${hasGreek(b.prompt) ? 'font-greek' : ''} text-base`}>{b.prompt}</span>
                            {b.yourAnswer ? (
                              <p className="mt-0.5">Your answer: <span className={`${hasGreek(b.yourAnswer) ? 'font-greek' : ''} ${b.isCorrect ? 'text-green-700 font-medium' : 'text-red-600 line-through'}`}>{b.yourAnswer}</span></p>
                            ) : (
                              <p className="mt-0.5 text-gray-400 italic">No answer</p>
                            )}
                            {!b.isCorrect && (
                              <p>Correct: <span className={`${hasGreek(b.correctAnswer) ? 'font-greek' : ''} text-green-700 font-medium`}>{formatCorrectAnswer(b.correctAnswer)}</span></p>
                            )}
                            {appealsEnabled && !b.isCorrect && !!b.responseId && (
                              <div className="mt-2">
                                {alreadyAppealed ? (
                                  <span className="text-xs text-amber-700 font-medium">⏳ Appeal submitted — awaiting instructor review.</span>
                                ) : canAppealThis ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAppeal(b.responseId!)}
                                    className="text-xs font-medium text-red-700 hover:text-red-900 hover:underline"
                                  >
                                    Appeal this answer
                                  </button>
                                ) : remainingAppeals === 0 ? (
                                  <span className="text-xs text-gray-400">No appeals remaining for this attempt.</span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {appealError && (
                    <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{appealError}</p>
                  )}
                </>
              )
            })()}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          {canRetake && (
            <Button onClick={handleRetake} variant="ghost" className="flex items-center gap-2">
              <RotateCcw size={15} />
              Retake Quiz
            </Button>
          )}
          <Button variant="ghost" onClick={() => { router.push('/student/assignments'); router.refresh() }}>
            Back to Assignments
          </Button>
        </div>
      </div>
    )
  }

  // ── Quiz question ──────────────────────────────────────────────────────────
  const progressPct = Math.round((idx / total) * 100)

  return (
    <div className="space-y-5 max-w-2xl">

      <AttemptsIndicator />

      {/* Progress + running score */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Question {idx + 1} of {total}</span>
          <div className="flex items-center gap-3">
            <RunningScore />
            <span>{progressPct}%</span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-brand-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }} />
        </div>

        {/* Timer bar */}
        {timerPct !== null && phase === 'answering' && (
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${timerColour}`}
              style={{ width: `${timerPct}%` }} />
          </div>
        )}
      </div>

      {/* Question card — vocab quizzes get a stable min-height so the card doesn't
          grow/shrink between a short typed question and a tall 4-option multiple-choice
          one. This keeps the prompt and the Check/Next buttons in a fixed position as
          the student advances (especially important on a phone). */}
      <div className={`bg-surface rounded-xl border border-gray-100 p-6 space-y-5${type === 'VOCABULARY_QUIZ' ? ' min-h-[22rem]' : ''}`}>

        {/* Timer display */}
        {timePerQuestion && phase === 'answering' && timeLeft !== null && (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${(timeLeft ?? 0) <= 5 ? 'text-red-600' : 'text-gray-400'}`}>
            <Clock size={12} />
            {timeLeft}s remaining
          </div>
        )}

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            {type === 'MORPHOLOGY_QUIZ'
              ? 'Identify the morphology'
              : q.type === 'ENGLISH_TO_GREEK'
                ? 'Write the Greek word'
                : q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.options) && q.options.length > 0
                  ? 'Choose the correct definition'
                  : 'Write the English meaning'}
          </p>
          <p className={`${hasGreek(q?.prompt) ? 'font-greek' : ''} text-3xl text-ink-900 leading-relaxed`}>{q?.prompt}</p>
        </div>

        {/* Vocabulary questions — rendering is per-question so MIXED quizzes work:
            a question is multiple-choice iff its own type is MULTIPLE_CHOICE and it
            carries options. Open-ended (typed) questions are generated with no
            options, so they always render as a text box regardless of the quiz-level
            provideDefinition flag. */}
        {type === 'VOCABULARY_QUIZ' && phase === 'answering' && (() => {
          const hasOptions = Array.isArray(q.options) && q.options.length > 0
          const isMultipleChoice = q.type === 'MULTIPLE_CHOICE' && hasOptions

          if (isMultipleChoice) {
            // Multiple-choice: tap a button
            // Detect Greek options (English→Greek questions have Greek words as options)
            const optionsAreGreek = q.options!.some(o => hasGreek(o))
            return (
              <div className="grid grid-cols-1 gap-2">
                {q.options!.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setDraft(opt); handleCheck(false, opt) }}
                    className={`text-left px-4 py-3 rounded-lg border border-gray-200 bg-surface hover:border-brand-400 hover:bg-brand-50 text-sm transition-colors${optionsAreGreek ? ' font-greek text-base' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )
          }

          // Open-ended: student types their answer
          const placeholder = q.type === 'ENGLISH_TO_GREEK'
            ? 'Type the Greek word…'
            : 'Type the English meaning…'
          return (
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) handleCheck() }}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          )
        })()}

        {/* Morphology: multiple-choice (Conditionals / Subjunctive uses) */}
        {type === 'MORPHOLOGY_QUIZ' && q.type === 'MULTIPLE_CHOICE' && phase === 'answering' && (
          <div className="grid grid-cols-1 gap-2">
            {(q.options ?? []).map(opt => (
              <button
                key={opt}
                onClick={() => { setDraft(opt); handleCheck(false, opt) }}
                className="text-left px-4 py-3 rounded-lg border border-gray-200 bg-surface hover:border-brand-400 hover:bg-brand-50 text-sm transition-colors"
              >
                {/* Morphology MC options are never Greek — no font-greek needed */}
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Morphology: parsing dropdowns (Verbs / Nouns / Adjectives / Pronouns) */}
        {type === 'MORPHOLOGY_QUIZ' && q.type !== 'MULTIPLE_CHOICE' && phase === 'answering' && (() => {
          // Determine which fields are required from the correct answer
          let correctObj: Record<string, string | null> = {}
          try { correctObj = JSON.parse(q.correctAnswer ?? '{}') } catch {}
          const pos = correctObj.partOfSpeech
          // Fields to show as dropdowns (non-null fields except partOfSpeech which is shown as label)
          const FIELD_MAP: Record<string, { label: string; optsKey: keyof typeof MORPH_OPTIONS | 'case' }> = {
            tense:  { label: 'Tense',  optsKey: 'tense'  },
            voice:  { label: 'Voice',  optsKey: 'voice'  },
            mood:   { label: 'Mood',   optsKey: 'mood'   },
            person: { label: 'Person', optsKey: 'person' },
            number: { label: 'Number', optsKey: 'number' },
            casus:  { label: 'Case',   optsKey: 'case'   },
            gender: { label: 'Gender', optsKey: 'gender' },
          }
          const activeFields = Object.keys(FIELD_MAP).filter(f => correctObj[f])
          const requiredFilled = activeFields.every(f => morphDraft[f])
          return (
            <div className="space-y-4">
              {pos && (
                <p className="text-sm text-gray-500">
                  Parse this <span className="font-semibold text-brand-700">{pos}</span>:
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeFields.map(field => {
                  const { label, optsKey } = FIELD_MAP[field]
                  const opts = optsKey === 'case' ? MORPH_OPTIONS.case : MORPH_OPTIONS[optsKey as keyof typeof MORPH_OPTIONS]
                  if (!Array.isArray(opts)) return null
                  return (
                    <Select
                      key={field}
                      label={label}
                      value={morphDraft[field] ?? ''}
                      onChange={e => setMorphDraft(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder="—"
                      options={(opts as string[]).map(o => ({ value: o, label: o }))}
                    />
                  )
                })}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => {
                  // Merge partOfSpeech into draft before checking
                  if (pos) setMorphDraft(prev => ({ ...prev, partOfSpeech: pos }))
                  handleCheck()
                }} disabled={!requiredFilled}>
                  Check Answer
                </Button>
              </div>
            </div>
          )
        })()}

        {/* Feedback */}
        {phase === 'feedback' && (
          <div className={`rounded-xl p-4 space-y-2 ${clientCorrect[q.id] ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {clientCorrect[q.id]
                ? <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                : <XCircle size={18} className="text-red-500 shrink-0" />
              }
              <span className={`text-sm font-semibold ${clientCorrect[q.id] ? 'text-green-700' : 'text-red-600'}`}>
                {timedOut ? 'Time\'s up!' : clientCorrect[q.id] ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            {answers[q.id] && (
              <p className="text-sm text-gray-600">
                Your answer: <span className={`${hasGreek(answers[q.id]) ? 'font-greek' : ''} ${clientCorrect[q.id] ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}`}>{answers[q.id]}</span>
              </p>
            )}
            {!clientCorrect[q.id] && (
              <p className="text-sm text-gray-600">
                Correct answer: <span className={`${hasGreek(q.correctAnswer) ? 'font-greek' : ''} text-green-700 font-medium`}>{formatCorrectAnswer(q.correctAnswer ?? '')}</span>
              </p>
            )}
            {/* Mid-quiz appeal control — vocab quizzes only, when appeals are enabled and budget remains. */}
            {!clientCorrect[q.id]
              && type === 'VOCABULARY_QUIZ'
              && maxAppeals > 0
              && (answers[q.id]?.trim() ?? '') !== ''
              && (() => {
                const isMarked = markedForAppeal.has(q.id)
                const remaining = Math.max(0, maxAppeals - markedForAppeal.size)
                if (isMarked) {
                  return (
                    <p className="text-xs text-amber-700 font-medium pt-1">
                      ✓ Marked for appeal — will be submitted when you finish the quiz.
                    </p>
                  )
                }
                if (remaining === 0) {
                  return (
                    <p className="text-xs text-gray-500 pt-1">No appeals remaining for this attempt.</p>
                  )
                }
                return (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setMarkedForAppeal(prev => new Set(prev).add(q.id))}
                      className="text-xs font-medium text-red-700 hover:text-red-900 hover:underline"
                    >
                      Appeal this answer
                    </button>
                    <span className="ml-2 text-xs text-gray-400">
                      {remaining} of {maxAppeals} appeal{maxAppeals === 1 ? '' : 's'} remaining
                    </span>
                  </div>
                )
              })()}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {phase === 'answering' ? (
          <>
            <span /> {/* spacer */}
            {/* Show "Check Answer" for open-ended vocab (not multiple choice) and morphology (non-MC) */}
            {(() => {
              const isVocabMC = type === 'VOCABULARY_QUIZ' && q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.options) && q.options.length > 0
              const isMorphMC = type === 'MORPHOLOGY_QUIZ' && q.type === 'MULTIPLE_CHOICE'
              // Multiple-choice questions self-submit on click — no button needed
              if (isVocabMC || isMorphMC) return null
              const disabled = type === 'VOCABULARY_QUIZ'
                ? !draft.trim()
                : Object.keys(morphDraft).length === 0
              return (
                <Button onClick={() => handleCheck()} disabled={disabled}>
                  Check Answer
                </Button>
              )
            })()}
          </>
        ) : (
          <>
            <span className="text-sm text-gray-500">
              {correctCount} / {answeredSoFar} correct
            </span>
            {/* Only show the Next button for typed/open-ended answers; multiple-choice auto-advances (per-question) */}
            {(q.type !== 'MULTIPLE_CHOICE' || !(Array.isArray(q.options) && q.options.length > 0)) ? (
              <Button onClick={handleNext}>
                {idx < total - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            ) : (
              <span className="text-xs text-gray-400 animate-pulse">
                {idx < total - 1 ? 'Next…' : 'Finishing…'}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
