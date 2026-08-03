'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ExternalLink, Info } from 'lucide-react'
import { openMasterSearch, hasMasterSearch } from '@/lib/master-search-bus'
import { TEXT_CATEGORIES } from '@/lib/texts-catalog'
import { THEME_PAGES, THEME_GROUPS, TRADITIONS, type TopicEntry } from '@/lib/themes'

// A topic index over the Texts library — the third way in, beside author (the Texts menu) and
// word (search). A student who asks "what did Second Temple Judaism think about resurrection?"
// has no route through either of those, because answering it means already knowing that 1 Enoch
// 22 and 2 Maccabees 7 are where to look.
//
// Two rules the layout exists to enforce:
//
//   1. A summary never appears without its passage one click away. Six words are a finding aid,
//      not evidence — the reader must be one step from the text, never able to quote the gloss.
//   2. Sources are grouped by tradition AND dated. A flat list putting the Mishnah (c. 200 CE)
//      beside Jubilees (2nd c. BCE) beside Irenaeus actively teaches bad method.

export function ThemesView({ topicId }: { topicId: string }) {
  // Switching theme is local state, not navigation: every page is already in the bundle, so a
  // click should paint immediately rather than round-trip. The URL is kept in step by hand so
  // deep links and the back button still work.
  const [current, setCurrent] = useState(topicId)
  const page = THEME_PAGES.find(p => p.id === current) ?? THEME_PAGES[0]
  const [openedProbe, setOpenedProbe] = useState<string | null>(null)

  function choose(id: string) {
    setCurrent(id)
    setOpenedProbe(null)
    window.history.replaceState(null, '', `/themes?topic=${id}`)
  }

  const grouped = THEME_GROUPS
    .map(g => ({ group: g, pages: THEME_PAGES.filter(p => p.group === g) }))
    .filter(g => g.pages.length > 0)

  // Display names live in the catalog, so a renamed work renames here too — nothing duplicated.
  const workName = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of TEXT_CATEGORIES as any[]) for (const w of c.works) m.set(w.id, w.name)
    return m
  }, [])

  const byTradition = useMemo(() => {
    const m = new Map<string, TopicEntry[]>()
    for (const e of page.entries) {
      const list = m.get(e.tradition) ?? []
      list.push(e)
      m.set(e.tradition, list)
    }
    return m
  }, [page])

  function cite(e: TopicEntry) {
    const name = workName.get(e.work) ?? e.work
    return e.book ? `${name} ${e.book}.${e.chapter}.${e.verse}` : `${name} ${e.chapter}:${e.verse}`
  }

  // The probe is an exact phrase from the passage, so the pane opens on the passage itself
  // rather than on a topic-wide search. Where the pane isn't mounted (a lockdown exam), the
  // same query goes to the full search page instead.
  function open(e: TopicEntry) {
    setOpenedProbe(e.probe)
    openMasterSearch({ query: `"${e.probe}"`, scope: 'bg:all' })
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-6">
      {/* Sidebar, not a dropdown: with thirty-odd themes the list is the map of the subject, and
          a student is helped by seeing that Sabbath sits beside Law and Purity. A dropdown hides
          exactly that. Only CURATED themes appear — a query set exists for thirty more, but a
          theme with no written entries is not a page, and listing it would promise what isn't
          there. Below lg it collapses to a select, since a sidebar would eat a phone screen. */}
      <nav className="hidden w-52 shrink-0 lg:block">
        <div className="sticky top-20">
          {grouped.map(({ group, pages }) => (
            <div key={group} className="mb-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{group}</p>
              <ul className="space-y-0.5">
                {pages.map(p => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => choose(p.id)}
                      className={`w-full rounded-lg px-2 py-1.5 text-left text-sm leading-snug transition-colors ${
                        p.id === page.id
                          ? 'bg-brand-50 font-medium text-brand-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="min-w-0 flex-1">
        <div className="mb-4 lg:hidden">
          <label htmlFor="theme-pick" className="sr-only">Theme</label>
          <select id="theme-pick" value={page.id} onChange={e => choose(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm">
            {grouped.map(({ group, pages }) => (
              <optgroup key={group} label={group}>
                {pages.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
      <h1 className="text-2xl font-semibold text-gray-900">{page.label}</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{page.blurb}</p>

      <p className="mt-3 flex gap-2 rounded-lg border border-gray-200 bg-surface p-3 text-xs leading-relaxed text-gray-600">
        <Info size={14} className="mt-0.5 shrink-0 text-gray-400" />
        <span>{page.canonicalAnchors}</span>
      </p>

      {/* Counts are DERIVED, not written — a table of what the corpus actually holds can't be
          wrong, and it answers "who cares about this?" before any reading happens. */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {TRADITIONS.filter(t => byTradition.has(t.id)).map(t => (
          <span key={t.id} className="rounded-lg border border-gray-200 bg-surface px-2.5 py-1 text-xs text-gray-600">
            {t.label} <span className="tabular-nums font-medium text-gray-800">{byTradition.get(t.id)!.length}</span>
          </span>
        ))}
      </div>

      {TRADITIONS.filter(t => byTradition.has(t.id)).map(t => (
        <section key={t.id} className="mt-7">
          <div className="flex flex-wrap items-baseline gap-x-2 border-b border-gray-100 pb-1.5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">{t.label}</h2>
            <span className="text-xs tabular-nums text-gray-400">{t.dates}</span>
          </div>
          <p className="mt-1.5 text-xs italic leading-relaxed text-gray-500">{t.note}</p>

          <ul className="mt-2.5 space-y-0.5">
            {byTradition.get(t.id)!.map(e => (
              <li key={`${e.work}-${e.book ?? 0}-${e.chapter}-${e.verse}`}>
                <button
                  type="button"
                  onClick={() => open(e)}
                  className={`group flex w-full items-baseline gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-brand-50 ${
                    openedProbe === e.probe ? 'bg-brand-50' : ''}`}
                >
                  <span className="w-52 shrink-0 text-xs font-medium text-brand-700 group-hover:underline">
                    {cite(e)}
                  </span>
                  <span className="flex-1 text-sm text-gray-700">{e.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Absence is a finding. A topic page that only ever says "here is a source for that"
          teaches students to expect one, and to go looking until they can force a text to
          supply it. */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-surface p-4">
        <h2 className="text-sm font-semibold text-gray-800">What the sources don’t say</h2>
        <ul className="mt-2 space-y-2">
          {page.absences.map((a, i) => (
            <li key={i} className="text-xs leading-relaxed text-gray-600">{a}</li>
          ))}
        </ul>
      </section>

      <p className="mt-6 flex items-center gap-2 text-xs text-gray-500">
        <BookOpen size={13} className="text-gray-400" />
        Summaries are machine-drafted from the passage and hand-checked; every citation is verified
        against the corpus at build time. Click any reference to read the passage itself.
        {!hasMasterSearch() && (
          <Link href="/search" className="text-brand-700 hover:underline">
            Open search <ExternalLink size={11} className="inline" />
          </Link>
        )}
      </p>
      </div>
    </div>
  )
}
