'use client'
import { Trash2 } from 'lucide-react'
import { HIGHLIGHT_COLORS, HIGHLIGHT_COLOR_KEYS, type HighlightColor } from '@/lib/highlight-colors'
import type { HighlightPopupState } from './useHighlightSelection'

/** Floating color-swatch popup used for both creating a new highlight and editing/removing
 *  an existing one — positioned at the selection (or clicked highlight)'s location. */
export function HighlightPopup({ state, onPick, onRemove, onClose }: {
  state: HighlightPopupState
  onPick: (color: HighlightColor) => void
  onRemove: () => void
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 -translate-x-1/2 -translate-y-full flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-lg"
        style={{ left: state.x, top: state.y - 8 }}
      >
        {HIGHLIGHT_COLOR_KEYS.map(c => (
          <button
            key={c}
            type="button"
            title={HIGHLIGHT_COLORS[c].label}
            onClick={() => onPick(c)}
            className={`h-6 w-6 rounded-full ${HIGHLIGHT_COLORS[c].swatch} hover:ring-2 hover:ring-offset-1 hover:ring-gray-400 transition-shadow`}
          />
        ))}
        {state.kind === 'edit' && (
          <button
            type="button"
            title="Remove highlight"
            onClick={onRemove}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </>
  )
}
