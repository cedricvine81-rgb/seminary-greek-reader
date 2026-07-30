-- Construct Search assignments.
--
-- RUN THIS IN SUPABASE BEFORE DEPLOYING THE CODE THAT USES IT.
-- The new build reads "Assignment"."constructConfig" and the "ConstructSubmission" table as
-- soon as it is live; without them every construct-search page (instructor form, student
-- view, grading) errors.
--
-- The CONSTRUCT_SEARCH value of the "AssignmentType" enum is already in place — this adds
-- only what the assignment stores. The search itself is the link in "Assignment"."reference".
--
-- Safe to run more than once.

BEGIN;

-- 1. How the find-list is set up: { requiredCount, askTranslation, askComment }.
ALTER TABLE "Assignment"
  ADD COLUMN IF NOT EXISTS "constructConfig" JSONB;

-- 2. One row per student per construct-search assignment, created on their first save and
--    marked submitted when they hand it in. "findings" is the whole find-list as JSON.
CREATE TABLE IF NOT EXISTS "ConstructSubmission" (
  "id"           TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "assignmentId" TEXT         NOT NULL,
  "findings"     JSONB        NOT NULL DEFAULT '[]',
  "notes"        TEXT         NOT NULL DEFAULT '',
  "submittedAt"  TIMESTAMP(3),
  "grade"        INTEGER,
  "gradeNote"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ConstructSubmission_pkey" PRIMARY KEY ("id")
);

-- One submission per student per assignment — the app upserts on this pair.
CREATE UNIQUE INDEX IF NOT EXISTS "ConstructSubmission_userId_assignmentId_key"
  ON "ConstructSubmission" ("userId", "assignmentId");

-- The grading view loads every submission for one assignment.
CREATE INDEX IF NOT EXISTS "ConstructSubmission_assignmentId_idx"
  ON "ConstructSubmission" ("assignmentId");

-- Cascade on both sides: deleting a student or an assignment takes its submissions with it,
-- the same rule the other submission tables use.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConstructSubmission_userId_fkey'
  ) THEN
    ALTER TABLE "ConstructSubmission"
      ADD CONSTRAINT "ConstructSubmission_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConstructSubmission_assignmentId_fkey'
  ) THEN
    ALTER TABLE "ConstructSubmission"
      ADD CONSTRAINT "ConstructSubmission_assignmentId_fkey"
      FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;

-- Check afterwards — both should return a row:
--
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'Assignment' AND column_name = 'constructConfig';
--
--   SELECT COUNT(*) FROM "ConstructSubmission";
