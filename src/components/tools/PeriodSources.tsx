'use client'

// Who is in each baseline. The averages are only usable if the reader can see what they are
// averages OF — that Demosthenes brought 63 speeches, that Plutarch is one voice among 115,
// that Homer is in neither.

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { bookName } from '@/lib/i18n/book-names'
import { textAuthorLabel } from '@/lib/i18n/text-names'
import { CORPUS_KEY, isBiblical, type PeriodBaseline, type StyleMeta } from '@/lib/style-register'

export function PeriodSources({ meta }: { meta: StyleMeta }) {
  const t = useT()
  const locale = useLocale()
  const [open, setOpen] = useState<'classical' | 'koine' | null>(null)
  const periods = meta.periods
  if (!periods) return null

  const corpusName = (c: string) => (CORPUS_KEY[c] ? t(CORPUS_KEY[c]) : c)

  // A member is either a biblical book, which book-names.ts localizes exactly as the ranking
  // does, or an author, whose name text-names.ts already carries for the whole Texts library.
  // A prose work title stays as it is cited, the rule the rest of the app follows.
  const memberName = (m: PeriodBaseline['members'][number]) =>
    m.work && isBiblical(m.corpus)
      ? bookName(m.work, locale, m.author)
      : textAuthorLabel(m.author, locale, m.author)

  return (
    <div className="text-xs text-gray-500">
      <p className="mb-1.5">{t('reg.periodNote')}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {(['classical', 'koine'] as const).map(id => (
          <button
            key={id} onClick={() => setOpen(open === id ? null : id)}
            className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
            aria-expanded={open === id}
          >
            <ChevronRight size={12} className={clsx('transition-transform', open === id && 'rotate-90')} />
            {t(id === 'classical' ? 'reg.sourcesClassical' : 'reg.sourcesKoine', {
              authors: periods[id].members.length.toLocaleString(locale),
              works: periods[id].members.reduce((a, m) => a + m.works, 0).toLocaleString(locale),
            })}
          </button>
        ))}
      </div>

      {open && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
          <p className="mb-2">{t(open === 'classical' ? 'reg.classicalIs' : 'reg.koineIs')}</p>
          <ul className="max-h-64 space-y-0.5 overflow-y-auto">
            {periods[open].members.map(m => (
              <li key={`${m.corpus}/${m.author}`} className="flex justify-between gap-3">
                <span className="truncate text-gray-700">
                  {memberName(m)}
                  <span className="ml-1.5 text-gray-400">{corpusName(m.corpus)}</span>
                </span>
                <span className="shrink-0 tabular-nums text-gray-400">
                  {m.works > 1 && <>{t('reg.nWorks', { n: m.works.toLocaleString(locale) })} · </>}
                  {m.words.toLocaleString(locale)}
                </span>
              </li>
            ))}
          </ul>
          {open === 'classical' && periods.excluded.length > 0 && (
            <p className="mt-2 border-t border-gray-200 pt-2">
              {t('reg.epicExcluded', {
                // Separated by a middot: these titles contain their own commas ("Homer,
                // Iliad"), so a comma-joined list read as one long run of names.
                works: periods.excluded.map(e => e.label).join(' · '),
              })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
