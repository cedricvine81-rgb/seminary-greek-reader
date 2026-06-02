'use client'
import { useState } from 'react'
import { BookOpen } from 'lucide-react'

export function GradebookToggleButton({ detailsId }: { detailsId: string }) {
  const [open, setOpen] = useState(false)

  function toggle() {
    const el = document.getElementById(detailsId) as HTMLDetailsElement | null
    if (!el) return
    el.open = !el.open
    setOpen(el.open)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
    >
      <BookOpen size={14} />
      {open ? 'Hide Gradebook' : 'View Gradebook'}
    </button>
  )
}
