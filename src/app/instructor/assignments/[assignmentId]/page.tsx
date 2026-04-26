import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { QuizBuilder } from '@/components/instructor/QuizBuilder'
import { TranslationExerciseBuilder } from '@/components/instructor/TranslationExerciseBuilder'
import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit Assignment' }

export default async function AssignmentDetailPage({ params }: { params: { assignmentId: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: { questions: { orderBy: { position: 'asc' } } },
  })
  if (!assignment || assignment.createdById !== payload.sub) notFound()

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle={assignment.title}>
      <div className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="gray">Week {assignment.weekNumber}</Badge>
          <Badge variant={assignment.level === 'BEGINNING' ? 'blue' : 'purple'}>
            {assignment.level === 'BEGINNING' ? 'Beginning' : 'Intermediate'}
          </Badge>
          <Badge variant="green">{assignment.questions.length} questions</Badge>
        </div>

        {(assignment.type === 'VOCABULARY_QUIZ' || assignment.type === 'MORPHOLOGY_QUIZ') && (
          <QuizBuilder
            assignmentId={assignment.id}
            level={assignment.level}
            onGenerate={async () => {}}
          />
        )}

        {assignment.type === 'TRANSLATION_EXERCISE' && (
          <TranslationExerciseBuilder
            assignmentId={assignment.id}
            onAddQuestion={async () => {}}
          />
        )}

        <Card>
          <CardTitle>Questions ({assignment.questions.length})</CardTitle>
          {assignment.questions.length === 0 ? (
            <p className="text-sm text-gray-400 italic mt-2">No questions yet. Use the builder above to add questions.</p>
          ) : (
            <ol className="mt-3 space-y-2 list-decimal list-inside">
              {assignment.questions.map(q => (
                <li key={q.id} className="text-sm text-gray-700">
                  <span className="greek-text">{q.prompt}</span>
                  {q.options.length > 0 && (
                    <span className="text-gray-400 text-xs ml-2">({q.options.length} options)</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </DashboardShell>
  )
}
