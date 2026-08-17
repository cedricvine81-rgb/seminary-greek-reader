-- Error monitoring: the app's own error log.
--
-- RUN THIS IN SUPABASE TO ACTIVATE MONITORING. Unlike earlier migrations this one is not a
-- deploy blocker: the logger swallows the table-missing error and keeps writing to the
-- console until the table exists, so code and SQL can land in either order.
--
-- Written by lib/logger (server) and /api/client-error (browser); read by /admin/errors.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS "ErrorLog" (
  "id"      TEXT NOT NULL,
  "time"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source"  TEXT NOT NULL,
  "scope"   TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "stack"   TEXT,
  "context" JSONB,
  "url"     TEXT,
  "ua"      TEXT,
  "userId"  TEXT,
  CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ErrorLog_time_idx" ON "ErrorLog"("time");
