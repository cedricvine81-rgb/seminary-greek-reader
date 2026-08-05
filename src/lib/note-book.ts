import { findProseWork } from '@/lib/prose-texts'

/**
 * The `book` key a note or highlight is stored under, for any work in the Texts library.
 *
 * This used to live only inside TextsReader, which meant no other surface could offer notes on
 * the same passage — a search result knew which verse it had found and had no way to name it
 * the way the reader does. Two implementations of this would be worse than none: a note made
 * from a search result must land on the same key as one made in the reader, or it simply will
 * not be there when the reader is opened.
 *
 * Three shapes, because three corpora number themselves differently:
 *   · LXX works are keyed by osisId ("Sir", "PsSol") — the same key the Bible reader uses.
 *   · Embedded prose declares its own noteBook ("IrenHaer3", "TertPrax").
 *   · Josephus has one note book PER BOOK of a work ("Ant.18"), since its works are long and
 *     its citations are by book and section.
 */
const JOS_SHORT: Record<string, string> = {
  antiquities: 'Ant', 'jewish-war': 'JW', 'against-apion': 'AgAp', life: 'Life',
}

export function noteBookFor(
  source: string,
  opts: { osisId?: string; workDir?: string; book?: number } = {},
): string | null {
  if (source === 'lxx') return opts.osisId ?? null
  const prose = findProseWork(source as Parameters<typeof findProseWork>[0])
  if (prose) return prose.noteBook
  if (source === 'josephus' && opts.workDir) {
    return `${JOS_SHORT[opts.workDir] ?? opts.workDir}.${opts.book}`
  }
  return null
}
