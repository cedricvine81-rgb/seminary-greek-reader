-- The Hebrew vocabulary question types, as values on the QuestionType enum.
--
-- Referenced by src/lib/quiz-generation.ts and present in prisma/schema.prisma since the
-- Hebrew vocabulary quizzes shipped (2026-08-12), but the SQL itself was never committed —
-- this file recreates it so the production step is on record. If the values are missing in
-- production, the FIRST Hebrew vocabulary quiz created there fails on insert.
--
-- Run in the Supabase SQL editor BEFORE (or after — the code is already deployed) creating
-- any Hebrew vocabulary quiz. Safe to run twice: ADD VALUE IF NOT EXISTS is a no-op when
-- the value is already present.
--
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block on older Postgres;
-- run the two statements as given, not wrapped in BEGIN/COMMIT.

ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'HEBREW_TO_ENGLISH';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'ENGLISH_TO_HEBREW';

-- Verify:
--   SELECT unnest(enum_range(NULL::"QuestionType"));
-- should list HEBREW_TO_ENGLISH and ENGLISH_TO_HEBREW among the values.
