// Pure helpers for ACTIVITY_LOG assignments: the shape of the instructor's configuration,
// the shape of a student's weekly reports, and the Pass/Fail these earn.
//
// Deliberately free of any database import so client components (the builder, the settings
// editor, the student workspace, the grader) can share these types and validators without
// dragging Prisma into the browser bundle — the same split as
// construct-assignment.ts / construct-submissions.ts.

// ─── Configuration (Assignment.activityConfig) ────────────────────────────────

export interface ActivityLogConfig {
  /** How many weekly reports the activity runs for. */
  weeks: number
  /** Day each week's report is due. 0 = Sunday … 6 = Saturday, matching Date#getDay. */
  dayOfWeek: number
  /** Weeks that must be reported to pass. Defaults to every week. */
  requiredWeeks: number
}

export const MAX_WEEKS = 52
const DEFAULT_CONFIG: ActivityLogConfig = { weeks: 1, dayOfWeek: 0, requiredWeeks: 1 }

function clampInt(raw: unknown, lo: number, hi: number, fallback: number): number {
  const n = Math.trunc(Number(raw))
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback
}

/**
 * Coerce a stored or posted config into a usable one. `requiredWeeks` is clamped to the
 * number of weeks so a shortened activity can never demand more reports than it has.
 */
export function normalizeActivityConfig(raw: unknown): ActivityLogConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_CONFIG }
  const src = raw as Record<string, unknown>
  const weeks = clampInt(src.weeks, 1, MAX_WEEKS, DEFAULT_CONFIG.weeks)
  return {
    weeks,
    dayOfWeek: clampInt(src.dayOfWeek, 0, 6, DEFAULT_CONFIG.dayOfWeek),
    requiredWeeks: clampInt(src.requiredWeeks, 1, weeks, weeks),
  }
}

// ─── Weekly entries (ActivityLogSubmission.entries) ───────────────────────────

export interface ActivityLogEntry {
  done: boolean
  /** When the student reported it, ISO. */
  at: string
  comment: string
}
export type ActivityLogEntries = Record<string, ActivityLogEntry>

const MAX_COMMENT = 2000

/** Keep only well-formed reports for weeks that exist; drop everything else. */
export function normalizeEntries(raw: unknown, weeks: number): ActivityLogEntries {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: ActivityLogEntries = {}
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const week = Number(key)
    if (!Number.isInteger(week) || week < 1 || week > weeks) continue
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue
    const v = val as Record<string, unknown>
    if (v.done !== true) continue // an un-ticked week is simply absent
    const at = typeof v.at === 'string' && !Number.isNaN(Date.parse(v.at))
      ? new Date(v.at).toISOString()
      : new Date().toISOString()
    out[String(week)] = {
      done: true,
      at,
      comment: typeof v.comment === 'string' ? v.comment.slice(0, MAX_COMMENT) : '',
    }
  }
  return out
}

/** How many of the activity's weeks the student has reported. */
export function weeksReported(entries: ActivityLogEntries): number {
  return Object.values(entries).filter(e => e.done).length
}

/**
 * The Pass/Fail this log has earned on its own: 100 once enough weeks are reported, 0 once
 * the window has closed without them, and null while it is still achievable. Returning null
 * rather than 0 mid-run is what keeps an in-progress log out of the gradebook as a failure.
 */
export function autoGrade(
  entries: ActivityLogEntries,
  config: ActivityLogConfig,
  windowOpen: boolean,
): number | null {
  if (weeksReported(entries) >= config.requiredWeeks) return 100
  return windowOpen ? null : 0
}

// ─── Due dates ────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The date each week's report is due: the assignment's chosen weekday, on or after the due
 * date, then weekly. Week 1's deadline is the first such weekday falling on or after the
 * assignment's own dueDate, so an instructor who sets "Sundays" starting mid-week does not
 * silently make week 1 retroactive.
 */
export function weekDeadlines(dueDate: Date, config: ActivityLogConfig): string[] {
  const first = new Date(dueDate)
  first.setHours(23, 59, 59, 999)
  const shift = (config.dayOfWeek - first.getDay() + 7) % 7
  first.setTime(first.getTime() + shift * DAY_MS)
  return Array.from({ length: config.weeks }, (_, i) =>
    new Date(first.getTime() + i * 7 * DAY_MS).toISOString(),
  )
}
