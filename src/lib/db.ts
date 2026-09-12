import { PrismaClient } from '@prisma/client'

/**
 * Retry once on a connection-pool timeout (Prisma P2024).
 *
 * DATABASE_URL runs connection_limit=1 through pgbouncer, so every query on an instance
 * queues for one connection. Under concurrency (a class loading dashboards on the same warm
 * lambda) the last query in the queue can exceed pool_timeout and throw P2024 — which took
 * the whole server render down and surfaced to students as React #419/#422 ("server could
 * not finish this Suspense boundary"), the dominant client-error cluster in ErrorLog.
 *
 * P2024 specifically means the query NEVER RAN — no connection was ever acquired — so one
 * retry is safe for reads and writes alike. Anything else rethrows untouched.
 */
export async function retryOnPoolTimeout<T>(run: () => Promise<T>, delayMs = 300): Promise<T> {
  try {
    return await run()
  } catch (e) {
    if ((e as { code?: string })?.code !== 'P2024') throw e
    // Jittered pause so a whole queue of timed-out callers doesn't stampede back at once.
    await new Promise(r => setTimeout(r, delayMs + Math.random() * delayMs))
    return run()
  }
}

function buildClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends({
    query: {
      // Every model operation and raw query goes through the retry. $transaction bodies are
      // covered at the level of the transaction's own queries.
      $allOperations({ query, args }) {
        return retryOnPoolTimeout(() => query(args))
      },
    },
  })
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof buildClient> }

export const prisma = globalForPrisma.prisma ?? buildClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
