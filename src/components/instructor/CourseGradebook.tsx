import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { prisma } from '@/lib/db'
import { compareStudentsByName } from '@/lib/sort-students'
import { GradeWeightEditor } from './GradeWeightEditor'
import { normalizeCategoryWeights, weightedOverall, type GradeCategory } from '@/lib/grade-weights'
import { getServerT } from '@/lib/i18n/server'

interface Props {
  courseId: string
}

// Column groups, in display order. The NAMES come from assign.typePlural.* — this list held
// the seventh copy of that enum's labels.
const GROUPS = [
  'VOCABULARY_QUIZ', 'MORPHOLOGY_QUIZ', 'TRANSLATION_EXERCISE', 'TRANSLATION_EXAM',
  'COURSE_NOTES', 'GROUP_PRESENTATION', 'CONSTRUCT_SEARCH',
] as const

function PctCell({ pct, muted = false }: { pct: number | null; muted?: boolean }) {
  if (pct === null) {
    return <td className="px-2 py-2 text-center text-gray-200 text-xs">—</td>
  }
  const colour = pct >= 90 ? 'text-green-700 bg-green-50'
    : pct >= 70 ? 'text-amber-700 bg-amber-50'
    : 'text-red-700 bg-red-50'
  return (
    <td className={`px-2 py-2 text-center ${muted ? 'bg-gray-50' : ''}`}>
      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${colour}`}>
        {pct}%
      </span>
    </td>
  )
}

function avg(nums: (number | null)[]): number | null {
  const vals = nums.filter((n): n is number => n !== null)
  return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
}

export async function CourseGradebook({ courseId }: Props) {
  const t = getServerT()
  const [enrollments, assignments, course] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId, status: 'APPROVED', user: { deletedAt: null } },
      include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
    }),
    prisma.assignment.findMany({
      where: { courseId, isPublished: true },
      select: { id: true, title: true, type: true, weekNumber: true, questions: { select: { points: true } } },
      orderBy: { weekNumber: 'asc' },
    }),
    prisma.course.findUnique({ where: { id: courseId }, select: { gradeCategoryWeights: true } }),
  ])
  const weights = normalizeCategoryWeights(course?.gradeCategoryWeights)
  // Alphabetical by surname, then first name (case-insensitive, locale-aware).
  enrollments.sort((a, b) => compareStudentsByName(a.user, b.user))

  if (enrollments.length === 0 || assignments.length === 0) return null

  const assignmentIds = assignments.map(a => a.id)
  // Both translation exams and passage exercises (no questions) are graded via
  // ExegesisSession.grade; question-based exercises use Response scores.
  const exegesisGradedIds = assignments
    .filter(a => a.type === 'TRANSLATION_EXAM' || (a.type === 'TRANSLATION_EXERCISE' && a.questions.length === 0))
    .map(a => a.id)
  const questionTranslationIds = assignments
    .filter(a => a.type === 'TRANSLATION_EXERCISE' && a.questions.length > 0)
    .map(a => a.id)
  // Course Notes are graded 0–100 by the instructor and stored on NoteSubmission.
  const courseNotesIds = assignments.filter(a => a.type === 'COURSE_NOTES').map(a => a.id)
  // Group Presentations get one group grade (GroupSubmission.grade), shared by every member.
  const groupPresentationIds = assignments.filter(a => a.type === 'GROUP_PRESENTATION').map(a => a.id)
  // Construct searches are graded 0–100 on the student's find-list (ConstructSubmission.grade).
  const constructIds = assignments.filter(a => a.type === 'CONSTRUCT_SEARCH').map(a => a.id)

  const [realAttempts, realResponses, exegesisGrades, noteGrades, presentationGroups, constructGrades] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { assignmentId: { in: assignmentIds }, isBest: true },
      select: { userId: true, assignmentId: true, percentage: true },
    }),
    questionTranslationIds.length > 0
      ? prisma.response.findMany({
          where: { assignmentId: { in: questionTranslationIds }, questionId: { not: null } },
          select: { userId: true, assignmentId: true, score: true },
        })
      : Promise.resolve([]),
    exegesisGradedIds.length > 0
      ? prisma.exegesisSession.findMany({
          where: { assignmentId: { in: exegesisGradedIds }, grade: { not: null } },
          select: { userId: true, assignmentId: true, grade: true },
        })
      : Promise.resolve([]),
    courseNotesIds.length > 0
      ? prisma.noteSubmission.findMany({
          where: { assignmentId: { in: courseNotesIds }, grade: { not: null } },
          select: { userId: true, assignmentId: true, grade: true },
        })
      : Promise.resolve([]),
    groupPresentationIds.length > 0
      ? prisma.courseGroup.findMany({
          where: { assignmentId: { in: groupPresentationIds } },
          select: {
            assignmentId: true,
            members: { select: { userId: true } },
            submission: { select: { grade: true } },
            contributions: { select: { userId: true, grade: true } },
          },
        })
      : Promise.resolve([]),
    constructIds.length > 0
      ? prisma.constructSubmission.findMany({
          where: { assignmentId: { in: constructIds }, grade: { not: null } },
          select: { userId: true, assignmentId: true, grade: true },
        })
      : Promise.resolve([]),
  ])

  // Flatten group presentations to per-student grades. Each member gets their per-member
  // override (GroupContribution.grade) if set, else the group grade.
  const groupGrades = presentationGroups.flatMap(g => {
    if (!g.assignmentId) return []
    const overrideByUser = new Map(g.contributions.filter(c => c.grade != null).map(c => [c.userId, c.grade as number]))
    return g.members.flatMap(m => {
      const grade = overrideByUser.get(m.userId) ?? g.submission?.grade ?? null
      return grade != null ? [{ userId: m.userId, assignmentId: g.assignmentId as string, grade }] : []
    })
  })

  const students = enrollments.map(e => e.user)

  // Score lookup: quiz → best attempt %; passage exercise → instructor grade; question translation → response scores
  function getScore(userId: string, assignment: typeof assignments[0]): number | null {
    if (assignment.type === 'TRANSLATION_EXAM') {
      const session = exegesisGrades.find(g => g.userId === userId && g.assignmentId === assignment.id)
      return session?.grade ?? null
    }
    if (assignment.type === 'COURSE_NOTES') {
      const sub = noteGrades.find(g => g.userId === userId && g.assignmentId === assignment.id)
      return sub?.grade ?? null
    }
    if (assignment.type === 'CONSTRUCT_SEARCH') {
      const sub = constructGrades.find(g => g.userId === userId && g.assignmentId === assignment.id)
      return sub?.grade ?? null
    }
    if (assignment.type === 'GROUP_PRESENTATION') {
      const g = groupGrades.find(g => g.userId === userId && g.assignmentId === assignment.id)
      return g?.grade ?? null
    }
    if (assignment.type === 'TRANSLATION_EXERCISE') {
      if (assignment.questions.length === 0) {
        // Passage exercise — use instructor-entered grade from ExegesisSession
        const session = exegesisGrades.find(
          g => g.userId === userId && g.assignmentId === assignment.id
        )
        return session?.grade ?? null
      }
      // Question-based translation — use response scores
      const rs = realResponses.filter(r => r.userId === userId && r.assignmentId === assignment.id)
      if (rs.length === 0) return null
      const totalPts = assignment.questions.reduce((s, q) => s + q.points, 0)
      if (totalPts === 0) return null
      const earned = rs.reduce((s, r) => s + (r.score ?? 0), 0)
      return Math.round((earned / totalPts) * 100)
    }
    const attempt = realAttempts.find(a => a.userId === userId && a.assignmentId === assignment.id)
    return attempt?.percentage ?? null
  }

  // Pre-compute groups so every render section uses identical structure
  const activeGroups = GROUPS.map(type => ({
    type,
    label: t(`assign.typePlural.${type}`),
    cols: assignments.filter(a => a.type === type),
  })).filter(g => g.cols.length > 0)

  if (activeGroups.length === 0) return null

  const activeTypes = activeGroups.map(g => g.type as GradeCategory)

  return (
    <div>
    <GradeWeightEditor courseId={courseId} activeTypes={activeTypes} initial={weights} />
    <div className="overflow-auto max-h-[70vh] rounded-xl border border-gray-200">
      <table className="text-xs border-collapse min-w-full table-fixed">
        <colgroup>
          <col style={{ width: '176px' }} />
          {activeGroups.map(g => (
            <Fragment key={g.type}>
              {g.cols.map(a => <col key={a.id} style={{ width: '80px' }} />)}
              <col style={{ width: '64px' }} />
            </Fragment>
          ))}
          <col style={{ width: '64px' }} />
        </colgroup>
        <thead className="sticky top-0 z-20">
          {/* Row 1: group headers */}
          <tr className="border-b border-gray-200">
            <th className="sticky left-0 z-30 bg-gray-50 px-4 py-2" rowSpan={2} />
            {activeGroups.map(g => (
              <th
                key={g.type}
                colSpan={g.cols.length + 1}
                className="px-3 py-2 text-center font-semibold text-gray-700 bg-gray-50 border-l-2 border-gray-300"
              >
                {g.label}
                {weights && (weights[g.type as GradeCategory] ?? 0) > 0 && (
                  <span className="ml-1 font-normal text-brand-600">· {weights[g.type as GradeCategory]}%</span>
                )}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-semibold text-brand-700 bg-brand-50 border-l-2 border-gray-300 whitespace-nowrap">
              {t('gb.overall')}
            </th>
          </tr>

          {/* Row 2: individual column labels */}
          <tr className="border-b border-gray-200 bg-gray-50">
            {activeGroups.map(g => (
              <Fragment key={g.type}>
                {g.cols.map(a => (
                  <th
                    key={a.id}
                    title={a.title}
                    className="px-2 py-2 text-center font-medium text-gray-500 border-l border-gray-100 overflow-hidden"
                  >
                    <span className="block truncate text-xs leading-tight">{a.title}</span>
                    <span className="block text-[10px] text-gray-400 leading-tight">{t('gb.wk', { n: a.weekNumber })}</span>
                  </th>
                ))}
                <th className="px-2 py-2 text-center font-semibold text-gray-600 bg-gray-100 border-l border-gray-200">
                  {t('gb.avg')}
                </th>
              </Fragment>
            ))}
            <th className="px-2 py-2 bg-brand-50 border-l border-gray-200" />
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {students.map(student => {
            const allScores: (number | null)[] = []
            const catAvgs: { type: GradeCategory; avg: number | null }[] = []

            return (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 border-r border-gray-100 shadow-[1px_0_0_0_#e5e7eb]">
                  <p className="font-medium text-gray-800 whitespace-nowrap truncate">
                    {[student.firstName, student.surname].filter(Boolean).join(' ') || student.email}
                  </p>
                  <p className="text-gray-400 text-xs truncate">{student.email}</p>
                </td>

                {activeGroups.map(g => {
                  const groupScores = g.cols.map(a => getScore(student.id, a))
                  groupScores.forEach(s => allScores.push(s))
                  catAvgs.push({ type: g.type as GradeCategory, avg: avg(groupScores) })
                  return (
                    <Fragment key={g.type}>
                      {g.cols.map(a => <PctCell key={a.id} pct={getScore(student.id, a)} />)}
                      <PctCell key={`${g.type}-avg`} pct={avg(groupScores)} muted />
                    </Fragment>
                  )
                })}

                <PctCell pct={weights ? weightedOverall(catAvgs, weights) : avg(allScores)} muted />
              </tr>
            )
          })}
        </tbody>

        {/* Class averages footer */}
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50">
            <td className="sticky left-0 z-10 bg-gray-50 px-4 py-2.5 font-semibold text-gray-600 text-xs shadow-[1px_0_0_0_#e5e7eb]">
              {t('gb.classAverage')}
            </td>
            {(() => {
              const cells: ReactNode[] = []
              const allColAvgs: (number | null)[] = []
              const catAvgs: { type: GradeCategory; avg: number | null }[] = []

              activeGroups.forEach(g => {
                const groupColAvgs = g.cols.map(a => avg(students.map(s => getScore(s.id, a))))
                groupColAvgs.forEach(v => allColAvgs.push(v))
                const groupAvg = avg(groupColAvgs)
                catAvgs.push({ type: g.type as GradeCategory, avg: groupAvg })

                g.cols.forEach((a, i) => cells.push(<PctCell key={a.id} pct={groupColAvgs[i]} />))
                cells.push(<PctCell key={`${g.type}-avg`} pct={groupAvg} muted />)
              })

              cells.push(<PctCell key="overall" pct={weights ? weightedOverall(catAvgs, weights) : avg(allColAvgs)} muted />)
              return cells
            })()}
          </tr>
        </tfoot>
      </table>
    </div>
    </div>
  )
}
