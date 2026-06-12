import { parseRoster } from '@/lib/csv-import'

describe('parseRoster — three-column format', () => {
  it('parses firstName, surname, email', () => {
    const { rows, errors } = parseRoster('Jane, Doe, jane@example.edu')
    expect(errors).toEqual([])
    expect(rows).toEqual([{ line: 1, firstName: 'Jane', surname: 'Doe', email: 'jane@example.edu' }])
  })

  it('handles tab separators', () => {
    const { rows, errors } = parseRoster('Jane\tDoe\tjane@example.edu')
    expect(errors).toEqual([])
    expect(rows[0].email).toBe('jane@example.edu')
  })

  it('lowercases the email', () => {
    const { rows } = parseRoster('Jane, Doe, JANE@Example.EDU')
    expect(rows[0].email).toBe('jane@example.edu')
  })
})

describe('parseRoster — two-column format', () => {
  it('parses "Full Name, email" by splitting on last space', () => {
    const { rows, errors } = parseRoster('Jane Doe, jane@example.edu')
    expect(errors).toEqual([])
    expect(rows[0]).toMatchObject({ firstName: 'Jane', surname: 'Doe' })
  })

  it('keeps multi-part first names together', () => {
    const { rows } = parseRoster('Mary Jane Smith, mj@example.edu')
    expect(rows[0]).toMatchObject({ firstName: 'Mary Jane', surname: 'Smith' })
  })

  it('rejects a single-word name in two-column mode', () => {
    const { rows, errors } = parseRoster('Madonna, m@example.edu')
    expect(rows).toEqual([])
    expect(errors[0].reason).toMatch(/first.*surname/i)
  })
})

describe('parseRoster — validation', () => {
  it('rejects invalid email format', () => {
    const { rows, errors } = parseRoster('Jane Doe, not-an-email')
    expect(rows).toEqual([])
    expect(errors[0].reason).toMatch(/invalid email/i)
  })

  it('flags duplicates within the input', () => {
    const { rows, errors } = parseRoster([
      'Jane Doe, jane@example.edu',
      'John Smith, john@example.edu',
      'Janet Dorn, jane@example.edu',
    ].join('\n'))
    expect(rows).toHaveLength(3)
    expect(errors).toHaveLength(1)
    expect(errors[0].reason).toMatch(/duplicate/i)
    expect(errors[0].line).toBe(3)
  })

  it('skips a header row containing "email"', () => {
    const { rows, errors } = parseRoster([
      'firstName, surname, email',
      'Jane, Doe, jane@example.edu',
    ].join('\n'))
    expect(errors).toEqual([])
    expect(rows).toHaveLength(1)
  })

  it('skips blank lines', () => {
    const { rows } = parseRoster('\nJane Doe, jane@example.edu\n\n\nJohn Smith, john@example.edu\n')
    expect(rows).toHaveLength(2)
  })

  it('returns an error for an unparseable row, but still collects the others', () => {
    const { rows, errors } = parseRoster([
      'Jane Doe, jane@example.edu',
      'just-one-cell',
      'John Smith, john@example.edu',
    ].join('\n'))
    expect(rows).toHaveLength(2)
    expect(errors).toHaveLength(1)
  })
})
