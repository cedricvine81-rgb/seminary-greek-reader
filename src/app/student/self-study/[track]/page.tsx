import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { SelfStudyTrackView } from '@/components/student/SelfStudyTrackView'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { selfStudyTrack } from '@/lib/self-study'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Self-study' }

// One self-study track (Beginning/Intermediate Greek or Hebrew): the instructor-free
// pathway through the grammar chapters and vocabulary sets, with self-marked progress.
export default function SelfStudyTrackPage({ params }: { params: { track: string } }) {
  const t = getServerT()
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const def = selfStudyTrack(params.track)
  if (!def) notFound()

  return (
    <DashboardShell role="STUDENT" pageTitle={t(def.levelKey)}>
      <SelfStudyTrackView trackId={def.id} />
    </DashboardShell>
  )
}
