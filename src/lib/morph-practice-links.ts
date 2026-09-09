// The reverse of morph-grammar-links: given a GRAMMAR CHAPTER, which parsing drill practises
// what it teaches? This is "follow my lesson" — a student who has just read the subjunctives
// chapter can drill subjunctive forms without hunting for the right quiz.
//
// Nothing new is invented here either. self-study.ts already pairs each lesson with its
// grammar chapter (in the step's href) and self-study-morph.ts already says what that lesson's
// quiz drills; this walks that pairing backwards. Deriving it from the track rather than from
// a chapter-index arithmetic is what makes `basic-verbs` come out right: it is not a lesson of
// its own but a second grammar step INSIDE the nouns lesson, so index arithmetic would miss it
// (or, worse, be off by one for every chapter after it).
//
// Drills exist for the BEGINNING tracks only. An intermediate reader of the nouns chapter is
// still sent to the beginning drill: the forms are the same, and there is no second pool.
import { selfStudyTrack } from '@/lib/self-study'
import { morphQuizFor, type MorphQuizDef } from '@/lib/self-study-morph'
import type { MorphLang } from '@/lib/morph-grammar-links'

const TRACK_FOR: Record<MorphLang, string> = {
  greek: 'greek-beginning',
  hebrew: 'hebrew-beginning',
}

export interface ChapterPractice {
  trackId: string
  /** 1-based lesson number — the ladder's key, and the practice URL's last segment. */
  lesson: number
  def: MorphQuizDef
}

/**
 * The lesson this chapter NAMES, if any.
 *
 * The lesson's last grammar step is the one it is named for, and that is the only chapter the
 * lesson's drill can honestly be offered on. One lesson reads two chapters: `basic-verbs` is a
 * remedial verb chapter read inside the NOUNS lesson, so matching any grammar step would put
 * "Drill what this chapter teaches (Parsing quiz — nouns & adjectives)" at the foot of a
 * chapter about verbs. It says nothing there instead.
 */
function lessonNamedByChapter(trackId: string, chapterId: string): number | null {
  const lessons = selfStudyTrack(trackId)?.lessons ?? []
  for (let i = 0; i < lessons.length; i++) {
    const grammar = lessons[i].steps.filter(s => s.kind === 'grammar')
    const last = grammar[grammar.length - 1]
    if (last && last.href.match(/chapter=([^&]+)/)?.[1] === chapterId) return i + 1
  }
  return null
}

/** The parsing drill for a grammar chapter, or null where the chapter has no forms to drill
 *  (pronunciation, the parsing overview, prepositions, syntax…). */
export function practiceForChapter(lang: MorphLang, chapterId: string): ChapterPractice | null {
  const trackId = TRACK_FOR[lang]
  const lesson = lessonNamedByChapter(trackId, chapterId)
  if (lesson == null) return null
  const def = morphQuizFor(trackId, lesson)
  return def ? { trackId, lesson, def } : null
}

/**
 * Link to that drill, run formatively.
 *
 * `back` is where the student came from, so the practice screen returns them to the chapter
 * they were reading instead of to a self-study track they may not be following. It is a link,
 * never a redirect, and the page still validates it — only same-site paths are honoured.
 */
export function practiceHref(lang: MorphLang, chapterId: string, back?: string): string | null {
  const p = practiceForChapter(lang, chapterId)
  if (!p) return null
  const url = `/student/self-study/${p.trackId}/morph/${p.lesson}?practice=1`
  return back ? `${url}&back=${encodeURIComponent(back)}` : url
}
