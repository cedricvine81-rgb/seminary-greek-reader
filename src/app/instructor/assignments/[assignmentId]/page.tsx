import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { QuizBuilder } from '@/components/instructor/QuizBuilder'
import { QuizPreview } from '@/components/instructor/QuizPreview'
import { AssignmentSettingsEditor } from '@/components/instructor/AssignmentSettingsEditor'
import { TranslationExerciseBuilder } from '@/components/instructor/TranslationExerciseBuilder'
import { DeleteAssignmentButton } from '@/components/instructor/DeleteAssignmentButton'
import { PublishButton } from '@/components/instructor/PublishButton'
import { Badge } from '@/components/ui/Badge'
import { Eye } from 'lucide-react'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import { constructCorpusLabel, constructLinkFromReference } from '@/lib/construct-assignment'

export const metadata: Metadata = { title: 'Edit Assignment' }

export default async function AssignmentDetailPage({ params }: { params: { assignmentId: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: { questions: { orderBy: { position: 'asc' } }, course: { select: { id: true, name: true } } },
  })
  if (!assignment || !await isAuthorizedForAssignment(params.assignmentId, payload.sub)) notFound()

  return (
    <DashboardShell
      role="INSTRUCTOR"
      pageTitle={assignment.title}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/api/preview?mode=enter&redirect=/student/assignments/${assignment.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
          >
            <Eye size={14} /> Preview as Student
          </Link>
          <PublishButton assignmentId={assignment.id} isPublished={assignment.isPublished} />
          <DeleteAssignmentButton
            assignmentId={assignment.id}
            assignmentTitle={assignment.title}
            redirectOnDelete={`/instructor/courses/${assignment.courseId}`}
          />
        </div>
      }
    >
      <div className="space-y-6">
        {assignment.course && (
          <Link
            href={`/instructor/courses/${assignment.course.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={14} /> Back to {assignment.course.name}
          </Link>
        )}
        <div className="flex gap-2 flex-wrap items-center">
          <Badge variant="gray">Week {assignment.weekNumber}</Badge>
          <Badge variant={COURSE_LEVEL_VARIANTS[assignment.level] ?? 'gray'}>
            {COURSE_LEVEL_LABELS[assignment.level] ?? assignment.level}
          </Badge>
          {assignment.type === 'TRANSLATION_EXERCISE' ? (
            assignment.reference && (
              <Badge variant="blue">{assignment.reference}</Badge>
            )
          ) : assignment.type === 'CONSTRUCT_SEARCH' ? (
            // The search itself, said back in words — the badge a construct search actually needs.
            (() => {
              const link = constructLinkFromReference(assignment.reference)
              return link ? <Badge variant="blue">{constructCorpusLabel(link.query)}</Badge> : null
            })()
          ) : (assignment.type === 'COURSE_NOTES' || assignment.type === 'GROUP_PRESENTATION') ? null : (() => {
            // Re-sampling vocab quizzes store the whole pool and show `perAttempt`
            // random questions each attempt — show that, not the raw pool size.
            const sel = assignment.vocabSelection as { perAttempt?: number } | null
            const perAttempt = sel?.perAttempt && sel.perAttempt > 0 ? sel.perAttempt : null
            return perAttempt
              ? <Badge variant="green">{perAttempt} per attempt · pool of {assignment.questions.length}</Badge>
              : <Badge variant="green">{assignment.questions.length} questions</Badge>
          })()}
          <Badge variant={assignment.isPublished ? 'green' : 'gray'}>
            {assignment.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>

        {/* Morphology quizzes still use the legacy QuizBuilder panel. Vocab quizzes
            now have the # of questions + Generate Questions inline in the Settings
            card (positioned after the Type of Quiz slider), so this panel is hidden
            for vocab to avoid duplication. */}
        {assignment.type === 'MORPHOLOGY_QUIZ' && (
          <QuizBuilder
            assignmentId={assignment.id}
            level={assignment.level}
            provideDefinition={assignment.provideDefinition}
          />
        )}

        {assignment.type === 'TRANSLATION_EXERCISE' && (
          <TranslationExerciseBuilder
            assignmentId={assignment.id}
          />
        )}

        <AssignmentSettingsEditor
          assignmentId={assignment.id}
          assignmentType={assignment.type}
          isVocabQuiz={assignment.type === 'VOCABULARY_QUIZ'}
          initial={{
            title: assignment.title,
            weekNumber: assignment.weekNumber,
            dueDate: assignment.dueDate.toISOString(),
            instructions: assignment.instructions,
            reference: assignment.reference,
            // Current Type-of-Quiz mix derived from saved questions: % that are
            // open-ended (typed) vs multiple-choice. Lets the slider show the real quiz.
            quizStylePct: assignment.questions.length > 0
              ? Math.round(
                  (assignment.questions.filter(q => q.type !== 'MULTIPLE_CHOICE').length /
                    assignment.questions.length) * 100,
                )
              : (assignment.provideDefinition ? 100 : 0),
            vocabSelection: (assignment.vocabSelection as { subsections: string[]; pos: string[] } | null) ?? null,
            timePerQuestion: assignment.timePerQuestion,
            reviewTimeSeconds: assignment.reviewTimeSeconds,
            provideDefinition: assignment.provideDefinition,
            maxRetakes: assignment.maxRetakes,
            maxAppeals: assignment.maxAppeals,
            allowLate: assignment.allowLate,
            lateDaysLimit: assignment.lateDaysLimit,
            opensAt: assignment.opensAt?.toISOString() ?? null,
            submissionDeadline: assignment.submissionDeadline?.toISOString() ?? null,
            round1Deadline: assignment.round1Deadline?.toISOString() ?? null,
            round2Deadline: assignment.round2Deadline?.toISOString() ?? null,
            allowReaderInRound2: assignment.allowReaderInRound2,
            glossFrequency: assignment.glossFrequency,
            gradeWeights: (assignment.gradeWeights as { parsing: number; syntax: number; translation: number } | null) ?? null,
            lockdown: assignment.lockdown,
            lockdownMaxViolations: assignment.lockdownMaxViolations,
            constructConfig: assignment.constructConfig,
          }}
        />

        {assignment.type !== 'TRANSLATION_EXERCISE' && assignment.type !== 'TRANSLATION_EXAM' && assignment.type !== 'COURSE_NOTES' && assignment.type !== 'GROUP_PRESENTATION' && assignment.type !== 'CONSTRUCT_SEARCH' && (
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
        )}

      </div>
    </DashboardShell>
  )
}
