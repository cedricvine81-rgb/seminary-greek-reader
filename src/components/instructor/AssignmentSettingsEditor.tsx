'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toEndOfDayLocalISO, toDueISO, fromDueISO } from '@/lib/due-date'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardTitle } from '@/components/ui/Card'
import { FrequencySectionPicker } from '@/components/vocab/FrequencySectionPicker'
import { isHebrewLevel } from '@/lib/constants'
import { MIN_LOCKDOWN_AUTOSUBMIT } from '@/lib/constants'
import { ConstructSearchFields } from '@/components/instructor/ConstructSearchFields'
import { normalizeConstructConfig, parseConstructLink } from '@/lib/construct-assignment'
import { useT } from '@/lib/i18n/LocaleProvider'
import { retakeOptions, appealOptions, glossaryOptions } from '@/lib/assignment-display'

interface Props {
  assignmentId: string
  assignmentType: string
  isVocabQuiz: boolean
  initial: {
    title: string
    weekNumber: number
    dueDate: string         // ISO string
    instructions: string | null
    reference: string | null           // translation exercises only
    quizStylePct: number               // vocab quizzes: current % open-ended, from saved questions
    vocabSelection: { subsections: string[]; pos: string[] } | null  // vocab quizzes: chosen words
    timePerQuestion: number | null
    reviewTimeSeconds: number | null
    provideDefinition: boolean
    maxRetakes: number | null
    maxAppeals: number | null          // vocab quizzes: appeals per attempt (null/0 = disabled)
    allowLate: boolean
    lateDaysLimit: number | null
    opensAt: string | null             // ISO string, translation exams only
    submissionDeadline: string | null  // ISO string, translation exercises only
    round1Deadline: string | null      // ISO string, translation exercises only
    round2Deadline: string | null      // ISO string, translation exercises only
    allowReaderInRound2: boolean       // translation exercises only
    glossFrequency: number | null      // translation exercises only
    gradeWeights: { parsing: number; syntax: number; translation: number } | null  // translation exams only
    lockdown: boolean                  // translation exams only
    lockdownMaxViolations: number | null  // translation exams only
    constructConfig: unknown           // construct searches only; reference holds the search link
  }
  /** The assignment's course level — decides which vocabulary deck the section picker shows. */
  level?: string
}

// Convert an ISO string to the value a datetime-local input expects (local time, to the minute)
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export function AssignmentSettingsEditor({ assignmentId, assignmentType, isVocabQuiz, level, initial }: Props) {
  const t = useT()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const isTranslation = assignmentType === 'TRANSLATION_EXERCISE'
  const isExam = assignmentType === 'TRANSLATION_EXAM'
  // Course Notes and Group Presentations aren't quizzes — no questions, timer, or retakes.
  // Hide that quiz chrome below.
  const isNotes = assignmentType === 'COURSE_NOTES'
  const isGroup = assignmentType === 'GROUP_PRESENTATION'
  // Construct searches have no questions either — their "settings" are the search link
  // and the shape of the find-list.
  const isConstruct = assignmentType === 'CONSTRUCT_SEARCH'
  const construct = normalizeConstructConfig(initial.constructConfig)

  const [title, setTitle] = useState(initial.title)
  const [weekNumber, setWeekNumber] = useState(initial.weekNumber)
  // Date and time of day are held separately: a blank time means end of that day, which is
  // what every assignment set before timed deadlines existed will show.
  const [dueDate, setDueDate] = useState(fromDueISO(initial.dueDate).date)
  const [dueTime, setDueTime] = useState(fromDueISO(initial.dueDate).time)
  const [instructions, setInstructions] = useState(initial.instructions ?? '')
  const [reference, setReference] = useState(initial.reference ?? '')
  // For translation: timePerQuestion stores stage-1 seconds; display as minutes
  const [timePerQuestion, setTimePerQuestion] = useState(
    isTranslation
      ? Math.round((initial.timePerQuestion ?? 0) / 60)   // display minutes
      : (initial.timePerQuestion ?? 0)                      // display seconds
  )
  const [reviewTimeSeconds, setReviewTimeSeconds] = useState(
    Math.round((initial.reviewTimeSeconds ?? 0) / 60)      // display minutes
  )
  const [provideDefinition, setProvideDefinition] = useState(initial.provideDefinition)
  // Slider value 0–100 = % open-ended ("provide definition"). Initialised from the
  // actual saved mix so the control reflects the real quiz, not just a binary flag.
  const [quizStylePct, setQuizStylePct] = useState(initial.quizStylePct)

  // Vocab-quiz auto-generation: count + Generate Questions, moved here from the
  // QuizBuilder panel so the workflow is "configure → generate" in one card.
  const [numQuestions, setNumQuestions] = useState(20)
  // Vocab word selection (BGVB frequency sections), pre-filled from the saved quiz.
  const [vocabSubsections, setVocabSubsections] = useState<string[]>(initial.vocabSelection?.subsections ?? [])
  const [generating, setGenerating] = useState(false)
  const [generatedCount, setGeneratedCount] = useState<number | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [maxRetakes, setMaxRetakes] = useState<number | null>(initial.maxRetakes)
  const [maxAppeals, setMaxAppeals] = useState<number>(initial.maxAppeals ?? 0)
  const [allowLate, setAllowLate] = useState(initial.allowLate)
  const [lateDaysLimit, setLateDaysLimit] = useState(initial.lateDaysLimit ?? 7)
  const [opensAt, setOpensAt] = useState(toLocalInput(initial.opensAt))
  // Preserved (existing exercises may have one) but no longer editable — Round 1 covers it.
  const [submissionDeadline] = useState(toLocalInput(initial.submissionDeadline))
  const [round1Deadline, setRound1Deadline] = useState(toLocalInput(initial.round1Deadline))
  const [round2Deadline, setRound2Deadline] = useState(toLocalInput(initial.round2Deadline))
  const [allowReaderInRound2, setAllowReaderInRound2] = useState(initial.allowReaderInRound2)
  const [glossFrequency, setGlossFrequency] = useState<number | null>(initial.glossFrequency)
  const [weights, setWeights] = useState(initial.gradeWeights ?? { parsing: 33, syntax: 33, translation: 34 })
  const weightSum = weights.parsing + weights.syntax + weights.translation
  const [lockdown, setLockdown] = useState(initial.lockdown)
  const [lockdownMaxViolations, setLockdownMaxViolations] = useState<number | null>(initial.lockdownMaxViolations)
  // Construct search: the link lives in `reference`, so it shares that state.
  const [constructCount, setConstructCount] = useState(construct.requiredCount)
  const [constructAskTranslation, setConstructAskTranslation] = useState(construct.askTranslation)
  const [constructAskComment, setConstructAskComment] = useState(construct.askComment)

  async function handleSave() {
    if ((isTranslation || isExam) && !reference.trim()) {
      setError(t('inst.b.err.passageRequired'))
      return
    }
    if (isConstruct && !parseConstructLink(reference)) {
      setError(t('as.constructLinkError'))
      return
    }
    if (isTranslation && round1Deadline && round2Deadline && new Date(round2Deadline) <= new Date(round1Deadline)) {
      setError(t('inst.b.err.roundOrder'))
      return
    }
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
          // Translation exercises derive their due date from the Round deadlines
          // (Round 1 → Round 2 → existing), since the Due date field is hidden for them.
          // Translation exercises take their close date from the Round deadlines and have
          // no time of their own; everything else honours the optional Due time.
          dueDate: isTranslation
            ? toEndOfDayLocalISO((round1Deadline || round2Deadline)?.slice(0, 10) || dueDate)
            : toDueISO(dueDate, dueTime),
          instructions,
          reference: (isTranslation || isExam) ? reference : undefined,
          // The construct link is validated and normalised server-side, then stored as the reference.
          constructUrl: isConstruct ? reference : undefined,
          constructCount: isConstruct ? constructCount : undefined,
          constructAskTranslation: isConstruct ? constructAskTranslation : undefined,
          constructAskComment: isConstruct ? constructAskComment : undefined,
          // Convert back to seconds for storage
          timePerQuestion: isTranslation ? timePerQuestion * 60 || 0 : timePerQuestion,
          reviewTimeSeconds: reviewTimeSeconds * 60 || 0,
          provideDefinition,
          maxRetakes,
          maxAppeals: isVocabQuiz ? (maxAppeals > 0 ? maxAppeals : 0) : undefined,
          allowLate,
          lateDaysLimit: allowLate ? lateDaysLimit : null,
          // Convert datetime-local (local wall time) to a true UTC instant so the server (UTC) stores the right moment.
          // Exams have a single cut-off stored in round1Deadline; no Round 2 / reader.
          opensAt: isExam ? (opensAt ? new Date(opensAt).toISOString() : null) : undefined,
          submissionDeadline: isTranslation ? (submissionDeadline ? new Date(submissionDeadline).toISOString() : null) : undefined,
          round1Deadline: (isTranslation || isExam) ? (round1Deadline ? new Date(round1Deadline).toISOString() : null) : undefined,
          round2Deadline: isTranslation ? (round2Deadline ? new Date(round2Deadline).toISOString() : null) : undefined,
          allowReaderInRound2: isTranslation ? allowReaderInRound2 : undefined,
          glossFrequency: (isTranslation || isExam) ? glossFrequency : undefined,
          gradeWeights: isExam ? weights : undefined,
          lockdown: isExam ? lockdown : undefined,
          lockdownMaxViolations: isExam ? lockdownMaxViolations : undefined,
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

  /** Regenerate the vocab quiz's questions using the current settings. */
  async function handleGenerate() {
    setGenerating(true)
    setGenerateError('')
    setGeneratedCount(null)
    try {
      // The server refuses with 409 when students have already answered, rather than
      // silently detaching their work; `force` is only sent once the instructor has been
      // shown the count and said yes.
      const send = (force?: boolean) => fetch(`/api/assignments/${assignmentId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Vocab quizzes always run Greek → English (the only sensible direction
          // in Provide Definition mode, which is also the most common in MC mode).
          type: 'GREEK_TO_ENGLISH',
          count: numQuestions,
          // Honour the live Type-of-Quiz slider so regeneration produces the chosen mix.
          quizStylePct,
          // Regenerate from the chosen frequency sections.
          vocabSubsections,
          ...(force ? { force: true } : {}),
        }),
      })
      let res = await send()
      let data = await res.json().catch(() => ({}))
      if (res.status === 409 && data.error === 'studentWorkExists') {
        const n = (data.responses ?? 0) + (data.attempts ?? 0)
        if (!confirm(t('as.regenWarn', { n }))) {
          setGenerateError(t('as.regenBlocked'))
          return
        }
        res = await send(true)
        data = await res.json().catch(() => ({}))
      }
      if (!res.ok) {
        setGenerateError(data.error ?? 'Could not generate questions.')
        return
      }
      setGeneratedCount(data.count ?? numQuestions)
      router.refresh()
    } catch {
      setGenerateError('Network error — please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <CardTitle>{isExam ? 'Exam Settings' : isTranslation ? 'Exercise Settings' : isNotes ? 'Notes Settings' : isGroup ? 'Presentation Settings' : isConstruct ? 'Search Settings' : 'Quiz Settings'}</CardTitle>
      <div className="mt-5 space-y-5">

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('inst.b.title')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="col-span-2"
          />
          <Input
            label={t('inst.b.weekNumber')}
            type="number"
            min={1}
            value={weekNumber}
            onChange={e => setWeekNumber(Number(e.target.value))}
          />
          {/* Translation exercises derive their close/due date from the Round deadlines. */}
          {!isTranslation && (
            <Input
              label={t('inst.b.dueDate')}
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          )}
          {/* Optional time of day. Left blank the assignment closes at the end of the due
              date, which is how every assignment behaved before this existed. */}
          {!isTranslation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.dueTime')}</label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                {dueTime ? t('inst.b.dueTimeSet', { time: dueTime }) : t('as.dueTimeBlank')}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.instructions')}</label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={3}
            className="input w-full"
            placeholder={t('inst.b.instructionsExample')}
          />
        </div>

        {(isTranslation || isExam) ? (
          /* Translation Exercise / Exam: passage reference(s) + deadline(s) */
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-4">
            {isExam ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.exam.passages')}</label>
                <textarea
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  rows={4}
                  className="input"
                  placeholder={'John 15:1-4\nRomans 8:1-4\nMark 1:9-13'}
                />
                <p className="text-xs text-brand-600 mt-1">{t('as.passagesHelp')}</p>
              </div>
            ) : (
              <div>
                <Input
                  label={t('inst.b.ex.passage')}
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder={t('inst.b.ex.passageExample')}
                />
                <p className="text-xs text-brand-600 mt-1">
                  {t('as.passageHelp')}
                </p>
              </div>
            )}
            {isExam && (
              <>
                <hr className="border-brand-200" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.exam.opens')}</label>
                  <input
                    type="datetime-local"
                    value={opensAt}
                    onChange={e => setOpensAt(e.target.value)}
                    className="input"
                  />
                  <p className="text-xs text-brand-600 mt-1">{t('as.opensHelp')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.exam.closes')}</label>
                  <input
                    type="datetime-local"
                    value={round1Deadline}
                    onChange={e => setRound1Deadline(e.target.value)}
                    className="input"
                  />
                  <p className="text-xs text-brand-600 mt-1">{t('as.closesHelp')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('inst.b.glossary')}</label>
                  <select
                    value={glossFrequency ?? ''}
                    onChange={e => setGlossFrequency(e.target.value ? Number(e.target.value) : null)}
                    className="input"
                  >
                    {glossaryOptions(t, isHebrewLevel(level ?? '')).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <p className="text-xs text-brand-600 mt-1">{t('as.glossaryHelp')}</p>
                </div>
                <hr className="border-brand-200" />
                <div>
                  <label className="block text-sm font-medium text-brand-800 mb-1">{t('inst.b.exam.weights')}</label>
                  <div className="flex flex-wrap gap-3">
                    {(['parsing', 'syntax', 'translation'] as const).map(c => (
                      <div key={c} className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-600 capitalize w-20">{c === 'translation' ? 'Translation' : c}</span>
                        <input
                          type="number" min={0} max={100}
                          value={weights[c]}
                          onChange={e => setWeights(w => ({ ...w, [c]: Number(e.target.value) }))}
                          className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs mt-1 ${weightSum === 100 ? 'text-brand-600' : 'text-amber-600'}`}>
                    {weightSum === 100 ? t('as.weightsOk') : t('as.weightsOff', { n: weightSum })}
                  </p>
                </div>
                <hr className="border-brand-200" />
                <div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lockdown}
                      onChange={e => setLockdown(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-brand-800">{t('inst.b.lockdown')}</span>
                      <p className="text-xs text-brand-600 mt-0.5">
                        {t('as.lockdownHelp')}
                      </p>
                    </div>
                  </label>
                  {lockdown && (
                    <div className="mt-2 ml-6">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">{t('inst.b.autoSubmitAfter')}</label>
                        <input
                          type="number" min={MIN_LOCKDOWN_AUTOSUBMIT} max={50}
                          value={lockdownMaxViolations ?? ''}
                          onChange={e => {
                            const v = e.target.value ? Number(e.target.value) : null
                            // Blank = warn only. Any positive value is floored so a single
                            // stray violation can never end a student's exam.
                            setLockdownMaxViolations(v != null && v > 0 ? Math.max(v, MIN_LOCKDOWN_AUTOSUBMIT) : null)
                          }}
                          placeholder="—"
                          className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-xs text-gray-600">{t('as.violations')}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {t('as.autoSubmitHelp', { n: MIN_LOCKDOWN_AUTOSUBMIT })}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
            {!isExam && (
            <>
            <hr className="border-brand-200" />
            <p className="text-sm font-semibold text-brand-800">{t('as.roundDeadlines')}</p>
            <p className="text-xs text-brand-600 -mt-1">{t('as.deadlinesHelp')}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('as.round1Label')}
              </label>
              <input
                type="datetime-local"
                value={round1Deadline}
                onChange={e => setRound1Deadline(e.target.value)}
                className="input"
              />
              <p className="text-xs text-brand-600 mt-1">{t('as.round1Help')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('as.round2Label')}
              </label>
              <input
                type="datetime-local"
                value={round2Deadline}
                onChange={e => setRound2Deadline(e.target.value)}
                className="input"
              />
              <p className="text-xs text-brand-600 mt-1">{t('as.round2Help')}</p>
            </div>
            <hr className="border-brand-200" />
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowReaderInRound2}
                onChange={e => setAllowReaderInRound2(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="text-sm font-medium text-brand-800">{t('inst.b.ex.readerRound2')}</span>
                <p className="text-xs text-brand-600 mt-0.5">
                  {t('as.readerRound2Help')}
                </p>
              </div>
            </label>
            <hr className="border-brand-200" />
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1">{t('inst.b.glossary')}</label>
              <select
                value={glossFrequency ?? ''}
                onChange={e => setGlossFrequency(e.target.value ? Number(e.target.value) : null)}
                className="input"
              >
                {glossaryOptions(t, isHebrewLevel(level ?? '')).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p className="text-xs text-brand-600 mt-1">{t('as.verseGlossHelp')}</p>
            </div>
            <hr className="border-brand-200" />
            <p className="text-sm font-semibold text-brand-800">{t('as.timerSettings')}</p>
            <Input
              label={t('as.stage1')}
              type="number"
              min={0}
              max={180}
              value={timePerQuestion}
              onChange={e => setTimePerQuestion(Number(e.target.value))}
            />
            <p className="text-xs text-brand-600 -mt-2">
              {t('as.stage1Help')}
            </p>
            <Input
              label={t('as.stage2')}
              type="number"
              min={0}
              max={60}
              value={reviewTimeSeconds}
              onChange={e => setReviewTimeSeconds(Number(e.target.value))}
            />
            <p className="text-xs text-brand-600 -mt-2">
              {t('as.stage2Help')}
            </p>
            </>
            )}
          </div>
        ) : isConstruct ? (
          <ConstructSearchFields
            url={reference}
            onUrl={setReference}
            count={constructCount}
            onCount={setConstructCount}
            askTranslation={constructAskTranslation}
            onAskTranslation={setConstructAskTranslation}
            askComment={constructAskComment}
            onAskComment={setConstructAskComment}
          />
        ) : (isNotes || isGroup) ? null : (
          <Input
            label={t('inst.b.timePerQuestion')}
            type="number"
            min={0}
            max={300}
            value={timePerQuestion}
            onChange={e => setTimePerQuestion(Number(e.target.value))}
          />
        )}

        {isVocabQuiz && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-800">{t('as.chooseWords')}</p>
            <FrequencySectionPicker
              lang={isHebrewLevel(level ?? '') ? 'hebrew' : 'greek'}
              selectedSubsections={vocabSubsections}
              onChange={setVocabSubsections}
            />
            <p className="text-xs text-gray-500">
              {t('as.afterSelection')}
            </p>
          </div>
        )}

        {isVocabQuiz && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('as.quizTypeLabel')} —{' '}
              <span className="text-brand-700 font-semibold">
                {quizStylePct === 0
                  ? t('as.allMultipleChoice')
                  : quizStylePct === 100
                    ? t('as.allOpenEnded')
                    : t('as.mcOpenMix', { mc: 100 - quizStylePct, open: quizStylePct })}
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={quizStylePct}
              onChange={e => {
                const v = Number(e.target.value)
                setQuizStylePct(v)
                // Any open-ended portion → typed answers graded leniently (fuzzy).
                setProvideDefinition(v > 0)
              }}
              className="w-full h-2 cursor-pointer rounded-lg accent-brand-600 [appearance:auto]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>{t('inst.b.chooseDefinition')}</span>
              <span>{t('inst.b.provideDefinition')}</span>
            </div>
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {t('as.afterStyle')}
            </p>
          </div>
        )}

        {isVocabQuiz && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-800">{t('as.generateQuestions')}</p>
            <p className="text-xs text-gray-500">
              {t('as.regenerateHelp')}
            </p>
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"># of questions</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={numQuestions}
                  onChange={e => setNumQuestions(Number(e.target.value) || 0)}
                  className="input w-24"
                />
              </div>
              <Button onClick={handleGenerate} loading={generating} variant="secondary" size="sm">
                {t('qb.generate')}
              </Button>
              {generatedCount !== null && !generating && (
                <span className="flex items-center gap-1.5 text-sm text-green-700">
                  ✓ {generatedCount} question{generatedCount === 1 ? '' : 's'} generated
                </span>
              )}
            </div>
            {generateError && (
              <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{generateError}</p>
            )}
          </div>
        )}

        {!isTranslation && !isNotes && !isGroup && !isConstruct && (
          <Select
            label={t('inst.b.retakes')}
            value={maxRetakes === null ? '' : String(maxRetakes)}
            onChange={e => setMaxRetakes(e.target.value === '' ? null : Number(e.target.value))}
            options={retakeOptions(t)}
            placeholder={t('inst.b.retakesUnlimited')}
          />
        )}

        {isVocabQuiz && (
          <div>
            <Select
              label={t('inst.b.appeals')}
              value={String(maxAppeals)}
              onChange={e => setMaxAppeals(Number(e.target.value))}
              options={appealOptions(t)}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('as.appealsHelp')}{' '}
              {t('as.appealsReviewHelp')}
            </p>
          </div>
        )}

        {!isTranslation && (
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowLate}
                onChange={e => setAllowLate(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700">{t('inst.b.allowLate')}</span>
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
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center gap-3 justify-end">
          <Button onClick={handleSave} loading={saving}>{t('as.saveSettings')}</Button>
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
