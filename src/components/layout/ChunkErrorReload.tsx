'use client'
import { useEffect } from 'react'

// Recover from a deploy pulling the JS out from under an open tab.
//
// Every production deploy renames the hashed chunk files. A tab opened before the deploy
// still holds the old manifest, so the first link click that needs a not-yet-loaded chunk
// requests a file that no longer exists — the router throws ChunkLoadError and from then on
// every <Link> and menu item silently does nothing until the user hard-reloads. Students hit
// this as "the header menu stopped working"; it looks like a bug in whatever page they were
// on, when it's really version skew.
//
// The fix is the reload the user would do by hand, done once, automatically. A one-shot
// sessionStorage latch stops a reload loop if the failure is anything other than skew
// (offline, adblock): the second failure inside a minute surfaces normally instead.
const LATCH = 'sg-chunk-reload'

function isChunkError(msg: string): boolean {
  return /ChunkLoadError|Loading chunk .* failed|error loading dynamically imported module|Importing a module script failed/i.test(msg)
}

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(LATCH) ?? 0)
    if (Date.now() - last < 60_000) return   // just tried — don't loop
    sessionStorage.setItem(LATCH, String(Date.now()))
  } catch { /* storage unavailable — still better to reload than stay wedged */ }
  window.location.reload()
}

export function ChunkErrorReload() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (isChunkError(e.message ?? '')) reloadOnce()
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason
      const msg = typeof r === 'string' ? r : (r?.message ?? String(r ?? ''))
      const name = r?.name ?? ''
      if (name === 'ChunkLoadError' || isChunkError(msg)) reloadOnce()
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
