'use client'
import { useEffect } from 'react'

// Ships uncaught browser errors to /api/client-error, where they land in the ErrorLog the
// admin Errors page reads. Mounted once in the root layout.
//
// Deliberately conservative: at most 5 reports per page load, each error signature sent
// once, and the two classic non-errors are ignored — "Script error." (an opaque signal
// from a cross-origin script, carrying no information) and ResizeObserver's benign loop
// warning. `keepalive` lets a report survive the navigation that often follows a crash.
export function ClientErrorReporter() {
  useEffect(() => {
    let sent = 0
    const seen = new Set<string>()

    function report(scope: string, message: string, stack?: string) {
      if (sent >= 5) return
      if (!message || message === 'Script error.') return
      if (message.includes('ResizeObserver loop')) return
      const key = `${scope}|${message}`
      if (seen.has(key)) return
      seen.add(key)
      sent++
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          scope,
          message: message.slice(0, 500),
          stack: stack?.slice(0, 4000),
          url: location.pathname + location.search,
        }),
      }).catch(() => {})
    }

    const onError = (e: ErrorEvent) =>
      report('window.onerror', e.message, e.error instanceof Error ? e.error.stack : undefined)
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason
      report('unhandledrejection',
        r instanceof Error ? r.message : String(r ?? 'unknown'),
        r instanceof Error ? r.stack : undefined)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return null
}
