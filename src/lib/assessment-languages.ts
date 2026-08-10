/**
 * Languages a course's ASSESSMENT can be set in.
 *
 * Deliberately NOT the same list as the interface locales. A student may read the app in any
 * language we ship; a course may only be ASSESSED in one whose vocabulary catalogue actually
 * exists, because the answer key is generated from it. Adding a locale here before its glosses
 * are translated would generate an English key under a Spanish label — worse than not offering it.
 */
export const ASSESSMENT_LANGUAGES = ['en', 'es'] as const
export type AssessmentLanguage = (typeof ASSESSMENT_LANGUAGES)[number]

/** Label for the course form. Shown in the language's own name, as language pickers should be. */
export const ASSESSMENT_LANGUAGE_LABEL: Record<AssessmentLanguage, string> = {
  en: 'English',
  es: 'Español',
}
