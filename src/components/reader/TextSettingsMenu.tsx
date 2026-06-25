'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MoreVertical, X, AlignJustify } from 'lucide-react'
import { FONT_SCALES, LINE_SPACINGS } from '@/lib/note-prefs'

/**
 * Three-dot text control shared by the Notes and Commentary tabs. Opens a small
 * popover with a Text Size and a Line Spacing slider (both persisted via the
 * preference hooks the caller passes in). `children` renders an extra section at
 * the foot of the menu — used for the commentary copyright subheading.
 */
export function TextSettingsMenu({
  label = 'Text settings', fontScale, onFontScale, lineSpacing, onLineSpacing, className = '', children,
}: {
  label?: string
  fontScale: number
  onFontScale: (v: number) => void
  lineSpacing: number
  onLineSpacing: (v: number) => void
  className?: string
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const fontIdx = Math.max(0, FONT_SCALES.indexOf(fontScale))
  const lineIdx = Math.max(0, LINE_SPACINGS.indexOf(lineSpacing))

  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        title={label}
        onClick={() => setOpen(v => !v)}
        className={`p-1.5 rounded-lg transition-colors ${open ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white border border-gray-200 rounded-xl p-4 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">{label}</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
          </div>

          {/* Text size */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Text Size</p>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 select-none leading-none" style={{ fontFamily: 'Gentium Plus, Georgia, serif', fontSize: '0.8rem' }}>A</span>
              <input
                type="range" min={0} max={FONT_SCALES.length - 1} step={1} value={fontIdx}
                onChange={e => onFontScale(FONT_SCALES[e.target.valueAsNumber])}
                className="flex-1 accent-brand-600 cursor-pointer"
              />
              <span className="text-gray-400 select-none leading-none" style={{ fontFamily: 'Gentium Plus, Georgia, serif', fontSize: '1.35rem' }}>A</span>
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

          {children && <div className="pt-3 border-t border-gray-100">{children}</div>}
        </div>
      )}
    </div>
  )
}
