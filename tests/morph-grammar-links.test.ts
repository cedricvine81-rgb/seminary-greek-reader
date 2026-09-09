// The (field, value) -> grammar chapter map in morph-grammar-links.ts is mostly a JOIN of two
// registries: self-study-morph says what lesson N drills, self-study says which grammar chapter
// lesson N reads. This test re-does that join and asserts the map still agrees, so reordering
// GREEK_CHAPTERS / HEBREW_CHAPTERS fails here instead of quietly sending a student who missed
// the subjunctive to the chapter on imperatives.
//
// Two things the join has to respect, both learned from the data:
//   • Compare against the chapter in the step's HREF, not its key. The Hebrew progress keys are
//     `hb-<id>` while the links use the bare `<id>`; comparing keys would demand the wrong value.
//   • Only a value taught in exactly ONE lesson pins a chapter. mood=Indicative appears in five
//     (indicatives, contract-verbs, deponents, 2nd-aorists, principal-parts), so it says nothing
//     about where "the indicative" is taught, and is marked derived:false in the map.
import { GREEK_MORPH_QUIZZES, HEBREW_MORPH_QUIZZES } from '@/lib/self-study-morph'
import { selfStudyTrack } from '@/lib/self-study'
import { grammarTargetFor, grammarHref } from '@/lib/morph-grammar-links'

/** The chapter a self-study lesson links to (from the href of its LAST grammar step: the
 *  nouns lesson carries basic-verbs first and is named for the second one). */
function chapterOfLesson(trackId: string, lesson: number): string | null {
  const l = selfStudyTrack(trackId)?.lessons[lesson - 1]
  const grammar = (l?.steps ?? []).filter(s => s.kind === 'grammar')
  const href = grammar.length ? grammar[grammar.length - 1].href : null
  return href?.match(/chapter=([^&]+)/)?.[1] ?? null
}

/** value -> the chapters that drill it; only a value with exactly one chapter is diagnostic. */
function pinned(
  quizzes: Record<string, { parseFilter?: Record<string, string[] | undefined> }>,
  trackId: string,
  filterKey: string,
): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>()
  for (const [lessonStr, def] of Object.entries(quizzes)) {
    const chapter = chapterOfLesson(trackId, Number(lessonStr))
    if (!chapter) continue
    for (const v of def.parseFilter?.[filterKey] ?? []) {
      if (!out.has(v)) out.set(v, new Set())
      out.get(v)!.add(chapter)
    }
  }
  return out
}

describe('morph-grammar-links agrees with the self-study ladders', () => {
  it('Greek: every uniquely-taught value resolves to its lesson chapter', () => {
    let checked = 0
    for (const [field, key] of [['mood', 'moods'], ['tense', 'tenses'],
      ['voice', 'voices'], ['pronounType', 'pronounTypes']] as const) {
      for (const [value, chapters] of Array.from(pinned(GREEK_MORPH_QUIZZES as never, 'greek-beginning', key).entries())) {
        if (chapters.size !== 1) continue           // taught in several places: not diagnostic
        const target = grammarTargetFor('greek', field, value)
        expect(target).not.toBeNull()
        if (!target!.derived) continue              // deliberately a default, not a claim
        expect(`${field}=${value} -> ${target!.chapter}`)
          .toBe(`${field}=${value} -> ${Array.from(chapters)[0]}`)
        checked++
      }
    }
    expect(checked).toBeGreaterThanOrEqual(6)
  })

  it('Hebrew: every uniquely-taught conjugation resolves to its lesson chapter', () => {
    let checked = 0
    for (const [value, chapters] of Array.from(pinned(HEBREW_MORPH_QUIZZES as never, 'hebrew-beginning', 'conjugations').entries())) {
      if (chapters.size !== 1) continue
      const target = grammarTargetFor('hebrew', 'conjugation', value)
      expect(target).not.toBeNull()
      if (!target!.derived) continue
      expect(`${value} -> ${target!.chapter}`).toBe(`${value} -> ${Array.from(chapters)[0]}`)
      checked++
    }
    expect(checked).toBeGreaterThanOrEqual(6)
  })

  it('every chapter the map can return is a real chapter the app links to', () => {
    const real = new Set<string>()
    for (const track of ['greek-beginning', 'hebrew-beginning', 'greek-intermediate', 'hebrew-intermediate']) {
      for (const l of selfStudyTrack(track)?.lessons ?? []) {
        for (const s of l.steps) {
          const c = s.kind === 'grammar' ? s.href.match(/chapter=([^&]+)/)?.[1] : null
          if (c) real.add(c)
        }
      }
    }
    const probes: [Parameters<typeof grammarTargetFor>[0], string, string][] = [
      ['greek', 'mood', 'Subjunctive'], ['greek', 'mood', 'Indicative'],
      ['greek', 'tense', 'Perfect'], ['greek', 'tense', 'Aorist'],
      ['greek', 'voice', 'Active'], ['greek', 'voice', 'Deponent'],
      ['greek', 'casus', 'Genitive'], ['greek', 'person', '3rd'],
      ['greek', 'pronounType', 'Reflexive'],
      ['hebrew', 'stem', 'Hithpael'], ['hebrew', 'stem', 'Piel'],
      ['hebrew', 'conjugation', 'Imperative'], ['hebrew', 'state', 'Construct'],
      ['hebrew', 'gender', 'Feminine'],
    ]
    for (const [lang, field, value] of probes) {
      const t = grammarTargetFor(lang, field, value)
      expect(`${lang} ${field}=${value}`).toBe(t ? `${lang} ${field}=${value}` : 'UNMAPPED')
      expect(`${t!.chapter} in chapter list`).toBe(real.has(t!.chapter) ? `${t!.chapter} in chapter list` : `${t!.chapter} MISSING`)
    }
  })

  it('resolves shared fields by verbal vs nominal context', () => {
    // "Plural" means a finite ending on a verb and a declension on a noun; the field name
    // alone cannot say which chapter teaches it. This was wrong in the first live run —
    // a subjunctive quiz sent students to the nouns chapter for number.
    const verb = { mood: 'Subjunctive', tense: 'Aorist', number: 'Plural' }
    const noun = { casus: 'Genitive', gender: 'Feminine', number: 'Plural' }
    expect(grammarTargetFor('greek', 'number', 'Plural', verb)!.chapter).toBe('indicatives')
    expect(grammarTargetFor('greek', 'number', 'Plural', noun)!.chapter).toBe('nouns')
    // Gender only appears on participles among Greek verb forms.
    expect(grammarTargetFor('greek', 'gender', 'Feminine', { mood: 'Participle' })!.chapter)
      .toBe('participles')
    expect(grammarTargetFor('greek', 'gender', 'Feminine', noun)!.chapter).toBe('nouns')
    // No context: fall back to the nominal chapter rather than guessing.
    expect(grammarTargetFor('greek', 'number', 'Plural')!.chapter).toBe('nouns')
    // Hebrew verbs are identified by stem/conjugation rather than mood/tense.
    expect(grammarTargetFor('hebrew', 'number', 'Plural', { stem: 'Qal', conjugation: 'Perfect' })!.chapter)
      .toBe('qal-perfect')
    // A value with its own entry always wins over any context rule.
    expect(grammarTargetFor('greek', 'mood', 'Subjunctive', noun)!.chapter).toBe('subjunctives')
  })

  it('builds links in the form each language actually uses', () => {
    expect(grammarHref('greek', 'mood', 'Subjunctive'))
      .toBe('/grammar?chapter=subjunctives&level=beginning&track=greek')
    expect(grammarHref('hebrew', 'conjugation', 'Imperative'))
      .toBe('/grammar?chapter=volitives&track=hebrew')
    expect(grammarHref('greek', 'mood', 'Nonsense')).toBeNull()
  })
})
