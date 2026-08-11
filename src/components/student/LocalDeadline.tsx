'use client'
import { useEffect, useState } from 'react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'

/** Renders an absolute deadline in the viewer's local time, with a "Closed" state once passed. */
export function LocalDeadline({ label, iso }: { label: string; iso: string }) {
  const t = useT()
  const locale = useLocale()
  // Re-render periodically so the "Closed" state appears without a reload
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const d = new Date(iso)
  const passed = now > d.getTime()
  // The interface locale rather than the browser's: a student reading the app in Spanish gets a
  // Spanish date even on a machine set to English. The ZONE stays local — the whole point of
  // this component is when the deadline falls where the student is.
  const date = d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })

  return (
    <span className={`text-xs ${passed ? 'text-gray-400' : 'text-gray-500'}`}>
      {label}: <span className={passed ? 'line-through' : ''}>{date} · {time}</span>
      {passed && <span className="ml-1 font-semibold text-amber-700">{t('deadline.closed')}</span>}
    </span>
  )
}
