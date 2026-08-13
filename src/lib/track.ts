/**
 * The language TRACK — whether the app presents itself as Seminary Greek or Seminary Hebrew.
 *
 * This is a VIEW PREFERENCE and nothing more. It changes branding and what the shared tools
 * default to; it must never decide what language a piece of content is in.
 *
 * ── The hard boundary ────────────────────────────────────────────────────────
 * `Course.level` is the sole authority for the language of a course, its quizzes and its
 * grading (see isHebrewLevel / COURSE_LEVEL_LANGUAGE in constants.ts). The track must NEVER
 * be consulted when generating or marking a question. A Hebrew course set by a instructor
 * whose toggle happens to say "Greek" must still produce Hebrew quizzes — and vice versa.
 * The bug fixed in 4652276f was precisely a level being read from the wrong place; a global
 * view preference that could override it would reintroduce that whole class of failure.
 *
 * Likewise the track must never filter the dashboard. A student taking both languages would
 * have half their deadlines hidden behind a switch they set weeks ago. It changes what the
 * tools default to, never what you owe.
 *
 * ── Why a cookie ─────────────────────────────────────────────────────────────
 * Same reason as the display theme and the interface locale: the server layout reads it and
 * renders the right brand on the first paint, so there is no flash of the wrong name and no
 * hydration mismatch. See src/lib/theme.ts, which this mirrors.
 *
 * ── seminaryhebrew.app ───────────────────────────────────────────────────────
 * That domain temporarily redirects to `/?track=hebrew`; middleware turns the parameter into
 * this cookie and strips it from the URL. The domain therefore sets the default and the
 * toggle sets the preference, with one mechanism serving both. If the Hebrew domain is later
 * served directly, middleware seeds the same cookie from the hostname instead — the rest of
 * the app does not change.
 */

export type Track = 'greek' | 'hebrew'

/** Shared with middleware and the layout. */
export const TRACK_COOKIE = 'language-track'

/** No cookie yet → Greek, which is what the canonical domain has always been. */
export const DEFAULT_TRACK: Track = 'greek'

export function isTrack(v: unknown): v is Track {
  return v === 'greek' || v === 'hebrew'
}

export interface Brand {
  /** Product name in the header, page title and dashboard hero. */
  name: string
  /** Two characters for the header mark: Greek sigma-gamma, Hebrew ayin-bet (עברית). */
  monogram: string
  /** Whether the monogram needs the Hebrew font. */
  monogramClass: string
  /** <meta name="description">, and the landing sub-heading. */
  description: string
}

export const BRANDS: Record<Track, Brand> = {
  greek: {
    name: 'Seminary Greek',
    monogram: 'ΣΓ',
    monogramClass: 'font-serif',
    description:
      'Read the Septuagint and Greek New Testament, study vocabulary, practice morphology, and complete instructor-created assignments.',
  },
  hebrew: {
    name: 'Seminary Hebrew',
    monogram: 'עב',
    monogramClass: 'font-hebrew',
    description:
      'Read the Hebrew Bible, study vocabulary, practice parsing, and complete instructor-created assignments.',
  },
}

export const brandFor = (track: Track): Brand => BRANDS[track] ?? BRANDS[DEFAULT_TRACK]
