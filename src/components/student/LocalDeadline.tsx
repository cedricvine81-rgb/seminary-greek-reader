'use client'
import { useEffect, useState } from 'react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { useMounted } from '@/lib/useMounted'

/** Renders an absolute deadline in the viewer's local time, with a "Closed" state once passed. */
export function LocalDeadline({ label, iso }: { label: string; iso: string }) {
  const t = useT()
  const locale = useLocale()
  // This whole component is viewer-dependent: it deliberately formats in the LOCAL zone (no
  // timeZone pin), which the server cannot know — so it renders nothing time-shaped until it
  // is in a browser. Formatting during render made the server send a UTC time and the browser
  // draw a local one, which is a hydration mismatch on the two busiest student pages.
  const mounted = useMounted()
  // Re-render periodically so the "Closed" state appears without a reload
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const d = new Date(iso)
  const passed = now > d.getTime()
  if (!mounted) {
    // Same element and classes as below, so the swap costs no layout shift.
    return <span className="text-xs text-gray-500" suppressHydrationWarning>{label}: …</span>
  }
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
