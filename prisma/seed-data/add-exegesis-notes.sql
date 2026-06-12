-- Adds the "Notes & Questions" scratchpad column to translation-exercise sessions.
-- Additive and safe: NOT NULL with a '' default, so existing rows backfill instantly.
-- Run this in the Supabase SQL editor BEFORE the matching app deploy.

ALTER TABLE "ExegesisSession"
  ADD COLUMN IF NOT EXISTS "notes" TEXT NOT NULL DEFAULT '';
