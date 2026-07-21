import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AssignmentResultsGrid } from '@/components/instructor/AssignmentResultsGrid'
import { CourseNotesGrader } from '@/components/instructor/CourseNotesGrader'
import { GroupPresentationGrader } from '@/components/instructor/GroupPresentationGrader'
import { GrammarHomeworkGrader } from '@/components/instructor/GrammarHomeworkGrader'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Grade Assignment' }

export default async function GradeAssignmentPage({ params }: { params: { assignmentId: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    select: { id: true, title: true, type: true, weekNumber: true, isPublished: true, courseId: true, reference: true, course: { select: { id: true, name: true } }, questions: { orderBy: { position: 'asc' }, take: 1, select: { options: true } } },
  })
  if (!assignment || !await isAuthorizedForAssignment(params.assignmentId, payload.sub)) notFound()

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle={`Grade: ${assignment.title}`}>
      <div className="space-y-4">
        <Link
          href={`/instructor/courses/${assignment.courseId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={14} /> Back to {assignment.course?.name ?? 'course'}
        </Link>

        <div className="flex gap-2 flex-wrap items-center">
          <Badge variant="gray">Week {assignment.weekNumber}</Badge>
          {assignment.reference && <Badge variant="blue">{assignment.reference}</Badge>}
          <Badge variant={assignment.isPublished ? 'green' : 'gray'}>
            {assignment.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>

        {assignment.type === 'COURSE_NOTES'
          ? <CourseNotesGrader assignmentId={assignment.id} />
          : assignment.type === 'GROUP_PRESENTATION'
            ? <GroupPresentationGrader assignmentId={assignment.id} />
            : (assignment.questions[0]?.options[0] ?? '').includes('"hw":1')
              ? <GrammarHomeworkGrader assignmentId={assignment.id} />
              : <AssignmentResultsGrid assignmentId={assignment.id} autoLoad />}
      </div>
    </DashboardShell>
  )
}
