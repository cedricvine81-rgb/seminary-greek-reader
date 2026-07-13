// Tiny global signal for whether a lockdown exam is currently in progress. Set by
// ExegesisWorkspace while its lockdown integrity mode is active; read by app-wide features
// (e.g. the background-sources right-click search) that must stay disabled during an exam
// so they can't be used to weaken exam integrity.
let _locked = false
export function setExamLocked(v: boolean) { _locked = v }
export function isExamLocked() { return _locked }
