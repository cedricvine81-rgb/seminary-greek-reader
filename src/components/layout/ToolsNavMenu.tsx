'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  { href: '/tools/register', key: 'tools.register' },
]

export function ToolsNavMenu() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Portalled + fixed for the same reason as the Texts menu: the nav's overflow-x-auto
  // clips any in-flow dropdown at its bottom edge, so the panel must escape to <body>.
  const wrapRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<{ top: number; right: number }>({ top: 0, right: 0 })

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    const r = wrapRef.current?.getBoundingClientRect()
    if (r) setAnchor({ top: r.bottom, right: Math.max(8, window.innerWidth - r.right) })
    setOpen(true)
  }
  // Small delay so crossing the gap into the panel doesn't close it — as in the Texts menu.
  const closeSoon = () => { closeTimer.current = setTimeout(() => setOpen(false), 160) }

  return (
    <div ref={wrapRef} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        title={t('nav.tools')}
        href="/tools"
        className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5"
      >
        <Wrench size={18} /> <span className="hidden xl:inline">{t('nav.tools')}</span>
      </Link>

      {/* Desktop hover menu only — pt-1 keeps the panel hover-connected across the gap.
          Outside the wrapper via the portal, so it carries its own enter/leave handlers. */}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="hidden md:block fixed pt-1 z-50" style={{ top: anchor.top, right: anchor.right }}
          onMouseEnter={openNow} onMouseLeave={closeSoon}>
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
        </div>,
        document.body,
      )}
    </div>
  )
}
