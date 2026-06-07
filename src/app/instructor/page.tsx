import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'
import { BookOpen, Users, ClipboardList, Plus, Copy, FileText, Eye, ChevronRight, ChevronDown } from 'lucide-react'
import { EnrollmentRequests } from '@/components/instructor/EnrollmentRequests'
import { ArchiveCourseButton } from '@/components/instructor/ArchiveCourseButton'
import { CourseHeaderActions } from '@/components/instructor/CourseHeaderActions'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'

export const metadata: Metadata = { title: 'Instructor Dashboard' }

const typeLabel: Record<string, string> = {
  VOCABULARY_QUIZ: 'Vocab', MORPHOLOGY_QUIZ: 'Morph', TRANSLATION_EXERCISE: 'Translation',
}
const typeVariant: Record<string, 'blue' | 'purple' | 'green'> = {
  VOCABULARY_QUIZ: 'blue', MORPHOLOGY_QUIZ: 'purple', TRANSLATION_EXERCISE: 'green',
}

const GRADEBOOK_GROUPS = [
  { type: 'VOCABULARY_QUIZ',      label: 'Vocabulary Quizzes' },
  { type: 'MORPHOLOGY_QUIZ',      label: 'Morphology Quizzes' },
  { type: 'TRANSLATION_EXERCISE', label: 'Translation Exercises' },
] as const

function extractSection(instructions: string | null): string | null {
  if (!instructions) return null
  const m = instructions.match(/Section\s+([\w\-:]+)/i)
  return m ? `Section ${m[1].replace('-', ':')}` : null
}

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 }

function parseSectionKey(instructions: string | null): [number, string] {
  const s = extractSection(instructions)
  if (!s) return [Infinity, '']
  // Match either Arabic (1, 2) or Roman (I, II, III) numerals followed by optional subsection letter
  const m = s.match(/Section\s+([IVXLCDM]+|\d+)[:\-]?([A-Za-z]?)/i)
  if (!m) return [Infinity, '']
  const num = ROMAN[m[1].toUpperCase()] ?? parseInt(m[1], 10)
  return [isNaN(num) ? Infinity : num, (m[2] ?? '').toUpperCase()]
}

function sortedAssignments<T extends { type: string; instructions: string | null; weekNumber: number; dueDate: Date }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    if (a.type === 'VOCABULARY_QUIZ' && b.type === 'VOCABULARY_QUIZ') {
      const [an, al] = parseSectionKey(a.instructions)
      const [bn, bl] = parseSectionKey(b.instructions)
      if (an !== bn) return an - bn
      return al.localeCompare(bl)
    }
    if (a.type === b.type) return a.weekNumber - b.weekNumber || a.dueDate.getTime() - b.dueDate.getTime()
    return 0
  })
}

function avg(nums: (number | null)[]): number | null {
  const vals = nums.filter((n): n is number => n !== null)
  return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
}

function PctCell({ pct, muted = false }: { pct: number | null; muted?: boolean }) {
  if (pct === null) return <td className="px-2 py-2 text-center text-gray-200 text-xs">—</td>
  const colour = pct >= 90 ? 'text-green-700 bg-green-50' : pct >= 70 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
  return (
    <td className={`px-2 py-2 text-center ${muted ? 'bg-gray-50' : ''}`}>
      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${colour}`}>{pct}%</span>
    </td>
  )
}

export default async function InstructorPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const [rawCourses, archivedCount, user] = await Promise.all([
    prisma.course.findMany({
      where: {
        isArchived: false,
        OR: [
          { instructorId: payload.sub },
          { coInstructors: { some: { userId: payload.sub } } },
        ],
      },
      orderBy: { startDate: 'asc' },
    }),
    prisma.course.count({
      where: {
        isArchived: true,
        OR: [
          { instructorId: payload.sub },
          { coInstructors: { some: { userId: payload.sub } } },
        ],
      },
    }),
    prisma.user.findUnique({
      where: { id: payload.sub },
      select: { firstName: true, surname: true },
    }),
  ])

  const courseIds = rawCourses.map(c => c.id)

  const [assignments, enrollments, pendingEnrollments] = await Promise.all([
    prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      select: {
        id: true, title: true, type: true, weekNumber: true,
        dueDate: true, instructions: true, isPublished: true,
        courseId: true,
        _count: { select: { questions: true } },
        questions: { select: { points: true } },
      },
      orderBy: [{ weekNumber: 'asc' }, { dueDate: 'asc' }],
    }),
    prisma.enrollment.findMany({
      where: { courseId: { in: courseIds }, status: 'APPROVED' },
      select: {
        courseId: true,
        user: { select: { id: true, firstName: true, surname: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.enrollment.findMany({
      where: { courseId: { in: courseIds }, status: 'PENDING' },
      select: {
        id: true,
        createdAt: true,
        user: { select: { firstName: true, surname: true, email: true } },
        course: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const allAssignmentIds = assignments.map(a => a.id)
  const translationIds = assignments.filter(a => a.type === 'TRANSLATION_EXERCISE').map(a => a.id)

  const [bestAttempts, responses] = await Promise.all([
    allAssignmentIds.length > 0
      ? prisma.quizAttempt.findMany({
          where: { assignmentId: { in: allAssignmentIds }, isBest: true },
          select: { userId: true, assignmentId: true, percentage: true },
        })
      : Promise.resolve([]),
    translationIds.length > 0
      ? prisma.response.findMany({
          where: { assignmentId: { in: translationIds }, questionId: { not: null } },
          select: { userId: true, assignmentId: true, score: true },
        })
      : Promise.resolve([]),
  ])

  const assignmentsByCourse = courseIds.reduce<Record<string, typeof assignments>>((acc, id) => {
    acc[id] = assignments.filter(a => a.courseId === id)
    return acc
  }, {})
  const enrollmentsByCourse = courseIds.reduce<Record<string, typeof enrollments>>((acc, id) => {
    acc[id] = enrollments.filter(e => e.courseId === id)
    return acc
  }, {})

  function getScore(userId: string, assignment: typeof assignments[0]): number | null {
    if (assignment.type === 'TRANSLATION_EXERCISE') {
      const rs = responses.filter(r => r.userId === userId && r.assignmentId === assignment.id)
      if (rs.length === 0) return null
      const totalPts = assignment.questions.reduce((s, q) => s + q.points, 0)
      if (totalPts === 0) return null
      return Math.round((rs.reduce((s, r) => s + (r.score ?? 0), 0) / totalPts) * 100)
    }
    const attempt = bestAttempts.find(a => a.userId === userId && a.assignmentId === assignment.id)
    return attempt?.percentage ?? null
  }

  const instructorName = user ? `${user.firstName} ${user.surname}`.trim() : 'Instructor'

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Dashboard" pendingCount={pendingEnrollments.length}>
      <div className="space-y-8">

        <EnrollmentRequests pending={pendingEnrollments.map(e => ({ ...e, createdAt: e.createdAt.toISOString() }))} />

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Welcome back, {instructorName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Here's a full view of your courses and student grades.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Courses', value: rawCourses.length, icon: <BookOpen size={18} />, color: 'text-blue-600 bg-blue-50', href: '/instructor' },
              { label: 'Unique Students', value: new Set(enrollments.map(e => e.user.id)).size, icon: <Users size={18} />, color: 'text-green-600 bg-green-50', href: '/instructor' },
              { label: 'Assignments', value: assignments.length, icon: <ClipboardList size={18} />, color: 'text-purple-600 bg-purple-50', href: '/instructor/assignments' },
            ].map(s => (
              <Link key={s.label} href={s.href}>
                <Card hover className="flex items-center gap-3 p-4">
                  <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/instructor/courses/new">
              <Button size="sm" variant="primary" className="flex items-center gap-1.5"><Plus size={14} />New Course</Button>
            </Link>
            <Link href="/instructor/assignments/new">
              <Button size="sm" variant="secondary" className="flex items-center gap-1.5"><ClipboardList size={14} />New Assignment</Button>
            </Link>
            <Link href="/instructor/assignments/use-existing">
              <Button size="sm" variant="secondary" className="flex items-center gap-1.5"><Copy size={14} />Use Existing</Button>
            </Link>
            <Link href="/instructor/materials/new">
              <Button size="sm" variant="secondary" className="flex items-center gap-1.5"><FileText size={14} />Upload Material</Button>
            </Link>
            <a href="/api/preview?mode=enter">
              <Button size="sm" variant="ghost" className="flex items-center gap-1.5 text-amber-700 hover:bg-amber-50"><Eye size={14} />Preview Student View</Button>
            </a>
            {archivedCount > 0 && (
              <Link href="/instructor/archive">
                <Button size="sm" variant="ghost" className="flex items-center gap-1.5 text-gray-500 hover:bg-gray-100">
                  <span>📦</span> Archive ({archivedCount})
                </Button>
              </Link>
            )}
          </div>
        </div>

        {rawCourses.length === 0 && (
          <Card>
            <p className="text-sm text-gray-400 italic text-center py-6">No courses yet. Create your first course to get started.</p>
          </Card>
        )}

        {rawCourses.map(course => {
          const courseAssignments = assignmentsByCourse[course.id] ?? []
          const courseEnrollments = enrollmentsByCourse[course.id] ?? []
          const students = courseEnrollments.map(e => e.user)

          const activeGroups = GRADEBOOK_GROUPS.map(({ type, label }) => ({
            type, label,
            cols: courseAssignments.filter(a => a.type === type),
          })).filter(g => g.cols.length > 0)

          return (
            <details key={course.id} className="group">
              <summary className="list-none cursor-pointer">
                <div className="flex items-center flex-wrap gap-3 py-1">
                  <CourseHeaderActions
                    courseId={course.id}
                    courseName={course.name}
                    studentCount={courseEnrollments.length}
                    isArchived={course.isArchived}
                  />
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 border border-brand-200 hover:bg-brand-50 px-2 py-1 rounded-lg select-none transition-colors">
                    Course Details
                    <ChevronRight size={12} className="group-open:hidden" />
                    <ChevronDown size={12} className="hidden group-open:inline" />
                  </span>
                  <span className="hidden sm:inline text-sm text-gray-400">
                    {format(new Date(course.startDate), 'MMM d, yyyy')} – {format(new Date(course.endDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </summary>

              <div className="space-y-4 mt-4">
              {/* Assignments */}
              <Card>
                <details>
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <CardTitle>Assignments ({courseAssignments.length})</CardTitle>
                    <div className="flex gap-2">
                      <Link href={`/instructor/assignments/new?courseId=${course.id}`}>
                        <Button size="sm" variant="secondary"><Plus size={13} /> Create</Button>
                      </Link>
                      <Link href={`/instructor/assignments/use-existing?courseId=${course.id}`}>
                        <Button size="sm" variant="secondary"><Copy size={13} /> Use Existing</Button>
                      </Link>
                    </div>
                  </summary>
                  <div className="mt-3">
                    {courseAssignments.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No assignments yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <div className="divide-y divide-gray-50">
                          {sortedAssignments(courseAssignments).map(a => {
                            const section = extractSection(a.instructions)
                            const displayName = (a.type === 'VOCABULARY_QUIZ' && section) ? section : a.title
                            return (
                              <div key={a.id} className="flex items-center gap-4 px-1 py-2.5 text-sm hover:bg-gray-50 rounded-lg">
                                <span className="text-gray-500 w-16 shrink-0">Week {a.weekNumber}</span>
                                <span className="text-gray-500 w-20 shrink-0 whitespace-nowrap">{format(new Date(a.dueDate), 'EEE, MMM d')}</span>
                                <Link href={`/instructor/assignments/${a.id}`} className="flex-1 min-w-0 font-medium text-gray-800 truncate hover:text-brand-700">
                                  {displayName}
                                </Link>
                                <Badge variant={typeVariant[a.type] ?? 'gray'} className="shrink-0">{typeLabel[a.type] ?? a.type}</Badge>
                                <span className="text-gray-400 text-xs shrink-0">{a._count.questions}q</span>
                                <Badge variant={a.isPublished ? 'green' : 'gray'} className="shrink-0">{a.isPublished ? 'Published' : 'Draft'}</Badge>
                                <Link href={`/instructor/assignments/${a.id}`} className="shrink-0">
                                  <Button size="sm" variant="secondary">Edit</Button>
                                </Link>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              </Card>

              {/* Schedule calendar — collapsed by default */}
              {courseAssignments.length > 0 && (
                <Card>
                  <details>
                    <summary className="flex items-center justify-between cursor-pointer list-none mb-0">
                      <CardTitle>Schedule</CardTitle>
                      <span className="text-xs text-gray-400">{courseAssignments.length} assignment{courseAssignments.length !== 1 ? 's' : ''}</span>
                    </summary>
                    <div className="mt-4">
                      <CalendarGrid
                        events={courseAssignments.map(a => ({
                          id: a.id,
                          title: a.title,
                          type: a.type,
                          dueDate: a.dueDate.toISOString(),
                          href: `/instructor/assignments/${a.id}`,
                          isPublished: a.isPublished,
                        }))}
                        initialDate={courseAssignments[0]?.dueDate.toISOString()}
                      />
                    </div>
                  </details>
                </Card>
              )}

              {/* Students — collapsed by default */}
              {courseEnrollments.length > 0 && (
                <Card>
                  <details>
                    <summary className="cursor-pointer list-none">
                      <CardTitle>Students ({courseEnrollments.length})</CardTitle>
                    </summary>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {courseEnrollments.map(e => (
                        <span key={e.user.id} className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                          {[e.user.firstName, e.user.surname].filter(Boolean).join(' ') || e.user.email}
                        </span>
                      ))}
                    </div>
                  </details>
                </Card>
              )}

              {/* Gradebook */}
              {activeGroups.length > 0 && (
                <Card>
                  <details id={`gradebook-${course.id}`}>
                  <summary className="flex items-center justify-between cursor-pointer list-none mb-4">
                    <CardTitle>Grade Book</CardTitle>
                    <span className="text-xs text-gray-400">{students.length === 0 ? 'No students enrolled yet' : `${students.length} student${students.length !== 1 ? 's' : ''}`}</span>
                  </summary>
                  <div className="overflow-auto max-h-[70vh] rounded-xl border border-gray-100">
                    <table className="text-xs border-collapse min-w-full table-fixed">
                      <colgroup>
                        <col style={{ width: '176px' }} />
                        {activeGroups.map(g => (
                          <Fragment key={g.type}>
                            {g.cols.map(a => <col key={a.id} style={{ width: '64px' }} />)}
                            <col style={{ width: '64px' }} />
                          </Fragment>
                        ))}
                        <col style={{ width: '64px' }} />
                      </colgroup>
                      <thead className="sticky top-0 z-20">
                        <tr className="border-b border-gray-200">
                          <th className="sticky left-0 z-30 bg-gray-50 px-4 py-2" rowSpan={2} />
                          {activeGroups.map(g => (
                            <th key={g.type} colSpan={g.cols.length + 1}
                              className="px-3 py-2 text-center font-semibold text-gray-700 bg-gray-50 border-l-2 border-gray-300">
                              {g.label}
                            </th>
                          ))}
                          <th className="px-3 py-2 text-center font-semibold text-brand-700 bg-brand-50 border-l-2 border-gray-300 whitespace-nowrap">
                            Overall
                          </th>
                        </tr>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          {activeGroups.map(g => (
                            <Fragment key={g.type}>
                              {g.cols.map(a => {
                                const section = extractSection(a.instructions)
                                return (
                                  <th key={a.id} className="px-2 py-2 text-center font-medium text-gray-500 border-l border-gray-100 overflow-hidden">
                                    {section
                                      ? <span className="block text-brand-600 font-semibold truncate">{section}</span>
                                      : <span className="block">Wk {a.weekNumber}</span>}
                                  </th>
                                )
                              })}
                              <th className="px-2 py-2 text-center font-semibold text-gray-600 bg-gray-100 border-l border-gray-200">Avg</th>
                            </Fragment>
                          ))}
                          <th className="px-2 py-2 bg-brand-50 border-l border-gray-200" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {students.map(student => {
                          const allScores: (number | null)[] = []
                          return (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-r border-gray-100 shadow-[1px_0_0_0_#e5e7eb]">
                                <p className="font-medium text-gray-800 whitespace-nowrap truncate">
                                  {[student.firstName, student.surname].filter(Boolean).join(' ') || student.email}
                                </p>
                                <p className="text-gray-400 text-xs truncate">{student.email}</p>
                              </td>
                              {activeGroups.map(g => {
                                const groupScores = g.cols.map(a => getScore(student.id, a))
                                groupScores.forEach(s => allScores.push(s))
                                return (
                                  <Fragment key={g.type}>
                                    {g.cols.map(a => <PctCell key={a.id} pct={getScore(student.id, a)} />)}
                                    <PctCell key={`${g.type}-avg`} pct={avg(groupScores)} muted />
                                  </Fragment>
                                )
                              })}
                              <PctCell pct={avg(allScores)} muted />
                            </tr>
                          )
                        })}
                        {students.length === 0 && (
                          <tr>
                            <td colSpan={999} className="px-4 py-6 text-center text-xs text-gray-400 italic">
                              No students enrolled yet — grades will appear here once students join.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50">
                          <td className="sticky left-0 z-10 bg-gray-50 px-4 py-2.5 font-semibold text-gray-600 text-xs shadow-[1px_0_0_0_#e5e7eb]">
                            Class average
                          </td>
                          {(() => {
                            const cells: ReactNode[] = []
                            const allColAvgs: (number | null)[] = []
                            activeGroups.forEach(g => {
                              const groupColAvgs = g.cols.map(a => avg(students.map(s => getScore(s.id, a))))
                              groupColAvgs.forEach(v => allColAvgs.push(v))
                              g.cols.forEach((a, i) => cells.push(<PctCell key={a.id} pct={groupColAvgs[i]} />))
                              cells.push(<PctCell key={`${g.type}-avg`} pct={avg(groupColAvgs)} muted />)
                            })
                            cells.push(<PctCell key="overall" pct={avg(allColAvgs)} muted />)
                            return cells
                          })()}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  </details>
                </Card>
              )}

              </div>{/* end collapsible subsections */}
              <hr className="border-gray-100 mt-3" />
            </details>
          )
        })}
      </div>
    </DashboardShell>
  )
}
