import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Appeals' }

/**
 * The student's own view of every vocab answer they have appealed.
 *
 * Until this page existed the outcome was invisible: a student marked an answer for appeal,
 * it was submitted, and it vanished. Since the instructor tier is what moves the grade, they
 * could not tell whether a changed score came from their appeal or from something else.
 *
 * Scoped by `studentId: payload.sub`, so a student only ever sees their own appeals. Only the
 * instructor tier is shown as the decision — that is the one that governs the grade. The admin
 * tier is editorial (whether the answer joins the shared lexicon) and is surfaced only as a
 * quiet footnote when it succeeded, never as a second verdict on the student's work.
 */
export default async function StudentAppealsPage() {
  const t = getServerT()
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const appeals = await prisma.vocabAppeal.findMany({
    where: { studentId: payload.sub },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      studentAnswer: true,
      instructorDecision: true,
      instructorDecidedAt: true,
      instructorNote: true,
      adminDecision: true,
      createdAt: true,
      assignment: { select: { title: true, course: { select: { name: true } } } },
      question: { select: { prompt: true, correctAnswer: true } },
    },
  })

  const badge = (d: string) =>
    d === 'ACCEPTED' ? { cls: 'bg-green-50 text-green-700 border-green-200', label: t('appeals.my.accepted') }
    : d === 'REJECTED' ? { cls: 'bg-red-50 text-red-700 border-red-200', label: t('appeals.my.rejected') }
    : { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: t('appeals.my.pending') }

  const fmt = (d: Date | null) =>
    d ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null

  return (
    <DashboardShell role="STUDENT" pageTitle="Appeals" pageDescription={t('appeals.my.lead')}>
      {appeals.length === 0 ? (
        <p className="text-sm text-gray-500">{t('appeals.my.empty')}</p>
      ) : (
        <ul className="space-y-4 max-w-3xl">
          {appeals.map(a => {
            const b = badge(a.instructorDecision)
            const decided = fmt(a.instructorDecidedAt)
            return (
              <li key={a.id} className="bg-surface border border-gray-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      {[a.assignment.course?.name, a.assignment.title].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-base font-medium text-gray-900 mt-0.5 greek-text">{a.question.prompt}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${b.cls}`}>
                    {b.label}
                  </span>
                </div>

                <dl className="text-sm space-y-1">
                  <div className="flex gap-2">
                    <dt className="text-gray-500 shrink-0">{t('appeals.my.yourAnswer')}</dt>
                    <dd className="text-gray-900">{a.studentAnswer}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-gray-500 shrink-0">{t('appeals.my.expectedAnswer')}</dt>
                    <dd className="text-gray-900">{a.question.correctAnswer}</dd>
                  </div>
                </dl>

                {/* Only shown when the instructor actually wrote one. */}
                {a.instructorNote && (
                  <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-gray-500">{t('appeals.my.note')} </span>{a.instructorNote}
                  </p>
                )}

                {/* Editorial tier, and only the good news: the answer is now accepted for everyone.
                    A NOT_APPLICABLE/REJECTED admin decision says nothing about this student's grade. */}
                {a.instructorDecision === 'ACCEPTED' && a.adminDecision === 'ACCEPTED' && (
                  <p className="text-xs text-gray-500">{t('appeals.my.lexicon')}</p>
                )}

                <p className="text-xs text-gray-400">
                  {decided ? `${t('appeals.my.decidedOn')} ${decided}` : `${t('appeals.my.submittedOn')} ${fmt(a.createdAt)}`}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </DashboardShell>
  )
}
