import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ExegesisWorkspace } from '@/components/student/ExegesisWorkspace'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'

export const metadata: Metadata = { title: 'Exegesis Workspace' }

export default async function ExegesisPage(
  props: {
    searchParams: Promise<{ assignmentId?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const token = await getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!await canViewStudentPages(payload)) redirect('/auth/sign-in')

  return (
    <DashboardShell role="STUDENT" pageTitle="Exegesis Workspace">
      <div className="flex flex-col h-full print:h-auto overflow-hidden print:overflow-visible">
        <ExegesisWorkspace assignmentId={searchParams.assignmentId} />
      </div>
    </DashboardShell>
  )
}
