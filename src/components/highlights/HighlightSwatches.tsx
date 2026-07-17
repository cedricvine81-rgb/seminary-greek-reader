'use client'
import { useState } from 'react'
import { Trash2, Copy, Check } from 'lucide-react'
import { HIGHLIGHT_COLORS, HIGHLIGHT_COLOR_KEYS, type HighlightColor } from '@/lib/highlight-colors'
import { copyText } from '@/lib/copy-text'

// Shared highlighter color row — used by both the drag-selection popup and the top of the
// right-click word menus, so highlighting looks identical everywhere. When `activeColor` is
// set the matching swatch is ringed. A remove (eraser) control is shown whenever `onRemove`
// is provided, so a highlight can always be cleared from the palette. When `copyValue` is
// provided, a copy button copies that text (the dragged/highlighted selection) to the clipboard.
export function HighlightSwatches({ activeColor, onPick, onRemove, copyValue }: {
  activeColor?: string | null
  onPick: (color: HighlightColor) => void
  onRemove?: () => void
  copyValue?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!copyValue) return
    const ok = await copyText(copyValue)
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1200) }
  }

  return (
    <div className="flex items-center gap-1.5">
      {HIGHLIGHT_COLOR_KEYS.map(c => (
        <button
          key={c}
          type="button"
          title={HIGHLIGHT_COLORS[c].label}
          onClick={() => onPick(c)}
          className={`h-6 w-6 rounded-full ${HIGHLIGHT_COLORS[c].swatch} transition-shadow hover:ring-2 hover:ring-offset-1 hover:ring-gray-400 ${
            activeColor === c ? 'ring-2 ring-offset-1 ring-gray-500' : ''}`}
        />
      ))}
      {copyValue != null && copyValue.trim() !== '' && (
        <button
          type="button"
          title={copied ? 'Copied!' : 'Copy text'}
          onClick={copy}
          className={`ml-0.5 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
            copied ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:bg-brand-50 hover:text-brand-700'}`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          title="Remove highlight"
          onClick={onRemove}
          className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}
