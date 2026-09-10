'use client'

import { useEffect, useState } from 'react'

/**
 * Does this device have a pointer that can actually hover?
 *
 * Hover menus have no way in on a touch screen: there is no "before the tap" for a pointer to
 * arrive in, so a menu that opens on mouseenter either never opens or opens on the tap that was
 * meant to follow the link. Gate on this rather than on a WIDTH breakpoint — an iPad in
 * landscape is 1194px wide and has no hover at all, so a `md:`/`lg:` gate lets the hover menu
 * through to exactly the device that cannot use it.
 *
 * `pointer: fine` as well as `hover: hover`, because a TV remote or an eye tracker reports
 * `hover: hover` with a coarse pointer and drives cascading fly-outs no better than a finger.
 *
 * Reads false on the server and on the first client render, then corrects after mount: the
 * media query does not exist server-side, and rendering a different tree on the first pass is
 * a hydration mismatch. Callers must therefore treat false as "not yet known to hover", which
 * is safe in the direction that matters — a hover menu that is briefly unavailable is nothing,
 * where a hover menu briefly attached to a touch device is the bug being fixed.
 *
 * Live-updating rather than read once, because an iPad gains a fine pointer the moment its
 * Magic Keyboard is attached, and should get the richer menu without a reload.
 */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFine(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return fine
}
