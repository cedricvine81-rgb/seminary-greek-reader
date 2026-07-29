'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Library, ChevronLeft } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
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
  const t = useT()
  const [open, setOpen] = useState(false)      // category list shown
  const [cat, setCat] = useState<string | null>(null)          // category whose authors show
  const [sub, setSub] = useState<{ author: string; works: CatalogWork[]; top: number; left: number } | null>(null)
  // The author flyout opens level with the hovered category row, but if its list would run past
  // the bottom of the screen (a long one like Greco-Roman) it's lifted up just enough to fit —
  // short lists (Church Fathers) stay level with their row. `top` is the flyout's resulting
  // viewport top, used to cap its height so anything still too tall scrolls inside the panel.
  const [fly, setFly] = useState<{ up: number; top: number }>({ up: 0, top: 0 })
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openNow = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true) }
  // Small delay so moving the mouse across the tiny gap into a sub-panel doesn't close it.
  const closeSoon = () => { closeTimer.current = setTimeout(() => { setOpen(false); setCat(null); setSub(null) }, 160) }
  const close = () => { setOpen(false); setCat(null); setSub(null) }

  function openAuthors(catId: string, works: CatalogWork[], rowEl: HTMLElement) {
    setCat(catId); setSub(null)
    const r = rowEl.getBoundingClientRect()
    const estHeight = groupWorksByAuthor(works).length * 34 + 20   // rough natural height
    const overflow = Math.max(0, r.top + estHeight - (window.innerHeight - 12))
    const up = Math.min(overflow, Math.max(0, r.top - 8))          // never lift above 8px from top
    setFly({ up, top: r.top - up })
  }

  const BOOKS_W = 240
  function openBooks(author: string, works: CatalogWork[], el: HTMLElement) {
    const r = el.getBoundingClientRect()
    const left = r.left >= BOOKS_W + 20 ? r.left - BOOKS_W - 4 : r.right + 4  // left if room, else right
    // Open level with the author row, but if the book list would run off the bottom (an author
    // low in the list, e.g. Xenophon), open UPWARD — align the flyout's bottom with the row so
    // its last book lines up with the author.
    const estHeight = works.length * 34 + 12
    let top = r.top
    if (top + estHeight > window.innerHeight - 12) top = Math.max(8, r.bottom - estHeight)
    setSub({ author, works, top, left })
  }

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        href="/texts"
        className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5"
      >
        <Library size={18} /> <span className="hidden md:inline">{t('nav.texts')}</span>
      </Link>

      {/* Desktop hover menu only — pt-1 keeps the panel hover-connected across the gap. */}
      {open && (
        <div className="hidden md:block absolute right-0 top-full pt-1 z-50">
          <div className="w-56 rounded-xl border border-gray-200 bg-popover shadow-lg py-1">
            {TEXT_CATEGORIES.map(c => (
              <div key={c.id} className="relative" onMouseEnter={e => openAuthors(c.id, c.works, e.currentTarget)}>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
                    c.comingSoon ? 'text-gray-300'
                    : `cursor-default ${cat === c.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}`}
                >
                  <span className="flex-1">{c.label}{c.comingSoon && <span className="ml-1.5 text-[10px] text-gray-300">soon</span>}</span>
                  {!c.comingSoon && <ChevronLeft size={14} className="text-gray-300" />}
                </div>

                {/* Author list, flown out to the left of the hovered category — lifted to the top
                    of the category list (style top) and height-capped to the viewport so long
                    lists (Greco-Roman) scroll instead of running off the bottom of the screen. */}
                {cat === c.id && !c.comingSoon && (
                  <div className="absolute right-full pr-1" style={{ top: -fly.up }}>
                    <div className="w-64 overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-lg py-1"
                      style={{ maxHeight: `calc(100vh - ${fly.top + 16}px)` }}>
                      {groupWorksByAuthor(c.works).map(g => g.author ? (
                        <div key={g.author} onMouseEnter={e => openBooks(g.author!, g.works, e.currentTarget)}>
                          <div className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-default ${
                            sub?.author === g.author ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}>
                            <span className="flex-1">{g.author}</span>
                            <ChevronLeft size={14} className="text-gray-300" />
                          </div>
                        </div>
                      ) : (
                        // Lone works have no books flyout of their own, so they must also CLOSE any
                        // open one — otherwise the previous author keeps its highlight and its panel
                        // stays overlapping this row (Quintilian's 12 books sat on top of the Theon
                        // link, since they are neighbours in the Greco-Roman list).
                        <Link key={g.works[0].id} href={`/texts?work=${encodeURIComponent(g.works[0].id)}`} onClick={close}
                          onMouseEnter={() => setSub(null)}
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
