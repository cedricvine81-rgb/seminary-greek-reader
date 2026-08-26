// Choosing what to show of a long passage.
//
// A single window spanning every match is no use: 1 Kings 12:24 carries the whole of Swete's
// 12:24a-24z at 1,017 words, and a construct can match near the start and again 800 words later —
// one window around both shows almost the entire passage, which is the thing being avoided.
// So matches are CLUSTERED, and each cluster gets its own window, joined by an ellipsis.

export interface SnippetRange { from: number; to: number }   // [from, to)

// Windows covering every match, in order, merged where they touch. `positions` are word indices.
export function snippetRanges(positions: number[], length: number, context: number): SnippetRange[] {
  if (positions.length === 0) return [{ from: 0, to: length }]
  const sorted = [...positions].sort((a, b) => a - b)
  const ranges: SnippetRange[] = []
  for (const p of sorted) {
    const from = Math.max(0, p - context)
    const to = Math.min(length, p + context + 1)
    const last = ranges[ranges.length - 1]
    // Touching or overlapping windows become one, so two nearby matches don't produce an
    // ellipsis between words that are actually adjacent.
    if (last && from <= last.to) last.to = Math.max(last.to, to)
    else ranges.push({ from, to })
  }
  return ranges
}

// Whether windowing is worth it at all: long enough to bury the match, and short enough that the
// windows would actually leave something out.
export function shouldSnippet(length: number, positions: number[], longAt: number, context: number): boolean {
  if (length <= longAt || positions.length === 0) return false
  const shown = snippetRanges(positions, length, context).reduce((n, r) => n + (r.to - r.from), 0)
  return shown < length
}
