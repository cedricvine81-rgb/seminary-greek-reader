'use client'
import { useState, FormEvent } from 'react'
import { ASSESSMENT_LANGUAGES, ASSESSMENT_LANGUAGE_LABEL } from '@/lib/assessment-languages'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { COURSE_LEVELS } from '@/lib/constants'
import type { CourseLevel } from '@/types/course'

interface Props {
  courseId: string
  initialName: string
  initialListing: string
  initialLevel: CourseLevel
  /** Assessment language. Existing courses were created before this existed, hence the default. */
  initialLanguage?: string
  initialStartDate: string  // ISO date string YYYY-MM-DD
  initialEndDate: string
}

export function CourseEditInlineForm({
  courseId, initialName, initialListing, initialLevel, initialLanguage, initialStartDate, initialEndDate,
}: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [listing, setListing] = useState(initialListing)
  const [level, setLevel] = useState<CourseLevel>(initialLevel)
  const [language, setLanguage] = useState(initialLanguage ?? 'en')
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/courses?id=${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, listing, level, language, startDate, endDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Course name"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Beginning Greek"
          />
        </div>
        <Input
          label="Course listing / code"
          value={listing}
          onChange={e => setListing(e.target.value)}
          placeholder="GREK 301"
        />
        <Select
          label="Level"
          value={level}
          onChange={e => setLevel(e.target.value as CourseLevel)}
          options={COURSE_LEVELS.map(l => ({ value: l.value, label: l.label }))}
        />
        <Select
          label="Assessment language"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          options={ASSESSMENT_LANGUAGES.map(l => ({ value: l, label: ASSESSMENT_LANGUAGE_LABEL[l] }))}
        />
        <Input
          label="Start date"
          type="date"
          required
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <Input
          label="End date"
          type="date"
          required
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving} size="sm">
          Save changes
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
            <CheckCircle2 size={15} /> Saved
          </span>
        )}
      </div>
    </form>
  )
}
