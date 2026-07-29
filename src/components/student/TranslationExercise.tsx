'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { ALL_SYNTAX_OPTIONS } from '@/data/syntax-categories'
import type { QuizQuestion } from '@/types/quiz'
import { useT } from '@/lib/i18n/LocaleProvider'

interface TranslationExerciseProps {
  assignmentId: string
  questions: QuizQuestion[]
}

export function TranslationExercise({ assignmentId, questions }: TranslationExerciseProps) {
  const t = useT()
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function setAnswer(questionId: string, value: string) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          responses: questions.map(q => ({ questionId: q.id, answer: answers[q.id] ?? '' })),
        }),
      })
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-semibold text-green-700">{t('ex.submitted')}</p>
        <p className="text-sm text-gray-500 mt-1">{t('ex.submittedForReview')}</p>
        <Button className="mt-6" onClick={() => { router.push('/student/assignments'); router.refresh() }}>{t('ex.backToAssignments')}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <div key={q.id} className="bg-surface rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
            <span>Question {i + 1}</span>
            <span>·</span>
            <span>{q.type === 'TRANSLATION' ? t('study.translation') : t('ex.syntaxIdentification')}</span>
            {q.reference && <><span>·</span><span>{q.reference}</span></>}
          </div>

          <p className="greek-text text-xl text-gray-900">{q.prompt}</p>

          {q.type === 'TRANSLATION' ? (
            <div>
              <label className="label">{t('ex.yourTranslation')}</label>
              <textarea
                rows={3}
                className="input"
                placeholder={t('ex.enterTranslation')}
                value={answers[q.id] ?? ''}
                onChange={e => setAnswer(q.id, e.target.value)}
              />
            </div>
          ) : (
            <Select
              label={t('ex.syntaxCategory')}
              value={answers[q.id] ?? ''}
              onChange={e => setAnswer(q.id, e.target.value)}
              placeholder={t('ex.selectSyntax')}
              options={ALL_SYNTAX_OPTIONS.map(o => ({ value: o, label: o }))}
            />
          )}
        </div>
      ))}

      <Button onClick={handleSubmit} loading={loading}>{t('ex.submitExercise')}</Button>
    </div>
  )
}
