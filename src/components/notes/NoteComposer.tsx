'use client'
import { useEffect, useRef } from 'react'
import { Bold, Italic, List, Minus, Plus } from 'lucide-react'
import { NOTE_FONT_SCALES } from '@/lib/note-prefs'
import { sanitizeNoteHtml } from '@/lib/note-html'

/**
 * WYSIWYG note editor: Bold/Italic/bullet-list actually format the selected text
 * (via a contentEditable surface), scaled by the global note font size. Emits
 * sanitized HTML. Uncontrolled by design — the initial HTML is set once on mount
 * so the caret never jumps while typing.
 */
export function NoteComposer({
  initialHtml, onChange, onBlur, autoFocus, fontScale, onFontScale, lineScale, minHeight = 56, maxHeight = 320,
}: {
  initialHtml: string
  onChange: (html: string) => void
  onBlur?: () => void
  autoFocus?: boolean
  fontScale: number
  onFontScale?: (s: number) => void
  lineScale?: number
  minHeight?: number
  maxHeight?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = initialHtml
    if (autoFocus) {
      el.focus()
      // place caret at the end
      const r = document.createRange(); r.selectNodeContents(el); r.collapse(false)
      const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(r)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = () => { if (ref.current) onChange(sanitizeNoteHtml(ref.current.innerHTML)) }

  function exec(cmd: string) {
    ref.current?.focus()
    // Force tag output (<b>/<i>/<u>) rather than styled spans, so it survives the note
    // sanitizer (which keeps b/strong/i/em/u/ul/ol/li and strips all attributes).
    try { document.execCommand('styleWithCSS', false, 'false') } catch { /* not supported */ }
    document.execCommand(cmd) // bold | italic | underline | insertUnorderedList
    emit()
  }

  // Standard formatting shortcuts (⌘/Ctrl + B / I / U), so users don't have to reach for
  // the toolbar. We handle them explicitly to guarantee consistent, sanitizer-safe output
  // across browsers (esp. Safari) rather than relying on contentEditable's native behavior.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return
    const cmd = { b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()]
    if (cmd) { e.preventDefault(); exec(cmd) }
  }

  const idx = NOTE_FONT_SCALES.indexOf(fontScale)
  const btn = 'inline-flex items-center justify-center h-6 w-6 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800'

  return (
    <div>
      <div className="flex items-center gap-0.5 mb-1">
        {/* onMouseDown preventDefault keeps the editor selection while clicking. */}
        <button type="button" title="Bold" onMouseDown={e => e.preventDefault()} onClick={() => exec('bold')} className={btn}><Bold size={13} /></button>
        <button type="button" title="Italic" onMouseDown={e => e.preventDefault()} onClick={() => exec('italic')} className={btn}><Italic size={13} /></button>
        <button type="button" title="Bullet list" onMouseDown={e => e.preventDefault()} onClick={() => exec('insertUnorderedList')} className={btn}><List size={13} /></button>
        {onFontScale && (
          <span className="ml-auto flex items-center gap-0.5">
            <button type="button" title="Smaller text" onMouseDown={e => e.preventDefault()} disabled={idx <= 0}
              onClick={() => onFontScale(NOTE_FONT_SCALES[Math.max(0, idx - 1)])} className={`${btn} disabled:opacity-30`}><Minus size={13} /></button>
            <button type="button" title="Larger text" onMouseDown={e => e.preventDefault()} disabled={idx >= NOTE_FONT_SCALES.length - 1}
              onClick={() => onFontScale(NOTE_FONT_SCALES[Math.min(NOTE_FONT_SCALES.length - 1, idx + 1)])} className={`${btn} disabled:opacity-30`}><Plus size={13} /></button>
          </span>
        )}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        role="textbox"
        aria-multiline
        style={{ fontSize: `${fontScale}rem`, lineHeight: lineScale, minHeight, maxHeight }}
        className="prose-notes w-full overflow-y-auto rounded-md border border-gray-300 bg-input px-2 py-1.5 leading-snug shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
      />
    </div>
  )
}
