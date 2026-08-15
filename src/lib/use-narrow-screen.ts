import { useEffect, useState } from 'react'

/**
 * True below Tailwind's `sm` (640px) — a phone.
 *
 * A media query in CSS cannot answer a question the RENDER needs: the vocabulary word lists
 * draw their dividers with `i % cols`, so the component has to know how many columns are
 * actually on screen. A `sm:grid-cols-2` class alone would leave those borders drawn for the
 * wrong grid.
 *
 * Starts false so the server and the first client paint agree; the effect corrects it.
 */
export function useNarrowScreen(): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return narrow
}
