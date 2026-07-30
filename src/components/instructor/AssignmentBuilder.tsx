'use client'
import { useState, useMemo, useRef, useEffect, FormEvent, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format, getDay, parseISO } from 'date-fns'
import { CalendarDays, FileText, CheckCircle2, Download, Eye } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { GRAMMAR_HOMEWORK_SETS } from '@/data/grammar-homework'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toEndOfDayLocalISO, toDueISO } from '@/lib/due-date'
import { FrequencySectionPicker } from '@/components/vocab/FrequencySectionPicker'
import { subsectionKeysBefore, wordsForSelection } from '@/lib/vocab-subsections'
import { MIN_LOCKDOWN_AUTOSUBMIT } from '@/lib/constants'
import { ConstructSearchFields } from '@/components/instructor/ConstructSearchFields'
import { DEFAULT_CONSTRUCT_CONFIG, parseConstructLink } from '@/lib/construct-assignment'
import type { AssignmentFormData, AssignmentType } from '@/types/assignment'
import type { MorphologySubtype, MorphTestConfig, MorphParseFilter } from '@/lib/quiz-fields'
import { SUBTYPE_FIELD_OPTIONS, VERB_TENSES, VERB_VOICES, VERB_MOODS, PERSONS, NUMBERS, NOUN_CASES, GENDERS, PRONOUN_TYPES } from '@/lib/quiz-fields'
import type { CourseLevel } from '@/types/course'
import { getLessonForWeek, minOccurrencesThrough, VOCAB_LESSONS, type VocabLesson } from '@/lib/vocab-lesson-map'

// ── Constants ─────────────────────────────────────────────────────────────────

// ── Parse-filter value lists ───────────────────────────────────────────────────

// Value lists come from '@/lib/quiz-fields' so the builder and generator never drift
// (no Optative; 'Deponent' is a real tagged voice in the corpus).

/** Subtypes that support restricting the question pool by parse values. */
const PARSE_FILTER_SUBTYPES: MorphologySubtype[] =
  ['VERB_PARSING', 'NOUN_PARSING', 'ADJECTIVE_PARSING', 'PRONOUN_PARSING', 'MIXED']

/** Default parse filter — every value selected (i.e. no restriction). */
const DEFAULT_PARSE_FILTER: MorphParseFilter = {
  tenses:  [...VERB_TENSES],
  voices:  [...VERB_VOICES],
  moods:   [...VERB_MOODS],
  persons: [...PERSONS],
  numbers: [...NUMBERS],
  cases:   [...NOUN_CASES],
  genders: [...GENDERS],
  pronounTypes: [...PRONOUN_TYPES],
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
  startDate: string
  endDate: string
}

interface SemesterForm {
  courseId: string
  seriesName: string      // optional custom series name: "Week N — <name> (<topic|section>)"
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
  // Default to the vocabulary schedule: week N tests only words taught through lesson N.
  // The instructor can still choose "All parsing examples" or a fixed lesson.
  vocabAuto: true,
  fields: SUBTYPE_FIELD_OPTIONS['VERB_PARSING'].map(f => f.key),
  parseFilter: { ...DEFAULT_PARSE_FILTER },
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

/**
 * Return every date in [startDate, startDate + weeks*7) whose weekday is in `days`.
 *
 * Week numbers count from the COURSE start when one is known, so a series that begins
 * mid-term (e.g. morphology starting week 3, after the alphabet weeks) is titled
 * "Week 3 —" and — critically — its vocabulary caps track the words actually taught
 * by that course week, not by the series' own first week.
 */
function buildSchedule(startDate: string, weeks: number, days: number[], courseStart?: string): ScheduledQuiz[] {
  if (!startDate || weeks < 1 || days.length === 0) return []
  const start = parseISO(startDate)
  const origin = courseStart ? parseISO(courseStart) : start
  // Days from the course start to the series start (0 when the series starts the term,
  // never negative — a series scheduled before the course simply counts as week 1).
  const lead = Math.max(0, Math.round((start.getTime() - origin.getTime()) / 86_400_000))
  const result: ScheduledQuiz[] = []
  const totalDays = weeks * 7

  for (let d = 0; d < totalDays; d++) {
    const date = addDays(start, d)
    if (days.includes(getDay(date))) {
      const week = Math.floor((lead + d) / 7) + 1
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
            className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
              value === opt.value
                ? 'bg-brand-50 border-brand-400 ring-1 ring-brand-300'
                : 'bg-surface border-gray-200 hover:border-brand-300'
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
    allowLate: false, lateDaysLimit: 7, notesFolderName: '', homeworkSet: '',
  })
  // Optional time of day for the due date. Kept out of `form` because the whole form is
  // spread into the create request, and this is a display-side companion to dueDate that
  // gets folded into it on save rather than a field of its own.
  const [dueTime, setDueTime] = useState('')
  const [quizStylePct, setQuizStylePct] = useState(0)
  // Vocab word selection over the BGVB list: frequency subsections.
  const [vocabSubsections, setVocabSubsections] = useState<string[]>([])
  const [vocabReviewPct, setVocabReviewPct] = useState(0)   // % of the pool from earlier sections
  // How many words precede the selection — 0 means there is nothing to review, so hide the control.
  const earlierWordCount = useMemo(() => {
    const keys = subsectionKeysBefore(vocabSubsections)
    // NB wordsForSelection([]) means "all sections", so an empty key list must short-circuit.
    return keys.length === 0 ? 0 : wordsForSelection(keys, []).length
  }, [vocabSubsections])
  const [morphologySubtype, setMorphologySubtype] = useState<MorphologySubtype>('VERB_PARSING')
  const [morphologyFields, setMorphologyFields] = useState<string[]>(
    SUBTYPE_FIELD_OPTIONS['VERB_PARSING'].map(f => f.key)
  )
  const [morphParseFilter, setMorphParseFilter] = useState<MorphParseFilter>({ ...DEFAULT_PARSE_FILTER })
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

  // The quiz chrome below (question count, per-question timer, retakes) only means anything
  // for the types whose questions are generated. Every other type has its own panel above.
  const isQuizType = form.type === 'VOCABULARY_QUIZ' || form.type === 'MORPHOLOGY_QUIZ' || form.type === 'PASSAGE_VOCABULARY'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    // Client-side validation for passage exercises/exams
    if ((form.type === 'TRANSLATION_EXERCISE' || form.type === 'TRANSLATION_EXAM') && !form.reference?.trim()
        && !(form.type === 'TRANSLATION_EXERCISE' && form.homeworkSet)) {
      setError('At least one passage reference is required (e.g. "John 1:1–18").')
      return
    }
    if (form.type === 'COURSE_NOTES' && !form.notesFolderName?.trim()) {
      setError('A folder name is required (e.g. "Judaism").')
      return
    }
    // The construct link IS the assignment, so it has to be one the app can actually run.
    if (form.type === 'CONSTRUCT_SEARCH' && !parseConstructLink(form.constructUrl ?? '')) {
      setError('Paste a construct search link — run your search on the Construct page, then use its “Copy link” button.')
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
          // A calendar due date closes at the end of that day in the instructor's
          // local timezone (not UTC midnight) — or at the Due time if one was given.
          ...(form.dueDate ? { dueDate: toDueISO(form.dueDate, dueTime) } : {}),
          // Exams hide Week/Due date — default them so the record stays valid (week 1;
          // due date = the exam's close date, falling back to today).
          ...(form.type === 'TRANSLATION_EXAM' ? {
            weekNumber: form.weekNumber || 1,
            dueDate: toEndOfDayLocalISO(form.round1Deadline || new Date().toISOString()),
          } : {}),
          // Translation exercises hide Due date — derive it from the Round deadlines
          // (Round 1 → Round 2 → today) so the close window is driven by the rounds.
          ...(form.type === 'TRANSLATION_EXERCISE' ? {
            dueDate: toEndOfDayLocalISO(form.round1Deadline || form.round2Deadline || form.dueDate || new Date().toISOString()),
          } : {}),
          // Convert datetime-local (instructor's local wall time) to a real UTC instant on the client,
          // so the stored deadline isn't shifted by the server's (UTC) timezone.
          opensAt: form.opensAt ? new Date(form.opensAt).toISOString() : undefined,
          submissionDeadline: form.submissionDeadline ? new Date(form.submissionDeadline).toISOString() : undefined,
          round1Deadline: form.round1Deadline ? new Date(form.round1Deadline).toISOString() : undefined,
          round2Deadline: form.round2Deadline ? new Date(form.round2Deadline).toISOString() : undefined,
          allowLate, lateDaysLimit: allowLate ? lateDaysLimit : null, maxRetakes,
          // Appeals are only meaningful on vocab quizzes; ignore the value otherwise
          maxAppeals: form.type === 'VOCABULARY_QUIZ' ? maxAppeals : 0,
          // quizStylePct (0–100) is the real open-ended/MC mix; provideDefinition is derived (>0 → typed answers graded leniently).
          isPublished: publishRef.current, ...(form.type === 'VOCABULARY_QUIZ' ? { quizStylePct, provideDefinition: quizStylePct > 0, vocabSubsections, vocabReviewPct } : {}), ...(form.type === 'MORPHOLOGY_QUIZ' ? { morphologySubtype, vocabThruLesson, fields: morphologyFields, parseFilter: morphParseFilter } : {}),
          // Construct searches store the search as the assignment's reference — the server
          // re-parses it, so a pasted absolute URL is normalised to a same-origin path there.
          ...(form.type === 'CONSTRUCT_SEARCH' ? { constructUrl: form.constructUrl, constructCount: form.constructCount, constructAskTranslation: form.constructAskTranslation, constructAskComment: form.constructAskComment } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create assignment')
      // Return to the assignment's course (the one launched from, or the one the
      // instructor picked in the selector) so the new assignment is immediately visible.
      router.push(`/instructor/courses/${defaultCourseId ?? courseId}`)
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
      {/* Show the course selector when there's a choice to make, or when launched from
          the dashboard (no course pre-selected) so the instructor allocates it explicitly. */}
      {(courses.length > 1 || !defaultCourseId) && (
        <Select
          label="Course"
          value={courseId}
          onChange={e => {
            const c = courses.find(c => c.id === e.target.value)
            setCourseId(e.target.value)
            if (c) set('level', c.level)
          }}
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
          { value: 'TRANSLATION_EXAM',     label: 'Translation Exam' },
          { value: 'COURSE_NOTES',         label: 'Course Notes' },
          { value: 'GROUP_PRESENTATION',   label: 'Group Presentation' },
          { value: 'CONSTRUCT_SEARCH',     label: 'Construct Search' },
        ]}
      />

      {form.type === 'CONSTRUCT_SEARCH' && (
        <ConstructSearchFields
          url={form.constructUrl ?? ''}
          onUrl={v => set('constructUrl', v)}
          count={form.constructCount ?? DEFAULT_CONSTRUCT_CONFIG.requiredCount}
          onCount={v => set('constructCount', v)}
          askTranslation={form.constructAskTranslation ?? DEFAULT_CONSTRUCT_CONFIG.askTranslation}
          onAskTranslation={v => set('constructAskTranslation', v)}
          askComment={form.constructAskComment ?? DEFAULT_CONSTRUCT_CONFIG.askComment}
          onAskComment={v => set('constructAskComment', v)}
        />
      )}

      {form.type === 'COURSE_NOTES' && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-brand-800">📓 Course Notes</p>
          <p className="text-xs text-brand-700">
            Every enrolled student is given a notes folder with the name below. They write study notes into it
            (from the reader or the Notes page) and submit the folder for grading. You read their notes and enter
            a grade out of 100; it flows into the gradebook like any other assignment.
          </p>
          <Input
            label="Folder name (required)"
            required
            value={form.notesFolderName ?? ''}
            onChange={e => set('notesFolderName', e.target.value)}
            placeholder="e.g. Judaism"
          />
        </div>
      )}

      {form.type === 'GROUP_PRESENTATION' && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-brand-800">👥 Group Presentation</p>
          <p className="text-xs text-brand-700">
            Assign students to groups from the <span className="font-medium">Course groups</span> panel on the course page,
            then link each group to this presentation. Each member writes their own section in a shared pane and signs an
            individual AI/sources statement; the group submits once for a single group grade. The <span className="font-medium">Due date</span> below
            is the submission deadline — after it passes you can approve a late submission per group from the grading page.
          </p>
        </div>
      )}

      {form.type === 'MORPHOLOGY_QUIZ' && (
        <>
          <MorphologySubtypePicker
            value={morphologySubtype}
            onChange={v => {
              setMorphologySubtype(v)
              setMorphologyFields(SUBTYPE_FIELD_OPTIONS[v].map(f => f.key))
              setMorphParseFilter(v === 'VERB_PARSING' ? { ...DEFAULT_PARSE_FILTER } : {})
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
                          : 'bg-surface border-gray-200 text-gray-500 hover:border-gray-400'
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
          {PARSE_FILTER_SUBTYPES.includes(morphologySubtype) && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setFilterOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
              >
                <span>Restrict to specific forms…</span>
                <span className="text-gray-400">{filterOpen ? '▲' : '▼'}</span>
              </button>
              {filterOpen && (
                <div className="p-4 space-y-2">
                  <ParseFilterPicker
                    subtype={morphologySubtype}
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
          {earlierWordCount > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review from earlier sections —{' '}
                <span className="text-brand-700 font-semibold">
                  {vocabReviewPct === 0
                    ? 'Selected sections only'
                    : `${vocabReviewPct}% earlier / ${100 - vocabReviewPct}% selected`}
                </span>
              </label>
              <input
                type="range"
                min={0} max={100} step={5}
                value={vocabReviewPct}
                onChange={e => setVocabReviewPct(Number(e.target.value))}
                className="w-full h-2 cursor-pointer rounded-lg accent-brand-600 [appearance:auto]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Blends in words from the {earlierWordCount} words in sections before your
                selection, so students keep reviewing. The quiz stores the whole pool and draws
                a fresh sample each attempt, so this sets the mix of the pool.
              </p>
            </div>
          )}
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

      {form.type !== 'TRANSLATION_EXAM' && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Week number" type="number" min={1} required value={form.weekNumber}
            onChange={e => set('weekNumber', Number(e.target.value))} />
          {/* Translation exercises take their close date from the Round deadlines, so the
              Due date is derived on save rather than entered here. */}
          {form.type !== 'TRANSLATION_EXERCISE' && (
            <Input label="Due date" type="date" required value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)} />
          )}
          {/* Optional. Blank closes the assignment at the end of the due date, which is how
              every assignment behaved before timed deadlines existed. */}
          {form.type !== 'TRANSLATION_EXERCISE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due time (optional)</label>
              <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="input" />
              <p className="text-xs text-gray-500 mt-1">
                {dueTime ? `Closes at ${dueTime} your time.` : 'Blank = end of the due date (11:59 pm).'}
              </p>
            </div>
          )}
        </div>
      )}

      {form.type === 'TRANSLATION_EXAM' && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-brand-800">📜 Translation Exam</p>
          <p className="text-xs text-brand-700">
            Students translate several passages in one sitting (parsing · syntax · translation per word),
            with a single cut-off after which the exam locks and auto-submits. No Round 2, no PDF.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passages (one reference per line, required)</label>
            <textarea
              value={form.reference ?? ''}
              onChange={e => set('reference', e.target.value)}
              rows={4}
              className="input"
              placeholder={'John 15:1-4\nRomans 8:1-4\nMark 1:9-13'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam opens (date &amp; time)</label>
            <input
              type="datetime-local"
              value={form.opensAt ?? ''}
              onChange={e => set('opensAt', e.target.value || undefined)}
              className="input"
            />
            <p className="mt-1 text-xs text-brand-600">Students cannot start the exam before this time. Leave blank to open immediately.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam closes (date &amp; time)</label>
            <input
              type="datetime-local"
              value={form.round1Deadline ?? ''}
              onChange={e => set('round1Deadline', e.target.value || undefined)}
              className="input"
            />
            <p className="mt-1 text-xs text-brand-600">At this cut-off the exam locks and auto-submits.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Definition glossary</label>
            <select
              value={form.glossFrequency ?? ''}
              onChange={e => set('glossFrequency', e.target.value ? Number(e.target.value) : undefined)}
              className="input"
            >
              <option value="">Off — no glossary</option>
              <option value="50">Beginner — words less frequent than 50×</option>
              <option value="30">Intermediate — words less frequent than 30×</option>
            </select>
            <p className="mt-1 text-xs text-brand-600">Lists definitions for each passage&rsquo;s less-frequent words beneath its verse translation box.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade weights (parsing / syntax / translation)</label>
            <div className="flex flex-wrap gap-3">
              {(['parsing', 'syntax', 'translation'] as const).map(c => {
                const w = form.gradeWeights ?? { parsing: 33, syntax: 33, translation: 34 }
                return (
                  <div key={c} className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-600 capitalize w-20">{c === 'translation' ? 'Translation' : c}</span>
                    <input
                      type="number" min={0} max={100}
                      value={w[c]}
                      onChange={e => set('gradeWeights', { ...w, [c]: Number(e.target.value) })}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                )
              })}
            </div>
            <p className="mt-1 text-xs text-brand-600">Each passage grade is the weighted average of its parsing, syntax, and translation sub-scores.</p>
          </div>
          <div className="border-t border-brand-200 pt-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.lockdown}
                onChange={e => set('lockdown', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Lockdown mode</span>
                <p className="text-xs text-brand-600 mt-0.5">
                  Requires fullscreen, detects tab/window switching, blocks copy &amp; paste, and logs integrity
                  events for you to review. Note: a browser can deter and detect, but cannot fully prevent cheating.
                </p>
              </div>
            </label>
            {form.lockdown && (
              <div className="mt-2 ml-6">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Auto-submit after</label>
                  <input
                    type="number" min={MIN_LOCKDOWN_AUTOSUBMIT} max={50}
                    value={form.lockdownMaxViolations ?? ''}
                    onChange={e => {
                      const v = e.target.value ? Number(e.target.value) : undefined
                      // Blank = warn only. Any positive value is floored so a single stray
                      // violation can never end a student's exam.
                      set('lockdownMaxViolations', v != null && v > 0 ? Math.max(v, MIN_LOCKDOWN_AUTOSUBMIT) : undefined)
                    }}
                    placeholder="—"
                    className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <span className="text-xs text-gray-600">violations (blank = warn only, never auto-submit)</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Leave blank to only log violations (recommended — pair with proctoring). If set, the minimum is {MIN_LOCKDOWN_AUTOSUBMIT}, so an accidental focus-loss can&rsquo;t end an exam.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {form.type === 'TRANSLATION_EXERCISE' && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-brand-800">Exegesis Workspace Exercise</p>
          <p className="text-xs text-brand-700">
            Students will open the Exegesis Workspace with this passage pre-loaded. They can annotate
            each word (Parsing · Syntax · Translation) and submit their analysis.
          </p>
          <div>
            <Select
              label="Grammar homework set (optional)"
              value={form.homeworkSet ?? ''}
              onChange={e => set('homeworkSet', e.target.value)}
              placeholder="None — passage-based exercise"
              options={GRAMMAR_HOMEWORK_SETS.map(s => ({ value: s.id, label: s.title }))}
            />
            <p className="mt-1 text-xs text-brand-600">
              A homework set replaces the passage: students work the deck&rsquo;s Exercises sentences
              word-by-word (parsing · syntax · translation) in the homework pane, and you grade each
              sentence into the gradebook. No passage reference needed.
            </p>
          </div>
          {form.homeworkSet ? (
            <Input
              label="Deadline"
              type="date"
              value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
            />
          ) : (
          <Input
            label="Passage reference (required)"
            value={form.reference ?? ''}
            onChange={e => set('reference', e.target.value)}
            placeholder="e.g. John 1:1–18"
          />
          )}
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
              regardless of when a student starts, and work alongside the per-session timers above. The exercise
              closes at the Round 2 deadline (or Round 1 if there&rsquo;s no Round 2); the due date is set from these.
            </p>
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
                <option value="50">Beginner — words less frequent than 50×</option>
                <option value="30">Intermediate — words less frequent than 30×</option>
              </select>
              <p className="text-xs text-brand-600 mt-1">Lists definitions for the verse&rsquo;s less-frequent words beneath each Verse Translation box.</p>
            </div>
          </div>
        </div>
      )}


      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optional)</label>
        <textarea value={form.instructions ?? ''} onChange={e => set('instructions', e.target.value)}
          rows={3} className="input" placeholder="Additional instructions for students…" />
      </div>

      {isQuizType && (
        <Input label="Number of questions" type="number" min={1} max={50} value={form.numQuestions}
          onChange={e => set('numQuestions', Number(e.target.value))} />
      )}

      {isQuizType && (
        <Input
          label="Time per question (seconds, 0 = untimed)"
          type="number"
          min={0}
          max={300}
          value={form.timePerQuestion ?? 0}
          onChange={e => set('timePerQuestion', Number(e.target.value) || undefined)}
        />
      )}

      {isQuizType && (
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

      {form.type !== 'TRANSLATION_EXERCISE' && form.type !== 'TRANSLATION_EXAM' && form.type !== 'GROUP_PRESENTATION' && (
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
              className={`${compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'} rounded-lg border font-medium transition-colors ${
                selected.includes(opt)
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-surface border-gray-300 text-gray-500 hover:border-gray-400'
              }`}
            >
              {opt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(allOn ? [] : [...options])}
            className="px-2 py-0.5 text-xs rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-gray-500 transition-colors"
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

function ParseFilterPicker({
  subtype,
  filter,
  onChange,
  compact = false,
}: {
  subtype: MorphologySubtype
  filter: MorphParseFilter
  onChange: (f: MorphParseFilter) => void
  compact?: boolean
}) {
  const isVerb     = subtype === 'VERB_PARSING' || subtype === 'MIXED'
  const isNominal  = subtype === 'NOUN_PARSING' || subtype === 'ADJECTIVE_PARSING'
                     || subtype === 'PRONOUN_PARSING' || subtype === 'MIXED'
  const isPronoun  = subtype === 'PRONOUN_PARSING' || subtype === 'MIXED'
  const selectedMoods  = filter.moods  ?? VERB_MOODS
  const hasNonPart     = selectedMoods.some(m => m !== 'Participle' && m !== 'Infinitive')
  const hasParticiple  = selectedMoods.includes('Participle')
  // Case/gender belong to nominals always, and to verbs only once participles are in scope.
  const showCaseGender = isNominal || (isVerb && hasParticiple)
  const cgPrefix       = !isNominal && isVerb ? 'Ptc. ' : ''

  function patch(partial: Partial<MorphParseFilter>) {
    onChange({ ...filter, ...partial })
  }

  return (
    <div className="space-y-2">
      {isVerb && <>
        <FilterChipGroup compact={compact} label="Tense"   options={VERB_TENSES} selected={filter.tenses  ?? VERB_TENSES}  onChange={v => patch({ tenses: v })}  />
        <FilterChipGroup compact={compact} label="Voice"   options={VERB_VOICES} selected={filter.voices  ?? VERB_VOICES}  onChange={v => patch({ voices: v })}  />
        <FilterChipGroup compact={compact} label="Mood"    options={VERB_MOODS}  selected={filter.moods   ?? VERB_MOODS}   onChange={v => patch({ moods: v })}   />
      </>}
      {((isVerb && hasNonPart) || isPronoun) && (
        <FilterChipGroup compact={compact} label="Person" options={PERSONS}    selected={filter.persons ?? PERSONS}      onChange={v => patch({ persons: v })} />
      )}
      <FilterChipGroup compact={compact} label="Number"  options={NUMBERS}     selected={filter.numbers ?? NUMBERS}      onChange={v => patch({ numbers: v })} />
      {showCaseGender && (
        <>
          <FilterChipGroup compact={compact} label={`${cgPrefix}Case`}   options={NOUN_CASES} selected={filter.cases   ?? NOUN_CASES} onChange={v => patch({ cases: v })}   />
          <FilterChipGroup compact={compact} label={`${cgPrefix}Gender`} options={GENDERS}    selected={filter.genders ?? GENDERS}    onChange={v => patch({ genders: v })} />
        </>
      )}
      {isPronoun && (
        <FilterChipGroup compact={compact} label="Pronoun type" options={PRONOUN_TYPES} selected={filter.pronounTypes ?? PRONOUN_TYPES} onChange={v => patch({ pronounTypes: v })} />
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
              Through Lesson {l.lesson} ({l.section}, ≥{minOccurrencesThrough(l.lesson) ?? l.occMin} occ.)
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

const SUBTYPE_LABEL_FALLBACK: Record<string, string> = {
  VERB_PARSING: 'Verb Parsing', NOUN_PARSING: 'Noun Parsing', ADJECTIVE_PARSING: 'Adjective Parsing',
  PRONOUN_PARSING: 'Pronoun Parsing', CONDITIONALS: 'Conditional Sentences',
  SUBJUNCTIVES: 'Subjunctive Uses', MIXED: 'Mixed Parsing',
}

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
                    parseFilter: PARSE_FILTER_SUBTYPES.includes(opt.value) ? { ...DEFAULT_PARSE_FILTER } : undefined,
                  })}
                  className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                    test.subtype === opt.value
                      ? 'bg-brand-50 border-brand-400 text-brand-800 font-medium'
                      : 'bg-surface border-gray-200 text-gray-700 hover:border-brand-300'
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
                            : 'bg-surface border-gray-200 text-gray-500 hover:border-gray-400'
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

            {/* Topic — names the quiz: "Week N — <series> (<topic>)" */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 shrink-0">Topic (for the title)</label>
              <input
                type="text"
                value={test.topic ?? ''}
                onChange={e => updateTest(i, { topic: e.target.value })}
                placeholder={SUBTYPE_LABEL_FALLBACK[test.subtype] ?? ''}
                className="input text-sm flex-1"
              />
            </div>

            {/* Noun quizzes: restrict by declension (classified by lemma ending + gender,
                so "Nouns I: 1st & 2nd Declension" / "Nouns II: 3rd" can be built here). */}
            {test.subtype === 'NOUN_PARSING' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Declensions</span>
                {([1, 2, 3] as const).map(d => {
                  const on = test.declensions?.includes(d) ?? false
                  return (
                    <button key={d} type="button"
                      onClick={() => {
                        const cur = new Set(test.declensions ?? [])
                        if (on) cur.delete(d); else cur.add(d)
                        const next = ([1, 2, 3] as const).filter(x => cur.has(x))
                        updateTest(i, { declensions: next.length && next.length < 3 ? next : undefined })
                      }}
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                        on ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                      {d === 1 ? '1st' : d === 2 ? '2nd' : '3rd'}
                    </button>
                  )
                })}
                <span className="text-xs text-gray-400">none selected = all declensions</span>
              </div>
            )}

            {/* Verb parse-value filter */}
            {PARSE_FILTER_SUBTYPES.includes(test.subtype) && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFilter(i)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors text-xs font-medium text-gray-700"
                >
                  <span>Restrict to specific forms…</span>
                  <span>{filterOpen[i] ? '▲' : '▼'}</span>
                </button>
                {filterOpen[i] && (
                  <div className="p-3 bg-surface space-y-2">
                    <ParseFilterPicker
                      compact
                      subtype={test.subtype}
                      filter={test.parseFilter ?? DEFAULT_PARSE_FILTER}
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
                  value={test.vocabAuto ? 'AUTO' : test.vocabThruLesson ?? ''}
                  onChange={e => updateTest(i, e.target.value === 'AUTO'
                    ? { vocabAuto: true, vocabThruLesson: null }
                    : { vocabAuto: false, vocabThruLesson: e.target.value === '' ? null : Number(e.target.value) })}
                  className="input text-sm w-full"
                >
                  <option value="">All parsing examples</option>
                  {/* Ties each week's morphology quiz to the vocabulary taught by that week. */}
                  <option value="AUTO">Match vocabulary schedule (words taught so far)</option>
                  {VOCAB_LESSONS.map(l => (
                    <option key={l.lesson} value={l.lesson}>
                      Words through Lesson {l.lesson} ({l.section})
                    </option>
                  ))}
                </select>
                {test.vocabAuto && (
                  <p className="text-xs text-gray-500 mt-1">
                    Week 1 uses Lesson 1 words, week 2 Lessons 1–2, and so on.
                  </p>
                )}
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
  // Saved series templates: the form snapshot minus course and dates, so the same series
  // can be rebuilt next term against a new course and start date.
  type Template = { id: string; name: string; quizType: string; config: Partial<SemesterForm> }
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateMsg, setTemplateMsg] = useState('')
  useEffect(() => {
    fetch('/api/series-templates').then(r => r.ok ? r.json() : { templates: [] })
      .then(d => setTemplates(d.templates ?? [])).catch(() => {})
  }, [])

  async function saveTemplate(current: SemesterForm) {
    const name = window.prompt('Template name (an existing name is overwritten):',
      current.seriesName || (current.quizType === 'MORPHOLOGY_QUIZ' ? 'Morphology series' : 'Vocabulary series'))
    if (!name?.trim()) return
    const { courseId: _c, startDate: _d, ...config } = current
    const res = await fetch('/api/series-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), quizType: current.quizType, config }),
    })
    if (res.ok) {
      const d = await res.json()
      setTemplateMsg(d.updated ? `Updated template “${name.trim()}”.` : `Saved template “${name.trim()}”.`)
      const list = await fetch('/api/series-templates').then(r => r.json()).catch(() => null)
      if (list) setTemplates(list.templates ?? [])
    } else {
      setTemplateMsg('Could not save the template.')
    }
  }

  function loadTemplate(id: string) {
    const t = templates.find(x => x.id === id)
    if (!t) return
    // Course and start date stay: the template is the series recipe, not the term.
    setForm(prev => ({ ...prev, ...t.config, courseId: prev.courseId, startDate: prev.startDate }))
    setTemplateMsg(`Loaded “${t.name}” — pick the start date and course, then create.`)
  }

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
    seriesName:        '',
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

  const selectedCourse = courses.find(c => c.id === form.courseId)
  const schedule = useMemo(
    () => buildSchedule(form.startDate, form.weeks, form.days, selectedCourse?.startDate),
    [form.startDate, form.weeks, form.days, selectedCourse?.startDate]
  )

  // The schedule counts weeks forward from the start date and knows nothing about when
  // the course actually ends, so a series can run past the last day of term — those
  // quizzes exist but no student ever sits them. Surface the overrun before it is saved.
  const overrun = useMemo(() => {
    if (!selectedCourse || schedule.length === 0) return null
    const end = new Date(selectedCourse.endDate).getTime() + 24 * 60 * 60 * 1000
    const past = schedule.filter(s => s.date.getTime() >= end)
    if (past.length === 0) return null
    const weeksThatFit = new Set(schedule.filter(s => s.date.getTime() < end).map(s => s.week)).size
    return { count: past.length, weeksThatFit, courseEnd: new Date(selectedCourse.endDate) }
  }, [selectedCourse, schedule])

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
        ...(form.quizType === 'VOCABULARY_QUIZ' ? { prevPct: String(form.prevSectionsPct) } : {}),
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
          schedule: schedule.map(s => ({ week: s.week, dueDate: toEndOfDayLocalISO(format(s.date, 'yyyy-MM-dd')) })),
          ...(form.quizType === 'MORPHOLOGY_QUIZ' ? { morphologySeries: form.morphologySeries } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create schedule')
      setSuccess(data.count)
      setTimeout(() => { router.push(`/instructor/courses/${form.courseId}`); router.refresh() }, 1800)
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

        {/* Course — shown when there's a choice, or when launched from the dashboard
            (no course pre-selected) so the instructor allocates it explicitly. */}
        {/* Series templates: rebuild a saved series next term with one click. */}
        <div className="flex flex-wrap items-end gap-2">
          {templates.length > 0 && (
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start from a saved series</label>
              <select
                className="input w-full text-sm"
                defaultValue=""
                onChange={e => { if (e.target.value) loadTemplate(e.target.value) }}
              >
                <option value="">— choose a template —</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.quizType === 'MORPHOLOGY_QUIZ' ? 'morphology' : 'vocabulary'})</option>
                ))}
              </select>
            </div>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={() => void saveTemplate(form)}>
            Save current setup as template
          </Button>
          {templateMsg && <p className="basis-full text-xs text-emerald-700">{templateMsg}</p>}
        </div>

        {(courses.length > 1 || !defaultCourseId) && (
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
                      : 'bg-surface border-gray-300 text-gray-600 hover:border-brand-400'
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

          {/* Names the whole run: quizzes become "Week N — <name> (<topic|section>)" and the
              course page groups them under this name in the series editor. */}
          <Input
            label="Series name (optional)"
            type="text"
            value={form.seriesName}
            onChange={e => setF('seriesName', e.target.value)}
            placeholder={form.quizType === 'MORPHOLOGY_QUIZ' ? 'e.g. Beginning Greek Morphology' : 'e.g. Weekly Vocabulary'}
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
              {form.vocabSubsections.length === 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review from earlier lessons —{' '}
                    <span className="text-brand-700 font-semibold">
                      {form.prevSectionsPct === 0
                        ? 'This week’s words only'
                        : `${form.prevSectionsPct}% earlier / ${100 - form.prevSectionsPct}% this week`}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={0} max={100} step={5}
                    value={form.prevSectionsPct}
                    onChange={e => setF('prevSectionsPct', Number(e.target.value))}
                    className="w-full h-2 cursor-pointer rounded-lg accent-brand-600 [appearance:auto]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Each week&rsquo;s quiz draws this share of its questions from <em>all</em> vocabulary
                    covered in earlier weeks, so students keep reviewing. Week 1 has nothing earlier,
                    so it uses its own list only.
                  </p>
                </div>
              )}
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

        {/* Runs past the end of term — the quizzes would be created but never sat. */}
        {overrun && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">
              {overrun.count} quiz{overrun.count !== 1 ? 'zes' : ''} fall after this course ends
              ({format(overrun.courseEnd, 'MMM d, yyyy')}).
            </p>
            <p className="mt-1 text-amber-800">
              Only {overrun.weeksThatFit} week{overrun.weeksThatFit !== 1 ? 's' : ''} fit inside the
              course. Students would never see the later quizzes
              {form.quizType === 'VOCABULARY_QUIZ' && ', so the last vocabulary sections would go untaught'}.
              {' '}Reduce the length of the semester to {overrun.weeksThatFit}, or extend the course dates.
            </p>
            <button
              type="button"
              onClick={() => setF('weeks', overrun.weeksThatFit)}
              className="mt-2 text-sm font-medium text-amber-900 underline hover:no-underline"
            >
              Set to {overrun.weeksThatFit} weeks
            </button>
          </div>
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
                ? 'bg-surface text-brand-700 shadow-sm'
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
