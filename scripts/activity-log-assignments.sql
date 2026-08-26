-- Activity Log assignments.
--
-- An instructor states a required activity in free text, picks the day of the week the
-- report is due and how many weeks it runs; each enrolled student gets ONE row here and
-- checks in once per week. The grade is Pass/Fail, stored as 100/0 so the gradebook's
-- numeric averaging keeps working — the UI renders it as "Pass"/"Fail".
--
-- Run this in Supabase BEFORE deploying the code that uses it.
--
-- NOT wrapped in a transaction: `ALTER TYPE ... ADD VALUE` cannot run inside one.
-- Every statement is idempotent, so re-running is safe.

-- 1. The new assignment type. A value can be added to a Postgres enum but never removed.
ALTER TYPE "AssignmentType" ADD VALUE IF NOT EXISTS 'ACTIVITY_LOG';

-- 2. The per-assignment setup: { weeks, dayOfWeek (0=Sun..6=Sat), requiredWeeks }.
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "activityConfig" JSONB;

-- 3. One row per student per ACTIVITY_LOG assignment. `entries` is keyed by week number
--    ("1".."N") because which weeks exist is per-assignment, and an unreported week is
--    simply an absent key rather than a NULL column.
CREATE TABLE IF NOT EXISTS "ActivityLogSubmission" (
  "id"           TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "assignmentId" TEXT         NOT NULL,
  "entries"      JSONB        NOT NULL DEFAULT '{}',
  "notes"        TEXT         NOT NULL DEFAULT '',
  "submittedAt"  TIMESTAMP(3),
  "grade"        INTEGER,
  "gradeNote"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLogSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ActivityLogSubmission_userId_assignmentId_key"
  ON "ActivityLogSubmission" ("userId", "assignmentId");
CREATE INDEX IF NOT EXISTS "ActivityLogSubmission_assignmentId_idx"
  ON "ActivityLogSubmission" ("assignmentId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivityLogSubmission_userId_fkey') THEN
    ALTER TABLE "ActivityLogSubmission" ADD CONSTRAINT "ActivityLogSubmission_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivityLogSubmission_assignmentId_fkey') THEN
    ALTER TABLE "ActivityLogSubmission" ADD CONSTRAINT "ActivityLogSubmission_assignmentId_fkey"
      FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Verify.
SELECT unnest(enum_range(NULL::"AssignmentType")) AS assignment_types;
SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'ActivityLogSubmission' ORDER BY ordinal_position;
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'Assignment' AND column_name = 'activityConfig';
