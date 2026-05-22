import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { addDays, format } from 'date-fns'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { QuizPlayer } from '@/components/student/QuizPlayer'
import { TranslationExercise } from '@/components/student/TranslationExercise'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Assignment' }

export default async function StudentAssignmentPage({ params }: { params: { assignmentId: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'STUDENT') redirect('/auth/sign-in')

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: { questions: { orderBy: { position: 'asc' } } },
  })
  if (!assignment) notFound()

  // Determine submission window
  const now = new Date()
  const isPastDue = now > assignment.dueDate
  const lateDeadline = assignment.allowLate && assignment.lateDaysLimit != null
    ? addDays(assignment.dueDate, assignment.lateDaysLimit)
    : null
  // closed = past due AND (late not allowed OR past lateDeadline)
  const isClosed = isPastDue && (!assignment.allowLate || (lateDeadline !== null && now > lateDeadline))
  const isLateWindow = isPastDue && assignment.allowLate && !isClosed

  const quizQuestions = assignment.questions.map(q => ({
    id: q.id,
    position: q.position,
    type: q.type,
    prompt: q.prompt,
    correctAnswer: q.correctAnswer,
    options: q.options,
    points: q.points,
    reference: q.reference ?? undefined,
  }))

  return (
    <DashboardShell role="STUDENT" pageTitle={assignment.title}>
      <div className="max-w-2xl space-y-6">
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

        {isClosed && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-semibold">This assignment is closed.</span>{' '}
            The submission window has ended.
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

        {!isClosed && (assignment.type === 'TRANSLATION_EXERCISE' ? (
          <TranslationExercise assignmentId={assignment.id} questions={quizQuestions} />
        ) : (
          <QuizPlayer
            assignmentId={assignment.id}
            questions={quizQuestions}
            type={assignment.type as 'VOCABULARY_QUIZ' | 'MORPHOLOGY_QUIZ'}
            timePerQuestion={assignment.timePerQuestion}
          />
        ))}
      </div>
    </DashboardShell>
  )
}
