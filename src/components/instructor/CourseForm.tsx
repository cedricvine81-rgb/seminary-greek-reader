'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { CourseFormData, CourseLevel } from '@/types/course'
import { ASSESSMENT_LANGUAGES, ASSESSMENT_LANGUAGE_LABEL } from '@/lib/assessment-languages'

interface CourseFormProps {
  initialData?: Partial<CourseFormData>
  courseId?: string
}

export function CourseForm({ initialData, courseId }: CourseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CourseFormData>({
    name: initialData?.name ?? '',
    listing: initialData?.listing ?? '',
    level: initialData?.level ?? 'BEGINNING',
    language: initialData?.language ?? 'en',
    startDate: initialData?.startDate ?? '',
    endDate: initialData?.endDate ?? '',
    institutionName: initialData?.institutionName ?? '',
  })

  function set<K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const method = courseId ? 'PUT' : 'POST'
      const url = courseId ? `/api/courses?id=${courseId}` : '/api/courses'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save course')
      router.push('/instructor')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <Input label="Course name" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Beginning Greek" />
      <Input label="Course listing" value={form.listing ?? ''} onChange={e => set('listing', e.target.value)} placeholder="SU2026-NTST-551" />
      <Input label="Institution" value={form.institutionName ?? ''} onChange={e => set('institutionName', e.target.value)} placeholder="Seminary name" />
      <Select
        label="Level"
        value={form.level}
        onChange={e => set('level', e.target.value as CourseLevel)}
        options={[
          { value: 'BEGINNING',    label: 'Beginner' },
          { value: 'INTERMEDIATE', label: 'Intermediate' },
          { value: 'ADVANCED',     label: 'Advanced' },
        ]}
      />
      <Select
        label="Assessment language"
        value={form.language ?? 'en'}
        onChange={e => set('language', e.target.value)}
        options={ASSESSMENT_LANGUAGES.map(l => ({ value: l, label: ASSESSMENT_LANGUAGE_LABEL[l] }))}
      />
      <p className="-mt-3 text-xs text-gray-500">
        Quizzes and exams for this course are set and marked in this language. Students may still
        read the app, the reader and the vocabulary deck in whichever language they prefer.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Start date" type="date" required value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        <Input label="End date" type="date" required value={form.endDate} onChange={e => set('endDate', e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" loading={loading}>{courseId ? 'Save Changes' : 'Create Course'}</Button>
      </div>
    </form>
  )
}
