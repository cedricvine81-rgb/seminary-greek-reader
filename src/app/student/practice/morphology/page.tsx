import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CustomMorphBuilder } from '@/components/student/CustomMorphBuilder'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages, studentPageEntry } from '@/lib/preview'
import { getServerTrack } from '@/lib/track-server'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Build a Drill' }

// Tier 3 of the practice work: the student describes the drill themselves — part of speech,
// what they will be asked, which forms to draw from — and sees how many forms match before
// they start. Formative, like every other practice surface: nothing is recorded.
export default function CustomPracticePage() {
  const t = getServerT()
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) {
    redirect(studentPageEntry(payload, '/student/practice/morphology'))
  }

  // Opens on the track's own language; the builder can switch, since a Hebrew student
  // revising Greek is one click away everywhere else in the app too.
  return (
    <DashboardShell role="STUDENT" pageTitle={t('pr.b.title')}>
      <CustomMorphBuilder defaultLang={getServerTrack() === 'hebrew' ? 'hebrew' : 'greek'} />
    </DashboardShell>
  )
}
