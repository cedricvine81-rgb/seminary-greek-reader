'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { consumeScrollRestore } from '@/lib/scroll-restore'

// Mounted once in the root layout. When a route becomes active (e.g. after "Return to page"
// navigates back), restores the scroll snapshot taken when the search was launched — so the
// user lands exactly where they were. No-op unless a restore was armed for this URL.
export function ScrollRestorer() {
  const pathname = usePathname()
  useEffect(() => {
    // Key on the full URL (pathname + search) — the same key snapshotScroll used on the way out.
    consumeScrollRestore(window.location.pathname + window.location.search)
  }, [pathname])
  return null
}
