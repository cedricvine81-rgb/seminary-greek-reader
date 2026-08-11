'use client'

import { LOCALES } from '@/lib/i18n/locale'
import { useLocale, useSetLocale } from '@/lib/i18n/LocaleProvider'

/**
 * Language choice on the auth cards, shown as a plain row of language names.
 *
 * The header already carries a switcher, and it is on this page — but it is a globe icon whose
 * text label is hidden below the `sm` breakpoint, sitting above a card that is entirely in
 * English. Someone who does not read English has no reason to believe the page has a Spanish
 * version at all, and sign-in is the FIRST screen they see: everything translated behind it is
 * unreachable if they give up here.
 *
 * So this is deliberately not an icon, not a dropdown, and not translated. Every language names
 * itself, all options are visible at once with nothing to open, and each carries `lang` so the
 * right font and screen-reader voice apply. There is no wording a non-reader has to decode —
 * the affordance IS the list of languages.
 */
export function AuthLanguagePicker({ className = '' }: { className?: string }) {
  const locale = useLocale()
  const setLocale = useSetLocale()

  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-1 gap-y-1 ${className}`}>
      {LOCALES.map((l, i) => {
        const active = l.code === locale
        return (
          <span key={l.code} className="flex items-center">
            {i > 0 && <span aria-hidden className="px-1 text-gray-300">·</span>}
            <button
              type="button"
              lang={l.code}
              aria-current={active ? 'true' : undefined}
              onClick={() => setLocale(l.code)}
              className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
                active
                  ? 'font-semibold text-brand-700'
                  : 'text-gray-500 hover:text-brand-700 hover:underline'
              }`}
            >
              {l.label}
            </button>
          </span>
        )
      })}
    </div>
  )
}
