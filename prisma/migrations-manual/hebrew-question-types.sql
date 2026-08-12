-- Two new QuestionType values for Hebrew vocabulary quizzes.
--
-- The existing GREEK_TO_ENGLISH / ENGLISH_TO_GREEK are not reused for Hebrew. A Question
-- row is read back by the quiz runner, which decides from the type which script to render
-- the prompt in and which direction to lay it out; a Hebrew question labelled
-- GREEK_TO_ENGLISH would render left-to-right in a Greek font, and would also be wrong in
-- any later export or analytics.
--
-- MULTIPLE_CHOICE is shared: a multiple-choice question carries its options, and the
-- runner picks the script from the option/prompt content, so it needs no per-language value.
--
-- RUN THIS IN SUPABASE BEFORE DEPLOYING THE CODE THAT USES THEM.
-- Adding a value to an enum is not transactional in Postgres: run each statement on its
-- own, and do not wrap them in BEGIN/COMMIT. Both are idempotent.

ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'HEBREW_TO_ENGLISH';

ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'ENGLISH_TO_HEBREW';

-- Nothing to backfill: no existing Question row is Hebrew.
