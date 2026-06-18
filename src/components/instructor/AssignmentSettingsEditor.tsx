'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardTitle } from '@/components/ui/Card'
import { FrequencySectionPicker } from '@/components/vocab/FrequencySectionPicker'

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
    submissionDeadline: string | null  // ISO string, translation exercises only
    round1Deadline: string | null      // ISO string, translation exercises only
    round2Deadline: string | null      // ISO string, translation exercises only
    allowReaderInRound2: boolean       // translation exercises only
    glossFrequency: number | null      // translation exercises only
  }
}

// Convert an ISO string to the value a datetime-local input expects (local time, to the minute)
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export function AssignmentSettingsEditor({ assignmentId, assignmentType, isVocabQuiz, initial }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const isTranslation = assignmentType === 'TRANSLATION_EXERCISE'
  const isExam = assignmentType === 'TRANSLATION_EXAM'

  const [title, setTitle] = useState(initial.title)
  const [weekNumber, setWeekNumber] = useState(initial.weekNumber)
  const [dueDate, setDueDate] = useState(initial.dueDate.slice(0, 10))
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
  // submissionDeadline stored as datetime-local string (e.g. "2026-06-15T23:59")
  const [submissionDeadline, setSubmissionDeadline] = useState(toLocalInput(initial.submissionDeadline))
  const [round1Deadline, setRound1Deadline] = useState(toLocalInput(initial.round1Deadline))
  const [round2Deadline, setRound2Deadline] = useState(toLocalInput(initial.round2Deadline))
  const [allowReaderInRound2, setAllowReaderInRound2] = useState(initial.allowReaderInRound2)
  const [glossFrequency, setGlossFrequency] = useState<number | null>(initial.glossFrequency)

  async function handleSave() {
    if ((isTranslation || isExam) && !reference.trim()) {
      setError('At least one passage reference is required (e.g. "John 1:1–18").')
      return
    }
    if (isTranslation && round1Deadline && round2Deadline && new Date(round2Deadline) <= new Date(round1Deadline)) {
      setError('The Round 2 deadline must be after the Round 1 deadline.')
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
          dueDate,
          instructions,
          reference: (isTranslation || isExam) ? reference : undefined,
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
          submissionDeadline: isTranslation ? (submissionDeadline ? new Date(submissionDeadline).toISOString() : null) : undefined,
          round1Deadline: (isTranslation || isExam) ? (round1Deadline ? new Date(round1Deadline).toISOString() : null) : undefined,
          round2Deadline: isTranslation ? (round2Deadline ? new Date(round2Deadline).toISOString() : null) : undefined,
          allowReaderInRound2: isTranslation ? allowReaderInRound2 : undefined,
          glossFrequency: isTranslation ? glossFrequency : undefined,
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
      const res = await fetch(`/api/assignments/${assignmentId}/generate`, {
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
        }),
      })
      const data = await res.json().catch(() => ({}))
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
      <CardTitle>{isExam ? 'Exam Settings' : isTranslation ? 'Exercise Settings' : 'Quiz Settings'}</CardTitle>
      <div className="mt-5 space-y-5">

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="col-span-2"
          />
          <Input
            label="Week number"
            type="number"
            min={1}
            value={weekNumber}
            onChange={e => setWeekNumber(Number(e.target.value))}
          />
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optional)</label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={3}
            className="input w-full"
            placeholder="Additional instructions for students…"
          />
        </div>

        {(isTranslation || isExam) ? (
          /* Translation Exercise / Exam: passage reference(s) + deadline(s) */
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-4">
            {isExam ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passages (one reference per line, required)</label>
                <textarea
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  rows={4}
                  className="input"
                  placeholder={'John 15:1-4\nRomans 8:1-4\nMark 1:9-13'}
                />
                <p className="text-xs text-brand-600 mt-1">Each passage students translate in the exam. Enter one reference per line.</p>
              </div>
            ) : (
              <div>
                <Input
                  label="Passage reference (required)"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. John 1:1–18"
                />
                <p className="text-xs text-brand-600 mt-1">
                  The passage students annotate in the Exegesis Workspace. Changing this affects new sessions;
                  students who already started keep their current passage.
                </p>
              </div>
            )}
            {isExam && (
              <>
                <hr className="border-brand-200" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam closes (date &amp; time)</label>
                  <input
                    type="datetime-local"
                    value={round1Deadline}
                    onChange={e => setRound1Deadline(e.target.value)}
                    className="input"
                  />
                  <p className="text-xs text-brand-600 mt-1">At this cut-off the exam locks and auto-submits. Leave blank for no cut-off.</p>
                </div>
              </>
            )}
            {!isExam && (
            <>
            <hr className="border-brand-200" />
            <p className="text-sm font-semibold text-brand-800">Submission deadline</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline (date &amp; time) — students cannot submit after this point
              </label>
              <input
                type="datetime-local"
                value={submissionDeadline}
                onChange={e => setSubmissionDeadline(e.target.value)}
                className="input"
              />
              <p className="text-xs text-brand-600 mt-1">
                After the deadline students can still edit their submitted work, but cannot make a new submission.
                Leave blank for no deadline.
              </p>
            </div>
            <hr className="border-brand-200" />
            <p className="text-sm font-semibold text-brand-800">Round deadlines</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Round 1 deadline — annotations lock after this time
              </label>
              <input
                type="datetime-local"
                value={round1Deadline}
                onChange={e => setRound1Deadline(e.target.value)}
                className="input"
              />
              <p className="text-xs text-brand-600 mt-1">Fixed cut-off for Round 1 annotations. Leave blank for none.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Round 2 deadline — corrections lock after this time
              </label>
              <input
                type="datetime-local"
                value={round2Deadline}
                onChange={e => setRound2Deadline(e.target.value)}
                className="input"
              />
              <p className="text-xs text-brand-600 mt-1">Fixed cut-off for Round 2 corrections. Leave blank for none.</p>
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
                <span className="text-sm font-medium text-brand-800">Allow Reader tools in Round 2</span>
                <p className="text-xs text-brand-600 mt-0.5">
                  When on, clicking a word in Round 2 also shows the Reader's parsing, gloss, and lexicon entry next to the correction box.
                </p>
              </div>
            </label>
            <hr className="border-brand-200" />
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1">Definition glossary</label>
              <select
                value={glossFrequency ?? ''}
                onChange={e => setGlossFrequency(e.target.value ? Number(e.target.value) : null)}
                className="input"
              >
                <option value="">Off — no glossary</option>
                <option value="50">Beginner — words rarer than 50×</option>
                <option value="30">Intermediate — words rarer than 30×</option>
              </select>
              <p className="text-xs text-brand-600 mt-1">Shows definitions for the verse&rsquo;s less-frequent words beneath each Verse Translation box.</p>
            </div>
            <hr className="border-brand-200" />
            <p className="text-sm font-semibold text-brand-800">Timer settings</p>
            <Input
              label="Stage 1 — annotation phase (minutes, 0 = no limit)"
              type="number"
              min={0}
              max={180}
              value={timePerQuestion}
              onChange={e => setTimePerQuestion(Number(e.target.value))}
            />
            <p className="text-xs text-brand-600 -mt-2">
              Students annotate each word. When the timer reaches zero, annotations lock and review mode begins.
            </p>
            <Input
              label="Stage 2 — review & correction phase (minutes, 0 = no limit)"
              type="number"
              min={0}
              max={60}
              value={reviewTimeSeconds}
              onChange={e => setReviewTimeSeconds(Number(e.target.value))}
            />
            <p className="text-xs text-brand-600 -mt-2">
              After Stage 1 ends, students can make red corrections and see the passage reader.
              When this timer expires, all edits lock and the exercise auto-submits.
              Set to 0 for unlimited review time (student must click Submit manually).
            </p>
            </>
            )}
          </div>
        ) : (
          <Input
            label="Time per question (seconds, 0 = untimed)"
            type="number"
            min={0}
            max={300}
            value={timePerQuestion}
            onChange={e => setTimePerQuestion(Number(e.target.value))}
          />
        )}

        {isVocabQuiz && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-800">Choose the words for this quiz</p>
            <FrequencySectionPicker selectedSubsections={vocabSubsections} onChange={setVocabSubsections} />
            <p className="text-xs text-gray-500">
              After changing the selection, click <strong>Generate Questions</strong> below to rebuild the quiz from these words.
            </p>
          </div>
        )}

        {isVocabQuiz && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type of Quiz —{' '}
              <span className="text-brand-700 font-semibold">
                {quizStylePct === 0
                  ? 'All multiple-choice'
                  : quizStylePct === 100
                    ? 'All open-ended'
                    : `${100 - quizStylePct}% multiple-choice / ${quizStylePct}% open-ended`}
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
              <span>Choose Definition</span>
              <span>Provide Definition</span>
            </div>
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              After changing this setting, save first, then use <strong>Generate Questions</strong> below to regenerate in the correct format.
            </p>
          </div>
        )}

        {isVocabQuiz && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-800">Generate questions</p>
            <p className="text-xs text-gray-500">
              Click after you&rsquo;ve set the Type of Quiz above. Regenerating replaces any existing questions for this quiz.
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
                Generate Questions
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

        {!isTranslation && (
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

        {isVocabQuiz && (
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
              You review pending appeals on the instructor Appeals page. Accepting an appeal updates that student&rsquo;s
              score; the admin separately decides whether to add the answer to the global lexicon.
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
              <span className="text-sm text-gray-700">Allow students to submit after the due date</span>
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
          <Button onClick={handleSave} loading={saving}>Save settings</Button>
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
