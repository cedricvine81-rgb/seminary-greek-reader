import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logError } from '@/lib/logger'

export const metadata: Metadata = { title: 'Errors' }
export const dynamic = 'force-dynamic'

// The app's own error monitor: what broke, how often, for whom — without leaving the app.
// Server and browser errors land in ErrorLog (see lib/logger and /api/client-error); this
// page groups the last week by (scope, message) so a crash loop reads as one row with a
// count, newest first.

function ago(d: Date): string {
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.round(mins / 60)
  if (h < 48) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export default async function AdminErrorsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  let rows: { id: string; time: Date; source: string; scope: string; message: string;
              stack: string | null; url: string | null; userId: string | null }[] = []
  let tableMissing = false
  try {
    rows = await prisma.errorLog.findMany({
      where: { time: { gte: new Date(Date.now() - 7 * 86400_000) } },
      orderBy: { time: 'desc' },
      take: 500,
      select: { id: true, time: true, source: true, scope: true, message: true,
                stack: true, url: true, userId: true },
    })
  } catch (err) {
    // Most likely the ErrorLog table does not exist yet (scripts/error-log.sql not run).
    tableMissing = true
    logError('GET /admin/errors', err)
  }

  // Group by (scope, message): a repeating error is one row with a count.
  const groups = new Map<string, { count: number; latest: typeof rows[number]; users: Set<string> }>()
  for (const r of rows) {
    const key = `${r.scope}|${r.message}`
    const g = groups.get(key)
    if (g) {
      g.count++
      if (r.userId) g.users.add(r.userId)
    } else {
      groups.set(key, { count: 1, latest: r, users: new Set(r.userId ? [r.userId] : []) })
    }
  }
  const grouped = Array.from(groups.values())
    .sort((a, b) => b.latest.time.getTime() - a.latest.time.getTime())

  return (
    <DashboardShell role="ADMIN" pageTitle="Errors">
      <div className="max-w-5xl">
        <p className="mb-4 text-sm text-gray-500">
          Server and browser errors from the last 7 days, grouped — a repeating error is one
          row with a count. {rows.length >= 500 && 'Showing the most recent 500 events.'}
        </p>
        {tableMissing && (
          <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            The ErrorLog table doesn&apos;t exist yet — run <code>scripts/error-log.sql</code> in
            Supabase to activate monitoring. Until then errors go to the Vercel console only.
          </p>
        )}
        {!tableMissing && grouped.length === 0 && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            No errors recorded in the last 7 days.
          </p>
        )}
        <div className="space-y-3">
          {grouped.map(({ count, latest, users }) => (
            <details key={latest.id} className="rounded-xl border border-gray-200 bg-surface px-4 py-3">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className={latest.source === 'client'
                    ? 'rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700'
                    : 'rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700'}>
                    {latest.source}
                  </span>
                  <span className="font-mono text-sm font-medium text-gray-800">{latest.scope}</span>
                  <span className="text-xs text-gray-400">
                    ×{count} · {ago(latest.time)}
                    {users.size > 0 && ` · ${users.size} user${users.size > 1 ? 's' : ''}`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-red-700">{latest.message}</p>
              </summary>
              <div className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-xs text-gray-600">
                {latest.url && <p>Page: <span className="font-mono">{latest.url}</span></p>}
                <p>Latest: {latest.time.toISOString()}</p>
                {latest.stack && (
                  <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-gray-50 p-2 font-mono text-[11px] leading-snug text-gray-700">{latest.stack}</pre>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}
