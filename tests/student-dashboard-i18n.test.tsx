/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { AssignmentList } from '@/components/student/AssignmentList'
import { StudentGradebook, type GradebookRow } from '@/components/student/StudentGradebook'
import { ExamOpensNotice } from '@/components/student/ExamOpensNotice'
import { LocalDeadline } from '@/components/student/LocalDeadline'
import type { Locale } from '@/lib/i18n/locale'

// ExamOpensNotice calls useRouter() to re-run the server component the moment the exam opens.
// There is no app router in a jsdom test, so stub the two methods it touches.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn(), back: jest.fn() }),
}))

/**
 * The student dashboard sits behind a sign-in, so the --snapshot guard cannot reach it: it
 * fetches pages unauthenticated and gets the sign-in form. Every other surface in this
 * translation effort was confirmed by opening it in a browser, and this one cannot be, so these
 * render the client-side pieces directly in both languages instead.
 *
 * What they are really guarding is the same thing the snapshot guards elsewhere — that the
 * ENGLISH is unchanged — plus the two things unique to this surface: labels looked up by a
 * template key from an enum, and dates, whose ORDER differs by language and so cannot be
 * checked by looking for a translated word.
 */
function wrap(locale: Locale, ui: React.ReactElement) {
  return render(<LocaleProvider locale={locale}>{ui}</LocaleProvider>)
}

const ASSIGNMENTS = [{
  id: 'a1', courseId: 'c1', title: 'Week 3 Vocabulary', type: 'VOCABULARY_QUIZ',
  weekNumber: 3, dueDate: '2026-08-14T12:00:00.000Z',
  round1Deadline: null, round2Deadline: null,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}] as any

const ROWS: GradebookRow[] = [
  { id: 'a1', title: 'Week 3 Vocabulary', weekNumber: 3, type: 'VOCABULARY_QUIZ', pct: 88 },
  { id: 'a2', title: 'Passage 1', weekNumber: 4, type: 'TRANSLATION_EXERCISE', pct: null },
]

describe('AssignmentList', () => {
  it('renders English unchanged', () => {
    wrap('en', <AssignmentList assignments={ASSIGNMENTS} />)
    expect(screen.getByText('Vocabulary')).toBeInTheDocument()   // the short type badge
    expect(screen.getByText('Start')).toBeInTheDocument()
    expect(screen.getByText(/Week 3 ·/)).toBeInTheDocument()
  })

  it('renders Spanish', () => {
    wrap('es', <AssignmentList assignments={ASSIGNMENTS} />)
    expect(screen.getByText('Vocabulario')).toBeInTheDocument()
    expect(screen.getByText('Empezar')).toBeInTheDocument()
    expect(screen.getByText(/Semana 3 ·/)).toBeInTheDocument()
  })

  it('formats the due date in the reader’s language, not just its words', () => {
    // English puts the month first, Spanish the day. A translated label with an English date
    // order reads as broken, and no amount of checking for translated WORDS would catch it.
    const { unmount } = wrap('en', <AssignmentList assignments={ASSIGNMENTS} />)
    expect(screen.getByText(/Aug 14, 2026/)).toBeInTheDocument()
    unmount()
    wrap('es', <AssignmentList assignments={ASSIGNMENTS} />)
    expect(screen.getByText(/14 ago 2026/)).toBeInTheDocument()
  })

  it('shows the empty state in both languages', () => {
    const { unmount } = wrap('en', <AssignmentList assignments={[]} />)
    expect(screen.getByText(/Your instructor hasn/)).toBeInTheDocument()
    unmount()
    wrap('es', <AssignmentList assignments={[]} />)
    expect(screen.getByText(/Tu profesor a/)).toBeInTheDocument()
  })
})

describe('StudentGradebook', () => {
  it('labels groups from the shared namespace in English', () => {
    wrap('en', <StudentGradebook studentName="Ada" rows={ROWS} />)
    expect(screen.getByText('Vocabulary Quizzes')).toBeInTheDocument()
    expect(screen.getByText('Translation Exercises')).toBeInTheDocument()
    expect(screen.getByText('Overall')).toBeInTheDocument()
    expect(screen.getByText('Wk 3')).toBeInTheDocument()
  })

  it('labels groups in Spanish', () => {
    wrap('es', <StudentGradebook studentName="Ada" rows={ROWS} />)
    expect(screen.getByText('Pruebas de vocabulario')).toBeInTheDocument()
    expect(screen.getByText('Ejercicios de traducción')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Sem. 3')).toBeInTheDocument()
  })

  it('keeps the assignment titles themselves untranslated', () => {
    // They are the instructor's own words, stored on the row.
    wrap('es', <StudentGradebook studentName="Ada" rows={ROWS} />)
    expect(screen.getAllByText('Week 3 Vocabulary').length).toBeGreaterThan(0)
  })
})

describe('ExamOpensNotice', () => {
  // Behind a sign-in AND behind a clock, so neither the snapshot nor a browser check reaches
  // the countdown reliably. The unit letters matter: Spanish abbreviates minutes "min".
  const soon = new Date(Date.now() + 3 * 3600_000 + 4 * 60_000).toISOString()

  it('counts down in English', async () => {
    wrap('en', <ExamOpensNotice opensAtIso={soon} />)
    expect(await screen.findByText(/This exam isn/)).toBeInTheDocument()
    expect(await screen.findByText(/\dh \d\dm/)).toBeInTheDocument()
  })

  it('counts down in Spanish, with its own minute abbreviation', async () => {
    wrap('es', <ExamOpensNotice opensAtIso={soon} />)
    expect(await screen.findByText(/Este examen todav/)).toBeInTheDocument()
    expect(await screen.findByText(/\dh \d\dmin/)).toBeInTheDocument()
  })
})

describe('LocalDeadline', () => {
  it('renders the date in the interface language, not the browser’s', () => {
    const iso = '2026-08-14T12:00:00.000Z'
    const { unmount } = wrap('en', <LocalDeadline label="Closes" iso={iso} />)
    expect(screen.getByText(/Aug/)).toBeInTheDocument()
    unmount()
    wrap('es', <LocalDeadline label="Cierra" iso={iso} />)
    expect(screen.getByText(/ago/)).toBeInTheDocument()
  })

  it('marks a passed deadline Closed / Cerrado', () => {
    const past = '2020-01-01T00:00:00.000Z'
    const { unmount } = wrap('en', <LocalDeadline label="Closes" iso={past} />)
    expect(screen.getByText('Closed')).toBeInTheDocument()
    unmount()
    wrap('es', <LocalDeadline label="Cierra" iso={past} />)
    expect(screen.getByText('Cerrado')).toBeInTheDocument()
  })
})
