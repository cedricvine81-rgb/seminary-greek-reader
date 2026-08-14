-- Handwritten ink on a block annotation (see lib/ink.ts for the stroke format).
--
-- RUN THIS IN SUPABASE BEFORE DEPLOYING the build that writes ink. Nullable, so the existing
-- rows and the current code are unaffected until then.
--
-- Safe to run more than once.

ALTER TABLE "BlockAnnotation"
  ADD COLUMN IF NOT EXISTS "ink" TEXT;

-- Check afterwards — should return one row:
--
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'BlockAnnotation' AND column_name = 'ink';
