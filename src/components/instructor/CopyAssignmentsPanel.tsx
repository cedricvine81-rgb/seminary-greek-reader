'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Copy, CheckCircle2 } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Course {
  id: string
  name: string
  level: string
}

interface Assignment {
  id: string
  title: string
  type: string
  weekNumber: number
  dueDate: Date | string
  course: { id: string; name: string }
  _count: { questions: number }
}

const typeLabel: Record<string, string> = {
  VOCABULARY_QUIZ: 'Vocabulary',
  MORPHOLOGY_QUIZ: 'Morphology',
  TRANSLATION_EXERCISE: 'Translation',
}
const typeVariant: Record<string, 'blue' | 'purple' | 'green'> = {
  VOCABULARY_QUIZ: 'blue',
  MORPHOLOGY_QUIZ: 'purple',
  TRANSLATION_EXERCISE: 'green',
}

export function CopyAssignmentsPanel({
  courses,
  assignments,
  defaultTargetCourseId,
}: {
  courses: Course[]
  assignments: Assignment[]
  defaultTargetCourseId: string
}) {
  const router = useRouter()
  const [targetCourseId, setTargetCourseId] = useState(defaultTargetCourseId)
  const [copying, setCopying] = useState<string | null>(null)
  const [copied, setCopied] = useState<Set<string>>(new Set())

  const available = assignments.filter(a => a.course.id !== targetCourseId)

  async function handleCopy(assignmentId: string) {
    setCopying(assignmentId)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCourseId }),
      })
      if (res.ok) {
        setCopied(prev => new Set(prev).add(assignmentId))
        router.refresh()
      }
    } finally {
      setCopying(null)
    }
  }

  if (courses.length === 0) {
    return <p className="text-sm text-gray-500">Create a course first before copying assignments.</p>
  }

  const grouped = available.reduce<Record<string, Assignment[]>>((acc, a) => {
    const key = a.course.name
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Select a destination course, then copy assignments from your other courses into it.
          Copying duplicates the assignment and all its questions; the original is unchanged.
        </p>
        <Select
          label="Copy into course"
          value={targetCourseId}
          onChange={e => { setTargetCourseId(e.target.value); setCopied(new Set()) }}
          options={courses.map(c => ({ value: c.id, label: c.name }))}
        />
      </div>

      {available.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          No assignments from other courses to copy.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([courseName, items]) => (
            <div key={courseName}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {courseName}
              </h3>
              <div className="space-y-2">
                {items.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant={typeVariant[a.type] ?? 'gray'}>
                        {typeLabel[a.type] ?? a.type}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                        <p className="text-xs text-gray-400">
                          Week {a.weekNumber} · {a._count.questions} questions ·{' '}
                          due {format(new Date(a.dueDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {copied.has(a.id) ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium shrink-0">
                        <CheckCircle2 size={15} />
                        Copied
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={copying === a.id}
                        onClick={() => handleCopy(a.id)}
                        className="shrink-0"
                      >
                        <Copy size={13} />
                        Copy
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
