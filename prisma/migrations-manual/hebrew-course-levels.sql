-- Two new CourseLevel values so a course can be set up as a HEBREW course:
-- "Beginning Hebrew" and "Intermediate Hebrew".
--
-- The seven existing values are all Greek — BEGINNING/INTERMEDIATE/ADVANCED are the
-- unprefixed Greek ladder, and GREEK_I..III and SEPTUAGINT name themselves. The two new
-- ones are prefixed rather than renaming the old ones, because Course.level rows already
-- hold 'BEGINNING' and 'INTERMEDIATE' and a rename would rewrite live data.
--
-- RUN THIS IN SUPABASE BEFORE DEPLOYING THE CODE THAT USES THEM.
-- Adding a value to an enum is not transactional in Postgres: run each statement on its
-- own (the Supabase SQL editor already does), and do not wrap them in BEGIN/COMMIT.
-- Both are idempotent, so re-running is safe.

ALTER TYPE "CourseLevel" ADD VALUE IF NOT EXISTS 'HEBREW_BEGINNING';

ALTER TYPE "CourseLevel" ADD VALUE IF NOT EXISTS 'HEBREW_INTERMEDIATE';

-- Nothing to backfill: no existing course is Hebrew, and the column stays NOT NULL with
-- the same set of old values still valid.
