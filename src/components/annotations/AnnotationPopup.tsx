'use client'
import { useEffect, useRef, useState } from 'react'
import { Trash2, Maximize2 } from 'lucide-react'
import { HighlightSwatches } from '@/components/highlights/HighlightSwatches'
import { useT } from '@/lib/i18n/LocaleProvider'
import { setNoteEditing } from '@/lib/note-editing'
import type { HighlightColor } from '@/lib/highlight-colors'

/**
 * The little card that opens over a selection or an existing annotation: colour row, a note
 * box, and delete. Positioned in fixed coordinates from the caller's caret rect, and nudged
 * back inside the viewport — the last paragraph of a chapter is near the bottom of the
 * screen, which is exactly where an un-nudged popover opens off it.
 */
export function AnnotationPopup({ x, y, color, body, canDelete, onColor, onSave, onDelete, onClose, onExpand }: {
  x: number
  y: number
  color: string
  body: string
  canDelete: boolean
  onColor: (c: HighlightColor) => void
  onSave: (body: string) => void
  onDelete: () => void
  onClose: () => void
  /** Open the full note pane — the surface handwriting needs. Absent until the annotation
   *  exists, since the pane edits a saved note. */
  onExpand?: () => void
}) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState(body)
  const [pos, setPos] = useState({ left: x, top: y })

  useEffect(() => { setDraft(body) }, [body])

  useEffect(() => { setNoteEditing(true); return () => setNoteEditing(false) }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const pad = 8
    const left = Math.min(Math.max(pad + r.width / 2, x), window.innerWidth - r.width / 2 - pad)
    // Prefer above the selection; flip below when there isn't room.
    const top = y - r.height - 10 < pad ? y + 22 : y - r.height - 10
    setPos({ left, top })
  }, [x, y, draft.length === 0])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) { onSave(draft); onClose() }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      // Cmd/Ctrl+Enter saves and closes — the note box needs plain Enter for new lines.
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { onSave(draft); onClose() }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [draft, onSave, onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 -translate-x-1/2 rounded-xl border border-gray-200 bg-popover p-3 shadow-lg"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="flex items-center justify-between gap-2">
        <HighlightSwatches activeColor={color} onPick={onColor} />
        {onExpand && (
          <button
            type="button"
            onClick={() => { onSave(draft); onExpand() }}
            title={t('ann.expand')}
            className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            <Maximize2 size={13} />
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            title={t('ann.delete')}
            className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder={t('ann.notePlaceholder')}
        rows={3}
        autoFocus
        className="mt-2 w-full resize-y rounded-lg border border-gray-200 bg-surface px-2 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none"
      />
      <p className="mt-1 text-[11px] text-gray-400">{t('ann.saveHint')}</p>
    </div>
  )
}
