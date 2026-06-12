'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import type { QuestionType } from '@/types/assignment'

interface QuizBuilderProps {
  assignmentId: string
  level: string
  provideDefinition?: boolean
}

export function QuizBuilder({ assignmentId, level, provideDefinition = false }: QuizBuilderProps) {
  const router = useRouter()
  const [type, setType] = useState<QuestionType>('GREEK_TO_ENGLISH')
  const [count, setCount] = useState(20)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<number | null>(null)

  // If provideDefinition is turned on while English→Greek is selected, reset to Greek→English
  // because typing Greek characters is not supported in the app.
  useEffect(() => {
    if (provideDefinition && type === 'ENGLISH_TO_GREEK') setType('GREEK_TO_ENGLISH')
  }, [provideDefinition]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    setLoading(true)
    setGenerated(null)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, count, level }),
      })
      const data = await res.json()
      setGenerated(data.count ?? count)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-semibold text-gray-900 text-sm">Auto-generate Questions</h3>
        <Badge variant={level === 'BEGINNING' ? 'blue' : 'purple'}>
          {level === 'BEGINNING' ? 'Beginning (50+ freq.)' : 'Intermediate (30+ freq.)'}
        </Badge>
        <Badge variant={provideDefinition ? 'green' : 'gray'}>
          {provideDefinition ? 'Provide Definition mode' : 'Choose Definition mode'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Select
            label="Question direction"
            value={type}
            onChange={e => setType(e.target.value as QuestionType)}
            options={[
              { value: 'GREEK_TO_ENGLISH', label: 'Greek → English' },
              ...(!provideDefinition ? [{ value: 'ENGLISH_TO_GREEK', label: 'English → Greek' }] : []),
            ]}
          />
          {provideDefinition && (
            <p className="mt-1 text-xs text-gray-400">
              English → Greek is unavailable in Provide Definition mode (requires typing Greek characters).
            </p>
          )}
        </div>
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

      <div className="flex items-center gap-3">
        <Button onClick={handleGenerate} loading={loading} variant="secondary" size="sm">
          Generate Questions
        </Button>
        {generated !== null && !loading && (
          <span className="flex items-center gap-1.5 text-sm text-green-700">
            <CheckCircle2 size={14} />
            {generated} question{generated !== 1 ? 's' : ''} generated
          </span>
        )}
      </div>
    </div>
  )
}
