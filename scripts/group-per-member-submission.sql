-- Per-member submission for Group Presentations.
--
-- RUN THIS IN SUPABASE BEFORE DEPLOYING THE CODE THAT USES IT.
-- The app reads "GroupContribution"."submittedAt" as soon as the new build is live; if the
-- column is missing, every group presentation page errors.
--
-- WHAT CHANGES
-- Submission moves from the group to the individual. Previously one "GroupSubmission" row
-- per group held a single submittedAt, and the moment any member set it every other member
-- was frozen out of writing their section and signing their attestation. Now each member
-- has their own submittedAt and locks only themselves; the group-level field becomes a
-- roll-up, set only once every member is in.
--
-- Safe to run more than once.

BEGIN;

-- 1. The new per-member column.
ALTER TABLE "GroupContribution"
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);

-- 2. Backfill, so groups that have ALREADY submitted stay submitted.
--    Without this they would reappear as "0 of 4 submitted" after deploy and their members
--    could edit work you have already collected.
--
-- 2a. A member who never opened the assignment has no contribution row at all, so there is
--     nothing to mark. Give those members an empty row first, otherwise the roll-up in 2b
--     can never reach "all in" and the group would drop out of Submitted.
INSERT INTO "GroupContribution" ("id", "groupId", "assignmentId", "userId", "body", "aiDeclaration", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, m."groupId", g."assignmentId", m."userId", '', '', NOW(), NOW()
FROM "CourseGroupMember" m
JOIN "CourseGroup" g ON g."id" = m."groupId"
JOIN "GroupSubmission" s ON s."groupId" = m."groupId"
WHERE s."submittedAt" IS NOT NULL
  AND g."assignmentId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "GroupContribution" c
    WHERE c."groupId" = m."groupId" AND c."userId" = m."userId"
  );

-- 2b. Mark every member of an already-submitted group as having submitted, dated to the
--     group's own submission time rather than now.
UPDATE "GroupContribution" c
SET "submittedAt" = s."submittedAt"
FROM "GroupSubmission" s
WHERE s."groupId" = c."groupId"
  AND s."submittedAt" IS NOT NULL
  AND c."submittedAt" IS NULL;

COMMIT;

-- Check afterwards: every row should show submitted = members for groups that were already
-- in, and submitted = 0 for those that weren't. Nothing should be partial.
--
--   SELECT g."name",
--          COUNT(DISTINCT m."userId")                                     AS members,
--          COUNT(DISTINCT c."userId") FILTER (WHERE c."submittedAt" IS NOT NULL) AS submitted,
--          s."submittedAt"                                                AS group_submitted
--   FROM "CourseGroup" g
--   JOIN "CourseGroupMember" m ON m."groupId" = g."id"
--   LEFT JOIN "GroupContribution" c ON c."groupId" = g."id"
--   LEFT JOIN "GroupSubmission" s ON s."groupId" = g."id"
--   WHERE g."assignmentId" IS NOT NULL
--   GROUP BY g."id", g."name", s."submittedAt"
--   ORDER BY g."name";
