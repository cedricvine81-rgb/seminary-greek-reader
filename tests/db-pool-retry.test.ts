/**
 * retryOnPoolTimeout — the guard between a momentary pool-timeout (P2024) and a dead
 * server render. P2024 means the query never acquired a connection, so ONE retry is safe
 * for reads and writes alike; anything else must rethrow untouched, first time.
 */
import { retryOnPoolTimeout } from '@/lib/db'

const p2024 = () => Object.assign(new Error('Timed out fetching a new connection'), { code: 'P2024' })

describe('retryOnPoolTimeout', () => {
  it('passes a success straight through', async () => {
    const run = jest.fn().mockResolvedValue(42)
    await expect(retryOnPoolTimeout(run)).resolves.toBe(42)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('retries exactly once on P2024, and can succeed', async () => {
    const run = jest.fn().mockRejectedValueOnce(p2024()).mockResolvedValue('ok')
    await expect(retryOnPoolTimeout(run, 1)).resolves.toBe('ok')
    expect(run).toHaveBeenCalledTimes(2)
  })

  it('gives up after the second P2024', async () => {
    const run = jest.fn().mockRejectedValue(p2024())
    await expect(retryOnPoolTimeout(run, 1)).rejects.toMatchObject({ code: 'P2024' })
    expect(run).toHaveBeenCalledTimes(2)
  })

  it('rethrows any other error without retrying', async () => {
    const run = jest.fn().mockRejectedValue(Object.assign(new Error('unique constraint'), { code: 'P2002' }))
    await expect(retryOnPoolTimeout(run, 1)).rejects.toMatchObject({ code: 'P2002' })
    expect(run).toHaveBeenCalledTimes(1)
  })
})
