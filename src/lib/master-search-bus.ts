// Lets the header search icon and the mobile menu open the app-wide Master Search pane
// (hosted once by MasterSearchProvider in the root layout) without prop-drilling.
type OpenFn = () => void
let _opener: OpenFn | null = null

export function registerMasterSearch(fn: OpenFn | null): void { _opener = fn }
export function openMasterSearch(): void { _opener?.() }
export function hasMasterSearch(): boolean { return _opener != null }
