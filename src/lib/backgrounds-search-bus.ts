import type { BgLang } from '@/lib/backgrounds-search-types'

// Lets any component open the app-wide background-sources search modal (hosted once by
// BackgroundsSearchProvider in the root layout) without prop-drilling or a wrapping context.
type OpenFn = (query: string, lang: BgLang) => void
let _opener: OpenFn | null = null

export function registerBackgroundsSearch(fn: OpenFn | null): void { _opener = fn }
export function openBackgroundsSearch(query: string, lang: BgLang): void { _opener?.(query, lang) }
