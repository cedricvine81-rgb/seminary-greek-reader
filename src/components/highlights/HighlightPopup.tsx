'use client'
import type { HighlightColor } from '@/lib/highlight-colors'
import { HighlightSwatches } from './HighlightSwatches'
import type { HighlightPopupState } from './useHighlightSelection'

/** Floating highlighter popup for a multi-word drag-selection (or a clicked highlight):
 *  creates a new highlight or edits/removes an existing one. Uses the same card shape and
 *  swatch row as the app's other popovers (see HighlightSwatches). */
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
        className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 shadow-2xl"
        style={{ left: state.x, top: state.y - 8 }}
      >
        <HighlightSwatches
          activeColor={state.kind === 'edit' ? state.color : null}
          onPick={onPick}
          onRemove={onRemove}
        />
      </div>
    </>
  )
}
