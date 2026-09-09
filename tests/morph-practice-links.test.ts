/**
 * Chapter -> parsing drill ("follow my lesson").
 *
 * morph-practice-links walks the self-study registries backwards: self-study.ts pairs a lesson
 * with the grammar chapters it reads, self-study-morph.ts says what that lesson's quiz drills.
 * This test re-does the join independently, so reordering a chapter list or renaming a chapter
 * fails here instead of quietly offering students the wrong drill.
 *
 * The case worth naming: `basic-verbs` is NOT a lesson of its own — it is a second grammar step
 * inside the nouns lesson. Chapter-index arithmetic would either miss it or shift every chapter
 * after it by one, which is exactly why the lookup reads the steps rather than counting.
 */
import { practiceForChapter, practiceHref } from '@/lib/morph-practice-links'
import { selfStudyTrack } from '@/lib/self-study'
import { morphQuizFor } from '@/lib/self-study-morph'

/** Every chapter the track reads: [chapter, lesson, is it the chapter the lesson is named
 *  for (its LAST grammar step)]. */
function chapterLessons(trackId: string): [string, number, boolean][] {
  const out: [string, number, boolean][] = []
  const lessons = selfStudyTrack(trackId)?.lessons ?? []
  lessons.forEach((l, i) => {
    const grammar = l.steps.filter(s => s.kind === 'grammar')
    grammar.forEach((s, j) => {
      const c = s.href.match(/chapter=([^&]+)/)?.[1]
      if (c) out.push([c, i + 1, j === grammar.length - 1])
    })
  })
  return out
}

describe('practiceForChapter', () => {
  it.each([['greek', 'greek-beginning'], ['hebrew', 'hebrew-beginning']] as const)(
    '%s: every chapter resolves to its own lesson’s drill, and only where one exists',
    (lang, trackId) => {
      let withDrill = 0
      for (const [chapter, lesson, named] of chapterLessons(trackId)) {
        // Only the chapter a lesson is NAMED for may advertise that lesson's drill.
        const expected = named ? morphQuizFor(trackId, lesson) : null
        const got = practiceForChapter(lang, chapter)
        expect(`${chapter} -> ${got ? got.lesson : 'none'}`)
          .toBe(`${chapter} -> ${expected ? lesson : 'none'}`)
        if (expected) {
          expect(got!.def).toBe(expected)
          expect(got!.trackId).toBe(trackId)
          withDrill++
        }
      }
      expect(withDrill).toBeGreaterThanOrEqual(8)
    })

  it('offers nothing on basic-verbs, which is read inside the NOUNS lesson', () => {
    // The lesson's drill is nouns & adjectives, so offering it at the foot of a verb chapter
    // would advertise "drill what this chapter teaches" and then drill something else. The
    // chapter the lesson is NAMED for still gets it.
    expect(practiceForChapter('greek', 'basic-verbs')).toBeNull()
    expect(practiceForChapter('greek', 'nouns')).not.toBeNull()
  })

  it('has nothing to offer for a chapter with no form pool', () => {
    // Pronunciation teaches no paradigm; syntax is a Hebrew capstone chapter.
    expect(practiceForChapter('greek', 'pronunciation')).toBeNull()
    expect(practiceForChapter('hebrew', 'syntax')).toBeNull()
    expect(practiceForChapter('greek', 'not-a-chapter')).toBeNull()
  })

  it('builds a formative link that carries the way back', () => {
    const href = practiceHref('greek', 'subjunctives', '/grammar?chapter=subjunctives&level=beginning&track=greek')
    expect(href).toContain('/student/self-study/greek-beginning/morph/')
    expect(href).toContain('practice=1')
    expect(href).toContain(`back=${encodeURIComponent('/grammar?chapter=subjunctives&level=beginning&track=greek')}`)
    // Without a back link it is still a valid drill link.
    expect(practiceHref('greek', 'subjunctives')).not.toContain('back=')
    expect(practiceHref('greek', 'pronunciation')).toBeNull()
  })
})
