-- Block annotations: highlights and margin notes on the app's own prose (Grammar chapters).
--
-- RUN THIS IN SUPABASE BEFORE DEPLOYING the code that uses it. The Grammar page degrades
-- quietly without the table (the annotation layer just renders nothing), but every save
-- would fail, so run it first.
--
-- Safe to re-run: everything is IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS "BlockAnnotation" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL,
  "surface"     TEXT NOT NULL DEFAULT 'morphology',
  "page"        TEXT NOT NULL,
  "blockId"     TEXT NOT NULL,
  "locale"      TEXT NOT NULL DEFAULT 'en',
  "startOffset" INTEGER NOT NULL,
  "endOffset"   INTEGER NOT NULL,
  "quote"       TEXT NOT NULL,
  "fp"          TEXT NOT NULL,
  "color"       TEXT NOT NULL DEFAULT 'yellow',
  "body"        TEXT NOT NULL DEFAULT '',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlockAnnotation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- The only query the app makes: everything this user has on the open chapter.
CREATE INDEX IF NOT EXISTS "BlockAnnotation_userId_surface_page_idx"
  ON "BlockAnnotation" ("userId", "surface", "page");
