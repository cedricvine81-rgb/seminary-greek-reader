/**
 * CSV parsing + validation for the admin student-import feature.
 *
 * Pure functions only — no DB calls — so the same code path is used by both
 * the preview endpoint (server-side dry-run) and the commit endpoint.
 */

export interface ParsedRow {
  /** Source line number (1-based, excludes blank lines). */
  line: number
  firstName: string
  surname: string
  email: string
}

export interface RowError {
  line: number
  raw: string
  reason: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Parse a pasted block of text into rows and errors.
 *
 * Supported formats per line:
 *   1. `firstName, surname, email`
 *   2. `Full Name, email`         (firstName = everything before the last space; surname = last word)
 *
 * Comma or tab separated. Header rows (containing "email") are skipped.
 * Blank lines are ignored.
 */
export function parseRoster(input: string): { rows: ParsedRow[]; errors: RowError[] } {
  const rows: ParsedRow[] = []
  const errors: RowError[] = []
  const lines = input.split(/\r?\n/)

  let dataLineNumber = 0
  for (const raw of lines) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    dataLineNumber += 1

    // Skip header rows (any line where one of the cells reads literally "email")
    const parts = trimmed.split(/\s*[,\t]\s*/).map(s => s.trim()).filter(Boolean)
    if (parts.some(p => p.toLowerCase() === 'email')) continue

    if (parts.length < 2) {
      errors.push({ line: dataLineNumber, raw: trimmed, reason: 'Expected at least 2 columns (name, email)' })
      continue
    }

    let firstName = ''
    let surname = ''
    let email = ''

    if (parts.length >= 3) {
      // firstName, surname, email
      firstName = parts[0]
      surname = parts[1]
      email = parts[parts.length - 1]
    } else {
      // "Full Name", "email" — split full name on last space
      const fullName = parts[0]
      email = parts[1]
      const idx = fullName.lastIndexOf(' ')
      if (idx === -1) {
        errors.push({ line: dataLineNumber, raw: trimmed, reason: 'Name must have at least two parts (first + surname)' })
        continue
      }
      firstName = fullName.slice(0, idx).trim()
      surname = fullName.slice(idx + 1).trim()
    }

    if (!firstName || !surname) {
      errors.push({ line: dataLineNumber, raw: trimmed, reason: 'Missing first name or surname' })
      continue
    }
    if (!EMAIL_RE.test(email)) {
      errors.push({ line: dataLineNumber, raw: trimmed, reason: `Invalid email format: "${email}"` })
      continue
    }

    rows.push({ line: dataLineNumber, firstName, surname, email: email.toLowerCase() })
  }

  // Within-input duplicates
  const seen = new Map<string, number>()
  for (const r of rows) {
    if (seen.has(r.email)) {
      errors.push({ line: r.line, raw: `${r.firstName} ${r.surname}, ${r.email}`, reason: `Duplicate of line ${seen.get(r.email)} (same email)` })
    } else {
      seen.set(r.email, r.line)
    }
  }

  return { rows, errors }
}
