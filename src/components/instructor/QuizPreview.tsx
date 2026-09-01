'use client'
import { scriptProps } from '@/lib/script-detect'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { useT } from '@/lib/i18n/LocaleProvider'

interface Question {
  id: string
  position: number
  type: string
  prompt: string
  correctAnswer: string
  options: string[]
  points: number
}

// No provideDefinition prop: a mixed quiz sets that assignment-level flag for ANY open-ended
// share, so keying the preview on it rendered a 57/43 mix as 100% typed answers. Each question
// already knows what it is — the same per-question rule QuizPlayer uses — so the preview must
// read the question, never the flag.
export function QuizPreview({ questions }: { questions: Question[] }) {
  const t = useT()
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function revealAll() {
    setRevealed(new Set(questions.map(q => q.id)))
  }

  function hideAll() {
    setRevealed(new Set())
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>{t('qp.title', { n: questions.length })}</CardTitle>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={revealAll}
            className="text-xs text-brand-600 hover:text-brand-800 hover:underline"
          >
            {t('qp.revealAll')}
          </button>
          <span className="text-xs text-gray-300">|</span>
          <button
            type="button"
            onClick={hideAll}
            className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
          >
            {t('qp.hideAll')}
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-gray-400 italic">{t('qp.none')}</p>
      ) : (
        <ol className="space-y-4">
          {questions.map(q => (
            <li key={q.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-gray-500 shrink-0">{q.position}.</p>
                <p dir={scriptProps(q.prompt).dir} className={`flex-1 ${scriptProps(q.prompt).className} text-xl text-ink-900`}>{q.prompt}</p>
                <button
                  type="button"
                  onClick={() => toggle(q.id)}
                  className="text-xs text-brand-600 hover:text-brand-800 hover:underline shrink-0"
                >
                  {revealed.has(q.id) ? 'Hide' : 'Show answer'}
                </button>
              </div>

              {/* Multiple choice iff the question itself is — same rule as QuizPlayer */}
              {q.type === 'MULTIPLE_CHOICE' && q.options.length > 0 && (
                <ul className="grid grid-cols-2 gap-1.5 mt-1">
                  {q.options.map((opt, i) => (
                    <li
                      key={i}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                        revealed.has(q.id) && opt === q.correctAnswer
                          ? 'bg-green-50 border-green-300 text-green-800 font-medium'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      {revealed.has(q.id) && opt === q.correctAnswer && (
                        <CheckCircle2 size={12} className="inline mr-1 text-green-600" />
                      )}
                      {opt}
                    </li>
                  ))}
                </ul>
              )}

              {/* Open-ended: show text box placeholder */}
              {!(q.type === 'MULTIPLE_CHOICE' && q.options.length > 0) && (
                <div className="mt-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 italic">
                  {t('qp.typesAnswer')}
                </div>
              )}

              {/* Revealed correct answer */}
              {revealed.has(q.id) && (
                <p className="text-sm text-green-700 mt-1">
                  <span className="font-medium">{t('qp.answer')}</span> {q.correctAnswer}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
