'use client'
import { Check } from 'lucide-react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { useReadingLanguage, READING_LANGS } from '@/lib/reading-language'
import { useT } from '@/lib/i18n/LocaleProvider'

/**
 * Picks the translation shown beside the Greek and Hebrew. The Reader has always had this
 * control inline, but buried in a dropdown mid-page — a student who reads English with
 * difficulty had to work in English to find the setting that would stop them having to. This
 * surfaces it where the display theme lives, and remembers it.
 */
export function ReadingLanguageSettings() {
  const [lang, setLang] = useReadingLanguage()
  const t = useT()

  return (
    <Card>
      <CardTitle>{t('settings.reading.title')}</CardTitle>
      <CardDescription>
        The translation shown beside the Greek and Hebrew. The Greek text itself never changes —
        this is the language you read it <em>with</em>. Applies to the Reader and the Phrase
        explorer, and is remembered on this device.
      </CardDescription>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* Greek only comes first: it is the default, and the one choice that isn't a language. */}
        {[{ code: null as string | null, labelKey: 'settings.reading.greekOnly', subKey: 'settings.reading.noParallel' }, ...READING_LANGS].map(l => {
          const active = lang === l.code
          return (
            <button
              key={l.code ?? 'none'}
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={active}
              className={`flex items-start justify-between gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-900">{t(l.labelKey)}</span>
                <span className="block text-xs text-gray-500">{t(l.subKey)}</span>
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

      <p className="mt-4 text-xs text-gray-500">
        These are the freely licensed editions available to us, so they are older translations —
        Reina-Valera 1909 rather than 1960, for instance. The Berean Standard Bible is the only
        one shown word-by-word beside the Greek New Testament; the rest appear verse by verse.
      </p>
    </Card>
  )
}
