// Lets the header search icon, the mobile menu, and the right-click word menu open the
// app-wide Master Search pane (hosted once by MasterSearchProvider in the root layout)
// without prop-drilling. An optional preset pre-fills + runs a specific search.
export interface MasterSearchPreset { query: string; scope: string; lemma?: boolean; books?: string; features?: string }
type OpenFn = (preset?: MasterSearchPreset) => void
let _opener: OpenFn | null = null

export function registerMasterSearch(fn: OpenFn | null): void { _opener = fn }
export function openMasterSearch(preset?: MasterSearchPreset): void { _opener?.(preset) }
export function hasMasterSearch(): boolean { return _opener != null }
