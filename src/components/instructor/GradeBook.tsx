'use client'
import { useState } from 'react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

interface Course { id: string; name: string }

interface AssignmentCol {
  id: string
  title: string
  weekNumber: number
}

interface StudentRow {
  userId: string
  name: string
  email: string
  quizScores: (number | null)[]  // null = not attempted
  runningPct: number | null      // avg of attempted quizzes
  totalPct: number | null        // avg across all quizzes (unattempted = 0)
}

interface GradeBookData {
  assignments: AssignmentCol[]
  rows: StudentRow[]
}

function ScoreCell({ pct }: { pct: number | null }) {
  if (pct === null) return <td className="px-3 py-2 text-center text-gray-300 text-xs">—</td>
  const colour =
    pct >= 90 ? 'text-green-700 bg-green-50' :
    pct >= 70 ? 'text-amber-700 bg-amber-50' :
                'text-red-700 bg-red-50'
  return (
    <td className="px-3 py-2 text-center">
      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${colour}`}>
        {pct}%
      </span>
    </td>
  )
}

export function GradeBook({ courses }: { courses: Course[] }) {
  const [courseId, setCourseId] = useState('')
  const [data, setData] = useState<GradeBookData | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    if (!courseId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/gradebook?courseId=${courseId}`)
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-3">
        <Select
          label="Select course"
          value={courseId}
          onChange={e => { setCourseId(e.target.value); setData(null) }}
          placeholder="Choose a course…"
          options={courses.map(c => ({ value: c.id, label: c.name }))}
          className="max-w-xs"
        />
        <Button onClick={load} loading={loading} disabled={!courseId}>Load Grade Book</Button>
      </div>

      {data && data.rows.length === 0 && (
        <p className="text-sm text-gray-400 italic">No enrolled students found for this course.</p>
      )}

      {data && data.rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap sticky left-0 bg-gray-50">
                  Student
                </th>
                {data.assignments.map(a => (
                  <th key={a.id} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap max-w-[90px]">
                    <span className="block text-gray-400 font-normal">Wk {a.weekNumber}</span>
                    <span className="block truncate">{a.title.replace(/^Week \d+ — /, '')}</span>
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-semibold text-brand-700 whitespace-nowrap bg-brand-50">
                  Running %
                  <span className="block font-normal text-gray-400">(attempted)</span>
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-brand-700 whitespace-nowrap bg-brand-50">
                  Overall %
                  <span className="block font-normal text-gray-400">(all quizzes)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map(row => (
                <tr key={row.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 sticky left-0 bg-white">
                    <p className="font-medium text-gray-800 whitespace-nowrap">{row.name}</p>
                    <p className="text-xs text-gray-400">{row.email}</p>
                  </td>
                  {row.quizScores.map((pct, i) => (
                    <ScoreCell key={i} pct={pct} />
                  ))}
                  <td className="px-3 py-2 text-center bg-brand-50/40">
                    {row.runningPct !== null
                      ? <span className="text-xs font-semibold text-brand-700">{row.runningPct}%</span>
                      : <span className="text-xs text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-3 py-2 text-center bg-brand-50/40">
                    {row.totalPct !== null
                      ? <span className="text-xs font-semibold text-brand-700">{row.totalPct}%</span>
                      : <span className="text-xs text-gray-300">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
