-- Diagram attachments on verse notes.
--
-- RUN THIS IN SUPABASE BEFORE DEPLOYING THE CODE THAT USES IT.
-- The new build saves a diagram snapshot onto a verse note ("Attach the current diagram"
-- in the note editor on the Diagramming tab); without the column every such save 500s.
--
-- Safe to run more than once.

ALTER TABLE "VerseNote"
  ADD COLUMN IF NOT EXISTS "diagram" JSONB;

-- Check afterwards — should return a row:
--
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'VerseNote' AND column_name = 'diagram';
