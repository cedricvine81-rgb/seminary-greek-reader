/**
 * Where a course sits relative to today — current, upcoming, or finished.
 *
 * Shared by the instructor dashboard and the student pages so both label and order
 * courses the same way. Start/end dates come from a date input and are stored at UTC
 * midnight, so the end date is treated as INCLUSIVE: a course ending 3 July is still
 * current all day on 3 July.
 */
export type CourseStatus = 'current' | 'upcoming' | 'past'

export interface CourseStatusInfo {
  status: CourseStatus
  label: string   // pill text
  chip: string    // pill classes
  edge: string    // left-edge accent, matching the vocabulary section bands
  /** Sort weight: current first, then upcoming, then past. */
  rank: number
}

const CURRENT: Omit<CourseStatusInfo, 'status'> = {
  label: 'Current',
  chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  edge: 'border-l-4 border-l-emerald-400',
  rank: 0,
}

const UPCOMING: Omit<CourseStatusInfo, 'status'> = {
  label: 'Upcoming',
  chip: 'bg-sky-50 text-sky-800 border-sky-200',
  edge: 'border-l-4 border-l-sky-400',
  rank: 1,
}

const PAST: Omit<CourseStatusInfo, 'status'> = {
  label: 'Past',
  chip: 'bg-gray-100 text-gray-600 border-gray-200',
  edge: 'border-l-4 border-l-gray-300',
  rank: 2,
}

const DAY = 24 * 60 * 60 * 1000

export function courseStatus(
  startDate: Date | string,
  endDate: Date | string,
  now: Date = new Date(),
): CourseStatusInfo {
  const start = new Date(startDate).getTime()
  // Inclusive end: the course runs through the whole of its final day.
  const end = new Date(endDate).getTime() + DAY
  const t = now.getTime()
  if (t < start) return { status: 'upcoming', ...UPCOMING }
  if (t >= end) return { status: 'past', ...PAST }
  return { status: 'current', ...CURRENT }
}

/** "starts in 8 days" / "ends in 3 days" / "ended 3 Jul" — a short timing hint. */
export function courseTiming(
  startDate: Date | string,
  endDate: Date | string,
  now: Date = new Date(),
): string {
  const { status } = courseStatus(startDate, endDate, now)
  const days = (target: Date | string) =>
    Math.round((new Date(target).getTime() - now.getTime()) / DAY)

  if (status === 'upcoming') {
    const d = days(startDate)
    if (d <= 0) return 'starts today'
    if (d === 1) return 'starts tomorrow'
    if (d < 14) return `starts in ${d} days`
    if (d < 60) return `starts in ${Math.round(d / 7)} weeks`
    return `starts in ${Math.round(d / 30)} months`
  }
  if (status === 'current') {
    const d = days(endDate)
    if (d <= 0) return 'ends today'
    if (d === 1) return 'ends tomorrow'
    if (d < 14) return `ends in ${d} days`
    if (d < 60) return `ends in ${Math.round(d / 7)} weeks`
    return 'in progress'
  }
  const d = -days(endDate)
  if (d <= 1) return 'ended yesterday'
  if (d < 14) return `ended ${d} days ago`
  if (d < 60) return `ended ${Math.round(d / 7)} weeks ago`
  if (d < 365) return `ended ${Math.round(d / 30)} months ago`
  return 'ended over a year ago'
}

/**
 * Group courses into current / upcoming / past. Current and upcoming read
 * chronologically (soonest first); past reads most-recent first.
 */
export function groupByStatus<T>(
  items: T[],
  getDates: (item: T) => { startDate: Date | string; endDate: Date | string },
  now: Date = new Date(),
): { status: CourseStatus; label: string; items: T[] }[] {
  const buckets: Record<CourseStatus, T[]> = { current: [], upcoming: [], past: [] }
  for (const item of items) {
    const { startDate, endDate } = getDates(item)
    buckets[courseStatus(startDate, endDate, now).status].push(item)
  }
  const time = (v: Date | string) => new Date(v).getTime()
  buckets.current.sort((a, b) => time(getDates(a).endDate) - time(getDates(b).endDate))
  buckets.upcoming.sort((a, b) => time(getDates(a).startDate) - time(getDates(b).startDate))
  buckets.past.sort((a, b) => time(getDates(b).endDate) - time(getDates(a).endDate))
  return [
    { status: 'current' as const, label: 'Current', items: buckets.current },
    { status: 'upcoming' as const, label: 'Upcoming', items: buckets.upcoming },
    { status: 'past' as const, label: 'Past', items: buckets.past },
  ]
}
