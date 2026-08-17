/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { StudentProgressTable } from '@/components/instructor/StudentProgressTable'
import { CATALOGUES } from '@/lib/i18n/messages'
import { translator } from '@/lib/i18n/translate'
import { formatDateTime } from '@/lib/i18n/format'
import { GRADE_COMPONENTS } from '@/lib/exam-grading'
import type { Locale } from '@/lib/i18n/locale'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn(), back: jest.fn() }),
}))
// StudentProgressTable is a server component; getServerT reads the locale cookie.
jest.mock('next/headers', () => ({ cookies: () => ({ get: () => ({ value: 'es' }) }) }))

/**
 * The grading surfaces.
 *
 * Most of these components fetch on mount and only render inside an instructor session, so the
 * useful assertions here are not "does this button say Guardar" — they are the two invariants
 * that a read-through cannot check:
 *
 *   1. THE GRADE COMPONENTS RESOLVE IN BOTH FORMS. Four maps of parsing/syntax/translation had
 *      accumulated across two files, one of them a copy living in the same file that imported
 *      the original. They are one namespace now, in a full form and a short form, and every
 *      component value must have both — a missing key renders as the key itself.
 *   2. TIMESTAMPS FOLLOW THE APP, NOT THE BROWSER. `toLocaleString()` with no argument reads
 *      the browser's locale, so a Spanish page on an English browser printed English dates.
 *      Order differs between the two languages, so this is checked by comparing renderings
 *      rather than by looking for a translated word.
 */
const t = (locale: Locale) => translator(locale)

describe('the grade components', () => {
  it('has a full and a short name for every component, in both languages', () => {
    for (const locale of ['en', 'es'] as const) {
      for (const c of GRADE_COMPONENTS) {
        for (const ns of ['grade.component', 'grade.componentShort']) {
          const key = `${ns}.${c}`
          expect(CATALOGUES[locale][key]).toBeDefined()
          expect(t(locale)(key)).not.toBe(key)
        }
      }
    }
  })

  it('translates them rather than falling through to English', () => {
    expect(t('es')('grade.component.parsing')).toBe('Análisis')
    expect(t('es')('grade.component.translation')).toBe('Traducción')
    // The word pane's third field is labelled "Notes" (instructor, 2026-08-16) — the
    // stored field and the grade.component.* score labels keep the Translation name.
    expect(t('en')('grade.componentShort.translation')).toBe('Notes')
    expect(t('es')('grade.componentShort.translation')).toBe('Notas')
  })
})

describe('lockdown integrity events', () => {
  it('names every event type the exam can log', () => {
    // These strings are the whole content of the integrity report. An unlisted type falls back
    // to its raw slug, which is legible but not a sentence.
    const TYPES = ['tab-hidden', 'window-blur', 'fullscreen-exit', 'copy', 'paste', 'contextmenu']
    for (const type of TYPES) {
      expect(t('es')(`integrity.${type}`)).not.toBe(`integrity.${type}`)
      expect(t('en')(`integrity.${type}`)).not.toBe(`integrity.${type}`)
    }
  })
})

describe('timestamps', () => {
  it('follow the app language, not the browser', () => {
    const when = '2026-08-11T15:30:00.000Z'
    expect(formatDateTime(when, 'es')).not.toBe(formatDateTime(when, 'en'))
  })
})

describe('StudentProgressTable', () => {
  const STUDENTS = [{
    userId: 'u1', name: 'Ana Ruiz', email: 'ana@seminary.edu',
    completedAssignments: 3, totalAssignments: 5, averageScore: 88,
  }]

  it('renders its headers in Spanish', () => {
    render(<LocaleProvider locale="es"><StudentProgressTable students={STUDENTS} /></LocaleProvider>)
    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByText('Avance')).toBeInTheDocument()
    expect(screen.getByText('Puntaje promedio')).toBeInTheDocument()
  })
})
