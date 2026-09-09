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

/** Every chapter the track reads, paired with the lesson number that reads it. */
function chapterLessons(trackId: string): [string, number][] {
  const out: [string, number][] = []
  const lessons = selfStudyTrack(trackId)?.lessons ?? []
  lessons.forEach((l, i) => {
    for (const s of l.steps) {
      const c = s.kind === 'grammar' ? s.href.match(/chapter=([^&]+)/)?.[1] : null
      if (c) out.push([c, i + 1])
    }
  })
  return out
}

describe('practiceForChapter', () => {
  it.each([['greek', 'greek-beginning'], ['hebrew', 'hebrew-beginning']] as const)(
    '%s: every chapter resolves to its own lesson’s drill, and only where one exists',
    (lang, trackId) => {
      let withDrill = 0
      for (const [chapter, lesson] of chapterLessons(trackId)) {
        const expected = morphQuizFor(trackId, lesson)
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

  it('sends basic-verbs to the nouns lesson it is read in, not to a lesson of its own', () => {
    const basic = practiceForChapter('greek', 'basic-verbs')
    const nouns = practiceForChapter('greek', 'nouns')
    expect(basic).not.toBeNull()
    expect(basic!.lesson).toBe(nouns!.lesson)
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
