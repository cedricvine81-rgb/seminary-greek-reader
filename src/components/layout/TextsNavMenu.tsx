'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Library, ChevronLeft } from 'lucide-react'
import { TEXT_CATEGORIES, groupWorksByAuthor, workTitleWithoutAuthor, type CatalogWork } from '@/lib/texts-catalog'

// The header "Texts" destination with a hover mega-menu (desktop): hovering the item opens the
// category list; hovering a category flies its AUTHORS out to the left; hovering a multi-work
// author (Plato, Homer, …) opens its BOOKS in a third panel; clicking a work opens it at
// /texts?work=<id>. On touch (no hover) the menu is hidden — tapping the item just goes to
// /texts, where the in-page menu picks a work.
//
// The books panel is rendered in a PORTAL (fixed-positioned): the author panel scrolls
// (overflow-y-auto), which also clips horizontal overflow, so an in-flow third flyout got cut
// off. Portalling to <body> escapes the clip; its side (left/right of the author) is chosen from
// the author row's measured position so it never runs off the screen edge.
export function TextsNavMenu() {
  const [open, setOpen] = useState(false)      // category list shown
  const [cat, setCat] = useState<string | null>(null)          // category whose authors show
  const [sub, setSub] = useState<{ author: string; works: CatalogWork[]; top: number; left: number } | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openNow = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true) }
  // Small delay so moving the mouse across the tiny gap into a sub-panel doesn't close it.
  const closeSoon = () => { closeTimer.current = setTimeout(() => { setOpen(false); setCat(null); setSub(null) }, 160) }
  const close = () => { setOpen(false); setCat(null); setSub(null) }

  const BOOKS_W = 240
  function openBooks(author: string, works: CatalogWork[], el: HTMLElement) {
    const r = el.getBoundingClientRect()
    const left = r.left >= BOOKS_W + 20 ? r.left - BOOKS_W - 4 : r.right + 4  // left if room, else right
    setSub({ author, works, top: r.top, left })
  }

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        href="/texts"
        className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5"
      >
        <Library size={18} /> <span className="hidden md:inline">Texts</span>
      </Link>

      {/* Desktop hover menu only — pt-1 keeps the panel hover-connected across the gap. */}
      {open && (
        <div className="hidden md:block absolute right-0 top-full pt-1 z-50">
          <div className="w-56 rounded-xl border border-gray-200 bg-popover shadow-lg py-1">
            {TEXT_CATEGORIES.map(c => (
              <div key={c.id} className="relative" onMouseEnter={() => { setCat(c.id); setSub(null) }}>
                <div
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm ${
                    c.comingSoon ? 'text-gray-300'
                    : `cursor-default ${cat === c.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}`}
                >
                  {!c.comingSoon && <ChevronLeft size={14} className="text-gray-300" />}
                  <span className="flex-1">{c.label}{c.comingSoon && <span className="ml-1.5 text-[10px] text-gray-300">soon</span>}</span>
                </div>

                {/* Author list, flown out to the left of the hovered category. */}
                {cat === c.id && !c.comingSoon && (
                  <div className="absolute right-full top-0 pr-1">
                    <div className="w-64 max-h-[75vh] overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-lg py-1">
                      {groupWorksByAuthor(c.works).map(g => g.author ? (
                        <div key={g.author} onMouseEnter={e => openBooks(g.author!, g.works, e.currentTarget)}>
                          <div className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-default ${
                            sub?.author === g.author ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}>
                            <ChevronLeft size={14} className="text-gray-300" />
                            <span className="flex-1">{g.author}</span>
                          </div>
                        </div>
                      ) : (
                        <Link key={g.works[0].id} href={`/texts?work=${encodeURIComponent(g.works[0].id)}`} onClick={close}
                          className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                          {g.works[0].name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Books for the hovered author — portalled so the author panel's overflow can't clip it. */}
      {open && sub && typeof document !== 'undefined' && createPortal(
        <div className="fixed z-[60]" style={{ top: sub.top, left: Math.max(8, sub.left), width: BOOKS_W }}
          onMouseEnter={openNow} onMouseLeave={closeSoon}>
          <div className="max-h-[75vh] overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-lg py-1">
            {sub.works.map(w => (
              <Link key={w.id} href={`/texts?work=${encodeURIComponent(w.id)}`} onClick={close}
                className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                {workTitleWithoutAuthor(w)}
              </Link>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
