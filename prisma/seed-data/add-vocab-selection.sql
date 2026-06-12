-- Stores the instructor's vocab-quiz word selection (frequency sections + parts
-- of speech) so the quiz can be generated from exactly those words and the edit
-- page can pre-fill the picker. Additive and nullable. Run BEFORE the app deploy.

ALTER TABLE "Assignment"
  ADD COLUMN IF NOT EXISTS "vocabSelection" JSONB;
