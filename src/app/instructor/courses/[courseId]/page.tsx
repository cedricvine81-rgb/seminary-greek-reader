import { redirect, notFound } from 'next/navigation'
import { AssignmentSeriesEditor } from '@/components/instructor/AssignmentSeriesEditor'
import { groupIntoSeries } from '@/lib/assignment-series'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Fragment } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CourseGradebook } from '@/components/instructor/CourseGradebook'
import { MessageClassPanel } from '@/components/instructor/MessageClassPanel'
import { CourseGroupsPanel } from '@/components/instructor/CourseGroupsPanel'
import { EmailClassButton } from '@/components/instructor/EmailClassButton'
import { StudentProgressTable } from '@/components/instructor/StudentProgressTable'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCourseReport } from '@/lib/reports'
import {
  ArrowLeft, Plus, Copy, Settings,
  ChevronDown,
} from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'Course' }

const typeLabel: Record<string, string> = {
  VOCABULARY_QUIZ: 'Vocab',
  MORPHOLOGY_QUIZ: 'Morph',
  TRANSLATION_EXERCISE: 'Translation',
  PASSAGE_VOCABULARY: 'Passage Vocab',
  COURSE_NOTES: 'Course Notes',
  GROUP_PRESENTATION: 'Group Pres.',
}
const typeVariant: Record<string, 'blue' | 'purple' | 'green' | 'gray'> = {
  VOCABULARY_QUIZ: 'blue',
  MORPHOLOGY_QUIZ: 'purple',
  TRANSLATION_EXERCISE: 'green',
  PASSAGE_VOCABULARY: 'gray',
  COURSE_NOTES: 'blue',
  GROUP_PRESENTATION: 'purple',
}

export default async function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const course = await prisma.course.findFirst({
    where: {
      id: params.courseId,
      OR: [
        { instructorId: payload.sub },
        { coInstructors: { some: { userId: payload.sub } } },
      ],
    },
    include: {
      assignments: {
        orderBy: [{ weekNumber: 'asc' }, { dueDate: 'asc' }],
        include: { _count: { select: { questions: true } } },
      },
      enrollments: {
        where: { status: 'APPROVED' },
        include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!course) notFound()

  const assignmentSeries = groupIntoSeries(course.assignments.map(a => ({
    id: a.id, title: a.title, type: a.type as string, weekNumber: a.weekNumber,
    dueDate: a.dueDate, isPublished: a.isPublished, questionCount: a._count.questions,
    vocabReviewPct: a.vocabReviewPct, vocabFillPct: a.vocabFillPct, vocabThruLesson: a.vocabThruLesson,
    maxRetakes: a.maxRetakes,
    timePerQuestion: a.timePerQuestion, allowLate: a.allowLate, lateDaysLimit: a.lateDaysLimit,
  })))

  const students = course.enrollments.map(e => ({
    id: e.user.id,
    name: [e.user.firstName, e.user.surname].filter(Boolean).join(' ') || 'Student',
    email: e.user.email,
  }))

  const report = await getCourseReport(params.courseId)

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle={course.name}>
      <div className="space-y-6">

        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <Link
              href="/instructor"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={14} /> Back to dashboard
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400">
                {format(course.startDate, 'MMM d, yyyy')} – {format(course.endDate, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <MessageClassPanel courseId={course.id} students={students} />
            <CourseGroupsPanel
              courseId={course.id}
              students={students}
              presentations={course.assignments.filter(a => a.type === 'GROUP_PRESENTATION').map(a => ({ id: a.id, title: a.title }))}
            />
            <EmailClassButton courseName={course.name} students={students} />
            <Link href={`/instructor/courses/${course.id}/edit`}>
              <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
                <Settings size={14} /> Edit Course
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Assignments ── */}
        <Card>
          <details open>
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <CardTitle>
                Assignments
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({course.assignments.length})
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Link href={`/instructor/assignments/new?courseId=${course.id}`}>
                  <Button size="sm" variant="secondary">
                    <Plus size={13} /> Create
                  </Button>
                </Link>
                <Link href={`/instructor/assignments/use-existing?courseId=${course.id}`}>
                  <Button size="sm" variant="secondary">
                    <Copy size={13} /> Use Existing
                  </Button>
                </Link>
                <ChevronDown size={16} className="text-gray-400 shrink-0" />
              </div>
            </summary>

            <div className="mt-4 space-y-5">
              {/* One control for a whole run — the semester builder creates a row per
                  date, so a 28-quiz schedule is otherwise 28 separate edits. */}
              {assignmentSeries.length > 0 && (
                <AssignmentSeriesEditor
                  series={assignmentSeries}
                  courseEnd={course.endDate.toISOString()}
                />
              )}
              {course.assignments.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  No assignments yet. Create one to get started.
                </p>
              ) : (
                <Fragment>
                {/* ── Desktop / tablet: aligned grid (md and up) ── */}
                <div className="hidden md:block">
                  {/* Header row */}
                  <div className="grid items-center gap-x-3 px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400"
                    style={{ gridTemplateColumns: '2.5rem 5rem 1fr 5.5rem 2rem 5.5rem 4.5rem 4.5rem' }}>
                    <span>Wk</span>
                    <span>Due</span>
                    <span>Title</span>
                    <span>Type</span>
                    <span></span>
                    <span>Status</span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {course.assignments.map(a => (
                      <div
                        key={a.id}
                        className="grid items-center gap-x-3 px-1 py-2.5 text-sm hover:bg-gray-50 rounded-lg"
                        style={{ gridTemplateColumns: '2.5rem 5rem 1fr 5.5rem 2rem 5.5rem 4.5rem 4.5rem' }}
                      >
                        <span className="text-gray-400 text-xs">Wk {a.weekNumber}</span>
                        <span className="text-gray-400 text-xs whitespace-nowrap">
                          {format(new Date(a.dueDate), 'MMM d')}
                        </span>
                        <Link
                          href={`/instructor/assignments/${a.id}`}
                          className="font-medium text-gray-800 hover:text-brand-700 truncate"
                        >
                          {a.title}
                        </Link>
                        <Badge variant={typeVariant[a.type] ?? 'gray'}>
                          {typeLabel[a.type] ?? a.type}
                        </Badge>
                        <span className="text-gray-300 text-xs text-right">
                          {a._count.questions > 0 ? `${a._count.questions}q` : ''}
                        </span>
                        <Badge variant={a.isPublished ? 'green' : 'gray'}>
                          {a.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        {/* Grade column — reserved width; blank for non-gradeable types */}
                        <div>
                          {(a.type === 'TRANSLATION_EXERCISE' || a.type === 'TRANSLATION_EXAM' || a.type === 'COURSE_NOTES' || a.type === 'GROUP_PRESENTATION') && (
                            <Link href={`/instructor/assignments/${a.id}/grade`}>
                              <Button size="sm" variant="primary" className="w-full">Grade</Button>
                            </Link>
                          )}
                        </div>
                        <Link href={`/instructor/assignments/${a.id}`}>
                          <Button size="sm" variant="secondary" className="w-full">Edit</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Mobile: stacked cards (below md) ── */}
                <div className="md:hidden divide-y divide-gray-100">
                  {course.assignments.map(a => (
                    <div key={a.id} className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/instructor/assignments/${a.id}`}
                          className="font-medium text-gray-800 hover:text-brand-700 text-sm flex-1 min-w-0"
                        >
                          {a.title}
                        </Link>
                        <Badge variant={a.isPublished ? 'green' : 'gray'} className="shrink-0">
                          {a.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-gray-400">
                        <Badge variant={typeVariant[a.type] ?? 'gray'}>
                          {typeLabel[a.type] ?? a.type}
                        </Badge>
                        <span>Wk {a.weekNumber}</span>
                        <span>· Due {format(new Date(a.dueDate), 'MMM d')}</span>
                        {a._count.questions > 0 && <span>· {a._count.questions}q</span>}
                      </div>
                      <div className="flex gap-2 mt-2.5">
                        {(a.type === 'TRANSLATION_EXERCISE' || a.type === 'TRANSLATION_EXAM' || a.type === 'COURSE_NOTES' || a.type === 'GROUP_PRESENTATION') && (
                          <Link href={`/instructor/assignments/${a.id}/grade`} className="flex-1">
                            <Button size="sm" variant="primary" className="w-full">Grade</Button>
                          </Link>
                        )}
                        <Link href={`/instructor/assignments/${a.id}`} className="flex-1">
                          <Button size="sm" variant="secondary" className="w-full">Edit</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                </Fragment>
              )}
            </div>
          </details>
        </Card>

        {/* ── Grade Book ── */}
        <Card>
          <details>
            <summary className="flex items-center justify-between cursor-pointer list-none mb-0">
              <CardTitle>Grade Book</CardTitle>
              <ChevronDown size={16} className="text-gray-400" />
            </summary>
            <div className="mt-4">
              <CourseGradebook courseId={course.id} />
            </div>
          </details>
        </Card>

        {/* ── Students ── */}
        {(report?.studentStats?.length ?? 0) > 0 && (
          <Card>
            <details>
              <summary className="flex items-center justify-between cursor-pointer list-none mb-0">
                <CardTitle>
                  Students
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({report!.studentStats.length})
                  </span>
                </CardTitle>
                <ChevronDown size={16} className="text-gray-400" />
              </summary>
              <div className="mt-4">
                <StudentProgressTable students={report!.studentStats} />
              </div>
            </details>
          </Card>
        )}

        {/* ── Schedule ── */}
        {course.assignments.length > 0 && (
          <Card>
            <details>
              <summary className="flex items-center justify-between cursor-pointer list-none mb-0">
                <CardTitle>Schedule</CardTitle>
                <ChevronDown size={16} className="text-gray-400" />
              </summary>
              <div className="mt-4">
                <CalendarGrid
                  events={course.assignments.map(a => ({
                    id: a.id,
                    title: a.title,
                    type: a.type,
                    dueDate: a.dueDate.toISOString(),
                    href: `/instructor/assignments/${a.id}`,
                    isPublished: a.isPublished,
                  }))}
                  initialDate={course.assignments[0]?.dueDate.toISOString()}
                />
              </div>
            </details>
          </Card>
        )}

      </div>
    </DashboardShell>
  )
}
