-- Locale-aware lexicon glosses — RUN THIS IN SUPABASE BEFORE DEPLOYING THE CODE THAT READS IT.
--
-- Closes the last path where a Spanish course could still produce an English answer key.
--
-- Two surfaces read a gloss from the DATABASE rather than from the static decks:
--
--   1. generateVocabQuestions() — the fallback used when an instructor has NOT picked frequency
--      sections. It reads LexicalEntry.gloss, which has no language.
--   2. The appeal loop. A student appeals a marked-wrong answer, the instructor accepts, and an
--      admin adds it to LexicalEntry.acceptedAnswers so the whole lexicon learns from it. Those
--      synonyms are English, so a Spanish section's appeals would pollute the English lexicon
--      and never accumulate a Spanish one.
--
-- A separate row per (lexeme, locale) rather than gloss_es / gloss_ru / gloss_zh columns: the
-- app already ships four interface locales and will add more, and a column per language means a
-- migration per language forever. It also keeps acceptedAnswers per language, which is the part
-- that actually affects grades.

CREATE TABLE IF NOT EXISTS "LexicalGloss" (
  "id"              TEXT PRIMARY KEY,
  "lexemeId"        TEXT NOT NULL,
  "locale"          TEXT NOT NULL,
  "gloss"           TEXT NOT NULL,
  -- Comma-separated synonyms accepted as correct IN THIS LANGUAGE. Grown by the appeal loop,
  -- exactly as LexicalEntry.acceptedAnswers is for English.
  "acceptedAnswers" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LexicalGloss_lexemeId_fkey"
    FOREIGN KEY ("lexemeId") REFERENCES "LexicalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- One gloss per lemma per language.
CREATE UNIQUE INDEX IF NOT EXISTS "LexicalGloss_lexemeId_locale_key"
  ON "LexicalGloss" ("lexemeId", "locale");

-- The generator filters by locale and joins back to the lemma.
CREATE INDEX IF NOT EXISTS "LexicalGloss_locale_idx" ON "LexicalGloss" ("locale");

-- No backfill. An absent row means "not translated", and the code falls back to
-- LexicalEntry.gloss — the same never-mislead rule the fingerprinted content catalogues use.
-- Seeding Spanish rows from the static deck is a separate, reviewable step.
