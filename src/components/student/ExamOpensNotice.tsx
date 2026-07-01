'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Pre-exam gate shown to a student who opens a Translation Exam before its start
 * time. Displays the open time in the viewer's local zone plus a live countdown,
 * and refreshes the page automatically the moment the exam opens (so the server
 * re-renders with the exam available). Times are filled after mount, with
 * suppressHydrationWarning, so SSR (UTC) and the client never disagree.
 */
export function ExamOpensNotice({ opensAtIso }: { opensAtIso: string }) {
  const opensAt = new Date(opensAtIso).getTime()
  const [now, setNow] = useState(() => Date.now())
  const [localTime, setLocalTime] = useState('')
  const router = useRouter()

  useEffect(() => {
    setLocalTime(new Date(opensAtIso).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short', timeZoneName: 'short' }))
  }, [opensAtIso])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = opensAt - now
  const isOpen = remaining <= 0

  // The instant the countdown reaches zero, re-run the server component so the exam
  // becomes available without the student having to refresh manually. Guarded by a ref
  // so it fires exactly once, even if server/client clocks are slightly skewed.
  const refreshedRef = useRef(false)
  useEffect(() => {
    if (isOpen && !refreshedRef.current) { refreshedRef.current = true; router.refresh() }
  }, [isOpen, router])

  function fmt(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000))
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    if (d > 0) return `${d}d ${h}h ${pad(m)}m`
    if (h > 0) return `${h}h ${pad(m)}m ${pad(sec)}s`
    if (m > 0) return `${m}m ${pad(sec)}s`
    return `${sec}s`
  }

  if (isOpen) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-lg font-semibold text-emerald-800">The exam is now open.</p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Start exam
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-6 text-center">
      <div className="text-3xl mb-2">⏳</div>
      <p className="text-sm font-semibold text-brand-800">This exam isn&rsquo;t open yet</p>
      <p className="mt-3 text-4xl font-bold tabular-nums text-brand-800" suppressHydrationWarning>{fmt(remaining)}</p>
      <p className="mt-2 text-sm text-brand-700" suppressHydrationWarning>Opens {localTime || '…'}</p>
      <p className="mt-3 text-xs text-brand-500">Keep this page open — it will start the exam automatically when the time arrives.</p>
    </div>
  )
}
