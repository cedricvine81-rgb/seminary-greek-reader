'use client'
import { useState } from 'react'
import { GradeSummaryCard } from './GradeSummaryCard'
import { StudentResultsTable } from './StudentResultsTable'
import { ResultsExportPanel } from './ResultsExportPanel'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

interface Course { id: string; name: string }
interface StudentResult {
  userId: string; name: string; email: string
  completedAssignments: number; totalAssignments: number; averageScore: number | null
}

interface SemesterReportGeneratorProps {
  courses: Course[]
}

export function SemesterReportGenerator({ courses }: SemesterReportGeneratorProps) {
  const [courseId, setCourseId] = useState('')
  const [report, setReport] = useState<{ students: StudentResult[]; summary: { avg: number | null; completion: number; high: number | null; low: number | null } } | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    if (!courseId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?courseId=${courseId}`)
      const data = await res.json()
      const students: StudentResult[] = data.studentStats ?? []
      const scores = students.map(s => s.averageScore).filter(s => s !== null) as number[]
      setReport({
        students,
        summary: {
          avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
          completion: data.totalAssignments > 0 ? Math.round((students.filter(s => s.completedAssignments > 0).length / students.length) * 100) : 0,
          high: scores.length ? Math.max(...scores) : null,
          low: scores.length ? Math.min(...scores) : null,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedCourse = courses.find(c => c.id === courseId)

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <Select
          label="Select course"
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
          placeholder="Choose a course…"
          options={courses.map(c => ({ value: c.id, label: c.name }))}
          className="max-w-xs"
        />
        <Button onClick={generate} loading={loading} disabled={!courseId}>Generate Report</Button>
      </div>

      {report && selectedCourse && (
        <>
          <GradeSummaryCard
            totalStudents={report.students.length}
            averageScore={report.summary.avg}
            completionRate={report.summary.completion}
            highestScore={report.summary.high}
            lowestScore={report.summary.low}
          />
          <StudentResultsTable students={report.students} />
          <ResultsExportPanel courseId={courseId} courseName={selectedCourse.name} />
        </>
      )}
    </div>
  )
}
