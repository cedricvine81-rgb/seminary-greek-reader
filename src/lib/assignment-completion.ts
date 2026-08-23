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
 *
 * One UNION, not five findMany calls: DATABASE_URL runs with connection_limit=1 (pgbouncer),
 * so every query on a page is serialized through a single connection and page latency is
 * queries × round-trip. Five parallel-looking reads here made the dashboard measurably
 * slower the day this shipped; as raw SQL the whole answer is one round trip.
 */
export async function completedAssignmentIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT DISTINCT "assignmentId" AS id FROM "Response"            WHERE "userId" = ${userId}
    UNION
    SELECT "assignmentId" FROM "ExegesisSession"    WHERE "userId" = ${userId} AND "assignmentId" IS NOT NULL AND "submittedAt" IS NOT NULL
    UNION
    SELECT "assignmentId" FROM "NoteSubmission"     WHERE "userId" = ${userId}
    UNION
    SELECT "assignmentId" FROM "GroupContribution"  WHERE "userId" = ${userId} AND "submittedAt" IS NOT NULL
    UNION
    SELECT "assignmentId" FROM "ConstructSubmission" WHERE "userId" = ${userId} AND "submittedAt" IS NOT NULL
    UNION
    SELECT "assignmentId" FROM "DiagramSubmission"   WHERE "userId" = ${userId} AND "submittedAt" IS NOT NULL
  `
  return new Set(rows.map(r => r.id))
}
