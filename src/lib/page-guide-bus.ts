// Lets the header "?" button and the mobile menu open the page guide panel (hosted once by
// PageGuideProvider in the root layout) without prop-drilling — the same shape as
// master-search-bus.ts.
//
// An optional id opens a specific guide instead of the one for the current page, which is how
// the panel's own "other pages" links work without navigating.
type OpenFn = (guideId?: string) => void
let _opener: OpenFn | null = null

export function registerPageGuide(fn: OpenFn | null): void { _opener = fn }
export function openPageGuide(guideId?: string): void { _opener?.(guideId) }
