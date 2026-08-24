import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PracticeMorphQuiz } from '@/components/student/PracticeMorphQuiz'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { selfStudyTrack } from '@/lib/self-study'
import { morphQuizFor } from '@/lib/self-study-morph'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Parsing Quiz' }

// A self-study lesson's morphology (parsing) practice quiz — the deep-link/full-page twin
// of the track page's embedded panel. Questions come from /api/self-study/morph.
export default function SelfStudyMorphQuizPage({ params }: { params: { track: string; n: string } }) {
  const t = getServerT()
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const def = selfStudyTrack(params.track)
  const lessonNo = Number(params.n)
  if (!def || !Number.isInteger(lessonNo) || !morphQuizFor(def.id, lessonNo)) notFound()

  return (
    <DashboardShell role="STUDENT" pageTitle={t(def.levelKey)}>
      <PracticeMorphQuiz trackId={def.id} lessonNo={lessonNo} />
    </DashboardShell>
  )
}
