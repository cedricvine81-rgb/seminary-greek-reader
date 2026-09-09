/**
 * @jest-environment jsdom
 */
/**
 * What the browser reporter files, and what it stays quiet about.
 *
 * Next implements redirect() and notFound() by THROWING — the "error" reaches window.onerror
 * while a server component is streaming. Every student bounced off a gated page was therefore
 * filing an error report, which buries the reports that mean something.
 */
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { ClientErrorReporter } from '@/components/layout/ClientErrorReporter'

const fire = (message: string) =>
  window.dispatchEvent(new ErrorEvent('error', { message, error: new Error(message) }))

const reported = () =>
  (global.fetch as jest.Mock).mock.calls
    .filter(([url]) => String(url).includes('/api/client-error'))
    .map(([, init]) => JSON.parse((init as RequestInit).body as string).message as string)

beforeEach(() => {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({}) })) as unknown as typeof fetch
  render(<ClientErrorReporter />)
})

describe('ClientErrorReporter', () => {
  it('reports a real error', () => {
    fire('Uncaught TypeError: x is not a function')
    expect(reported()).toEqual(['Uncaught TypeError: x is not a function'])
  })

  it.each([
    'Uncaught Error: NEXT_REDIRECT',
    'Uncaught Error: NEXT_NOT_FOUND',
    'NEXT_HTTP_ERROR_FALLBACK;404',
  ])('stays quiet about Next control flow: %s', message => {
    fire(message)
    expect(reported()).toEqual([])
  })

  it('still ignores the classic non-errors', () => {
    fire('Script error.')
    fire('ResizeObserver loop completed with undelivered notifications.')
    expect(reported()).toEqual([])
  })

  it('files each signature once', () => {
    fire('Uncaught TypeError: x is not a function')
    fire('Uncaught TypeError: x is not a function')
    expect(reported()).toHaveLength(1)
  })
})
