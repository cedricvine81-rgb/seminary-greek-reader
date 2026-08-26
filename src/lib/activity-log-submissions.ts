// Server-side workings of an ACTIVITY_LOG assignment: an activity the instructor states in
// free text, which the student reports doing once a week for a set number of weeks.
//
// One submission row covers the whole run — the weekly reports live in `entries`, keyed by
// week number — so however many weeks the activity runs, the gradebook gets a single
// Pass/Fail column. Pass/Fail is stored as 100/0 in `grade` so the existing numeric
// averaging keeps working; only the display renders it as words.

import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { compareStudentsByName } from './sort-students'
import { submissionWindow } from './construct-submissions'
import {
  normalizeActivityConfig, normalizeEntries, weeksReported, autoGrade, weekDeadlines,
  type ActivityLogConfig, type ActivityLogEntries,
} from './activity-log'

// Re-exported so server callers can keep importing everything from one place.
export {
  normalizeActivityConfig, normalizeEntries, weeksReported, autoGrade, weekDeadlines, MAX_WEEKS,
} from './activity-log'
export type { ActivityLogConfig, ActivityLogEntry, ActivityLogEntries } from './activity-log'

// ─── Student workspace ────────────────────────────────────────────────────────

export interface ActivityLogState {
  entries: ActivityLogEntries
  notes: string
  submittedAt: string | null
  grade: number | null
  gradeNote: string | null
}

export interface ActivityLogWorkspaceData {
  assignment: { id: string; title: string; instructions: string | null }
  config: ActivityLogConfig
  /** ISO deadline for each week, in order. */
  deadlines: string[]
  /** False once the submission window (including any late days) has passed. */
  open: boolean
  /** Past the due date but still inside the instructor's late window. */
  late: boolean
  submission: ActivityLogState
}

const EMPTY_STATE: ActivityLogState = {
  entries: {}, notes: '', submittedAt: null, grade: null, gradeNote: null,
}

function toState(
  row: { entries: unknown; notes: string; submittedAt: Date | null; grade: number | null; gradeNote: string | null } | null,
  weeks: number,
): ActivityLogState {
  if (!row) return { ...EMPTY_STATE }
  return {
    entries: normalizeEntries(row.entries, weeks),
    notes: row.notes,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    grade: row.grade,
    gradeNote: row.gradeNote,
  }
}

const NOT_FOUND = 'Activity log assignment not found'

async function loadAssignment(assignmentId: string) {
  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true, title: true, type: true, courseId: true, instructions: true, activityConfig: true,
      dueDate: true, round1Deadline: true, round2Deadline: true, allowLate: true, lateDaysLimit: true,
    },
  })
  if (!a || a.type !== 'ACTIVITY_LOG') throw new Error(NOT_FOUND)
  return a
}

/** Everything the student workspace renders, including their own weekly reports. */
export async function getActivityLogWorkspace(
  assignmentId: string,
  userId: string,
): Promise<ActivityLogWorkspaceData> {
  const a = await loadAssignment(assignmentId)
  const config = normalizeActivityConfig(a.activityConfig)
  const row = await prisma.activityLogSubmission.findUnique({
    where: { userId_assignmentId: { userId, assignmentId } },
    select: { entries: true, notes: true, submittedAt: true, grade: true, gradeNote: true },
  })
  const { open, late } = submissionWindow(a)
  return {
    assignment: { id: a.id, title: a.title, instructions: a.instructions },
    config,
    deadlines: weekDeadlines(a.dueDate, config),
    open,
    late,
    submission: toState(row, config.weeks),
  }
}

/**
 * Save a student's weekly reports.
 *
 * Unlike the other submission types there is no separate "hand in" step — the log is the
 * submission, and it stays editable all run. `submittedAt` is therefore derived: it is set
 * the moment every week has been reported and cleared again if one is un-reported, so the
 * "handed in" badge never claims a log is finished while weeks are outstanding.
 */
export async function saveActivityLog(
  assignmentId: string,
  userId: string,
  input: { entries: unknown; notes: unknown },
): Promise<ActivityLogState> {
  const a = await loadAssignment(assignmentId)
  const { open } = submissionWindow(a)
  if (!open) throw new Error('CLOSED')

  const config = normalizeActivityConfig(a.activityConfig)
  const entries = normalizeEntries(input.entries, config.weeks)
  const notes = typeof input.notes === 'string' ? input.notes.slice(0, 20000) : ''
  const submittedAt = weeksReported(entries) >= config.weeks ? new Date() : null

  const saved = await prisma.activityLogSubmission.upsert({
    where: { userId_assignmentId: { userId, assignmentId } },
    update: { entries: entries as unknown as Prisma.InputJsonValue, notes, submittedAt },
    create: { userId, assignmentId, entries: entries as unknown as Prisma.InputJsonValue, notes, submittedAt },
    select: { entries: true, notes: true, submittedAt: true, grade: true, gradeNote: true },
  })
  return toState(saved, config.weeks)
}

// ─── Instructor side ──────────────────────────────────────────────────────────

export interface ActivityLogGradingRow {
  userId: string
  name: string
  email: string
  entries: ActivityLogEntries
  notes: string
  /** How many weeks this student has reported. */
  reported: number
  submittedAt: string | null
  /** Pass/Fail this log has earned on its own; null while still achievable. */
  auto: number | null
  /** The instructor's explicit grade, which overrides `auto`. */
  grade: number | null
  gradeNote: string | null
}

export interface ActivityLogGradingData {
  assignment: { id: string; title: string; instructions: string | null }
  config: ActivityLogConfig
  deadlines: string[]
  rows: ActivityLogGradingRow[]
}

/** Every enrolled student with their weekly reports, complete or not. */
export async function getActivityLogGrading(assignmentId: string): Promise<ActivityLogGradingData> {
  const a = await loadAssignment(assignmentId)
  const config = normalizeActivityConfig(a.activityConfig)
  const { open } = submissionWindow(a)

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: a.courseId, status: 'APPROVED', user: { deletedAt: null } },
    include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
  })
  enrollments.sort((x, y) => compareStudentsByName(x.user, y.user))
  const studentIds = enrollments.map(e => e.user.id)

  const submissions = studentIds.length
    ? await prisma.activityLogSubmission.findMany({
        where: { assignmentId, userId: { in: studentIds } },
        select: { userId: true, entries: true, notes: true, submittedAt: true, grade: true, gradeNote: true },
      })
    : []
  const byUser = new Map(submissions.map(s => [s.userId, s]))

  const rows = enrollments.map(e => {
    const s = byUser.get(e.user.id)
    const entries = normalizeEntries(s?.entries, config.weeks)
    return {
      userId: e.user.id,
      name: [e.user.firstName, e.user.surname].filter(Boolean).join(' ') || e.user.email,
      email: e.user.email,
      entries,
      notes: s?.notes ?? '',
      reported: weeksReported(entries),
      submittedAt: s?.submittedAt?.toISOString() ?? null,
      auto: autoGrade(entries, config, open),
      grade: s?.grade ?? null,
      gradeNote: s?.gradeNote ?? null,
    }
  })

  return {
    assignment: { id: a.id, title: a.title, instructions: a.instructions },
    config,
    deadlines: weekDeadlines(a.dueDate, config),
    rows,
  }
}

/** Save one student's Pass/Fail override (100, 0, or null to fall back to the auto grade). */
export async function gradeActivityLog(
  assignmentId: string,
  userId: string,
  input: { grade: number | null; gradeNote: string | null },
) {
  const grade = input.grade == null ? null : input.grade >= 50 ? 100 : 0
  return prisma.activityLogSubmission.upsert({
    where: { userId_assignmentId: { userId, assignmentId } },
    update: { grade, gradeNote: input.gradeNote },
    create: { userId, assignmentId, grade, gradeNote: input.gradeNote },
    select: { grade: true, gradeNote: true },
  })
}

/**
 * Write every student's auto Pass/Fail into `grade` in one go, so the instructor can accept
 * the computed result for the whole class instead of clicking through it. Students who
 * already carry an explicit grade are left alone.
 */
export async function applyAutoGrades(assignmentId: string): Promise<number> {
  const { rows } = await getActivityLogGrading(assignmentId)
  const pending = rows.filter(r => r.grade == null && r.auto != null)
  for (const r of pending) {
    await prisma.activityLogSubmission.upsert({
      where: { userId_assignmentId: { userId: r.userId, assignmentId } },
      update: { grade: r.auto },
      create: { userId: r.userId, assignmentId, grade: r.auto },
    })
  }
  return pending.length
}
