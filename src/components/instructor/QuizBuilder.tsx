'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import type { QuestionType } from '@/types/assignment'

interface QuizBuilderProps {
  assignmentId: string
  level: 'BEGINNING' | 'INTERMEDIATE'
  onGenerate: (type: QuestionType, count: number) => Promise<void>
}

export function QuizBuilder({ assignmentId, level, onGenerate }: QuizBuilderProps) {
  const [type, setType] = useState<QuestionType>('GREEK_TO_ENGLISH')
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    await onGenerate(type, count)
    setLoading(false)
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-gray-900 text-sm">Auto-generate Questions</h3>
        <Badge variant={level === 'BEGINNING' ? 'blue' : 'purple'}>
          {level === 'BEGINNING' ? 'Beginning (50+)' : 'Intermediate (30+)'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Question type"
          value={type}
          onChange={e => setType(e.target.value as QuestionType)}
          options={[
            { value: 'GREEK_TO_ENGLISH', label: 'Greek → English' },
            { value: 'ENGLISH_TO_GREEK', label: 'English → Greek' },
            { value: 'MULTIPLE_CHOICE', label: 'Multiple choice' },
          ]}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1"># of questions</label>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="input"
          />
        </div>
      </div>

      <Button onClick={handleGenerate} loading={loading} variant="secondary" size="sm">
        Generate Questions
      </Button>
    </div>
  )
}
