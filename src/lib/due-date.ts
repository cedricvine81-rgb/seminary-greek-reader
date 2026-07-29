// A bare calendar due date (YYYY-MM-DD) means "due that day". Stored naively it
// becomes UTC midnight, which in western timezones closes the assignment the
// *previous* evening. Convert it to the END of that day in the setter's (browser)
// local timezone, so it closes when the instructor expects. Runs client-side.
export function toEndOfDayLocalISO(dateLike: string): string {
  const day = dateLike.slice(0, 10) // tolerate either "YYYY-MM-DD" or a full ISO
  const d = new Date(`${day}T23:59:59`) // parsed in the local timezone
  return isNaN(d.getTime()) ? dateLike : d.toISOString()
}

// The end-of-day time, as a datetime input would render it. Used to tell "no time was
// chosen" apart from "a time was chosen that happens to be late evening".
const END_OF_DAY = '23:59'

// Combine a due date with an OPTIONAL time of day, both as the browser reports them, into
// the ISO instant to store. An empty time means end of day — so leaving the field alone
// reproduces the old behaviour exactly, and only an explicitly entered time changes it.
// Like toEndOfDayLocalISO this resolves against the setter's local timezone, which is what
// an instructor typing "1:00 PM" means.
export function toDueISO(date: string, time?: string | null): string {
  const day = date.slice(0, 10)
  if (!time) return toEndOfDayLocalISO(day)
  const d = new Date(`${day}T${time}:00`) // parsed in the local timezone
  return isNaN(d.getTime()) ? toEndOfDayLocalISO(day) : d.toISOString()
}

// Split a stored instant back into the date + time an editor should show, in local time.
// A deadline sitting exactly on end-of-day came from a date-only entry, so its time comes
// back blank and the field stays empty rather than displaying a 23:59 the instructor never
// typed. Round-trips with toDueISO.
export function fromDueISO(iso: string | Date): { date: string; time: string } {
  const d = iso instanceof Date ? iso : new Date(iso)
  if (isNaN(d.getTime())) return { date: '', time: '' }
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()
  const time = local.slice(11, 16)
  return { date: local.slice(0, 10), time: time === END_OF_DAY ? '' : time }
}
