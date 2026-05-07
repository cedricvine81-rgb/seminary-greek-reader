/** Builds a human-readable parsing string from a MorphParse row.
 *  This module is safe to import from client components — no Node.js APIs. */
export function formatParsing(parse: {
  partOfSpeech: string
  tense?: string | null
  voice?: string | null
  mood?: string | null
  person?: string | null
  number?: string | null
  casus?: string | null
  gender?: string | null
  degree?: string | null
}): string {
  const parts: string[] = [parse.partOfSpeech]
  if (parse.tense)  parts.push(parse.tense)
  if (parse.voice)  parts.push(parse.voice)
  if (parse.mood)   parts.push(parse.mood)
  if (parse.person) parts.push(`${parse.person} person`)
  if (parse.number) parts.push(parse.number)
  if (parse.casus)  parts.push(parse.casus)
  if (parse.gender) parts.push(parse.gender)
  if (parse.degree) parts.push(parse.degree)
  return parts.join(', ')
}
