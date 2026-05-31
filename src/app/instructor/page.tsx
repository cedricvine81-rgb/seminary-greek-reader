import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CourseGradebook } from '@/components/instructor/CourseGradebook'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'
import { BookOpen, Users, ClipboardList, Plus, Copy, FileText } from 'lucide-react'

export const metadata: Metadata = { title: 'Instructor Dashboard' }

const typeLabel: Record<string, string> = {
  VOCABULARY_QUIZ: 'Vocab', MORPHOLOGY_QUIZ: 'Morph', TRANSLATION_EXERCISE: 'Translation',
}
const typeVariant: Record<string, 'blue' | 'purple' | 'green'> = {
  VOCABULARY_QUIZ: 'blue', MORPHOLOGY_QUIZ: 'purple', TRANSLATION_EXERCISE: 'green',
}

function extractSection(instructions: string | null): string | null {
  if (!instructions) return null
  const m = instructions.match(/Section\s+([\w\-:]+)/i)
  return m ? m[1].replace('-', ':') : null
}

export default async function InstructorPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const [user, courses] = await Promise.all([
    prisma.user.findUnique({ where: { id: payload.sub }, select: { firstName: true, surname: true } }),
    prisma.course.findMany({
      where: {
        OR: [
          { instructorId: payload.sub },
          { coInstructors: { some: { userId: payload.sub } } },
        ],
      },
      include: {
        assignments: {
          orderBy: [{ weekNumber: 'asc' }, { dueDate: 'asc' }],
          select: { id: true, title: true, type: true, weekNumber: true, dueDate: true, instructions: true, isPublished: true, _count: { select: { questions: true } } },
        },
        enrollments: {
          include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startDate: 'asc' },
    }),
  ])

  const instructorName = user ? `${user.firstName} ${user.surname}`.trim() : 'Instructor'
  const totalStudents = courses.reduce((s, c) => s + c.enrollments.length, 0)
  const totalAssignments = courses.reduce((s, c) => s + c.assignments.length, 0)

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Dashboard">
      <div className="space-y-8">

        {/* Welcome + stats strip */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Welcome back, {instructorName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Here's a full view of your courses and student grades.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Courses', value: courses.length, icon: <BookOpen size={18} />, color: 'text-blue-600 bg-blue-50', href: '/instructor/courses' },
              { label: 'Students', value: totalStudents, icon: <Users size={18} />, color: 'text-green-600 bg-green-50', href: '/instructor/students' },
              { label: 'Assignments', value: totalAssignments, icon: <ClipboardList size={18} />, color: 'text-purple-600 bg-purple-50', href: '/instructor/assignments' },
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

          {/* Quick actions */}
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
          </div>
        </div>

        {courses.length === 0 && (
          <Card>
            <p className="text-sm text-gray-400 italic text-center py-6">No courses yet. Create your first course to get started.</p>
          </Card>
        )}

        {/* Per-course panels */}
        {courses.map(course => (
          <div key={course.id} className="space-y-4">
            {/* Course header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Link href={`/instructor/courses/${course.id}`} className="text-xl font-bold text-gray-900 hover:text-brand-700">
                  {course.name}
                </Link>
                <Badge variant={COURSE_LEVEL_VARIANTS[course.level] ?? 'gray'}>
                  {COURSE_LEVEL_LABELS[course.level] ?? course.level}
                </Badge>
                <span className="text-sm text-gray-400">
                  {format(new Date(course.startDate), 'MMM d, yyyy')} – {format(new Date(course.endDate), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users size={14} />
                <span>{course.enrollments.length} student{course.enrollments.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Assignments */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <CardTitle>Assignments ({course.assignments.length})</CardTitle>
                <div className="flex gap-2">
                  <Link href={`/instructor/assignments/new?courseId=${course.id}`}>
                    <Button size="sm" variant="secondary"><Plus size={13} /> Create</Button>
                  </Link>
                  <Link href={`/instructor/assignments/use-existing?courseId=${course.id}`}>
                    <Button size="sm" variant="secondary"><Copy size={13} /> Use Existing</Button>
                  </Link>
                </div>
              </div>
              {course.assignments.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No assignments yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-500">
                        <th className="pb-2 text-left font-medium">Wk</th>
                        <th className="pb-2 text-left font-medium">Date</th>
                        <th className="pb-2 text-left font-medium">Quiz</th>
                        <th className="pb-2 text-center font-medium">Type</th>
                        <th className="pb-2 text-center font-medium">Qs</th>
                        <th className="pb-2 text-center font-medium">Status</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {course.assignments.map(a => {
                        const section = extractSection(a.instructions)
                        return (
                          <tr key={a.id} className="hover:bg-gray-50">
                            <td className="py-2 pr-3 text-gray-600">{a.weekNumber}</td>
                            <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">{format(new Date(a.dueDate), 'MMM d')}</td>
                            <td className="py-2 pr-3">
                              <Link href={`/instructor/assignments/${a.id}`} className="hover:text-brand-700">
                                {section && <span className="block text-xs text-brand-600 font-semibold">{section}</span>}
                                <span className="font-medium text-gray-800">{a.title}</span>
                              </Link>
                            </td>
                            <td className="py-2 pr-3 text-center">
                              <Badge variant={typeVariant[a.type] ?? 'gray'}>{typeLabel[a.type] ?? a.type}</Badge>
                            </td>
                            <td className="py-2 pr-3 text-center text-gray-500">{a._count.questions}</td>
                            <td className="py-2 pr-3 text-center">
                              <Badge variant={a.isPublished ? 'green' : 'gray'}>{a.isPublished ? 'Published' : 'Draft'}</Badge>
                            </td>
                            <td className="py-2">
                              <Link href={`/instructor/assignments/${a.id}`}>
                                <Button size="sm" variant="secondary">Edit</Button>
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Students */}
            {course.enrollments.length > 0 && (
              <Card>
                <CardTitle className="mb-3">Students ({course.enrollments.length})</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {course.enrollments.map(e => (
                    <span key={e.user.id} className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                      {[e.user.firstName, e.user.surname].filter(Boolean).join(' ') || e.user.email}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Gradebook */}
            {course.assignments.length > 0 && course.enrollments.length > 0 && (
              <Card>
                <CardTitle className="mb-4">Grade Book</CardTitle>
                <CourseGradebook courseId={course.id} />
              </Card>
            )}

            <hr className="border-gray-100" />
          </div>
        ))}
      </div>
    </DashboardShell>
  )
}
