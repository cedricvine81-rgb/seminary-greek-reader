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
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, { capture: true })
      document.removeEventListener('contextmenu', onContextMenu, { capture: true })
    }
  }, [])
  return null
}
