type NameUser = { firstName: string | null; surname: string | null; email: string }

/**
 * Case-insensitive, locale-aware comparator for listing students alphabetically.
 * Sorts by surname, then first name; falls back to first name / email when a
 * surname is missing so nameless accounts still interleave sensibly.
 */
export function compareStudentsByName(a: NameUser, b: NameUser): number {
  const key = (u: NameUser) => u.surname || u.firstName || u.email || ''
  const primary = key(a).localeCompare(key(b), undefined, { sensitivity: 'base' })
  if (primary !== 0) return primary
  return (a.firstName || '').localeCompare(b.firstName || '', undefined, { sensitivity: 'base' })
}
