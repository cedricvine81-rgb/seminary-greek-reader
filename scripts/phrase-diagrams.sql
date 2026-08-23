-- Phrase diagrams (the Diagramming tab's drag-and-drop canvas).
--
-- RUN THIS IN SUPABASE BEFORE DEPLOYING THE CODE THAT USES IT.
-- The new build reads/writes the "PhraseDiagram" table as soon as it is live; without it
-- every save from the diagram canvas 500s.
--
-- Safe to run more than once.

BEGIN;

-- One row per user per sentence card: the sentence's verse range is the anchor (the same
-- ranges the Macula sentence data gives the Diagramming tab), "data" is the whole layout —
-- chip positions keyed by word occurrence + the drawn annotation lines.
CREATE TABLE IF NOT EXISTS "PhraseDiagram" (
  "id"         TEXT         NOT NULL,
  "userId"     TEXT         NOT NULL,
  "book"       TEXT         NOT NULL,
  "chapter"    INTEGER      NOT NULL,
  "verseStart" INTEGER      NOT NULL,
  "verseEnd"   INTEGER      NOT NULL,
  "data"       JSONB        NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PhraseDiagram_pkey" PRIMARY KEY ("id")
);

-- One diagram per user per sentence — the app upserts on this tuple.
CREATE UNIQUE INDEX IF NOT EXISTS "PhraseDiagram_userId_book_chapter_verseStart_verseEnd_key"
  ON "PhraseDiagram" ("userId", "book", "chapter", "verseStart", "verseEnd");

-- Deleting a user takes their diagrams with them, same rule as notes/highlights.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PhraseDiagram_userId_fkey'
  ) THEN
    ALTER TABLE "PhraseDiagram"
      ADD CONSTRAINT "PhraseDiagram_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;

-- Check afterwards — should return a row:
--
--   SELECT COUNT(*) FROM "PhraseDiagram";
