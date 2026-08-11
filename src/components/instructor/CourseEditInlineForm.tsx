'use client'
import { useState, FormEvent } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
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
  const t = useT()
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
      if (!res.ok) throw new Error(data.error ?? t('inst.err.save'))
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('inst.err.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label={t('inst.courseName')}
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('inst.courseNameExample')}
          />
        </div>
        <Input
          label={t('inst.courseListing')}
          value={listing}
          onChange={e => setListing(e.target.value)}
          placeholder={t('inst.courseListingExample')}
        />
        <Select
          label={t('inst.col.level')}
          value={level}
          onChange={e => setLevel(e.target.value as CourseLevel)}
          options={COURSE_LEVELS.map(l => ({ value: l, label: t(`course.level.${l}`) }))}
        />
        <Select
          label={t('inst.assessmentLanguage')}
          value={language}
          onChange={e => setLanguage(e.target.value)}
          options={ASSESSMENT_LANGUAGES.map(l => ({ value: l, label: ASSESSMENT_LANGUAGE_LABEL[l] }))}
        />
        <Input
          label={t('inst.startDate')}
          type="date"
          required
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <Input
          label={t('inst.endDate')}
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
