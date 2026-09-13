import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PracticeMorphQuiz } from '@/components/student/PracticeMorphQuiz'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canUseSelfStudy, selfStudyShellRole, studentPageEntry } from '@/lib/preview'
import { safeInternalPath } from '@/lib/safe-path'
import { selfStudyTrack } from '@/lib/self-study'
import { morphQuizFor } from '@/lib/self-study-morph'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Parsing Quiz' }

// A self-study lesson's morphology (parsing) practice quiz — the deep-link/full-page twin
// of the track page's embedded panel. Questions come from /api/self-study/morph.
//
// ?practice=1 runs the same quiz FORMATIVELY: identical questions, nothing recorded, and an
// end-of-session report naming what to work on with links into the grammar. It is the same
// recipe as the graded attempt, which is the point — students asked to rehearse the real thing.
export default async function SelfStudyMorphQuizPage(
  props: {
    params: Promise<{ track: string; n: string }>
    searchParams?: Promise<{ practice?: string; back?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const t = await getServerT()
  const token = await getTokenFromCookies()
  const payload = token ? verifyToken(token) : null

  // ?back= lets a drill opened from a grammar chapter return there instead of to a self-study
  // track the student may not be following. Same-site paths only, and checked by resolving
  // rather than by pattern: it is rendered as a link, and "/\evil.example" would otherwise be
  // an off-site jump wearing our chrome (see safeInternalPath).
  const back = safeInternalPath(searchParams?.back)
  const backTo = back ? { href: back, labelKey: 'ss.pr.backToChapter' } : undefined

  // An instructor arriving from a Grammar chapter's "Practise these forms" is signed in but
  // not in preview mode; send them through it and back, not to a sign-in screen.
  if (!canUseSelfStudy(payload)) {
    redirect(studentPageEntry(payload,
      `/student/self-study/${params.track}/morph/${params.n}?practice=1`
      + (backTo ? `&back=${encodeURIComponent(backTo.href)}` : '')))
  }
  if (!payload) redirect('/auth/sign-in')

  const def = selfStudyTrack(params.track)
  const lessonNo = Number(params.n)
  if (!def || !Number.isInteger(lessonNo) || !morphQuizFor(def.id, lessonNo)) notFound()

  return (
    <DashboardShell role={await selfStudyShellRole(payload)} pageTitle={t(def.levelKey)}>
      <PracticeMorphQuiz
        trackId={def.id}
        lessonNo={lessonNo}
        practice={searchParams?.practice === '1'}
        backTo={backTo}
      />
    </DashboardShell>
  )
}
