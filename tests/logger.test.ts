import { logError } from '@/lib/logger'

describe('logError', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  afterEach(() => spy.mockClear())
  afterAll(() => spy.mockRestore())

  it('logs a real error as structured JSON', () => {
    logError('scope/test', new Error('boom'))
    expect(spy).toHaveBeenCalledTimes(1)
    const line = JSON.parse(spy.mock.calls[0][0] as string)
    expect(line.level).toBe('error')
    expect(line.message).toBe('scope/test')
    expect(line.error.message).toBe('boom')
  })

  it('suppresses Next dynamic-server-usage control signals', () => {
    const e = Object.assign(new Error('Dynamic server usage: cookies'), { digest: 'DYNAMIC_SERVER_USAGE' })
    logError('scope/test', e)
    expect(spy).not.toHaveBeenCalled()
  })
})
