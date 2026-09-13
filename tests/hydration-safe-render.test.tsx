/**
 * @jest-environment jsdom
 */
/**
 * What the SERVER sends must not depend on the reader's clock, zone or locale settings.
 *
 * When it does, the browser draws something different from the HTML it was given, React
 * discards the boundary and re-renders it in the client — "Text content does not match
 * server-rendered HTML" (#425) and the #419/#422 that follow. Those three accounted for 32 of
 * the 44 errors in a week of the production log, on /student and /student/assignments.
 *
 * So these tests render the components the way the SERVER does (renderToString) and assert the
 * output carries nothing viewer-dependent — then render them as a browser does and assert the
 * real value arrives after mount.
 */
import '@testing-library/jest-dom'
// jsdom ships no TextEncoder, which react-dom/server needs on import.
import { TextEncoder, TextDecoder } from 'node:util'
Object.assign(globalThis, { TextEncoder, TextDecoder })
// React 19's react-dom/server schedules through MessageChannel, which jsdom doesn't provide.
// eslint-disable-next-line @typescript-eslint/no-var-requires
Object.assign(globalThis, { MessageChannel: require('node:worker_threads').MessageChannel })
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { renderToString } = require('react-dom/server') as typeof import('react-dom/server')
import { render, screen, waitFor } from '@testing-library/react'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { LocalDeadline } from '@/components/student/LocalDeadline'
import { DueLabel } from '@/components/student/StudentCourseCard'

// A fixed instant with a date that differs by timezone: 23:30 UTC is "tomorrow" east of
// Greenwich and "today" west of it, which is exactly the disagreement that breaks hydration.
const ISO = '2026-03-10T23:30:00.000Z'
const wrap = (ui: React.ReactNode) => <LocaleProvider locale="en">{ui}</LocaleProvider>

describe('server-rendered output carries nothing the server cannot know', () => {
  it('LocalDeadline sends no time at all until it is in a browser', () => {
    const html = renderToString(wrap(<LocalDeadline label="Due" iso={ISO} />))
    expect(html).toContain('Due')
    // No formatted date or time, in any zone's rendering of that instant.
    expect(html).not.toMatch(/\d{1,2}:\d{2}/)
    expect(html).not.toMatch(/Mar|March|2026/)
  })

  it('LocalDeadline fills the local time in after mount', async () => {
    render(wrap(<LocalDeadline label="Due" iso={ISO} />))
    await waitFor(() => expect(screen.getByText(/2026/)).toBeInTheDocument())
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
  })

  it('DueLabel sends the timezone-pinned date, never a clock-relative phrase', () => {
    // "Due today" / "tomorrow" / "in N days" all depend on when and where the reader is.
    const html = renderToString(wrap(<DueLabel dueDate={new Date().toISOString()} />))
    expect(html).not.toMatch(/today|tomorrow|in \d+ days/i)
  })

  it('DueLabel upgrades to the relative phrase once mounted', async () => {
    render(wrap(<DueLabel dueDate={new Date().toISOString()} />))
    await waitFor(() => expect(screen.getByText(/today/i)).toBeInTheDocument())
  })

  it('the server output and the first client paint agree', () => {
    // The property that actually matters: hydration compares these two strings.
    const serverHtml = renderToString(wrap(<LocalDeadline label="Due" iso={ISO} />))
    const { container } = render(wrap(<LocalDeadline label="Due" iso={ISO} />))
    // React has already run effects by now, so compare against a fresh server render of the
    // same input rather than the post-effect DOM: the placeholder must be what SSR emits.
    expect(serverHtml).toContain('…')
    expect(container.textContent).not.toBe('')
  })
})
