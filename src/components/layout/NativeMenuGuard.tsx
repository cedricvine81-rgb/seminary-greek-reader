'use client'
import { useEffect } from 'react'

// Suppresses the native OS/browser right-click menu app-wide so it never competes with the
// app's own word / right-click menus (which open their own popover and already preventDefault).
// Mounted once in the root layout. Editable fields are exempt so right-click paste / copy /
// spellcheck still work in the Notes editor, translation boxes, messaging, and every form.
// Runs in the capture phase so it fires even if an element stops the event from bubbling.
export function NativeMenuGuard() {
  useEffect(() => {
    function onContextMenu(e: MouseEvent) {
      const t = e.target instanceof HTMLElement ? e.target : null
      // Keep the native menu inside text inputs / textareas / rich-text (contenteditable).
      if (t && (t.closest('input, textarea') || t.isContentEditable)) return
      e.preventDefault()
    }
    document.addEventListener('contextmenu', onContextMenu, { capture: true })
    return () => document.removeEventListener('contextmenu', onContextMenu, { capture: true })
  }, [])
  return null
}
