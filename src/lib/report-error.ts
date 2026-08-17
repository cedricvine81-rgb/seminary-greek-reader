/**
 * Report a caught render error to /api/client-error, so it reaches the admin Errors page.
 *
 * THE GAP THIS CLOSES. A page that throws while rendering is caught by its error.tsx
 * boundary, which shows "Something went wrong" and an Error ID. That path reaches NEITHER
 * of the two monitoring hooks: `logError` only runs inside API-route catch blocks, and a
 * boundary swallows the error before `window.onerror` ever sees it. Two students hit
 * exactly this on 2026-08-17 — the app told them something failed while the error log
 * stayed empty, and the only clue was a digest with no message behind it.
 *
 * For a server-rendered error React gives the client only `digest` (the message is on the
 * server, in the platform log). Sending the digest is still worth it: it records WHICH page
 * failed, for WHOM, and WHEN, and the digest correlates with the hosting provider's log.
 */
export function reportRenderError(scope: string, error: Error & { digest?: string }) {
  try {
    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        scope,
        // A server error arrives message-less; say so plainly rather than logging "undefined".
        message: error?.message
          ? String(error.message).slice(0, 500)
          : `Server render error (digest ${error?.digest ?? 'none'})`,
        stack: error?.stack?.slice(0, 4000),
        url: typeof location !== 'undefined' ? location.pathname + location.search : undefined,
        digest: error?.digest,
      }),
    }).catch(() => {})
  } catch {
    // Reporting must never make a broken page worse.
  }
}
