/* Render the credits section in both locales, so the page is verified without signing in. */
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CATALOGUES } from '../../src/lib/i18n/messages'
import { SOURCE_CREDITS, SOURCE_GROUPS } from '../../src/lib/sources'

for (const loc of ['en', 'es'] as const) {
  const c = CATALOGUES[loc] as Record<string, string>
  const t = (k: string) => c[k] ?? `!!${k}!!`
  const html = renderToStaticMarkup(
    <div>
      <h2>{t('sources.heading')}</h2>
      {SOURCE_GROUPS.map(g => (
        <div key={g}>
          <h3>{t(`sources.group.${g}`)}</h3>
          {SOURCE_CREDITS.filter(s => s.group === g).map(s => (
            <p key={s.id}>{t(`sources.${s.id}.title`)} — {t(`sources.${s.id}.body`)}
              {s.licence ? ` [${t('sources.licence')}: ${s.licence}]` : ''}</p>
          ))}
        </div>
      ))}
    </div>
  )
  const text = html.replace(/<[^>]+>/g, '\n').replace(/\n{2,}/g, '\n').trim()
  const unresolved = (text.match(/!!.*?!!/g) ?? []).length
  console.log(`\n===== ${loc.toUpperCase()} — ${unresolved} unresolved keys =====`)
  console.log(text.split('\n').slice(0, 12).join('\n'))
}
