// A bare calendar due date (YYYY-MM-DD) means "due that day". Stored naively it
// becomes UTC midnight, which in western timezones closes the assignment the
// *previous* evening. Convert it to the END of that day in the setter's (browser)
// local timezone, so it closes when the instructor expects. Runs client-side.
export function toEndOfDayLocalISO(dateLike: string): string {
  const day = dateLike.slice(0, 10) // tolerate either "YYYY-MM-DD" or a full ISO
  const d = new Date(`${day}T23:59:59`) // parsed in the local timezone
  return isNaN(d.getTime()) ? dateLike : d.toISOString()
}
