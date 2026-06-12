'use client'
import useSWR, { type SWRConfiguration } from 'swr'

/**
 * Shared JSON fetcher for SWR. Throws on non-2xx so SWR surfaces an `error`
 * instead of silently caching an error body.
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body?.error || `Request failed (${res.status})`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return res.json()
}

/**
 * Thin wrapper around useSWR with our default fetcher and sensible defaults:
 * revalidate when the tab regains focus (replaces the old manual focus-refetch),
 * dedupe rapid duplicate requests. Pass `key = null` to conditionally skip.
 */
export function useApi<T = unknown>(key: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(key, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
    ...config,
  })
}
