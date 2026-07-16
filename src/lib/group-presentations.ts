import { prisma } from './db'

// Group Presentations: a group of enrolled students each writes their own section of a
// shared presentation (per-member, so contribution is unambiguous), signs an individual
// AI/originality attestation, and the group submits once for a single group grade.
//
// Bodies are stored as the raw rich-text the editor produces and are sanitized on the
// CLIENT before rendering (see note-html.ts — server-side sanitize is text-only), so
// nothing here trusts or strips the HTML; every consumer must sanitize before display.

// The moment after which a group can no longer submit unless the instructor approves a
// late submission. Prefer an explicit submissionDeadline, else the assignment's dueDate.
function cutoff(a: { submissionDeadline: Date | null; dueDate: Date }): Date {
  return a.submissionDeadline ?? a.dueDate
}

const studentName = (u: { firstName: string | null; surname: string | null; email: string }) =>
  [u.firstName, u.surname].filter(Boolean).join(' ') || u.email

type Anchor = { submissionDeadline: Date | null; dueDate: Date }
type SubmissionState = { submittedAt: Date | null; lateApproved: boolean } | null

// Whether members can still edit/attest: not yet submitted, and either before the deadline
// or granted late approval. The deadline itself freezes work (late approval reopens it).
function isEditable(a: Anchor, submission: SubmissionState): boolean {
  if (submission?.submittedAt) return false
  return Date.now() <= cutoff(a).getTime() || !!submission?.lateApproved
}

// Throw the matching user-facing error when a group's work is not currently editable.
function assertEditable(a: Anchor, submission: SubmissionState) {
  if (submission?.submittedAt) throw new Error('Already submitted')
  if (Date.now() > cutoff(a).getTime() && !submission?.lateApproved) {
    throw new Error('The deadline has passed. Ask your instructor to approve a late submission.')
  }
}

// ─── Student ──────────────────────────────────────────────────────

// Resolve the group the student belongs to for a given presentation assignment, checking
// the assignment is a published GROUP_PRESENTATION in one of their approved courses and
// that they are a member. Throws with a stable message on any failure.
async function requireMembership(userId: string, groupId: string) {
  const group = await prisma.courseGroup.findUnique({
    where: { id: groupId },
    include: {
      assignment: { select: { id: true, type: true, isPublished: true, dueDate: true, submissionDeadline: true, courseId: true } },
      members: { select: { userId: true } },
      submission: true,
    },
  })
  if (!group || !group.assignment || group.assignment.type !== 'GROUP_PRESENTATION' || !group.assignment.isPublished) {
    throw new Error('Presentation not found')
  }
  if (!group.members.some(m => m.userId === userId)) throw new Error('Not a member of this group')
  const enrolled = await prisma.enrollment.findFirst({
    where: { courseId: group.assignment.courseId, userId, status: 'APPROVED' }, select: { id: true },
  })
  if (!enrolled) throw new Error('Not enrolled')
  return group
}

// Every Group Presentation the student is a group member of, with their own section, their
// teammates' sections (read-only), the group's submission state, and the deadline.
export async function getGroupPresentationsForStudent(userId: string) {
  const memberships = await prisma.courseGroupMember.findMany({
    where: {
      userId,
      group: {
        assignment: {
          type: 'GROUP_PRESENTATION',
          isPublished: true,
          // Only surface presentations in courses the student is still approved-enrolled in,
          // so a dropped student can't keep reading their old group's work.
          course: { enrollments: { some: { userId, status: 'APPROVED' } } },
        },
      },
    },
    select: { groupId: true },
  })
  const groupIds = memberships.map(m => m.groupId)
  if (groupIds.length === 0) return []

  const groups = await prisma.courseGroup.findMany({
    where: { id: { in: groupIds } },
    include: {
      assignment: { select: { id: true, title: true, instructions: true, dueDate: true, submissionDeadline: true, course: { select: { id: true, name: true } } } },
      members: { include: { user: { select: { id: true, firstName: true, surname: true, email: true } } } },
      contributions: true,
      submission: true,
    },
  })

  // The group's shared message board: the "Message Group" sends among its members. Each send
  // fans out into one 1:1 Message per recipient sharing a broadcastId, so we gather every course
  // message where BOTH ends are current members and a broadcastId is set, then dedupe by
  // broadcastId to one entry per send. Requiring a broadcastId excludes private classmate DMs
  // (created without one); requiring the sender to be a member excludes instructor broadcasts;
  // and only this student's own groups are ever queried — so nothing leaks to non-members.
  const messagesByGroup = new Map<string, {
    id: string; senderId: string; senderName: string; subject: string; body: string; createdAt: string; mine: boolean
  }[]>()
  await Promise.all(groups.filter(g => g.assignment).map(async g => {
    const memberIds = g.members.map(m => m.user.id)
    const nameById = new Map(g.members.map(m => [m.user.id, studentName(m.user)]))
    const rows = await prisma.message.findMany({
      where: {
        courseId: g.assignment!.course.id,
        broadcastId: { not: null },
        senderId: { in: memberIds },
        recipientId: { in: memberIds },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, subject: true, body: true, broadcastId: true, senderId: true, createdAt: true },
    })
    const seen = new Set<string>()
    const board: { id: string; senderId: string; senderName: string; subject: string; body: string; createdAt: string; mine: boolean }[] = []
    for (const m of rows) {
      if (seen.has(m.broadcastId!)) continue   // one entry per fan-out send
      seen.add(m.broadcastId!)
      board.push({
        id: m.id, senderId: m.senderId, senderName: nameById.get(m.senderId) ?? 'A member',
        subject: m.subject, body: m.body, createdAt: m.createdAt.toISOString(), mine: m.senderId === userId,
      })
    }
    messagesByGroup.set(g.id, board)
  }))

  return groups
    .filter(g => g.assignment)
    .map(g => {
      const a = g.assignment!
      const contribByUser = new Map(g.contributions.map(c => [c.userId, c]))
      const deadline = cutoff(a)
      const submitted = !!g.submission?.submittedAt
      const lateApproved = !!g.submission?.lateApproved
      return {
        groupId: g.id,
        groupName: g.name,
        assignmentId: a.id,
        title: a.title,
        courseId: a.course.id,
        courseName: a.course.name,
        instructions: a.instructions,
        deadline: deadline.toISOString(),
        pastDeadline: Date.now() > deadline.getTime(),
        submitted,
        submittedAt: g.submission?.submittedAt?.toISOString() ?? null,
        lateApproved,
        // Group can still submit if not yet submitted and either within the deadline or granted late approval.
        canSubmit: !submitted && (Date.now() <= deadline.getTime() || lateApproved),
        // Editing is locked once submitted OR once the deadline passes without late
        // approval — the deadline freezes work; late approval reopens it.
        locked: !isEditable(a, g.submission),
        groupGrade: g.submission?.grade ?? null,
        // The grade this student actually receives: their per-member override if set,
        // otherwise the group grade.
        grade: contribByUser.get(userId)?.grade ?? g.submission?.grade ?? null,
        gradeNote: contribByUser.get(userId)?.gradeNote ?? g.submission?.gradeNote ?? null,
        me: (() => {
          const c = contribByUser.get(userId)
          return { body: c?.body ?? '', aiDeclaration: c?.aiDeclaration ?? '', attestedAt: c?.attestedAt?.toISOString() ?? null }
        })(),
        members: g.members.map(m => {
          const c = contribByUser.get(m.user.id)
          return {
            userId: m.user.id,
            name: studentName(m.user),
            isMe: m.user.id === userId,
            body: c?.body ?? '',
            contributed: !!c && c.body.trim() !== '',
            attested: !!c?.attestedAt,
          }
        }),
        // Group-only message board (see messagesByGroup above) — visible to members only.
        messages: messagesByGroup.get(g.id) ?? [],
      }
    })
}

export async function saveMyContribution(userId: string, groupId: string, data: { body?: string; aiDeclaration?: string }) {
  const group = await requireMembership(userId, groupId)
  const a = group.assignment!
  assertEditable(a, group.submission)
  return prisma.groupContribution.upsert({
    where: { groupId_userId: { groupId, userId } },
    update: {
      ...(data.body !== undefined ? { body: data.body } : {}),
      ...(data.aiDeclaration !== undefined ? { aiDeclaration: data.aiDeclaration } : {}),
    },
    create: {
      groupId, assignmentId: a.id, userId,
      body: data.body ?? '', aiDeclaration: data.aiDeclaration ?? '',
    },
  })
}

// Sign (or re-sign) this member's AI/originality attestation. Requires a non-empty
// declaration so an attestation always has content behind it.
export async function attestMyContribution(userId: string, groupId: string) {
  const group = await requireMembership(userId, groupId)
  assertEditable(group.assignment!, group.submission)
  const existing = await prisma.groupContribution.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { aiDeclaration: true } })
  if (!existing || existing.aiDeclaration.trim() === '') throw new Error('Add your AI/sources statement before signing')
  return prisma.groupContribution.update({
    where: { groupId_userId: { groupId, userId } },
    data: { attestedAt: new Date() },
  })
}

// Submit the whole group's presentation. Any member may submit; blocked after the
// deadline unless the instructor has approved a late submission.
export async function submitGroupPresentation(userId: string, groupId: string) {
  const group = await requireMembership(userId, groupId)
  if (group.submission?.submittedAt) throw new Error('Already submitted')
  const a = group.assignment!
  const late = Date.now() > cutoff(a).getTime()
  if (late && !group.submission?.lateApproved) throw new Error('The deadline has passed. Ask your instructor to approve a late submission.')
  return prisma.groupSubmission.upsert({
    where: { groupId },
    update: { submittedAt: new Date() },
    create: { groupId, assignmentId: a.id, submittedAt: new Date() },
  })
}

// Undo a submission so the group can keep editing. Members may only do this before the
// deadline (after it, an instructor reopen is required).
export async function reopenMyGroupSubmission(userId: string, groupId: string) {
  const group = await requireMembership(userId, groupId)
  if (!group.submission?.submittedAt) throw new Error('Not submitted')
  if (Date.now() > cutoff(group.assignment!).getTime()) throw new Error('The deadline has passed. Ask your instructor to reopen it.')
  return prisma.groupSubmission.update({ where: { groupId }, data: { submittedAt: null } })
}

// ─── Instructor ───────────────────────────────────────────────────

// Grading view: every group linked to this presentation, each member's contribution and
// attestation status, and the group's submission + grade. Caller must already be
// authorized for the assignment.
export async function getGroupPresentationGrading(assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, type: true, title: true, dueDate: true, submissionDeadline: true },
  })
  if (!assignment || assignment.type !== 'GROUP_PRESENTATION') throw new Error('Assignment not found')

  const groups = await prisma.courseGroup.findMany({
    where: { assignmentId },
    orderBy: { name: 'asc' },
    include: {
      members: { include: { user: { select: { id: true, firstName: true, surname: true, email: true } } } },
      contributions: true,
      submission: true,
    },
  })

  const deadline = cutoff(assignment)
  return {
    assignment: { id: assignment.id, title: assignment.title, deadline: deadline.toISOString() },
    groups: groups.map(g => {
      const contribByUser = new Map(g.contributions.map(c => [c.userId, c]))
      const submitted = !!g.submission?.submittedAt
      return {
        groupId: g.id,
        name: g.name,
        submitted,
        submittedAt: g.submission?.submittedAt?.toISOString() ?? null,
        pastDeadline: Date.now() > deadline.getTime(),
        lateApproved: !!g.submission?.lateApproved,
        grade: g.submission?.grade ?? null,
        gradeNote: g.submission?.gradeNote ?? null,
        members: g.members.map(m => {
          const c = contribByUser.get(m.user.id)
          return {
            userId: m.user.id,
            name: studentName(m.user),
            contributed: !!c && c.body.trim() !== '',
            attested: !!c?.attestedAt,
            body: c?.body ?? '',
            aiDeclaration: c?.aiDeclaration ?? '',
            // Per-member override; null means this member inherits the group grade.
            grade: c?.grade ?? null,
            gradeNote: c?.gradeNote ?? null,
          }
        }),
      }
    }),
  }
}

// Set (or clear) one member's individual grade override. A null grade removes the
// override so the member falls back to the group grade. Upserts the contribution row so
// a member can be graded even before they've written anything.
export async function gradeGroupMember(assignmentId: string, groupId: string, userId: string, data: { grade: number | null; gradeNote: string | null }) {
  const member = await prisma.courseGroupMember.findFirst({
    where: { groupId, userId, group: { assignmentId } }, select: { id: true },
  })
  if (!member) throw new Error('Group member not found')
  return prisma.groupContribution.upsert({
    where: { groupId_userId: { groupId, userId } },
    update: { grade: data.grade, gradeNote: data.gradeNote },
    create: { groupId, assignmentId, userId, grade: data.grade, gradeNote: data.gradeNote },
  })
}

export async function gradeGroupPresentation(assignmentId: string, groupId: string, data: { grade: number | null; gradeNote: string | null }) {
  // Guard that the group actually belongs to this assignment before writing.
  const group = await prisma.courseGroup.findFirst({ where: { id: groupId, assignmentId }, select: { id: true } })
  if (!group) throw new Error('Group not found')
  return prisma.groupSubmission.upsert({
    where: { groupId },
    update: { grade: data.grade, gradeNote: data.gradeNote },
    create: { groupId, assignmentId, grade: data.grade, gradeNote: data.gradeNote },
  })
}

// Approve (or revoke) a post-deadline submission for a group that missed the cutoff.
export async function setGroupLateApproval(assignmentId: string, groupId: string, approved: boolean) {
  const group = await prisma.courseGroup.findFirst({ where: { id: groupId, assignmentId }, select: { id: true } })
  if (!group) throw new Error('Group not found')
  return prisma.groupSubmission.upsert({
    where: { groupId },
    update: { lateApproved: approved },
    create: { groupId, assignmentId, lateApproved: approved },
  })
}

// Reopen a submitted presentation: clear the submission and grant late approval so the
// group can edit and resubmit even if the deadline has already passed.
export async function reopenGroupSubmission(assignmentId: string, groupId: string) {
  const group = await prisma.courseGroup.findFirst({ where: { id: groupId, assignmentId }, select: { id: true } })
  if (!group) throw new Error('Group not found')
  return prisma.groupSubmission.upsert({
    where: { groupId },
    update: { submittedAt: null, lateApproved: true },
    create: { groupId, assignmentId, lateApproved: true },
  })
}
