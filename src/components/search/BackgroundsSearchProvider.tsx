'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import type { BgLang } from '@/lib/backgrounds-search-types'
import { registerBackgroundsSearch } from '@/lib/backgrounds-search-bus'
import { isExamLocked } from '@/lib/exam-lockdown'
import { BackgroundsSearchModal } from './BackgroundsSearchModal'

// Mounted once in the root layout. Provides (1) a global right-click "Search background
// sources for '…'" on any selected text or the word under the cursor, and (2) the shared
// results modal, which any component can also open via openBackgroundsSearch(). Disabled
// during a lockdown exam and yields to any element that already handled the right-click
// (e.g. the Greek reader's word menu, which preventDefault()s first).

const GREEK_RE = /[Ͱ-Ͽἀ-῿]/
// Letters we treat as part of a word (Latin incl. accents + combining marks, and Greek).
// Explicit ranges rather than \p{L}\p{M}, which would need the `u` flag / a newer TS target.
const WORD_CHAR_RE = /[A-Za-zÀ-ͯͰ-Ͽἀ-῿]/
const LETTER_RE = /[A-Za-zͰ-Ͽἀ-῿]/

function detectLang(s: string): BgLang { return GREEK_RE.test(s) ? 'grc' : 'en' }

// The word under the cursor, when there's no active selection.
function wordAtPoint(x: number, y: number): string | null {
  const anyDoc = document as unknown as {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  }
  let node: Node | null = null
  let offset = 0
  if (anyDoc.caretRangeFromPoint) {
    const r = anyDoc.caretRangeFromPoint(x, y)
    if (r) { node = r.startContainer; offset = r.startOffset }
  } else if (anyDoc.caretPositionFromPoint) {
    const p = anyDoc.caretPositionFromPoint(x, y)
    if (p) { node = p.offsetNode; offset = p.offset }
  }
  if (!node || node.nodeType !== Node.TEXT_NODE) return null
  const text = node.textContent ?? ''
  const isWord = (ch: string) => WORD_CHAR_RE.test(ch)
  let s = offset, e = offset
  while (s > 0 && isWord(text[s - 1])) s--
  while (e < text.length && isWord(text[e])) e++
  const word = text.slice(s, e).trim()
  return word.length >= 2 ? word : null
}

function inEditable(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null
  return !!node?.closest?.('input, textarea, [contenteditable="true"]')
}

export function BackgroundsSearchProvider() {
  const [menu, setMenu] = useState<{ x: number; y: number; term: string } | null>(null)
  const [modal, setModal] = useState<{ query: string; lang: BgLang } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const openSearch = useCallback((query: string, lang: BgLang) => setModal({ query, lang }), [])

  // Let any component open the modal.
  useEffect(() => {
    registerBackgroundsSearch(openSearch)
    return () => registerBackgroundsSearch(null)
  }, [openSearch])

  // Global right-click.
  useEffect(() => {
    function onContextMenu(e: MouseEvent) {
      if (e.defaultPrevented || isExamLocked()) return   // yield to component menus / exams
      if (inEditable(e.target)) return                   // keep the native menu in fields
      // The parsing pane is a lexical-detail readout, not a reading surface — a word search
      // from there serves no purpose, so let the native menu through instead.
      if ((e.target as HTMLElement | null)?.closest?.('[data-parsing-pane]')) return
      const selection = window.getSelection()?.toString().trim() ?? ''
      const term = selection.length >= 2 ? selection : wordAtPoint(e.clientX, e.clientY)
      if (!term || !LETTER_RE.test(term)) return
      e.preventDefault()
      setMenu({ x: e.clientX, y: e.clientY, term: term.length > 60 ? term.slice(0, 60) : term })
    }
    document.addEventListener('contextmenu', onContextMenu)
    return () => document.removeEventListener('contextmenu', onContextMenu)
  }, [])

  // Dismiss the little menu on any outside interaction.
  useEffect(() => {
    if (!menu) return
    const close = (e: Event) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(null) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null) }
    document.addEventListener('mousedown', close)
    document.addEventListener('scroll', () => setMenu(null), true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('scroll', () => setMenu(null), true)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  return (
    <>
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-[100] rounded-lg border border-gray-200 bg-popover shadow-lg py-1 text-sm"
          style={{ left: Math.min(menu.x, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 280), top: menu.y }}
        >
          <button
            onClick={() => { openSearch(menu.term, detectLang(menu.term)); setMenu(null) }}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-brand-50 text-gray-700 w-full text-left"
          >
            <Search size={14} className="text-gray-400 shrink-0" />
            <span>Search background sources for “<span className="font-medium">{menu.term}</span>”</span>
          </button>
        </div>
      )}
      <BackgroundsSearchModal
        open={!!modal}
        initialQuery={modal?.query ?? ''}
        initialLang={modal?.lang ?? 'en'}
        onClose={() => setModal(null)}
      />
    </>
  )
}
