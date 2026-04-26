'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { MORPH_OPTIONS } from '@/data/morphology-options'
import type { QuizQuestion, QuizResult } from '@/types/quiz'

interface QuizPlayerProps {
  assignmentId: string
  questions: QuizQuestion[]
  type: 'VOCABULARY_QUIZ' | 'MORPHOLOGY_QUIZ'
}

export function QuizPlayer({ assignmentId, questions, type }: QuizPlayerProps) {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [morphAnswers, setMorphAnswers] = useState<Record<string, Record<string, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)

  const q = questions[idx]
  const total = questions.length

  function setAnswer(value: string) {
    setAnswers(prev => ({ ...prev, [q.id]: value }))
  }

  function setMorphField(field: string, value: string) {
    setMorphAnswers(prev => ({
      ...prev,
      [q.id]: { ...(prev[q.id] ?? {}), [field]: value },
    }))
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const payload = questions.map(question => ({
        questionId: question.id,
        answer: type === 'MORPHOLOGY_QUIZ'
          ? JSON.stringify(morphAnswers[question.id] ?? {})
          : (answers[question.id] ?? ''),
      }))
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, responses: payload }),
      })
      const data = await res.json()
      setResult(data.result)
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted && result) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-4xl font-bold text-brand-700">{result.percentage}%</p>
          <p className="text-gray-600 mt-1">{result.correctAnswers} / {result.totalQuestions} correct</p>
        </div>
        <div className="space-y-2">
          {result.breakdown.map(item => (
            <div key={item.questionId} className={`p-3 rounded-lg border text-sm ${item.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="font-medium greek-text">{item.prompt}</p>
              <p>Your answer: <span className={item.isCorrect ? 'text-green-700' : 'text-red-700'}>{item.yourAnswer}</span></p>
              {!item.isCorrect && <p>Correct: <span className="text-green-700">{item.correctAnswer}</span></p>}
            </div>
          ))}
        </div>
        <Button onClick={() => router.push('/student/assignments')}>Back to Assignments</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Question {idx + 1} of {total}</span>
          <span>{Math.round(((idx) / total) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${((idx) / total) * 100}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
          {type === 'MORPHOLOGY_QUIZ' ? 'Identify the morphology' : 'Select the correct answer'}
        </p>
        <p className="greek-text text-2xl text-gray-900 mb-6">{q.prompt}</p>

        {type === 'VOCABULARY_QUIZ' && q.options && q.options.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map(opt => (
              <button
                key={opt}
                onClick={() => setAnswer(opt)}
                className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                  answers[q.id] === opt
                    ? 'border-brand-600 bg-brand-50 text-brand-800'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {type === 'MORPHOLOGY_QUIZ' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'case', 'gender'] as const).map(field => {
              const opts = field === 'case' ? MORPH_OPTIONS.case : MORPH_OPTIONS[field as keyof typeof MORPH_OPTIONS]
              if (!Array.isArray(opts) || opts.length === 0) return null
              return (
                <Select
                  key={field}
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={(morphAnswers[q.id] ?? {})[field] ?? ''}
                  onChange={e => setMorphField(field, e.target.value)}
                  placeholder="—"
                  options={(opts as string[]).map(o => ({ value: o, label: o }))}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}>
          Previous
        </Button>
        {idx < total - 1 ? (
          <Button onClick={() => setIdx(i => i + 1)}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading}>Submit Quiz</Button>
        )}
      </div>
    </div>
  )
}
