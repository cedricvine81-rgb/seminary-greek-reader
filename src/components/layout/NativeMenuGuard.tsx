'use client'
import { useEffect } from 'react'
import { isNoteEditing } from '@/lib/note-editing'

// The app's one context-menu policy, mounted once in the root layout and running in the
// CAPTURE phase so it sees every right-click before any component does.
//
// Two rules:
//
//  1. Suppress the native OS/browser menu app-wide, so it never competes with the app's own
//     word menus (which open their own popover and already preventDefault). Editable fields
//     are exempt, so right-click paste / copy / spellcheck still work in the Notes editor,
//     translation boxes, messaging and every form.
//
//  2. While a note is being written, swallow any context menu that did not come from a mouse
//     — including stopping it reaching the components' own handlers. Handwriting with an
//     Apple Pencil means resting a hand on the screen; a resting palm is a long press, and a
//     long press is a contextmenu, so the word menu kept opening over the note. A palm is
//     indistinguishable from a deliberate long press, so the discrimination is contextual
//     (a note is open) and by input kind (not a mouse) rather than by trying to read the
//     gesture. A Bluetooth mouse on an iPad keeps working.
export function NativeMenuGuard() {
  useEffect(() => {
    // ── Long-press → contextmenu, app-wide ──────────────────────────────────────────────
    // iOS Safari never fires `contextmenu`, so every surface whose only right-click support
    // is an onContextMenu handler — search results (Greek and Hebrew), the Texts reader,
    // commentary, the phrase/exegesis panels, notes — was simply dead to touch. Two word
    // components grew their own long-press timers to cope; the rest never did.
    //
    // Rather than repeat that timer in twenty places, synthesise the event once here: a
    // press held still for 500ms dispatches a real `contextmenu` at the same point, and
    // every existing handler works unchanged. Elements that already run their own
    // long-press opt out with data-longpress-own, so they don't fire twice.
    let lpTimer: ReturnType<typeof setTimeout> | undefined
    let lpStart: { x: number; y: number; target: EventTarget | null } | null = null
    let lpFired = false

    function cancelLongPress() {
      clearTimeout(lpTimer)
      lpTimer = undefined
      lpStart = null
    }

    function onPointerDownLP(e: PointerEvent) {
      lpFired = false
      if (e.pointerType === 'mouse') return                 // a mouse has a real right-click
      const t = e.target instanceof HTMLElement ? e.target : null
      if (!t) return
      // Editable fields keep the native callout (paste / select), and anything with its own
      // long-press handles itself.
      if (t.closest('input, textarea') || t.isContentEditable) return
      if (t.closest('[data-longpress-own]')) return
      lpStart = { x: e.clientX, y: e.clientY, target: e.target }
      lpTimer = setTimeout(() => {
        if (!lpStart) return
        const { x, y, target } = lpStart
        lpFired = true
        lpStart = null
        ;(target as HTMLElement | null)?.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2,
        }))
      }, 500)
    }

    function onPointerMoveLP(e: PointerEvent) {
      // A drag is a scroll or a text selection, not a press — 10px of slop for a finger.
      if (!lpStart) return
      if (Math.abs(e.clientX - lpStart.x) > 10 || Math.abs(e.clientY - lpStart.y) > 10) cancelLongPress()
    }

    // The click iOS synthesises after a long press must not reach the page, or it lands as
    // an outside-click and closes the menu the press just opened.
    function onClickLP(e: MouseEvent) {
      if (!lpFired) return
      lpFired = false
      e.preventDefault()
      e.stopPropagation()
    }

    // `contextmenu` is a MouseEvent and carries no pointerType, so the kind of the press has
    // to be remembered from the pointerdown that produced it.
    let lastPointerType = 'mouse'
    function onPointerDown(e: PointerEvent) { lastPointerType = e.pointerType || 'mouse' }

    function onContextMenu(e: MouseEvent) {
      const t = e.target instanceof HTMLElement ? e.target : null
      // Keep the native menu inside text inputs / textareas / rich-text (contenteditable).
      if (t && (t.closest('input, textarea') || t.isContentEditable)) return
      if (isNoteEditing() && lastPointerType !== 'mouse') {
        e.preventDefault()
        // stopPropagation as well: preventDefault alone only kills the NATIVE menu, and it is
        // the app's own word menu that was landing on top of the note.
        e.stopPropagation()
        return
      }
      e.preventDefault()
    }

    document.addEventListener('pointerdown', onPointerDown, { capture: true })
    document.addEventListener('contextmenu', onContextMenu, { capture: true })
    document.addEventListener('pointerdown', onPointerDownLP, true)
    document.addEventListener('pointermove', onPointerMoveLP, true)
    document.addEventListener('pointerup', cancelLongPress, true)
    document.addEventListener('pointercancel', cancelLongPress, true)
    document.addEventListener('scroll', cancelLongPress, true)
    document.addEventListener('click', onClickLP, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, { capture: true })
      document.removeEventListener('contextmenu', onContextMenu, { capture: true })
      document.removeEventListener('pointerdown', onPointerDownLP, true)
      document.removeEventListener('pointermove', onPointerMoveLP, true)
      document.removeEventListener('pointerup', cancelLongPress, true)
      document.removeEventListener('pointercancel', cancelLongPress, true)
      document.removeEventListener('scroll', cancelLongPress, true)
      document.removeEventListener('click', onClickLP, true)
      clearTimeout(lpTimer)
    }
  }, [])
  return null
}
