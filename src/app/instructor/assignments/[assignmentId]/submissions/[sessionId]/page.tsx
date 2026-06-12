import { DashboardShell } from '@/components/layout/DashboardShell'
import { SubmissionViewer } from '@/components/instructor/SubmissionViewer'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ assignmentId: string; sessionId: string }>
}

export default async function SubmissionViewerPage({ params }: PageProps) {
  const { assignmentId, sessionId } = await params

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Submission">
      <SubmissionViewer
        assignmentId={assignmentId}
        sessionId={sessionId}
        onBack={`/instructor/assignments/${assignmentId}/grade`}
      />
    </DashboardShell>
  )
}
