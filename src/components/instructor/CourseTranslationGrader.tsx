'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AssignmentResultsGrid } from './AssignmentResultsGrid'
import { ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  weekNumber: number
  dueDate: string
  reference?: string | null
}

interface Props {
  assignments: Assignment[]
}

export function CourseTranslationGrader({ assignments }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (assignments.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      {assignments.map(a => {
        const isOpen = openId === a.id
        return (
          <div key={a.id} className="rounded-xl border border-gray-200 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <ClipboardCheck size={15} className="shrink-0 text-brand-500" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    Week {a.weekNumber}: {a.title}
                  </p>
                  {a.reference && (
                    <p className="text-xs text-gray-400">{a.reference}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-gray-400 hidden sm:block">
                  Due {new Date(a.dueDate).toLocaleDateString()}
                </span>
                <Button
                  size="sm"
                  variant={isOpen ? 'secondary' : 'primary'}
                  onClick={() => setOpenId(isOpen ? null : a.id)}
                  className="flex items-center gap-1.5"
                >
                  {isOpen ? (
                    <><ChevronUp size={13} /> Close</>
                  ) : (
                    <><ClipboardCheck size={13} /> Grade Exercise</>
                  )}
                </Button>
              </div>
            </div>

            {/* Expandable grading panel */}
            {isOpen && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <AssignmentResultsGrid assignmentId={a.id} autoLoad />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
