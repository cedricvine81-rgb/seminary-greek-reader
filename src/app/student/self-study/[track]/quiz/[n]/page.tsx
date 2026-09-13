import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PracticeVocabQuiz } from '@/components/student/PracticeVocabQuiz'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canUseSelfStudy, selfStudyShellRole } from '@/lib/preview'
import { selfStudyTrack, quizStepFor } from '@/lib/self-study'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Practice Quiz' }

// A self-study lesson's practice quiz: auto-graded multiple choice over the lesson's
// vocabulary words. Passing (≥80%) completes the lesson's quiz step — the self-grading
// the self-study feedback asked for, with no instructor anywhere in the loop.
export default async function SelfStudyQuizPage(props: { params: Promise<{ track: string; n: string }> }) {
  const params = await props.params;
  const t = await getServerT()
  const token = await getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canUseSelfStudy(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const def = selfStudyTrack(params.track)
  const lessonNo = Number(params.n)
  const step = def && Number.isInteger(lessonNo) ? quizStepFor(def, lessonNo) : null
  if (!def || !step?.quiz) notFound()

  return (
    <DashboardShell role={await selfStudyShellRole(payload)} pageTitle={t(def.levelKey)}>
      <PracticeVocabQuiz trackId={def.id} lessonNo={lessonNo} />
    </DashboardShell>
  )
}
