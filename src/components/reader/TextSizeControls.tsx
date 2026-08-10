'use client'
import { AlignJustify } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { FONT_SCALES, LINE_SPACINGS } from '@/lib/note-prefs'

/**
 * The app-wide "Text Size" slider — the ONE implementation every tools/settings
 * menu uses (Reader, Exegesis tabs, Search, Texts, Notes, Commentary), so the
 * control looks and reads the same everywhere: A…A ends, title-case heading,
 * and step labels. Callers own the value and its persistence; the scale is
 * whatever ordered list of sizes the surface uses (string steps or numeric).
 */
export function TextSizeSlider<T extends string | number>({ options, value, onChange }: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
}) {
  const t = useT()
  const idx = Math.max(0, options.indexOf(value))
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t('reader.textSize')}</p>
      <div className="flex items-center gap-3">
        <span className="font-reading text-gray-400 select-none leading-none" style={{ fontSize: '0.8rem' }}>A</span>
        <input
          type="range" min={0} max={options.length - 1} step={1} value={idx}
          aria-label={t('reader.textSize')}
          onChange={e => onChange(options[e.target.valueAsNumber])}
          className="flex-1 accent-brand-600 cursor-pointer"
        />
        <span className="font-reading text-gray-400 select-none leading-none" style={{ fontSize: '1.35rem' }}>A</span>
      </div>
      {options.length === 4 && (
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
          <span>{t('reader.sizeSmall')}</span><span>{t('reader.sizeMed')}</span><span>{t('reader.sizeLarge')}</span><span>{t('reader.sizeXLarge')}</span>
        </div>
      )}
    </div>
  )
}

/** Line-spacing companion slider (Notes and Commentary panes). */
export function LineSpacingSlider({ value, onChange }: {
  value: number
  onChange: (v: number) => void
}) {
  const t = useT()
  const idx = Math.max(0, LINE_SPACINGS.indexOf(value))
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t('reader.lineSpacing')}</p>
      <div className="flex items-center gap-3">
        <AlignJustify size={13} className="text-gray-400 shrink-0" />
        <input
          type="range" min={0} max={LINE_SPACINGS.length - 1} step={1} value={idx}
          aria-label={t('reader.lineSpacing')}
          onChange={e => onChange(LINE_SPACINGS[e.target.valueAsNumber])}
          className="flex-1 accent-brand-600 cursor-pointer"
        />
        <AlignJustify size={18} className="text-gray-400 shrink-0" />
      </div>
    </div>
  )
}

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
  return (
    <>
      <TextSizeSlider options={FONT_SCALES} value={fontScale} onChange={onFontScale} />
      <LineSpacingSlider value={lineSpacing} onChange={onLineSpacing} />
    </>
  )
}
