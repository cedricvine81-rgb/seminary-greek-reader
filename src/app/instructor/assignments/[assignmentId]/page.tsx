import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { QuizBuilder } from '@/components/instructor/QuizBuilder'
import { QuizPreview } from '@/components/instructor/QuizPreview'
import { AssignmentResultsGrid } from '@/components/instructor/AssignmentResultsGrid'
import { AssignmentSettingsEditor } from '@/components/instructor/AssignmentSettingsEditor'
import { TranslationExerciseBuilder } from '@/components/instructor/TranslationExerciseBuilder'
import { DeleteAssignmentButton } from '@/components/instructor/DeleteAssignmentButton'
import { PublishButton } from '@/components/instructor/PublishButton'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'
import { isAuthorizedForAssignment } from '@/lib/course-auth'

export const metadata: Metadata = { title: 'Edit Assignment' }

export default async function AssignmentDetailPage({ params }: { params: { assignmentId: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: { questions: { orderBy: { position: 'asc' } } },
  })
  if (!assignment || !await isAuthorizedForAssignment(params.assignmentId, payload.sub)) notFound()

  return (
    <DashboardShell
      role="INSTRUCTOR"
      pageTitle={assignment.title}
      actions={
        <div className="flex items-center gap-2">
          <PublishButton assignmentId={assignment.id} isPublished={assignment.isPublished} />
          <DeleteAssignmentButton
            assignmentId={assignment.id}
            assignmentTitle={assignment.title}
            redirectOnDelete="/instructor/assignments"
          />
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex gap-2 flex-wrap items-center">
          <Badge variant="gray">Week {assignment.weekNumber}</Badge>
          <Badge variant={COURSE_LEVEL_VARIANTS[assignment.level] ?? 'gray'}>
            {COURSE_LEVEL_LABELS[assignment.level] ?? assignment.level}
          </Badge>
          <Badge variant="green">{assignment.questions.length} questions</Badge>
          <Badge variant={assignment.isPublished ? 'green' : 'gray'}>
            {assignment.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>

        {(assignment.type === 'VOCABULARY_QUIZ' || assignment.type === 'MORPHOLOGY_QUIZ') && (
          <QuizBuilder
            assignmentId={assignment.id}
            level={assignment.level}
          />
        )}

        {assignment.type === 'TRANSLATION_EXERCISE' && (
          <TranslationExerciseBuilder
            assignmentId={assignment.id}
          />
        )}

        <AssignmentSettingsEditor
          assignmentId={assignment.id}
          isVocabQuiz={assignment.type === 'VOCABULARY_QUIZ'}
          initial={{
            title: assignment.title,
            weekNumber: assignment.weekNumber,
            dueDate: assignment.dueDate.toISOString(),
            instructions: assignment.instructions,
            timePerQuestion: assignment.timePerQuestion,
            provideDefinition: assignment.provideDefinition,
            maxRetakes: assignment.maxRetakes,
            allowLate: assignment.allowLate,
            lateDaysLimit: assignment.lateDaysLimit,
          }}
        />

        <QuizPreview
          questions={assignment.questions.map(q => ({
            id: q.id,
            position: q.position,
            type: q.type,
            prompt: q.prompt,
            correctAnswer: q.correctAnswer,
            options: q.options,
            points: q.points,
          }))}
          provideDefinition={assignment.provideDefinition}
        />

        <AssignmentResultsGrid assignmentId={assignment.id} />
      </div>
    </DashboardShell>
  )
}
