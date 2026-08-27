/**
 * Who teaches a course — the lead instructor and any co-instructors, named as one line.
 *
 * A co-taught course showed only whoever holds `Course.instructorId`, and on this app's courses
 * that is often the administrative owner rather than the person running the class. A student
 * picking a course from the list, or looking at the one they are enrolled in, saw a name that
 * was not the person they would be dealing with.
 *
 * The list is joined with Intl.ListFormat so Spanish reads "y" rather than "and", and the lead
 * instructor is always first: order carries meaning here even though both teach the course.
 */

export interface TeachingPerson {
  title?: string | null
  firstName?: string | null
  surname?: string | null
}

/** "Dr Cedric Vine" — title first, and never a stray double space when a part is missing. */
export function personName(p: TeachingPerson | null | undefined): string {
  if (!p) return ''
  return [p.title, p.firstName, p.surname].map(x => x?.trim()).filter(Boolean).join(' ')
}

/**
 * "Dr Cedric Vine and Dr Jane Smith". The lead comes first; anyone unnamed is dropped rather
 * than shown as an empty gap.
 */
export function teachingTeamName(
  lead: TeachingPerson | null | undefined,
  coInstructors: TeachingPerson[] = [],
  locale = 'en',
): string {
  const names = [personName(lead), ...coInstructors.map(personName)].filter(Boolean)
  const unique = Array.from(new Set(names))
  if (unique.length <= 1) return unique[0] ?? ''
  try {
    return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(unique)
  } catch {
    return unique.join(', ')
  }
}

/** Every teaching email, lead first — for a mailto that reaches the whole team. */
export function teachingTeamEmails(
  lead: { email?: string | null } | null | undefined,
  coInstructors: { email?: string | null }[] = [],
): string[] {
  const all = [lead?.email, ...coInstructors.map(c => c.email)]
    .map(e => e?.trim())
    .filter((e): e is string => !!e)
  return Array.from(new Set(all))
}
