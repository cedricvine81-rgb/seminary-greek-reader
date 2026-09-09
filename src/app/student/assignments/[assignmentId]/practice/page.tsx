import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PracticeMorphQuiz } from '@/components/student/PracticeMorphQuiz'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages, studentPageEntry } from '@/lib/preview'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Practice' }

// FORMATIVE practice for a morphology quiz the student has been set. Same recipe as the graded
// quiz, different forms, nothing recorded — the graded attempt still lives on the assignment
// page and is untouched by anything here.
//
// It is a page of its own rather than a panel on the assignment because practice and the real
// attempt should never share a screen: a student mid-quiz must not be one mis-click from a
// session that looks the same but does not count.
export default async function AssignmentPracticePage({ params }: { params: { assignmentId: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) {
    redirect(studentPageEntry(payload, `/student/assignments/${params.assignmentId}/practice`))
  }
  if (!payload) redirect('/auth/sign-in')

  // Only the existence and type are checked here; the API route does the enrollment check,
  // and it has to, since it is the thing that returns the questions.
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    select: { title: true, type: true },
  })
  if (!assignment || assignment.type !== 'MORPHOLOGY_QUIZ') notFound()

  return (
    <DashboardShell role="STUDENT" pageTitle={assignment.title}>
      <PracticeMorphQuiz assignmentId={params.assignmentId} />
    </DashboardShell>
  )
}
