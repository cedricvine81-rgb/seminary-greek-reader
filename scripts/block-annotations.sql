-- Block annotations: highlights and margin notes on the app's own prose (Grammar chapters).
--
-- RUN THIS IN SUPABASE BEFORE DEPLOYING THE CODE THAT USES IT.
-- The Grammar page degrades quietly without the table — the annotation layer sees a failed
-- GET and stays inert — but nothing can be saved, so run it first.
--
-- Safe to run more than once.

BEGIN;

-- One row per highlight or note. A highlight IS a note with an empty body.
--
-- The anchor is four columns, not two offsets, because a paragraph we wrote is not a
-- canonical address the way a verse is:
--   "blockId"                  the stable, never-positional id the translation pipeline
--                              already puts on every translatable run
--   "startOffset"/"endOffset"  measured WITHIN that one block, so rewording a different
--                              paragraph cannot move this note
--   "fp"                       fingerprint of the block text they were measured against
--   "quote"                    the words selected, so an edited block can be re-anchored
--                              instead of silently painting the wrong half-sentence
CREATE TABLE IF NOT EXISTS "BlockAnnotation" (
  "id"          TEXT         NOT NULL,
  "userId"      TEXT         NOT NULL,
  -- Which body of prose. 'morphology' = the Greek/Hebrew Grammar chapters; present from the
  -- start so Themes or the Texts summaries can join later with no migration.
  "surface"     TEXT         NOT NULL DEFAULT 'morphology',
  "page"        TEXT         NOT NULL,
  "blockId"     TEXT         NOT NULL,
  -- Which language's rendering the offsets are into. The RANGE is language-specific; the
  -- NOTE is not — it stays attached to "blockId" in every language.
  "locale"      TEXT         NOT NULL DEFAULT 'en',
  "startOffset" INTEGER      NOT NULL,
  "endOffset"   INTEGER      NOT NULL,
  "quote"       TEXT         NOT NULL DEFAULT '',
  "fp"          TEXT         NOT NULL,
  "color"       TEXT         NOT NULL DEFAULT 'yellow',
  "body"        TEXT         NOT NULL DEFAULT '',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BlockAnnotation_pkey" PRIMARY KEY ("id")
);

-- The only query the app makes: everything this reader has on the open chapter.
CREATE INDEX IF NOT EXISTS "BlockAnnotation_userId_surface_page_idx"
  ON "BlockAnnotation" ("userId", "surface", "page");

-- Deleting a user takes their annotations with them. ADD CONSTRAINT has no IF NOT EXISTS,
-- hence the guard — same pattern as the other migrations here.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BlockAnnotation_userId_fkey'
  ) THEN
    ALTER TABLE "BlockAnnotation"
      ADD CONSTRAINT "BlockAnnotation_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;

-- Check afterwards — should return 0, not an error:
--
--   SELECT COUNT(*) FROM "BlockAnnotation";
