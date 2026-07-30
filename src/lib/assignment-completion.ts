import { prisma } from './db'

/**
 * Every assignment this student has handed in, whatever kind it is.
 *
 * Only quizzes leave Response rows; each of the other types records its submission in its
 * own table. Reading Responses alone therefore marks a submitted translation exercise,
 * course-notes folder, group section, or construct search as still outstanding — which is
 * how the Assignments list came to show "Overdue — Submit" on work a student had already
 * turned in, while the same assignment on their course card showed Completed. Both pages
 * now call this, so the two views cannot disagree again.
 */
export async function completedAssignmentIds(userId: string): Promise<Set<string>> {
  const [responses, exegesisSessions, noteSubmissions, groupContributions, constructSubmissions] = await Promise.all([
    prisma.response.findMany({
      where: { userId },
      select: { assignmentId: true },
      distinct: ['assignmentId'],
    }),
    // Translation exercises and exams: submitted when the exegesis session is submitted.
    prisma.exegesisSession.findMany({
      where: { userId, assignmentId: { not: null }, submittedAt: { not: null } },
      select: { assignmentId: true },
    }),
    // Course notes: the row exists only once the student submits their folder.
    prisma.noteSubmission.findMany({
      where: { userId },
      select: { assignmentId: true },
    }),
    // Group presentations: each member hands in their own section.
    prisma.groupContribution.findMany({
      where: { userId, submittedAt: { not: null } },
      select: { assignmentId: true },
    }),
    // Construct searches: submitted when the find-list is handed in.
    prisma.constructSubmission.findMany({
      where: { userId, submittedAt: { not: null } },
      select: { assignmentId: true },
    }),
  ])

  const ids = new Set<string>()
  for (const r of responses) ids.add(r.assignmentId)
  for (const s of exegesisSessions) if (s.assignmentId) ids.add(s.assignmentId)
  for (const n of noteSubmissions) ids.add(n.assignmentId)
  for (const g of groupContributions) ids.add(g.assignmentId)
  for (const c of constructSubmissions) ids.add(c.assignmentId)
  return ids
}
