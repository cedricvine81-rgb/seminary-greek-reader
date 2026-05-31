'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'

interface StudentResult {
  userId: string
  name: string
  email: string
  attempted: boolean
  earned: number
  totalPoints: number
  pct: number | null
}

interface ResultsData {
  rows: StudentResult[]
  totalPoints: number
  runningPct: number | null
  overallPct: number | null
}

function PctBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-gray-300">—</span>
  const colour =
    pct >= 90 ? 'text-green-700 bg-green-50' :
    pct >= 70 ? 'text-amber-700 bg-amber-50' :
                'text-red-700 bg-red-50'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${colour}`}>
      {pct}%
    </span>
  )
}

export function AssignmentResultsGrid({ assignmentId }: { assignmentId: string }) {
  const [data, setData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/results`)
      setData(await res.json())
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>Student Results</CardTitle>
        <Button variant="ghost" onClick={load} loading={loading} size="sm">
          {loaded ? 'Refresh' : 'Load results'}
        </Button>
      </div>

      {!loaded && !loading && (
        <p className="text-sm text-gray-400 italic">Click "Load results" to see student scores.</p>
      )}

      {loaded && data && data.rows.length === 0 && (
        <p className="text-sm text-gray-400 italic">No enrolled students found.</p>
      )}

      {loaded && data && data.rows.length > 0 && (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="flex gap-6 text-sm px-1">
            <div>
              <span className="text-gray-500">Attempted: </span>
              <span className="font-semibold text-gray-800">
                {data.rows.filter(r => r.attempted).length} / {data.rows.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Running avg: </span>
              <span className="font-semibold text-brand-700">
                {data.runningPct !== null ? `${data.runningPct}%` : '—'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Overall avg: </span>
              <span className="font-semibold text-brand-700">
                {data.overallPct !== null ? `${data.overallPct}%` : '—'}
              </span>
            </div>
          </div>

          {/* Results table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Score</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-brand-700 bg-brand-50">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.rows.map(row => (
                  <tr key={row.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-800">{row.name}</p>
                      <p className="text-xs text-gray-400">{row.email}</p>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.attempted
                        ? <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md">Submitted</span>
                        : <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Not attempted</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-gray-600">
                      {row.attempted ? `${row.earned} / ${row.totalPoints}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-center bg-brand-50/30">
                      <PctBadge pct={row.pct} />
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Class average footer */}
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-2.5 text-xs font-semibold text-gray-600" colSpan={2}>
                    Class average (attempted only)
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-gray-500">
                    {data.runningPct !== null ? `${data.runningPct}%` : '—'}
                  </td>
                  <td className="px-3 py-2 text-center bg-brand-50/30">
                    <PctBadge pct={data.runningPct} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}
