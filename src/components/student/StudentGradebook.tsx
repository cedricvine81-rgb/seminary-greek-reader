import { Fragment } from 'react'
import { weightedOverall, type CategoryWeights, type GradeCategory } from '@/lib/grade-weights'

// Mirrors the instructor CourseGradebook layout, scoped to a single student:
// assignment columns grouped by type → per-group Avg → Overall.
const GROUPS = [
  { type: 'VOCABULARY_QUIZ',      label: 'Vocabulary Quizzes' },
  { type: 'MORPHOLOGY_QUIZ',      label: 'Morphology Quizzes' },
  { type: 'TRANSLATION_EXERCISE', label: 'Translation Exercises' },
  { type: 'TRANSLATION_EXAM',     label: 'Translation Exams' },
] as const

export interface GradebookRow {
  id: string
  title: string
  weekNumber: number
  type: string
  pct: number | null
}

function PctCell({ pct, muted = false }: { pct: number | null; muted?: boolean }) {
  if (pct === null) {
    return <td className={`px-2 py-2 text-center text-gray-200 text-xs ${muted ? 'bg-gray-50' : ''}`}>—</td>
  }
  const colour = pct >= 90 ? 'text-green-700 bg-green-50'
    : pct >= 70 ? 'text-amber-700 bg-amber-50'
    : 'text-red-700 bg-red-50'
  return (
    <td className={`px-2 py-2 text-center ${muted ? 'bg-gray-50' : ''}`}>
      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${colour}`}>{pct}%</span>
    </td>
  )
}

function avg(nums: (number | null)[]): number | null {
  const vals = nums.filter((n): n is number => n !== null)
  return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
}

export function StudentGradebook({ studentName, rows, weights = null }: { studentName: string; rows: GradebookRow[]; weights?: CategoryWeights | null }) {
  const activeGroups = GROUPS.map(({ type, label }) => ({
    type, label,
    cols: rows.filter(r => r.type === type),
  })).filter(g => g.cols.length > 0)

  if (activeGroups.length === 0) return null

  const allScores: (number | null)[] = []
  const catAvgs: { type: GradeCategory; avg: number | null }[] = []

  return (
    <div className="overflow-auto rounded-xl border border-gray-200">
      <table className="text-xs border-collapse min-w-full table-fixed">
        <colgroup>
          <col style={{ width: '160px' }} />
          {activeGroups.map(g => (
            <Fragment key={g.type}>
              {g.cols.map(a => <col key={a.id} style={{ width: '80px' }} />)}
              <col style={{ width: '64px' }} />
            </Fragment>
          ))}
          <col style={{ width: '64px' }} />
        </colgroup>
        <thead>
          {/* Row 1: group headers */}
          <tr className="border-b border-gray-200">
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2" rowSpan={2} />
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
              Overall
            </th>
          </tr>
          {/* Row 2: per-assignment labels + Avg */}
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
                    <span className="block text-[10px] text-gray-400 leading-tight">Wk {a.weekNumber}</span>
                  </th>
                ))}
                <th className="px-2 py-2 text-center font-semibold text-gray-600 bg-gray-100 border-l border-gray-200">Avg</th>
              </Fragment>
            ))}
            <th className="px-2 py-2 bg-brand-50 border-l border-gray-200" />
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-50">
            <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 border-r border-gray-100 font-medium text-gray-800 whitespace-nowrap truncate">
              {studentName}
            </td>
            {activeGroups.map(g => {
              const groupScores = g.cols.map(a => a.pct)
              groupScores.forEach(s => allScores.push(s))
              catAvgs.push({ type: g.type as GradeCategory, avg: avg(groupScores) })
              return (
                <Fragment key={g.type}>
                  {g.cols.map(a => <PctCell key={a.id} pct={a.pct} />)}
                  <PctCell key={`${g.type}-avg`} pct={avg(groupScores)} muted />
                </Fragment>
              )
            })}
            <PctCell pct={weights ? weightedOverall(catAvgs, weights) : avg(allScores)} muted />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
