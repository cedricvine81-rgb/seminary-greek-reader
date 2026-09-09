'use client'

// This file calls useT/useLocale, so the directive above is load-bearing: without it,
// a server page that imports this component gets client-reference proxies for the hooks
// and every render dies with `(0 , x.NT) is not a function` — an error that only appears
// in the production build, streamed after the 200 status, so curl checks look clean.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/Badge'
import type { Assignment } from '@/types/assignment'
import { ChevronRight, BookOpen, Dumbbell } from 'lucide-react'
import { LocalDeadline } from './LocalDeadline'
import { SelfStudyPanel } from '@/components/student/SelfStudyPanel'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { formatDate } from '@/lib/i18n/format'
import { effectiveDeadline } from '@/lib/assignment-deadline'

// Same reasoning as the dashboard's course card: the deck pulls the whole vocabulary, and most
// students never open it from here, so it stays out of the bundle until a row's button is used.
const VocabBuilder = dynamic(
  () => import('@/components/vocab/VocabBuilder').then(m => m.VocabBuilder),
  { ssr: false },
)

/** The two inline shortcuts a row can carry, derived server-side (see lib/assignment-vocab.ts). */
type ListAssignment = Assignment & {
  vocabSubsections?: string[]
  vocabLang?: 'greek' | 'hebrew'
}

interface AssignmentListProps {
  assignments: ListAssignment[]
  /** An array, not a Set — this crosses the server→client boundary from the assignments
      page, and a Set doesn't survive RSC serialization on this Next version. */
  completedIds?: string[]
  /** courseId → course name. This list mixes every enrolled course, and two courses can
      easily both have a "Week 3 Quiz" — without the course a student can open the wrong one. */
  courseNames?: Record<string, string>
}

const typeColors: Record<string, 'blue' | 'purple' | 'green'> = {
  VOCABULARY_QUIZ: 'blue',
  PASSAGE_VOCABULARY: 'blue',
  MORPHOLOGY_QUIZ: 'purple',
  TRANSLATION_EXERCISE: 'green',
  TRANSLATION_EXAM: 'green',
  COURSE_NOTES: 'blue',
  GROUP_PRESENTATION: 'purple',
  CONSTRUCT_SEARCH: 'green',
  DIAGRAM: 'purple',
  ACTIVITY_LOG: 'green',
}

// Group presentations are worked on in a dedicated collaborative page, not the generic
// single-assignment view.
const hrefFor = (a: { id: string; type: string }) =>
  a.type === 'GROUP_PRESENTATION' ? '/student/group-presentations' : `/student/assignments/${a.id}`

export function AssignmentList({ assignments, completedIds = [], courseNames = {} }: AssignmentListProps) {
  const t = useT()
  const locale = useLocale()
  const completed = new Set(completedIds)

  // The word list a row has opened beside the list, or null. Held here rather than per row so
  // opening a second row's words replaces the first instead of stacking panels.
  const [vocabPanel, setVocabPanel] = useState<{ id: string; title: string; subsections: string[]; lang: 'greek' | 'hebrew' } | null>(null)

  // "Now" is read AFTER mount, never during render. Comparing against a fresh `new Date()`
  // while rendering asks the server and the browser the same question at two different
  // instants on two different clocks, and any deadline that falls between them flips the
  // badge — a hydration mismatch on a row that looks completely static. The first client
  // render therefore matches the server exactly (nothing overdue), and the effect fills in
  // the real answer a tick later.
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    // Re-check on the minute so a deadline passing while the page is open is not missed.
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Every hook above the early return: this component renders an empty state when a group has
  // no assignments, and hooks placed after that return would be skipped on exactly those
  // renders, so a group going from empty to filled would change the hook count and throw.
  if (assignments.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <p className="text-sm text-gray-400">{t('assign.noAssignments')}</p>
        <p className="text-sm text-gray-400">
          {t('student.notPublished')}{' '}
          <Link href="/student/courses" className="text-brand-600 hover:underline">{t('assign.checkCourses')}</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {assignments.map(a => {
        const done = completed.has(a.id)
        // Judge "overdue"/"due" by the shared effective deadline: the Round 2 cut-off
        // for two-round passage exercises, the LAST weekly deadline for activity logs —
        // an activity log's dueDate is week 1's anchor, and reading it as final marked a
        // 15-week report "Overdue" from the moment week 1 passed.
        const finalDue = effectiveDeadline({
          dueDate: new Date(a.dueDate),
          round1Deadline: a.round1Deadline ? new Date(a.round1Deadline) : null,
          round2Deadline: a.round2Deadline ? new Date(a.round2Deadline) : null,
          type: a.type,
          activityConfig: (a as { activityConfig?: unknown }).activityConfig,
        }).toISOString()
        const overdue = !done && now !== null && new Date(finalDue).getTime() < now
        const vocabSubs = a.vocabSubsections ?? []
        const hasShortcuts = vocabSubs.length > 0 || a.type === 'MORPHOLOGY_QUIZ'
        return (
          // The row's link wraps only the row itself: the shortcut pills below are links and
          // buttons of their own, and nesting them inside this one would both be invalid HTML
          // and hand every pill click to the assignment page instead.
          <div
            key={a.id}
            className="rounded-xl border border-gray-100 bg-surface hover:border-brand-200 hover:shadow-sm transition-all group"
          >
          <Link
            href={hrefFor(a)}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={typeColors[a.type] ?? 'gray'}>{t(`assign.typeShort.${a.type}`)}</Badge>
                {courseNames[a.courseId] && (
                  <span className="text-xs font-medium text-gray-500">{courseNames[a.courseId]}</span>
                )}
                <span className="text-xs text-gray-400">{t('student.weekN', { n: a.weekNumber })} · {t('student.dueOn', { date: formatDate(finalDue, locale) })}</span>
              </div>
              {(a.round1Deadline || a.round2Deadline) && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {a.round1Deadline && <LocalDeadline label={t('assign.round1Closes')} iso={a.round1Deadline} />}
                  {a.round2Deadline && <LocalDeadline label={t('assign.round2Closes')} iso={a.round2Deadline} />}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {done ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  {t('student.done')}
                </span>
              ) : overdue ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white">
                  {t('student.overdueSubmit')}
                  <ChevronRight size={13} />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-700 text-white group-hover:bg-brand-800 transition-colors">
                  {t('student.start')}
                  <ChevronRight size={13} />
                </span>
              )}
            </div>
          </Link>
          {/* Inline shortcuts, matching the dashboard course card exactly — the week's own word
              list, and formative practice for a parsing quiz. This list is the other place a
              student picks what to do next, so it offers the same two things. */}
          {hasShortcuts && (
            <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
              {vocabSubs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setVocabPanel({ id: a.id, title: a.title, subsections: vocabSubs, lang: a.vocabLang ?? 'greek' })}
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border border-brand-200 text-brand-700 hover:bg-brand-50 transition-colors"
                >
                  <BookOpen size={12} /> {t('course.viewVocab')}
                </button>
              )}
              {a.type === 'MORPHOLOGY_QUIZ' && (
                <Link
                  href={`/student/assignments/${a.id}/practice`}
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border border-brand-200 text-brand-700 hover:bg-brand-50 transition-colors"
                >
                  <Dumbbell size={12} /> {t('course.practise')}
                </Link>
              )}
            </div>
          )}
          </div>
        )
      })}
      {vocabPanel && (
        <SelfStudyPanel
          key={vocabPanel.id}
          title={t('course.vocabFor', { title: vocabPanel.title })}
          subtitle={vocabPanel.subsections.map(s => `§${s}`).join(', ')}
          fullHref="/vocab"
          fullLabel={t('ss.fullPage')}
          closeLabel={t('action.close')}
          resizeLabel={t('ss.resizePanel')}
          onClose={() => setVocabPanel(null)}
        >
          {/* Pinned to the quiz's own language, as on the course card: a toggle here would let
              a Hebrew quiz's word list wander into the Greek deck. */}
          <VocabBuilder lang={vocabPanel.lang} initialSubsections={vocabPanel.subsections} />
        </SelfStudyPanel>
      )}
    </div>
  )
}
