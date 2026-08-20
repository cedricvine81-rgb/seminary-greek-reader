import { prisma } from '@/lib/db'
import { indexStatus } from '@/lib/backgrounds-search'

/**
 * Capacity readings for /admin/health — the numbers that say whether the system has room,
 * as opposed to /admin/errors which says what has already broken.
 *
 * Everything here is a cheap catalogue query or a count. Nothing generates load: a serverless
 * app cannot load-test itself (the generator would compete for the capacity it is measuring,
 * could not outlive the function timeout, and would originate inside Vercel's network, so it
 * would never exercise the edge cache a real reader goes through). Sustained load has to come
 * from outside; this page reports state, and the browser-side probe measures latency.
 *
 * Every reading carries its own plain-English verdict, WRITTEN FROM THE VALUE rather than
 * attached as static help text. The point of the page is that someone who does not read
 * Postgres statistics can still tell whether anything needs doing, so the sentence has to
 * change when the number does. Status colour never travels alone — each reading also carries a
 * word, because a green dot means nothing to a reader who cannot see green.
 *
 * Each reading is independently guarded. A permission change on one pg_catalog view should
 * blank one row, not take down the page.
 */

export type Status = 'good' | 'watch' | 'bad' | 'unknown'

export const STATUS_WORD: Record<Status, string> = {
  good: 'Healthy',
  watch: 'Worth watching',
  bad: 'Needs attention',
  unknown: 'Unknown',
}

export interface Reading {
  label: string
  value: string
  /** The technical detail — a denominator, a threshold, a caveat. */
  detail?: string
  /** What this means, in words, for someone who does not run databases. Derived from the value. */
  plain: string
  status: Status
  /** 0–1 for readings with a real ceiling, so they can be drawn as a meter. Null = no ceiling. */
  fill: number | null
  /** What the meter is filling up towards, named for the caption. */
  ceiling?: string
}

export interface TableRow { table: string; rows: number; size: string; bytes: number }
export interface DayCount { day: string; label: string; count: number }

export interface SystemHealth {
  readings: Reading[]
  tables: TableRow[]
  errorsByDay: DayCount[]
  indexes: { lang: string; attempted: boolean; loaded: boolean; entries: number; trans: number }[]
  summary: { status: Status; headline: string; detail: string }
  takenAt: string
}

async function q<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn() } catch { return null }
}

const GB8 = 8_589_934_592

export async function getSystemHealth(): Promise<SystemHealth> {
  const [dbSize, conns, tables, errors24h, errors7d, byDay, users] = await Promise.all([
    q(() => prisma.$queryRawUnsafe<{ bytes: bigint; pretty: string }[]>(
      `select pg_database_size(current_database()) as bytes,
              pg_size_pretty(pg_database_size(current_database())) as pretty`)),
    // Through pgbouncer this counts server-side connections, which is the number that matters:
    // DATABASE_URL pins connection_limit=1 per function instance and the pooler multiplexes.
    q(() => prisma.$queryRawUnsafe<{ used: bigint; max: string }[]>(
      `select count(*)::bigint as used,
              current_setting('max_connections') as max
       from pg_stat_activity where datname = current_database()`)),
    q(() => prisma.$queryRawUnsafe<{ table: string; rows: bigint | null; size: string; bytes: bigint }[]>(
      `select c.relname as table,
              s.n_live_tup as rows,
              pg_size_pretty(pg_total_relation_size(c.oid)) as size,
              pg_total_relation_size(c.oid) as bytes
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       left join pg_stat_user_tables s on s.relid = c.oid
       where n.nspname = 'public' and c.relkind = 'r'
       order by pg_total_relation_size(c.oid) desc
       limit 8`)),
    q(() => prisma.errorLog.count({ where: { time: { gte: new Date(Date.now() - 86_400_000) } } })),
    q(() => prisma.errorLog.count({ where: { time: { gte: new Date(Date.now() - 7 * 86_400_000) } } })),
    q(() => prisma.$queryRawUnsafe<{ day: Date; n: bigint }[]>(
      `select date_trunc('day', "time") as day, count(*)::bigint as n
       from "ErrorLog" where "time" >= now() - interval '7 days'
       group by 1 order by 1`)),
    q(() => prisma.user.count({ where: { deletedAt: null } })),
  ])

  const readings: Reading[] = []

  // ── Database size ──
  const bytes = dbSize?.[0] ? Number(dbSize[0].bytes) : null
  const dbStatus: Status = bytes === null ? 'unknown' : bytes > 6e9 ? 'bad' : bytes > 3e9 ? 'watch' : 'good'
  readings.push({
    label: 'Storage used',
    value: dbSize?.[0]?.pretty ?? '—',
    detail: bytes === null ? undefined : `of 8 GB included in the plan`,
    ceiling: '8 GB',
    fill: bytes === null ? null : Math.min(1, bytes / GB8),
    status: dbStatus,
    plain: bytes === null
      ? 'The size could not be read this time. It is not a sign of a problem — try refreshing.'
      : dbStatus === 'good'
      ? `Barely touching what your plan allows. The Greek and Hebrew texts are stored as files, not in the database, so this grows with people rather than with texts — roughly 60 KB per active student.`
      : dbStatus === 'watch'
      ? 'Past a third of the plan. Nothing is wrong, but it is worth knowing what is growing before it becomes urgent.'
      : 'Close to the limit. Raise the plan or archive old data before it fills.',
  })

  // ── Connections ──
  const used = conns?.[0] ? Number(conns[0].used) : null
  const max = conns?.[0] ? Number(conns[0].max) : null
  const cFill = used !== null && max ? used / max : null
  const cStatus: Status = cFill === null ? 'unknown' : cFill > 0.85 ? 'bad' : cFill > 0.6 ? 'watch' : 'good'
  readings.push({
    label: 'Database connections',
    value: used === null ? '—' : `${used}${max ? ` of ${max}` : ''}`,
    detail: 'pooled, so many visitors share few connections',
    ceiling: max ? String(max) : undefined,
    fill: cFill,
    status: cStatus,
    plain: cFill === null
      ? 'Could not be read this time.'
      : cStatus === 'good'
      ? 'Plenty of room. This is the number to watch if a whole class opens the app in the same minute — it is the first thing that would run out.'
      : cStatus === 'watch'
      ? 'More than half in use. If it stays here during a busy period, the database plan is the thing to raise.'
      : 'Nearly all connections are in use. New visitors may start seeing errors — raise the database plan.',
  })

  // ── Errors ──
  const eStatus: Status = errors24h === null ? 'unknown' : errors24h > 50 ? 'bad' : errors24h > 5 ? 'watch' : 'good'
  readings.push({
    label: 'Errors today',
    value: errors24h === null ? '—' : String(errors24h),
    detail: errors7d === null ? undefined : `${errors7d} in the last 7 days`,
    fill: null,
    status: eStatus,
    plain: errors24h === null
      ? 'Could not be read this time.'
      : errors24h === 0
      ? 'Nothing has gone wrong in the last day.'
      : eStatus === 'good'
      ? 'A few errors, which is normal — a mistyped address or a dropped connection counts. Worth a glance in Errors, not an alarm.'
      : eStatus === 'watch'
      ? 'More than usual for one day. Open Errors and see whether it is the same message repeating, which usually means one broken thing rather than many.'
      : 'A lot of errors in one day. Open Errors — a repeating message means something is genuinely broken.',
  })

  // ── People ──
  readings.push({
    label: 'People with accounts',
    value: users === null ? '—' : String(users),
    detail: 'not counting deleted accounts',
    fill: null,
    status: 'good',
    plain: 'Everyone who can sign in — students, instructors and admins together.',
  })

  // ── Seven-day error bars ──
  const counts = new Map<string, number>()
  for (const r of byDay ?? []) counts.set(new Date(r.day).toISOString().slice(0, 10), Number(r.n))
  const errorsByDay: DayCount[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86_400_000)
    const key = d.toISOString().slice(0, 10)
    return { day: key, label: d.toLocaleDateString(undefined, { weekday: 'short' }), count: counts.get(key) ?? 0 }
  })

  // ── Overall verdict, so the page answers "is anything wrong?" before anything is read ──
  const worst: Status = readings.some(r => r.status === 'bad') ? 'bad'
    : readings.some(r => r.status === 'watch') ? 'watch'
    : readings.some(r => r.status === 'unknown') ? 'unknown' : 'good'
  const needing = readings.filter(r => r.status === 'bad' || r.status === 'watch')
  const summary = {
    status: worst,
    headline: worst === 'good' ? 'Everything looks healthy'
      : worst === 'unknown' ? 'Some readings could not be taken'
      : needing.length === 1 ? `One thing needs a look: ${needing[0].label.toLowerCase()}`
      : `${needing.length} things need a look`,
    detail: worst === 'good'
      ? 'No action needed. Nothing here is close to a limit, and the app is answering normally.'
      : worst === 'unknown'
      ? 'The app is running; one or more statistics simply could not be read. Refresh before worrying.'
      : needing.map(r => r.label).join(' · '),
  }

  return {
    readings,
    tables: (tables ?? []).map(t => ({
      table: t.table, rows: Number(t.rows ?? 0), size: t.size, bytes: Number(t.bytes),
    })),
    errorsByDay,
    indexes: indexStatus(),
    summary,
    takenAt: new Date().toISOString(),
  }
}
