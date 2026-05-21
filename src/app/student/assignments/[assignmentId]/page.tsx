import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { QuizPlayer } from '@/components/student/QuizPlayer'
import { TranslationExercise } from '@/components/student/TranslationExercise'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

  const quizQuestions = assignment.questions.map(q => ({
    id: q.id,
    position: q.position,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
    points: q.points,
    reference: q.reference ?? undefined,
  }))

  return (
    <DashboardShell role="STUDENT" pageTitle={assignment.title}>
      <div className="max-w-2xl space-y-6">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="gray">Week {assignment.weekNumber}</Badge>
          <Badge variant={assignment.level === 'BEGINNING' ? 'blue' : 'purple'}>
            {assignment.level === 'BEGINNING' ? 'Beginning' : 'Intermediate'}
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

        {assignment.type === 'TRANSLATION_EXERCISE' ? (
          <TranslationExercise assignmentId={assignment.id} questions={quizQuestions} />
        ) : (
          <QuizPlayer
            assignmentId={assignment.id}
            questions={quizQuestions}
            type={assignment.type as 'VOCABULARY_QUIZ' | 'MORPHOLOGY_QUIZ'}
          />
        )}
      </div>
    </DashboardShell>
  )
}
