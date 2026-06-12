import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Conversations } from '@/components/messaging/Conversations'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Messages' }

export default async function InstructorMessagesPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Messages" pageDescription="Conversations with your students. Replies from students appear here.">
      <Conversations meId={payload.sub} />
    </DashboardShell>
  )
}
