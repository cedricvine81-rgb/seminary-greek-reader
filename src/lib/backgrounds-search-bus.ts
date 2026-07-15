import type { BgLang } from '@/lib/backgrounds-search-types'
import { openMasterSearch } from '@/lib/master-search-bus'

// Background-sources search now runs on the full /search page (one unified search surface with
// context + sort controls), not a separate modal. This shim keeps the existing call sites — the
// right-click "Background texts / All library texts" and the Texts-tab search box — working by
// routing to Master Search with a background scope (the /search scope list has bg:all / bggrc:all).
export function openBackgroundsSearch(query: string, lang: BgLang): void {
  openMasterSearch({ query, scope: lang === 'grc' ? 'bggrc:all' : 'bg:all' })
}
