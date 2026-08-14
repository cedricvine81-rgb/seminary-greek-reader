'use client'

import { ExternalLink } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { SOURCE_CREDITS, SOURCE_GROUPS } from '@/lib/sources'

/**
 * Who made the texts this app is built from.
 *
 * It lives in Settings rather than in a footer because it is a thing a reader looks FOR, not a
 * thing they should have to notice: a student citing Josephus needs to know whose Greek and whose
 * English they were reading, and several of these licences require the name to be given somewhere
 * a person can actually find it.
 *
 * Everything here is translated with the rest of the interface. An acknowledgement that appears
 * only in English is only half an acknowledgement in a Spanish app.
 */
export function SourcesCredits() {
  const t = useT()
  return (
    <section className="rounded-xl border border-gray-200 bg-surface p-5">
      <h2 className="text-lg font-semibold text-ink-900">{t('sources.heading')}</h2>
      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-gray-600">{t('sources.intro')}</p>

      {SOURCE_GROUPS.map(group => {
        const items = SOURCE_CREDITS.filter(s => s.group === group)
        if (!items.length) return null
        return (
          <div key={group} className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              {t(`sources.group.${group}`)}
            </h3>
            <dl className="mt-2 divide-y divide-gray-100">
              {items.map(s => (
                <div key={s.id} className="py-2.5">
                  <dt className="text-sm font-medium text-ink-900">
                    {t(`sources.${s.id}.title`)}
                    {s.url && (
                      // rel=noreferrer as well as noopener: these are third-party sites and there
                      // is no reason to tell them which page of ours the reader came from.
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1.5 inline-flex align-middle text-brand-600 transition-colors hover:text-brand-800"
                        aria-label={t(`sources.${s.id}.title`)}
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-gray-600">
                    {t(`sources.${s.id}.body`)}
                    {s.licence && (
                      <span className="ml-1.5 whitespace-nowrap rounded bg-gray-100 px-1.5 py-0.5 text-[0.7rem] font-medium text-gray-600">
                        {t('sources.licence')}: {s.licence}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )
      })}
    </section>
  )
}
