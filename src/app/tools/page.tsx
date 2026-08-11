import type { Metadata } from 'next'
import Link from 'next/link'
import { Church, Map as MapIcon, Blocks, ArrowRight } from 'lucide-react'
import { THEME_PAGES } from '@/lib/themes'
import { TEXT_CATEGORIES } from '@/lib/texts-catalog'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { formatNumber } from '@/lib/i18n/format'

export const metadata: Metadata = { title: 'Tools' }

// The hub the header points at. These three had no home between them: Themes sat in the header,
// the map was reachable only from the Texts menu, and construct search only from inside /search
// — so two of the three were effectively invisible unless you already knew they existed. A named
// shelf makes them findable and leaves somewhere to put the next one.
//
// Counts are DERIVED from the data they describe, so a card cannot drift out of date when a
// theme or a corpus is added.

const workCount = TEXT_CATEGORIES.reduce((n, c) => n + (c.comingSoon ? 0 : c.works.length), 0)

const TOPIC_COUNT = THEME_PAGES.length
const PASSAGE_COUNT = THEME_PAGES.reduce((n, p) => n + p.entries.length, 0)

// Names reuse the header menu's tools.* keys. `stat` is a function rather than a string because
// the Themes figures are DERIVED from the data — the original comment's point, kept — and a
// count that pluralises cannot be baked into a constant.
const TOOLS = [
  {
    href: '/themes', icon: Church,
    nameKey: 'tools.themes', taglineKey: 'tools.themes.tagline', bodyKey: 'tools.themes.body',
    stat: (tr: (k: string, v?: Record<string, string | number>) => string) => tr('tools.statPair', {
      a: tr('tools.topicCount', { count: TOPIC_COUNT, n: TOPIC_COUNT }),
      b: tr('tools.passageCount', { count: PASSAGE_COUNT, n: PASSAGE_COUNT }),
    }),
  },
  {
    href: '/map', icon: MapIcon,
    nameKey: 'tools.places', taglineKey: 'tools.places.tagline', bodyKey: 'tools.places.body',
    stat: (tr: (k: string) => string) => tr('tools.places.stat'),
  },
  {
    href: '/search/construct', icon: Blocks,
    nameKey: 'tools.construct', taglineKey: 'tools.construct.tagline', bodyKey: 'tools.construct.body',
    stat: (tr: (k: string) => string) => tr('tools.construct.stat'),
  },
]

export default function ToolsPage() {
  const t = getServerT()
  const locale = getServerLocale()
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">{t('tools.title')}</h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-600">
        {t('tools.intro', { n: formatNumber(workCount, locale) })}
      </p>

      <div className="mt-6 space-y-3">
        {TOOLS.map(tool => (
          <Link key={tool.href} href={tool.href}
            className="group block rounded-xl border border-gray-200 bg-surface p-5 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 shrink-0 rounded-lg bg-brand-50 p-2 text-brand-600 group-hover:bg-brand-100">
                <tool.icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-brand-800">{t(tool.nameKey)}</h2>
                  <span className="text-sm text-gray-500">{t(tool.taglineKey)}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{t(tool.bodyKey)}</p>
                <p className="mt-2 text-xs text-gray-400">{tool.stat(t)}</p>
              </div>
              <ArrowRight size={16} className="mt-1 shrink-0 text-gray-300 transition-colors group-hover:text-brand-500" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
