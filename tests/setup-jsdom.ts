/**
 * jsdom gaps that every component test trips over, filled once here rather than in each file.
 *
 * `matchMedia` is the one that matters: any component that adapts its RENDER to the viewport
 * (rather than leaving it to CSS) has to ask for it, and without this a single such component
 * anywhere in the tree throws and takes the whole suite down with it — which is exactly what
 * adding one responsive hook to the vocabulary lists did.
 *
 * Defaults to "not matching", i.e. the desktop layout, so existing expectations are unchanged.
 * A test that wants the narrow layout overrides it for its own scope.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
