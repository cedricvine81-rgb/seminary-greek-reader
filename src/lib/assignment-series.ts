/**
 * Grouping a course's assignments into the series they were created as.
 *
 * The semester builder makes one assignment per date — a 14-week vocabulary schedule is
 * 28 rows — and every one of them has to be edited singly. Recognising the series lets
 * the course page offer one control for the whole run.
 *
 * A series is identified from the title, since the builder is the only thing that
 * creates them and it titles every occurrence "Week N — <stem>". Stripping the week
 * prefix and the section suffix leaves the stem shared by the run.
 */
export interface SeriesMember {
  id: string
  title: string
  weekNumber: number
  dueDate: string
  isPublished: boolean
  questionCount: number
  // Current settings, so the editor can show which choice is in force.
  vocabReviewPct?: number | null
  maxRetakes?: number | null
  timePerQuestion?: number | null
  allowLate?: boolean
  lateDaysLimit?: number | null
}

export interface AssignmentSeries {
  key: string
  type: string
  /** "Vocabulary Quiz" — the shared part of the members' titles. */
  stem: string
  members: SeriesMember[]
}

/** "Week 13 — Vocabulary Quiz (§2-E)" -> "Vocabulary Quiz" */
export function seriesStem(title: string): string {
  return title
    .replace(/^\s*Week\s+\d+\s*[—–-]\s*/i, '')   // week prefix
    .replace(/\s*\(§[^)]*\)\s*$/, '')            // section suffix
    // "Morphology Quiz 2: Verb Parsing" -> "Morphology Quiz: Verb Parsing". Anchored to
    // the quiz word so passage titles keep their chapter: stripping any "<digits>:" would
    // collapse "Mark 1:9-15" and "Mark 2:9-15" into one bogus series.
    .replace(/\b(Quiz|Test|Exam|Part)\s+\d+\s*:/i, '$1:')
    .trim()
}

/**
 * Group into series. Anything appearing only once is not a series and is left out —
 * those are edited singly as before.
 */
export function groupIntoSeries<T extends {
  id: string; title: string; type: string; weekNumber: number
  dueDate: string | Date; isPublished: boolean; questionCount: number
  vocabReviewPct?: number | null; maxRetakes?: number | null
  timePerQuestion?: number | null; allowLate?: boolean; lateDaysLimit?: number | null
}>(assignments: T[]): AssignmentSeries[] {
  const buckets = new Map<string, AssignmentSeries>()
  for (const a of assignments) {
    const stem = seriesStem(a.title)
    const key = `${a.type}::${stem}`
    const entry = buckets.get(key) ?? { key, type: a.type, stem, members: [] }
    entry.members.push({
      id: a.id,
      title: a.title,
      weekNumber: a.weekNumber,
      dueDate: new Date(a.dueDate).toISOString(),
      isPublished: a.isPublished,
      questionCount: a.questionCount,
      vocabReviewPct: a.vocabReviewPct ?? null,
      maxRetakes: a.maxRetakes ?? null,
      timePerQuestion: a.timePerQuestion ?? null,
      allowLate: a.allowLate ?? false,
      lateDaysLimit: a.lateDaysLimit ?? null,
    })
    buckets.set(key, entry)
  }
  return Array.from(buckets.values())
    .filter(s => s.members.length > 1)
    .map(s => ({
      ...s,
      members: s.members.slice().sort((a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    }))
    .sort((a, b) =>
      new Date(a.members[0].dueDate).getTime() - new Date(b.members[0].dueDate).getTime())
}

/**
 * The value a setting has across the whole series, or null when the occurrences disagree
 * — so the editor can highlight the chosen option, or say the run is mixed.
 */
export function sharedValue<V>(members: SeriesMember[], pick: (m: SeriesMember) => V): V | null {
  if (members.length === 0) return null
  const first = pick(members[0])
  return members.every(m => pick(m) === first) ? first : null
}

/** Occurrences dated after the course's last day — created but never sat. */
export function membersPastCourseEnd(
  members: SeriesMember[],
  courseEnd: string | Date,
): SeriesMember[] {
  const end = new Date(courseEnd).getTime() + 24 * 60 * 60 * 1000
  return members.filter(m => new Date(m.dueDate).getTime() >= end)
}
