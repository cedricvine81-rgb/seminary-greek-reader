'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardTitle } from '@/components/ui/Card'
import { ChevronDown, ArrowLeft, AtSign, Check } from 'lucide-react'
import { differenceInCalendarDays } from 'date-fns'
import { MessageInstructorButton } from '@/components/student/MessageInstructorButton'
import { StudentGradebook, type GradebookRow } from '@/components/student/StudentGradebook'
import type { CategoryWeights } from '@/lib/grade-weights'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { clsx } from 'clsx'
import { courseStatus, courseTiming } from '@/lib/course-status'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { formatDateShort } from '@/lib/i18n/format'

export interface StudentCourse {
  id: string
  name: string
  startDate: string
  endDate: string
  instructorName: string
  instructorEmail: string
  assignments: { id: string; title: string; type: string; dueDate: string; weekNumber: number; completed: boolean }[]
  gradebookRows: GradebookRow[]
  gradeCategoryWeights: CategoryWeights | null
}

// i18n keys, not display text — a module constant cannot call the hook, so the lookup is
// resolved with t() where it is rendered.
const TYPE_LABEL_KEYS: Record<string, string> = {
  VOCABULARY_QUIZ: 'study.vocab', MORPHOLOGY_QUIZ: 'study.morphology',
  TRANSLATION_EXERCISE: 'study.translation', PASSAGE_VOCABULARY: 'study.passage',
}

// Types added after the label keys were translated (course notes, group presentations,
// construct searches) fall back to their own name in words rather than SHOUTING_SNAKE_CASE.
function typeName(type: string): string {
  return type.toLowerCase().split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

// Group presentations live on their own page (per-member sections + attestation); everything
// else opens the generic assignment page. Mirrors AssignmentList so both entry points agree.
function assignmentHref(a: { id: string; type: string }): string {
  return a.type === 'GROUP_PRESENTATION' ? '/student/group-presentations' : `/student/assignments/${a.id}`
}

function DueLabel({ dueDate }: { dueDate: string }) {
  const t = useT()
  const locale = useLocale()
  const days = differenceInCalendarDays(new Date(dueDate), new Date())
  if (days === 0) return <span className="text-xs text-red-500 font-semibold">{t('course.dueToday')}</span>
  if (days === 1) return <span className="text-xs text-amber-600 font-medium">{t('course.dueTomorrow')}</span>
  if (days > 1 && days <= 3) return <span className="text-xs text-amber-500 font-medium">{t('course.dueInDays', { count: days, n: days })}</span>
  return <span className="text-xs text-gray-400">{t('student.dueOn', { date: formatDateShort(dueDate, locale) })}</span>
}

export function StudentCourseCard({ course, studentName }: { course: StudentCourse; studentName: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const status = courseStatus(course.startDate, course.endDate)
  const sortedAssignments = [...course.assignments].sort((a, b) => a.weekNumber - b.weekNumber)

  function collapse() {
    setOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Card className={open ? 'space-y-4' : ''}>
      {/* Course title toggles the whole course open/closed */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{course.name}</h3>
            {/* Past and upcoming courses stay visible but are marked, so a student is
                never unsure which one is actually running. */}
            {status.status !== 'current' && (
              <span className={clsx('text-xs px-2 py-0.5 rounded-full border', status.chip)}>
                {status.label}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {course.instructorName} · {courseTiming(course.startDate, course.endDate)}
          </p>
        </div>
        <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-4">
          {/* Return to dashboard + contact actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={collapse}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={14} /> {t('course.backToDashboard')}
            </button>
            <div className="flex items-center gap-4 shrink-0">
              <MessageInstructorButton courseId={course.id} courseName={course.name} instructorName={course.instructorName} />
              {course.instructorEmail && (
                <a
                  href={`mailto:${encodeURIComponent(course.instructorEmail)}?subject=${encodeURIComponent(`[${course.name}] `)}`}
                  className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
                  title={t('course.emailTitle', { name: course.instructorName })}
                >
                  <AtSign size={14} /> {t('course.email')}
                </a>
              )}
            </div>
          </div>

          {/* ── Assignments ── */}
          <details className="border-t border-gray-100 pt-3">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <CardTitle className="mb-0">
                Assignments <span className="ml-1 text-sm font-normal text-gray-400">({sortedAssignments.length})</span>
              </CardTitle>
              <ChevronDown size={16} className="text-gray-400 shrink-0" />
            </summary>
            <div className="mt-3">
              {sortedAssignments.length === 0 ? (
                <p className="text-sm text-gray-400 italic">{t('course.noAssignments')}</p>
              ) : (
                <div className="space-y-1.5">
                  {sortedAssignments.map(a => (
                    <Link
                      key={a.id}
                      href={assignmentHref(a)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          <span className="text-gray-400 mr-1.5 text-xs">Wk {a.weekNumber}</span>{a.title}
                        </p>
                        <DueLabel dueDate={a.dueDate} />
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {a.completed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <Check size={12} /> {t('course.completed')}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{TYPE_LABEL_KEYS[a.type] ? t(TYPE_LABEL_KEYS[a.type]) : typeName(a.type)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </details>

          {/* ── Grade Book ── */}
          <details className="border-t border-gray-100 pt-3">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <CardTitle className="mb-0">{t('course.gradeBook')}</CardTitle>
              <ChevronDown size={16} className="text-gray-400 shrink-0" />
            </summary>
            <div className="mt-3">
              {course.gradebookRows.length > 0
                ? <StudentGradebook studentName={studentName} rows={course.gradebookRows} weights={course.gradeCategoryWeights} />
                : <p className="text-sm text-gray-400 italic">{t('course.noGrades')}</p>}
            </div>
          </details>

          {/* ── Schedule ── */}
          {sortedAssignments.length > 0 && (
            <details className="border-t border-gray-100 pt-3">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <CardTitle className="mb-0">{t('course.schedule')}</CardTitle>
                <ChevronDown size={16} className="text-gray-400 shrink-0" />
              </summary>
              <div className="mt-3">
                <CalendarGrid
                  events={sortedAssignments.map(a => ({
                    id: a.id,
                    title: a.title,
                    type: a.type,
                    dueDate: a.dueDate,
                    href: assignmentHref(a),
                    isCompleted: a.completed,
                  }))}
                  initialDate={sortedAssignments[0]?.dueDate}
                />
              </div>
            </details>
          )}
        </div>
      )}
    </Card>
  )
}
