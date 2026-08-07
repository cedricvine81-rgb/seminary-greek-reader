'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Languages } from 'lucide-react'
import { LOCALES } from '@/lib/i18n/locale'
import { useLocale, useSetLocale, useT } from '@/lib/i18n/LocaleProvider'

/**
 * Interface-language switcher in the header, so it is reachable from every page rather than
 * only from /settings — where a student who cannot read the English interface is unlikely to
 * find it.
 *
 * A click menu, not hover: the nav menus beside it open on hover because they are browsed, and
 * this one is not. It also has to work on touch, where a language switch is exactly what a
 * first-time visitor reaches for.
 *
 * Each language is named in itself (Español, Русский, 中文) — someone looking for their own
 * language should not have to read English to find it. The fuller picker on /settings stays,
 * with the reading-language card beside it that explains the difference.
 */
export function LanguageMenu() {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = LOCALES.find(l => l.code === locale)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('settings.language.title')}
        title={t('settings.language.title')}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
      >
        <Languages size={18} />
        {/* The current language's own name, so the control says what it will change. Hidden on
            the narrowest screens, where the icon alone has to do. */}
        <span className="hidden sm:inline text-xs" lang={locale}>{current?.label}</span>
      </button>

      {open && (
        <div role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-gray-200 bg-popover py-1 shadow-lg">
          {LOCALES.map(l => {
            const active = l.code === locale
            return (
              <button
                key={l.code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                lang={l.code}
                onClick={() => { setLocale(l.code); setOpen(false) }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-brand-50 hover:text-brand-700 ${
                  active ? 'font-medium text-brand-700' : 'text-gray-700'}`}
              >
                <span className="min-w-0">
                  <span className="block leading-snug">{l.label}</span>
                  {l.label !== l.english && (
                    <span className="block text-[11px] leading-snug text-gray-400">{l.english}</span>
                  )}
                </span>
                {active && <Check size={14} className="shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
