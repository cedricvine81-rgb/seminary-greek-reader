'use client'
import { useEffect, useRef, useState } from 'react'
import { X, Trash2, PenLine } from 'lucide-react'
import { HighlightSwatches } from '@/components/highlights/HighlightSwatches'
import { useT } from '@/lib/i18n/LocaleProvider'
import type { HighlightColor } from '@/lib/highlight-colors'
import { parseInk, serializeInk, isEmptyInk, type InkDrawing } from '@/lib/ink'
import { InkPad } from './InkPad'

/**
 * The full note pane, opened from the popover's expand button.
 *
 * It exists because the popover is the wrong surface for HANDWRITING. iPadOS Scribble needs a
 * text box big enough to write several words into, and it needs that box to stay put — the
 * popover is 288px wide and dismisses on any outside tap, which is precisely what putting a
 * Pencil down near its edge does. So the small popover keeps doing what it is good at
 * (recolour, a one-line note, delete) and anything longer opens here.
 *
 * The textarea is a plain <textarea> and deliberately stays one: that is the whole reason
 * Scribble works in it at all. No contenteditable, no key interception, no user-select rules.
 */
export function NoteSheet({ quote, color, body, ink, onSave, onDelete, onClose }: {
  quote: string
  color: string
  body: string
  ink: string | null
  onSave: (patch: { color?: string; body?: string; ink?: string }) => void
  onDelete: () => void
  onClose: () => void
}) {
  const t = useT()
  const [draft, setDraft] = useState(body)
  const [pen, setPen] = useState<string>(color)
  const [drawing, setDrawing] = useState<InkDrawing | null>(() => parseInk(ink))
  const [inkOpen, setInkOpen] = useState(() => !isEmptyInk(parseInk(ink)))
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { areaRef.current?.focus() }, [])

  function saveAndClose() {
    const patch: { color?: string; body?: string; ink?: string } = {}
    if (draft !== body) patch.body = draft
    if (pen !== color) patch.color = pen
    const nextInk = drawing ? serializeInk(drawing) : ''
    if (nextInk !== (ink ?? '')) patch.ink = nextInk
    if (Object.keys(patch).length) onSave(patch)
    onClose()
  }

  // Escape closes; nothing else is intercepted. In particular Enter is left alone — it makes
  // a new line, and Scribble's own newline gesture depends on it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') saveAndClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-gray-900/40 p-0 sm:items-center sm:p-6">
      {/* No dismiss-on-backdrop-tap: a stray Pencil touch outside a note being handwritten
          must not throw the note away. Closing is explicit. */}
      <div className="flex max-h-[92svh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-popover shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('ann.noteOn')}</p>
            <p className="mt-0.5 truncate text-sm italic text-gray-600">“{quote}”</p>
          </div>
          <button
            type="button" onClick={saveAndClose} title={t('ann.close')}
            className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <HighlightSwatches activeColor={pen} onPick={(c: HighlightColor) => setPen(c)} />
          <textarea
            ref={areaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={t('ann.notePlaceholder')}
            rows={6}
            className="mt-3 w-full resize-y rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-gray-400">{t('ann.scribbleHint')}</p>

          {inkOpen ? (
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('ink.heading')}</p>
              <InkPad value={drawing} onChange={setDrawing} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setInkOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <PenLine size={13} /> {t('ink.add')}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-2.5">
          <button
            type="button" onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-red-600"
          >
            <Trash2 size={13} /> {t('ann.delete')}
          </button>
          <button
            type="button" onClick={saveAndClose}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {t('ann.done')}
          </button>
        </div>
      </div>
    </div>
  )
}
