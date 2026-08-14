'use client'
import { useEffect, useRef, useState } from 'react'
import { Trash2, Maximize2 } from 'lucide-react'
import { HighlightSwatches } from '@/components/highlights/HighlightSwatches'
import { useT } from '@/lib/i18n/LocaleProvider'
import { setNoteEditing } from '@/lib/note-editing'
import { DEFAULT_HIGHLIGHT_COLOR, type HighlightColor } from '@/lib/highlight-colors'

/**
 * The card that opens over a selection or an existing annotation: colour row, a note box,
 * and delete. Positioned from the caller's caret rect and nudged back inside the viewport —
 * the last paragraph of a chapter sits near the bottom of the screen, which is exactly where
 * an un-nudged popover opens off it.
 *
 * THE TWO MODES ARE GENUINELY DIFFERENT, and conflating them broke the feature on first use.
 *
 * `new` — nothing exists yet, so NOTHING is written until the reader has finished. The first
 * version created the annotation the instant a swatch was clicked and closed the popover with
 * it — and clicking a colour is the natural first move, so the note box vanished before it
 * could be typed in. The report was "the highlighting works but no notes appear". Now a
 * swatch only chooses a colour; the annotation is written on Save, on ⌘/Ctrl+Enter, or on
 * clicking away, and only if the reader actually did something, so a stray click after a drag
 * leaves nothing behind.
 *
 * `edit` — it already exists, so a colour change applies at once (there is nothing to lose)
 * and the body is saved on the way out.
 */
export function AnnotationPopup({
  mode, x, y, color, body, quote, canDelete, onColor, onCommit, onDelete, onClose, onExpand,
}: {
  mode: 'new' | 'edit'
  x: number
  y: number
  color: string
  body: string
  /** The selected words. Gives the palette a Copy button — on iOS the native selection (and
   *  with it the system's own Copy) is dropped the moment we capture the range. */
  quote?: string
  canDelete: boolean
  /** `edit` only: apply a colour change immediately. */
  onColor?: (c: HighlightColor) => void
  /** Write the annotation — creating it in `new` mode, updating it in `edit`. */
  onCommit: (color: HighlightColor, body: string) => void
  onDelete: () => void
  onClose: () => void
  /** Open the full note pane — the surface handwriting needs. */
  onExpand?: () => void
}) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState(body)
  const [pen, setPen] = useState<HighlightColor>((color as HighlightColor) || DEFAULT_HIGHLIGHT_COLOR)
  const [pickedColor, setPickedColor] = useState(false)
  const [pos, setPos] = useState({ left: x, top: y })

  useEffect(() => { setDraft(body) }, [body])
  useEffect(() => { setNoteEditing(true); return () => setNoteEditing(false) }, [])

  // Anything the reader actually did. Without this, a drag followed by a click elsewhere
  // would leave a stray yellow highlight behind on the page.
  const touched = pickedColor || draft.trim() !== ''
  const commit = () => { if (mode === 'edit' || touched) onCommit(pen, draft) }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const pad = 8
    const left = Math.min(Math.max(pad + r.width / 2, x), window.innerWidth - r.width / 2 - pad)
    const top = y - r.height - 10 < pad ? y + 22 : y - r.height - 10
    setPos({ left, top })
  }, [x, y, draft.length === 0])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) { commit(); onClose() }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()   // the one way out that saves nothing
      // ⌘/Ctrl+Enter saves — plain Enter has to keep making new lines in the note.
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { commit(); onClose() }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  })

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 -translate-x-1/2 rounded-xl border border-gray-200 bg-popover p-3 shadow-lg"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="flex items-center justify-between gap-2">
        <HighlightSwatches
          activeColor={pen}
          copyValue={quote}
          onPick={c => {
            setPen(c)
            setPickedColor(true)
            // In edit mode the annotation exists, so recolour it at once. In new mode a
            // swatch is only a choice — committing here is what ate the note.
            if (mode === 'edit') onColor?.(c)
          }}
        />
        {onExpand && (
          <button
            type="button"
            onClick={() => { commit(); onExpand() }}
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
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] text-gray-400">{t('ann.saveHint')}</p>
        <button
          type="button"
          onClick={() => { commit(); onClose() }}
          disabled={mode === 'new' && !touched}
          className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400"
        >
          {t('ann.save')}
        </button>
      </div>
    </div>
  )
}
