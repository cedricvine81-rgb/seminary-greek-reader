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

type MineState = { submittedAt: Date | null } | null | undefined

// Whether THIS member can still edit/attest their own section: they have not submitted it,
// and either the deadline hasn't passed or the group has late approval. Deliberately keyed
// on the member's own submission and not the group's — a teammate handing in early must
// never freeze anyone else's work. The deadline still freezes everyone (late approval
// reopens it).
function isEditable(a: Anchor, submission: SubmissionState, mine: MineState): boolean {
  if (mine?.submittedAt) return false
  return Date.now() <= cutoff(a).getTime() || !!submission?.lateApproved
}

// Throw the matching user-facing error when this member's section is not currently editable.
function assertEditable(a: Anchor, submission: SubmissionState, mine: MineState) {
  if (mine?.submittedAt) throw new Error('You have already submitted your section')
  if (Date.now() > cutoff(a).getTime() && !submission?.lateApproved) {
    throw new Error('The deadline has passed. Ask your instructor to approve a late submission.')
  }
}

// Recompute the group-level roll-up: the group counts as submitted only once every member
// has submitted their own section. Called after any member submits or reopens.
//
// The timestamp is only stamped on the transition into "all in", never refreshed while it
// stays that way, so the recorded submission time is when the group actually completed
// rather than whenever this last ran.
async function syncGroupSubmitted(groupId: string, assignmentId: string) {
  const [members, existing] = await Promise.all([
    prisma.courseGroupMember.findMany({ where: { groupId }, select: { userId: true } }),
    prisma.groupSubmission.findUnique({ where: { groupId }, select: { submittedAt: true } }),
  ])
  // Counted against the CURRENT membership rather than all contribution rows: a member
  // removed from the group after submitting leaves their row behind, and counting it would
  // declare the group complete while a remaining member still hadn't handed in.
  const submitted = members.length === 0 ? 0 : await prisma.groupContribution.count({
    where: { groupId, submittedAt: { not: null }, userId: { in: members.map(m => m.userId) } },
  })
  const allIn = members.length > 0 && submitted >= members.length
  if (allIn === !!existing?.submittedAt) return          // already in the right state
  await prisma.groupSubmission.upsert({
    where: { groupId },
    update: { submittedAt: allIn ? new Date() : null },
    create: { groupId, assignmentId, submittedAt: allIn ? new Date() : null },
  })
}

// Recompute the roll-up for a group whose membership just changed. Resolves the assignment
// itself and does nothing for a plain messaging group that isn't tied to a presentation.
export async function syncGroupSubmittedForGroup(groupId: string) {
  const g = await prisma.courseGroup.findUnique({ where: { id: groupId }, select: { assignmentId: true } })
  if (!g?.assignmentId) return
  await syncGroupSubmitted(groupId, g.assignmentId)
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
      const mine = contribByUser.get(userId)
      // Group-level = everyone in. Member-level = just me. The two are reported separately
      // so the student sees both "I'm done" and "the group is still waiting on Anna".
      const submitted = !!g.submission?.submittedAt
      const mySubmitted = !!mine?.submittedAt
      const submittedCount = g.members.filter(m => !!contribByUser.get(m.user.id)?.submittedAt).length
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
        // This member's own hand-in, which is what actually gates their editing.
        mySubmitted,
        mySubmittedAt: mine?.submittedAt?.toISOString() ?? null,
        submittedCount,
        memberCount: g.members.length,
        lateApproved,
        // I can submit if I personally haven't yet, and we're within the deadline or the
        // group has late approval. A teammate's submission is irrelevant to this.
        canSubmit: !mySubmitted && (Date.now() <= deadline.getTime() || lateApproved),
        // My section locks once I submit it, or once the deadline passes without late
        // approval. A teammate submitting does not lock me.
        locked: !isEditable(a, g.submission, mine),
        groupGrade: g.submission?.grade ?? null,
        // The grade this student actually receives: their per-member override if set,
        // otherwise the group grade.
        grade: contribByUser.get(userId)?.grade ?? g.submission?.grade ?? null,
        gradeNote: contribByUser.get(userId)?.gradeNote ?? g.submission?.gradeNote ?? null,
        me: { body: mine?.body ?? '', aiDeclaration: mine?.aiDeclaration ?? '', attestedAt: mine?.attestedAt?.toISOString() ?? null },
        members: g.members.map(m => {
          const c = contribByUser.get(m.user.id)
          return {
            userId: m.user.id,
            name: studentName(m.user),
            isMe: m.user.id === userId,
            body: c?.body ?? '',
            contributed: !!c && c.body.trim() !== '',
            attested: !!c?.attestedAt,
            submitted: !!c?.submittedAt,
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
  const mine = await prisma.groupContribution.findUnique({
    where: { groupId_userId: { groupId, userId } }, select: { submittedAt: true },
  })
  assertEditable(a, group.submission, mine)
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
  const existing = await prisma.groupContribution.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { aiDeclaration: true, submittedAt: true } })
  assertEditable(group.assignment!, group.submission, existing)
  if (!existing || existing.aiDeclaration.trim() === '') throw new Error('Add your AI/sources statement before signing')
  return prisma.groupContribution.update({
    where: { groupId_userId: { groupId, userId } },
    data: { attestedAt: new Date() },
  })
}

// Submit this member's OWN section. Each member hands in independently: this locks only
// the submitter's section, leaving teammates free to keep working. Blocked after the
// deadline unless the instructor has approved a late submission.
export async function submitMyContribution(userId: string, groupId: string) {
  const group = await requireMembership(userId, groupId)
  const a = group.assignment!
  const mine = await prisma.groupContribution.findUnique({
    where: { groupId_userId: { groupId, userId } }, select: { submittedAt: true },
  })
  if (mine?.submittedAt) throw new Error('You have already submitted your section')
  if (Date.now() > cutoff(a).getTime() && !group.submission?.lateApproved) {
    throw new Error('The deadline has passed. Ask your instructor to approve a late submission.')
  }
  const saved = await prisma.groupContribution.upsert({
    where: { groupId_userId: { groupId, userId } },
    update: { submittedAt: new Date() },
    create: { groupId, assignmentId: a.id, userId, submittedAt: new Date() },
  })
  await syncGroupSubmitted(groupId, a.id)
  return saved
}

// Undo this member's own submission so they can keep editing. Scoped to the caller — a
// member can never reopen a teammate's section. Allowed only before the deadline; after
// it, an instructor reopen is required.
export async function reopenMyContribution(userId: string, groupId: string) {
  const group = await requireMembership(userId, groupId)
  const mine = await prisma.groupContribution.findUnique({
    where: { groupId_userId: { groupId, userId } }, select: { submittedAt: true },
  })
  if (!mine?.submittedAt) throw new Error('Not submitted')
  if (Date.now() > cutoff(group.assignment!).getTime()) throw new Error('The deadline has passed. Ask your instructor to reopen it.')
  const saved = await prisma.groupContribution.update({
    where: { groupId_userId: { groupId, userId } },
    data: { submittedAt: null },
  })
  await syncGroupSubmitted(groupId, group.assignment!.id)
  return saved
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
        // Members hand in independently, so a group is only "submitted" once all of them
        // have. submittedCount/memberCount show who is still outstanding.
        submitted,
        submittedAt: g.submission?.submittedAt?.toISOString() ?? null,
        submittedCount: g.members.filter(m => !!contribByUser.get(m.user.id)?.submittedAt).length,
        memberCount: g.members.length,
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
            submitted: !!c?.submittedAt,
            submittedAt: c?.submittedAt?.toISOString() ?? null,
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

// Reopen a submitted presentation: clear the roll-up AND every member's own submission,
// then grant late approval so the whole group can edit and resubmit even if the deadline
// has passed. Members' sections must be cleared too — since a member's own submittedAt is
// what locks their editing, leaving those set would reopen the group in name only.
export async function reopenGroupSubmission(assignmentId: string, groupId: string) {
  const group = await prisma.courseGroup.findFirst({ where: { id: groupId, assignmentId }, select: { id: true } })
  if (!group) throw new Error('Group not found')
  const [, submission] = await prisma.$transaction([
    prisma.groupContribution.updateMany({ where: { groupId }, data: { submittedAt: null } }),
    prisma.groupSubmission.upsert({
      where: { groupId },
      update: { submittedAt: null, lateApproved: true },
      create: { groupId, assignmentId, lateApproved: true },
    }),
  ])
  return submission
}
