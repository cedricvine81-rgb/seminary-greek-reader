// Server-side workings of a DIAGRAM assignment: a student's canvases for the assigned
// passage, the instructor's grading view, and the rules about when the work can still be
// edited. The passage itself is Assignment.reference; the canvases are the same layout
// JSON the personal Diagramming tab stores, one per sentence, keyed
// "chapter:verseStart-verseEnd".

import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { compareStudentsByName } from './sort-students'
import { submissionWindow } from './construct-submissions'

// Mirrors DiagramData in components/phrase/DiagramCanvas.tsx — retyped here so this
// server module doesn't import from a 'use client' component tree.
export interface DiagramLayout {
  words: Record<string, { x: number; y: number }>
  lines: { x1: number; y1: number; x2: number; y2: number; dash?: boolean; arrow?: boolean; shape?: 'bracket'; flip?: boolean }[]
  labels?: { x: number; y: number; text: string }[]
}
export type DiagramMap = Record<string, DiagramLayout>

export interface DiagramSubmissionState {
  diagrams: DiagramMap
  notes: string
  submittedAt: string | null
  grade: number | null
  gradeNote: string | null
}

export interface DiagramWorkspaceData {
  assignment: { id: string; title: string; reference: string | null; instructions: string | null }
  /** False once the submission window (including any late days) has passed. */
  open: boolean
  /** Past the due date but still inside the instructor's late window. */
  late: boolean
  submission: DiagramSubmissionState
}

const EMPTY_STATE: DiagramSubmissionState = {
  diagrams: {}, notes: '', submittedAt: null, grade: null, gradeNote: null,
}

// Generous but bounded: an assignment covers a handful of sentences; a stored blob the
// size of a chapter of layouts is either a bug or abuse either way.
const MAX_SENTENCES = 100
const MAX_BYTES = 500_000

/** Keep only entries that look like a canvas layout; cap count and total size. */
export function normalizeDiagrams(raw: unknown): DiagramMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: DiagramMap = {}
  let n = 0
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (n >= MAX_SENTENCES) break
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue
    const v = val as Record<string, unknown>
    if (!v.words || typeof v.words !== 'object' || !Array.isArray(v.lines)) continue
    out[key.slice(0, 40)] = v as unknown as DiagramLayout
    n++
  }
  return JSON.stringify(out).length <= MAX_BYTES ? out : {}
}

function toState(row: {
  diagrams: unknown; notes: string; submittedAt: Date | null; grade: number | null; gradeNote: string | null
} | null): DiagramSubmissionState {
  if (!row) return { ...EMPTY_STATE }
  return {
    diagrams: normalizeDiagrams(row.diagrams),
    notes: row.notes,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    grade: row.grade,
    gradeNote: row.gradeNote,
  }
}

const NOT_FOUND = 'Diagram assignment not found'

async function loadAssignment(assignmentId: string) {
  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true, title: true, type: true, courseId: true, reference: true, instructions: true,
      dueDate: true, round1Deadline: true, round2Deadline: true, allowLate: true, lateDaysLimit: true,
    },
  })
  if (!a || a.type !== 'DIAGRAM') throw new Error(NOT_FOUND)
  return a
}

/** Everything the student workspace renders, including their own saved work. */
export async function getDiagramWorkspace(assignmentId: string, userId: string): Promise<DiagramWorkspaceData> {
  const a = await loadAssignment(assignmentId)
  const row = await prisma.diagramSubmission.findUnique({
    where: { userId_assignmentId: { userId, assignmentId } },
    select: { diagrams: true, notes: true, submittedAt: true, grade: true, gradeNote: true },
  })
  const { open, late } = submissionWindow(a)
  return {
    assignment: { id: a.id, title: a.title, reference: a.reference, instructions: a.instructions },
    open,
    late,
    submission: toState(row),
  }
}

/**
 * Save (or hand in) a student's diagrams. Rejects edits once the window has closed, and
 * once they have submitted — reopening is the instructor's call.
 */
export async function saveDiagramSubmission(
  assignmentId: string,
  userId: string,
  input: { diagrams: unknown; notes: unknown; submit: boolean },
): Promise<DiagramSubmissionState> {
  const a = await loadAssignment(assignmentId)
  const { open } = submissionWindow(a)
  if (!open) throw new Error('CLOSED')

  const existing = await prisma.diagramSubmission.findUnique({
    where: { userId_assignmentId: { userId, assignmentId } },
    select: { submittedAt: true },
  })
  if (existing?.submittedAt) throw new Error('ALREADY_SUBMITTED')

  const diagrams = normalizeDiagrams(input.diagrams) as unknown as Prisma.InputJsonValue
  const notes = typeof input.notes === 'string' ? input.notes.slice(0, 20000) : ''
  const submittedAt = input.submit ? new Date() : null

  const saved = await prisma.diagramSubmission.upsert({
    where: { userId_assignmentId: { userId, assignmentId } },
    update: { diagrams, notes, submittedAt },
    create: { userId, assignmentId, diagrams, notes, submittedAt },
    select: { diagrams: true, notes: true, submittedAt: true, grade: true, gradeNote: true },
  })
  return toState(saved)
}

// ─── Instructor side ──────────────────────────────────────────────────────────

export interface DiagramGradingRow {
  userId: string
  name: string
  email: string
  submittedAt: string | null
  /** How many sentence canvases the student has touched. */
  sentenceCount: number
  diagrams: DiagramMap
  notes: string
  grade: number | null
  gradeNote: string | null
}

export interface DiagramGradingData {
  assignment: { id: string; title: string; reference: string | null; instructions: string | null }
  rows: DiagramGradingRow[]
}

/** Every enrolled student with their diagrams, submitted or not. */
export async function getDiagramGrading(assignmentId: string): Promise<DiagramGradingData> {
  const a = await loadAssignment(assignmentId)

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: a.courseId, status: 'APPROVED', user: { deletedAt: null } },
    include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
  })
  enrollments.sort((x, y) => compareStudentsByName(x.user, y.user))
  const studentIds = enrollments.map(e => e.user.id)

  const submissions = studentIds.length
    ? await prisma.diagramSubmission.findMany({
        where: { assignmentId, userId: { in: studentIds } },
        select: { userId: true, diagrams: true, notes: true, submittedAt: true, grade: true, gradeNote: true },
      })
    : []
  const byUser = new Map(submissions.map(s => [s.userId, s]))

  const rows = enrollments.map(e => {
    const s = byUser.get(e.user.id)
    const diagrams = normalizeDiagrams(s?.diagrams)
    return {
      userId: e.user.id,
      name: [e.user.firstName, e.user.surname].filter(Boolean).join(' ') || e.user.email,
      email: e.user.email,
      submittedAt: s?.submittedAt?.toISOString() ?? null,
      sentenceCount: Object.keys(diagrams).length,
      diagrams,
      notes: s?.notes ?? '',
      grade: s?.grade ?? null,
      gradeNote: s?.gradeNote ?? null,
    }
  })

  return {
    assignment: { id: a.id, title: a.title, reference: a.reference, instructions: a.instructions },
    rows,
  }
}

/** Save a student's grade (0–100) and feedback. Creates the row if they never saved any work. */
export async function gradeDiagramSubmission(
  assignmentId: string,
  userId: string,
  input: { grade: number | null; gradeNote: string | null },
) {
  return prisma.diagramSubmission.upsert({
    where: { userId_assignmentId: { userId, assignmentId } },
    update: { grade: input.grade, gradeNote: input.gradeNote },
    create: { userId, assignmentId, grade: input.grade, gradeNote: input.gradeNote },
    select: { grade: true, gradeNote: true },
  })
}

/** Hand a submitted set of diagrams back to one student so they can keep working. */
export async function reopenDiagramSubmission(assignmentId: string, userId: string) {
  await prisma.diagramSubmission.updateMany({
    where: { assignmentId, userId },
    data: { submittedAt: null },
  })
}
