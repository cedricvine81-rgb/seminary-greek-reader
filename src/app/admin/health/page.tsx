import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card } from '@/components/ui/Card'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getSystemHealth } from '@/lib/system-health'
import { HealthProbe } from '@/components/admin/HealthProbe'

export const metadata: Metadata = { title: 'System health' }
export const dynamic = 'force-dynamic'

// Capacity, as opposed to /admin/errors which covers what has already broken. Three things:
// what the database is carrying, what this serverless instance has warm, and how fast the app
// answers right now. Sustained load testing is NOT here and cannot be — see HealthProbe.

const DOT: Record<string, string> = {
  good: 'bg-green-500',
  watch: 'bg-amber-500',
  bad: 'bg-red-500',
  unknown: 'bg-gray-300',
}

export default async function AdminHealthPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  const health = await getSystemHealth()

  return (
    <DashboardShell role="ADMIN" pageTitle="System health">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {health.readings.map(r => (
            <Card key={r.label}>
              <div className="flex items-start gap-2.5">
                <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${DOT[r.status]}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums text-gray-900">{r.value}</p>
                  <p className="text-sm text-gray-500">{r.label}</p>
                  {r.detail && <p className="mt-0.5 text-xs text-gray-400">{r.detail}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <h2 className="text-sm font-semibold text-gray-900">Response times</h2>
          <p className="mb-4 mt-0.5 text-xs text-gray-500">
            Fired from this browser, so it crosses the same network and cache a student does.
            Load testing proper has to be driven from outside the app — a serverless function
            cannot generate load without competing for the capacity it is measuring.
          </p>
          <HealthProbe />
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-sm font-semibold text-gray-900">Largest tables</h2>
            <p className="mb-3 mt-0.5 text-xs text-gray-500">
              Row counts are PostgreSQL&apos;s own estimates, so they drift a little between vacuums.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-4 font-medium">Table</th>
                    <th className="py-2 pr-4 text-right font-medium">Rows</th>
                    <th className="py-2 text-right font-medium">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {health.tables.length === 0 && (
                    <tr><td colSpan={3} className="py-3 text-sm text-gray-400">Could not read table statistics.</td></tr>
                  )}
                  {health.tables.map(t => (
                    <tr key={t.table} className="border-b border-gray-100">
                      <td className="py-1.5 pr-4 font-medium text-gray-800">{t.table}</td>
                      <td className="py-1.5 pr-4 text-right tabular-nums text-gray-600">{t.rows.toLocaleString()}</td>
                      <td className="py-1.5 text-right tabular-nums text-gray-600">{t.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-gray-900">Search indexes on this instance</h2>
            <p className="mb-3 mt-0.5 text-xs text-gray-500">
              The library search holds its index in the function&apos;s memory. A facet that is not
              loaded here will cost the next request that needs it a cold build. Serverless runs
              many instances, so this describes the one that served this page.
            </p>
            <div className="space-y-2">
              {health.indexes.map(ix => (
                <div key={ix.lang} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 flex-none rounded-full ${ix.loaded ? 'bg-green-500' : ix.attempted ? 'bg-red-500' : 'bg-gray-300'}`} aria-hidden="true" />
                    <span className="font-medium text-gray-800">
                      {ix.lang === 'en' ? 'English' : ix.lang === 'grc' ? 'Greek' : 'Spanish (ours)'}
                    </span>
                  </div>
                  <span className="text-sm tabular-nums text-gray-500">
                    {ix.loaded
                      ? `warm · ${ix.entries.toLocaleString()} entries${ix.trans ? ` · ${ix.trans.toLocaleString()} translations` : ''}`
                      : ix.attempted ? 'failed to load' : 'cold'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <p className="text-xs text-gray-400">
          Taken {new Date(health.takenAt).toLocaleString()} · errors and crash loops live in{' '}
          <Link href="/admin/errors" className="text-brand-600 hover:underline">Errors</Link>.
        </p>
      </div>
    </DashboardShell>
  )
}
