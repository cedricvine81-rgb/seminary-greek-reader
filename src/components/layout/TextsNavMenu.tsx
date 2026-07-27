'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { Library, ChevronLeft } from 'lucide-react'
import { TEXT_CATEGORIES, groupWorksByAuthor, workTitleWithoutAuthor } from '@/lib/texts-catalog'

// The header "Texts" destination with a hover mega-menu (desktop): hovering the item opens the
// category list; hovering a category flies its works out to the RIGHT; clicking a work opens it
// at /texts?work=<id>. On touch (no hover) the menu is hidden — tapping the item just goes to
// /texts, where the in-page menu picks a work. Sits between Exegesis and Dashboard in AppHeader.
export function TextsNavMenu() {
  const [open, setOpen] = useState(false)      // category list shown
  const [cat, setCat] = useState<string | null>(null)  // category whose works fly out
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openNow = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true) }
  // Small delay so moving the mouse across the tiny gap into the panel doesn't close it.
  const closeSoon = () => { closeTimer.current = setTimeout(() => { setOpen(false); setCat(null) }, 140) }

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
              <div key={c.id} className="relative" onMouseEnter={() => setCat(c.id)}>
                <div
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm ${
                    c.comingSoon ? 'text-gray-300'
                    : `cursor-default ${cat === c.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}`}
                >
                  {!c.comingSoon && <ChevronLeft size={14} className="text-gray-300" />}
                  <span className="flex-1">{c.label}{c.comingSoon && <span className="ml-1.5 text-[10px] text-gray-300">soon</span>}</span>
                </div>

                {/* Works fly out to the LEFT of the hovered category — the "Texts" item sits on
                    the right of the header, so opening rightward ran the panel off-screen
                    (notably on iPad). Works are gathered by author (Plato, Aristotle, …). */}
                {cat === c.id && !c.comingSoon && (
                  <div className="absolute right-full top-0 pr-1">
                    <div className="w-60 max-h-[75vh] overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-lg py-1">
                      {groupWorksByAuthor(c.works).map((g, gi) => (
                        <div key={g.author ?? g.works[0].id} className={gi > 0 && g.author ? 'mt-1 border-t border-gray-100 pt-1' : ''}>
                          {g.author && (
                            <div className="px-3 pt-0.5 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                              {g.author}
                            </div>
                          )}
                          {g.works.map(w => (
                            <Link
                              key={w.id}
                              href={`/texts?work=${encodeURIComponent(w.id)}`}
                              onClick={() => { setOpen(false); setCat(null) }}
                              className={`block py-1.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors ${g.author ? 'pl-5 pr-3' : 'px-3'}`}
                            >
                              {g.author ? workTitleWithoutAuthor(w) : w.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
