'use client'
import { Check } from 'lucide-react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { LOCALES } from '@/lib/i18n/locale'
import { useLocale, useSetLocale, useT } from '@/lib/i18n/LocaleProvider'

/**
 * Interface language. Distinct from the Reading language card below it, which chooses the
 * translation shown beside the Greek — the description says so, because the two are easy to
 * confuse and a student who picks the wrong one will conclude the feature is broken.
 *
 * Each language is named in itself (Español, Русский, 中文): someone looking for their own
 * language should not have to read English to find it.
 */
export function LanguageSettings() {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const t = useT()

  return (
    <Card>
      <CardTitle>{t('settings.language.title')}</CardTitle>
      <CardDescription>{t('settings.language.description')}</CardDescription>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LOCALES.map(l => {
          const active = locale === l.code
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLocale(l.code)}
              aria-pressed={active}
              lang={l.code}
              className={`flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-900">{l.label}</span>
                {l.label !== l.english && (
                  <span className="block text-xs text-gray-500">{l.english}</span>
                )}
              </span>
              {active && (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-gray-500">{t('settings.language.note')}</p>
    </Card>
  )
}
