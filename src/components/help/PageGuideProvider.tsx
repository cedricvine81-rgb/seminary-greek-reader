'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { registerPageGuide } from '@/lib/page-guide-bus'
import { guideById, guideForPath } from '@/lib/page-guides'
import { PageGuidePanel } from './PageGuidePanel'
import { isExamLocked } from '@/lib/exam-lockdown'

/**
 * Mounted once in the root layout. Routes the header "?" button (and the panel's own
 * cross-links) to the page guide panel — the same arrangement as MasterSearchProvider.
 *
 * The guide for the CURRENT page is resolved at open time from the live URL rather than from
 * Next's useSearchParams, because ExegesisTabs publishes its active tab with
 * history.replaceState, which useSearchParams does not observe. Reading window.location when
 * the panel opens gets the right answer; the panel then lets you browse the other guides
 * without navigating.
 *
 * Disabled during a lockdown exam, like search — the header is hidden there anyway, but the
 * bus has other callers.
 */
export function PageGuideProvider() {
  const pathname = usePathname()
  const [openId, setOpenId] = useState<string | null>(null)

  const doOpen = useCallback((guideId?: string) => {
    if (isExamLocked()) return
    if (guideId) { setOpenId(guideId); return }
    const search = typeof window !== 'undefined' ? window.location.search : ''
    const guide = guideForPath(pathname ?? '/', search)
    if (guide) setOpenId(guide.id)
  }, [pathname])

  useEffect(() => {
    registerPageGuide(doOpen)
    return () => registerPageGuide(null)
  }, [doOpen])

  // A page with no guide should not keep a stale panel open behind a navigation.
  useEffect(() => { setOpenId(null) }, [pathname])

  if (!openId) return null
  const guide = guideById(openId)
  if (!guide) return null
  return <PageGuidePanel guide={guide} onClose={() => setOpenId(null)} />
}
