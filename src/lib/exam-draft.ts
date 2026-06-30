// Offline safety net for Translation Exam / assignment work.
//
// The workspace already autosaves to the server (debounced PATCH), but that data lives
// only in React memory until a save succeeds. On a flaky connection a failed save was
// never retried and a reload would drop everything since the last *successful* save.
//
// This module mirrors the student's in-progress answers to localStorage on every edit so
// the work survives a dropped connection or an accidental reload: the draft is restored
// on load and re-flushed to the server when the connection returns.
//
// Versioning avoids a race: `version` bumps on every local write; `syncedVersion` only
// advances once the server confirms it received that version. A draft is "dirty" (has
// edits the server hasn't acknowledged) whenever `version > syncedVersion`, so marking a
// flush as synced can never accidentally clear a newer unsaved edit.

export interface ExamDraftData {
  annotations: Record<string, unknown>
  corrections: Record<string, unknown>
  verseTranslations: Record<string, string>
  verseCorrections: Record<string, string>
  notes: string
  answerTimings?: Record<string, { t0: number; tLast: number; edits: number }>
}

export interface StoredDraft {
  sessionId: string
  version: number        // bumps on every local write
  syncedVersion: number  // highest version confirmed saved to the server
  savedAt: number        // client ms of the last local write
  data: ExamDraftData
}

const PREFIX = 'sgr-exam-draft:'
const keyFor = (sessionId: string) => `${PREFIX}${sessionId}`

/** Write the latest answers to localStorage as an unsynced edit. Returns the new
 *  version, which the caller passes to markLocalDraftSynced once the server confirms. */
export function saveLocalDraft(sessionId: string, data: ExamDraftData): number {
  if (typeof window === 'undefined') return 0
  try {
    const existing = readLocalDraft(sessionId)
    const version = (existing?.version ?? 0) + 1
    const rec: StoredDraft = {
      sessionId,
      version,
      syncedVersion: existing?.syncedVersion ?? 0,
      savedAt: Date.now(),
      data,
    }
    window.localStorage.setItem(keyFor(sessionId), JSON.stringify(rec))
    return version
  } catch {
    return 0 // private mode / quota exceeded — best-effort only
  }
}

/** Record that the server has acknowledged everything up to `version`. Never lowers the
 *  high-water mark and never touches the stored data, so a concurrent edit isn't lost. */
export function markLocalDraftSynced(sessionId: string, version: number): void {
  if (typeof window === 'undefined') return
  try {
    const rec = readLocalDraft(sessionId)
    if (!rec || version <= rec.syncedVersion) return
    rec.syncedVersion = version
    window.localStorage.setItem(keyFor(sessionId), JSON.stringify(rec))
  } catch {
    /* ignore */
  }
}

export function readLocalDraft(sessionId: string): StoredDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(keyFor(sessionId))
    if (!raw) return null
    const rec = JSON.parse(raw) as StoredDraft
    if (!rec || typeof rec.version !== 'number') return null
    return rec
  } catch {
    return null
  }
}

/** True when the local draft holds edits the server hasn't confirmed. */
export function isLocalDraftDirty(rec: StoredDraft | null): boolean {
  return !!rec && rec.version > rec.syncedVersion
}

export function clearLocalDraft(sessionId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(keyFor(sessionId))
  } catch {
    /* ignore */
  }
}
