'use client'
import { AlignJustify } from 'lucide-react'
import { FONT_SCALES, LINE_SPACINGS } from '@/lib/note-prefs'

/**
 * Text Size + Line Spacing sliders, shared by the Notes and Commentary panels inside
 * the exegesis tools menu. Presentational only — the caller owns open/close state and
 * the trigger button (the shared "⋮" menu in ExegesisTabs).
 */
export function TextSizeControls({
  fontScale, onFontScale, lineSpacing, onLineSpacing,
}: {
  fontScale: number
  onFontScale: (v: number) => void
  lineSpacing: number
  onLineSpacing: (v: number) => void
}) {
  const fontIdx = Math.max(0, FONT_SCALES.indexOf(fontScale))
  const lineIdx = Math.max(0, LINE_SPACINGS.indexOf(lineSpacing))

  return (
    <>
      {/* Text size */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Text Size</p>
        <div className="flex items-center gap-3">
          <span className="font-reading text-gray-400 select-none leading-none" style={{ fontSize: '0.8rem' }}>A</span>
          <input
            type="range" min={0} max={FONT_SCALES.length - 1} step={1} value={fontIdx}
            onChange={e => onFontScale(FONT_SCALES[e.target.valueAsNumber])}
            className="flex-1 accent-brand-600 cursor-pointer"
          />
          <span className="font-reading text-gray-400 select-none leading-none" style={{ fontSize: '1.35rem' }}>A</span>
        </div>
      </div>

      {/* Line spacing */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Line Spacing</p>
        <div className="flex items-center gap-3">
          <AlignJustify size={13} className="text-gray-400 shrink-0" />
          <input
            type="range" min={0} max={LINE_SPACINGS.length - 1} step={1} value={lineIdx}
            onChange={e => onLineSpacing(LINE_SPACINGS[e.target.valueAsNumber])}
            className="flex-1 accent-brand-600 cursor-pointer"
          />
          <AlignJustify size={18} className="text-gray-400 shrink-0" />
        </div>
      </div>
    </>
  )
}
