# Database safety rules

This document is the project's commitment to safe handling of the production database.
It applies to every contributor (human or AI) working on this repo.

## Hard rules — never break these

1. **Never use `prisma db push --accept-data-loss`** on the production database, or any
   database that contains real user data. The flag is forbidden in this project.

2. **Never use `prisma db push --force-reset`** outside of an explicitly disposable test
   database (e.g. a CI ephemeral DB you just created). It drops every table.

3. **Never `DROP TABLE`, `TRUNCATE`, or `DELETE FROM` user data tables** without:
   - a backup taken within the last 24 hours, AND
   - explicit confirmation from the project owner.

4. **Never run `prisma/seed.ts` against a production database** without first taking a
   manual backup.

## Recommended workflow for schema changes

1. Make the schema change in `prisma/schema.prisma` (additive only).
2. Run `npx prisma db push` (no flags). If Prisma would drop or rename anything, it
   will refuse and ask. **If it refuses, stop and consult the owner — do not flag it
   through.**
3. For non-additive changes (rename, type change, drop), use `npx prisma migrate dev`
   to generate a SQL file. Review the SQL. Commit the migration file. Run only after
   approval.
4. After any schema change, verify the row count of `User`, `Course`, and
   `ExegesisSession` hasn't dropped unexpectedly.

## Application-level safeguards in place

- **Soft-delete on `User`**: the admin DELETE endpoint sets `deletedAt` instead of
  removing the row. Sign-in and listings filter on `deletedAt: null`.
- **Daily user-deletion budget**: an admin can soft-delete at most 5 users in any
  24-hour window before being rate-limited.
- **Audit log**: sensitive admin actions (`user.update`, `user.softDelete`,
  `course.delete`) are recorded in the `AuditLog` table with actor, target, before/after.
- **Supabase Pro backups**: daily snapshots + point-in-time recovery enabled (7-day
  retention by default).

## Recovering a soft-deleted user

```sql
UPDATE "User" SET "deletedAt" = NULL WHERE email = 'jane@example.edu';
```

## Inspecting the audit log

```sql
SELECT "createdAt", "actorEmail", action, "targetId", before, after
FROM "AuditLog"
ORDER BY "createdAt" DESC
LIMIT 100;
```
