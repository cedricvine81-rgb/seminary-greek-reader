import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { SelfStudyCards } from '@/components/student/SelfStudyCards'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Self-study' }

// The four self-study tracks on a page of their own, so the sidebar has somewhere to point.
// They also still appear on the dashboard itself (SelfStudyCards is the same component in
// both places) — the sidebar entry is about being FINDABLE, not about moving them.
export default function SelfStudyIndexPage() {
  const t = getServerT()
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  return (
    <DashboardShell role="STUDENT" pageTitle={t('ss.title')}>
      <div className="max-w-3xl">
        <SelfStudyCards heading={false} />
      </div>
    </DashboardShell>
  )
}
