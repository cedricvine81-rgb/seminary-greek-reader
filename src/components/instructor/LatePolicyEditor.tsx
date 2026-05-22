'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { CheckCircle2 } from 'lucide-react'

interface LatePolicyEditorProps {
  assignmentId: string
  initialAllowLate: boolean
  initialLateDaysLimit: number | null
}

export function LatePolicyEditor({
  assignmentId, initialAllowLate, initialLateDaysLimit,
}: LatePolicyEditorProps) {
  const router = useRouter()
  const [allowLate, setAllowLate] = useState(initialAllowLate)
  const [lateDaysLimit, setLateDaysLimit] = useState(initialLateDaysLimit ?? 7)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch(`/api/assignments/${assignmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowLate, lateDaysLimit: allowLate ? lateDaysLimit : null }),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={allowLate}
          onChange={e => { setAllowLate(e.target.checked); setSaved(false) }}
          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-gray-700">Allow students to submit after the due date</span>
      </label>

      {allowLate && (
        <div className="pl-7 space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Deadline (days after due date)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={365}
              value={lateDaysLimit}
              onChange={e => { setLateDaysLimit(Number(e.target.value)); setSaved(false) }}
              className="input w-28"
            />
            <span className="text-sm text-gray-500">
              {lateDaysLimit === 0 ? 'No time limit — accept indefinitely' : 'days after due date'}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button size="sm" onClick={handleSave} loading={saving}>Save</Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 size={14} /> Saved
          </span>
        )}
      </div>
    </div>
  )
}
