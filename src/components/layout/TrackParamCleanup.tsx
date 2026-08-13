'use client'
import { useEffect } from 'react'

/**
 * Remove ?track= from the address bar after the middleware has turned it into the cookie.
 *
 * The middleware used to strip it with a redirect, which cost a whole extra round trip on
 * every arrival from seminaryhebrew.app. It now sets the cookie and renders; this tidies the
 * URL afterwards, so the parameter cannot be re-applied by a back-navigation or copied into
 * a shared link. history.replaceState, so no navigation and no entry in the back stack.
 */
export function TrackParamCleanup() {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('track')) return
    url.searchParams.delete('track')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  }, [])
  return null
}
