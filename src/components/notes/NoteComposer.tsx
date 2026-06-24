'use client'
import { useEffect, useRef } from 'react'
import { Bold, Italic, List, Minus, Plus } from 'lucide-react'
import { NOTE_FONT_SCALES } from '@/lib/note-prefs'

/**
 * Shared note editor: a Markdown formatting toolbar over an auto-growing textarea,
 * scaled by the global note font size. Plain-text/Markdown in, so copy-paste stays
 * clean. Used by the per-verse popover/modal and the Notes tab.
 */
export function NoteComposer({
  value, onChange, onBlur, autoFocus, fontScale, onFontScale,
  minRows = 2, maxHeight = 320, placeholder = 'Write a note…  (**bold**, *italic*, - list)',
}: {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  autoFocus?: boolean
  fontScale: number
  onFontScale?: (s: number) => void
  minRows?: number
  maxHeight?: number
  placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const grow = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }
  useEffect(grow, [value, fontScale, maxHeight])

  // Wrap the selection with inline marks, or prefix each selected line (lists).
  function apply(before: string, after = before, linePrefix?: string) {
    const el = ref.current
    if (!el) return
    const s = el.selectionStart, e = el.selectionEnd
    let next: string, caret: number
    if (linePrefix) {
      const lineStart = value.lastIndexOf('\n', s - 1) + 1
      const sel = value.slice(lineStart, e) || 'item'
      const prefixed = sel.split('\n').map(l => linePrefix + l).join('\n')
      next = value.slice(0, lineStart) + prefixed + value.slice(e)
      caret = lineStart + prefixed.length
    } else {
      const sel = value.slice(s, e) || 'text'
      next = value.slice(0, s) + before + sel + after + value.slice(e)
      caret = s + before.length + sel.length + after.length
    }
    onChange(next)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(caret, caret) })
  }

  const idx = NOTE_FONT_SCALES.indexOf(fontScale)
  const btn = 'inline-flex items-center justify-center h-6 w-6 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800'

  return (
    <div>
      <div className="flex items-center gap-0.5 mb-1">
        {/* onMouseDown preventDefault keeps the textarea selection while clicking. */}
        <button type="button" title="Bold" onMouseDown={e => e.preventDefault()} onClick={() => apply('**')} className={btn}><Bold size={13} /></button>
        <button type="button" title="Italic" onMouseDown={e => e.preventDefault()} onClick={() => apply('*')} className={btn}><Italic size={13} /></button>
        <button type="button" title="Bullet list" onMouseDown={e => e.preventDefault()} onClick={() => apply('', '', '- ')} className={btn}><List size={13} /></button>
        {onFontScale && (
          <span className="ml-auto flex items-center gap-0.5">
            <button type="button" title="Smaller text" onMouseDown={e => e.preventDefault()} disabled={idx <= 0}
              onClick={() => onFontScale(NOTE_FONT_SCALES[Math.max(0, idx - 1)])} className={`${btn} disabled:opacity-30`}><Minus size={13} /></button>
            <button type="button" title="Larger text" onMouseDown={e => e.preventDefault()} disabled={idx >= NOTE_FONT_SCALES.length - 1}
              onClick={() => onFontScale(NOTE_FONT_SCALES[Math.min(NOTE_FONT_SCALES.length - 1, idx + 1)])} className={`${btn} disabled:opacity-30`}><Plus size={13} /></button>
          </span>
        )}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onInput={grow}
        onBlur={onBlur}
        autoFocus={autoFocus}
        rows={minRows}
        placeholder={placeholder}
        style={{ fontSize: `${fontScale}rem`, maxHeight }}
        className="w-full resize-none overflow-y-auto rounded-md border border-gray-200 px-2 py-1.5 leading-snug focus:outline-none focus:ring-2 focus:ring-brand-400"
      />
    </div>
  )
}
