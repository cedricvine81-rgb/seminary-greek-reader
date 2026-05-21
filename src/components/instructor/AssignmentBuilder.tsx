'use client'
import { useState, useMemo, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format, getDay, parseISO } from 'date-fns'
import { CalendarDays, FileText, CheckCircle2, Download } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { AssignmentFormData, AssignmentType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'
import { getLessonForWeek } from '@/lib/vocab-lesson-map'

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

const QUIZ_SOURCES = [
  { value: 'VOCAB_BUILDER',       label: 'Biblical Greek Vocabulary Builder (Glanz, Kostyu & Vine)' },
  { value: 'BEGINNING_VOCAB',     label: 'Beginning Greek Vocabulary (50+ occurrences)' },
  { value: 'INTERMEDIATE_VOCAB',  label: 'Intermediate Greek Vocabulary (30+ occurrences)' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface Course {
  id: string
  name: string
  level: CourseLevel
}

interface SemesterForm {
  courseId: string
  startDate: string
  weeks: number
  days: number[]          // 0=Sun … 6=Sat
  quizType: AssignmentType
  source: string
  level: CourseLevel
  numQuestions: number
}

interface ScheduledQuiz {
  week: number
  date: Date
  label: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return every date in [startDate, startDate + weeks*7) whose weekday is in `days`. */
function buildSchedule(startDate: string, weeks: number, days: number[]): ScheduledQuiz[] {
  if (!startDate || weeks < 1 || days.length === 0) return []
  const start = parseISO(startDate)
  const result: ScheduledQuiz[] = []
  const totalDays = weeks * 7

  for (let d = 0; d < totalDays; d++) {
    const date = addDays(start, d)
    if (days.includes(getDay(date))) {
      const week = Math.floor(d / 7) + 1
      result.push({ week, date, label: format(date, 'EEE, MMM d, yyyy') })
    }
  }
  return result
}

// ── Single Assignment Form ────────────────────────────────────────────────────

function SingleForm({ courses }: { courses: Course[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const courseLevel = courses.find(c => c.id === courseId)?.level ?? 'BEGINNING'
  const [form, setForm] = useState<AssignmentFormData>({
    title: '', type: 'VOCABULARY_QUIZ', weekNumber: 1, dueDate: '',
    level: courseLevel, reference: '', instructions: '', numQuestions: 10,
  })

  function set<K extends keyof AssignmentFormData>(key: K, val: AssignmentFormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
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
      {courses.length > 1 && (
        <Select
          label="Course"
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
          options={courses.map(c => ({ value: c.id, label: c.name }))}
        />
      )}

      <Input label="Title" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Week 1: John 1 Vocabulary" />

      <Select
        label="Assignment type"
        value={form.type}
        onChange={e => set('type', e.target.value as AssignmentType)}
        options={[
          { value: 'VOCABULARY_QUIZ',      label: 'Vocabulary Quiz' },
          { value: 'MORPHOLOGY_QUIZ',      label: 'Morphology Quiz' },
          { value: 'TRANSLATION_EXERCISE', label: 'Translation Exercise' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input label="Week number" type="number" min={1} required value={form.weekNumber}
          onChange={e => set('weekNumber', Number(e.target.value))} />
        <Input label="Due date" type="date" required value={form.dueDate}
          onChange={e => set('dueDate', e.target.value)} />
      </div>

      <Select
        label="Level"
        value={form.level}
        onChange={e => set('level', e.target.value as CourseLevel)}
        options={[
          { value: 'BEGINNING',    label: 'Beginning Greek' },
          { value: 'INTERMEDIATE', label: 'Intermediate Greek' },
        ]}
      />

      <Input label="Text reference (optional)" value={form.reference ?? ''}
        onChange={e => set('reference', e.target.value)} placeholder="John 1:1–5" />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optional)</label>
        <textarea value={form.instructions ?? ''} onChange={e => set('instructions', e.target.value)}
          rows={3} className="input" placeholder="Additional instructions for students…" />
      </div>

      <Input label="Number of questions" type="number" min={1} max={50} value={form.numQuestions}
        onChange={e => set('numQuestions', Number(e.target.value))} />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>Create Assignment</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}

// ── Semester Schedule Form ────────────────────────────────────────────────────

function SemesterForm({ courses }: { courses: Course[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<number | null>(null)

  const [form, setForm] = useState<SemesterForm>({
    courseId:     courses[0]?.id ?? '',
    startDate:    '',
    weeks:        16,
    days:         [4],   // Thursday by default
    quizType:     'VOCABULARY_QUIZ',
    source:       'VOCAB_BUILDER',
    level:        courses[0]?.level ?? 'BEGINNING',
    numQuestions: 10,
  })

  function setF<K extends keyof SemesterForm>(key: K, val: SemesterForm[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function toggleDay(day: number) {
    setF('days', form.days.includes(day)
      ? form.days.filter(d => d !== day)
      : [...form.days, day].sort((a, b) => a - b))
  }

  const schedule = useMemo(
    () => buildSchedule(form.startDate, form.weeks, form.days),
    [form.startDate, form.weeks, form.days]
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (schedule.length === 0) { setError('No quiz dates generated — check start date and days.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/assignments/semester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, schedule: schedule.map(s => ({ week: s.week, dueDate: s.date })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create schedule')
      setSuccess(data.count)
      setTimeout(() => { router.push('/instructor/assignments'); router.refresh() }, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating schedule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Course */}
      {courses.length > 1 && (
        <Select
          label="Course"
          value={form.courseId}
          onChange={e => {
            const c = courses.find(c => c.id === e.target.value)
            setForm(prev => ({ ...prev, courseId: e.target.value, level: c?.level ?? prev.level }))
          }}
          options={courses.map(c => ({ value: c.id, label: c.name }))}
        />
      )}

      {/* Semester timing */}
      <fieldset className="border border-gray-200 rounded-xl p-5 space-y-4">
        <legend className="text-sm font-semibold text-gray-700 px-1">Semester Timing</legend>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start of semester"
            type="date"
            required
            value={form.startDate}
            onChange={e => setF('startDate', e.target.value)}
          />
          <Input
            label="Length of semester (weeks)"
            type="number"
            min={1}
            max={52}
            required
            value={form.weeks}
            onChange={e => setF('weeks', Number(e.target.value))}
          />
        </div>

        {/* Day selector */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Quiz days</p>
          <div className="flex gap-2 flex-wrap">
            {DAYS_OF_WEEK.map(d => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.days.includes(d.value)
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-brand-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {form.days.length === 0 && (
            <p className="text-xs text-red-500 mt-1">Select at least one quiz day.</p>
          )}
        </div>
      </fieldset>

      {/* Quiz settings */}
      <fieldset className="border border-gray-200 rounded-xl p-5 space-y-4">
        <legend className="text-sm font-semibold text-gray-700 px-1">Quiz Settings</legend>

        <Select
          label="Quiz type"
          value={form.quizType}
          onChange={e => setF('quizType', e.target.value as AssignmentType)}
          options={[
            { value: 'VOCABULARY_QUIZ',  label: 'Vocabulary Quiz' },
            { value: 'MORPHOLOGY_QUIZ',  label: 'Morphology Quiz' },
          ]}
        />

        <Select
          label="Quiz source"
          value={form.source}
          onChange={e => setF('source', e.target.value)}
          options={QUIZ_SOURCES}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Level"
            value={form.level}
            onChange={e => setF('level', e.target.value as CourseLevel)}
            options={[
              { value: 'BEGINNING',    label: 'Beginning Greek' },
              { value: 'INTERMEDIATE', label: 'Intermediate Greek' },
            ]}
          />
          <Input
            label="Questions per quiz"
            type="number"
            min={1}
            max={50}
            value={form.numQuestions}
            onChange={e => setF('numQuestions', Number(e.target.value))}
          />
        </div>
      </fieldset>

      {/* BGVB download */}
      {form.source === 'VOCAB_BUILDER' && (
        <a
          href="/downloads/BGVB-2024.pdf"
          download
          className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 hover:underline transition-colors"
        >
          <Download size={14} />
          Download Biblical Greek Vocabulary Builder (PDF)
        </a>
      )}

      {/* Schedule preview */}
      {schedule.length > 0 && (
        <div className="border border-brand-100 rounded-xl overflow-hidden">
          <div className="bg-brand-50 px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-800">
              Schedule preview — {schedule.length} quiz{schedule.length !== 1 ? 'zes' : ''}
            </span>
            <span className="text-xs text-brand-600">
              {form.weeks} week{form.weeks !== 1 ? 's' : ''} · {form.days.length} day{form.days.length !== 1 ? 's' : ''}/week
            </span>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
            {schedule.map((s, i) => {
              const useLessonMap = form.source === 'VOCAB_BUILDER' && form.quizType === 'VOCABULARY_QUIZ'
              const lesson = useLessonMap ? getLessonForWeek(s.week) : null
              return (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="text-gray-500 w-20 shrink-0">Week {s.week}</span>
                  <span className="text-gray-800 flex-1">{s.label}</span>
                  {lesson ? (
                    <span className="text-xs text-brand-600 ml-2 shrink-0">{lesson.section} · {lesson.pages}</span>
                  ) : (
                    <span className="text-xs text-gray-400 ml-2 shrink-0">
                      {QUIZ_SOURCES.find(q => q.value === form.source)?.label.split(' ').slice(0, 3).join(' ')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Feedback */}
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
      {success !== null && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
          <CheckCircle2 size={16} />
          {success} assignments created — redirecting…
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading} disabled={schedule.length === 0 || form.days.length === 0}>
          Create {schedule.length > 0 ? `${schedule.length} Assignments` : 'Schedule'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}

// ── Main AssignmentBuilder ────────────────────────────────────────────────────

interface AssignmentBuilderProps {
  courses: Course[]
}

type Mode = 'single' | 'semester'

export function AssignmentBuilder({ courses }: AssignmentBuilderProps) {
  const [mode, setMode] = useState<Mode>('single')

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        {([
          { value: 'single'   as Mode, label: 'Single Assignment', Icon: FileText },
          { value: 'semester' as Mode, label: 'Semester Schedule', Icon: CalendarDays },
        ] as const).map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === value
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {mode === 'single'
        ? <SingleForm courses={courses} />
        : <SemesterForm courses={courses} />}
    </div>
  )
}
