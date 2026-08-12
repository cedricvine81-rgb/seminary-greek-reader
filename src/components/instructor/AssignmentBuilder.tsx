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
import { DECKS, deckKeysBefore, deckWordsForSelection } from '@/lib/vocab-decks'
import { MIN_LOCKDOWN_AUTOSUBMIT } from '@/lib/constants'
import { ConstructSearchFields } from '@/components/instructor/ConstructSearchFields'
import { DEFAULT_CONSTRUCT_CONFIG, parseConstructLink } from '@/lib/construct-assignment'
import type { AssignmentFormData, AssignmentType } from '@/types/assignment'
import type { MorphologySubtype, MorphTestConfig, MorphParseFilter } from '@/lib/quiz-fields'
import { SUBTYPE_FIELD_OPTIONS, VERB_TENSES, VERB_VOICES, VERB_MOODS, PERSONS, NUMBERS, NOUN_CASES, GENDERS, PRONOUN_TYPES } from '@/lib/quiz-fields'
import {
  morphSubtypesFor, morphFieldOptionsFor, HEBREW_DEFAULT_PARSE_FILTER,
  POOL_STEMS, POOL_CONJUGATIONS, POOL_PERSONS, POOL_GENDERS, POOL_NUMBERS,
  POOL_STATES, POOL_PRONOUN_TYPES, type HebrewMorphParseFilter,
} from '@/lib/quiz-fields-hebrew'
import { isHebrewLevel } from '@/lib/constants'
import { scriptProps } from '@/lib/script-detect'
import type { CourseLevel } from '@/types/course'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { formatDate, formatDateLong } from '@/lib/i18n/format'
import { featureLabel, groupLabel } from '@/lib/i18n/morph-labels'
import {
  SINGLE_ASSIGNMENT_TYPES, SERIES_ASSIGNMENT_TYPES, retakeOptions, appealOptions, glossaryOptions,
} from '@/lib/assignment-display'
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

// The subtype list now comes from morphSubtypesFor(level) in quiz-fields-hebrew.ts, which
// returns the Greek seven or the Hebrew five. Every NAME still comes from the catalogue.

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6]


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
  const t = useT()
  return (
    <fieldset className="border border-gray-200 rounded-xl p-5 space-y-4">
      <legend className="text-sm font-semibold text-gray-700 px-1">{t('inst.b.lateLegend')}</legend>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={allowLate}
          onChange={e => onAllowLateChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-gray-700">{t('inst.b.allowLate')}</span>
      </label>
      {allowLate && (
        <div className="pl-7">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('inst.b.lateDeadline')}
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
              {lateDaysLimit === 0 ? t('inst.b.lateNoLimit') : t('inst.b.lateDaysAfter')}
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
      result.push({ week, date })
    }
  }
  return result
}

// ── Morphology Subtype Picker ─────────────────────────────────────────────────

function MorphologySubtypePicker({
  value,
  onChange,
  level,
}: {
  value: MorphologySubtype
  onChange: (v: MorphologySubtype) => void
  /** The course's level. Hebrew has no Conditionals/Subjunctives sets, so it offers five. */
  level: string
}) {
  const t = useT()
  const subtypes = morphSubtypesFor(level) as MorphologySubtype[]
  return (
    <div>
      <p className="block text-sm font-medium text-gray-700 mb-2">{t('inst.b.morphFocus')}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {subtypes.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
              value === opt
                ? 'bg-brand-50 border-brand-400 ring-1 ring-brand-300'
                : 'bg-surface border-gray-200 hover:border-brand-300'
            }`}
          >
            <span className={`block text-sm font-medium ${value === opt ? 'text-brand-800' : 'text-gray-800'}`}>
              {t(`morph.subtype.${opt}`)}
            </span>
            <span className="block text-xs text-gray-500 mt-0.5">{t(`morph.subtypeDesc.${opt}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Single Assignment Form ────────────────────────────────────────────────────

function SingleForm({ courses, defaultCourseId }: { courses: Course[]; defaultCourseId?: string }) {
  const t = useT()
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
  // Counted against the COURSE's deck: on a Hebrew course the Greek helpers would report a
  // review pool that does not exist, and the generator draws from the Hebrew deck.
  const earlierWordCount = useMemo(() => {
    const deck = DECKS[isHebrewLevel(courseLevel) ? 'hebrew' : 'greek']
    const keys = deckKeysBefore(deck, vocabSubsections)
    // NB an empty key list means "all sections" downstream, so short-circuit it.
    return keys.length === 0 ? 0 : deckWordsForSelection(deck, keys, []).length
  }, [vocabSubsections, courseLevel])
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
      setError(t('inst.b.err.passageRequired'))
      return
    }
    if (form.type === 'COURSE_NOTES' && !form.notesFolderName?.trim()) {
      setError(t('inst.b.err.folderRequired'))
      return
    }
    // The construct link IS the assignment, so it has to be one the app can actually run.
    if (form.type === 'CONSTRUCT_SEARCH' && !parseConstructLink(form.constructUrl ?? '')) {
      setError(t('inst.b.err.constructLink'))
      return
    }
    if (form.round1Deadline && form.round2Deadline && new Date(form.round2Deadline) <= new Date(form.round1Deadline)) {
      setError(t('inst.b.err.roundOrder'))
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
      if (!res.ok) throw new Error(data.error ?? t('inst.b.err.createAssignment'))
      // Return to the assignment's course (the one launched from, or the one the
      // instructor picked in the selector) so the new assignment is immediately visible.
      router.push(`/instructor/courses/${defaultCourseId ?? courseId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('inst.b.err.creatingAssignment'))
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
          label={t('inst.b.course')}
          value={courseId}
          onChange={e => {
            const c = courses.find(c => c.id === e.target.value)
            setCourseId(e.target.value)
            if (c) set('level', c.level)
          }}
          options={courses.map(c => ({ value: c.id, label: c.name }))}
        />
      )}

      <Input label={t('inst.b.title')} required value={form.title} onChange={e => set('title', e.target.value)} placeholder={t('inst.b.titleExample')} />

      {/* Names come from assign.type.*, the namespace the student side reads too — this list
          and the series form's were the fifth and sixth hand-maintained copies of this enum. */}
      <Select
        label={t('inst.b.assignmentType')}
        value={form.type}
        onChange={e => set('type', e.target.value as AssignmentType)}
        options={SINGLE_ASSIGNMENT_TYPES.map(v => ({ value: v, label: t(`assign.type.${v}`) }))}
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
          <p className="text-sm font-semibold text-brand-800">📓 {t('inst.b.notes.heading')}</p>
          <p className="text-xs text-brand-700">{t('inst.b.notes.desc')}</p>
          <Input
            label={t('inst.b.notes.folderName')}
            required
            value={form.notesFolderName ?? ''}
            onChange={e => set('notesFolderName', e.target.value)}
            placeholder={t('inst.b.notes.folderExample')}
          />
        </div>
      )}

      {form.type === 'GROUP_PRESENTATION' && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-brand-800">👥 {t('inst.b.group.heading')}</p>
          <p className="text-xs text-brand-700">{t('inst.b.group.desc')}</p>
        </div>
      )}

      {form.type === 'MORPHOLOGY_QUIZ' && (
        <>
          <MorphologySubtypePicker
            level={courseLevel}
            value={morphologySubtype}
            onChange={v => {
              setMorphologySubtype(v)
              setMorphologyFields(morphFieldOptionsFor(courseLevel, v).map(f => f.key))
              setMorphParseFilter(v === 'VERB_PARSING'
                ? (isHebrewLevel(courseLevel)
                    ? { ...HEBREW_DEFAULT_PARSE_FILTER } as MorphParseFilter
                    : { ...DEFAULT_PARSE_FILTER })
                : {})
              setFilterOpen(false)
            }}
          />
          {morphFieldOptionsFor(courseLevel, morphologySubtype).length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">{t('inst.b.fieldsToIdentify')}</p>
              <div className="flex flex-wrap gap-2">
                {morphFieldOptionsFor(courseLevel, morphologySubtype).map(opt => {
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
                      {featureLabel(opt.label, t)}
                    </label>
                  )
                })}
              </div>
              {morphologyFields.length === 0 && (
                <p className="text-xs text-red-500 mt-1">{t('inst.b.selectOneField')}</p>
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
                <span>{t('inst.b.restrictForms')}</span>
                <span className="text-gray-400">{filterOpen ? '▲' : '▼'}</span>
              </button>
              {filterOpen && (
                <div className="p-4 space-y-2">
                  {isHebrewLevel(courseLevel) ? (
                    <HebrewParseFilterPicker
                      subtype={morphologySubtype}
                      filter={morphParseFilter as HebrewMorphParseFilter}
                      onChange={f => setMorphParseFilter(f as MorphParseFilter)}
                    />
                  ) : (
                    <ParseFilterPicker
                      subtype={morphologySubtype}
                      filter={morphParseFilter}
                      onChange={setMorphParseFilter}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {/* The vocab cap is a BGVB-lesson cap, so it applies to Greek only — a Hebrew
              course has no lesson map yet, and offering it would suggest a filter that
              silently does nothing. */}
          {!isHebrewLevel(courseLevel) && (
            <VocabLessonFilter value={vocabThruLesson} onChange={setVocabThruLesson} />
          )}
        </>
      )}

      {form.type === 'VOCABULARY_QUIZ' && (
        <>
          {/* Choose the words for the quiz by frequency section — the same deck the student
              studies on /vocab, Greek or Hebrew according to the course. */}
          <FrequencySectionPicker
            lang={isHebrewLevel(courseLevel) ? 'hebrew' : 'greek'}
            selectedSubsections={vocabSubsections}
            onChange={setVocabSubsections}
          />
          {earlierWordCount > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inst.b.reviewEarlierSections')} —{' '}
                <span className="text-brand-700 font-semibold">
                  {vocabReviewPct === 0
                    ? t('inst.b.reviewSelectedOnly')
                    : t('inst.b.reviewMix', { earlier: vocabReviewPct, rest: 100 - vocabReviewPct })}
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
                {t('inst.b.reviewHelp', { n: earlierWordCount })}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inst.b.quizStyle')} —{' '}
              <span className="text-brand-700 font-semibold">
                {quizStylePct === 0 ? t('inst.b.styleAllMc')
                  : quizStylePct === 100 ? t('inst.b.styleAllOpen')
                  : t('inst.b.styleMix', { mc: 100 - quizStylePct, open: quizStylePct })}
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
              <span>{t('inst.b.chooseDefinition')}</span>
              <span>{t('inst.b.provideDefinition')}</span>
            </div>
          </div>
        </>
      )}

      {form.type !== 'TRANSLATION_EXAM' && (
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('inst.b.weekNumber')} type="number" min={1} required value={form.weekNumber}
            onChange={e => set('weekNumber', Number(e.target.value))} />
          {/* Translation exercises take their close date from the Round deadlines, so the
              Due date is derived on save rather than entered here. */}
          {form.type !== 'TRANSLATION_EXERCISE' && (
            <Input label={t('inst.b.dueDate')} type="date" required value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)} />
          )}
          {/* Optional. Blank closes the assignment at the end of the due date, which is how
              every assignment behaved before timed deadlines existed. */}
          {form.type !== 'TRANSLATION_EXERCISE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.dueTime')}</label>
              <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="input" />
              <p className="text-xs text-gray-500 mt-1">
                {dueTime ? t('inst.b.dueTimeSet', { time: dueTime }) : t('inst.b.dueTimeBlank')}
              </p>
            </div>
          )}
        </div>
      )}

      {form.type === 'TRANSLATION_EXAM' && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-brand-800">📜 {t('inst.b.exam.heading')}</p>
          <p className="text-xs text-brand-700">{t('inst.b.exam.desc')}</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.exam.passages')}</label>
            <textarea
              value={form.reference ?? ''}
              onChange={e => set('reference', e.target.value)}
              rows={4}
              className="input"
              placeholder={'John 15:1-4\nRomans 8:1-4\nMark 1:9-13'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.exam.opens')}</label>
            <input
              type="datetime-local"
              value={form.opensAt ?? ''}
              onChange={e => set('opensAt', e.target.value || undefined)}
              className="input"
            />
            <p className="mt-1 text-xs text-brand-600">{t('inst.b.exam.opensHelp')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.exam.closes')}</label>
            <input
              type="datetime-local"
              value={form.round1Deadline ?? ''}
              onChange={e => set('round1Deadline', e.target.value || undefined)}
              className="input"
            />
            <p className="mt-1 text-xs text-brand-600">{t('inst.b.exam.closesHelp')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.glossary')}</label>
            <select
              value={form.glossFrequency ?? ''}
              onChange={e => set('glossFrequency', e.target.value ? Number(e.target.value) : undefined)}
              className="input"
            >
              {glossaryOptions(t).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-brand-600">{t('inst.b.glossaryHelpExam')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.exam.weights')}</label>
            <div className="flex flex-wrap gap-3">
              {(['parsing', 'syntax', 'translation'] as const).map(c => {
                const w = form.gradeWeights ?? { parsing: 33, syntax: 33, translation: 34 }
                return (
                  <div key={c} className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-600 capitalize w-20">{t(`inst.b.exam.w${c[0].toUpperCase()}${c.slice(1)}`)}</span>
                    <input
                      type="number" min={0} max={100}
                      value={w[c]}
                      onChange={e => set('gradeWeights', { ...w, [c]: Number(e.target.value) })}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                )
              })}
            </div>
            <p className="mt-1 text-xs text-brand-600">{t('inst.b.exam.weightsHelp')}</p>
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
                <span className="text-sm font-medium text-gray-700">{t('inst.b.lockdown')}</span>
                <p className="text-xs text-brand-600 mt-0.5">{t('inst.b.lockdownHelp')}</p>
              </div>
            </label>
            {form.lockdown && (
              <div className="mt-2 ml-6">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">{t('inst.b.autoSubmitAfter')}</label>
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
                    className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-xs text-gray-600">{t('inst.b.violations')}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  {t('inst.b.violationsHelp', { n: MIN_LOCKDOWN_AUTOSUBMIT })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {form.type === 'TRANSLATION_EXERCISE' && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-brand-800">{t('inst.b.ex.heading')}</p>
          <p className="text-xs text-brand-700">{t('inst.b.ex.desc')}</p>
          <div>
            <Select
              label={t('inst.b.ex.homeworkSet')}
              value={form.homeworkSet ?? ''}
              onChange={e => set('homeworkSet', e.target.value)}
              placeholder={t('inst.b.ex.homeworkNone')}
              options={GRAMMAR_HOMEWORK_SETS.map(s => ({ value: s.id, label: s.title }))}
            />
            <p className="mt-1 text-xs text-brand-600">{t('inst.b.ex.homeworkHelp')}</p>
          </div>
          {form.homeworkSet ? (
            <Input
              label={t('inst.b.ex.deadline')}
              type="date"
              value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
            />
          ) : (
          <Input
            label={t('inst.b.ex.passage')}
            value={form.reference ?? ''}
            onChange={e => set('reference', e.target.value)}
            placeholder={t('inst.b.ex.passageExample')}
          />
          )}
          <div>
            <Input
              label={t('inst.b.ex.stage1')}
              type="number"
              min={0}
              max={180}
              value={form.timePerQuestion ? Math.round(form.timePerQuestion / 60) : 0}
              onChange={e => set('timePerQuestion', Number(e.target.value) * 60 || undefined)}
            />
            <p className="mt-1 text-xs text-brand-600">{t('inst.b.ex.stage1Help')}</p>
          </div>
          <div>
            <Input
              label={t('inst.b.ex.stage2')}
              type="number"
              min={0}
              max={60}
              value={form.reviewTimeSeconds ? Math.round(form.reviewTimeSeconds / 60) : 0}
              onChange={e => set('reviewTimeSeconds', Number(e.target.value) * 60 || undefined)}
            />
            <p className="mt-1 text-xs text-brand-600">{t('inst.b.ex.stage2Help')}</p>
          </div>

          <div className="border-t border-brand-200 pt-3 space-y-3">
            <p className="text-sm font-semibold text-brand-800">{t('inst.b.ex.absolute')}</p>
            <p className="text-xs text-brand-700">{t('inst.b.ex.absoluteHelp')}</p>
            <div>
              <Input
                label={t('inst.b.ex.round1')}
                type="datetime-local"
                value={form.round1Deadline ?? ''}
                onChange={e => set('round1Deadline', e.target.value || undefined)}
              />
              <p className="mt-1 text-xs text-brand-600">{t('inst.b.ex.round1Help')}</p>
            </div>
            <div>
              <Input
                label={t('inst.b.ex.round2')}
                type="datetime-local"
                value={form.round2Deadline ?? ''}
                onChange={e => set('round2Deadline', e.target.value || undefined)}
              />
              <p className="mt-1 text-xs text-brand-600">{t('inst.b.ex.round2Help')}</p>
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
                  <span className="text-sm font-medium text-brand-800">{t('inst.b.ex.readerRound2')}</span>
                  <p className="text-xs text-brand-600 mt-0.5">{t('inst.b.ex.readerRound2Help')}</p>
                </div>
              </label>
            </div>

            <div className="border-t border-brand-200 pt-3">
              <label className="block text-sm font-medium text-brand-800 mb-1">{t('inst.b.glossary')}</label>
              <select
                value={form.glossFrequency ?? ''}
                onChange={e => set('glossFrequency', e.target.value ? Number(e.target.value) : undefined)}
                className="input"
              >
                {glossaryOptions(t).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p className="text-xs text-brand-600 mt-1">{t('inst.b.glossaryHelpExercise')}</p>
            </div>
          </div>
        </div>
      )}


      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.instructions')}</label>
        <textarea value={form.instructions ?? ''} onChange={e => set('instructions', e.target.value)}
          rows={3} className="input" placeholder={t('inst.b.instructionsExample')} />
      </div>

      {isQuizType && (
        <Input label={t('inst.b.numQuestions')} type="number" min={1} max={50} value={form.numQuestions}
          onChange={e => set('numQuestions', Number(e.target.value))} />
      )}

      {isQuizType && (
        <Input
          label={t('inst.b.timePerQuestion')}
          type="number"
          min={0}
          max={300}
          value={form.timePerQuestion ?? 0}
          onChange={e => set('timePerQuestion', Number(e.target.value) || undefined)}
        />
      )}

      {isQuizType && (
        <Select
          label={t('inst.b.retakes')}
          value={maxRetakes === null ? '' : String(maxRetakes)}
          onChange={e => setMaxRetakes(e.target.value === '' ? null : Number(e.target.value))}
          options={retakeOptions(t)}
          placeholder={t('inst.b.retakesUnlimited')}
        />
      )}

      {form.type === 'VOCABULARY_QUIZ' && (
        <div>
          <Select
            label={t('inst.b.appeals')}
            value={String(maxAppeals)}
            onChange={e => setMaxAppeals(Number(e.target.value))}
            options={appealOptions(t)}
          />
          <p className="mt-1 text-xs text-gray-500">{t('inst.b.appealsHelp')}</p>
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
        <Button type="button" variant="ghost" onClick={() => router.back()}>{t('inst.b.cancel')}</Button>
        <Button type="submit" loading={loading} variant="secondary" onClick={() => { publishRef.current = false }}>{t('inst.b.saveDraft')}</Button>
        <Button type="submit" loading={loading} onClick={() => { publishRef.current = true }}>{t('inst.b.savePost')}</Button>
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
  lang?: 'greek' | 'hebrew'   // which script the prompts are in
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
  const t = useT()
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
              {featureLabel(opt, t)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(allOn ? [] : [...options])}
            className="px-2 py-0.5 text-xs rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-gray-500 transition-colors"
          >
            {allOn ? t('inst.b.filterNone') : t('inst.b.filterAll')}
          </button>
        </div>
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-red-500 pl-28">{t('inst.b.selectOne')}</p>
      )}
    </div>
  )
}

// ── Hebrew Parse Filter Picker ────────────────────────────────────────────────
// Kept separate from the Greek picker below rather than genericising it: that one has
// Greek-specific display logic (case/gender appear only once participles are in scope,
// prefixed "participle:"), and Hebrew's conditionals are different — state belongs to
// nominals and participles, person to finite verbs and personal pronouns.

function HebrewParseFilterPicker({
  subtype,
  filter,
  onChange,
  compact = false,
}: {
  subtype: MorphologySubtype
  filter: HebrewMorphParseFilter
  onChange: (f: HebrewMorphParseFilter) => void
  compact?: boolean
}) {
  const t = useT()
  const isVerb    = subtype === 'VERB_PARSING' || subtype === 'MIXED'
  const isNominal = subtype === 'NOUN_PARSING' || subtype === 'ADJECTIVE_PARSING'
                    || subtype === 'PRONOUN_PARSING' || subtype === 'MIXED'
  const isPronoun = subtype === 'PRONOUN_PARSING' || subtype === 'MIXED'

  const selectedConj = filter.conjugations ?? POOL_CONJUGATIONS
  const hasFinite    = selectedConj.some(c => !c.includes('participle') && !c.startsWith('Infinitive'))
  const hasParticiple = selectedConj.some(c => c.includes('participle'))
  // State belongs to nominals always, and to verbs only once participles are in scope.
  const showState = isNominal || (isVerb && hasParticiple)
  const statePrefix = !isNominal && isVerb ? t('inst.b.ptcPrefix') : ''

  function patch(partial: Partial<HebrewMorphParseFilter>) {
    onChange({ ...filter, ...partial })
  }

  return (
    <div className="space-y-2">
      {isVerb && <>
        <FilterChipGroup compact={compact} label={groupLabel('stem', t, 'Stem (binyan)')} options={POOL_STEMS} selected={filter.stems ?? POOL_STEMS} onChange={v => patch({ stems: v })} />
        <FilterChipGroup compact={compact} label={groupLabel('conjugation', t, 'Conjugation')} options={POOL_CONJUGATIONS} selected={selectedConj} onChange={v => patch({ conjugations: v })} />
      </>}
      {((isVerb && hasFinite) || isPronoun) && (
        <FilterChipGroup compact={compact} label={groupLabel('person', t, 'Person')} options={POOL_PERSONS} selected={filter.persons ?? POOL_PERSONS} onChange={v => patch({ persons: v })} />
      )}
      <FilterChipGroup compact={compact} label={groupLabel('gender', t, 'Gender')} options={POOL_GENDERS} selected={filter.genders ?? POOL_GENDERS} onChange={v => patch({ genders: v })} />
      <FilterChipGroup compact={compact} label={groupLabel('number', t, 'Number')} options={POOL_NUMBERS} selected={filter.numbers ?? POOL_NUMBERS} onChange={v => patch({ numbers: v })} />
      {showState && (
        <FilterChipGroup compact={compact} label={`${statePrefix}${groupLabel('state', t, 'State')}`} options={POOL_STATES} selected={filter.states ?? POOL_STATES} onChange={v => patch({ states: v })} />
      )}
      {isPronoun && (
        <FilterChipGroup compact={compact} label={groupLabel('pronounType', t, 'Pronoun type')} options={POOL_PRONOUN_TYPES} selected={filter.types ?? POOL_PRONOUN_TYPES} onChange={v => patch({ types: v })} />
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
  const t = useT()
  const isVerb     = subtype === 'VERB_PARSING' || subtype === 'MIXED'
  const isNominal  = subtype === 'NOUN_PARSING' || subtype === 'ADJECTIVE_PARSING'
                     || subtype === 'PRONOUN_PARSING' || subtype === 'MIXED'
  const isPronoun  = subtype === 'PRONOUN_PARSING' || subtype === 'MIXED'
  const selectedMoods  = filter.moods  ?? VERB_MOODS
  const hasNonPart     = selectedMoods.some(m => m !== 'Participle' && m !== 'Infinitive')
  const hasParticiple  = selectedMoods.includes('Participle')
  // Case/gender belong to nominals always, and to verbs only once participles are in scope.
  const showCaseGender = isNominal || (isVerb && hasParticiple)
  const cgPrefix       = !isNominal && isVerb ? t('inst.b.ptcPrefix') : ''

  function patch(partial: Partial<MorphParseFilter>) {
    onChange({ ...filter, ...partial })
  }

  return (
    <div className="space-y-2">
      {isVerb && <>
        <FilterChipGroup compact={compact} label={groupLabel('tense', t, 'Tense')} options={VERB_TENSES} selected={filter.tenses  ?? VERB_TENSES}  onChange={v => patch({ tenses: v })}  />
        <FilterChipGroup compact={compact} label={groupLabel('voice', t, 'Voice')} options={VERB_VOICES} selected={filter.voices  ?? VERB_VOICES}  onChange={v => patch({ voices: v })}  />
        <FilterChipGroup compact={compact} label={groupLabel('mood', t, 'Mood')}   options={VERB_MOODS}  selected={filter.moods   ?? VERB_MOODS}   onChange={v => patch({ moods: v })}   />
      </>}
      {((isVerb && hasNonPart) || isPronoun) && (
        <FilterChipGroup compact={compact} label={groupLabel('person', t, 'Person')} options={PERSONS} selected={filter.persons ?? PERSONS} onChange={v => patch({ persons: v })} />
      )}
      <FilterChipGroup compact={compact} label={groupLabel('number', t, 'Number')} options={NUMBERS} selected={filter.numbers ?? NUMBERS} onChange={v => patch({ numbers: v })} />
      {showCaseGender && (
        <>
          <FilterChipGroup compact={compact} label={`${cgPrefix}${groupLabel('case', t, 'Case')}`}     options={NOUN_CASES} selected={filter.cases   ?? NOUN_CASES} onChange={v => patch({ cases: v })}   />
          <FilterChipGroup compact={compact} label={`${cgPrefix}${groupLabel('gender', t, 'Gender')}`} options={GENDERS}    selected={filter.genders ?? GENDERS}    onChange={v => patch({ genders: v })} />
        </>
      )}
      {isPronoun && (
        <FilterChipGroup compact={compact} label={groupLabel('pronounType', t, 'Pronoun type')} options={PRONOUN_TYPES} selected={filter.pronounTypes ?? PRONOUN_TYPES} onChange={v => patch({ pronounTypes: v })} />
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
  const t = useT()
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {t('inst.b.vocabLimit')}
      </label>
      <div className="flex items-center gap-3">
        <select
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="input w-64"
        >
          <option value="">{t('inst.b.vocabNoLimit')}</option>
          {VOCAB_LESSONS.map(l => (
            <option key={l.lesson} value={l.lesson}>
              {t('inst.b.vocabThrough', {
                n: l.lesson, section: l.section, occ: minOccurrencesThrough(l.lesson) ?? l.occMin,
              })}
            </option>
          ))}
        </select>
      </div>
      {value && (
        <p className="text-xs text-amber-700 mt-1">{t('inst.b.vocabLimitNote', { n: value })}</p>
      )}
    </div>
  )
}

// ── Morph Series Builder ──────────────────────────────────────────────────────

function MorphSeriesBuilder({
  series,
  onChange,
  availableDates,
  level,
}: {
  series: MorphTestConfig[]
  onChange: (s: MorphTestConfig[]) => void
  availableDates: number
  /** The course's level — decides whether the tests offer Greek or Hebrew parse fields. */
  level: string
}) {
  const t = useT()
  const hebrew = isHebrewLevel(level)
  const subtypes = morphSubtypesFor(level) as MorphologySubtype[]
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
        <label className="text-sm font-medium text-gray-700">{t('inst.b.m.testsInSeries')}</label>
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
          {t('inst.b.m.tooFewDates', { count: availableDates, n: series.length, dates: availableDates })}
        </p>
      )}

      <div className="space-y-2">
        {series.map((test, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                {t('inst.b.s.testN', { n: i + 1 })}
              </span>
              {series.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTest(i)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  {t('inst.b.m.remove')}
                </button>
              )}
            </div>

            {/* Subtype selector */}
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {subtypes.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateTest(i, {
                    subtype: opt,
                    fields: morphFieldOptionsFor(level, opt).map(f => f.key),
                    parseFilter: PARSE_FILTER_SUBTYPES.includes(opt) ? { ...DEFAULT_PARSE_FILTER } : undefined,
                  })}
                  className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                    test.subtype === opt
                      ? 'bg-brand-50 border-brand-400 text-brand-800 font-medium'
                      : 'bg-surface border-gray-200 text-gray-700 hover:border-brand-300'
                  }`}
                >
                  {t(`morph.subtype.${opt}`)}
                </button>
              ))}
            </div>

            {/* Field checkboxes — shown when the subtype has configurable fields */}
            {morphFieldOptionsFor(level, test.subtype).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">{t('inst.b.fieldsToIdentify')}</p>
                <div className="flex flex-wrap gap-2">
                  {morphFieldOptionsFor(level, test.subtype).map(opt => {
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
                        {featureLabel(opt.label, t)}
                      </label>
                    )
                  })}
                </div>
                {test.fields.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">{t('inst.b.selectOneField')}</p>
                )}
              </div>
            )}

            {/* Topic — names the quiz: "Week N — <series> (<topic>)" */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 shrink-0">{t('inst.b.m.topic')}</label>
              <input
                type="text"
                value={test.topic ?? ''}
                onChange={e => updateTest(i, { topic: e.target.value })}
                placeholder={t(`morph.subtype.${test.subtype}`)}
                className="input text-sm flex-1"
              />
            </div>

            {/* Noun quizzes: restrict by declension (classified by lemma ending + gender,
                so "Nouns I: 1st & 2nd Declension" / "Nouns II: 3rd" can be built here). */}
            {test.subtype === 'NOUN_PARSING' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">{t('inst.b.m.declensions')}</span>
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
                      {t(`inst.b.m.decl${d}`)}
                    </button>
                  )
                })}
                <span className="text-xs text-gray-400">{t('inst.b.m.declNone')}</span>
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
                  <span>{t('inst.b.restrictForms')}</span>
                  <span>{filterOpen[i] ? '▲' : '▼'}</span>
                </button>
                {filterOpen[i] && (
                  <div className="p-3 bg-surface space-y-2">
                    {hebrew ? (
                      <HebrewParseFilterPicker
                        compact
                        subtype={test.subtype}
                        filter={(test.parseFilter ?? HEBREW_DEFAULT_PARSE_FILTER) as HebrewMorphParseFilter}
                        onChange={f => updateTest(i, { parseFilter: f as MorphParseFilter })}
                      />
                    ) : (
                      <ParseFilterPicker
                        compact
                        subtype={test.subtype}
                        filter={test.parseFilter ?? DEFAULT_PARSE_FILTER}
                        onChange={f => updateTest(i, { parseFilter: f })}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Questions + vocab row */}
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('inst.b.m.questions')}</label>
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
                  {t('inst.b.m.vocabFilter')}
                </label>
                <select
                  value={test.vocabAuto ? 'AUTO' : test.vocabThruLesson ?? ''}
                  onChange={e => updateTest(i, e.target.value === 'AUTO'
                    ? { vocabAuto: true, vocabThruLesson: null }
                    : { vocabAuto: false, vocabThruLesson: e.target.value === '' ? null : Number(e.target.value) })}
                  className="input text-sm w-full"
                >
                  <option value="">{t('inst.b.m.vocabAll')}</option>
                  {/* Ties each week's morphology quiz to the vocabulary taught by that week. */}
                  <option value="AUTO">{t('inst.b.m.vocabAuto')}</option>
                  {VOCAB_LESSONS.map(l => (
                    <option key={l.lesson} value={l.lesson}>
                      {t('inst.b.m.vocabThrough', { n: l.lesson, section: l.section })}
                    </option>
                  ))}
                </select>
                {test.vocabAuto && (
                  <p className="text-xs text-gray-500 mt-1">{t('inst.b.m.vocabAutoHelp')}</p>
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
        {t('inst.b.m.addTest')}
      </button>
    </div>
  )
}

// ── Morphology Answer Display ─────────────────────────────────────────────────

function MorphAnswerDisplay({ raw }: { raw: string }) {
  const t = useT()
  let parsed: Record<string, string | null> = {}
  try { parsed = JSON.parse(raw) } catch { return <p className="text-xs text-green-700 mt-1">{raw}</p> }
  const fields = Object.entries(parsed).filter(([, v]) => v != null && v !== '')
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {fields.map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1 text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 rounded-full">
          <span className="text-green-500 font-medium capitalize">{groupLabel(k === 'casus' ? 'case' : k, t, k)}:</span>
          {featureLabel(String(v), t)}
        </span>
      ))}
    </div>
  )
}

// ── Sample Quiz Modal ─────────────────────────────────────────────────────────

/**
 * A question prompt in the preview. Script and direction are read from the text itself,
 * by the same rule the student's quiz runner applies — so a Hebrew course previews in
 * Hebrew, and a mixed Hebrew-plus-gloss parsing prompt stays left-to-right.
 */
function Prompt({ text, size }: { text: string; size: string }) {
  const { className, dir } = scriptProps(text)
  return <span className={`${className} ${size} text-ink-900`} dir={dir}>{text}</span>
}

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
  const t = useT()
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  function toggleReveal(pos: number) {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(pos) ? next.delete(pos) : next.add(pos)
      return next
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={t('inst.b.sample.title')} size="xl">
      {loading && (
        <p className="text-sm text-gray-500 py-6 text-center">{t('inst.b.sample.generating')}</p>
      )}

      {!loading && data && (
        <div className="space-y-4">
          {data.lesson && (
            <div className="text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
              {t('inst.b.sample.week1', { section: data.lesson.section, pages: data.lesson.pages })}
            </div>
          )}

          {data.questions.length === 0 && (
            <p className="text-sm text-gray-400 italic py-4 text-center">
              {t('inst.b.sample.none')}
            </p>
          )}

          <ol className="space-y-4">
            {data.questions.map(q => (
              <li key={q.position} className="border border-gray-100 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  <span className="text-gray-400 mr-2">{q.position}.</span>
                  {quizType === 'MORPHOLOGY_QUIZ' && q.type === 'MORPHOLOGY_IDENTIFY' ? (
                    <Prompt text={q.prompt} size="text-xl" />
                  ) : quizType === 'MORPHOLOGY_QUIZ' ? (
                    <span className="whitespace-pre-line text-gray-900">{q.prompt}</span>
                  ) : quizType === 'VOCABULARY_QUIZ' ? (
                    <Prompt text={q.prompt} size="text-lg" />
                  ) : (
                    <Prompt text={q.prompt} size="" />
                  )}
                </p>

                {quizType === 'MORPHOLOGY_QUIZ' && q.type === 'MORPHOLOGY_IDENTIFY' ? (
                  <div className="mt-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 italic">
                    {t('inst.b.sample.selectsParse')}
                  </div>
                ) : quizType === 'VOCABULARY_QUIZ' && provideDefinition ? (
                  <div className="mt-2">
                    <div className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 italic">
                      {t('inst.b.sample.typesAnswer')}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{t('inst.b.sample.fuzzy')}</p>
                  </div>
                ) : q.options.length > 0 && (
                  <ul className="grid grid-cols-2 gap-1.5 mt-2">
                    {q.options.map((opt, i) => (
                      <li
                        key={i}
                        dir={scriptProps(opt).dir}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${scriptProps(opt).className} ${
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
                  {revealed.has(q.position) ? t('inst.b.sample.hideAnswer') : t('inst.b.sample.showAnswer')}
                </button>

                {revealed.has(q.position) && (
                  quizType === 'MORPHOLOGY_QUIZ' && q.type === 'MORPHOLOGY_IDENTIFY' ? (
                    <MorphAnswerDisplay raw={q.correctAnswer} />
                  ) : (
                    <p className="text-xs text-green-700 mt-1">
                      {t('inst.b.sample.answer')}{' '}
                      <span className={`font-medium ${scriptProps(q.correctAnswer).className}`}
                            dir={scriptProps(q.correctAnswer).dir}>{q.correctAnswer}</span>
                    </p>
                  )
                )}
              </li>
            ))}
          </ol>

          <p className="text-xs text-gray-400 text-center pt-2">
            {t('inst.b.sample.random')}
          </p>
        </div>
      )}
    </Modal>
  )
}

// ── Semester Schedule Form ────────────────────────────────────────────────────

function SemesterForm({ courses, defaultCourseId }: { courses: Course[]; defaultCourseId?: string }) {
  const t = useT()
  const locale = useLocale()
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
    const name = window.prompt(t('inst.b.s.templatePrompt'),
      current.seriesName || t(current.quizType === 'MORPHOLOGY_QUIZ'
        ? 'inst.b.s.templateDefaultMorph' : 'inst.b.s.templateDefaultVocab'))
    if (!name?.trim()) return
    const { courseId: _c, startDate: _d, ...config } = current
    const res = await fetch('/api/series-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), quizType: current.quizType, config }),
    })
    if (res.ok) {
      const d = await res.json()
      setTemplateMsg(t(d.updated ? 'inst.b.s.templateUpdated' : 'inst.b.s.templateSaved', { name: name.trim() }))
      const list = await fetch('/api/series-templates').then(r => r.json()).catch(() => null)
      if (list) setTemplates(list.templates ?? [])
    } else {
      setTemplateMsg(t('inst.b.s.templateFailed'))
    }
  }

  function loadTemplate(id: string) {
    const tpl = templates.find(x => x.id === id)
    if (!tpl) return
    // Course and start date stay: the template is the series recipe, not the term.
    setForm(prev => ({ ...prev, ...tpl.config, courseId: prev.courseId, startDate: prev.startDate }))
    setTemplateMsg(t('inst.b.s.templateLoaded', { name: tpl.name }))
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
  // DERIVED, never stored: form.level was seeded from courses[0] while courseId honoured
  // defaultCourseId, so arriving from a course page (…/assignments/new?courseId=…) built the
  // series at the FIRST course's level. On a Hebrew course that meant a Greek quiz. The
  // course is the single source of truth for the language; form.level is only a fallback
  // for the (impossible) case of no course selected.
  const courseLevel = selectedCourse?.level ?? form.level
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
      const previewFields = form.quizType === 'MORPHOLOGY_QUIZ' ? (firstTest?.fields ?? []) : []
      const params = new URLSearchParams({
        quizType: form.quizType,
        level:    courseLevel,
        count:    '5',
        week:     '1',
        ...(form.quizType === 'VOCABULARY_QUIZ'
          ? { prevPct: String(form.prevSectionsPct),
              // Preview the sections actually ticked, not the default lesson map.
              ...(form.vocabSubsections.length > 0
                ? { subsections: form.vocabSubsections.join(',') } : {}) }
          : {}),
        ...(form.quizType === 'MORPHOLOGY_QUIZ'
          ? { morphologySubtype: previewSubtype,
              ...(previewFields.length > 0 ? { fields: previewFields.join(',') } : {}) }
          : {}),
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
  }, [form.quizType, courseLevel, form.morphologySubtype, form.morphologySeries,
      form.vocabSubsections, form.prevSectionsPct])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (schedule.length === 0) { setError(t('inst.b.err.noDates')); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/assignments/semester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // ...form carries the seeded level, which may not be the selected course's.
          level: courseLevel,
          lateDaysLimit: form.allowLate ? form.lateDaysLimit : null,
          provideDefinition: form.quizType === 'VOCABULARY_QUIZ' ? form.quizStylePct >= 50 : false,
          isPublished: publishRef.current,
          schedule: schedule.map(s => ({ week: s.week, dueDate: toEndOfDayLocalISO(format(s.date, 'yyyy-MM-dd')) })),
          ...(form.quizType === 'MORPHOLOGY_QUIZ' ? { morphologySeries: form.morphologySeries } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('inst.b.err.createSchedule'))
      setSuccess(data.count)
      setTimeout(() => { router.push(`/instructor/courses/${form.courseId}`); router.refresh() }, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('inst.b.err.creatingSchedule'))
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.s.savedSeries')}</label>
              <select
                className="input w-full text-sm"
                defaultValue=""
                onChange={e => { if (e.target.value) loadTemplate(e.target.value) }}
              >
                <option value="">{t('inst.b.s.chooseTemplate')}</option>
                {templates.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    {t('inst.b.s.templateOption', {
                      name: tpl.name,
                      kind: t(tpl.quizType === 'MORPHOLOGY_QUIZ' ? 'inst.b.s.kindMorphology' : 'inst.b.s.kindVocabulary'),
                    })}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={() => void saveTemplate(form)}>
            {t('inst.b.s.saveTemplate')}
          </Button>
          {templateMsg && <p className="basis-full text-xs text-emerald-700">{templateMsg}</p>}
        </div>

        {(courses.length > 1 || !defaultCourseId) && (
          <Select
            label={t('inst.b.course')}
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
          <legend className="text-sm font-semibold text-gray-700 px-1">{t('inst.b.s.timingLegend')}</legend>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('inst.b.s.startOfSemester')}
              type="date"
              required
              value={form.startDate}
              onChange={e => setF('startDate', e.target.value)}
            />
            <Input
              label={t('inst.b.s.lengthWeeks')}
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
            <p className="text-sm font-medium text-gray-700 mb-2">{t('inst.b.s.quizDays')}</p>
            <div className="flex gap-2 flex-wrap">
              {DAYS_OF_WEEK.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.days.includes(d)
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-surface border-gray-300 text-gray-600 hover:border-brand-400'
                  }`}
                >
                  {t(`day.short.${d}`)}
                </button>
              ))}
            </div>
            {form.days.length === 0 && (
              <p className="text-xs text-red-500 mt-1">{t('inst.b.s.selectOneDay')}</p>
            )}
          </div>
        </fieldset>

        {/* Quiz settings */}
        <fieldset className="border border-gray-200 rounded-xl p-5 space-y-4">
          <legend className="text-sm font-semibold text-gray-700 px-1">{t('inst.b.s.quizLegend')}</legend>

          <Select
            label={t('inst.b.s.quizType')}
            value={form.quizType}
            onChange={e => setF('quizType', e.target.value as AssignmentType)}
            options={SERIES_ASSIGNMENT_TYPES.map(v => ({ value: v, label: t(`assign.type.${v}`) }))}
          />

          {/* Names the whole run: quizzes become "Week N — <name> (<topic|section>)" and the
              course page groups them under this name in the series editor. */}
          <Input
            label={t('inst.b.s.seriesName')}
            type="text"
            value={form.seriesName}
            onChange={e => setF('seriesName', e.target.value)}
            placeholder={t(form.quizType === 'MORPHOLOGY_QUIZ'
              ? 'inst.b.s.seriesNameMorphExample' : 'inst.b.s.seriesNameVocabExample')}
          />

          {form.quizType === 'MORPHOLOGY_QUIZ' && (
            <MorphSeriesBuilder
              series={form.morphologySeries}
              onChange={s => setF('morphologySeries', s)}
              availableDates={schedule.length}
              level={courseLevel}
            />
          )}

          {form.quizType === 'VOCABULARY_QUIZ' && (
            <>
              <FrequencySectionPicker
                lang={isHebrewLevel(courseLevel) ? 'hebrew' : 'greek'}
                selectedSubsections={form.vocabSubsections}
                onChange={keys => setF('vocabSubsections', keys)}
              />
              {form.vocabSubsections.length === 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inst.b.reviewEarlierLessons')} —{' '}
                    <span className="text-brand-700 font-semibold">
                      {form.prevSectionsPct === 0
                        ? t('inst.b.reviewThisWeekOnly')
                        : t('inst.b.reviewMixWeek', { earlier: form.prevSectionsPct, rest: 100 - form.prevSectionsPct })}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={0} max={100} step={5}
                    value={form.prevSectionsPct}
                    onChange={e => setF('prevSectionsPct', Number(e.target.value))}
                    className="w-full h-2 cursor-pointer rounded-lg accent-brand-600 [appearance:auto]"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('inst.b.reviewHelpSeries')}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('inst.b.quizStyle')} —{' '}
                  <span className="text-brand-700 font-semibold">
                    {form.quizStylePct === 0 ? t('inst.b.styleAllMc')
                      : form.quizStylePct === 100 ? t('inst.b.styleAllOpen')
                      : t('inst.b.styleMix', { mc: 100 - form.quizStylePct, open: form.quizStylePct })}
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
                  <span>{t('inst.b.chooseDefinition')}</span>
                  <span>{t('inst.b.provideDefinition')}</span>
                </div>
              </div>
            </>
          )}

          {form.quizType !== 'MORPHOLOGY_QUIZ' && (
            <Input
              label={t('inst.b.s.questionsPerQuiz')}
              type="number"
              min={1}
              max={50}
              value={form.numQuestions}
              onChange={e => setF('numQuestions', Number(e.target.value))}
            />
          )}

          <Input
            label={t('inst.b.timePerQuestion')}
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
            {t('inst.b.s.viewSample')}
          </button>
        </fieldset>

        <Select
          label={t('inst.b.retakes')}
          value={form.maxRetakes === null ? '' : String(form.maxRetakes)}
          onChange={e => setF('maxRetakes', e.target.value === '' ? null : Number(e.target.value))}
          options={retakeOptions(t)}
          placeholder={t('inst.b.retakesUnlimited')}
        />

        {form.quizType === 'VOCABULARY_QUIZ' && (
          <div>
            <Select
              label={t('inst.b.appeals')}
              value={String(form.maxAppeals)}
              onChange={e => setF('maxAppeals', Number(e.target.value))}
              options={appealOptions(t)}
            />
            <p className="mt-1 text-xs text-gray-500">{t('inst.b.appealsHelpSeries')}</p>
          </div>
        )}

        <LatePolicyFields
          allowLate={form.allowLate}
          lateDaysLimit={form.lateDaysLimit}
          onAllowLateChange={v => setF('allowLate', v)}
          onLateDaysLimitChange={v => setF('lateDaysLimit', v)}
        />

        {/* Word-list download. Greek gets the published textbook; Hebrew gets the list
            generated from our own deck by scripts/build-hebrew-vocab-pdf.ts. */}
        {form.quizType === 'VOCABULARY_QUIZ' && (
          <a
            href={isHebrewLevel(courseLevel)
              ? '/downloads/hebrew-vocabulary-list.pdf'
              : '/downloads/BGVB-2024.pdf'}
            download
            className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 hover:underline transition-colors"
          >
            <Download size={14} />
            {isHebrewLevel(courseLevel) ? t('inst.b.downloadHebrewList') : t('inst.b.downloadBgvb')}
          </a>
        )}

        {/* Runs past the end of term — the quizzes would be created but never sat. */}
        {overrun && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">
              {t('inst.b.s.overrunTitle', {
                count: overrun.count, n: overrun.count, date: formatDate(overrun.courseEnd, locale),
              })}
            </p>
            <p className="mt-1 text-amber-800">
              {t('inst.b.s.overrunBody', {
                count: overrun.weeksThatFit,
                n: overrun.weeksThatFit,
                // The vocabulary clause is a fragment of the same sentence, so it is a variable
                // rather than a second paragraph — a translator needs to place it, and Spanish
                // does not put it where English does.
                vocab: form.quizType === 'VOCABULARY_QUIZ' ? t('inst.b.s.overrunVocab') : '',
              })}
            </p>
            <button
              type="button"
              onClick={() => setF('weeks', overrun.weeksThatFit)}
              className="mt-2 text-sm font-medium text-amber-900 underline hover:no-underline"
            >
              {t('inst.b.s.overrunSet', { count: overrun.weeksThatFit, n: overrun.weeksThatFit })}
            </button>
          </div>
        )}

        {/* Schedule preview */}
        {schedule.length > 0 && (
          <div ref={previewRef} className={`border rounded-xl overflow-hidden transition-colors duration-300 ${previewFlash ? 'border-brand-400 ring-2 ring-brand-300' : 'border-brand-100'}`}>
            <div className="bg-brand-50 px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-800">
                {form.quizType === 'MORPHOLOGY_QUIZ'
                  ? t('inst.b.s.previewTests', { count: form.morphologySeries.length, n: form.morphologySeries.length })
                  : t('inst.b.s.previewQuizzes', { count: schedule.length, n: schedule.length })}
              </span>
              <span className="text-xs text-brand-600">
                {t('inst.b.s.previewWeeks', { count: form.weeks, n: form.weeks })}
                {' · '}
                {t('inst.b.s.previewDays', { count: form.days.length, n: form.days.length })}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {(form.quizType === 'MORPHOLOGY_QUIZ' ? schedule.slice(0, form.morphologySeries.length) : schedule).map((s, i) => {
                const lesson = form.quizType === 'VOCABULARY_QUIZ' ? getLessonForWeek(s.week) : null
                const sectionLabel = lesson ? lesson.section.replace('-', ':') : null
                const morphTest = form.quizType === 'MORPHOLOGY_QUIZ' ? form.morphologySeries[i] : null
                const morphLabel = morphTest ? t(`morph.subtypeShort.${morphTest.subtype}`) : null
                const vocabLabel = morphTest?.vocabThruLesson
                  ? t('inst.b.s.vocabThru', { n: morphTest.vocabThruLesson })
                  : null
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="text-gray-400 w-16 shrink-0 text-xs">{t('inst.b.s.wk', { n: s.week })}</span>
                    {morphTest && (
                      <span className="shrink-0 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                        {t('inst.b.s.testN', { n: i + 1 })}
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
                    <span className="text-gray-700 truncate">{formatDateLong(s.date, locale)}</span>
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
            {t('inst.b.s.created', { n: success })}
          </div>
        )}

        {(() => {
          const effectiveCount = form.quizType === 'MORPHOLOGY_QUIZ'
            ? Math.min(form.morphologySeries.length, schedule.length)
            : schedule.length
          // Both buttons are disabled until the series has dates. Say WHY: a dead Save
          // button with no message reads as "the app is broken", which is how this was
          // reported. Each reason names the field to go and fix.
          const blockers: string[] = []
          if (!form.startDate)               blockers.push(t('inst.b.s.blk.startDate'))
          if (form.days.length === 0)        blockers.push(t('inst.b.s.blk.days'))
          if (form.weeks < 1)                blockers.push(t('inst.b.s.blk.weeks'))
          if (form.quizType === 'MORPHOLOGY_QUIZ' && form.morphologySeries.length === 0)
                                             blockers.push(t('inst.b.s.blk.tests'))
          const disabled = schedule.length === 0 || form.days.length === 0 ||
            (form.quizType === 'MORPHOLOGY_QUIZ' && form.morphologySeries.length === 0)
          return (
            <div className="flex flex-col items-end gap-2">
            {disabled && blockers.length > 0 && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {t('inst.b.s.blk.intro')} {blockers.join(' · ')}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="ghost" onClick={() => router.back()}>{t('inst.b.cancel')}</Button>
              <Button
                type="button"
                variant="secondary"
                disabled={disabled}
                onClick={handleUpdate}
              >
                {t('inst.b.s.updatePreview')}{effectiveCount > 0 ? ` (${effectiveCount})` : ''}
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={disabled}
                onClick={() => { publishRef.current = true }}
              >
                {t('inst.b.savePost')}{effectiveCount > 0 ? ` (${effectiveCount})` : ''}
              </Button>
            </div>
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
  const t = useT()
  const [mode, setMode] = useState<Mode>('single')

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        {([
          { value: 'single'   as Mode, label: t('inst.b.modeSingle'),   Icon: FileText },
          { value: 'semester' as Mode, label: t('inst.b.modeSemester'), Icon: CalendarDays },
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
