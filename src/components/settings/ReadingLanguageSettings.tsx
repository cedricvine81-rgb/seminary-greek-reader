'use client'
import { Check } from 'lucide-react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { useReadingLanguage, READING_LANGS, defaultReadingLang, readingLangLabel } from '@/lib/reading-language'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'

/**
 * Picks the translation shown beside the Greek and Hebrew. The Reader has always had this
 * control inline, but buried in a dropdown mid-page — a student who reads English with
 * difficulty had to work in English to find the setting that would stop them having to. This
 * surfaces it where the display theme lives, and remembers it.
 */
export function ReadingLanguageSettings() {
  const [pref, setPref] = useReadingLanguage()
  const t = useT()
  const locale = useLocale()
  // What "Follow interface language" resolves to right now, named so the choice is not a
  // guess — a Spanish reader sees that it means Reina-Valera.
  const followsTo = readingLangLabel(defaultReadingLang(locale), t)

  return (
    <Card>
      <CardTitle>{t('settings.reading.title')}</CardTitle>
      <CardDescription>{t('settings.reading.desc')}</CardDescription>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* "Follow the interface language" first: it is the default, and the one option that
            is a rule rather than a choice. "Greek only" next — the other non-language. */}
        {[
          { code: undefined as string | null | undefined, labelKey: 'settings.reading.auto', subKey: null },
          { code: null as string | null | undefined, labelKey: 'settings.reading.greekOnly', subKey: 'settings.reading.noParallel' },
          ...READING_LANGS,
        ].map(l => {
          const active = pref === l.code
          return (
            <button
              key={l.code === undefined ? 'auto' : l.code ?? 'none'}
              type="button"
              onClick={() => setPref(l.code)}
              aria-pressed={active}
              className={`flex items-start justify-between gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-900">{t(l.labelKey)}</span>
                <span className="block text-xs text-gray-500">
                  {l.subKey ? t(l.subKey) : t('settings.reading.autoSub', { lang: followsTo })}
                </span>
              </span>
              {active && (
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-gray-500">{t('settings.reading.licenceNote')}</p>
    </Card>
  )
}
