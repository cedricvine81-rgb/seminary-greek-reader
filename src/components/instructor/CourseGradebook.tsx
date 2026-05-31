import type { ReactNode } from 'react'
import { prisma } from '@/lib/db'

interface Props {
  courseId: string
}

const GROUPS = [
  { type: 'VOCABULARY_QUIZ',      label: 'Vocabulary Quizzes' },
  { type: 'MORPHOLOGY_QUIZ',      label: 'Morphology Quizzes' },
  { type: 'TRANSLATION_EXERCISE', label: 'Translation Exercises' },
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
  const [enrollments, assignments] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId },
      include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.assignment.findMany({
      where: { courseId },
      select: { id: true, title: true, type: true, weekNumber: true, instructions: true, questions: { select: { points: true } } },
      orderBy: { weekNumber: 'asc' },
    }),
  ])

  if (enrollments.length === 0 || assignments.length === 0) return null

  const assignmentIds = assignments.map(a => a.id)
  const translationIds = assignments.filter(a => a.type === 'TRANSLATION_EXERCISE').map(a => a.id)

  const [realAttempts, realResponses] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { assignmentId: { in: assignmentIds }, isBest: true },
      select: { userId: true, assignmentId: true, percentage: true },
    }),
    translationIds.length > 0
      ? prisma.response.findMany({
          where: { assignmentId: { in: translationIds }, questionId: { not: null } },
          select: { userId: true, assignmentId: true, score: true },
        })
      : Promise.resolve([]),
  ])

  const students = enrollments.map(e => e.user)

  // Score lookup: quiz → use best attempt %; translation → sum scores / total points
  function getScore(userId: string, assignment: typeof assignments[0]): number | null {
    if (assignment.type === 'TRANSLATION_EXERCISE') {
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

  function extractSection(instructions: string | null): string | null {
    if (!instructions) return null
    const m = instructions.match(/Section\s+([\w\-:]+)/i)
    return m ? m[1].replace('-', ':') : null
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="text-xs border-collapse min-w-full table-fixed">
        <colgroup>
          {/* Student name column */}
          <col className="w-44" />
          {/* One col per quiz + avg col per group + overall col */}
          {GROUPS.flatMap(({ type }) => {
            const cols = assignments.filter(a => a.type === type)
            if (cols.length === 0) return []
            return [...cols.map(a => <col key={a.id} className="w-16" />), <col key={`${type}-avg`} className="w-16" />]
          })}
          <col className="w-16" />
        </colgroup>
        <thead>
          {/* Group headers */}
          <tr className="border-b border-gray-200">
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2 min-w-[160px]" rowSpan={2} />
            {GROUPS.map(({ type, label }) => {
              const cols = assignments.filter(a => a.type === type)
              if (cols.length === 0) return null
              return (
                <th
                  key={type}
                  colSpan={cols.length + 1}
                  className="px-3 py-2 text-center font-semibold text-gray-700 bg-gray-50 border-l border-gray-200"
                >
                  {label}
                </th>
              )
            })}
            <th className="px-3 py-2 text-center font-semibold text-brand-700 bg-brand-50 border-l border-gray-200 whitespace-nowrap">
              Overall
            </th>
          </tr>

          {/* Column labels */}
          <tr className="border-b border-gray-200 bg-gray-50">
            {GROUPS.map(({ type }) => {
              const cols = assignments.filter(a => a.type === type)
              if (cols.length === 0) return null
              return [
                ...cols.map(a => {
                  const section = extractSection(a.instructions)
                  return (
                    <th key={a.id} className="px-2 py-2 text-center font-medium text-gray-500 border-l border-gray-100 whitespace-nowrap">
                      {section ? (
                        <span className="block text-brand-600 font-semibold">{section}</span>
                      ) : (
                        <span className="block">Wk {a.weekNumber}</span>
                      )}
                    </th>
                  )
                }),
                <th key={`${type}-avg`} className="px-3 py-2 text-center font-semibold text-gray-600 bg-gray-100 border-l border-gray-200 whitespace-nowrap">
                  Avg
                </th>,
              ]
            })}
            <th className="px-3 py-2 bg-brand-50 border-l border-gray-200" />
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {students.map(student => {
            const allScores: (number | null)[] = []

            return (
              <tr key={student.id} className="hover:bg-gray-50">
                {/* Student name */}
                <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-r border-gray-100">
                  <p className="font-medium text-gray-800 whitespace-nowrap">
                    {[student.firstName, student.surname].filter(Boolean).join(' ') || student.email}
                  </p>
                  <p className="text-gray-400 text-xs">{student.email}</p>
                </td>

                {GROUPS.map(({ type }) => {
                  const cols = assignments.filter(a => a.type === type)
                  if (cols.length === 0) return null
                  const groupScores = cols.map(a => getScore(student.id, a))
                  groupScores.forEach(s => allScores.push(s))
                  const groupAvg = avg(groupScores)

                  return [
                    ...cols.map(a => (
                      <PctCell key={a.id} pct={getScore(student.id, a)} />
                    )),
                    <PctCell key={`${type}-avg`} pct={groupAvg} muted />,
                  ]
                })}

                <PctCell pct={avg(allScores)} muted />
              </tr>
            )
          })}
        </tbody>

        {/* Class averages footer */}
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50">
            <td className="sticky left-0 bg-gray-50 px-4 py-2.5 font-semibold text-gray-600 text-xs border-r border-gray-100">
              Class average
            </td>
            {(() => {
              const cells: ReactNode[] = []
              const allColAvgs: (number | null)[] = []

              GROUPS.forEach(({ type }) => {
                const cols = assignments.filter(a => a.type === type)
                if (cols.length === 0) return
                const groupColAvgs = cols.map(a => {
                  const scores = students.map(s => getScore(s.id, a))
                  return avg(scores)
                })
                groupColAvgs.forEach(v => allColAvgs.push(v))
                const groupAvg = avg(groupColAvgs)

                cols.forEach((a, i) => cells.push(<PctCell key={a.id} pct={groupColAvgs[i]} />))
                cells.push(<PctCell key={`${type}-avg`} pct={groupAvg} muted />)
              })

              cells.push(<PctCell key="overall" pct={avg(allColAvgs)} muted />)
              return cells
            })()}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
