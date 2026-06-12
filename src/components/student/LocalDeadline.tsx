'use client'
import { useEffect, useState } from 'react'

/** Renders an absolute deadline in the viewer's local time, with a "Closed" state once passed. */
export function LocalDeadline({ label, iso }: { label: string; iso: string }) {
  // Re-render periodically so the "Closed" state appears without a reload
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const d = new Date(iso)
  const passed = now > d.getTime()
  const date = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  return (
    <span className={`text-xs ${passed ? 'text-gray-400' : 'text-gray-500'}`}>
      {label}: <span className={passed ? 'line-through' : ''}>{date} · {time}</span>
      {passed && <span className="ml-1 font-semibold text-amber-700">Closed</span>}
    </span>
  )
}
