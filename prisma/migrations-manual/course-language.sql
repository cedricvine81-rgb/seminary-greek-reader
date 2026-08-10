-- Course language — RUN THIS IN SUPABASE BEFORE DEPLOYING THE CODE THAT READS IT.
--
-- Decision (2026-08-10): the language of a COURSE determines the language of all ASSESSMENT in
-- that course. A student may revise in whatever interface language they like — the vocab deck,
-- reader, grammar and flashcards all follow the student — but every graded answer key is
-- generated and marked in the course's language, so everyone in a section is marked against the
-- same key.
--
-- Default 'en' is deliberate: every existing course was authored in English and its Question
-- rows already hold English answer keys. Backfilling anything else would silently invalidate
-- live grades.

ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en';

-- Existing rows take the default. No backfill: an English course stays English.
