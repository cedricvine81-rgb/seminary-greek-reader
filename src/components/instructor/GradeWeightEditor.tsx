'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { GRADE_CATEGORIES, type GradeCategory, type CategoryWeights } from '@/lib/grade-weights'

/**
 * Lets an instructor set the final-grade weighting per assignment-type category
 * (only the categories that actually have assignments in this course are shown).
 * Weights are relative; the running total is shown as a guide.
 */
export function GradeWeightEditor({ courseId, activeTypes, initial }: {
  courseId: string
  activeTypes: GradeCategory[]
  initial: CategoryWeights | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const cats = GRADE_CATEGORIES.filter(c => activeTypes.includes(c.type))
  // Pre-fill from saved weights, else an even split across the active categories.
  const evenly = cats.length ? Math.round(100 / cats.length) : 0
  const [weights, setWeights] = useState<Record<string, string>>(
    Object.fromEntries(cats.map(c => [c.type, String(initial?.[c.type] ?? (initial ? 0 : evenly))])),
  )

  const total = cats.reduce((s, c) => s + (Number(weights[c.type]) || 0), 0)
  const enabled = initial !== null

  async function save(clear = false) {
    setSaving(true)
    setError('')
    try {
      const payload = clear
        ? null
        : Object.fromEntries(cats.map(c => [c.type, Number(weights[c.type]) || 0]))
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeCategoryWeights: payload }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Save failed')
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="text-sm font-medium text-brand-700 hover:text-brand-900"
        >
          {open ? 'Hide grade weighting' : 'Grade weighting'}
        </button>
        <span className="text-xs text-gray-500">
          {enabled
            ? `Final grade is weighted: ${cats.filter(c => (initial?.[c.type] ?? 0) > 0).map(c => `${c.label.replace(/ies$/, 'y').replace(/s$/, '')} ${initial?.[c.type]}%`).join(' · ') || '—'}`
            : 'Final grade is a flat average of all assignments.'}
        </span>
      </div>

      {open && (
        <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 max-w-xl">
          <p className="text-xs text-gray-500 mb-3">
            Set how much each category counts toward the final grade. Weights are applied relatively
            (categories with no scores drop out), so they don&rsquo;t have to total 100.
          </p>
          <div className="space-y-2">
            {cats.map(c => (
              <div key={c.type} className="flex items-center gap-3">
                <label className="flex-1 text-sm text-gray-700">{c.label}</label>
                <input
                  type="number" min={0} max={100}
                  value={weights[c.type]}
                  onChange={e => setWeights(w => ({ ...w, [c.type]: e.target.value }))}
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <span className="w-4 text-xs text-gray-400">%</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
            <span className={`text-xs font-medium ${total === 100 ? 'text-gray-600' : 'text-amber-600'}`}>
              Total: {total}%{total === 100 ? '' : ' (applied relatively)'}
            </span>
            <div className="flex gap-2">
              {enabled && (
                <Button size="sm" variant="secondary" onClick={() => save(true)} loading={saving}>
                  Use flat average
                </Button>
              )}
              <Button size="sm" onClick={() => save(false)} loading={saving}>Save weighting</Button>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
      )}
    </div>
  )
}
