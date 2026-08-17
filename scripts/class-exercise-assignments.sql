-- Class exercises: homework sets activated as non-assessed in-class work.
--
-- RUN THIS IN SUPABASE BEFORE DEPLOYING THE CODE THAT USES IT.
-- The new build reads "Assignment"."assessed" on every assignment query (activation panel,
-- student homework list, scores page); without the column those pages error.
--
-- assessed = true  → normal graded homework (every existing row, hence the default)
-- assessed = false → class exercise: students work it exactly like homework, but it carries
--                    no grade and is excluded from the gradebook and course averages.
--
-- Safe to run more than once.

ALTER TABLE "Assignment"
  ADD COLUMN IF NOT EXISTS "assessed" BOOLEAN NOT NULL DEFAULT true;
