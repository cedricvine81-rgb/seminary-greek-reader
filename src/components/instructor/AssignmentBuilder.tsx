'use client'
import { useState, useMemo, useRef, FormEvent, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format, getDay, parseISO } from 'date-fns'
import { CalendarDays, FileText, CheckCircle2, Download, Eye } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FrequencySectionPicker } from '@/components/vocab/FrequencySectionPicker'
import type { AssignmentFormData, AssignmentType } from '@/types/assignment'
import type { MorphologySubtype, MorphTestConfig, MorphParseFilter } from '@/lib/quiz-generation'
import { SUBTYPE_FIELD_OPTIONS } from '@/lib/quiz-generation'
import type { CourseLevel } from '@/types/course'
import { getLessonForWeek, VOCAB_LESSONS, type VocabLesson } from '@/lib/vocab-lesson-map'

// ── Constants ─────────────────────────────────────────────────────────────────

// ── Parse-filter value lists ───────────────────────────────────────────────────

const VERB_TENSES  = ['Present', 'Imperfect', 'Future', 'Aorist', 'Perfect', 'Pluperfect']
const VERB_VOICES  = ['Active', 'Middle', 'Passive', 'Middle/Passive']
const VERB_MOODS   = ['Indicative', 'Subjunctive', 'Optative', 'Imperative', 'Infinitive', 'Participle']
const PERSONS      = ['1st', '2nd', '3rd']
const NUMBERS      = ['Singular', 'Plural']
const NOUN_CASES   = ['Nominative', 'Genitive', 'Dative', 'Accusative', 'Vocative']
const GENDERS      = ['Masculine', 'Feminine', 'Neuter']

/** Default parse filter for VERB_PARSING — all values selected. */
const DEFAULT_VERB_FILTER: MorphParseFilter = {
  tenses:  [...VERB_TENSES],
  voices:  [...VERB_VOICES],
  moods:   [...VERB_MOODS],
  persons: [...PERSONS],
  numbers: [...NUMBERS],
  cases:   [...NOUN_CASES],
  genders: [...GENDERS],
}

const MORPH_SUBTYPE_SHORT: Record<MorphologySubtype, string> = {
  VERB_PARSING:      'Verb Parsing',
  NOUN_PARSING:      'Noun Parsing',
  ADJECTIVE_PARSING: 'Adjective Parsing',
  PRONOUN_PARSING:   'Pronoun Parsing',
  CONDITIONALS:      'Conditionals',
  SUBJUNCTIVES:      'Subjunctives',
  MIXED:             'Mixed',
}

const MORPHOLOGY_SUBTYPES: { value: MorphologySubtype; label: string; description: string }[] = [
  { value: 'VERB_PARSING',      label: 'Verb Parsing',       description: 'Identify tense, voice, mood, person, number' },
  { value: 'NOUN_PARSING',      label: 'Noun Parsing',       description: 'Identify case, number, gender' },
  { value: 'ADJECTIVE_PARSING', label: 'Adjective Parsing',  description: 'Identify case, number, gender of adjectives' },
  { value: 'PRONOUN_PARSING',   label: 'Pronoun Parsing',    description: 'Identify case, number, gender of pronouns' },
  { value: 'CONDITIONALS',      label: 'Conditional Sentences', description: 'Identify conditional sentence class from NT examples' },
  { value: 'SUBJUNCTIVES',      label: 'Subjunctive Uses',   description: 'Identify the use of the subjunctive mood' },
  { value: 'MIXED',             label: 'Mixed Parsing',      description: 'Verbs, nouns, adjectives, and pronouns combined' },
]

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
  morphologySubtype: MorphologySubtype   // used when not in series mode
  morphologySeries: MorphTestConfig[]    // per-test configs in series mode
  level: CourseLevel
  numQuestions: number
  timePerQuestion: number  // 0 = untimed
  allowLate: boolean
  lateDaysLimit: number    // 0 = unlimited
  prevSectionsPct: number  // 0–100: % of questions drawn from previous vocab sections
  quizStylePct: number     // 0 = Choose Definition, 100 = Provide Definition
  maxRetakes: number | null
  maxAppeals: number       // vocab quizzes only; 0 = appeals off
}

const DEFAULT_MORPH_TEST: MorphTestConfig = {
  subtype: 'VERB_PARSING',
  numQuestions: 20,
  vocabThruLesson: null,
  fields: SUBTYPE_FIELD_OPTIONS['VERB_PARSING'].map(f => f.key),
  parseFilter: { ...DEFAULT_VERB_FILTER },
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

// ── Morphology Subtype Picker ─────────────────────────────────────────────────

function MorphologySubtypePicker({
  value,
  onChange,
}: {
  value: MorphologySubtype
  onChange: (v: MorphologySubtype) => void
}) {
  return (
    <div>
      <p className="block text-sm font-medium text-gray-700 mb-2">Morphology focus</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MORPHOLOGY_SUBTYPES.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left px-3 py-2.5 rounded-xl border transition-colors ${
              value === opt.value
                ? 'bg-brand-50 border-brand-400 ring-1 ring-brand-300'
                : 'bg-white border-gray-200 hover:border-brand-300'
            }`}
          >
            <span className={`block text-sm font-medium ${value === opt.value ? 'text-brand-800' : 'text-gray-800'}`}>
              {opt.label}
            </span>
            <span className="block text-xs text-gray-500 mt-0.5">{opt.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Single Assignment Form ────────────────────────────────────────────────────

function SingleForm({ courses, defaultCourseId }: { courses: Course[]; defaultCourseId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const publishRef = useRef(false)
  const [courseId, setCourseId] = useState(defaultCourseId ?? courses[0]?.id ?? '')
  const courseLevel = courses.find(c => c.id === courseId)?.level ?? 'BEGINNING'
  const [form, setForm] = useState<AssignmentFormData>({
    title: '', type: 'VOCABULARY_QUIZ', weekNumber: 1, dueDate: '',
    level: courseLevel, reference: '', instructions: '', numQuestions: 10,
    allowLate: false, lateDaysLimit: 7,
  })
  const [quizStylePct, setQuizStylePct] = useState(0)
  // Vocab word selection over the BGVB list: frequency subsections.
  const [vocabSubsections, setVocabSubsections] = useState<string[]>([])
  const [morphologySubtype, setMorphologySubtype] = useState<MorphologySubtype>('VERB_PARSING')
  const [morphologyFields, setMorphologyFields] = useState<string[]>(
    SUBTYPE_FIELD_OPTIONS['VERB_PARSING'].map(f => f.key)
  )
  const [morphParseFilter, setMorphParseFilter] = useState<MorphParseFilter>({ ...DEFAULT_VERB_FILTER })
  const [filterOpen, setFilterOpen] = useState(false)
  const [vocabThruLesson, setVocabThruLesson] = useState<number | null>(null)
  const [allowLate, setAllowLate] = useState(false)
  const [lateDaysLimit, setLateDaysLimit] = useState(7)
  const [maxRetakes, setMaxRetakes] = useState<number | null>(null)
  // Wrong-answer appeals per attempt (vocab quizzes only). 0 = appeals off.
  const [maxAppeals, setMaxAppeals] = useState<number>(0)

  function set<K extends keyof AssignmentFormData>(key: K, val: AssignmentFormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    // Client-side validation for passage exercises/exams
    if ((form.type === 'TRANSLATION_EXERCISE' || form.type === 'TRANSLATION_EXAM') && !form.reference?.trim()) {
      setError('At least one passage reference is required (e.g. "John 1:1–18").')
      return
    }
    if (form.round1Deadline && form.round2Deadline && new Date(form.round2Deadline) <= new Date(form.round1Deadline)) {
      setError('The Round 2 deadline must be after the Round 1 deadline.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, ...form,
          // Convert datetime-local (instructor's local wall time) to a real UTC instant on the client,
          // so the stored deadline isn't shifted by the server's (UTC) timezone.
          submissionDeadline: form.submissionDeadline ? new Date(form.submissionDeadline).toISOString() : undefined,
          round1Deadline: form.round1Deadline ? new Date(form.round1Deadline).toISOString() : undefined,
          round2Deadline: form.round2Deadline ? new Date(form.round2Deadline).toISOString() : undefined,
          allowLate, lateDaysLimit: allowLate ? lateDaysLimit : null, maxRetakes,
          // Appeals are only meaningful on vocab quizzes; ignore the value otherwise
          maxAppeals: form.type === 'VOCABULARY_QUIZ' ? maxAppeals : 0,
          // quizStylePct (0–100) is the real open-ended/MC mix; provideDefinition is derived (>0 → typed answers graded leniently).
          isPublished: publishRef.current, ...(form.type === 'VOCABULARY_QUIZ' ? { quizStylePct, provideDefinition: quizStylePct > 0, vocabSubsections } : {}), ...(form.type === 'MORPHOLOGY_QUIZ' ? { morphologySubtype, vocabThruLesson, fields: morphologyFields, parseFilter: morphParseFilter } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create assignment')
      // If launched from a specific course page, return there so the new
      // assignment is immediately visible in the course's assignment list.
      if (defaultCourseId) {
        router.push(`/instructor/courses/${defaultCourseId}`)
      } else {
        router.push('/instructor/assignments')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating assignment')
    } finally {
      publishRef.current = false
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
          { value: 'TRANSLATION_EXAM',     label: 'Translation Exam' },
        ]}
      />

      {form.type === 'MORPHOLOGY_QUIZ' && (
        <>
          <MorphologySubtypePicker
            value={morphologySubtype}
            onChange={v => {
              setMorphologySubtype(v)
              setMorphologyFields(SUBTYPE_FIELD_OPTIONS[v].map(f => f.key))
              setMorphParseFilter(v === 'VERB_PARSING' ? { ...DEFAULT_VERB_FILTER } : {})
              setFilterOpen(false)
            }}
          />
          {SUBTYPE_FIELD_OPTIONS[morphologySubtype].length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">Fields to identify</p>
              <div className="flex flex-wrap gap-2">
                {SUBTYPE_FIELD_OPTIONS[morphologySubtype].map(opt => {
                  const checked = morphologyFields.includes(opt.key)
                  return (
                    <label
                      key={opt.key}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer select-none transition-colors ${
                        checked
                          ? 'bg-brand-50 border-brand-400 text-brand-800'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={e => {
                          setMorphologyFields(prev =>
                            e.target.checked ? [...prev, opt.key] : prev.filter(f => f !== opt.key)
                          )
                        }}
                      />
                      {opt.label}
                    </label>
                  )
                })}
              </div>
              {morphologyFields.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Select at least one field.</p>
              )}
            </div>
          )}
          {morphologySubtype === 'VERB_PARSING' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setFilterOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
              >
                <span>Restrict to specific tense / voice / mood…</span>
                <span className="text-gray-400">{filterOpen ? '▲' : '▼'}</span>
              </button>
              {filterOpen && (
                <div className="p-4 space-y-2">
                  <VerbParseFilterPicker
                    filter={morphParseFilter}
                    onChange={setMorphParseFilter}
                  />
                </div>
              )}
            </div>
          )}
          <VocabLessonFilter value={vocabThruLesson} onChange={setVocabThruLesson} />
        </>
      )}

      {form.type === 'VOCABULARY_QUIZ' && (
        <>
          {/* Choose the words for the quiz from the BGVB frequency list, by section
              (same source as the Vocab Builder / flashcards). */}
          <FrequencySectionPicker
            selectedSubsections={vocabSubsections}
            onChange={setVocabSubsections}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type of Quiz —{' '}
              <span className="text-brand-700 font-semibold">
                {quizStylePct === 0 ? 'All multiple-choice'
                  : quizStylePct === 100 ? 'All open-ended'
                  : `${100 - quizStylePct}% multiple-choice / ${quizStylePct}% open-ended`}
              </span>
            </label>
            <input
              type="range"
              min={0} max={100} step={1}
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
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-brand-800">📜 Exegesis Workspace Exercise</p>
          <p className="text-xs text-brand-700">
            Students will open the Exegesis Workspace with this passage pre-loaded. They can annotate
            each word (Parsing · Syntax · Translation) and submit their analysis.
          </p>
          <Input
            label="Passage reference (required)"
            value={form.reference ?? ''}
            onChange={e => set('reference', e.target.value)}
            placeholder="e.g. John 1:1–18"
          />
          <div>
            <Input
              label="Stage 1 time limit — annotation phase (minutes, 0 = no limit)"
              type="number"
              min={0}
              max={180}
              value={form.timePerQuestion ? Math.round(form.timePerQuestion / 60) : 0}
              onChange={e => set('timePerQuestion', Number(e.target.value) * 60 || undefined)}
            />
            <p className="mt-1 text-xs text-brand-600">
              Students annotate each word (Parsing · Syntax · Translation). When the timer reaches zero, annotations lock and review mode begins.
            </p>
          </div>
          <div>
            <Input
              label="Stage 2 time limit — review & correction phase (minutes, 0 = no limit)"
              type="number"
              min={0}
              max={60}
              value={form.reviewTimeSeconds ? Math.round(form.reviewTimeSeconds / 60) : 0}
              onChange={e => set('reviewTimeSeconds', Number(e.target.value) * 60 || undefined)}
            />
            <p className="mt-1 text-xs text-brand-600">
              After Stage 1 ends, students see the passage reader and can make corrections in red. When this timer expires, all edits lock and the exercise is submitted for grading.
            </p>
          </div>

          <div className="border-t border-brand-200 pt-3 space-y-3">
            <p className="text-sm font-semibold text-brand-800">Absolute deadlines (optional)</p>
            <p className="text-xs text-brand-700">
              Set a fixed date &amp; time (to the minute) after which students can no longer edit. These apply
              regardless of when a student starts, and work alongside the per-session timers above.
            </p>
            <div>
              <Input
                label="Submission deadline — students cannot submit after this point"
                type="datetime-local"
                value={form.submissionDeadline ?? ''}
                onChange={e => set('submissionDeadline', e.target.value || undefined)}
              />
              <p className="mt-1 text-xs text-brand-600">
                After this point students may still edit submitted work but cannot make a new submission. Leave blank for none.
              </p>
            </div>
            <div>
              <Input
                label="Round 1 deadline — annotations lock after this time"
                type="datetime-local"
                value={form.round1Deadline ?? ''}
                onChange={e => set('round1Deadline', e.target.value || undefined)}
              />
              <p className="mt-1 text-xs text-brand-600">Leave blank for no fixed Round 1 deadline.</p>
            </div>
            <div>
              <Input
                label="Round 2 deadline — corrections lock after this time"
                type="datetime-local"
                value={form.round2Deadline ?? ''}
                onChange={e => set('round2Deadline', e.target.value || undefined)}
              />
              <p className="mt-1 text-xs text-brand-600">Leave blank for no fixed Round 2 deadline.</p>
            </div>

            <div className="border-t border-brand-200 pt-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowReaderInRound2 ?? false}
                  onChange={e => set('allowReaderInRound2', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-medium text-brand-800">Allow Reader tools in Round 2</span>
                  <p className="text-xs text-brand-600 mt-0.5">
                    When on, students clicking a word in Round 2 can see the Reader's parsing, gloss, and lexicon entry alongside their correction box. Off by default.
                  </p>
                </div>
              </label>
            </div>

            <div className="border-t border-brand-200 pt-3">
              <label className="block text-sm font-medium text-brand-800 mb-1">Definition glossary</label>
              <select
                value={form.glossFrequency ?? ''}
                onChange={e => set('glossFrequency', e.target.value ? Number(e.target.value) : undefined)}
                className="input"
              >
                <option value="">Off — no glossary</option>
                <option value="50">Beginner — words rarer than 50×</option>
                <option value="30">Intermediate — words rarer than 30×</option>
              </select>
              <p className="text-xs text-brand-600 mt-1">Lists definitions for the verse&rsquo;s less-frequent words beneath each Verse Translation box.</p>
            </div>
          </div>
        </div>
      )}

      {form.type === 'TRANSLATION_EXAM' && (
        <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-brand-800 mb-1">Passages (one per line)</label>
            <textarea
              value={form.reference ?? ''}
              onChange={e => set('reference', e.target.value)}
              rows={4}
              className="input font-mono text-sm"
              placeholder={'John 15:1-4\nRomans 8:1-4\nMark 1:9-13'}
            />
            <p className="text-xs text-brand-600 mt-1">Students annotate (parsing, syntax, translation) every passage in one sitting. No second round.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-800 mb-1">Exam closes (final cut-off)</label>
            <input
              type="datetime-local"
              value={form.round1Deadline ?? ''}
              onChange={e => set('round1Deadline', e.target.value || undefined)}
              className="input"
            />
            <p className="text-xs text-brand-600 mt-1">At this time the exam locks and auto-submits the student&rsquo;s work.</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optional)</label>
        <textarea value={form.instructions ?? ''} onChange={e => set('instructions', e.target.value)}
          rows={3} className="input" placeholder="Additional instructions for students…" />
      </div>

      {form.type !== 'TRANSLATION_EXERCISE' && form.type !== 'TRANSLATION_EXAM' && (
        <Input label="Number of questions" type="number" min={1} max={50} value={form.numQuestions}
          onChange={e => set('numQuestions', Number(e.target.value))} />
      )}

      {form.type !== 'TRANSLATION_EXERCISE' && form.type !== 'TRANSLATION_EXAM' && (
        <Input
          label="Time per question (seconds, 0 = untimed)"
          type="number"
          min={0}
          max={300}
          value={form.timePerQuestion ?? 0}
          onChange={e => set('timePerQuestion', Number(e.target.value) || undefined)}
        />
      )}

      {form.type !== 'TRANSLATION_EXERCISE' && form.type !== 'TRANSLATION_EXAM' && (
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
      )}

      {form.type === 'VOCABULARY_QUIZ' && (
        <div>
          <Select
            label="Wrong-answer appeals per attempt"
            value={String(maxAppeals)}
            onChange={e => setMaxAppeals(Number(e.target.value))}
            options={[
              { value: '0', label: 'Off — students cannot appeal' },
              { value: '1', label: '1 appeal per attempt' },
              { value: '2', label: '2 appeals per attempt' },
              { value: '3', label: '3 appeals per attempt' },
              { value: '5', label: '5 appeals per attempt' },
            ]}
          />
          <p className="mt-1 text-xs text-gray-500">
            When enabled, students see an &ldquo;Appeal this answer&rdquo; link beside each wrong answer on the results screen.
            You review pending appeals on the Appeals page. Accepting updates the student&rsquo;s score; the admin separately
            decides whether to add the answer to the global lexicon.
          </p>
        </div>
      )}

      {form.type !== 'TRANSLATION_EXERCISE' && form.type !== 'TRANSLATION_EXAM' && (
        <LatePolicyFields
          allowLate={allowLate}
          lateDaysLimit={lateDaysLimit}
          onAllowLateChange={setAllowLate}
          onLateDaysLimitChange={setLateDaysLimit}
        />
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" loading={loading} variant="secondary" onClick={() => { publishRef.current = false }}>Save Draft</Button>
        <Button type="submit" loading={loading} onClick={() => { publishRef.current = true }}>Save &amp; Post</Button>
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

// ── Parse Filter Chip Group ───────────────────────────────────────────────────

function FilterChipGroup({
  label,
  options,
  selected,
  onChange,
  compact = false,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  compact?: boolean
}) {
  const allOn = options.every(o => selected.includes(o))

  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt])
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-600 w-24 shrink-0`}>{label}</span>
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`${compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'} rounded-full border font-medium transition-colors ${
                selected.includes(opt)
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
              }`}
            >
              {opt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(allOn ? [] : [...options])}
            className="px-2 py-0.5 text-xs rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-500 transition-colors"
          >
            {allOn ? 'none' : 'all'}
          </button>
        </div>
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-red-500 pl-28">Select at least one.</p>
      )}
    </div>
  )
}

// ── Verb Parse Filter Picker ──────────────────────────────────────────────────

function VerbParseFilterPicker({
  filter,
  onChange,
  compact = false,
}: {
  filter: MorphParseFilter
  onChange: (f: MorphParseFilter) => void
  compact?: boolean
}) {
  const selectedMoods  = filter.moods  ?? VERB_MOODS
  const hasNonPart     = selectedMoods.some(m => m !== 'Participle' && m !== 'Infinitive')
  const hasParticiple  = selectedMoods.includes('Participle')

  function patch(partial: Partial<MorphParseFilter>) {
    onChange({ ...filter, ...partial })
  }

  return (
    <div className="space-y-2">
      <FilterChipGroup compact={compact} label="Tense"   options={VERB_TENSES} selected={filter.tenses  ?? VERB_TENSES}  onChange={v => patch({ tenses: v })}  />
      <FilterChipGroup compact={compact} label="Voice"   options={VERB_VOICES} selected={filter.voices  ?? VERB_VOICES}  onChange={v => patch({ voices: v })}  />
      <FilterChipGroup compact={compact} label="Mood"    options={VERB_MOODS}  selected={filter.moods   ?? VERB_MOODS}   onChange={v => patch({ moods: v })}   />
      {hasNonPart && (
        <FilterChipGroup compact={compact} label="Person" options={PERSONS}    selected={filter.persons ?? PERSONS}      onChange={v => patch({ persons: v })} />
      )}
      <FilterChipGroup compact={compact} label="Number"  options={NUMBERS}     selected={filter.numbers ?? NUMBERS}      onChange={v => patch({ numbers: v })} />
      {hasParticiple && (
        <>
          <FilterChipGroup compact={compact} label="Ptc. Case"   options={NOUN_CASES} selected={filter.cases   ?? NOUN_CASES} onChange={v => patch({ cases: v })}   />
          <FilterChipGroup compact={compact} label="Ptc. Gender" options={GENDERS}    selected={filter.genders ?? GENDERS}    onChange={v => patch({ genders: v })} />
        </>
      )}
    </div>
  )
}

// ── Vocab Lesson Filter ───────────────────────────────────────────────────────

function VocabLessonFilter({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Limit words to vocabulary already learned
      </label>
      <div className="flex items-center gap-3">
        <select
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="input w-64"
        >
          <option value="">No limit — use all parsing examples</option>
          {VOCAB_LESSONS.map(l => (
            <option key={l.lesson} value={l.lesson}>
              Through Lesson {l.lesson} ({l.section}, ≥{l.occMin} occ.)
            </option>
          ))}
        </select>
      </div>
      {value && (
        <p className="text-xs text-amber-700 mt-1">
          Only parsing examples whose lexeme appears in vocab lessons 1–{value} will be used.
        </p>
      )}
    </div>
  )
}

// ── Morph Series Builder ──────────────────────────────────────────────────────

function MorphSeriesBuilder({
  series,
  onChange,
  availableDates,
}: {
  series: MorphTestConfig[]
  onChange: (s: MorphTestConfig[]) => void
  availableDates: number
}) {
  const [filterOpen, setFilterOpen] = useState<Record<number, boolean>>({})

  function toggleFilter(i: number) {
    setFilterOpen(prev => ({ ...prev, [i]: !prev[i] }))
  }

  function updateTest(i: number, patch: Partial<MorphTestConfig>) {
    const next = series.map((t, idx) => idx === i ? { ...t, ...patch } : t)
    onChange(next)
  }

  function addTest() {
    onChange([...series, { ...DEFAULT_MORPH_TEST }])
  }

  function removeTest(i: number) {
    onChange(series.filter((_, idx) => idx !== i))
  }

  function setCount(n: number) {
    const clamped = Math.max(1, Math.min(n, 20))
    if (clamped > series.length) {
      onChange([...series, ...Array.from({ length: clamped - series.length }, () => ({ ...DEFAULT_MORPH_TEST }))])
    } else {
      onChange(series.slice(0, clamped))
    }
  }

  const tooFewDates = availableDates > 0 && series.length > availableDates

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Tests in series</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCount(series.length - 1)}
            disabled={series.length <= 1}
            className="w-7 h-7 rounded-lg border border-gray-300 text-gray-600 text-lg leading-none hover:border-brand-400 disabled:opacity-40 flex items-center justify-center"
          >−</button>
          <span className="text-sm font-semibold text-gray-900 w-6 text-center">{series.length}</span>
          <button
            type="button"
            onClick={() => setCount(series.length + 1)}
            disabled={series.length >= 20}
            className="w-7 h-7 rounded-lg border border-gray-300 text-gray-600 text-lg leading-none hover:border-brand-400 disabled:opacity-40 flex items-center justify-center"
          >+</button>
        </div>
      </div>

      {tooFewDates && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {series.length} tests configured but only {availableDates} date{availableDates !== 1 ? 's' : ''} in the schedule.
          Update semester dates above or reduce the number of tests.
        </p>
      )}

      <div className="space-y-2">
        {series.map((test, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                Test {i + 1}
              </span>
              {series.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTest(i)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Subtype selector */}
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {MORPHOLOGY_SUBTYPES.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateTest(i, {
                    subtype: opt.value,
                    fields: SUBTYPE_FIELD_OPTIONS[opt.value].map(f => f.key),
                    parseFilter: opt.value === 'VERB_PARSING' ? { ...DEFAULT_VERB_FILTER } : undefined,
                  })}
                  className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                    test.subtype === opt.value
                      ? 'bg-brand-50 border-brand-400 text-brand-800 font-medium'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-brand-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Field checkboxes — shown when the subtype has configurable fields */}
            {SUBTYPE_FIELD_OPTIONS[test.subtype].length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">Fields to identify</p>
                <div className="flex flex-wrap gap-2">
                  {SUBTYPE_FIELD_OPTIONS[test.subtype].map(opt => {
                    const checked = test.fields.includes(opt.key)
                    return (
                      <label
                        key={opt.key}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                          checked
                            ? 'bg-brand-50 border-brand-400 text-brand-800'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={e => {
                            const next = e.target.checked
                              ? [...test.fields, opt.key]
                              : test.fields.filter(f => f !== opt.key)
                            updateTest(i, { fields: next })
                          }}
                        />
                        {opt.label}
                      </label>
                    )
                  })}
                </div>
                {test.fields.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Select at least one field.</p>
                )}
              </div>
            )}

            {/* Verb parse-value filter */}
            {test.subtype === 'VERB_PARSING' && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFilter(i)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors text-xs font-medium text-gray-700"
                >
                  <span>Restrict to specific tense / voice / mood…</span>
                  <span>{filterOpen[i] ? '▲' : '▼'}</span>
                </button>
                {filterOpen[i] && (
                  <div className="p-3 bg-white space-y-2">
                    <VerbParseFilterPicker
                      compact
                      filter={test.parseFilter ?? DEFAULT_VERB_FILTER}
                      onChange={f => updateTest(i, { parseFilter: f })}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Questions + vocab row */}
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Questions</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={test.numQuestions}
                  onChange={e => updateTest(i, { numQuestions: Math.max(1, Math.min(50, Number(e.target.value))) })}
                  className="input w-20 text-sm"
                />
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Vocab filter
                </label>
                <select
                  value={test.vocabThruLesson ?? ''}
                  onChange={e => updateTest(i, { vocabThruLesson: e.target.value === '' ? null : Number(e.target.value) })}
                  className="input text-sm w-full"
                >
                  <option value="">All parsing examples</option>
                  {VOCAB_LESSONS.map(l => (
                    <option key={l.lesson} value={l.lesson}>
                      Words through Lesson {l.lesson} ({l.section})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addTest}
        disabled={series.length >= 20}
        className="text-sm text-brand-700 hover:text-brand-900 hover:underline font-medium disabled:opacity-40"
      >
        + Add another test
      </button>
    </div>
  )
}

// ── Morphology Answer Display ─────────────────────────────────────────────────

function MorphAnswerDisplay({ raw }: { raw: string }) {
  let parsed: Record<string, string | null> = {}
  try { parsed = JSON.parse(raw) } catch { return <p className="text-xs text-green-700 mt-1">{raw}</p> }
  const fields = Object.entries(parsed).filter(([, v]) => v != null && v !== '')
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {fields.map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1 text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 rounded-full">
          <span className="text-green-500 font-medium capitalize">{k === 'casus' ? 'case' : k}:</span>
          {v}
        </span>
      ))}
    </div>
  )
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
                  {quizType === 'MORPHOLOGY_QUIZ' && q.type === 'MORPHOLOGY_IDENTIFY' ? (
                    <span className="font-greek text-xl text-ink-900">{q.prompt}</span>
                  ) : quizType === 'MORPHOLOGY_QUIZ' ? (
                    <span className="whitespace-pre-line text-gray-900">{q.prompt}</span>
                  ) : quizType === 'VOCABULARY_QUIZ' ? (
                    <span className="font-greek text-lg text-ink-900">{q.prompt}</span>
                  ) : (
                    <span className="font-greek text-ink-900">{q.prompt}</span>
                  )}
                </p>

                {quizType === 'MORPHOLOGY_QUIZ' && q.type === 'MORPHOLOGY_IDENTIFY' ? (
                  <div className="mt-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 italic">
                    Student selects each parse category (part of speech, tense, voice, mood…)
                  </div>
                ) : quizType === 'VOCABULARY_QUIZ' && provideDefinition ? (
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
                  quizType === 'MORPHOLOGY_QUIZ' && q.type === 'MORPHOLOGY_IDENTIFY' ? (
                    <MorphAnswerDisplay raw={q.correctAnswer} />
                  ) : (
                    <p className="text-xs text-green-700 mt-1">
                      Answer: <span className="font-medium">{q.correctAnswer}</span>
                    </p>
                  )
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
  const publishRef = useRef(false)
  const [previewFlash, setPreviewFlash] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const [sampleOpen, setSampleOpen] = useState(false)
  const [sampleData, setSampleData] = useState<SampleData | null>(null)
  const [sampleLoading, setSampleLoading] = useState(false)

  const [form, setForm] = useState<SemesterForm>({
    courseId:         defaultCourseId ?? courses[0]?.id ?? '',
    startDate:        '',
    weeks:            16,
    days:             [4],   // Thursday by default
    quizType:          'VOCABULARY_QUIZ',
    vocabSubsections:  [],
    morphologySubtype: 'VERB_PARSING' as MorphologySubtype,
    morphologySeries:  [{ ...DEFAULT_MORPH_TEST }],
    level:             courses[0]?.level ?? 'BEGINNING',
    prevSectionsPct:  0,
    quizStylePct:     0,
    numQuestions:     20,
    timePerQuestion:  0,
    allowLate:        false,
    lateDaysLimit:    7,
    maxRetakes:       null,
    maxAppeals:       0,
  })

  function setF<K extends keyof SemesterForm>(key: K, val: SemesterForm[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function toggleDay(day: number) {
    setF('days', form.days.includes(day)
      ? form.days.filter(d => d !== day)
      : [...form.days, day].sort((a, b) => a - b))
  }

  function handleUpdate() {
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setPreviewFlash(true)
    setTimeout(() => setPreviewFlash(false), 800)
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
      const firstTest = form.morphologySeries[0]
      const previewSubtype = form.quizType === 'MORPHOLOGY_QUIZ'
        ? (firstTest?.subtype ?? form.morphologySubtype)
        : form.morphologySubtype
      const previewVocab = form.quizType === 'MORPHOLOGY_QUIZ' && firstTest?.vocabThruLesson
        ? String(firstTest.vocabThruLesson)
        : undefined
      const params = new URLSearchParams({
        quizType: form.quizType,
        level:    form.level,
        count:    '5',
        week:     '1',
        ...(form.quizType === 'MORPHOLOGY_QUIZ' ? { morphologySubtype: previewSubtype } : {}),
        ...(previewVocab ? { vocabThruLesson: previewVocab } : {}),
      })
      const res = await fetch(`/api/assignments/sample?${params}`)
      const data = await res.json()
      setSampleData(data)
    } catch {
      setSampleData({ questions: [], lesson: null })
    } finally {
      setSampleLoading(false)
    }
  }, [form.quizType, form.level, form.morphologySubtype, form.morphologySeries])

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
          isPublished: publishRef.current,
          schedule: schedule.map(s => ({ week: s.week, dueDate: s.date })),
          ...(form.quizType === 'MORPHOLOGY_QUIZ' ? { morphologySeries: form.morphologySeries } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create schedule')
      setSuccess(data.count)
      setTimeout(() => { router.push('/instructor/assignments'); router.refresh() }, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating schedule')
    } finally {
      publishRef.current = false
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

          {form.quizType === 'MORPHOLOGY_QUIZ' && (
            <MorphSeriesBuilder
              series={form.morphologySeries}
              onChange={s => setF('morphologySeries', s)}
              availableDates={schedule.length}
            />
          )}

          {form.quizType === 'VOCABULARY_QUIZ' && (
            <>
              <FrequencySectionPicker
                selectedSubsections={form.vocabSubsections}
                onChange={keys => setF('vocabSubsections', keys)}
              />
              {/* Removed: "Questions from previous sections %" slider — backend
                  doesn't yet honour the value, so it was UI-only. */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Quiz —{' '}
                  <span className="text-brand-700 font-semibold">
                    {form.quizStylePct === 0 ? 'All multiple-choice'
                      : form.quizStylePct === 100 ? 'All open-ended'
                      : `${100 - form.quizStylePct}% multiple-choice / ${form.quizStylePct}% open-ended`}
                  </span>
                </label>
                <input
                  type="range"
                  min={0} max={100} step={1}
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

          {form.quizType !== 'MORPHOLOGY_QUIZ' && (
            <Input
              label="Questions per quiz"
              type="number"
              min={1}
              max={50}
              value={form.numQuestions}
              onChange={e => setF('numQuestions', Number(e.target.value))}
            />
          )}

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

        {form.quizType === 'VOCABULARY_QUIZ' && (
          <div>
            <Select
              label="Wrong-answer appeals per attempt"
              value={String(form.maxAppeals)}
              onChange={e => setF('maxAppeals', Number(e.target.value))}
              options={[
                { value: '0', label: 'Off — students cannot appeal' },
                { value: '1', label: '1 appeal per attempt' },
                { value: '2', label: '2 appeals per attempt' },
                { value: '3', label: '3 appeals per attempt' },
                { value: '5', label: '5 appeals per attempt' },
              ]}
            />
            <p className="mt-1 text-xs text-gray-500">
              Applied to <strong>every</strong> quiz created in this schedule. You can still adjust each one
              afterwards in its individual settings.
            </p>
          </div>
        )}

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
          <div ref={previewRef} className={`border rounded-xl overflow-hidden transition-colors duration-300 ${previewFlash ? 'border-brand-400 ring-2 ring-brand-300' : 'border-brand-100'}`}>
            <div className="bg-brand-50 px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-800">
                {form.quizType === 'MORPHOLOGY_QUIZ'
                  ? `Schedule preview — ${form.morphologySeries.length} test${form.morphologySeries.length !== 1 ? 's' : ''} (using first ${form.morphologySeries.length} date${form.morphologySeries.length !== 1 ? 's' : ''})`
                  : `Schedule preview — ${schedule.length} quiz${schedule.length !== 1 ? 'zes' : ''}`}
              </span>
              <span className="text-xs text-brand-600">
                {form.weeks} week{form.weeks !== 1 ? 's' : ''} · {form.days.length} day{form.days.length !== 1 ? 's' : ''}/week
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {(form.quizType === 'MORPHOLOGY_QUIZ' ? schedule.slice(0, form.morphologySeries.length) : schedule).map((s, i) => {
                const lesson = form.quizType === 'VOCABULARY_QUIZ' ? getLessonForWeek(s.week) : null
                const sectionLabel = lesson ? lesson.section.replace('-', ':') : null
                const morphTest = form.quizType === 'MORPHOLOGY_QUIZ' ? form.morphologySeries[i] : null
                const morphLabel = morphTest ? MORPH_SUBTYPE_SHORT[morphTest.subtype] : null
                const vocabLabel = morphTest?.vocabThruLesson
                  ? `vocab ≤ L${morphTest.vocabThruLesson}`
                  : null
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="text-gray-400 w-16 shrink-0 text-xs">Wk {s.week}</span>
                    {morphTest && (
                      <span className="shrink-0 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                        Test {i + 1}
                      </span>
                    )}
                    {morphLabel && (
                      <span className="shrink-0 text-xs text-brand-700">{morphLabel}</span>
                    )}
                    {vocabLabel && (
                      <span className="shrink-0 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{vocabLabel}</span>
                    )}
                    {sectionLabel && (
                      <span className="text-xs font-medium text-brand-600 shrink-0">{sectionLabel}</span>
                    )}
                    <span className="text-gray-700 truncate">{s.label}</span>
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

        {(() => {
          const effectiveCount = form.quizType === 'MORPHOLOGY_QUIZ'
            ? Math.min(form.morphologySeries.length, schedule.length)
            : schedule.length
          const disabled = schedule.length === 0 || form.days.length === 0 ||
            (form.quizType === 'MORPHOLOGY_QUIZ' && form.morphologySeries.length === 0)
          return (
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button
                type="button"
                variant="secondary"
                disabled={disabled}
                onClick={handleUpdate}
              >
                Update Preview{effectiveCount > 0 ? ` (${effectiveCount})` : ''}
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={disabled}
                onClick={() => { publishRef.current = true }}
              >
                Save &amp; Post{effectiveCount > 0 ? ` (${effectiveCount})` : ''}
              </Button>
            </div>
          )
        })()}
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
