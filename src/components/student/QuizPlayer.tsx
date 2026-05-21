'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, RotateCcw, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { MORPH_OPTIONS } from '@/data/morphology-options'
import type { QuizQuestion, QuizResult } from '@/types/quiz'

interface QuizPlayerProps {
  assignmentId: string
  questions: QuizQuestion[]
  type: 'VOCABULARY_QUIZ' | 'MORPHOLOGY_QUIZ'
  timePerQuestion?: number | null
}

type Phase = 'answering' | 'feedback' | 'complete' | 'submitted'

// Accept any comma-separated alternative in the correct answer.
function isAnswerCorrect(studentAnswer: string, correctAnswer: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[.,;:!?]/g, '').trim()
  const student = norm(studentAnswer)
  if (!student) return false
  return correctAnswer.split(',').map(a => norm(a)).some(alt => alt === student)
}

export function QuizPlayer({ assignmentId, questions, type, timePerQuestion }: QuizPlayerProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState('')
  const [morphDraft, setMorphDraft] = useState<Record<string, string>>({})
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [clientCorrect, setClientCorrect] = useState<Record<string, boolean>>({})
  const [phase, setPhase] = useState<Phase>('answering')
  const [timeLeft, setTimeLeft] = useState<number | null>(timePerQuestion ?? null)
  const [timedOut, setTimedOut] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)

  const q = questions[idx]
  const total = questions.length
  const correctCount = Object.values(clientCorrect).filter(Boolean).length
  const answeredSoFar = Object.keys(clientCorrect).length

  // Focus text input when question changes
  useEffect(() => {
    if (phase === 'answering' && type === 'VOCABULARY_QUIZ') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [idx, phase])

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

  const handleCheck = useCallback((expired = false) => {
    const answer = expired
      ? ''
      : type === 'MORPHOLOGY_QUIZ'
        ? JSON.stringify(morphDraft)
        : draft

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
      } else {
        correct = isAnswerCorrect(answer, q.correctAnswer ?? '')
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
    try {
      const payload = questions.map(question => ({
        questionId: question.id,
        answer: answers[question.id] ?? '',
      }))
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, responses: payload, retake: false }),
      })
      const data = await res.json()
      setResult(data.result)
      setPhase('submitted')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetake() {
    setIdx(0)
    setDraft('')
    setMorphDraft({})
    setAnswers({})
    setClientCorrect({})
    setTimedOut(false)
    setPhase('answering')
    setTimeLeft(timePerQuestion ?? null)
    setResult(null)
  }

  // ── Timer bar ──────────────────────────────────────────────────────────────
  const timerPct = timePerQuestion && timeLeft !== null
    ? Math.round((timeLeft / timePerQuestion) * 100)
    : null

  const timerColour = timerPct === null ? '' : timerPct > 50 ? 'bg-brand-500' : timerPct > 20 ? 'bg-amber-500' : 'bg-red-500'

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

  // ── Complete screen ────────────────────────────────────────────────────────
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

        <div className="space-y-2">
          {questions.map(question => {
            const yours = answers[question.id] ?? ''
            const ok = clientCorrect[question.id] ?? false
            return (
              <div key={question.id} className={`p-3 rounded-xl border text-sm ${ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-2">
                  {ok ? <CheckCircle2 size={15} className="text-green-600 mt-0.5 shrink-0" /> : <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />}
                  <div>
                    <span className="font-greek text-base">{question.prompt}</span>
                    {yours ? (
                      <p className="mt-0.5">Your answer: <span className={ok ? 'text-green-700 font-medium' : 'text-red-600 line-through'}>{yours}</span></p>
                    ) : (
                      <p className="mt-0.5 text-gray-400 italic">No answer</p>
                    )}
                    {!ok && <p>Correct: <span className="text-green-700 font-medium">{question.correctAnswer}</span></p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} loading={submitting} className="flex items-center gap-2">
            <Send size={15} />
            Submit for Grading
          </Button>
          <Button variant="ghost" onClick={handleRetake} className="flex items-center gap-2">
            <RotateCcw size={15} />
            Retake Quiz
          </Button>
        </div>
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
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRetake} variant="ghost" className="flex items-center gap-2">
            <RotateCcw size={15} />
            Retake Quiz
          </Button>
          <Button variant="ghost" onClick={() => router.push('/student/assignments')}>
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

      {/* Question card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">

        {/* Timer display */}
        {timePerQuestion && phase === 'answering' && timeLeft !== null && (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${(timeLeft ?? 0) <= 5 ? 'text-red-600' : 'text-gray-400'}`}>
            <Clock size={12} />
            {timeLeft}s remaining
          </div>
        )}

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            {type === 'MORPHOLOGY_QUIZ' ? 'Identify the morphology' : 'Type the English meaning'}
          </p>
          <p className="font-greek text-3xl text-ink-900 leading-relaxed">{q?.prompt}</p>
        </div>

        {/* Vocabulary text input */}
        {type === 'VOCABULARY_QUIZ' && phase === 'answering' && (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) handleCheck() }}
            placeholder="Type the English meaning…"
            className="input w-full"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        )}

        {/* Morphology selects */}
        {type === 'MORPHOLOGY_QUIZ' && phase === 'answering' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'case', 'gender'] as const).map(field => {
              const opts = field === 'case' ? MORPH_OPTIONS.case : MORPH_OPTIONS[field as keyof typeof MORPH_OPTIONS]
              if (!Array.isArray(opts) || opts.length === 0) return null
              return (
                <Select
                  key={field}
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={morphDraft[field] ?? ''}
                  onChange={e => setMorphDraft(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder="—"
                  options={(opts as string[]).map(o => ({ value: o, label: o }))}
                />
              )
            })}
          </div>
        )}

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
                Your answer: <span className={clientCorrect[q.id] ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>{answers[q.id]}</span>
              </p>
            )}
            {!clientCorrect[q.id] && (
              <p className="text-sm text-gray-600">
                Correct answer: <span className="text-green-700 font-medium">{q.correctAnswer}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {phase === 'answering' ? (
          <>
            <span /> {/* spacer */}
            <Button
              onClick={() => handleCheck()}
              disabled={type === 'VOCABULARY_QUIZ' ? !draft.trim() : Object.keys(morphDraft).length === 0}
            >
              Check Answer
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-500">
              {correctCount} / {answeredSoFar} correct
            </span>
            <Button onClick={handleNext}>
              {idx < total - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
