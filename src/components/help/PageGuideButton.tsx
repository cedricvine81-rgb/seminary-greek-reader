'use client'

import { usePathname } from 'next/navigation'
import { HelpCircle } from 'lucide-react'
import { openPageGuide } from '@/lib/page-guide-bus'
import { guideForPath } from '@/lib/page-guides'

/**
 * Header trigger for the page guide, beside the search icon. Hides itself on pages that have
 * no guide (settings, dashboards, the marketing pages) rather than opening an empty panel —
 * so its presence is itself the signal that there is something to read.
 *
 * The pathname alone decides visibility: every Exegesis tab has a guide, so the query string
 * (which the button cannot observe — see PageGuideProvider) never changes the answer.
 */
export function PageGuideButton() {
  const pathname = usePathname()
  if (!guideForPath(pathname ?? '/', '')) return null

  return (
    <button
      onClick={() => openPageGuide()}
      title="About this page"
      aria-label="About this page"
      className="hidden md:inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-brand-700 hover:bg-brand-50 transition-colors"
    >
      <HelpCircle size={18} />
    </button>
  )
}

/**
 * The same entry as a row inside the account menu, for phones and tablets where the header
 * button is hidden — mirroring how search is offered in both places.
 */
export function PageGuideMenuItem({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  if (!guideForPath(pathname ?? '/', '')) return null

  return (
    <button
      onClick={() => { onNavigate?.(); openPageGuide() }}
      className="md:hidden flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
    >
      <HelpCircle size={15} className="text-gray-400 shrink-0" /> About this page
    </button>
  )
}
