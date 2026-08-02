'use client'

import Link from 'next/link'
import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Library, ChevronLeft, Map } from 'lucide-react'
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
  const [sub, setSub] = useState<{ author: string; works: CatalogWork[]; top: number; left: number; rowTop: number; rowBottom: number } | null>(null)
  const booksRef = useRef<HTMLDivElement>(null)
  // The author flyout opens level with the hovered category row and is lifted only as far as it
  // must be to stay on screen — never so far that it stops covering that row, since reaching it
  // means moving the pointer straight sideways. `up` is how far it has been lifted (it is
  // positioned relative to the row); `rowTop`/`rowBottom` are kept so the layout effect below
  // can place it once its real height is known.
  const [fly, setFly] = useState<{ up: number; rowTop: number; rowBottom: number }>({ up: 0, rowTop: 0, rowBottom: 0 })
  const authorsRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openNow = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true) }
  // Small delay so moving the mouse across the tiny gap into a sub-panel doesn't close it.
  const closeSoon = () => { closeTimer.current = setTimeout(() => { setOpen(false); setCat(null); setSub(null) }, 160) }
  const close = () => { setOpen(false); setCat(null); setSub(null) }

  function openAuthors(catId: string, works: CatalogWork[], rowEl: HTMLElement) {
    setCat(catId); setSub(null)
    const r = rowEl.getBoundingClientRect()
    setFly({ up: 0, rowTop: r.top, rowBottom: r.bottom })   // measured and lifted below
  }

  // Same story as the book flyout: this used to guess its height at 34px an author and lift
  // itself by the shortfall, which is wrong the moment the guess is — and it is what leaves the
  // last author of a long category (Xenophon, in Greco-Roman) sitting under the bottom edge of
  // the window. Measure instead, and lift only as far as two limits allow: the panel must not
  // run off the bottom, and its own bottom must not rise above the category row it belongs to.
  useLayoutEffect(() => {
    const el = authorsRef.current
    if (!cat || !el) return
    const h = el.offsetHeight
    const needed = Math.max(0, fly.rowTop + h - (window.innerHeight - 12))
    const limit = Math.max(0, Math.min(h - (fly.rowBottom - fly.rowTop), fly.rowTop - 8))
    const up = Math.min(needed, limit)
    if (Math.abs(up - fly.up) > 1) setFly(f => ({ ...f, up }))
  }, [cat, fly])

  const BOOKS_W = 240

  function openBooks(author: string, works: CatalogWork[], el: HTMLElement) {
    const r = el.getBoundingClientRect()
    const left = r.left >= BOOKS_W + 20 ? r.left - BOOKS_W - 4 : r.right + 4  // left if room, else right
    // Open level with the row; useLayoutEffect below moves it once its real height is known.
    setSub({ author, works, top: Math.max(8, r.top), left, rowTop: r.top, rowBottom: r.bottom })
  }

  // The flyout MUST overlap the author's own row, because the only way into it is a straight
  // sideways move: go up or down to reach it and you cross another author, which swaps it out
  // from under the pointer.
  //
  // Two earlier attempts got this wrong by guessing the height. Estimating 34px a row and
  // flipping the panel up when it ran past the bottom threw Pausanias' books ~300px above the
  // cursor, because "Description of Greece (Book 10)" wraps in a 240px panel. Raising a cramped
  // panel by a fixed amount then broke the opposite case: Xenophon has four books, so its panel
  // is shorter than the rise and floated clear off the top of its row.
  //
  // So measure it. The panel's height is fixed (it scrolls at 100vh), so one pass settles it:
  // put it on screen, but never let its bottom rise above the row's bottom.
  useLayoutEffect(() => {
    const el = booksRef.current
    if (!sub || !el) return
    const h = el.offsetHeight
    let top = Math.min(sub.rowTop, window.innerHeight - 12 - h)
    top = Math.max(top, sub.rowBottom - h)
    top = Math.max(8, top)
    if (Math.abs(top - sub.top) > 1) setSub(prev => (prev ? { ...prev, top } : prev))
  }, [sub])

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
            {/* The map is built from these same texts (scripts/build-places.py), so it belongs
                with them rather than as another top-level nav item. */}
            <Link href="/map" onClick={close} onMouseEnter={() => { setCat(null); setSub(null) }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
              <Map size={14} className="text-gray-400" /> Map of places
            </Link>
            <div className="my-1 border-t border-gray-100" />
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
                    {/* Capped to the viewport, NOT to the space below its top: the layout effect
                        measures this element, so its height must not depend on where it sits. */}
                    <div ref={authorsRef}
                      className="w-64 overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-lg py-1"
                      style={{ maxHeight: 'calc(100vh - 24px)' }}>
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
          {/* Capped to the viewport, NOT to the space below `top`: the layout effect above
              measures this element, so its height must not depend on where it has been put. */}
          <div ref={booksRef}
            className="overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-lg py-1"
            style={{ maxHeight: 'calc(100vh - 24px)' }}>
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
