/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { AssignmentBuilder } from '@/components/instructor/AssignmentBuilder'
import type { Locale } from '@/lib/i18n/locale'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn(), back: jest.fn() }),
}))

// The series form loads saved templates on mount. jsdom has no fetch; an empty list is the
// state that matters here (the picker only appears once a template exists).
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ templates: [] }) }),
  ) as unknown as typeof fetch
})

/**
 * The assignment builder, in both languages.
 *
 * It sits behind an instructor sign-in, so the --snapshot guard cannot reach it: that guard
 * fetches pages unauthenticated and gets the sign-in form. So the English half of these tests is
 * doing the snapshot's job — proving the English text did not drift while it was being lifted
 * into the catalogue — and the Spanish half proves the lift actually connected.
 *
 * The parts worth pinning beyond "a word changed":
 *
 *   - THE SUBTYPE NAMES, which were three hand-maintained maps of the same seven values. The
 *     picker, the series builder and the schedule badge each read a different one, so a rename
 *     could leave two of the three behind. They now share one namespace, and the test reads the
 *     long form and the short form from the surfaces that actually show them.
 *   - THE PLURALS. Spanish and English agree on where the boundary falls, so a broken plural
 *     rule shows up not as a wrong word but as a literal "{n}" or an English "quizzes" — which
 *     is exactly the kind of thing that survives a read-through.
 */
function wrap(locale: Locale, ui: React.ReactElement) {
  return render(<LocaleProvider locale={locale}>{ui}</LocaleProvider>)
}

/**
 * Inputs here render a <label> with no `htmlFor`, because no call site passes an `id` — so
 * getByLabelText finds nothing. Locate controls by what they contain instead: a <select> by one
 * of its options, a text input by the label immediately above it.
 */
const selectWithOption = (text: string): HTMLSelectElement => {
  const option = screen.getByRole('option', { name: text })
  return option.closest('select')!
}
const inputLabelled = (text: string): HTMLInputElement =>
  screen.getByText(text).parentElement!.querySelector('input')!

const COURSES = [{
  id: 'c1', name: 'Greek I', level: 'BEGINNING' as const,
  startDate: '2026-01-05', endDate: '2026-05-01',
}]

const builder = () => <AssignmentBuilder courses={COURSES} defaultCourseId="c1" />

describe('the single-assignment form', () => {
  it('renders English unchanged', () => {
    wrap('en', builder())
    expect(screen.getByText('Create Individual Assignment')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Assignment type')).toBeInTheDocument()
    expect(screen.getByText('Late Submissions')).toBeInTheDocument()
    expect(screen.getByText('Save Draft')).toBeInTheDocument()
  })

  it('renders Spanish', () => {
    wrap('es', builder())
    expect(screen.getByText('Crear tarea individual')).toBeInTheDocument()
    expect(screen.getByText('Título')).toBeInTheDocument()
    expect(screen.getByText('Tipo de tarea')).toBeInTheDocument()
    expect(screen.getByText('Entregas tardías')).toBeInTheDocument()
    expect(screen.getByText('Guardar borrador')).toBeInTheDocument()
  })

  it('names the assignment types from the shared namespace', () => {
    // This list and the series form's were the fifth and sixth copies of this enum in the app.
    wrap('es', builder())
    const select = selectWithOption('Prueba de vocabulario')
    expect(within(select).getByText('Presentación grupal')).toBeInTheDocument()
    expect(within(select).getByText('Búsqueda por construcción')).toBeInTheDocument()
    expect(within(select).getByText('Examen de traducción')).toBeInTheDocument()
  })

  it('translates the morphology subtypes and their descriptions', () => {
    wrap('es', builder())
    fireEvent.change(selectWithOption('Prueba de vocabulario'), { target: { value: 'MORPHOLOGY_QUIZ' } })
    expect(screen.getByText('Enfoque morfológico')).toBeInTheDocument()
    expect(screen.getByText('Análisis de verbos')).toBeInTheDocument()
    expect(screen.getByText('Oraciones condicionales')).toBeInTheDocument()
    expect(screen.getByText('Identificar el uso del modo subjuntivo')).toBeInTheDocument()
  })

  it('uses the shared parsing vocabulary for the filter chips', () => {
    // The same terms the reader's parsing pane shows. Translating them here rather than through
    // featureLabel would put "Tense" in the builder and "Tiempo" in the pane.
    wrap('es', builder())
    fireEvent.change(selectWithOption('Prueba de vocabulario'), { target: { value: 'MORPHOLOGY_QUIZ' } })
    fireEvent.click(screen.getByText('Restringir a formas específicas…'))
    expect(screen.getByText('Tiempo')).toBeInTheDocument()
    expect(screen.getByText('Voz')).toBeInTheDocument()
    expect(screen.getByText('Modo')).toBeInTheDocument()
  })
})

describe('the repeated-assignment form', () => {
  const openSeries = (locale: Locale) => {
    wrap(locale, builder())
    fireEvent.click(screen.getByText(locale === 'en' ? 'Create Repeated Assignments' : 'Crear tareas repetidas'))
  }

  it('renders English unchanged', () => {
    openSeries('en')
    expect(screen.getByText('Semester Timing')).toBeInTheDocument()
    expect(screen.getByText('Quiz days')).toBeInTheDocument()
    expect(screen.getByText('Thu')).toBeInTheDocument()
  })

  it('renders Spanish, with its own weekday abbreviations', () => {
    openSeries('es')
    expect(screen.getByText('Fechas del semestre')).toBeInTheDocument()
    expect(screen.getByText('Días de prueba')).toBeInTheDocument()
    expect(screen.getByText('jue')).toBeInTheDocument()
    expect(screen.getByText('sáb')).toBeInTheDocument()
  })

  it('pluralises the schedule preview rather than pasting an English suffix', () => {
    // English switched on `length !== 1 ? 's' : ''` inline. Spanish agrees about where the
    // boundary falls but not about the word, so the giveaway for a broken rule is an English
    // "quizzes" or a literal "{n}" surviving into the heading.
    openSeries('es')
    fireEvent.change(inputLabelled('Inicio del semestre'), { target: { value: '2026-01-08' } })
    const heading = screen.getByText(/Vista previa del calendario/)
    expect(heading.textContent).toMatch(/\d+ pruebas/)
    expect(heading.textContent).not.toMatch(/\{n\}|quiz/)
  })

  it('shows the SHORT subtype name in the schedule badge, not the long one', () => {
    // The distinction the third map existed to make: "Análisis de sustantivos" does not fit in
    // the badge, so Spanish shows "Sustantivos" there and the full name in the picker.
    openSeries('es')
    fireEvent.change(selectWithOption('Prueba de morfología'), { target: { value: 'MORPHOLOGY_QUIZ' } })
    fireEvent.change(inputLabelled('Inicio del semestre'), { target: { value: '2026-01-08' } })
    expect(screen.getAllByText('Verbos').length).toBeGreaterThan(0)
  })

  it('counts weeks and days per week with real plural rules', () => {
    openSeries('es')
    fireEvent.change(inputLabelled('Inicio del semestre'), { target: { value: '2026-01-08' } })
    expect(screen.getByText(/16 semanas/)).toBeInTheDocument()
    expect(screen.getByText(/1 día\/semana/)).toBeInTheDocument()
  })
})
