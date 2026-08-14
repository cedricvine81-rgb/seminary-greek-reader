'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { Wrench } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'

// The header "Tools" destination with a hover menu, matching TextsNavMenu — same open/close
// timing, same panel styling, same behaviour on touch (no hover: tapping the item just goes to
// /tools, where the page itself lists them). Tools needs only one level, so there are no
// fly-outs: the whole point of the menu is that three tools which used to be buried are now
// one hover away.
//
// Titles only, exactly as the Texts menu lists its works — no icons, no descriptions. The
// landing page, which is still what a click on the header item opens, carries the descriptions
// and the live counts; a menu is for getting somewhere.
const TOOLS = [
  { href: '/themes', key: 'tools.themes' },
  { href: '/map', key: 'tools.places' },
  { href: '/search/construct', key: 'tools.construct' },
]

export function ToolsNavMenu() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openNow = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true) }
  // Small delay so crossing the gap into the panel doesn't close it — as in the Texts menu.
  const closeSoon = () => { closeTimer.current = setTimeout(() => setOpen(false), 160) }

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        title={t('nav.tools')}
        href="/tools"
        className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5"
      >
        <Wrench size={18} /> <span className="hidden xl:inline">{t('nav.tools')}</span>
      </Link>

      {/* Desktop hover menu only — pt-1 keeps the panel hover-connected across the gap. */}
      {open && (
        <div className="hidden md:block absolute right-0 top-full pt-1 z-50">
          <div className="w-56 rounded-xl border border-gray-200 bg-popover shadow-lg py-1">
            {TOOLS.map(tool => (
              <Link
                key={tool.href}
                href={tool.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                {t(tool.key)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
