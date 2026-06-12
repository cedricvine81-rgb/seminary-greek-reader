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
}

export function logWarn(scope: string, context?: LogContext) {
  emit('warn', scope, context)
}

export function logInfo(scope: string, context?: LogContext) {
  emit('info', scope, context)
}
