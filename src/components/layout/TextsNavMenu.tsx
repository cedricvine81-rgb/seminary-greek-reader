'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Library, ChevronLeft } from 'lucide-react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { TEXT_CATEGORIES, groupWorksByAuthor, type CatalogWork } from '@/lib/texts-catalog'
import { textCategoryLabel, textAuthorLabel } from '@/lib/i18n/text-names'
import { localizedWorkTitle, localizedWorkName } from '@/lib/i18n/text-catalog-labels'

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
//
// REACHING THE BOOKS PANEL. The panel opens beside the author's row, so anything in it other
// than the item level with that row needs a DIAGONAL move — and a diagonal crosses the authors
// above or below, each of which used to swap the panel out from under the pointer the instant
// it was entered. Xenophon made this unusable: it is the last author in Greco-Roman, so its
// panel is pushed up the screen and three rows sit between the pointer and Memorabilia Book 1.
//
// The fix is the "safe triangle" (`aimingAt` below): while a panel is open, a sibling row is
// only honoured if the pointer is NOT travelling toward that panel. Heading for it, the row is
// ignored and re-checked every AIM_RECHECK ms, so stopping or turning still selects the row —
// which means a deliberate move to another author is instant, with no timeout to sit through.
type Pt = { x: number; y: number }

// Standard barycentric sign test. Kept at module scope: it is pure geometry and has no business
// being rebuilt on every render.
const cross = (a: Pt, b: Pt, c: Pt) => (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y)
function inTriangle(p: Pt, a: Pt, b: Pt, c: Pt): boolean {
  const d1 = cross(p, a, b), d2 = cross(p, b, c), d3 = cross(p, c, a)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}

export function TextsNavMenu() {
  const t = useT()
  const locale = useLocale()
  const [open, setOpen] = useState(false)      // category list shown
  const [cat, setCat] = useState<string | null>(null)          // category whose authors show
  const [sub, setSub] = useState<{ author: string; works: CatalogWork[]; top: number; left: number; onLeft: boolean; rowTop: number; rowBottom: number } | null>(null)
  const booksRef = useRef<HTMLDivElement>(null)
  // The author flyout opens level with the hovered category row and is lifted only as far as it
  // must be to stay on screen — never so far that it stops covering that row, since reaching it
  // means moving the pointer straight sideways. `up` is how far it has been lifted (it is
  // positioned relative to the row); `rowTop`/`rowBottom` are kept so the layout effect below
  // can place it once its real height is known.
  const [fly, setFly] = useState<{ up: number; rowTop: number; rowBottom: number }>({ up: 0, rowTop: 0, rowBottom: 0 })
  const authorsRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The header nav scrolls horizontally when cramped (overflow-x-auto), and a scrollable
  // box always clips on BOTH axes — an in-flow absolute dropdown gets cut off at the nav's
  // bottom edge, invisibly. So the category panel is PORTALLED to <body> and fixed at the
  // trigger's measured position; `anchor` is that measurement, taken every time the menu
  // opens. The books flyout below portals for the same reason (its clipper is the author
  // panel's own scroll).
  const wrapRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<{ top: number; right: number }>({ top: 0, right: 0 })

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    const r = wrapRef.current?.getBoundingClientRect()
    if (r) setAnchor({ top: r.bottom, right: Math.max(8, window.innerWidth - r.right) })
    setOpen(true)
  }
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
  // The visible gap between the books panel and the author list. It is a gap in the PAINT only:
  // the panel's positioning wrapper is BOOKS_W + GAP wide and pads itself by GAP on the side
  // facing the authors, so the hoverable box runs right up to the author row's edge. Left as
  // dead space it was a 4px strip that dropped the pointer out of both panels at once, which
  // starts the 160ms close timer in the middle of a move that has not finished yet.
  const GAP = 4

  function openBooks(author: string, works: CatalogWork[], el: HTMLElement) {
    const r = el.getBoundingClientRect()
    // Left if there is room for the panel AND its bridge, else right. `left` is the wrapper's
    // edge, so it sits flush against the row; the padding is what insets the visible panel.
    const onLeft = r.left >= BOOKS_W + GAP + 20
    const left = onLeft ? r.left - BOOKS_W - GAP : r.right
    // Open level with the row; useLayoutEffect below moves it once its real height is known.
    setSub({ author, works, top: Math.max(8, r.top), left, onLeft, rowTop: r.top, rowBottom: r.bottom })
  }

  // ── Safe triangle ───────────────────────────────────────────────────────────────────────
  // A short trail of pointer samples, kept only while the menu is open. Two samples ~AIM_WINDOW
  // apart give the direction of travel; one sample cannot, and consecutive samples are too
  // jittery to aim with.
  const AIM_WINDOW = 250   // ms of pointer history the direction is taken from
  const AIM_RECHECK = 90   // ms between "are you still heading there?" re-tests
  const trail = useRef<{ x: number; y: number; t: number }[]>([])
  const aimTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelAim = () => { if (aimTimer.current) { clearTimeout(aimTimer.current); aimTimer.current = null } }

  useEffect(() => {
    if (!open) { trail.current = []; return }
    const onMove = (e: MouseEvent) => {
      const now = performance.now()
      const pts = trail.current
      pts.push({ x: e.clientX, y: e.clientY, t: now })
      // Keep the window, plus one older sample so a slow drag still has something to aim from.
      while (pts.length > 2 && now - pts[1].t > AIM_WINDOW) pts.shift()
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [open])

  /**
   * Is the pointer travelling into `rect`?
   *
   * The triangle has its apex at where the pointer WAS and its base on the near edge of the
   * panel — so it covers every path that still ends inside the panel, and narrows to nothing
   * straight up and down, which is how moving along the author list stays instant.
   *
   * A pointer that has stopped gives no direction, and answers false: parking on a row selects
   * it, which is what makes the re-check terminate.
   */
  function aimingAt(rect: DOMRect, at?: Pt): boolean {
    const pts = trail.current
    // `at` is the entering event's OWN coordinates, and passing them is not an optimisation.
    // mouseenter fires BEFORE the mousemove for the same position, so at the moment a row is
    // entered the trail's newest sample is still where the pointer was a moment ago: read the
    // current point from the trail here and it equals `prev`, the direction is unknowable, and
    // every row switches immediately — the guard silently does nothing. The re-check below has
    // no event and passes nothing, which is correct: by then the move has landed.
    const cur = at ?? pts[pts.length - 1]
    const prev = pts[0]
    if (!cur || !prev || (cur.x === prev.x && cur.y === prev.y)) return false
    const edgeX = rect.right <= cur.x ? rect.right : rect.left   // the side the pointer is on
    return inTriangle(cur, prev, { x: edgeX, y: rect.top }, { x: edgeX, y: rect.bottom })
  }

  /**
   * One gate for both kinds of sibling row: an author row opening its own books, and a lone-work
   * row closing whatever is open. Neither may fire while the pointer is on its way to the panel.
   *
   * The re-check re-runs the aim test rather than firing blindly, so a pointer that keeps
   * travelling keeps its panel however long the trip takes, while one that stalls over a row
   * gets that row about AIM_RECHECK later.
   */
  function requestSwitch(el: HTMLElement, at: Pt, apply: () => void) {
    cancelAim()
    const heading = (from?: Pt) => {
      const panel = booksRef.current?.getBoundingClientRect()
      return !!panel && aimingAt(panel, from)
    }
    // Everything the pointer did before this switch belongs to the panel being replaced, so the
    // trail restarts from where the pointer is NOW — which is the row that just won. Without
    // this, the next row's aim test measures from some position two or three moves back and
    // gets a direction that has nothing to do with the trip actually under way.
    //
    // The seed has to come from the event, not from the trail's own newest sample: mouseenter
    // runs before its mousemove, so at this instant the trail still ends at the PREVIOUS
    // position. Re-seeding from it preserves exactly the stale point this is meant to drop.
    const commit = (from: Pt) => {
      apply()
      trail.current = [{ x: from.x, y: from.y, t: performance.now() }]
    }
    const tick = () => {
      aimTimer.current = null
      // The row only keeps its claim while the pointer is still on it. Without this, crossing
      // three rows on the way to the panel would leave three pending switches, and the last
      // one would fire after the pointer had already arrived.
      if (!el.isConnected || !el.matches(':hover')) return
      if (heading()) { aimTimer.current = setTimeout(tick, AIM_RECHECK); return }
      // Here the moves HAVE landed, so the trail's newest sample is the honest position.
      commit(trail.current[trail.current.length - 1] ?? at)
    }
    if (sub && heading(at)) { aimTimer.current = setTimeout(tick, AIM_RECHECK); return }
    commit(at)
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
    <div ref={wrapRef} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        title={t('nav.texts')}
        href="/texts"
        className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5"
      >
        <Library size={18} /> <span className="hidden xl:inline">{t('nav.texts')}</span>
      </Link>

      {/* Desktop hover menu only — portalled past the nav's overflow clip (see `anchor`).
          pt-1 keeps the panel hover-connected across the gap; since the portal is outside
          the wrapper div, it needs its own enter/leave handlers to hold the menu open. */}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="hidden md:block fixed pt-1 z-50" style={{ top: anchor.top, right: anchor.right }}
          onMouseEnter={openNow} onMouseLeave={closeSoon}>
          <div className="w-56 rounded-xl border border-gray-200 bg-popover shadow-lg py-1">
            {TEXT_CATEGORIES.map(c => (
              <div key={c.id} className="relative" onMouseEnter={e => openAuthors(c.id, c.works, e.currentTarget)}>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
                    c.comingSoon ? 'text-gray-300'
                    : `cursor-default ${cat === c.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}`}
                >
                  <span className="flex-1">{textCategoryLabel(c.id, locale, c.label)}{c.comingSoon && <span className="ml-1.5 text-[10px] text-gray-300">{t('texts.comingSoon')}</span>}</span>
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
                        <div key={g.author} onMouseEnter={e => {
                          const row = e.currentTarget
                          requestSwitch(row, { x: e.clientX, y: e.clientY }, () => openBooks(g.author!, g.works, row))
                        }}>
                          <div className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-default ${
                            sub?.author === g.author ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}>
                            <span className="flex-1">{textAuthorLabel(g.author!, locale)}</span>
                            <ChevronLeft size={14} className="text-gray-300" />
                          </div>
                        </div>
                      ) : (
                        // Lone works have no books flyout of their own, so they must also CLOSE any
                        // open one — otherwise the previous author keeps its highlight and its panel
                        // stays overlapping this row (Quintilian's 12 books sat on top of the Theon
                        // link, since they are neighbours in the Greco-Roman list).
                        <Link key={g.works[0].id} href={`/texts?work=${encodeURIComponent(g.works[0].id)}`} onClick={close}
                          onMouseEnter={e => requestSwitch(e.currentTarget, { x: e.clientX, y: e.clientY }, () => setSub(null))}
                          className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                          {localizedWorkName(g.works[0], locale)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}

      {/* Books for the hovered author — portalled so the author panel's overflow can't clip it.
          The wrapper is GAP wider than the panel and pads itself on the side facing the author
          list, so its hover box touches the row and the visible gap is no longer dead space. */}
      {open && sub && typeof document !== 'undefined' && createPortal(
        <div className="fixed z-[60] box-border"
          style={{
            top: sub.top, left: Math.max(8, sub.left), width: BOOKS_W + GAP,
            paddingLeft: sub.onLeft ? 0 : GAP, paddingRight: sub.onLeft ? GAP : 0,
          }}
          onMouseEnter={() => { cancelAim(); openNow() }} onMouseLeave={closeSoon}>
          {/* Capped to the viewport, NOT to the space below `top`: the layout effect above
              measures this element, so its height must not depend on where it has been put. */}
          <div ref={booksRef}
            className="overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-lg py-1"
            style={{ maxHeight: 'calc(100vh - 24px)' }}>
            {sub.works.map(w => (
              <Link key={w.id} href={`/texts?work=${encodeURIComponent(w.id)}`} onClick={close}
                className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                {localizedWorkTitle(w, locale)}
              </Link>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
