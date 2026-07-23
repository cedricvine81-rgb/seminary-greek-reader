/**
 * Which course each BGVB frequency section belongs to.
 *
 * The sections are NT-frequency bands (verified against the tagged corpus in
 * public/data/gnt): §1 100+, §2 50–99, §3 30–49, §4 22–30, §5 18–21, §6 13–17,
 * §7 10–12. Beginning Greek covers words occurring 50+ times (§1–2) and
 * Intermediate Greek the 30–49 band (§3); the rest sit past both courses.
 *
 * Colour + label live here so the study page and the instructor's quiz builder
 * band their section lists identically. Greek only — the Hebrew deck reuses the
 * same components but its sections mean something else.
 */
export type CourseBand = 'BEGINNING' | 'INTERMEDIATE' | 'BEYOND'

export interface BandStyle {
  band: CourseBand
  name: string     // 'Beginning Greek'
  short: string    // 'Beginning'
  freq: string     // '50+ times'
  chip: string     // pill classes
  edge: string     // left-edge accent classes
}

const BEGINNING: BandStyle = {
  band: 'BEGINNING',
  name: 'Beginning Greek',
  short: 'Beginning',
  freq: '50+ times',
  chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  edge: 'border-l-4 border-l-emerald-400',
}

const INTERMEDIATE: BandStyle = {
  band: 'INTERMEDIATE',
  name: 'Intermediate Greek',
  short: 'Intermediate',
  freq: '30–49 times',
  chip: 'bg-sky-50 text-sky-800 border-sky-200',
  edge: 'border-l-4 border-l-sky-400',
}

const BEYOND: BandStyle = {
  band: 'BEYOND',
  name: 'Beyond Intermediate',
  short: 'Beyond',
  freq: 'under 30 times',
  chip: 'bg-gray-100 text-gray-600 border-gray-200',
  edge: 'border-l-4 border-l-gray-300',
}

/** The course band a BGVB section belongs to. */
export function bandForSection(section: number): BandStyle {
  if (section <= 2) return BEGINNING
  if (section === 3) return INTERMEDIATE
  return BEYOND
}

/** Legend order: the three bands, once each. */
export const BAND_LEGEND: BandStyle[] = [BEGINNING, INTERMEDIATE, BEYOND]
