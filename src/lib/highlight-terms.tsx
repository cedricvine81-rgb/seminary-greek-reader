import type { ReactNode } from 'react'

// Accent/case-insensitive term highlighting shared by the Master Search results pane and the
// Reader's inline translations. Terms passed in are already normalized (see parseSearchTerms).

export function normalizeFold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Folded (accent/case-stripped) copy of the text plus a map from each folded index back to the
// original index, so a match found in folded space can be sliced from the ORIGINAL text.
export function buildFold(text: string): { folded: string; map: number[] } {
  let folded = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i++) {
    const f = normalizeFold(text[i])
    for (let j = 0; j < f.length; j++) { folded += f[j]; map.push(i) }
  }
  return { folded, map }
}

// Merged [start,end) spans (original-text indices) of every occurrence of any term.
export function findTermRanges(text: string, terms: string[]): Array<[number, number]> {
  if (!terms.length) return []
  const { folded, map } = buildFold(text)
  const ranges: Array<[number, number]> = []
  for (const t of terms) {
    if (!t) continue
    let from = 0
    for (;;) {
      const fi = folded.indexOf(t, from)
      if (fi === -1) break
      ranges.push([map[fi], map[fi + t.length - 1] + 1])
      from = fi + t.length
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([r[0], r[1]])
  }
  return merged
}

// Render text[from,to) with the given (original-index) ranges wrapped in <mark className>.
export function markSlice(text: string, ranges: Array<[number, number]>, from: number, to: number, className: string): ReactNode[] {
  const out: ReactNode[] = []
  let pos = from, key = 0
  for (const [s, e] of ranges) {
    if (e <= from || s >= to) continue
    const cs = Math.max(s, from), ce = Math.min(e, to)
    if (cs > pos) out.push(text.slice(pos, cs))
    out.push(<mark key={key++} className={className}>{text.slice(cs, ce)}</mark>)
    pos = ce
  }
  if (pos < to) out.push(text.slice(pos, to))
  return out
}

// Full text with every term occurrence highlighted (returns the raw string when nothing matches).
export function markTerms(text: string, terms: string[], className: string): ReactNode {
  const ranges = findTermRanges(text, terms)
  if (!ranges.length) return text
  return <>{markSlice(text, ranges, 0, text.length, className)}</>
}
