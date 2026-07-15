// Scroll snapshot/restore so "Return to page" lands you exactly where you were working — not
// just on the same page. The window plus any scrolled inner containers are captured when a
// search is launched (keyed by the origin URL) and re-applied when you navigate back to it.
//
// These pages scroll inner containers (the reader/texts panes), not the window, and some load
// content async, so restore retries briefly and self-corrects if the page (e.g. the reader's
// jump-to-verse) nudges the scroll — while bailing the moment you interact, so it never fights you.

const SNAP_PREFIX = 'scrollSnap:'
const PENDING_KEY = 'scrollRestorePending'

interface Snap { win: number; els: { path: string; top: number }[] }

// A stable structural selector for an element (nth-of-type chain from the root). The same page
// re-renders with the same structure on return, so the container is found again.
function cssPath(el: Element): string {
  const parts: string[] = []
  let node: Element = el
  while (node !== document.documentElement && parts.length < 25) {
    const parent: Element | null = node.parentElement
    if (!parent) break
    const tag: string = node.tagName
    const siblings: Element[] = Array.from(parent.children)
    const idx = siblings.filter((c: Element) => c.tagName === tag).indexOf(node) + 1
    parts.unshift(`${tag.toLowerCase()}:nth-of-type(${idx})`)
    node = parent
  }
  return parts.join('>')
}

// Capture the current page's scroll (window + scrolled inner containers), keyed by its URL.
export function snapshotScroll(key: string): void {
  try {
    const els: { path: string; top: number }[] = []
    document.querySelectorAll<HTMLElement>('*').forEach(el => {
      if (el.scrollTop > 0 && el.scrollHeight > el.clientHeight + 8) {
        const oy = getComputedStyle(el).overflowY
        if (oy === 'auto' || oy === 'scroll') els.push({ path: cssPath(el), top: el.scrollTop })
      }
    })
    const win = window.scrollY
    if (win === 0 && els.length === 0) { sessionStorage.removeItem(SNAP_PREFIX + key); return }
    sessionStorage.setItem(SNAP_PREFIX + key, JSON.stringify({ win, els } satisfies Snap))
  } catch { /* sessionStorage may be unavailable */ }
}

// Arm a restore for `key` — call right before navigating back to it (from the Return button).
export function markScrollRestore(key: string): void {
  try { sessionStorage.setItem(PENDING_KEY, key) } catch {}
}

// Called by the global restorer when a route becomes active. If it matches an armed snapshot,
// re-apply the scroll with brief retries (async content / jump-to-verse), aborting on interaction.
export function consumeScrollRestore(currentKey: string): void {
  let snap: Snap
  try {
    if (sessionStorage.getItem(PENDING_KEY) !== currentKey) return
    sessionStorage.removeItem(PENDING_KEY)   // one-shot
    const raw = sessionStorage.getItem(SNAP_PREFIX + currentKey)
    sessionStorage.removeItem(SNAP_PREFIX + currentKey)
    if (!raw) return
    snap = JSON.parse(raw)
  } catch { return }

  let ticks = 0
  let stop = () => {}
  const apply = () => {
    if (Math.abs(window.scrollY - snap.win) > 4) window.scrollTo(0, snap.win)
    for (const { path, top } of snap.els) {
      const el = document.querySelector<HTMLElement>(path)
      if (el && Math.abs(el.scrollTop - top) > 4) el.scrollTop = top   // only nudge when off (no flicker when stable)
    }
  }
  const onInteract = () => stop()   // the user takes over → never fight them
  const iv = setInterval(() => { apply(); if (++ticks >= 14) stop() }, 90)   // ~1.25s window
  stop = () => {
    clearInterval(iv)
    for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) window.removeEventListener(ev, onInteract)
  }
  for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) window.addEventListener(ev, onInteract, { passive: true, once: true })
  requestAnimationFrame(apply)
}
