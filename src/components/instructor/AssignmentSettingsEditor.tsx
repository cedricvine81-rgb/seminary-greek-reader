'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardTitle } from '@/components/ui/Card'

interface Props {
  assignmentId: string
  isVocabQuiz: boolean
  initial: {
    title: string
    weekNumber: number
    dueDate: string         // ISO string
    instructions: string | null
    timePerQuestion: number | null
    provideDefinition: boolean
    maxRetakes: number | null
    allowLate: boolean
    lateDaysLimit: number | null
  }
}

export function AssignmentSettingsEditor({ assignmentId, isVocabQuiz, initial }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(initial.title)
  const [weekNumber, setWeekNumber] = useState(initial.weekNumber)
  const [dueDate, setDueDate] = useState(initial.dueDate.slice(0, 10))
  const [instructions, setInstructions] = useState(initial.instructions ?? '')
  const [timePerQuestion, setTimePerQuestion] = useState(initial.timePerQuestion ?? 0)
  const [provideDefinition, setProvideDefinition] = useState(initial.provideDefinition)
  const [maxRetakes, setMaxRetakes] = useState<number | null>(initial.maxRetakes)
  const [allowLate, setAllowLate] = useState(initial.allowLate)
  const [lateDaysLimit, setLateDaysLimit] = useState(initial.lateDaysLimit ?? 7)

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          weekNumber,
          dueDate,
          instructions,
          timePerQuestion,
          provideDefinition,
          maxRetakes,
          allowLate,
          lateDaysLimit: allowLate ? lateDaysLimit : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardTitle>Quiz Settings</CardTitle>
      <div className="mt-5 space-y-5">

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="col-span-2"
          />
          <Input
            label="Week number"
            type="number"
            min={1}
            value={weekNumber}
            onChange={e => setWeekNumber(Number(e.target.value))}
          />
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optional)</label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={3}
            className="input w-full"
            placeholder="Additional instructions for students…"
          />
        </div>

        <Input
          label="Time per question (seconds, 0 = untimed)"
          type="number"
          min={0}
          max={300}
          value={timePerQuestion}
          onChange={e => setTimePerQuestion(Number(e.target.value))}
        />

        {isVocabQuiz && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type of Quiz</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setProvideDefinition(false)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  !provideDefinition
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                }`}
              >
                Choose Definition
              </button>
              <button
                type="button"
                onClick={() => setProvideDefinition(true)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  provideDefinition
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                }`}
              >
                Provide Definition
              </button>
            </div>
          </div>
        )}

        <Select
          label="Quiz retakes allowed"
          value={maxRetakes === null ? '' : String(maxRetakes)}
          onChange={e => setMaxRetakes(e.target.value === '' ? null : Number(e.target.value))}
          options={[
            { value: '0', label: 'No retakes (1 attempt only)' },
            { value: '1', label: '1 retake (2 attempts total)' },
            { value: '2', label: '2 retakes (3 attempts total)' },
            { value: '3', label: '3 retakes (4 attempts total)' },
            { value: '5', label: '5 retakes (6 attempts total)' },
          ]}
          placeholder="Unlimited retakes"
        />

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowLate}
              onChange={e => setAllowLate(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700">Allow students to submit after the due date</span>
          </label>

          {allowLate && (
            <div className="ml-7 flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={30}
                value={lateDaysLimit}
                onChange={e => setLateDaysLimit(Number(e.target.value))}
                className="input w-20 text-center"
              />
              <span className="text-sm text-gray-600">
                {lateDaysLimit === 0 ? 'No time limit — accept indefinitely' : 'days after due date'}
              </span>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={saving}>Save settings</Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 size={15} />
              Saved
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
