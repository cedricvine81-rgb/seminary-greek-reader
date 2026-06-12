import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { addDays, format } from 'date-fns'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { QuizPlayer } from '@/components/student/QuizPlayer'
import { TranslationExercise } from '@/components/student/TranslationExercise'
import { ExegesisWorkspace } from '@/components/student/ExegesisWorkspace'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages, isPreviewMode } from '@/lib/preview'
import { prisma } from '@/lib/db'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Assignment' }

export default async function StudentAssignmentPage({ params }: { params: { assignmentId: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const [assignment, attemptCount, bestAttempt, existingSession] = await Promise.all([
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
  ])
  if (!assignment) notFound()

  const previewMode = isPreviewMode() && payload.role === 'INSTRUCTOR'

  // Determine submission window
  const now = new Date()
  const isPastDue = now > assignment.dueDate
  const lateDeadline = assignment.allowLate && assignment.lateDaysLimit != null
    ? addDays(assignment.dueDate, assignment.lateDaysLimit)
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

  const isPassageExercise = assignment.type === 'TRANSLATION_EXERCISE' && assignment.questions.length === 0

  return (
    <DashboardShell role="STUDENT" pageTitle={assignment.title}>
      {/* Passage-based exegesis exercises need full width */}
      <div className={isPassageExercise ? 'flex flex-col h-full print:h-auto overflow-hidden print:overflow-visible' : 'max-w-2xl space-y-6'}>

        {/* Instructor preview banner */}
        {previewMode && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold">Instructor Preview</span>
              {' — '}you are viewing this assignment as a student would experience it. No student data will be affected.
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/instructor/assignments/${params.assignmentId}`}
                className="font-medium hover:underline"
              >
                ← Back to edit
              </Link>
              <Link
                href="/api/preview?mode=exit"
                className="font-medium hover:underline"
              >
                Exit preview
              </Link>
            </div>
          </div>
        )}

        {/* Back link — shown for non-passage exercises only (passage has its own toolbar nav) */}
        {!isPassageExercise && (
          <Link
            href="/student/assignments"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={14} /> Back to assignments
          </Link>
        )}

        {/* Header badges + instructions — shown for non-passage exercises */}
        {!isPassageExercise && (
          <>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="gray">Week {assignment.weekNumber}</Badge>
              <Badge variant={COURSE_LEVEL_VARIANTS[assignment.level] ?? 'gray'}>
                {COURSE_LEVEL_LABELS[assignment.level] ?? assignment.level}
              </Badge>
              {assignment.reference && <Badge variant="gray">{assignment.reference}</Badge>}
            </div>

            {assignment.instructions && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4 space-y-2">
                <p>{assignment.instructions}</p>
                {assignment.instructions.includes('Vocabulary Builder') && (
                  <Link
                    href="/downloads/BGVB-2024.pdf"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-brand-700 hover:text-brand-900 hover:underline font-medium"
                  >
                    ↓ Download Biblical Greek Vocabulary Builder (PDF)
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {isClosed && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-semibold">This assignment is closed.</span>{' '}
            The submission window has ended.
            {isPassageExercise && existingSession?.submittedAt && (
              <span className="ml-1">Your submitted work is shown below in read-only mode.</span>
            )}
            {isPassageExercise && existingSession && !existingSession.submittedAt && (
              <span className="ml-1">Your in-progress work is shown below — submissions are no longer accepted.</span>
            )}
          </div>
        )}

        {isLateWindow && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="font-semibold">Late submission.</span>{' '}
            {lateDeadline
              ? <>Accepting submissions until <span className="font-medium">{format(lateDeadline, 'MMM d, yyyy')}</span>.</>
              : 'Accepting submissions indefinitely.'}
          </div>
        )}

        {/* Grade result — shown once instructor has graded the passage exercise */}
        {isPassageExercise && existingSession?.grade != null && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-4 space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-brand-800">Your Grade</span>
              <span className="text-2xl font-bold text-brand-700">{existingSession.grade}%</span>
            </div>
            {existingSession.gradeNote && (
              <p className="text-sm text-brand-700 whitespace-pre-wrap">{existingSession.gradeNote}</p>
            )}
          </div>
        )}

        {/* Show passage exercise when open, OR when closed but the student has any existing session
            (submitted or in-progress) — lets them review their own work even after close.
            Always shown in instructor preview mode so instructors can inspect regardless of dates. */}
        {isPassageExercise && (!isClosed || !!existingSession || previewMode) && (
          <ExegesisWorkspace assignmentId={assignment.id} />
        )}

        {(!isClosed || previewMode) && !isPassageExercise && assignment.type === 'TRANSLATION_EXERCISE' && (
          <TranslationExercise
            assignmentId={assignment.id}
            questions={quizQuestions}
          />
        )}

        {(!isClosed || previewMode) && assignment.type !== 'TRANSLATION_EXERCISE' && (
          <QuizPlayer
            assignmentId={assignment.id}
            questions={quizQuestions}
            type={assignment.type as 'VOCABULARY_QUIZ' | 'MORPHOLOGY_QUIZ'}
            timePerQuestion={assignment.timePerQuestion}
            provideDefinition={assignment.provideDefinition}
            maxRetakes={assignment.maxRetakes}
            maxAppeals={assignment.maxAppeals ?? 0}
            attemptCount={attemptCount}
            bestPct={bestAttempt?.percentage ?? null}
          />
        )}
      </div>
    </DashboardShell>
  )
}
