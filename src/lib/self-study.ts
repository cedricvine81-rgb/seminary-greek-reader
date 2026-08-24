// Self-study tracks: the four instructor-free pathways offered on the student dashboard
// (self-study feedback: everything was funnelled through courses). Each track is an
// ordered list of lessons; each lesson a couple of steps (read a grammar chapter, study
// a vocabulary set). Progress rides on the SAME store as the Grammar page's course mode
// (MorphologyProgress + /api/morphology/progress + localStorage fallback) — step keys are
// just namespaced ids, and the Greek Beginning grammar steps deliberately SHARE the
// course-mode chapter ids, so a chapter marked complete in either place ticks in both.
//
// Auto-graded practice steps (quizzes from the instructor pool generators, self-checked
// exercises) are phase 3 — they append further steps to these same lessons.

// NO imports from the vocab world here: vocab-lesson-map pulls vocab-subsections, which
// pulls the whole BGVB deck JSON — and this registry rides in the dashboard bundle. The
// BGVB lesson facts we need are fully derivable: lesson n (1–16) covers the 20 consecutive
// frequency ranks 20n-19..20n, printed as Section I A–H (lessons 1–8) then II A–H (9–16),
// stored under the subsection key "1-A"…"2-H" (see src/lib/vocab-lesson-map.ts).
const BGVB_LESSON_COUNT = 16
function bgvbSection(lesson: number): { name: string; key: string } {
  const roman = lesson <= 8 ? 'I' : 'II'
  const num = lesson <= 8 ? 1 : 2
  const letter = String.fromCharCode(65 + ((lesson - 1) % 8))
  return { name: `Section ${roman}-${letter}`, key: `${num}-${letter}` }
}

export type SelfStudyTrackId = 'greek-beginning' | 'greek-intermediate' | 'hebrew-beginning' | 'hebrew-intermediate'

export interface SelfStudyStep {
  /** Progress item key (MorphologyProgress.chapterId — [a-z0-9-], ≤40 chars). */
  key: string
  kind: 'grammar' | 'vocab' | 'quiz'
  /** i18n key for chapter names; `label` for composed vocabulary labels. */
  labelKey?: string
  label?: string
  href: string
  /** Quiz steps only: which deck words the practice quiz draws from. The quiz page
   *  resolves this — the registry stays free of deck-data imports. A quiz step is
   *  completed by PASSING the quiz (≥80%), never by the manual toggle. */
  quiz?: { deck: 'greek' | 'hebrew'; selection: string }
}

export interface SelfStudyLesson { steps: SelfStudyStep[] }

export interface SelfStudyTrackDef {
  id: SelfStudyTrackId
  /** Track name — the course-level catalogue keys ("Beginning Greek" …). */
  levelKey: string
  descKey: string
  hebrew: boolean
  lessons: SelfStudyLesson[]
}

// Chapter sequences. These MIRROR the tab orders in MorphologyView (MAIN_TABS minus
// essentials) and HebrewGrammarView (HEBREW_TABS) — kept as plain lists here so the
// dashboard doesn't import the entire chapter content tree. If a chapter is added or
// reordered there, update here too (the /grammar sidebar numbering is the reference).
const GREEK_CHAPTERS: { id: string; labelKey: string }[] = [
  { id: 'pronunciation',   labelKey: 'morph.tab.pronunciation' },
  { id: 'parsing',         labelKey: 'morph.tab.parsing' },
  { id: 'nouns',           labelKey: 'morph.tab.nouns' },
  { id: 'prepositions',    labelKey: 'morph.tab.prepositions' },
  { id: 'pronouns',        labelKey: 'morph.tab.pronouns' },
  { id: 'demonstratives',  labelKey: 'morph.tab.demonstratives' },
  { id: 'relatives',       labelKey: 'morph.tab.relatives' },
  { id: 'indicatives',     labelKey: 'morph.tab.indicatives' },
  { id: 'contract-verbs',  labelKey: 'morph.tab.contract-verbs' },
  { id: 'deponents',       labelKey: 'morph.tab.deponents' },
  { id: '2nd-aorists',     labelKey: 'morph.tab.2nd-aorists' },
  { id: 'liquids',         labelKey: 'morph.tab.liquids' },
  { id: 'principal-parts', labelKey: 'morph.tab.principal-parts' },
  { id: 'participles',     labelKey: 'morph.tab.participles' },
  { id: 'subjunctives',    labelKey: 'morph.tab.subjunctives' },
  { id: 'imperatives',     labelKey: 'morph.tab.imperatives' },
  { id: 'infinitives',     labelKey: 'morph.tab.infinitives' },
  { id: 'mi-verbs',        labelKey: 'morph.tab.mi-verbs' },
  { id: 'conjunctions',    labelKey: 'morph.tab.conjunctions' },
  { id: 'conj-adv',        labelKey: 'morph.tab.conj-adv' },
]

const HEBREW_CHAPTERS: { id: string; labelKey: string }[] = [
  { id: 'alphabet',        labelKey: 'morph.hb.tab.alphabet' },
  { id: 'vowels',          labelKey: 'morph.hb.tab.vowels' },
  { id: 'article',         labelKey: 'morph.hb.tab.article' },
  { id: 'prepositions',    labelKey: 'morph.hb.tab.prepositions' },
  { id: 'nouns',           labelKey: 'morph.hb.tab.nouns' },
  { id: 'construct',       labelKey: 'morph.hb.tab.construct' },
  { id: 'adjectives',      labelKey: 'morph.hb.tab.adjectives' },
  { id: 'pronouns',        labelKey: 'morph.hb.tab.pronouns' },
  { id: 'suffixes',        labelKey: 'morph.hb.tab.suffixes' },
  { id: 'numbers',         labelKey: 'morph.hb.tab.numbers' },
  { id: 'verb-system',     labelKey: 'morph.hb.tab.verb-system' },
  { id: 'qal-perfect',     labelKey: 'morph.hb.tab.qal-perfect' },
  { id: 'qal-imperfect',   labelKey: 'morph.hb.tab.qal-imperfect' },
  { id: 'waw-consecutive', labelKey: 'morph.hb.tab.waw-consecutive' },
  { id: 'volitives',       labelKey: 'morph.hb.tab.volitives' },
  { id: 'infinitives',     labelKey: 'morph.hb.tab.infinitives' },
  { id: 'participles',     labelKey: 'morph.hb.tab.participles' },
  { id: 'niphal',          labelKey: 'morph.hb.tab.niphal' },
  { id: 'piel-pual',       labelKey: 'morph.hb.tab.piel-pual' },
  { id: 'hiphil-hophal',   labelKey: 'morph.hb.tab.hiphil-hophal' },
  { id: 'hithpael',        labelKey: 'morph.hb.tab.hithpael' },
  { id: 'weak-verbs',      labelKey: 'morph.hb.tab.weak-verbs' },
  { id: 'syntax',          labelKey: 'morph.hb.tab.syntax' },
]

// Glanz vocabulary bands (Hebrew) in study order — see scripts/build-glanz-bands.py.
const GLANZ_BANDS = ['1A', '1B', '1C', '1D', '1E', '1F', '1G', '1H', '1I', '1J', '1K', '1L']

function greekBeginning(): SelfStudyLesson[] {
  return GREEK_CHAPTERS.map((c, i) => {
    const steps: SelfStudyStep[] = [
      // SHARED key with the Grammar page's course mode — ticks in both places.
      { key: c.id, kind: 'grammar', labelKey: c.labelKey, href: `/grammar?chapter=${c.id}&level=beginning&track=greek` },
    ]
    const lesson = i + 1
    if (lesson <= BGVB_LESSON_COUNT) {
      const sec = bgvbSection(lesson)
      steps.push({
        key: `ssv-gk-${lesson}`,
        kind: 'vocab',
        label: `BGVB ${lesson} · ${sec.name} (${lesson * 20 - 19}–${lesson * 20})`,
        href: '/vocab?track=greek',
      })
      steps.push({
        key: `ssq-gb-${lesson}`,
        kind: 'quiz',
        labelKey: 'ss.vocabQuiz',
        href: `/student/self-study/greek-beginning/quiz/${lesson}`,
        quiz: { deck: 'greek', selection: sec.key },
      })
    }
    return { steps }
  })
}

function greekIntermediate(): SelfStudyLesson[] {
  return GREEK_CHAPTERS.map(c => ({
    steps: [
      { key: `int-${c.id}`, kind: 'grammar', labelKey: c.labelKey, href: `/grammar?chapter=${c.id}&level=intermediate&track=greek` },
    ],
  }))
}

function hebrew(chapters: { id: string; labelKey: string }[], withBands: boolean): SelfStudyLesson[] {
  return chapters.map((c, i) => {
    const steps: SelfStudyStep[] = [
      { key: `hb-${c.id}`, kind: 'grammar', labelKey: c.labelKey, href: `/grammar?chapter=${c.id}&track=hebrew` },
    ]
    const band = withBands ? GLANZ_BANDS[i] : undefined
    if (band) {
      steps.push({
        key: `ssv-hb-${band.toLowerCase()}`,
        kind: 'vocab',
        label: `Glanz ${band}`,
        href: '/vocab?track=hebrew',
      })
      steps.push({
        key: `ssq-hb-${band.toLowerCase()}`,
        kind: 'quiz',
        labelKey: 'ss.vocabQuiz',
        href: `/student/self-study/hebrew-beginning/quiz/${i + 1}`,
        quiz: { deck: 'hebrew', selection: band },
      })
    }
    return { steps }
  })
}

export const SELF_STUDY_TRACKS: SelfStudyTrackDef[] = [
  { id: 'greek-beginning',     levelKey: 'course.level.BEGINNING',           descKey: 'ss.desc.greek-beginning',     hebrew: false, lessons: greekBeginning() },
  { id: 'greek-intermediate',  levelKey: 'course.level.INTERMEDIATE',        descKey: 'ss.desc.greek-intermediate',  hebrew: false, lessons: greekIntermediate() },
  // First year splits at the derived stems: chapters 1–17 (script → participles), then
  // 18–23 (Niphal → syntax) as the intermediate half.
  { id: 'hebrew-beginning',    levelKey: 'course.level.HEBREW_BEGINNING',    descKey: 'ss.desc.hebrew-beginning',    hebrew: true,  lessons: hebrew(HEBREW_CHAPTERS.slice(0, 17), true) },
  { id: 'hebrew-intermediate', levelKey: 'course.level.HEBREW_INTERMEDIATE', descKey: 'ss.desc.hebrew-intermediate', hebrew: true,  lessons: hebrew(HEBREW_CHAPTERS.slice(17), false) },
]

export function selfStudyTrack(id: string): SelfStudyTrackDef | null {
  return SELF_STUDY_TRACKS.find(x => x.id === id) ?? null
}

/** The quiz step of a track's lesson (1-indexed), if it has one. */
export function quizStepFor(def: SelfStudyTrackDef, lessonNo: number): SelfStudyStep | null {
  const lesson = def.lessons[lessonNo - 1]
  return lesson?.steps.find(st => st.kind === 'quiz') ?? null
}

/** Steps done / total for a track, given the user's completed-item set. */
export function trackProgress(def: SelfStudyTrackDef, completed: Set<string>): { done: number; total: number } {
  let done = 0, total = 0
  for (const l of def.lessons) for (const s of l.steps) { total++; if (completed.has(s.key)) done++ }
  return { done, total }
}
