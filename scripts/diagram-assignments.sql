-- Diagramming assignments (the DIAGRAM assignment type).
--
-- RUN THIS IN SUPABASE BEFORE DEPLOYING THE CODE THAT USES IT.
-- The new build offers "Diagramming Exercise" in the assignment builder and reads/writes
-- the "DiagramSubmission" table; without these, creating one fails and every student
-- save 500s.
--
-- NOTE: step 1 (the enum value) must NOT run inside a transaction — run this file as-is
-- in the Supabase SQL editor (it autocommits each statement), or run step 1 separately
-- first. An enum value can be added but never removed.
--
-- Safe to run more than once.

-- 1. The new assignment type.
ALTER TYPE "AssignmentType" ADD VALUE IF NOT EXISTS 'DIAGRAM';

-- 2. One row per student per DIAGRAM assignment: every sentence canvas of the assigned
--    passage as one JSON object (keyed "chapter:verseStart-verseEnd"), draft until
--    "submittedAt" is set, graded 0-100 by the instructor.
CREATE TABLE IF NOT EXISTS "DiagramSubmission" (
  "id"           TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "assignmentId" TEXT         NOT NULL,
  "diagrams"     JSONB        NOT NULL DEFAULT '{}',
  "notes"        TEXT         NOT NULL DEFAULT '',
  "submittedAt"  TIMESTAMP(3),
  "grade"        INTEGER,
  "gradeNote"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DiagramSubmission_pkey" PRIMARY KEY ("id")
);

-- One submission per student per assignment — the app upserts on this pair.
CREATE UNIQUE INDEX IF NOT EXISTS "DiagramSubmission_userId_assignmentId_key"
  ON "DiagramSubmission" ("userId", "assignmentId");

-- The grading view loads every submission for one assignment.
CREATE INDEX IF NOT EXISTS "DiagramSubmission_assignmentId_idx"
  ON "DiagramSubmission" ("assignmentId");

-- Cascade on both sides, the same rule the other submission tables use.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DiagramSubmission_userId_fkey'
  ) THEN
    ALTER TABLE "DiagramSubmission"
      ADD CONSTRAINT "DiagramSubmission_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DiagramSubmission_assignmentId_fkey'
  ) THEN
    ALTER TABLE "DiagramSubmission"
      ADD CONSTRAINT "DiagramSubmission_assignmentId_fkey"
      FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Check afterwards — both should succeed:
--
--   SELECT 'DIAGRAM'::"AssignmentType";
--   SELECT COUNT(*) FROM "DiagramSubmission";
