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
 * Each reading is independently guarded. A permission change on one pg_catalog view should
 * blank one row, not take down the page.
 */

export interface Reading {
  label: string
  value: string
  /** Extra context shown under the value — a denominator, a threshold, a caveat. */
  detail?: string
  /** Drives the status dot. 'unknown' when the reading could not be taken. */
  status: 'good' | 'watch' | 'bad' | 'unknown'
}

export interface TableRow { table: string; rows: number; size: string }

export interface SystemHealth {
  readings: Reading[]
  tables: TableRow[]
  indexes: { lang: string; attempted: boolean; loaded: boolean; entries: number; trans: number }[]
  takenAt: string
}

async function q<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn() } catch { return null }
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const [dbSize, conns, tables, errors24h, errors7d, users] = await Promise.all([
    q(() => prisma.$queryRawUnsafe<{ bytes: bigint; pretty: string }[]>(
      `select pg_database_size(current_database()) as bytes,
              pg_size_pretty(pg_database_size(current_database())) as pretty`)),
    // Through pgbouncer this counts server-side connections, which is the number that matters:
    // DATABASE_URL pins connection_limit=1 per function instance and the pooler multiplexes.
    q(() => prisma.$queryRawUnsafe<{ used: bigint; max: string }[]>(
      `select count(*)::bigint as used,
              current_setting('max_connections') as max
       from pg_stat_activity where datname = current_database()`)),
    q(() => prisma.$queryRawUnsafe<{ table: string; rows: bigint | null; size: string }[]>(
      `select c.relname as table,
              s.n_live_tup as rows,
              pg_size_pretty(pg_total_relation_size(c.oid)) as size
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       left join pg_stat_user_tables s on s.relid = c.oid
       where n.nspname = 'public' and c.relkind = 'r'
       order by pg_total_relation_size(c.oid) desc
       limit 10`)),
    q(() => prisma.errorLog.count({ where: { time: { gte: new Date(Date.now() - 86_400_000) } } })),
    q(() => prisma.errorLog.count({ where: { time: { gte: new Date(Date.now() - 7 * 86_400_000) } } })),
    q(() => prisma.user.count({ where: { deletedAt: null } })),
  ])

  const readings: Reading[] = []

  const bytes = dbSize?.[0] ? Number(dbSize[0].bytes) : null
  readings.push({
    label: 'Database size',
    value: dbSize?.[0]?.pretty ?? '—',
    // Supabase Pro includes 8 GB. The corpus lives in public/data, not Postgres, so this grows
    // with people rather than with texts — roughly 60 KB per active student.
    detail: bytes === null ? 'could not read' : `${(bytes / 8_589_934_592 * 100).toFixed(1)}% of an 8 GB Pro allowance`,
    status: bytes === null ? 'unknown' : bytes > 6_000_000_000 ? 'bad' : bytes > 3_000_000_000 ? 'watch' : 'good',
  })

  const used = conns?.[0] ? Number(conns[0].used) : null
  const max = conns?.[0] ? Number(conns[0].max) : null
  const pct = used !== null && max ? used / max : null
  readings.push({
    label: 'Postgres connections',
    value: used === null ? '—' : `${used}${max ? ` / ${max}` : ''}`,
    detail: pct === null ? 'could not read' : 'pooled via pgbouncer, connection_limit=1 per instance',
    status: pct === null ? 'unknown' : pct > 0.85 ? 'bad' : pct > 0.6 ? 'watch' : 'good',
  })

  readings.push({
    label: 'Errors, last 24h',
    value: errors24h === null ? '—' : String(errors24h),
    detail: errors7d === null ? undefined : `${errors7d} in the last 7 days · see /admin/errors`,
    status: errors24h === null ? 'unknown' : errors24h > 50 ? 'bad' : errors24h > 5 ? 'watch' : 'good',
  })

  readings.push({
    label: 'Live accounts',
    value: users === null ? '—' : String(users),
    detail: 'excludes soft-deleted users',
    status: users === null ? 'unknown' : 'good',
  })

  return {
    readings,
    tables: (tables ?? []).map(t => ({ table: t.table, rows: Number(t.rows ?? 0), size: t.size })),
    indexes: indexStatus(),
    takenAt: new Date().toISOString(),
  }
}
