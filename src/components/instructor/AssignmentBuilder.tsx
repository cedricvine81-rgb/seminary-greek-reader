'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { AssignmentFormData, AssignmentType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

interface AssignmentBuilderProps {
  courseId: string
  courseLevel: CourseLevel
}

export function AssignmentBuilder({ courseId, courseLevel }: AssignmentBuilderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<AssignmentFormData>({
    title: '',
    type: 'VOCABULARY_QUIZ',
    weekNumber: 1,
    dueDate: '',
    level: courseLevel,
    reference: '',
    instructions: '',
    numQuestions: 10,
  })

  function set<K extends keyof AssignmentFormData>(key: K, value: AssignmentFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create assignment')
      router.push('/instructor/assignments')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <Input label="Title" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Week 1: John 1 Vocabulary" />

      <Select
        label="Assignment type"
        value={form.type}
        onChange={e => set('type', e.target.value as AssignmentType)}
        options={[
          { value: 'VOCABULARY_QUIZ', label: 'Vocabulary Quiz' },
          { value: 'MORPHOLOGY_QUIZ', label: 'Morphology Quiz' },
          { value: 'TRANSLATION_EXERCISE', label: 'Translation Exercise' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input label="Week number" type="number" min={1} required value={form.weekNumber} onChange={e => set('weekNumber', Number(e.target.value))} />
        <Input label="Due date" type="date" required value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
      </div>

      <Select
        label="Level"
        value={form.level}
        onChange={e => set('level', e.target.value as CourseLevel)}
        options={[
          { value: 'BEGINNING', label: 'Beginning Greek' },
          { value: 'INTERMEDIATE', label: 'Intermediate Greek' },
        ]}
      />

      <Input label="Text reference (optional)" value={form.reference ?? ''} onChange={e => set('reference', e.target.value)} placeholder="John 1:1-5" />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optional)</label>
        <textarea
          value={form.instructions ?? ''}
          onChange={e => set('instructions', e.target.value)}
          rows={3}
          className="input"
          placeholder="Additional instructions for students…"
        />
      </div>

      <Input
        label="Number of questions"
        type="number"
        min={1}
        max={50}
        value={form.numQuestions}
        onChange={e => set('numQuestions', Number(e.target.value))}
      />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>Create Assignment</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
