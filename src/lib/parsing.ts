import type { MorphParse } from '@/types/morphology'

/** Convert a MorphParse object into a readable label */
export function buildParsingLabel(parse: Partial<MorphParse>): string {
  const parts: string[] = []
  if (parse.partOfSpeech) parts.push(parse.partOfSpeech)
  if (parse.tense) parts.push(parse.tense)
  if (parse.voice) parts.push(parse.voice)
  if (parse.mood) parts.push(parse.mood)
  if (parse.person) parts.push(`${parse.person}p`)
  if (parse.number) parts.push(parse.number.slice(0, 2))
  if (parse.casus) parts.push(parse.casus.slice(0, 3))
  if (parse.gender) parts.push(parse.gender.slice(0, 1))
  return parts.join('.')
}

/** Score a student morphology answer against the correct parse */
export function gradeMorphAnswer(
  studentAnswers: Record<string, string>,
  correctParse: Partial<MorphParse>
): { correct: number; total: number; details: Record<string, boolean> } {
  const fields = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
  const details: Record<string, boolean> = {}
  let correct = 0
  let total = 0

  for (const field of fields) {
    const expected = (correctParse as Record<string, string | undefined>)[field]
    if (!expected) continue
    total++
    const isCorrect = studentAnswers[field]?.toLowerCase() === expected.toLowerCase()
    details[field] = isCorrect
    if (isCorrect) correct++
  }

  return { correct, total, details }
}
