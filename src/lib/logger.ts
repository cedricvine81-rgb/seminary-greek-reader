/**
 * Minimal structured logger.
 *
 * Replaces bare `console.error(err)` in API route catch blocks so production
 * failures carry context (which route, which operation, the error message and
 * stack) instead of an anonymous stack trace. Emits single-line JSON, which is
 * what log aggregators (Vercel, Datadog, Sentry's console integration, etc.)
 * parse cleanly. Swapping in a real service later means changing only this file.
 */

type LogContext = Record<string, unknown>

function serializeError(err: unknown): LogContext {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack }
  }
  return { message: String(err) }
}

function emit(level: 'error' | 'warn' | 'info', message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...context,
  }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}

/**
 * Next.js throws internal control-flow "errors" (e.g. DYNAMIC_SERVER_USAGE when a
 * route reads cookies during static-generation probing) that are not real failures.
 * They must propagate to Next untouched, so we never log them as errors.
 */
function isNextControlFlowSignal(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const digest = (err as { digest?: unknown }).digest
  if (typeof digest === 'string' && (digest === 'DYNAMIC_SERVER_USAGE' || digest.startsWith('NEXT_'))) return true
  const message = (err as { message?: unknown }).message
  return typeof message === 'string' && message.includes('Dynamic server usage')
}

/**
 * Log an error with context.
 * @param scope  Where it happened, e.g. "POST /api/quizzes".
 * @param err    The caught error.
 * @param context Extra structured fields (ids, etc.) — never include secrets.
 */
export function logError(scope: string, err: unknown, context?: LogContext) {
  // Don't pollute logs with Next's internal control-flow signals.
  if (isNextControlFlowSignal(err)) return
  emit('error', scope, { ...context, error: serializeError(err) })
  void persist('server', scope, serializeError(err), context)
}

// ── Durable copy ──────────────────────────────────────────────────────────────────────────
// Console output on Vercel scrolls away; the ErrorLog table is what /admin/errors reads.
// Fire-and-forget and triple-guarded: never throws, never recurses into logError, and a
// missing table (the SQL not yet run) is swallowed — so this file can deploy first.
// A repeat of the same scope+message within a minute is not re-written: one crash loop
// should read as one row per minute, not a thousand.
const recentlyPersisted = new Map<string, number>()

export async function persist(
  source: 'server' | 'client',
  scope: string,
  err: { message?: unknown; stack?: unknown },
  context?: LogContext,
  extra?: { url?: string; ua?: string; userId?: string },
) {
  if (typeof window !== 'undefined') return
  try {
    const message = String(err.message ?? '').slice(0, 500)
    const key = `${scope}|${message}`
    const now = Date.now()
    const last = recentlyPersisted.get(key)
    if (last && now - last < 60_000) return
    recentlyPersisted.set(key, now)
    if (recentlyPersisted.size > 500) recentlyPersisted.clear()

    const { prisma } = await import('./db')
    await prisma.errorLog.create({
      data: {
        source, scope: scope.slice(0, 200), message,
        stack: typeof err.stack === 'string' ? err.stack.slice(0, 4000) : null,
        context: context ? JSON.parse(JSON.stringify(context)) : undefined,
        url: extra?.url?.slice(0, 500), ua: extra?.ua?.slice(0, 300), userId: extra?.userId,
      },
    })
  } catch {
    // Monitoring must never take the app down with it.
  }
}

export function logWarn(scope: string, context?: LogContext) {
  emit('warn', scope, context)
}

export function logInfo(scope: string, context?: LogContext) {
  emit('info', scope, context)
}
