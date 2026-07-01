'use client'
import { useEffect, useState } from 'react'

/**
 * Render a timestamp in the *viewer's* local timezone. Date-fns `format()` in a
 * server component runs in the server's zone (UTC on Vercel), which makes times
 * look shifted by the viewer's offset. Formatting in the browser fixes that.
 * The value is filled after mount (with suppressHydrationWarning) so SSR/client
 * never disagree.
 */
export function LocalDateTime({ iso, withTime = true }: { iso: string; withTime?: boolean }) {
  const [text, setText] = useState('')
  useEffect(() => {
    // NB: dateStyle/timeStyle can't be combined with timeZoneName — Safari throws a
    // TypeError (Chrome tolerates it). Use explicit field options so we can still show
    // the zone. Without time, dateStyle alone is fine.
    setText(new Date(iso).toLocaleString(undefined, withTime
      ? { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }
      : { dateStyle: 'medium' }))
  }, [iso, withTime])
  return <span suppressHydrationWarning>{text || '…'}</span>
}
