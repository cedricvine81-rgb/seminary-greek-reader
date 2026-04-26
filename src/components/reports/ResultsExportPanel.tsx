'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Download } from 'lucide-react'
import { downloadCSV } from '@/lib/export-results'

interface ResultsExportPanelProps {
  courseId: string
  courseName: string
}

export function ResultsExportPanel({ courseId, courseName }: ResultsExportPanelProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?courseId=${courseId}&format=csv`)
      const text = await res.text()
      downloadCSV(text, `${courseName.replace(/\s+/g, '-')}-results.csv`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">Export Results</p>
        <p className="text-xs text-gray-500">Download student scores as CSV</p>
      </div>
      <Button variant="secondary" size="sm" loading={loading} onClick={handleExport}>
        <Download size={14} /> Export CSV
      </Button>
    </div>
  )
}
