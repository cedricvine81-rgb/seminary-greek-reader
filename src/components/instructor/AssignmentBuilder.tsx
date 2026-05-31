'use client'
import { useState, useMemo, FormEvent, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format, getDay, parseISO } from 'date-fns'
import { CalendarDays, FileText, CheckCircle2, Download, Eye } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FrequencySectionPicker } from '@/components/vocab/FrequencySectionPicker'
import type { AssignmentFormData, AssignmentType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'
import { getLessonForWeek, type VocabLesson } from '@/lib/vocab-lesson-map'

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
  vocabSubsections: string[]  // selected subsection keys when quizType is VOCABULARY_QUIZ
  level: CourseLevel
  numQuestions: number
  timePerQuestion: number  // 0 = untimed
  allowLate: boolean
  lateDaysLimit: number    // 0 = unlimited
  prevSectionsPct: number  // 0–100: % of questions drawn from previous vocab sections
  quizStylePct: number     // 0 = Choose Definition, 100 = Provide Definition
  maxRetakes: number | null
}

// ── Late Policy Fields ────────────────────────────────────────────────────────

function LatePolicyFields({
  allowLate, lateDaysLimit,
  onAllowLateChange, onLateDaysLimitChange,
}: {
  allowLate: boolean
  lateDaysLimit: number
  onAllowLateChange: (v: boolean) => void
  onLateDaysLimitChange: (v: number) => void
}) {
  return (
    <fieldset className="border border-gray-200 rounded-xl p-5 space-y-4">
      <legend className="text-sm font-semibold text-gray-700 px-1">Late Submissions</legend>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={allowLate}
          onChange={e => onAllowLateChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-gray-700">Allow students to submit after the due date</span>
      </label>
      {allowLate && (
        <div className="pl-7">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline (days after due date)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={365}
              value={lateDaysLimit}
              onChange={e => onLateDaysLimitChange(Number(e.target.value))}
              className="input w-28"
            />
            <span className="text-sm text-gray-500">
              {lateDaysLimit === 0 ? 'No time limit — accept indefinitely' : `days after due date`}
            </span>
          </div>
        </div>
      )}
    </fieldset>
  )
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

function SingleForm({ courses, defaultCourseId }: { courses: Course[]; defaultCourseId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [courseId, setCourseId] = useState(defaultCourseId ?? courses[0]?.id ?? '')
  const courseLevel = courses.find(c => c.id === courseId)?.level ?? 'BEGINNING'
  const [form, setForm] = useState<AssignmentFormData>({
    title: '', type: 'VOCABULARY_QUIZ', weekNumber: 1, dueDate: '',
    level: courseLevel, reference: '', instructions: '', numQuestions: 10,
    allowLate: false, lateDaysLimit: 7,
  })
  const [vocabSubsections, setVocabSubsections] = useState<string[]>([])
  const [prevSectionsPct, setPrevSectionsPct] = useState(0)
  const [quizStylePct, setQuizStylePct] = useState(0)
  const [allowLate, setAllowLate] = useState(false)
  const [lateDaysLimit, setLateDaysLimit] = useState(7)
  const [maxRetakes, setMaxRetakes] = useState<number | null>(null)

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
        body: JSON.stringify({ courseId, ...form, allowLate, lateDaysLimit: allowLate ? lateDaysLimit : null, maxRetakes, ...(form.type === 'VOCABULARY_QUIZ' ? { vocabSubsections, prevSectionsPct, quizStylePct, provideDefinition: quizStylePct >= 50 } : {}) }),
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
          { value: 'PASSAGE_VOCABULARY',   label: 'Passage Vocabulary' },
          { value: 'MORPHOLOGY_QUIZ',      label: 'Morphology Quiz' },
          { value: 'TRANSLATION_EXERCISE', label: 'Translation Exercise' },
        ]}
      />

      {form.type === 'VOCABULARY_QUIZ' && (
        <>
          <FrequencySectionPicker
            selectedSubsections={vocabSubsections}
            onChange={setVocabSubsections}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Questions from previous sections:{' '}
              <span className="text-brand-700 font-semibold">{prevSectionsPct}%</span>
            </label>
            <input
              type="range"
              min={0} max={100} step={5}
              value={prevSectionsPct}
              onChange={e => setPrevSectionsPct(Number(e.target.value))}
              className="w-full h-2 cursor-pointer rounded-lg accent-brand-600 [appearance:auto]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>0% (current section only)</span>
              <span>100% (all previous)</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type of Quiz
            </label>
            <input
              type="range"
              min={0} max={100} step={50}
              value={quizStylePct}
              onChange={e => setQuizStylePct(Number(e.target.value))}
              className="w-full h-2 cursor-pointer rounded-lg accent-brand-600 [appearance:auto]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>Choose Definition</span>
              <span>Provide Definition</span>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Week number" type="number" min={1} required value={form.weekNumber}
          onChange={e => set('weekNumber', Number(e.target.value))} />
        <Input label="Due date" type="date" required value={form.dueDate}
          onChange={e => set('dueDate', e.target.value)} />
      </div>

      {form.type === 'TRANSLATION_EXERCISE' && (
        <Input label="Text reference (optional)" value={form.reference ?? ''}
          onChange={e => set('reference', e.target.value)} placeholder="John 1:1–5" />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optional)</label>
        <textarea value={form.instructions ?? ''} onChange={e => set('instructions', e.target.value)}
          rows={3} className="input" placeholder="Additional instructions for students…" />
      </div>

      <Input label="Number of questions" type="number" min={1} max={50} value={form.numQuestions}
        onChange={e => set('numQuestions', Number(e.target.value))} />

      <Input
        label="Time per question (seconds, 0 = untimed)"
        type="number"
        min={0}
        max={300}
        value={form.timePerQuestion ?? 0}
        onChange={e => set('timePerQuestion', Number(e.target.value) || undefined)}
      />

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

      <LatePolicyFields
        allowLate={allowLate}
        lateDaysLimit={lateDaysLimit}
        onAllowLateChange={setAllowLate}
        onLateDaysLimitChange={setLateDaysLimit}
      />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>Create Assignment</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}

// ── Sample Quiz Types ─────────────────────────────────────────────────────────

interface SampleQuestion {
  position: number
  type: string
  prompt: string
  correctAnswer: string
  options: string[]
}

interface SampleData {
  questions: SampleQuestion[]
  lesson: VocabLesson | null
}

// ── Sample Quiz Modal ─────────────────────────────────────────────────────────

function SampleQuizModal({
  open, onClose, data, loading, quizType, provideDefinition,
}: {
  open: boolean
  onClose: () => void
  data: SampleData | null
  loading: boolean
  quizType: AssignmentType
  provideDefinition: boolean
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  function toggleReveal(pos: number) {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(pos) ? next.delete(pos) : next.add(pos)
      return next
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Sample Quiz Preview" size="xl">
      {loading && (
        <p className="text-sm text-gray-500 py-6 text-center">Generating sample questions…</p>
      )}

      {!loading && data && (
        <div className="space-y-4">
          {data.lesson && (
            <div className="text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
              Week 1 vocabulary · {data.lesson.section} · {data.lesson.pages} of the Vocabulary Builder
            </div>
          )}

          {data.questions.length === 0 && (
            <p className="text-sm text-gray-400 italic py-4 text-center">
              No questions could be generated — check that vocabulary data is loaded.
            </p>
          )}

          <ol className="space-y-4">
            {data.questions.map(q => (
              <li key={q.position} className="border border-gray-100 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  <span className="text-gray-400 mr-2">{q.position}.</span>
                  {quizType === 'VOCABULARY_QUIZ'
                    ? <span className="font-greek text-lg text-ink-900">{q.prompt}</span>
                    : <span className="font-greek text-ink-900">{q.prompt}</span>
                  }
                </p>

                {quizType === 'VOCABULARY_QUIZ' && provideDefinition ? (
                  <div className="mt-2">
                    <div className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 italic">
                      Student types their answer here…
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Fuzzy matching accepts minor spelling variations.</p>
                  </div>
                ) : q.options.length > 0 && (
                  <ul className="grid grid-cols-2 gap-1.5 mt-2">
                    {q.options.map((opt, i) => (
                      <li
                        key={i}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                          revealed.has(q.position) && opt === q.correctAnswer
                            ? 'bg-green-50 border-green-300 text-green-800 font-medium'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() => toggleReveal(q.position)}
                  className="text-xs text-brand-600 hover:text-brand-800 hover:underline mt-1"
                >
                  {revealed.has(q.position) ? 'Hide answer' : 'Show answer'}
                </button>

                {revealed.has(q.position) && (
                  <p className="text-xs text-green-700 mt-1">
                    Answer: <span className="font-medium">{q.correctAnswer}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>

          <p className="text-xs text-gray-400 text-center pt-2">
            Sample questions are randomly drawn and will differ in the actual quiz.
          </p>
        </div>
      )}
    </Modal>
  )
}

// ── Semester Schedule Form ────────────────────────────────────────────────────

function SemesterForm({ courses, defaultCourseId }: { courses: Course[]; defaultCourseId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<number | null>(null)
  const [sampleOpen, setSampleOpen] = useState(false)
  const [sampleData, setSampleData] = useState<SampleData | null>(null)
  const [sampleLoading, setSampleLoading] = useState(false)

  const [form, setForm] = useState<SemesterForm>({
    courseId:         defaultCourseId ?? courses[0]?.id ?? '',
    startDate:        '',
    weeks:            16,
    days:             [4],   // Thursday by default
    quizType:         'VOCABULARY_QUIZ',
    vocabSubsections: [],
    level:            courses[0]?.level ?? 'BEGINNING',
    prevSectionsPct:  0,
    quizStylePct:     0,
    numQuestions:     20,
    timePerQuestion:  0,
    allowLate:        false,
    lateDaysLimit:    7,
    maxRetakes:       null,
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

  const openSample = useCallback(async () => {
    setSampleOpen(true)
    setSampleData(null)
    setSampleLoading(true)
    try {
      const params = new URLSearchParams({
        quizType: form.quizType,
        level:    form.level,
        count:    '5',
        week:     '1',
      })
      const res = await fetch(`/api/assignments/sample?${params}`)
      const data = await res.json()
      setSampleData(data)
    } catch {
      setSampleData({ questions: [], lesson: null })
    } finally {
      setSampleLoading(false)
    }
  }, [form.quizType, form.level])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (schedule.length === 0) { setError('No quiz dates generated — check start date and days.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/assignments/semester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lateDaysLimit: form.allowLate ? form.lateDaysLimit : null,
          provideDefinition: form.quizType === 'VOCABULARY_QUIZ' ? form.quizStylePct >= 50 : false,
          schedule: schedule.map(s => ({ week: s.week, dueDate: s.date })),
        }),
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
    <>
      <SampleQuizModal
        open={sampleOpen}
        onClose={() => setSampleOpen(false)}
        data={sampleData}
        loading={sampleLoading}
        quizType={form.quizType}
        provideDefinition={form.quizType === 'VOCABULARY_QUIZ' ? form.quizStylePct >= 50 : false}
      />

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
              { value: 'PASSAGE_VOCABULARY', label: 'Passage Vocabulary' },
              { value: 'MORPHOLOGY_QUIZ',  label: 'Morphology Quiz' },
            ]}
          />

          {form.quizType === 'VOCABULARY_QUIZ' && (
            <>
              <FrequencySectionPicker
                selectedSubsections={form.vocabSubsections}
                onChange={keys => setF('vocabSubsections', keys)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Questions from previous sections:{' '}
                  <span className="text-brand-700 font-semibold">{form.prevSectionsPct}%</span>
                </label>
                <input
                  type="range"
                  min={0} max={100} step={5}
                  value={form.prevSectionsPct}
                  onChange={e => setF('prevSectionsPct', Number(e.target.value))}
                  className="w-full h-2 cursor-pointer rounded-lg accent-brand-600 [appearance:auto]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>0% (current section only)</span>
                  <span>100% (all previous)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Quiz
                </label>
                <input
                  type="range"
                  min={0} max={100} step={50}
                  value={form.quizStylePct}
                  onChange={e => setF('quizStylePct', Number(e.target.value))}
                  className="w-full h-2 cursor-pointer rounded-lg accent-brand-600 [appearance:auto]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Choose Definition</span>
                  <span>Provide Definition</span>
                </div>
              </div>
            </>
          )}

          <Input
            label="Questions per quiz"
            type="number"
            min={1}
            max={50}
            value={form.numQuestions}
            onChange={e => setF('numQuestions', Number(e.target.value))}
          />

          <Input
            label="Time per question (seconds, 0 = untimed)"
            type="number"
            min={0}
            max={300}
            value={form.timePerQuestion}
            onChange={e => setF('timePerQuestion', Number(e.target.value))}
          />

          <button
            type="button"
            onClick={openSample}
            className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 hover:underline transition-colors font-medium"
          >
            <Eye size={14} />
            View sample quiz
          </button>
        </fieldset>

        <Select
          label="Quiz retakes allowed"
          value={form.maxRetakes === null ? '' : String(form.maxRetakes)}
          onChange={e => setF('maxRetakes', e.target.value === '' ? null : Number(e.target.value))}
          options={[
            { value: '0', label: 'No retakes (1 attempt only)' },
            { value: '1', label: '1 retake (2 attempts total)' },
            { value: '2', label: '2 retakes (3 attempts total)' },
            { value: '3', label: '3 retakes (4 attempts total)' },
            { value: '5', label: '5 retakes (6 attempts total)' },
          ]}
          placeholder="Unlimited retakes"
        />

        <LatePolicyFields
          allowLate={form.allowLate}
          lateDaysLimit={form.lateDaysLimit}
          onAllowLateChange={v => setF('allowLate', v)}
          onLateDaysLimitChange={v => setF('lateDaysLimit', v)}
        />

        {/* BGVB download */}
        {form.quizType === 'VOCABULARY_QUIZ' && (
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
                const lesson = form.quizType === 'VOCABULARY_QUIZ' ? getLessonForWeek(s.week) : null
                const sectionLabel = lesson ? lesson.section.replace('-', ':') : null
                return (
                  <div key={i} className="flex items-center gap-4 px-4 py-2 text-sm">
                    <span className="text-gray-500 w-20 shrink-0">Week {s.week}</span>
                    {sectionLabel && (
                      <span className="text-xs font-medium text-brand-600 shrink-0">{sectionLabel}</span>
                    )}
                    <span className="text-gray-800">{s.label}</span>
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
    </>
  )
}

// ── Main AssignmentBuilder ────────────────────────────────────────────────────

interface AssignmentBuilderProps {
  courses: Course[]
  defaultCourseId?: string
}

type Mode = 'single' | 'semester'

export function AssignmentBuilder({ courses, defaultCourseId }: AssignmentBuilderProps) {
  const [mode, setMode] = useState<Mode>('single')

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        {([
          { value: 'single'   as Mode, label: 'Create Individual Assignment', Icon: FileText },
          { value: 'semester' as Mode, label: 'Create Repeated Assignments',  Icon: CalendarDays },
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
        ? <SingleForm courses={courses} defaultCourseId={defaultCourseId} />
        : <SemesterForm courses={courses} defaultCourseId={defaultCourseId} />}
    </div>
  )
}
