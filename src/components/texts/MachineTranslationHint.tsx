'use client'

import { useEffect, useState } from 'react'
import { Languages, X } from 'lucide-react'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'

/**
 * Tells a reader whose language is not English that the text in front of them exists only in
 * English, and that their browser can translate it.
 *
 * WHY THIS IS NEEDED AT ALL. The app marks the English source texts as translatable and
 * everything else as not (see lib/i18n/machine-translation.ts), which makes the browser's own
 * translation behave — but marking is invisible. Worse, <html lang> is the READER's language, so
 * a browser deciding whether to offer translation sees a page declared Spanish and does not
 * prompt, even when 98% of the words on it are English. The capability was there and unreachable.
 *
 * WHY IT IS A NOTE AND NOT A BUTTON. No page can start the browser's translator — there is no
 * API for it, by design, because a page being able to silently rewrite itself in the reader's
 * language is a phishing primitive. So the honest thing is to say plainly that the option exists
 * and where it lives. A button that looked like it would translate and then only showed
 * instructions would be worse than this.
 *
 * Dismissed permanently once read: it is an orientation message, not a warning, and a student who
 * has learned the trick should not meet it on every Latin father they open.
 */
const DISMISSED_KEY = 'mt-hint-dismissed'

export function MachineTranslationHint() {
  const locale = useLocale()
  const t = useT()
  const [show, setShow] = useState(false)

  // After mount: reading localStorage during render would not match the server's HTML.
  useEffect(() => {
    if (locale === 'en') return
    try { setShow(localStorage.getItem(DISMISSED_KEY) !== '1') } catch { setShow(true) }
  }, [locale])

  if (locale === 'en' || !show) return null

  function dismiss() {
    setShow(false)
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* private mode */ }
  }

  return (
    <div className="mb-3 flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2 text-xs leading-snug text-brand-900">
      <Languages size={14} className="mt-0.5 shrink-0 text-brand-600" />
      <p className="min-w-0 flex-1">
        {t('mt.englishOnly')}{' '}
        <span className="text-brand-700">{t('mt.howTo')}</span>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('action.close')}
        className="-mr-1 shrink-0 rounded p-0.5 text-brand-400 transition-colors hover:text-brand-700"
      >
        <X size={13} />
      </button>
    </div>
  )
}
