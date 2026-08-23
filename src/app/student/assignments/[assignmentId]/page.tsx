import { redirect, notFound } from 'next/navigation'
import { getServerT } from '@/lib/i18n/server'
import { rich } from '@/lib/i18n/rich'
import type { Metadata } from 'next'
import Link from 'next/link'
import { addDays } from 'date-fns'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { QuizPlayer } from '@/components/student/QuizPlayer'
import { GrammarHomework } from '@/components/student/GrammarHomework'
import { TranslationExercise } from '@/components/student/TranslationExercise'
import { ExegesisWorkspace } from '@/components/student/ExegesisWorkspace'
import { ExamOpensNotice } from '@/components/student/ExamOpensNotice'
import { ConstructSearchWorkspace } from '@/components/student/ConstructSearchWorkspace'
import { DiagramWorkspace } from '@/components/student/DiagramWorkspace'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages, isPreviewMode } from '@/lib/preview'
import { prisma } from '@/lib/db'
import { COURSE_LEVEL_VARIANTS, isHebrewLevel } from '@/lib/constants'
import { effectiveDeadline } from '@/lib/assignment-deadline'
import { ArrowLeft } from 'lucide-react'
import { LocalDateTime } from '@/components/ui/LocalDateTime'
import { constructCorpusLabel, constructLinkFromReference } from '@/lib/construct-assignment'

export const metadata: Metadata = { title: 'Assignment' }

export default async function StudentAssignmentPage({ params }: { params: { assignmentId: string } }) {
  const t = getServerT()
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const [assignment, attemptCount, bestAttempt, existingSession, priorResponses] = await Promise.all([
    prisma.assignment.findUnique({
      where: { id: params.assignmentId },
      include: { questions: { orderBy: { position: 'asc' } } },
    }),
    prisma.quizAttempt.count({ where: { assignmentId: params.assignmentId, userId: payload.sub } }),
    prisma.quizAttempt.findFirst({
      where: { assignmentId: params.assignmentId, userId: payload.sub, isBest: true },
      select: { percentage: true },
    }),
    // Check for an existing exegesis session (for passage exercises that are now closed)
    prisma.exegesisSession.findFirst({
      where: { assignmentId: params.assignmentId, userId: payload.sub },
      select: { submittedAt: true, grade: true, gradeNote: true },
    }),
    // Grammar homework: the student's last-submitted answers, so they can correct
    // (in class, on any device) rather than starting over from a blank pane.
    prisma.response.findMany({
      where: { assignmentId: params.assignmentId, userId: payload.sub, questionId: { not: null } },
      select: { questionId: true, answer: true },
    }),
  ])
  if (!assignment) notFound()

  // Group presentations have their own page (per-member sections + attestation) — this generic
  // quiz/exercise page can't render them. Reachable here via a course-link that doesn't special-
  // case the type, so send them to the right place instead of an empty quiz.
  if (assignment.type === 'GROUP_PRESENTATION') redirect('/student/group-presentations')

  const previewMode = isPreviewMode() && payload.role === 'INSTRUCTOR'

  // Determine submission window.
  // Two-round passage exercises stay open until the Round 2 (corrections) deadline —
  // their dueDate is the Round 1 cut-off, so closing on dueDate would shut the
  // assignment before Round 2. Other assignments use dueDate.
  // Passage-based exercises and exams both use the Exegesis workspace.
  const isPassageExercise =
    (assignment.type === 'TRANSLATION_EXERCISE' && assignment.questions.length === 0) ||
    assignment.type === 'TRANSLATION_EXAM'
  const now = new Date()
  // Exams have a start gate: students cannot open them before opensAt.
  const examNotYetOpen = assignment.type === 'TRANSLATION_EXAM' && !!assignment.opensAt && now < assignment.opensAt

  // Grammar homework (deck Exercises A/B as a Translation Exercise): questions carry
  // word-level model data in options[0] ({"hw":1,...}).
  const isGrammarHomework = assignment.type === 'TRANSLATION_EXERCISE'
    && assignment.questions.length > 0
    && (assignment.questions[0].options[0] ?? '').includes('"hw":1')
  const finalDeadline = effectiveDeadline(assignment)
  const isPastDue = now > finalDeadline
  const lateDeadline = assignment.allowLate && assignment.lateDaysLimit != null
    ? addDays(finalDeadline, assignment.lateDaysLimit)
    : null
  // closed = past due AND (late not allowed OR past lateDeadline)
  const isClosed = isPastDue && (!assignment.allowLate || (lateDeadline !== null && now > lateDeadline))
  const isLateWindow = isPastDue && assignment.allowLate && !isClosed

  // For Greek → English typed questions, look up curated synonyms in one batch
  // so client-side instant feedback agrees with the server's grader.
  const gtePrompts = assignment.questions
    .filter(q => q.type === 'GREEK_TO_ENGLISH')
    .map(q => q.prompt)
  const lexEntries = gtePrompts.length > 0
    ? await prisma.lexicalEntry.findMany({
        where: { lexeme: { in: gtePrompts } },
        select: { lexeme: true, acceptedAnswers: true },
      })
    : []
  const synonymMap = new Map<string, string[]>()
  for (const l of lexEntries) {
    if (!l.acceptedAnswers) continue
    synonymMap.set(l.lexeme, l.acceptedAnswers.split(',').map(s => s.trim()).filter(Boolean))
  }

  const quizQuestions = assignment.questions.map(q => ({
    id: q.id,
    position: q.position,
    type: q.type,
    prompt: q.prompt,
    correctAnswer: q.correctAnswer,
    options: q.options,
    points: q.points,
    reference: q.reference ?? undefined,
    acceptedAnswers: q.type === 'GREEK_TO_ENGLISH' ? (synonymMap.get(q.prompt) ?? []) : undefined,
  }))

  // Re-sampling vocab quizzes store the whole pool and show `perAttempt` random
  // questions each attempt (different words on retake). undefined = show them all.
  const vocabSel = assignment.vocabSelection as { perAttempt?: number } | null
  const vocabPerAttempt = vocabSel?.perAttempt && vocabSel.perAttempt > 0 ? vocabSel.perAttempt : undefined

  return (
    <DashboardShell role="STUDENT" pageTitle={assignment.title}>
      {/* Passage-based exegesis exercises need full width */}
      <div className={isPassageExercise ? 'flex flex-col h-full print:h-auto overflow-hidden print:overflow-visible' : 'max-w-2xl space-y-6'}>

        {/* Back to the student's assignment list — hidden for lockdown exams so it can't
            be used as an escape hatch mid-exam. */}
        {!(assignment.type === 'TRANSLATION_EXAM' && assignment.lockdown) && (
          <Link href="/student/assignments" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-3 print:hidden">
            <ArrowLeft size={14} /> {t('assign.backToAssignments')}
          </Link>
        )}

        {/* Instructor preview banner */}
        {previewMode && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between gap-4">
            <div>
              {rich(t('assign.previewNote'), {
                label: <span className="font-semibold">{t('assign.previewLabel')}</span>,
              })}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/instructor/assignments/${params.assignmentId}`}
                className="font-medium hover:underline"
              >
                ← {t('assign.backToEdit')}
              </Link>
              <Link
                href="/api/preview?mode=exit"
                className="font-medium hover:underline"
              >
                {t('assign.exitPreview')}
              </Link>
            </div>
          </div>
        )}

        {/* Header badges + instructions — shown for non-passage exercises */}
        {!isPassageExercise && (
          <>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="gray">{t('student.weekN', { n: assignment.weekNumber })}</Badge>
              <Badge variant={COURSE_LEVEL_VARIANTS[assignment.level] ?? 'gray'}>
                {t(`course.level.${assignment.level}`)}
              </Badge>
              {assignment.type === 'CONSTRUCT_SEARCH'
                ? (() => {
                    // Its reference is the search link — show which text it runs over instead.
                    const link = constructLinkFromReference(assignment.reference)
                    return link ? <Badge variant="gray">{constructCorpusLabel(link.query)}</Badge> : null
                  })()
                : assignment.reference && <Badge variant="gray">{assignment.reference}</Badge>}
            </div>

            {assignment.instructions && assignment.type !== 'CONSTRUCT_SEARCH' && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4 space-y-2">
                <p>{assignment.instructions}</p>
                {/* Greek: the published textbook the instructions cite by name.
                    Hebrew: the word list generated from our own deck — there is no Hebrew
                    textbook to ship, and Hebrew instructions never name one, so it hangs
                    off the assignment's level rather than a string match. */}
                {assignment.instructions.includes('Vocabulary Builder') && (
                  <Link
                    href="/downloads/BGVB-2024.pdf"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-brand-700 hover:text-brand-900 hover:underline font-medium"
                  >
                    ↓ {t('assign.downloadGreekVocabPdf')}
                  </Link>
                )}
              </div>
            )}

            {assignment.type === 'VOCABULARY_QUIZ' && isHebrewLevel(assignment.level) && (
              <Link
                href="/downloads/hebrew-vocabulary-list.pdf"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-900 hover:underline font-medium"
              >
                ↓ {t('assign.downloadHebrewVocabPdf')}
              </Link>
            )}
          </>
        )}

        {isClosed && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-semibold">{t('assign.closedTitle')}</span>{' '}
            {t('assign.closedWindow')}
            {isPassageExercise && existingSession?.submittedAt && (
              <span className="ml-1">{t('assign.closedSubmittedReadonly')}</span>
            )}
            {isPassageExercise && existingSession && !existingSession.submittedAt && (
              <span className="ml-1">{t('assign.closedInProgress')}</span>
            )}
          </div>
        )}

        {isLateWindow && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="font-semibold">{t('assign.lateSubmission')}</span>{' '}
            {lateDeadline
              ? rich(t('assign.acceptingUntil'), {
                  date: <span className="font-medium"><LocalDateTime iso={lateDeadline.toISOString()} withTime={false} /></span>,
                })
              : t('assign.acceptingIndefinitely')}
          </div>
        )}

        {/* Grade result — shown once instructor has graded the passage exercise */}
        {isPassageExercise && existingSession?.grade != null && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-4 space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-brand-800">{t('cs.yourGrade')}</span>
              <span className="text-2xl font-bold text-brand-700">{existingSession.grade}%</span>
            </div>
            {existingSession.gradeNote && (
              <p className="text-sm text-brand-700 whitespace-pre-wrap">{existingSession.gradeNote}</p>
            )}
          </div>
        )}

        {/* Exam not yet open — show a live countdown; auto-opens when the time arrives.
            (Instructors can still preview regardless.) */}
        {examNotYetOpen && !previewMode && (
          <ExamOpensNotice opensAtIso={assignment.opensAt!.toISOString()} />
        )}

        {/* Show passage exercise when open, OR when closed but the student has any existing session
            (submitted or in-progress) — lets them review their own work even after close.
            Always shown in instructor preview mode so instructors can inspect regardless of dates. */}
        {isPassageExercise && (!examNotYetOpen || previewMode) && (!isClosed || !!existingSession || previewMode) && (
          <ExegesisWorkspace assignmentId={assignment.id} previewMode={previewMode} />
        )}

        {/* Grammar homework (deck Exercises A/B): word-by-word translation exercise
            worked in the right-hand homework pane; graded by the instructor. */}
        {(!isClosed || previewMode) && isGrammarHomework && (() => {
          const priorByQuestion = new Map(priorResponses.map(r => [r.questionId, r.answer]))
          // Every question in the assignment comes from one pack, so the first one names it.
          let setId: string | null = null
          try { setId = (JSON.parse(assignment.questions[0]?.options[0] ?? '{}') as { set?: string }).set ?? null }
          catch { /* leave null — the new-words list is simply omitted */ }
          return (
            <GrammarHomework
              assignmentId={assignment.id}
              attemptCount={attemptCount}
              setId={setId}
              dueDate={assignment.dueDate?.toISOString() ?? null}
              round2Deadline={assignment.round2Deadline?.toISOString() ?? null}
              questions={assignment.questions.map(q => {
                let meta: { words?: unknown[]; note?: string | null } = {}
                try { meta = JSON.parse(q.options[0] ?? '{}') } catch { /* ignore */ }
                type PriorWords = { parsing: string; syntax: string; gloss: string }[]
                let prior: { words?: unknown[]; translation?: string; r2?: { words?: unknown[]; translation?: string }; r2At?: string } | null = null
                try { const raw = priorByQuestion.get(q.id); if (raw) prior = JSON.parse(raw) } catch { /* ignore */ }
                return {
                  id: q.id,
                  prompt: q.prompt,
                  points: q.points,
                  words: (meta.words ?? []) as { w: string }[],
                  note: meta.note ?? undefined,
                  prior: prior && Array.isArray(prior.words)
                    ? {
                        words: prior.words as PriorWords,
                        translation: prior.translation ?? '',
                        r2: prior.r2 && Array.isArray(prior.r2.words)
                          ? { words: prior.r2.words as PriorWords, translation: prior.r2.translation ?? '' }
                          : undefined,
                        r2At: prior.r2At,
                      }
                    : undefined,
                }
              })}
            />
          )
        })()}

        {(!isClosed || previewMode) && !isPassageExercise && !isGrammarHomework && assignment.type === 'TRANSLATION_EXERCISE' && (
          <TranslationExercise
            assignmentId={assignment.id}
            questions={quizQuestions}
          />
        )}

        {/* Course Notes isn't a quiz — students write and submit their own notes in the folder
            provisioned for them. Point them there instead of an empty quiz player. */}
        {assignment.type === 'COURSE_NOTES' && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 px-5 py-6 space-y-3">
            <p className="text-base font-semibold text-brand-900">{t('assign.courseNotesTitle')}</p>
            <p className="text-sm text-brand-800">
              {assignment.notesFolderName
                ? rich(t('assign.courseNotesBodyNamed'), { folder: <strong>{assignment.notesFolderName}</strong> })
                : t('assign.courseNotesBody')}
            </p>
            <Link href="/notes" className="btn btn-primary inline-flex w-fit items-center gap-1.5 px-4 py-2">
              {t('assign.openYourNotes')} →
            </Link>
          </div>
        )}

        {/* Construct searches: students run the instructor's search and write up what they
            find. Shown even when closed — the workspace itself goes read-only, so a student
            can still read their own submitted list and their grade. */}
        {assignment.type === 'CONSTRUCT_SEARCH' && (
          <ConstructSearchWorkspace assignmentId={assignment.id} previewMode={previewMode} />
        )}

        {/* Diagramming exercises: the assigned passage's sentence canvases. Shown even when
            closed — the workspace itself goes read-only, so a student can still review their
            own submitted diagrams and their grade. */}
        {assignment.type === 'DIAGRAM' && (
          <DiagramWorkspace assignmentId={assignment.id} previewMode={previewMode} />
        )}

        {(!isClosed || previewMode) && !isPassageExercise && !isGrammarHomework && assignment.type !== 'TRANSLATION_EXERCISE' && assignment.type !== 'COURSE_NOTES' && assignment.type !== 'CONSTRUCT_SEARCH' && assignment.type !== 'DIAGRAM' && (
          <QuizPlayer
            assignmentId={assignment.id}
            questions={quizQuestions}
            type={assignment.type as 'VOCABULARY_QUIZ' | 'MORPHOLOGY_QUIZ'}
            timePerQuestion={assignment.timePerQuestion}
            provideDefinition={assignment.provideDefinition}
            maxRetakes={assignment.maxRetakes}
            maxAppeals={assignment.maxAppeals ?? 0}
            questionsPerAttempt={vocabPerAttempt}
            attemptCount={attemptCount}
            bestPct={bestAttempt?.percentage ?? null}
          />
        )}
      </div>
    </DashboardShell>
  )
}
