import type { Metadata } from 'next'
import Link from 'next/link'
import { Church, Map as MapIcon, Blocks, ArrowRight } from 'lucide-react'
import { THEME_PAGES } from '@/lib/themes'
import { TEXT_CATEGORIES } from '@/lib/texts-catalog'

export const metadata: Metadata = { title: 'Tools' }

// The hub the header points at. These three had no home between them: Themes sat in the header,
// the map was reachable only from the Texts menu, and construct search only from inside /search
// — so two of the three were effectively invisible unless you already knew they existed. A named
// shelf makes them findable and leaves somewhere to put the next one.
//
// Counts are DERIVED from the data they describe, so a card cannot drift out of date when a
// theme or a corpus is added.

const workCount = TEXT_CATEGORIES.reduce((n, c) => n + (c.comingSoon ? 0 : c.works.length), 0)

const TOOLS = [
  {
    href: '/themes',
    icon: Church,
    name: 'Themes',
    tagline: 'The library indexed by subject',
    body: `Thirty-seven theological topics — the Godhead, the Sabbath, atonement, the kingdom — each `
      + `set out from the non-canonical sources themselves: Second Temple Jewish, rabbinic, the `
      + `Apostolic Fathers, the later Christian writers and the Greek and Roman world. Every `
      + `citation is verified against the corpus, and every page also says what the sources do `
      + `NOT contain.`,
    stat: `${THEME_PAGES.length} topics · ${THEME_PAGES.reduce((n, p) => n + p.entries.length, 0)} passages`,
  },
  {
    href: '/map',
    icon: MapIcon,
    name: 'Places',
    tagline: 'Where the texts say things happened',
    body: `Every place named by Herodotus, Thucydides, Strabo, Pausanias, Polybius and the orators, `
      + `sized by how often each is mentioned. Click a place to see which authors speak of it, and `
      + `open the passage beside the map.`,
    stat: '655 ancient places',
  },
  {
    href: '/search/construct',
    icon: Blocks,
    name: 'Construct search',
    tagline: 'Search by grammar, not by word',
    body: `Find constructions rather than vocabulary — an aorist participle before a main verb, a `
      + `genitive absolute, an article-noun-article-adjective string — across the Greek New `
      + `Testament, the Septuagint, the Hebrew Bible and the background corpora, with agreement, `
      + `negation and scoping.`,
    stat: '3.16M words in 9 corpora',
  },
]

export default function ToolsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Tools</h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-600">
        Ways into the {workCount.toLocaleString()} works this library holds, other than reading them
        front to back — by subject, by place, and by grammatical construction.
      </p>

      <div className="mt-6 space-y-3">
        {TOOLS.map(t => (
          <Link key={t.href} href={t.href}
            className="group block rounded-xl border border-gray-200 bg-surface p-5 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 shrink-0 rounded-lg bg-brand-50 p-2 text-brand-600 group-hover:bg-brand-100">
                <t.icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-brand-800">{t.name}</h2>
                  <span className="text-sm text-gray-500">{t.tagline}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{t.body}</p>
                <p className="mt-2 text-xs text-gray-400">{t.stat}</p>
              </div>
              <ArrowRight size={16} className="mt-1 shrink-0 text-gray-300 transition-colors group-hover:text-brand-500" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
