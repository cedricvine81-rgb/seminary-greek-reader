import Link from 'next/link'
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { STATUS_WORD, type Status, type SystemHealth } from '@/lib/system-health'
import { HealthProbe } from '@/components/admin/HealthProbe'


// Capacity, as opposed to /admin/errors which covers what has already broken.
//
// Written to be read by someone who does not run databases: every number carries a word and a
// sentence derived from its own value, and anything with a real ceiling is drawn as a meter, so
// "is there room?" is answerable at a glance rather than by knowing what 23 MB means.
//
// Colour is never the only carrier of meaning — status text and an icon accompany every dot.
// The status hues are the 600 steps, which clear 3:1 against both the light and dark surfaces;
// the 500 steps did not.

const STATUS_FILL: Record<Status, string> = {
  good: 'bg-green-600',
  watch: 'bg-amber-600',
  bad: 'bg-red-600',
  unknown: 'bg-gray-400',
}
const STATUS_TEXT: Record<Status, string> = {
  good: 'text-green-700',
  watch: 'text-amber-700',
  bad: 'text-red-700',
  unknown: 'text-gray-500',
}
// Translucent tints, NOT the -50 steps. The app's grays invert with the display theme, so a
// fixed light background under themed text made the headline invisible in dark mode. A 10% wash
// of the status hue composites over whatever surface is underneath and works in all four themes.
const STATUS_BANNER: Record<Status, string> = {
  good: 'border-green-600/30 bg-green-600/10',
  watch: 'border-amber-600/40 bg-amber-600/10',
  bad: 'border-red-600/40 bg-red-600/10',
  unknown: 'border-gray-400/30 bg-gray-500/10',
}

function StatusIcon({ status, size = 16 }: { status: Status; size?: number }) {
  const cls = STATUS_TEXT[status]
  if (status === 'good') return <CheckCircle2 size={size} className={cls} aria-hidden="true" />
  if (status === 'watch') return <AlertTriangle size={size} className={cls} aria-hidden="true" />
  if (status === 'bad') return <AlertOctagon size={size} className={cls} aria-hidden="true" />
  return <HelpCircle size={size} className={cls} aria-hidden="true" />
}

export function HealthView({ health }: { health: SystemHealth }) {
  const maxTable = Math.max(1, ...health.tables.map(t => t.bytes))
  const maxErrors = Math.max(1, ...health.errorsByDay.map(d => d.count))

  return (
    <div className="space-y-6">
        {/* The whole page in one sentence, before any number has to be read. */}
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${STATUS_BANNER[health.summary.status]}`}>
          <StatusIcon status={health.summary.status} size={20} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{health.summary.headline}</p>
            <p className="mt-0.5 text-sm text-gray-600">{health.summary.detail}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {health.readings.map(r => (
            <Card key={r.label} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">{r.label}</p>
                  <p className="text-3xl font-bold tabular-nums text-gray-900">{r.value}</p>
                  {r.detail && <p className="mt-0.5 text-xs text-gray-400">{r.detail}</p>}
                </div>
                <span className={`inline-flex flex-none items-center gap-1.5 text-xs font-medium ${STATUS_TEXT[r.status]}`}>
                  <StatusIcon status={r.status} size={14} />
                  {STATUS_WORD[r.status]}
                </span>
              </div>

              {/* A meter only where there is a genuine ceiling to fill. Readings without one
                  (error counts, people) get no bar rather than an invented denominator. */}
              {r.fill !== null && (
                <div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full ${STATUS_FILL[r.status]}`}
                      style={{ width: `${Math.max(1.5, r.fill * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {(r.fill * 100).toFixed(r.fill < 0.01 ? 1 : 0)}% used{r.ceiling ? ` · limit ${r.ceiling}` : ''}
                  </p>
                </div>
              )}

              <p className="text-sm leading-relaxed text-gray-600">{r.plain}</p>
            </Card>
          ))}
        </div>

        <Card>
          <h2 className="text-sm font-semibold text-gray-900">How fast is it answering?</h2>
          <p className="mb-4 mt-0.5 text-sm text-gray-500">
            This sends a handful of requests from your own browser, so it travels the same route a
            student does. Testing what the app can <em>withstand</em> has to be driven from outside —
            the app cannot generate a realistic crowd against itself.
          </p>
          <HealthProbe />
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-sm font-semibold text-gray-900">What is taking up the space</h2>
            <p className="mb-4 mt-0.5 text-sm text-gray-500">
              The biggest tables in the database. Student work — notes, highlights, exegesis
              sessions — is what grows here as more people use the app.
            </p>
            {health.tables.length === 0 ? (
              <p className="text-sm text-gray-400">Could not read table statistics this time.</p>
            ) : (
              <ul className="space-y-2.5">
                {health.tables.map(t => (
                  <li key={t.table}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-gray-800">{t.table}</span>
                      <span className="flex-none tabular-nums text-gray-500">
                        {t.size} <span className="text-gray-400">· {t.rows.toLocaleString()} rows</span>
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(1.5, (t.bytes / maxTable) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Errors, last 7 days</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                A quiet chart is the healthy one. A single tall bar is usually one thing breaking
                repeatedly rather than many separate faults.
              </p>
            </div>
            <div className="flex h-28 items-end gap-2" role="img"
              aria-label={`Errors per day: ${health.errorsByDay.map(d => `${d.label} ${d.count}`).join(', ')}`}>
              {health.errorsByDay.map(d => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-xs tabular-nums text-gray-400">{d.count || ''}</span>
                  <div
                    className={`w-full rounded-t ${d.count === 0 ? 'bg-gray-200' : 'bg-brand-600'}`}
                    style={{ height: d.count === 0 ? '2px' : `${Math.max(6, (d.count / maxErrors) * 76)}px` }}
                  />
                  <span className="text-xs text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
            <Link href="/admin/errors" className="text-sm text-brand-600 hover:underline">
              See what the errors were →
            </Link>
          </Card>
        </div>

        <Card>
          <h2 className="text-sm font-semibold text-gray-900">Search readiness</h2>
          <p className="mb-3 mt-0.5 text-sm text-gray-500">
            Library search keeps its word list in memory. &ldquo;Ready&rdquo; means the next search is
            instant; &ldquo;not loaded yet&rdquo; means whoever searches next waits a second or two while
            it loads. This is normal after a quiet period and fixes itself on first use.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {health.indexes.map(ix => {
              const st: Status = ix.loaded ? 'good' : ix.attempted ? 'bad' : 'unknown'
              return (
                <div key={ix.lang} className="flex items-center gap-2.5 rounded-lg border border-gray-100 px-3 py-2">
                  <StatusIcon status={st} size={15} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {ix.lang === 'en' ? 'English' : ix.lang === 'grc' ? 'Greek' : 'Spanish (ours)'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ix.loaded ? `Ready · ${ix.entries.toLocaleString()} passages`
                        : ix.attempted ? 'Failed to load' : 'Not loaded yet'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <p className="text-xs text-gray-400">Read {new Date(health.takenAt).toLocaleString()}.</p>
    </div>
  )
}
