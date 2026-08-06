import { THEME_PAGES } from '@/lib/themes'

/**
 * The Themes pages, indexed the other way round: given a passage, which topics cite it.
 *
 * Themes only worked if you started at Themes. Reading Jubilees 17:16 in the Texts reader,
 * nothing told you it is one of the passages the Satan page is built on — so 588 curated
 * citations were reachable from exactly one direction. This inverts them at module load
 * (a few hundred entries; no measurable cost) so a reader can be told, while reading, that
 * the passage in front of them is part of an argument somewhere else in the app.
 *
 * Keyed by the SAME triple the entries are written with — catalogue work id, chapter, verse —
 * plus the book for the multi-book works (Josephus), so a lookup cannot silently match the
 * right chapter of the wrong book.
 */
export interface ThemeBacklink { id: string; label: string; group: string; summary: string }

const key = (work: string, chapter: number, verse: number, book?: number) =>
  `${work}|${book ?? ''}|${chapter}|${verse}`

const INDEX: Map<string, ThemeBacklink[]> = (() => {
  const m = new Map<string, ThemeBacklink[]>()
  for (const page of THEME_PAGES) {
    for (const e of page.entries) {
      const k = key(e.work, e.chapter, e.verse, e.book)
      const list = m.get(k) ?? []
      // A passage can legitimately appear on two pages (Ignatius' "Son of Man and Son of God"
      // is on both), but never twice on one.
      if (!list.some(b => b.id === page.id)) {
        list.push({ id: page.id, label: page.label, group: page.group, summary: e.summary })
      }
      m.set(k, list)
    }
  }
  return m
})()

/** Topics citing this passage, or an empty array. Safe to call per verse in a render loop. */
export function themesCiting(
  work: string, chapter: number, verse: number, book?: number,
): ThemeBacklink[] {
  return INDEX.get(key(work, chapter, verse, book)) ?? []
}

/** Whether any passage of this work is cited by a theme — for cheap per-work gating. */
const WORKS = new Set(THEME_PAGES.flatMap(p => p.entries.map(e => e.work)))
export function workHasThemes(work: string): boolean { return WORKS.has(work) }
