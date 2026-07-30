// Server-side workings of a CONSTRUCT_SEARCH assignment: a student's find-list, the
// instructor's grading view, and the rules about when the list can still be edited.
// The search itself is the link in Assignment.reference (construct-assignment.ts).

import { addDays } from 'date-fns'
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { effectiveDeadline } from './assignment-deadline'
import { compareStudentsByName } from './sort-students'
import {
  emptyFinding, normalizeConstructConfig, normalizeFindings,
  type ConstructConfig, type ConstructFinding,
} from './construct-assignment'

export interface ConstructSubmissionState {
  findings: ConstructFinding[]
  notes: string
  submittedAt: string | null
  grade: number | null
  gradeNote: string | null
}

export interface ConstructWorkspaceData {
  assignment: {
    id: string
    title: string
    /** The construct link, exactly as students should open it. */
    searchHref: string | null
    instructions: string | null
    config: ConstructConfig
  }
  /** False once the submission window (including any late days) has passed. */
  open: boolean
  /** Past the due date but still inside the instructor's late window. */
  late: boolean
  submission: ConstructSubmissionState
}

const EMPTY_STATE: ConstructSubmissionState = {
  findings: [], notes: '', submittedAt: null, grade: null, gradeNote: null,
}

/** Start a student off with the number of rows the assignment asks for. */
export function blankFindings(config: ConstructConfig): ConstructFinding[] {
  return Array.from({ length: config.requiredCount }, emptyFinding)
}

type WindowSource = {
  dueDate: Date; round1Deadline: Date | null; round2Deadline: Date | null
  allowLate: boolean; lateDaysLimit: number | null
}

/**
 * Whether the find-list can still be edited, by the same rule the student assignment page
 * shows: closed once the due date has passed, unless late submissions are allowed and the
 * late window (if any) is still running.
 */
export function submissionWindow(a: WindowSource, now = new Date()): { open: boolean; late: boolean } {
  const due = effectiveDeadline(a)
  if (now <= due) return { open: true, late: false }
  if (!a.allowLate) return { open: false, late: false }
  const lateDeadline = a.lateDaysLimit != null ? addDays(due, a.lateDaysLimit) : null
  const stillOpen = lateDeadline === null || now <= lateDeadline
  return { open: stillOpen, late: stillOpen }
}

function toState(row: {
  findings: unknown; notes: string; submittedAt: Date | null; grade: number | null; gradeNote: string | null
} | null): ConstructSubmissionState {
  if (!row) return { ...EMPTY_STATE }
  return {
    findings: normalizeFindings(row.findings),
    notes: row.notes,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    grade: row.grade,
    gradeNote: row.gradeNote,
  }
}

const NOT_FOUND = 'Construct search not found'

async function loadAssignment(assignmentId: string) {
  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true, title: true, type: true, courseId: true, reference: true, instructions: true,
      constructConfig: true, dueDate: true, round1Deadline: true, round2Deadline: true,
      allowLate: true, lateDaysLimit: true,
    },
  })
  if (!a || a.type !== 'CONSTRUCT_SEARCH') throw new Error(NOT_FOUND)
  return a
}

/** Everything the student workspace renders, including their own saved work. */
export async function getConstructWorkspace(assignmentId: string, userId: string): Promise<ConstructWorkspaceData> {
  const a = await loadAssignment(assignmentId)
  const row = await prisma.constructSubmission.findUnique({
    where: { userId_assignmentId: { userId, assignmentId } },
    select: { findings: true, notes: true, submittedAt: true, grade: true, gradeNote: true },
  })
  const config = normalizeConstructConfig(a.constructConfig)
  const { open, late } = submissionWindow(a)
  const state = toState(row)
  return {
    assignment: {
      id: a.id,
      title: a.title,
      // Only ever a same-origin path — the link is re-parsed when it is saved.
      searchHref: a.reference?.startsWith('/search/construct') ? a.reference : null,
      instructions: a.instructions,
      config,
    },
    open,
    late,
    // A student who has never saved gets the empty list the assignment asks for, so the
    // table has its rows on first open rather than after a save.
    submission: state.findings.length > 0 ? state : { ...state, findings: blankFindings(config) },
  }
}

/**
 * Save (or hand in) a student's find-list. Rejects edits once the window has closed, and
 * once they have submitted — reopening is the instructor's call, so a student cannot
 * quietly rewrite work that has been collected.
 */
export async function saveConstructSubmission(
  assignmentId: string,
  userId: string,
  input: { findings: unknown; notes: unknown; submit: boolean },
): Promise<ConstructSubmissionState> {
  const a = await loadAssignment(assignmentId)
  const { open } = submissionWindow(a)
  if (!open) throw new Error('CLOSED')

  const existing = await prisma.constructSubmission.findUnique({
    where: { userId_assignmentId: { userId, assignmentId } },
    select: { submittedAt: true },
  })
  if (existing?.submittedAt) throw new Error('ALREADY_SUBMITTED')

  const findings = normalizeFindings(input.findings)
  const notes = typeof input.notes === 'string' ? input.notes.slice(0, 20000) : ''
  const submittedAt = input.submit ? new Date() : null

  // Prisma's Json input type doesn't accept an interface-typed array directly.
  const findingsJson = findings as unknown as Prisma.InputJsonValue
  const saved = await prisma.constructSubmission.upsert({
    where: { userId_assignmentId: { userId, assignmentId } },
    update: { findings: findingsJson, notes, submittedAt },
    create: { userId, assignmentId, findings: findingsJson, notes, submittedAt },
    select: { findings: true, notes: true, submittedAt: true, grade: true, gradeNote: true },
  })
  return toState(saved)
}

// ─── Instructor side ──────────────────────────────────────────────────────────

export interface ConstructGradingRow {
  userId: string
  name: string
  email: string
  submittedAt: string | null
  /** Findings with both a reference and the Greek filled in — what counts towards the target. */
  completeCount: number
  findings: ConstructFinding[]
  notes: string
  grade: number | null
  gradeNote: string | null
}

export interface ConstructGradingData {
  assignment: { id: string; title: string; searchHref: string | null; config: ConstructConfig }
  rows: ConstructGradingRow[]
}

/** Every enrolled student with their find-list, submitted or not. */
export async function getConstructGrading(assignmentId: string): Promise<ConstructGradingData> {
  const a = await loadAssignment(assignmentId)
  const config = normalizeConstructConfig(a.constructConfig)

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: a.courseId, status: 'APPROVED', user: { deletedAt: null } },
    include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
  })
  enrollments.sort((x, y) => compareStudentsByName(x.user, y.user))
  const studentIds = enrollments.map(e => e.user.id)

  const submissions = studentIds.length
    ? await prisma.constructSubmission.findMany({
        where: { assignmentId, userId: { in: studentIds } },
        select: { userId: true, findings: true, notes: true, submittedAt: true, grade: true, gradeNote: true },
      })
    : []
  const byUser = new Map(submissions.map(s => [s.userId, s]))

  const rows = enrollments.map(e => {
    const s = byUser.get(e.user.id)
    // Only the rows they actually filled in — blank starter rows aren't work.
    const findings = normalizeFindings(s?.findings).filter(f => f.ref || f.greek || f.translation || f.comment)
    return {
      userId: e.user.id,
      name: [e.user.firstName, e.user.surname].filter(Boolean).join(' ') || e.user.email,
      email: e.user.email,
      submittedAt: s?.submittedAt?.toISOString() ?? null,
      completeCount: findings.filter(f => f.ref.trim() && f.greek.trim()).length,
      findings,
      notes: s?.notes ?? '',
      grade: s?.grade ?? null,
      gradeNote: s?.gradeNote ?? null,
    }
  })

  return {
    assignment: {
      id: a.id,
      title: a.title,
      searchHref: a.reference?.startsWith('/search/construct') ? a.reference : null,
      config,
    },
    rows,
  }
}

/** Save a student's grade (0–100) and feedback. Creates the row if they never saved any work. */
export async function gradeConstructSubmission(
  assignmentId: string,
  userId: string,
  input: { grade: number | null; gradeNote: string | null },
) {
  return prisma.constructSubmission.upsert({
    where: { userId_assignmentId: { userId, assignmentId } },
    update: { grade: input.grade, gradeNote: input.gradeNote },
    create: { userId, assignmentId, grade: input.grade, gradeNote: input.gradeNote },
    select: { grade: true, gradeNote: true },
  })
}

/**
 * Hand a submitted find-list back to one student so they can keep working — the same
 * escape hatch translation exams have, for the student who submitted three rows by accident.
 */
export async function reopenConstructSubmission(assignmentId: string, userId: string) {
  await prisma.constructSubmission.updateMany({
    where: { assignmentId, userId },
    data: { submittedAt: null },
  })
}
