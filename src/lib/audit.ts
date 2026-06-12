import { prisma } from './db'
import { logError } from './logger'

interface AuditEntry {
  actorId?: string | null
  actorEmail?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  before?: unknown
  after?: unknown
  context?: Record<string, unknown> | null
}

/**
 * Append a row to the AuditLog table. Best-effort: never throws, never blocks
 * the caller — audit failures must not break user-facing requests.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorEmail: entry.actorEmail ?? null,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        // Cast unknown → Prisma's InputJsonValue. Use null when undefined.
        before: (entry.before ?? null) as never,
        after: (entry.after ?? null) as never,
        context: (entry.context ?? null) as never,
      },
    })
  } catch (err) {
    logError('audit', err, { action: entry.action })
  }
}
